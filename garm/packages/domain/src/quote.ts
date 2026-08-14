/**
 * Quote lifecycle. SPEC §25, §26, §27, §72.
 *
 * ## Why quotes exist at all
 *
 * A streamed price is advisory. If the client sent back a price it had been
 * shown, a customer could hold the screen open, wait for the market to move in
 * their favour, and then confirm — arbitraging the platform with its own stale
 * number. If instead the server re-priced at confirmation time, the customer
 * would agree to one number and be charged another.
 *
 * A quote resolves both: the server issues a price with an expiry, the client
 * returns only the quote's id, and execution binds to what was quoted. No price
 * ever crosses the wire in the customer's direction.
 *
 * ## The reservation race
 *
 * Issuing a buy quote soft-reserves treasury capacity, and expiry releases it.
 * Those two facts create the race this module is careful about: a quote can
 * expire while an execution for it is in flight. `evaluateExecution` is the
 * single place that decides, and it treats an expired-but-unconsumed quote as
 * unusable regardless of how the reservation sweeper is progressing — releasing
 * capacity twice is a bookkeeping error, but executing on released capacity is
 * an oversell.
 */

export type QuoteStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export type TradeSide = 'BUY' | 'SELL';

export interface Quote {
  readonly id: string;
  readonly userId: string;
  readonly assetCode: string;
  readonly side: TradeSide;

  readonly referencePriceRial: bigint;
  readonly executionPriceRial: bigint;
  readonly grossRial: bigint;
  readonly feeRial: bigint;
  readonly netRial: bigint;
  readonly weightUg: bigint;

  /** Which treasury reservation this quote holds, for a buy. */
  readonly inventoryReservationId: string | null;

  readonly status: QuoteStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly consumedAt: Date | null;
}

export interface QuotePolicy {
  /** How long a quote stays executable. Long enough to read, short enough to
   *  bound the platform's exposure to a free option. */
  readonly lifetimeSeconds: number;
  /** Below this the client should stop offering the confirm button. */
  readonly warnAtSecondsRemaining: number;
}

export const DEFAULT_QUOTE_POLICY: QuotePolicy = {
  lifetimeSeconds: 20,
  warnAtSecondsRemaining: 5,
};

export type ExecutionRefusal =
  | 'EXPIRED'
  | 'ALREADY_USED'
  | 'CANCELLED'
  | 'WRONG_USER'
  | 'FEED_HALTED'
  | 'TRADING_DISABLED'
  | 'KYC_NOT_VERIFIED'
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_CAPACITY';

export type ExecutionDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: ExecutionRefusal };

export interface ExecutionContext {
  readonly requestingUserId: string;
  readonly now: Date;
  readonly kycVerified: boolean;
  readonly tradingEnabled: boolean;
  readonly sideEnabled: boolean;
  /** Customer's spendable balance in the asset being given up. */
  readonly availableBalance: bigint;
  /** Treasury capacity still free, for a buy. */
  readonly availableToSellUg: bigint;
}

/**
 * Decide whether a quote may be executed.
 *
 * Ownership is checked before expiry so that probing another customer's quote
 * id cannot be used to learn whether it exists and when it expires.
 *
 * A feed halt does *not* appear here as a blanket refusal: an already-issued
 * quote is a commitment the platform made at a price it believed, and honouring
 * it for its remaining seconds is bounded and correct (SPEC §24). The halt stops
 * *issuance*, which is a separate decision — see `mayIssueQuotes`.
 */
export function evaluateExecution(quote: Quote, context: ExecutionContext): ExecutionDecision {
  if (quote.userId !== context.requestingUserId) {
    return { allowed: false, reason: 'WRONG_USER' };
  }
  if (quote.status === 'USED') {
    return { allowed: false, reason: 'ALREADY_USED' };
  }
  if (quote.status === 'CANCELLED') {
    return { allowed: false, reason: 'CANCELLED' };
  }
  if (quote.status === 'EXPIRED' || quote.expiresAt <= context.now) {
    return { allowed: false, reason: 'EXPIRED' };
  }
  if (!context.kycVerified) {
    return { allowed: false, reason: 'KYC_NOT_VERIFIED' };
  }
  if (!context.tradingEnabled || !context.sideEnabled) {
    return { allowed: false, reason: 'TRADING_DISABLED' };
  }

  if (quote.side === 'BUY') {
    if (context.availableBalance < quote.grossRial) {
      return { allowed: false, reason: 'INSUFFICIENT_BALANCE' };
    }
    // The quote's own reservation is expected to already be excluded from
    // availableToSellUg by the caller; this is the backstop against a
    // reservation that was swept early.
    if (quote.inventoryReservationId === null && context.availableToSellUg < quote.weightUg) {
      return { allowed: false, reason: 'INSUFFICIENT_CAPACITY' };
    }
  } else if (context.availableBalance < quote.weightUg) {
    return { allowed: false, reason: 'INSUFFICIENT_BALANCE' };
  }

  return { allowed: true };
}

/** Seconds a quote has left. Never negative. */
export function secondsRemaining(quote: Quote, now: Date): number {
  return Math.max(0, Math.floor((quote.expiresAt.getTime() - now.getTime()) / 1000));
}

export function isExpired(quote: Quote, now: Date): boolean {
  return quote.status === 'EXPIRED' || quote.expiresAt <= now;
}

/**
 * Quotes whose reservations the sweeper should release.
 *
 * Only ACTIVE-but-expired quotes qualify. A USED quote's capacity was consumed
 * by the trade and releasing it would credit the platform with metal it has
 * already sold.
 */
export function releasableReservations(quotes: readonly Quote[], now: Date): string[] {
  return quotes
    .filter((quote) => quote.status === 'ACTIVE' && quote.expiresAt <= now)
    .map((quote) => quote.inventoryReservationId)
    .filter((id): id is string => id !== null);
}
