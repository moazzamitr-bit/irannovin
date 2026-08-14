/**
 * Posting builders — the only place journal entries for business events are
 * constructed. SPEC §29–§32, §41.
 *
 * ## Position accounting
 *
 * `PLATFORM/INVENTORY` holds metal the platform owns free and clear. A customer
 * buy moves metal out of it and into the customer's account, so the inventory
 * balance *is* the net position (SPEC §49): positive is long, negative is short.
 * Customer liability is not a separate account — it is the sum of the customer
 * metal accounts, and giving it its own line would double-count the same metal.
 *
 * `PLATFORM/CUSTODY_CONTROL` mirrors what the custodian reports holding, and
 * reconciles against inventory plus customer balances (SPEC §57).
 *
 * ## Commit ordering
 *
 * The ledger posting is the commit point. A customer owns their metal the
 * moment `postBuy` is committed — custody allocation happens afterwards and
 * asynchronously (SPEC §30). If that allocation later fails, the customer trade
 * stands and the shortfall becomes the platform's problem via
 * `postCustodyShortfall` (SPEC §31).
 */

import { customerAccount, platformAccount, type AccountRef, type AssetCode } from './accounts.js';
import { buildJournal, type JournalEntry, type JournalLine } from './journal.js';

/** Fields every posting carries for traceability. */
export interface PostingContext {
  readonly transactionId: string;
  readonly referenceId?: string;
  readonly correlationId?: string;
  readonly idempotencyKey?: string;
}

function line(account: AccountRef, asset: AssetCode, amount: bigint): JournalLine {
  return { account, asset, amount };
}

/**
 * Drop lines that move nothing.
 *
 * A zero line records no movement and only adds noise to the entry, so the
 * journal rejects them outright. Legitimate zeroes do arise here — a promotional
 * zero fee, or a trade small enough that the floored fee rounds away — so the
 * builders filter rather than making every call site special-case it.
 * Removing zero lines cannot affect the balance.
 */
function nonZero(lines: readonly JournalLine[]): JournalLine[] {
  return lines.filter((entry) => entry.amount !== 0n);
}

/**
 * Rial arriving from the payment provider.
 *
 * Posted only after server-to-server verification — never because the customer
 * landed on a success page (SPEC §41).
 */
export function postDeposit(
  context: PostingContext,
  input: { userId: string; amountRial: bigint },
): JournalEntry {
  if (input.amountRial <= 0n) {
    throw new RangeError('deposit amount must be positive');
  }
  return buildJournal({
    ...context,
    entryType: 'DEPOSIT',
    lines: [
      line(platformAccount('IRR', 'PAYMENT_GATEWAY_CLEARING'), 'IRR', -input.amountRial),
      line(customerAccount(input.userId, 'IRR'), 'IRR', input.amountRial),
    ],
  });
}

/**
 * Customer buys metal.
 *
 * Rial legs balance against rial, metal legs against metal. The fee is carved
 * from the gross by `applyFee` in @garm/financial, which guarantees
 * `fee + net === gross`, so no rounding line is needed here.
 */
export function postBuy(
  context: PostingContext,
  input: {
    userId: string;
    asset: AssetCode;
    grossRial: bigint;
    feeRial: bigint;
    netRial: bigint;
    weightUg: bigint;
  },
): JournalEntry {
  if (input.feeRial + input.netRial !== input.grossRial) {
    throw new RangeError(
      `buy fee and net must reconstitute gross: ${input.feeRial} + ${input.netRial} ≠ ${input.grossRial}`,
    );
  }
  if (input.weightUg <= 0n || input.grossRial <= 0n) {
    throw new RangeError('buy weight and gross must be positive');
  }

  return buildJournal({
    ...context,
    entryType: 'TRADE',
    lines: nonZero([
      line(customerAccount(input.userId, 'IRR'), 'IRR', -input.grossRial),
      line(platformAccount('IRR', 'CLEARING'), 'IRR', input.netRial),
      line(platformAccount('IRR', 'FEE_REVENUE'), 'IRR', input.feeRial),
      line(customerAccount(input.userId, input.asset), input.asset, input.weightUg),
      line(platformAccount(input.asset, 'INVENTORY'), input.asset, -input.weightUg),
    ]),
  });
}

/**
 * Customer sells metal back.
 *
 * The metal returns to platform inventory, which is what makes a customer
 * sell-back an acquisition for cost-basis purposes — see `acquire()` in
 * @garm/financial, which folds it into the same weighted-average pool as
 * supplier procurement.
 */
export function postSell(
  context: PostingContext,
  input: {
    userId: string;
    asset: AssetCode;
    grossRial: bigint;
    feeRial: bigint;
    netRial: bigint;
    weightUg: bigint;
  },
): JournalEntry {
  if (input.feeRial + input.netRial !== input.grossRial) {
    throw new RangeError(
      `sell fee and net must reconstitute gross: ${input.feeRial} + ${input.netRial} ≠ ${input.grossRial}`,
    );
  }
  if (input.weightUg <= 0n || input.grossRial <= 0n) {
    throw new RangeError('sell weight and gross must be positive');
  }

  // The platform pays out `gross` from clearing; the customer receives `net`
  // and the difference is fee revenue. Gross never touches the customer's
  // balance, so there is nothing to deduct from them afterwards.
  return buildJournal({
    ...context,
    entryType: 'TRADE',
    lines: nonZero([
      line(customerAccount(input.userId, input.asset), input.asset, -input.weightUg),
      line(platformAccount(input.asset, 'INVENTORY'), input.asset, input.weightUg),
      line(platformAccount('IRR', 'CLEARING'), 'IRR', -input.grossRial),
      line(customerAccount(input.userId, 'IRR'), 'IRR', input.netRial),
      line(platformAccount('IRR', 'FEE_REVENUE'), 'IRR', input.feeRial),
    ]),
  });
}

/** Metal bought from an approved supplier. Increases the net position. */
export function postProcurement(
  context: PostingContext,
  input: { asset: AssetCode; weightUg: bigint; costRial: bigint },
): JournalEntry {
  if (input.weightUg <= 0n || input.costRial < 0n) {
    throw new RangeError('procurement weight must be positive and cost non-negative');
  }
  return buildJournal({
    ...context,
    entryType: 'PROCUREMENT',
    lines: nonZero([
      // Metal enters inventory from the supplier boundary…
      line(platformAccount(input.asset, 'INVENTORY'), input.asset, input.weightUg),
      line(platformAccount(input.asset, 'SUPPLIER_CLEARING'), input.asset, -input.weightUg),
      // …and the rial owed for it leaves through the same boundary. Each asset
      // balances against its own counterpart, which is what lets a
      // cross-asset purchase post as one entry.
      line(platformAccount('IRR', 'SUPPLIER_CLEARING'), 'IRR', input.costRial),
      line(platformAccount('IRR', 'CLEARING'), 'IRR', -input.costRial),
    ]),
  });
}

/**
 * Move rial from spendable to pending while a withdrawal is in flight.
 *
 * Reserved immediately so the same balance cannot fund a second withdrawal
 * while the first is at the bank (SPEC §39, §42).
 */
export function postWithdrawalReserve(
  context: PostingContext,
  input: { userId: string; amountRial: bigint },
): JournalEntry {
  if (input.amountRial <= 0n) {
    throw new RangeError('withdrawal amount must be positive');
  }
  return buildJournal({
    ...context,
    entryType: 'WITHDRAWAL',
    lines: [
      line(customerAccount(input.userId, 'IRR', 'AVAILABLE'), 'IRR', -input.amountRial),
      line(customerAccount(input.userId, 'IRR', 'PENDING'), 'IRR', input.amountRial),
    ],
  });
}

/** Bank confirmed settlement: the reserved rial leaves the platform. */
export function postWithdrawalSettle(
  context: PostingContext,
  input: { userId: string; amountRial: bigint },
): JournalEntry {
  if (input.amountRial <= 0n) {
    throw new RangeError('withdrawal amount must be positive');
  }
  return buildJournal({
    ...context,
    entryType: 'WITHDRAWAL',
    lines: [
      line(customerAccount(input.userId, 'IRR', 'PENDING'), 'IRR', -input.amountRial),
      line(platformAccount('IRR', 'BANK_SETTLEMENT_CLEARING'), 'IRR', input.amountRial),
    ],
  });
}

/**
 * Custody allocation failed after the customer trade was committed.
 *
 * The customer keeps their metal — the failure is internal and must not be
 * pushed onto them (SPEC §31). The shortfall is recorded against
 * `OPERATIONAL_DEFICIT`, which should sit at zero: any balance there is an
 * incident that reduces available-to-sell and triggers procurement.
 */
export function postCustodyShortfall(
  context: PostingContext,
  input: { asset: AssetCode; weightUg: bigint; reason: string },
): JournalEntry {
  if (input.weightUg <= 0n) {
    throw new RangeError('shortfall weight must be positive');
  }
  return buildJournal({
    ...context,
    entryType: 'CUSTODY_ALLOCATION',
    metadata: { reason: input.reason },
    lines: [
      line(platformAccount(input.asset, 'OPERATIONAL_DEFICIT'), input.asset, input.weightUg),
      line(platformAccount(input.asset, 'CUSTODY_CONTROL'), input.asset, -input.weightUg),
    ],
  });
}
