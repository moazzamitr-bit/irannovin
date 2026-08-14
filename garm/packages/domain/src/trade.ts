/**
 * Trade state machine. SPEC §29, §30, §31, §37, §38.
 *
 * ## The ordering that matters
 *
 * Inventory is soft-reserved when the quote is issued — *before* the customer
 * pays. An earlier draft of this design checked capacity after payment, which
 * creates a state where the platform has taken the money and cannot deliver the
 * metal. Reserving first converts that post-payment failure into a
 * pre-payment refusal, which costs a customer a retry instead of a refund and a
 * complaint.
 *
 * The ledger posting is the commit point. The customer owns their metal the
 * moment `LEDGER_POSTED` succeeds. Custody allocation happens afterwards and
 * asynchronously, because the customer's ownership must not depend on an
 * external call succeeding.
 *
 * If custody then fails, the trade stands and the shortfall is the platform's
 * (SPEC §31) — `CUSTODY_FAILED` is a terminal *success* for the customer and an
 * incident for treasury. It is deliberately not a path back to reversal.
 */

export type TradeState =
  | 'CREATED'
  | 'QUOTE_LOCKED'
  | 'INVENTORY_RESERVED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'TRADE_COMMITTING'
  | 'LEDGER_POSTED'
  | 'CUSTODY_PENDING'
  | 'COMPLETED'
  // Terminal failures
  | 'QUOTE_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_UNKNOWN'
  | 'CAPACITY_UNAVAILABLE'
  | 'REJECTED'
  | 'REVERSED'
  // Terminal, but the customer keeps their metal
  | 'CUSTODY_FAILED';

const TRANSITIONS: Readonly<Record<TradeState, readonly TradeState[]>> = {
  CREATED: ['QUOTE_LOCKED', 'REJECTED'],
  QUOTE_LOCKED: ['INVENTORY_RESERVED', 'QUOTE_EXPIRED', 'CAPACITY_UNAVAILABLE', 'REJECTED'],
  INVENTORY_RESERVED: ['PAYMENT_PENDING', 'QUOTE_EXPIRED', 'REJECTED'],
  PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_UNKNOWN'],
  // An UNKNOWN payment is not a failure. Reconciliation resolves it either way,
  // so it must be able to reach both outcomes (SPEC §40).
  PAYMENT_UNKNOWN: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED'],
  PAYMENT_CONFIRMED: ['TRADE_COMMITTING'],
  TRADE_COMMITTING: ['LEDGER_POSTED', 'REVERSED'],
  // Past this point the customer owns the metal. Nothing here leads back to
  // REVERSED — an internal failure is not the customer's to absorb.
  LEDGER_POSTED: ['CUSTODY_PENDING', 'COMPLETED'],
  CUSTODY_PENDING: ['COMPLETED', 'CUSTODY_FAILED'],

  COMPLETED: [],
  QUOTE_EXPIRED: [],
  PAYMENT_FAILED: [],
  CAPACITY_UNAVAILABLE: [],
  REJECTED: [],
  REVERSED: [],
  CUSTODY_FAILED: [],
};

/** States after which the customer's ownership is settled and irreversible. */
const COMMITTED: ReadonlySet<TradeState> = new Set<TradeState>([
  'LEDGER_POSTED',
  'CUSTODY_PENDING',
  'COMPLETED',
  'CUSTODY_FAILED',
]);

export const TERMINAL_STATES: ReadonlySet<TradeState> = new Set<TradeState>(
  (Object.keys(TRANSITIONS) as TradeState[]).filter((state) => TRANSITIONS[state].length === 0),
);

export class TradeTransitionError extends Error {
  constructor(
    readonly from: TradeState,
    readonly to: TradeState,
  ) {
    super(`illegal trade transition: ${from} → ${to}`);
    this.name = 'TradeTransitionError';
  }
}

export function canTransitionTrade(from: TradeState, to: TradeState): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Apply a transition, refusing any that the machine does not define. */
export function transitionTrade(from: TradeState, to: TradeState): TradeState {
  if (!canTransitionTrade(from, to)) {
    throw new TradeTransitionError(from, to);
  }
  return to;
}

export function isTerminal(state: TradeState): boolean {
  return TERMINAL_STATES.has(state);
}

/**
 * Whether the customer's ownership has been committed.
 *
 * Once true, no failure downstream may take the metal back. This is the
 * predicate SPEC §31 turns on.
 */
export function isCommitted(state: TradeState): boolean {
  return COMMITTED.has(state);
}

/** Whether a state should be shown to the customer as a finished, successful trade. */
export function isCustomerSuccess(state: TradeState): boolean {
  // CUSTODY_FAILED included deliberately: from the customer's side the trade
  // succeeded and they hold the metal. The failure is the platform's to fix.
  return state === 'COMPLETED' || state === 'CUSTODY_FAILED';
}

/** Customer-facing progress steps, in order, for the transaction timeline (SPEC §35). */
export const CUSTOMER_TIMELINE: readonly TradeState[] = [
  'QUOTE_LOCKED',
  'PAYMENT_CONFIRMED',
  'LEDGER_POSTED',
  'COMPLETED',
];

/**
 * How far the timeline has progressed.
 *
 * Never reports a step the backend has not actually reached — a progress bar
 * that runs ahead of the ledger is the optimistic-update mistake in disguise
 * (SPEC §9).
 */
export function timelineProgress(state: TradeState, history: readonly TradeState[]): number {
  const seen = new Set<TradeState>([...history, state]);
  let reached = 0;
  for (const step of CUSTOMER_TIMELINE) {
    if (!seen.has(step)) {
      break;
    }
    reached += 1;
  }
  return reached;
}
