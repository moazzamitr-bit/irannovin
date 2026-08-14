import { beforeEach, describe, expect, it } from 'vitest';

import { accountKey, customerAccount, platformAccount, postProcurement, verifyAll } from '@garm/ledger';
import type { SourceTick } from '@garm/domain';

import { FixedClock, MemoryDatabase, MemoryFlags, SequentialIds } from '../src/memory.js';
import { goldConfig, TradingService, type PriceSource } from '../src/trading.service.js';

/**
 * These exercise the whole trade path against in-memory adapters: quote,
 * reserve, execute, post, and verify the ledger balances afterwards. It is not
 * a substitute for running against Postgres — locking and real concurrency are
 * not modelled — but it does verify the sequencing, the invariants, and the
 * refusal paths without a database in the loop.
 */

const START = new Date('2026-08-13T12:00:00Z');
const REFERENCE = 100_000_000n; // 100M rial/g = 10M toman/g

function ticks(price = REFERENCE, at = START): SourceTick[] {
  return [
    { sourceName: 'a', priceRialPerGram: price, observedAt: at },
    { sourceName: 'b', priceRialPerGram: price, observedAt: at },
  ];
}

describe('TradingService', () => {
  let clock: FixedClock;
  let db: MemoryDatabase;
  let flags: MemoryFlags;
  let feed: SourceTick[];
  let service: TradingService;
  let userId: string;

  const prices: PriceSource = { latestTicks: async () => feed };

  beforeEach(async () => {
    clock = new FixedClock(START);
    db = new MemoryDatabase(new SequentialIds(), clock);
    flags = new MemoryFlags();
    feed = ticks();
    service = new TradingService(
      db,
      flags,
      prices,
      clock,
      new SequentialIds('tx'),
      new Map([['GOLD', goldConfig()]]),
    );

    const user = await db.users().create({ phone: '09120000000' });
    userId = user.id;
    db.setKycStatus(userId, 'VERIFIED');

    // Stock the treasury and fund the customer, so the flow has something to
    // work with. Both go through the ledger — there is no other way in.
    await db.ledger().post(
      postProcurement(
        { transactionId: 'seed-inventory' },
        { asset: 'GOLD', weightUg: 100_000_000n, costRial: 9_800_000_000n },
      ),
    );
    await db.ledger().post({
      transactionId: 'seed-cash',
      entryType: 'DEPOSIT',
      lines: [
        { account: platformAccount('IRR', 'PAYMENT_GATEWAY_CLEARING'), asset: 'IRR', amount: -1_000_000_000n },
        { account: customerAccount(userId, 'IRR'), asset: 'IRR', amount: 1_000_000_000n },
      ],
      referenceId: null,
      correlationId: null,
      idempotencyKey: null,
      reversesTransactionId: null,
      metadata: null,
    } as never);
  });

  it('issues a quote priced above reference on the buy side', async () => {
    const result = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.quote.executionPriceRial).toBeGreaterThan(result.quote.referencePriceRial);
    expect(result.quote.feeRial + result.quote.netRial).toBe(result.quote.grossRial);
    expect(result.quote.inventoryReservationId).not.toBeNull();
    expect(result.quote.expiresAt.getTime()).toBeGreaterThan(START.getTime());
  });

  it('executes a quote and leaves the ledger balanced', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    const executed = await service.execute({
      quoteId: quoted.quote.id,
      userId,
      idempotencyKey: 'key-1',
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;

    expect(executed.trade.state).toBe('CUSTODY_PENDING');
    expect(executed.trade.transactionId).not.toBeNull();

    expect(verifyAll(db.store.entries).ok).toBe(true);
    expect(db.balanceOf(accountKey(customerAccount(userId, 'GOLD')), 'GOLD')).toBe(
      quoted.quote.weightUg,
    );
    expect(db.balanceOf(accountKey(customerAccount(userId, 'IRR')), 'IRR')).toBe(
      1_000_000_000n - quoted.quote.grossRial,
    );
    expect(db.balanceOf(accountKey(platformAccount('IRR', 'FEE_REVENUE')), 'IRR')).toBe(
      quoted.quote.feeRial,
    );
  });

  it('reaches CUSTODY_PENDING, not COMPLETED, because custody is asynchronous', async () => {
    // SPEC §30: the customer owns the metal at LEDGER_POSTED. Waiting on the
    // custodian before saying so would make ownership depend on an external
    // call succeeding.
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');
    const executed = await service.execute({
      quoteId: quoted.quote.id,
      userId,
      idempotencyKey: 'key-2',
    });
    expect(executed.ok && executed.trade.history).toContain('LEDGER_POSTED');
  });

  it('is idempotent — a retry returns the original trade and posts nothing new', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    const first = await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k' });
    const entriesAfterFirst = db.store.entries.length;
    const second = await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k' });

    expect(first.ok && second.ok).toBe(true);
    expect(second.ok && second.replayed).toBe(true);
    expect(db.store.entries.length).toBe(entriesAfterFirst);
  });

  it('rejects the same key with a different body as a conflict, not a replay', async () => {
    const a = await service.issueQuote({ userId, assetCode: 'GOLD', side: 'BUY', amountRial: 100_000_000n });
    const b = await service.issueQuote({ userId, assetCode: 'GOLD', side: 'BUY', amountRial: 50_000_000n });
    if (!a.ok || !b.ok) throw new Error('quote failed');

    await service.execute({ quoteId: a.quote.id, userId, idempotencyKey: 'shared' });
    const conflicting = await service.execute({ quoteId: b.quote.id, userId, idempotencyKey: 'shared' });
    expect(conflicting.ok).toBe(false);
    expect(!conflicting.ok && conflicting.reason).toBe('CONFLICT');
  });

  it('refuses to execute the same quote twice', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k1' });
    const again = await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k2' });
    expect(!again.ok && again.reason).toBe('ALREADY_USED');
  });

  it('refuses an expired quote', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    clock.advance(120);
    const late = await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k' });
    expect(!late.ok && late.reason).toBe('EXPIRED');
  });

  it('refuses another customer executing a quote', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    const other = await db.users().create({ phone: '09120000001' });
    db.setKycStatus(other.id, 'VERIFIED');
    const stolen = await service.execute({
      quoteId: quoted.quote.id,
      userId: other.id,
      idempotencyKey: 'k',
    });
    expect(!stolen.ok && stolen.reason).toBe('WRONG_USER');
  });

  it('refuses to quote for an unverified customer', async () => {
    const pending = await db.users().create({ phone: '09120000002' });
    const result = await service.issueQuote({
      userId: pending.id,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(!result.ok && result.reason).toBe('KYC_NOT_VERIFIED');
  });

  it('stops quoting when the feed halts, and when the kill switch is down', async () => {
    feed = [
      { sourceName: 'a', priceRialPerGram: 100_000_000n, observedAt: START },
      { sourceName: 'b', priceRialPerGram: 120_000_000n, observedAt: START },
    ];
    const halted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(!halted.ok && halted.reason).toBe('FEED_UNAVAILABLE');

    feed = ticks();
    await flags.set('BUY_ENABLED', false);
    const disabled = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(!disabled.ok && disabled.reason).toBe('TRADING_DISABLED');
  });

  it('enforces the minimum trade size', async () => {
    const tiny = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 1_000n,
    });
    expect(!tiny.ok && tiny.reason).toBe('BELOW_MINIMUM');
  });

  it('withholds the safety buffer from sale', async () => {
    // SPEC §51: the buffer is deliberately unsellable, so ordinary swings in
    // demand cannot push the platform short. With 100g in stock and 99.5g
    // withheld, a 1g order must be refused even though the metal exists.
    const guarded = new TradingService(
      db,
      flags,
      prices,
      clock,
      new SequentialIds('tx2'),
      new Map([['GOLD', { ...goldConfig(), safetyBufferUg: 99_500_000n }]]),
    );
    const refused = await guarded.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(!refused.ok && refused.reason).toBe('INSUFFICIENT_CAPACITY');

    // Without the buffer the very same order is fine — proving the refusal came
    // from the buffer and not from a lack of metal.
    const allowed = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    expect(allowed.ok).toBe(true);
  });

  it('counts open reservations against capacity, so quotes cannot collectively oversell', async () => {
    // Each quote reserves ~1g against 100g of inventory. Issuing many must
    // eventually exhaust capacity rather than every quote seeing the full stock.
    const config = goldConfig();
    const sized = 100_000_000n; // ~1g per quote
    let refusedAt = -1;
    for (let i = 0; i < 120; i += 1) {
      const result = await service.issueQuote({
        userId,
        assetCode: 'GOLD',
        side: 'BUY',
        amountRial: sized,
      });
      if (!result.ok) {
        expect(result.reason).toBe('INSUFFICIENT_CAPACITY');
        refusedAt = i;
        break;
      }
    }
    expect(refusedAt).toBeGreaterThan(0);
    expect(refusedAt).toBeLessThan(120);
    expect(config.safetyBufferUg).toBe(0n);
  });

  it('releases capacity when a quote expires unused', async () => {
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');

    const before = await db.reservations().openWeightFor('GOLD');
    expect(before).toBeGreaterThan(0n);

    clock.advance(120);
    const released = await service.sweepExpiredQuotes();
    expect(released).toBe(1);
    expect(await db.reservations().openWeightFor('GOLD')).toBe(0n);
  });

  it('does not release capacity for a quote that was executed', async () => {
    // The metal left inventory for good. Returning it would credit the platform
    // with something it already sold.
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');
    await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k' });

    clock.advance(120);
    expect(await service.sweepExpiredQuotes()).toBe(0);
  });

  it('sells metal back and returns it to inventory', async () => {
    const bought = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!bought.ok) throw new Error('quote failed');
    await service.execute({ quoteId: bought.quote.id, userId, idempotencyKey: 'buy' });

    const inventoryAfterBuy = db.balanceOf(accountKey(platformAccount('GOLD', 'INVENTORY')), 'GOLD');

    const sold = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'SELL',
      weightUg: bought.quote.weightUg,
    });
    if (!sold.ok) throw new Error('sell quote failed');
    expect(sold.quote.executionPriceRial).toBeLessThan(sold.quote.referencePriceRial);

    const executed = await service.execute({ quoteId: sold.quote.id, userId, idempotencyKey: 'sell' });
    expect(executed.ok).toBe(true);

    expect(verifyAll(db.store.entries).ok).toBe(true);
    expect(db.balanceOf(accountKey(customerAccount(userId, 'GOLD')), 'GOLD')).toBe(0n);
    expect(db.balanceOf(accountKey(platformAccount('GOLD', 'INVENTORY')), 'GOLD')).toBe(
      inventoryAfterBuy + bought.quote.weightUg,
    );
  });

  it('leaves a round trip at an unchanged price costing the customer money', async () => {
    const bought = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!bought.ok) throw new Error('quote failed');
    await service.execute({ quoteId: bought.quote.id, userId, idempotencyKey: 'b' });

    const sold = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'SELL',
      weightUg: bought.quote.weightUg,
    });
    if (!sold.ok) throw new Error('sell quote failed');
    await service.execute({ quoteId: sold.quote.id, userId, idempotencyKey: 's' });

    // Two fees plus two half-spreads. Anything else means the platform is
    // paying customers to churn.
    expect(db.balanceOf(accountKey(customerAccount(userId, 'IRR')), 'IRR')).toBeLessThan(
      1_000_000_000n,
    );
  });

  it('enqueues side effects inside the same transaction as the posting', async () => {
    // SPEC §70: never call an external service inside a money transaction, and
    // never fire a side effect the transaction might still roll back.
    const quoted = await service.issueQuote({
      userId,
      assetCode: 'GOLD',
      side: 'BUY',
      amountRial: 100_000_000n,
    });
    if (!quoted.ok) throw new Error('quote failed');
    await service.execute({ quoteId: quoted.quote.id, userId, idempotencyKey: 'k' });

    const events = (await db.outbox().pending()).map((e) => e.eventType);
    expect(events).toContain('TRADE_LEDGER_POSTED');
    expect(events).toContain('TREASURY_POSITION_CHANGED');
  });

  it('reports an indicative price that is not executable on its own', async () => {
    const buy = await service.indicativePrice('GOLD', 'BUY');
    const sell = await service.indicativePrice('GOLD', 'SELL');
    expect(buy?.price).toBeGreaterThan(REFERENCE);
    expect(sell?.price).toBeLessThan(REFERENCE);
    expect(buy?.status).toBe('LIVE');
  });
});
