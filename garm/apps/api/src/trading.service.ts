/**
 * Trading orchestration: quote → reserve → execute → post.
 *
 * This is the one place the pieces meet. `@garm/financial` computes,
 * `@garm/domain` decides, `@garm/ledger` records, and this service sequences
 * them inside a single transaction.
 *
 * It holds no arithmetic and no policy of its own — every number comes from the
 * financial package and every yes/no from the domain package. That keeps the
 * hard parts in modules that are exhaustively tested in isolation, and leaves
 * this file doing only what it is uniquely able to do: order the steps and
 * commit them atomically.
 */

import {
  applySpread,
  basisPoints,
  microgram,
  priceBuyByRial,
  priceSellByWeight,
  rial,
  rialPerGram,
  type BasisPoints,
  type RialPerGram,
} from '@garm/financial';
import {
  assessFeed,
  DEFAULT_QUOTE_POLICY,
  evaluateExecution,
  mayIssueQuotes,
  permits,
  releasableReservations,
  transitionTrade,
  type ExecutionRefusal,
  type Quote,
  type QuotePolicy,
  type SourceTick,
  type TradeSide,
} from '@garm/domain';
import {
  accountKey,
  customerAccount,
  platformAccount,
  postBuy,
  postSell,
  type AssetCode,
} from '@garm/ledger';

import type {
  Clock,
  Database,
  IdGenerator,
  OperationalFlags,
  TradeRecord,
} from './ports.js';

export interface AssetConfig {
  readonly code: AssetCode;
  readonly feeBps: BasisPoints;
  readonly spreadBps: BasisPoints;
  readonly minTradeRial: bigint;
  readonly maxTradeRial: bigint;
  /** Withheld from sale so ordinary demand swings do not push the platform short. */
  readonly safetyBufferUg: bigint;
}

export interface PriceSource {
  latestTicks(assetCode: AssetCode): Promise<readonly SourceTick[]>;
}

export type QuoteRefusal =
  | 'FEED_UNAVAILABLE'
  | 'TRADING_DISABLED'
  | 'KYC_NOT_VERIFIED'
  | 'BELOW_MINIMUM'
  | 'ABOVE_MAXIMUM'
  | 'INSUFFICIENT_CAPACITY'
  | 'UNKNOWN_USER';

export type QuoteResult =
  | { readonly ok: true; readonly quote: Quote }
  | { readonly ok: false; readonly reason: QuoteRefusal };

export type ExecuteResult =
  | { readonly ok: true; readonly trade: TradeRecord; readonly replayed: boolean }
  | { readonly ok: false; readonly reason: ExecutionRefusal | 'UNKNOWN_QUOTE' | 'CONFLICT' | 'IN_FLIGHT' };

export class TradingService {
  constructor(
    private readonly db: Database,
    private readonly flags: OperationalFlags,
    private readonly prices: PriceSource,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly assets: ReadonlyMap<AssetCode, AssetConfig>,
    private readonly quotePolicy: QuotePolicy = DEFAULT_QUOTE_POLICY,
  ) {}

  /**
   * Issue an executable quote.
   *
   * A buy soft-reserves treasury capacity here, before the customer pays.
   * Reserving after payment would create a state where the money is taken and
   * the metal cannot be delivered (SPEC §27, §29).
   */
  async issueQuote(input: {
    userId: string;
    assetCode: AssetCode;
    side: TradeSide;
    amountRial?: bigint;
    weightUg?: bigint;
  }): Promise<QuoteResult> {
    const config = this.assets.get(input.assetCode);
    if (!config) {
      return { ok: false, reason: 'TRADING_DISABLED' };
    }

    const now = this.clock.now();
    const assessment = assessFeed(await this.prices.latestTicks(input.assetCode), now);
    if (!mayIssueQuotes(assessment) || assessment.referencePrice === null) {
      return { ok: false, reason: 'FEED_UNAVAILABLE' };
    }

    const tradingEnabled = await this.flags.isEnabled('TRADING_ENABLED');
    const sideEnabled = await this.flags.isEnabled(
      input.side === 'BUY' ? 'BUY_ENABLED' : 'SELL_ENABLED',
    );
    if (!tradingEnabled || !sideEnabled) {
      return { ok: false, reason: 'TRADING_DISABLED' };
    }

    const reference = rialPerGram(assessment.referencePrice);

    return this.db.withTransaction(async (uow) => {
      const user = await uow.users.findById(input.userId);
      if (!user) {
        return { ok: false, reason: 'UNKNOWN_USER' as const };
      }
      if (!permits(user.kycStatus, 'TRADE')) {
        return { ok: false, reason: 'KYC_NOT_VERIFIED' as const };
      }

      const priced =
        input.side === 'BUY'
          ? priceBuyByRial({
              referencePrice: reference,
              spreadBps: config.spreadBps,
              feeBps: config.feeBps,
              grossRial: rial(input.amountRial ?? 0n),
            })
          : priceSellByWeight({
              referencePrice: reference,
              spreadBps: config.spreadBps,
              feeBps: config.feeBps,
              weightUg: microgram(input.weightUg ?? 0n),
            });

      if (priced.grossRial < config.minTradeRial) {
        return { ok: false, reason: 'BELOW_MINIMUM' as const };
      }
      if (priced.grossRial > config.maxTradeRial) {
        return { ok: false, reason: 'ABOVE_MAXIMUM' as const };
      }

      let reservationId: string | null = null;
      if (input.side === 'BUY') {
        const inventory = await uow.ledger.balance(
          accountKey(platformAccount(input.assetCode, 'INVENTORY')),
          input.assetCode,
        );
        const openReservations = await uow.reservations.openWeightFor(input.assetCode);
        const available = inventory - openReservations - config.safetyBufferUg;
        if (available < priced.weightUg) {
          return { ok: false, reason: 'INSUFFICIENT_CAPACITY' as const };
        }
        const reservation = await uow.reservations.reserve({
          assetCode: input.assetCode,
          weightUg: priced.weightUg,
          quoteId: 'pending',
        });
        reservationId = reservation.id;
      }

      const quote: Quote = {
        id: this.ids.next(),
        userId: input.userId,
        assetCode: input.assetCode,
        side: input.side,
        referencePriceRial: priced.referencePrice,
        executionPriceRial: priced.executionPrice,
        grossRial: priced.grossRial,
        feeRial: priced.feeRial,
        netRial: priced.netRial,
        weightUg: priced.weightUg,
        inventoryReservationId: reservationId,
        status: 'ACTIVE',
        createdAt: now,
        expiresAt: new Date(now.getTime() + this.quotePolicy.lifetimeSeconds * 1000),
        consumedAt: null,
      };

      await uow.quotes.create(quote);
      return { ok: true as const, quote };
    });
  }

  /**
   * Execute a quote.
   *
   * Everything from the eligibility check to the ledger posting happens in one
   * transaction: a partial trade is not a state this system is allowed to
   * reach (SPEC §37).
   */
  async execute(input: {
    quoteId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<ExecuteResult> {
    const now = this.clock.now();

    return this.db.withTransaction(async (uow) => {
      const claim = await uow.idempotency.claim({
        key: input.idempotencyKey,
        endpoint: 'POST /trades',
        requestHash: `${input.quoteId}:${input.userId}`,
      });
      if (claim.outcome === 'CONFLICT') {
        return { ok: false as const, reason: 'CONFLICT' as const };
      }
      if (claim.outcome === 'IN_FLIGHT') {
        return { ok: false as const, reason: 'IN_FLIGHT' as const };
      }
      if (claim.outcome === 'REPLAY') {
        return { ok: true as const, trade: claim.response as TradeRecord, replayed: true };
      }

      const quote = await uow.quotes.findById(input.quoteId);
      if (!quote) {
        return { ok: false as const, reason: 'UNKNOWN_QUOTE' as const };
      }

      const user = await uow.users.findById(input.userId);
      const config = this.assets.get(quote.assetCode as AssetCode);
      if (!user || !config) {
        return { ok: false as const, reason: 'WRONG_USER' as const };
      }

      const givingUp =
        quote.side === 'BUY'
          ? customerAccount(user.id, 'IRR')
          : customerAccount(user.id, quote.assetCode as AssetCode);
      const availableBalance = await uow.ledger.balance(
        accountKey(givingUp),
        quote.side === 'BUY' ? 'IRR' : (quote.assetCode as AssetCode),
      );

      const decision = evaluateExecution(quote, {
        requestingUserId: input.userId,
        now,
        kycVerified: permits(user.kycStatus, 'TRADE'),
        tradingEnabled: await this.flags.isEnabled('TRADING_ENABLED'),
        sideEnabled: await this.flags.isEnabled(
          quote.side === 'BUY' ? 'BUY_ENABLED' : 'SELL_ENABLED',
        ),
        availableBalance,
        availableToSellUg: 0n,
      });
      if (!decision.allowed) {
        return { ok: false as const, reason: decision.reason };
      }

      // The trade walks its state machine explicitly, so an illegal ordering
      // throws here rather than silently producing an impossible record.
      // A buy waits on an external payment; a sell does not, because the
      // platform is the payer. Both reserve first.
      const path =
        quote.side === 'BUY'
          ? (['QUOTE_LOCKED', 'ASSETS_RESERVED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'TRADE_COMMITTING'] as const)
          : (['QUOTE_LOCKED', 'ASSETS_RESERVED', 'TRADE_COMMITTING'] as const);

      let trade = await uow.trades.create({ userId: user.id, quoteId: quote.id });
      for (const next of path) {
        trade = await uow.trades.advance(trade.id, transitionTrade(trade.state, next));
      }

      const transactionId = this.ids.next();
      const posting = {
        transactionId,
        referenceId: trade.id,
        idempotencyKey: input.idempotencyKey,
      };
      const entry =
        quote.side === 'BUY'
          ? postBuy(posting, {
              userId: user.id,
              asset: quote.assetCode as AssetCode,
              grossRial: quote.grossRial,
              feeRial: quote.feeRial,
              netRial: quote.netRial,
              weightUg: quote.weightUg,
            })
          : postSell(posting, {
              userId: user.id,
              asset: quote.assetCode as AssetCode,
              grossRial: quote.grossRial,
              feeRial: quote.feeRial,
              netRial: quote.netRial,
              weightUg: quote.weightUg,
            });

      await uow.ledger.post(entry);
      await uow.quotes.consume(quote.id, now);
      if (quote.inventoryReservationId) {
        // The reservation is consumed by the trade, not released back to
        // capacity — the metal has left inventory for good.
        await uow.reservations.release(quote.inventoryReservationId, now);
      }
      await uow.trades.attachTransaction(trade.id, transactionId);

      // Past this point the customer owns the metal (SPEC §30). Custody
      // allocation is enqueued rather than awaited, so their ownership does not
      // depend on an external call succeeding.
      trade = await uow.trades.advance(trade.id, transitionTrade(trade.state, 'LEDGER_POSTED'));
      trade = await uow.trades.advance(trade.id, transitionTrade(trade.state, 'CUSTODY_PENDING'));

      await uow.outbox.enqueue({
        aggregate: 'trade',
        eventType: 'TRADE_LEDGER_POSTED',
        payload: { tradeId: trade.id, transactionId },
      });
      await uow.outbox.enqueue({
        aggregate: 'treasury',
        eventType: 'TREASURY_POSITION_CHANGED',
        payload: { assetCode: quote.assetCode, weightUg: quote.weightUg.toString(), side: quote.side },
      });

      await uow.idempotency.complete(input.idempotencyKey, trade);
      return { ok: true as const, trade, replayed: false };
    });
  }

  /**
   * Expire quotes and release the capacity they were holding.
   *
   * Only quotes that expired unused release anything — a consumed quote's metal
   * has already left inventory, and returning it would credit the platform with
   * something it sold.
   */
  async sweepExpiredQuotes(): Promise<number> {
    const now = this.clock.now();
    return this.db.withTransaction(async (uow) => {
      const expired = await uow.quotes.expireOlderThan(now);
      const toRelease = releasableReservations(
        expired.map((quote) => ({ ...quote, status: 'ACTIVE' as const })),
        new Date(now.getTime() + 1),
      );
      for (const reservationId of toRelease) {
        await uow.reservations.release(reservationId, now);
      }
      return toRelease.length;
    });
  }

  /** Indicative price for display. Never executable — that needs a quote. */
  async indicativePrice(
    assetCode: AssetCode,
    side: TradeSide,
  ): Promise<{ price: RialPerGram; status: string } | null> {
    const config = this.assets.get(assetCode);
    if (!config) {
      return null;
    }
    const assessment = assessFeed(await this.prices.latestTicks(assetCode), this.clock.now());
    if (assessment.referencePrice === null) {
      return null;
    }
    return {
      price: applySpread(rialPerGram(assessment.referencePrice), config.spreadBps, side),
      status: assessment.status,
    };
  }
}

/** Launch configuration for gold. Every number is configuration, not code. */
export function goldConfig(): AssetConfig {
  return {
    code: 'GOLD',
    feeBps: basisPoints(50), // 0.5%
    spreadBps: basisPoints(30), // 0.3%
    minTradeRial: 2_000_000n, // 200,000 toman
    maxTradeRial: 10_000_000_000n, // 1,000,000,000 toman
    safetyBufferUg: 0n,
  };
}
