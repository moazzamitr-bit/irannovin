/**
 * Repository ports.
 *
 * The services below depend on these interfaces, never on Prisma. Two reasons
 * that matters here beyond the usual:
 *
 *   1. The financial services can be exercised in full — quote, execute, post,
 *      verify the ledger — against an in-memory adapter, so their behaviour is
 *      tested without a database in the loop.
 *   2. `withTransaction` makes the atomicity requirement explicit in the type
 *      system. SPEC §37 requires a trade to commit fully or roll back fully;
 *      a service that reaches for a repository outside the callback is visibly
 *      wrong rather than subtly wrong.
 */

import type { AssetCode, JournalEntry } from '@garm/ledger';
import type { KycStatus, Quote, TradeState } from '@garm/domain';

export interface UserRecord {
  readonly id: string;
  readonly phone: string;
  readonly kycStatus: KycStatus;
}

export interface OtpChallengeRecord {
  readonly id: string;
  readonly phone: string;
  readonly codeHash: string;
  readonly attempts: number;
  readonly createdAt: Date;
  readonly consumedAt: Date | null;
}

export interface OtpRateRecord {
  readonly phoneRequestsInWindow: number;
  readonly ipRequestsInWindow: number;
  readonly lastSentAt: Date | null;
  readonly lockedUntil: Date | null;
}

export interface TradeRecord {
  readonly id: string;
  readonly userId: string;
  readonly quoteId: string;
  readonly state: TradeState;
  readonly history: readonly TradeState[];
  readonly transactionId: string | null;
}

export interface ReservationRecord {
  readonly id: string;
  readonly assetCode: AssetCode;
  readonly weightUg: bigint;
  readonly quoteId: string;
  readonly releasedAt: Date | null;
}

/** A unit of work. Everything inside commits together or not at all. */
export interface UnitOfWork {
  readonly users: UserRepository;
  readonly quotes: QuoteRepository;
  readonly trades: TradeRepository;
  readonly ledger: LedgerRepository;
  readonly reservations: ReservationRepository;
  readonly idempotency: IdempotencyRepository;
  readonly outbox: OutboxRepository;
}

export interface Database {
  /**
   * Run `work` atomically.
   *
   * Throwing from inside rolls everything back. This is the only way a service
   * is permitted to write money-affecting state.
   */
  withTransaction<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  create(input: { phone: string }): Promise<UserRecord>;
}

export interface OtpRepository {
  rateStateFor(phone: string, ip: string, now: Date): Promise<OtpRateRecord>;
  create(input: { phone: string; codeHash: string; ip: string }): Promise<OtpChallengeRecord>;
  latestFor(phone: string): Promise<OtpChallengeRecord | null>;
  recordAttempt(id: string): Promise<void>;
  consume(id: string, at: Date): Promise<void>;
}

export interface QuoteRepository {
  create(quote: Quote): Promise<Quote>;
  findById(id: string): Promise<Quote | null>;
  /** Marks a quote USED. Must be atomic with the ledger write that consumes it. */
  consume(id: string, at: Date): Promise<void>;
  expireOlderThan(now: Date): Promise<readonly Quote[]>;
}

export interface TradeRepository {
  create(input: { userId: string; quoteId: string }): Promise<TradeRecord>;
  advance(id: string, to: TradeState): Promise<TradeRecord>;
  attachTransaction(id: string, transactionId: string): Promise<void>;
  findById(id: string): Promise<TradeRecord | null>;
}

export interface LedgerRepository {
  post(entry: JournalEntry): Promise<void>;
  balance(accountKey: string, asset: AssetCode): Promise<bigint>;
  allEntries(): Promise<readonly JournalEntry[]>;
}

export interface ReservationRepository {
  reserve(input: {
    assetCode: AssetCode;
    weightUg: bigint;
    quoteId: string;
  }): Promise<ReservationRecord>;
  release(id: string, at: Date): Promise<void>;
  openWeightFor(assetCode: AssetCode): Promise<bigint>;
}

export interface IdempotencyRepository {
  /**
   * Claim a key, or return the stored response if it was already completed.
   *
   * A repeat with a different request body is a conflict, not a replay
   * (SPEC §38).
   */
  claim(input: {
    key: string;
    endpoint: string;
    requestHash: string;
  }): Promise<
    | { readonly outcome: 'CLAIMED' }
    | { readonly outcome: 'REPLAY'; readonly response: unknown }
    | { readonly outcome: 'CONFLICT' }
    | { readonly outcome: 'IN_FLIGHT' }
  >;
  complete(key: string, response: unknown): Promise<void>;
}

export interface OutboxRepository {
  /** Enqueued inside the same transaction as the state change it describes. */
  enqueue(input: { aggregate: string; eventType: string; payload: unknown }): Promise<void>;
  pending(): Promise<readonly { eventType: string; payload: unknown }[]>;
}

/** Runtime switches read on the hot path. SPEC §60, §61. */
export interface OperationalFlags {
  isEnabled(key: OperationalFlagKey): Promise<boolean>;
  set(key: OperationalFlagKey, enabled: boolean, changedBy: string): Promise<void>;
}

export type OperationalFlagKey =
  | 'TRADING_ENABLED'
  | 'BUY_ENABLED'
  | 'SELL_ENABLED'
  | 'DEPOSIT_ENABLED'
  | 'WITHDRAWAL_ENABLED';

/** Wall clock, injectable so time-dependent behaviour is testable. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** Identifier generation, injectable for deterministic tests. */
export interface IdGenerator {
  next(): string;
}
