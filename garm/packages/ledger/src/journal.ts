/**
 * Double-entry journal. SPEC §33, §36, §37.
 *
 * ## The one invariant
 *
 * For every journal entry, and for every asset appearing in it, the signed
 * amounts sum to exactly zero. Value is never created or destroyed inside the
 * system — only moved between accounts.
 *
 * `buildJournal` refuses to construct an unbalanced entry, so an unbalanced
 * entry cannot reach the database. That is the whole design: rather than
 * writing rows and checking them later, the type that represents a valid entry
 * can only be produced by a function that has already verified it.
 *
 * ## Immutability
 *
 * Nothing here mutates or deletes. A correction is `reverse()`, which produces
 * a new entry with negated lines and a pointer back to the original, so the
 * history shows both what was posted and what corrected it (SPEC §36).
 */

import { accountKey, type AccountRef, type AssetCode } from './accounts.js';

export type EntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRADE'
  | 'FEE'
  | 'PROCUREMENT'
  | 'CUSTODY_ALLOCATION'
  | 'REDEMPTION'
  | 'REFERRAL_REWARD'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export interface JournalLine {
  readonly account: AccountRef;
  readonly asset: AssetCode;
  /** Signed. Positive is a debit to the account, negative a credit. */
  readonly amount: bigint;
}

/**
 * Marker proving an entry was produced by a function that verified the balance
 * invariant. Declared but never exported, so no caller can construct one.
 */
declare const BALANCED: unique symbol;

/**
 * A balanced journal entry.
 *
 * The private brand means a value of this type can only come from
 * `buildJournal` or `reverse`, both of which verify the invariant. An object
 * literal cannot be passed off as one.
 */
export interface JournalEntry {
  readonly transactionId: string;
  readonly entryType: EntryType;
  readonly lines: readonly JournalLine[];
  readonly referenceId: string | null;
  readonly correlationId: string | null;
  readonly idempotencyKey: string | null;
  readonly reversesTransactionId: string | null;
  readonly metadata: Readonly<Record<string, string>> | null;
  readonly [BALANCED]: true;
}

export class UnbalancedJournalError extends Error {
  constructor(
    readonly drift: ReadonlyMap<AssetCode, bigint>,
    readonly transactionId: string,
  ) {
    const detail = [...drift.entries()].map(([asset, amount]) => `${asset}: ${amount}`).join(', ');
    super(`journal ${transactionId} does not balance — ${detail}`);
    this.name = 'UnbalancedJournalError';
  }
}

/** Net movement per asset. Zero for every asset in a valid entry. */
export function drift(lines: readonly JournalLine[]): Map<AssetCode, bigint> {
  const totals = new Map<AssetCode, bigint>();
  for (const line of lines) {
    totals.set(line.asset, (totals.get(line.asset) ?? 0n) + line.amount);
  }
  return totals;
}

export function isBalanced(lines: readonly JournalLine[]): boolean {
  for (const total of drift(lines).values()) {
    if (total !== 0n) {
      return false;
    }
  }
  return true;
}

export interface JournalInput {
  readonly transactionId: string;
  readonly entryType: EntryType;
  readonly lines: readonly JournalLine[];
  readonly referenceId?: string;
  readonly correlationId?: string;
  readonly idempotencyKey?: string;
  readonly reversesTransactionId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

/**
 * Construct a journal entry, refusing anything that does not balance.
 *
 * Also rejects entries with fewer than two lines: a single-line "entry" is
 * single-entry bookkeeping wearing a double-entry name, and it is exactly the
 * mistake this module exists to prevent.
 */
export function buildJournal(input: JournalInput): JournalEntry {
  if (input.lines.length < 2) {
    throw new UnbalancedJournalError(drift(input.lines), input.transactionId);
  }
  if (input.lines.some((line) => line.amount === 0n)) {
    // A zero line records nothing and hides intent. Omit it instead.
    throw new RangeError(`journal ${input.transactionId} contains a zero-amount line`);
  }

  const totals = drift(input.lines);
  const unbalanced = new Map([...totals].filter(([, amount]) => amount !== 0n));
  if (unbalanced.size > 0) {
    throw new UnbalancedJournalError(unbalanced, input.transactionId);
  }

  return {
    transactionId: input.transactionId,
    entryType: input.entryType,
    lines: input.lines,
    referenceId: input.referenceId ?? null,
    correlationId: input.correlationId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    reversesTransactionId: input.reversesTransactionId ?? null,
    metadata: input.metadata ?? null,
    // The brand is type-level only — `BALANCED` is a declared symbol with no
    // runtime existence, so it is asserted rather than assigned. Emitting it as
    // a real key would throw at runtime and cost a property for nothing.
  } as JournalEntry;
}

/**
 * Produce the correcting entry for a posted one.
 *
 * Never edit or delete the original: the record must show that something was
 * posted and then corrected, not that it was never posted.
 */
export function reverse(entry: JournalEntry, transactionId: string, reason: string): JournalEntry {
  // `referenceId` is spread conditionally rather than passed as `undefined`:
  // under exactOptionalPropertyTypes an explicit undefined is not the same as
  // an absent property.
  return buildJournal({
    transactionId,
    entryType: 'REVERSAL',
    lines: entry.lines.map((line) => ({ ...line, amount: -line.amount })),
    ...(entry.referenceId === null ? {} : { referenceId: entry.referenceId }),
    reversesTransactionId: entry.transactionId,
    metadata: { reason },
  });
}

/** Net effect of a set of entries on one account, for reconciliation. */
export function balanceOf(
  entries: readonly JournalEntry[],
  account: AccountRef,
  asset: AssetCode,
): bigint {
  const key = accountKey(account);
  let total = 0n;
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.asset === asset && accountKey(line.account) === key) {
        total += line.amount;
      }
    }
  }
  return total;
}

/**
 * Verify a whole set of entries. The production reconciliation job runs this
 * continuously; the test suite runs it after every integration scenario
 * (SPEC §37).
 */
export function verifyAll(entries: readonly JournalEntry[]): {
  readonly ok: boolean;
  readonly offending: readonly string[];
} {
  const offending = entries.filter((entry) => !isBalanced(entry.lines)).map((e) => e.transactionId);
  return { ok: offending.length === 0, offending };
}
