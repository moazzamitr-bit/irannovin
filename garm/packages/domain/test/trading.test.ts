import { describe, expect, it } from 'vitest';

import {
  assessFeed,
  DEFAULT_FEED_POLICY,
  mayIssueQuotes,
  type SourceTick,
} from '../src/pricefeed.js';
import {
  DEFAULT_QUOTE_POLICY,
  evaluateExecution,
  isExpired,
  releasableReservations,
  secondsRemaining,
  type ExecutionContext,
  type Quote,
} from '../src/quote.js';
import {
  canTransitionTrade,
  CUSTOMER_TIMELINE,
  isCommitted,
  isCustomerSuccess,
  isTerminal,
  timelineProgress,
  TradeTransitionError,
  transitionTrade,
  type TradeState,
} from '../src/trade.js';

const NOW = new Date('2026-08-13T12:00:00Z');
const ago = (s: number) => new Date(NOW.getTime() - s * 1000);
const ahead = (s: number) => new Date(NOW.getTime() + s * 1000);

const tick = (name: string, price: bigint, secondsOld = 1): SourceTick => ({
  sourceName: name,
  priceRialPerGram: price,
  observedAt: ago(secondsOld),
});

describe('price feed assessment', () => {
  it('is LIVE with two agreeing fresh sources', () => {
    const result = assessFeed([tick('a', 100_000_000n), tick('b', 100_050_000n)], NOW);
    expect(result.status).toBe('LIVE');
    expect(result.referencePrice).toBe(100_025_000n);
    expect(mayIssueQuotes(result)).toBe(true);
  });

  it('is DEGRADED on a single source but still tradable', () => {
    // Running on one feed is worse than two. Refusing every customer over it is
    // worse still, so it trades and surfaces the reason.
    const result = assessFeed([tick('a', 100_000_000n)], NOW);
    expect(result.status).toBe('DEGRADED');
    expect(mayIssueQuotes(result)).toBe(true);
    expect(result.reasons.join(' ')).toContain('1 source(s) accepted');
  });

  it('rejects an outlier and prices from what survives', () => {
    // The classic bad tick: one source reports a price 4× the others.
    const result = assessFeed(
      [tick('a', 100_000_000n), tick('b', 100_100_000n), tick('bad', 400_000_000n)],
      NOW,
    );
    expect(result.status).toBe('LIVE');
    expect(result.rejectedSources).toContain('bad');
    expect(result.referencePrice).toBe(100_050_000n);
  });

  it('measures deviation against the median, which an outlier cannot drag', () => {
    // Against a mean, the 400M tick would pull the yardstick up far enough to
    // look acceptable. Against the median it stays an outlier.
    const result = assessFeed(
      [tick('a', 100_000_000n), tick('b', 100_000_000n), tick('bad', 400_000_000n)],
      NOW,
    );
    expect(result.acceptedSources).toEqual(['a', 'b']);
  });

  it('halts when the surviving sources disagree with each other', () => {
    // Two sources, 10% apart. One is wrong and there is no way to tell which.
    const result = assessFeed([tick('a', 100_000_000n), tick('b', 110_000_000n)], NOW);
    expect(result.status).toBe('HALTED');
    expect(result.referencePrice).toBeNull();
    expect(mayIssueQuotes(result)).toBe(false);
  });

  it('goes STALE when nothing is fresh, then UNAVAILABLE', () => {
    const stale = assessFeed([tick('a', 100_000_000n, 60)], NOW);
    expect(stale.status).toBe('STALE');

    const gone = assessFeed([tick('a', 100_000_000n, 300)], NOW);
    expect(gone.status).toBe('UNAVAILABLE');
    expect(mayIssueQuotes(gone)).toBe(false);
  });

  it('is UNAVAILABLE with no sources at all', () => {
    expect(assessFeed([], NOW).status).toBe('UNAVAILABLE');
  });

  it('ignores stale sources but still prices from fresh ones', () => {
    const result = assessFeed(
      [tick('fresh1', 100_000_000n, 1), tick('fresh2', 100_010_000n, 2), tick('old', 90_000_000n, 300)],
      NOW,
    );
    expect(result.status).toBe('LIVE');
    expect(result.rejectedSources).toContain('old');
  });

  it('requires at least two sources by default', () => {
    expect(DEFAULT_FEED_POLICY.minimumSources).toBeGreaterThanOrEqual(2);
  });
});

describe('quote execution', () => {
  const quote: Quote = {
    id: 'q1',
    userId: 'u1',
    assetCode: 'GOLD',
    side: 'BUY',
    referencePriceRial: 100_000_000n,
    executionPriceRial: 100_300_000n,
    grossRial: 100_000_000n,
    feeRial: 500_000n,
    netRial: 99_500_000n,
    weightUg: 992_023n,
    inventoryReservationId: 'res-1',
    status: 'ACTIVE',
    createdAt: ago(5),
    expiresAt: ahead(15),
    consumedAt: null,
  };

  const context: ExecutionContext = {
    requestingUserId: 'u1',
    now: NOW,
    kycVerified: true,
    tradingEnabled: true,
    sideEnabled: true,
    availableBalance: 200_000_000n,
    availableToSellUg: 10_000_000n,
  };

  it('allows a valid execution', () => {
    expect(evaluateExecution(quote, context).allowed).toBe(true);
  });

  it('checks ownership before anything else', () => {
    // Probing someone else's quote id must not reveal whether it exists or when
    // it expires.
    const decision = evaluateExecution(
      { ...quote, status: 'USED', expiresAt: ago(100) },
      { ...context, requestingUserId: 'attacker' },
    );
    expect(decision.allowed === false && decision.reason).toBe('WRONG_USER');
  });

  it('refuses a consumed quote', () => {
    const decision = evaluateExecution({ ...quote, status: 'USED' }, context);
    expect(decision.allowed === false && decision.reason).toBe('ALREADY_USED');
  });

  it('refuses an expired quote even while still marked ACTIVE', () => {
    // The sweeper is asynchronous, so the clock is authoritative, not the flag.
    const decision = evaluateExecution({ ...quote, expiresAt: ago(1) }, context);
    expect(decision.allowed === false && decision.reason).toBe('EXPIRED');
  });

  it('refuses when KYC is not verified', () => {
    const decision = evaluateExecution(quote, { ...context, kycVerified: false });
    expect(decision.allowed === false && decision.reason).toBe('KYC_NOT_VERIFIED');
  });

  it('refuses when the kill switch is down for this side', () => {
    const decision = evaluateExecution(quote, { ...context, sideEnabled: false });
    expect(decision.allowed === false && decision.reason).toBe('TRADING_DISABLED');
  });

  it('refuses a buy the customer cannot fund', () => {
    const decision = evaluateExecution(quote, { ...context, availableBalance: 1n });
    expect(decision.allowed === false && decision.reason).toBe('INSUFFICIENT_BALANCE');
  });

  it('refuses a sell of metal the customer does not hold', () => {
    const sell: Quote = { ...quote, side: 'SELL', inventoryReservationId: null };
    const decision = evaluateExecution(sell, { ...context, availableBalance: 1n });
    expect(decision.allowed === false && decision.reason).toBe('INSUFFICIENT_BALANCE');
  });

  it('backstops a buy whose reservation was swept early', () => {
    const unreserved: Quote = { ...quote, inventoryReservationId: null };
    const decision = evaluateExecution(unreserved, { ...context, availableToSellUg: 1n });
    expect(decision.allowed === false && decision.reason).toBe('INSUFFICIENT_CAPACITY');
  });

  it('honours an already-issued quote even though a halt stops new ones', () => {
    // SPEC §24: the halt stops issuance. A quote already given is a commitment
    // at a price the platform believed, and its exposure is bounded by expiry.
    expect(evaluateExecution(quote, context).allowed).toBe(true);
    expect(mayIssueQuotes(assessFeed([], NOW))).toBe(false);
  });
});

describe('quote timing', () => {
  const base: Quote = {
    id: 'q1',
    userId: 'u1',
    assetCode: 'GOLD',
    side: 'BUY',
    referencePriceRial: 1n,
    executionPriceRial: 1n,
    grossRial: 1n,
    feeRial: 0n,
    netRial: 1n,
    weightUg: 1n,
    inventoryReservationId: 'res-1',
    status: 'ACTIVE',
    createdAt: ago(5),
    expiresAt: ahead(15),
    consumedAt: null,
  };

  it('counts down and never goes negative', () => {
    expect(secondsRemaining(base, NOW)).toBe(15);
    expect(secondsRemaining({ ...base, expiresAt: ago(100) }, NOW)).toBe(0);
  });

  it('has a lifetime long enough to read and short enough to bound exposure', () => {
    expect(DEFAULT_QUOTE_POLICY.lifetimeSeconds).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_QUOTE_POLICY.lifetimeSeconds).toBeLessThanOrEqual(60);
  });

  it('treats an unswept expired quote as expired', () => {
    expect(isExpired({ ...base, expiresAt: ago(1) }, NOW)).toBe(true);
  });

  it('releases reservations only for expired quotes that were never used', () => {
    // Releasing a USED quote's capacity would credit the platform with metal it
    // has already sold.
    const quotes: Quote[] = [
      { ...base, id: 'expired', expiresAt: ago(1), inventoryReservationId: 'r-expired' },
      { ...base, id: 'used', status: 'USED', expiresAt: ago(1), inventoryReservationId: 'r-used' },
      { ...base, id: 'live', inventoryReservationId: 'r-live' },
    ];
    expect(releasableReservations(quotes, NOW)).toEqual(['r-expired']);
  });
});

describe('trade state machine', () => {
  it('reserves inventory before taking payment', () => {
    // Reserving after payment creates a state where the money is taken and the
    // metal cannot be delivered.
    let state: TradeState = 'CREATED';
    state = transitionTrade(state, 'QUOTE_LOCKED');
    state = transitionTrade(state, 'ASSETS_RESERVED');
    state = transitionTrade(state, 'PAYMENT_PENDING');
    expect(state).toBe('PAYMENT_PENDING');
    expect(canTransitionTrade('QUOTE_LOCKED', 'PAYMENT_PENDING')).toBe(false);
  });

  it('walks the full happy path', () => {
    const path: TradeState[] = [
      'QUOTE_LOCKED',
      'ASSETS_RESERVED',
      'PAYMENT_PENDING',
      'PAYMENT_CONFIRMED',
      'TRADE_COMMITTING',
      'LEDGER_POSTED',
      'CUSTODY_PENDING',
      'COMPLETED',
    ];
    let state: TradeState = 'CREATED';
    for (const next of path) {
      state = transitionTrade(state, next);
    }
    expect(state).toBe('COMPLETED');
  });

  it('fails capacity before payment, never after', () => {
    expect(canTransitionTrade('QUOTE_LOCKED', 'CAPACITY_UNAVAILABLE')).toBe(true);
    expect(canTransitionTrade('PAYMENT_CONFIRMED', 'CAPACITY_UNAVAILABLE')).toBe(false);
  });

  it('lets an UNKNOWN payment resolve either way', () => {
    // SPEC §40: never collapse UNKNOWN into FAILED. Reconciliation decides.
    expect(canTransitionTrade('PAYMENT_UNKNOWN', 'PAYMENT_CONFIRMED')).toBe(true);
    expect(canTransitionTrade('PAYMENT_UNKNOWN', 'PAYMENT_FAILED')).toBe(true);
  });

  it('cannot reverse a trade once the ledger has posted', () => {
    // SPEC §31: past the commit point the metal is the customer's. An internal
    // failure is never pushed back onto them.
    expect(canTransitionTrade('LEDGER_POSTED', 'REVERSED')).toBe(false);
    expect(canTransitionTrade('CUSTODY_PENDING', 'REVERSED')).toBe(false);
    expect(canTransitionTrade('TRADE_COMMITTING', 'REVERSED')).toBe(true);
  });

  it('treats custody failure as a customer success and a platform incident', () => {
    const state = transitionTrade('CUSTODY_PENDING', 'CUSTODY_FAILED');
    expect(isTerminal(state)).toBe(true);
    expect(isCustomerSuccess(state)).toBe(true);
    expect(isCommitted(state)).toBe(true);
  });

  it('marks ownership committed only from the ledger posting onward', () => {
    expect(isCommitted('PAYMENT_CONFIRMED')).toBe(false);
    expect(isCommitted('TRADE_COMMITTING')).toBe(false);
    expect(isCommitted('LEDGER_POSTED')).toBe(true);
  });

  it('refuses to skip from creation to completion', () => {
    expect(() => transitionTrade('CREATED', 'COMPLETED')).toThrow(TradeTransitionError);
  });

  it('leaves every terminal state with no way out', () => {
    for (const state of ['COMPLETED', 'REVERSED', 'PAYMENT_FAILED', 'CUSTODY_FAILED'] as const) {
      expect(isTerminal(state)).toBe(true);
    }
  });
});

describe('customer timeline', () => {
  it('never runs ahead of what the backend actually reached', () => {
    // A progress bar that shows a step the ledger has not posted is the
    // optimistic-update mistake wearing a different hat.
    expect(timelineProgress('PAYMENT_PENDING', ['CREATED', 'QUOTE_LOCKED'])).toBe(1);
    expect(timelineProgress('LEDGER_POSTED', ['QUOTE_LOCKED', 'PAYMENT_CONFIRMED'])).toBe(3);
  });

  it('reports every step once complete', () => {
    expect(timelineProgress('COMPLETED', [...CUSTOMER_TIMELINE])).toBe(CUSTOMER_TIMELINE.length);
  });

  it('stops at the first gap rather than counting later steps', () => {
    expect(timelineProgress('LEDGER_POSTED', [])).toBe(0);
  });
});
