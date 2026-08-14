/**
 * In-memory adapters for the repository ports.
 *
 * These back the service tests, which is what lets the whole trade path —
 * quote, reserve, execute, post, verify — run without a database. They are not
 * a toy: the transaction semantics are real enough to catch the mistakes that
 * matter, because `withTransaction` snapshots state and restores it on throw,
 * so a service that half-writes and then fails is visible here rather than in
 * production.
 */

import { accountKey, balanceOf, type AssetCode, type JournalEntry } from '@garm/ledger';
import type { KycStatus, Quote, TradeState } from '@garm/domain';

import type {
  Clock,
  Database,
  IdempotencyRepository,
  IdGenerator,
  LedgerRepository,
  OperationalFlagKey,
  OperationalFlags,
  OtpChallengeRecord,
  OtpRateRecord,
  OtpRepository,
  OutboxRepository,
  QuoteRepository,
  ReservationRecord,
  ReservationRepository,
  TradeRecord,
  UnitOfWork,
  UserRecord,
  UserRepository,
} from './ports.js';

interface Store {
  users: UserRecord[];
  otpChallenges: OtpChallengeRecord[];
  otpRequests: { phone: string; ip: string; at: Date }[];
  quotes: Quote[];
  trades: TradeRecord[];
  entries: JournalEntry[];
  reservations: ReservationRecord[];
  idempotency: {
    key: string;
    endpoint: string;
    requestHash: string;
    status: 'IN_FLIGHT' | 'COMPLETED';
    response: unknown;
  }[];
  outbox: { aggregate: string; eventType: string; payload: unknown }[];
}

function emptyStore(): Store {
  return {
    users: [],
    otpChallenges: [],
    otpRequests: [],
    quotes: [],
    trades: [],
    entries: [],
    reservations: [],
    idempotency: [],
    outbox: [],
  };
}

function snapshot(store: Store): Store {
  return {
    users: [...store.users],
    otpChallenges: [...store.otpChallenges],
    otpRequests: [...store.otpRequests],
    quotes: [...store.quotes],
    trades: [...store.trades],
    entries: [...store.entries],
    reservations: [...store.reservations],
    idempotency: store.idempotency.map((row) => ({ ...row })),
    outbox: [...store.outbox],
  };
}

export class MemoryDatabase implements Database {
  readonly store: Store = emptyStore();
  private readonly ids: IdGenerator;
  private readonly clock: Clock;
  private depth = 0;

  constructor(ids: IdGenerator, clock: Clock) {
    this.ids = ids;
    this.clock = clock;
  }

  /**
   * Runs `work` against the live store, restoring the pre-call snapshot if it
   * throws. Nested calls join the outer transaction rather than starting a new
   * one, matching how a real connection-scoped transaction behaves.
   */
  async withTransaction<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    if (this.depth > 0) {
      return work(this.unitOfWork());
    }
    const before = snapshot(this.store);
    this.depth += 1;
    try {
      return await work(this.unitOfWork());
    } catch (error) {
      Object.assign(this.store, before);
      throw error;
    } finally {
      this.depth -= 1;
    }
  }

  unitOfWork(): UnitOfWork {
    return {
      users: this.users(),
      quotes: this.quotes(),
      trades: this.trades(),
      ledger: this.ledger(),
      reservations: this.reservations(),
      idempotency: this.idempotency(),
      outbox: this.outbox(),
    };
  }

  users(): UserRepository {
    const store = this.store;
    const ids = this.ids;
    return {
      async findById(id) {
        return store.users.find((u) => u.id === id) ?? null;
      },
      async findByPhone(phone) {
        return store.users.find((u) => u.phone === phone) ?? null;
      },
      async create({ phone }) {
        const user: UserRecord = { id: ids.next(), phone, kycStatus: 'NOT_STARTED' };
        store.users.push(user);
        return user;
      },
    };
  }

  /** Test helper: promote a user past KYC without walking the whole flow. */
  setKycStatus(userId: string, kycStatus: KycStatus): void {
    const index = this.store.users.findIndex((u) => u.id === userId);
    if (index >= 0) {
      this.store.users[index] = { ...(this.store.users[index] as UserRecord), kycStatus };
    }
  }

  otp(): OtpRepository {
    const store = this.store;
    const ids = this.ids;
    return {
      async rateStateFor(phone, ip, now): Promise<OtpRateRecord> {
        const hourAgo = new Date(now.getTime() - 3_600 * 1000);
        const recent = store.otpRequests.filter((r) => r.at > hourAgo);
        const forPhone = recent.filter((r) => r.phone === phone);
        return {
          phoneRequestsInWindow: forPhone.length,
          ipRequestsInWindow: recent.filter((r) => r.ip === ip).length,
          lastSentAt: forPhone.at(-1)?.at ?? null,
          lockedUntil: null,
        };
      },
      async create({ phone, codeHash, ip }) {
        const challenge: OtpChallengeRecord = {
          id: ids.next(),
          phone,
          codeHash,
          attempts: 0,
          createdAt: store.otpRequests.at(-1)?.at ?? new Date(),
          consumedAt: null,
        };
        store.otpChallenges.push(challenge);
        store.otpRequests.push({ phone, ip, at: challenge.createdAt });
        return challenge;
      },
      async latestFor(phone) {
        return [...store.otpChallenges].reverse().find((c) => c.phone === phone) ?? null;
      },
      async recordAttempt(id) {
        const index = store.otpChallenges.findIndex((c) => c.id === id);
        if (index >= 0) {
          const existing = store.otpChallenges[index] as OtpChallengeRecord;
          store.otpChallenges[index] = { ...existing, attempts: existing.attempts + 1 };
        }
      },
      async consume(id, at) {
        const index = store.otpChallenges.findIndex((c) => c.id === id);
        if (index >= 0) {
          store.otpChallenges[index] = {
            ...(store.otpChallenges[index] as OtpChallengeRecord),
            consumedAt: at,
          };
        }
      },
    };
  }

  quotes(): QuoteRepository {
    const store = this.store;
    return {
      async create(quote) {
        store.quotes.push(quote);
        return quote;
      },
      async findById(id) {
        return store.quotes.find((q) => q.id === id) ?? null;
      },
      async consume(id, at) {
        const index = store.quotes.findIndex((q) => q.id === id);
        if (index >= 0) {
          store.quotes[index] = {
            ...(store.quotes[index] as Quote),
            status: 'USED',
            consumedAt: at,
          };
        }
      },
      async expireOlderThan(now) {
        const expiring = store.quotes.filter((q) => q.status === 'ACTIVE' && q.expiresAt <= now);
        for (const quote of expiring) {
          const index = store.quotes.findIndex((q) => q.id === quote.id);
          store.quotes[index] = { ...quote, status: 'EXPIRED' };
        }
        return expiring;
      },
    };
  }

  trades() {
    const store = this.store;
    const ids = this.ids;
    return {
      async create({ userId, quoteId }: { userId: string; quoteId: string }) {
        const trade: TradeRecord = {
          id: ids.next(),
          userId,
          quoteId,
          state: 'CREATED',
          history: [],
          transactionId: null,
        };
        store.trades.push(trade);
        return trade;
      },
      async advance(id: string, to: TradeState) {
        const index = store.trades.findIndex((t) => t.id === id);
        const existing = store.trades[index] as TradeRecord;
        const updated: TradeRecord = {
          ...existing,
          state: to,
          history: [...existing.history, existing.state],
        };
        store.trades[index] = updated;
        return updated;
      },
      async attachTransaction(id: string, transactionId: string) {
        const index = store.trades.findIndex((t) => t.id === id);
        if (index >= 0) {
          store.trades[index] = { ...(store.trades[index] as TradeRecord), transactionId };
        }
      },
      async findById(id: string) {
        return store.trades.find((t) => t.id === id) ?? null;
      },
    };
  }

  ledger(): LedgerRepository {
    const store = this.store;
    return {
      async post(entry) {
        store.entries.push(entry);
      },
      async balance(key, asset) {
        let total = 0n;
        for (const entry of store.entries) {
          for (const line of entry.lines) {
            if (line.asset === asset && accountKey(line.account) === key) {
              total += line.amount;
            }
          }
        }
        return total;
      },
      async allEntries() {
        return store.entries;
      },
    };
  }

  reservations(): ReservationRepository {
    const store = this.store;
    const ids = this.ids;
    return {
      async reserve({ assetCode, weightUg, quoteId }) {
        const reservation: ReservationRecord = {
          id: ids.next(),
          assetCode,
          weightUg,
          quoteId,
          releasedAt: null,
        };
        store.reservations.push(reservation);
        return reservation;
      },
      async release(id, at) {
        const index = store.reservations.findIndex((r) => r.id === id);
        if (index >= 0) {
          store.reservations[index] = {
            ...(store.reservations[index] as ReservationRecord),
            releasedAt: at,
          };
        }
      },
      async openWeightFor(assetCode) {
        return store.reservations
          .filter((r) => r.assetCode === assetCode && r.releasedAt === null)
          .reduce((sum, r) => sum + r.weightUg, 0n);
      },
    };
  }

  idempotency(): IdempotencyRepository {
    const store = this.store;
    return {
      async claim({ key, endpoint, requestHash }) {
        const existing = store.idempotency.find((row) => row.key === key);
        if (!existing) {
          store.idempotency.push({ key, endpoint, requestHash, status: 'IN_FLIGHT', response: null });
          return { outcome: 'CLAIMED' as const };
        }
        if (existing.requestHash !== requestHash) {
          return { outcome: 'CONFLICT' as const };
        }
        return existing.status === 'COMPLETED'
          ? { outcome: 'REPLAY' as const, response: existing.response }
          : { outcome: 'IN_FLIGHT' as const };
      },
      async complete(key, response) {
        const row = store.idempotency.find((r) => r.key === key);
        if (row) {
          row.status = 'COMPLETED';
          row.response = response;
        }
      },
    };
  }

  outbox(): OutboxRepository {
    const store = this.store;
    return {
      async enqueue(event) {
        store.outbox.push(event);
      },
      async pending() {
        return store.outbox;
      },
    };
  }

  /** Convenience for assertions: net balance of an account across all entries. */
  balanceOf(key: string, asset: AssetCode): bigint {
    return this.store.entries.reduce((total, entry) => {
      for (const line of entry.lines) {
        if (line.asset === asset && accountKey(line.account) === key) {
          total += line.amount;
        }
      }
      return total;
    }, 0n);
  }

  entriesFor(asset: AssetCode, account: Parameters<typeof balanceOf>[1]): bigint {
    return balanceOf(this.store.entries, account, asset);
  }
}

export class MemoryFlags implements OperationalFlags {
  private readonly flags = new Map<OperationalFlagKey, boolean>();

  async isEnabled(key: OperationalFlagKey): Promise<boolean> {
    // Default open. Production seeds these explicitly; a missing row must never
    // silently disable trading.
    return this.flags.get(key) ?? true;
  }

  async set(key: OperationalFlagKey, enabled: boolean): Promise<void> {
    this.flags.set(key, enabled);
  }
}

/** Deterministic ids, so a failing test names the same entity every run. */
export class SequentialIds implements IdGenerator {
  private counter = 0;
  constructor(private readonly prefix = 'id') {}
  next(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}

/** A clock the test drives by hand. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  advance(seconds: number): void {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }
}
