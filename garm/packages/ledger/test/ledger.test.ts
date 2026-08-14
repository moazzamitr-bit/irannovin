import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { accountKey, customerAccount, platformAccount, sameAccount } from '../src/accounts.js';
import {
  balanceOf,
  buildJournal,
  drift,
  isBalanced,
  reverse,
  UnbalancedJournalError,
  verifyAll,
  type JournalEntry,
} from '../src/journal.js';
import {
  postBuy,
  postCustodyShortfall,
  postDeposit,
  postProcurement,
  postSell,
  postWithdrawalReserve,
  postWithdrawalSettle,
} from '../src/postings.js';

const ctx = (id: string) => ({ transactionId: id });

describe('accounts', () => {
  it('produces stable, distinguishable keys', () => {
    expect(accountKey(customerAccount('u1', 'GOLD'))).toBe('customer:u1:GOLD:AVAILABLE');
    expect(accountKey(platformAccount('GOLD', 'INVENTORY'))).toBe('platform:GOLD:INVENTORY');
  });

  it('distinguishes an available balance from a pending one', () => {
    expect(
      sameAccount(customerAccount('u1', 'IRR', 'AVAILABLE'), customerAccount('u1', 'IRR', 'PENDING')),
    ).toBe(false);
  });
});

describe('journal construction', () => {
  it('refuses an entry that does not balance', () => {
    expect(() =>
      buildJournal({
        transactionId: 'tx-1',
        entryType: 'TRADE',
        lines: [
          { account: customerAccount('u1', 'IRR'), asset: 'IRR', amount: -100n },
          { account: platformAccount('IRR', 'CLEARING'), asset: 'IRR', amount: 99n },
        ],
      }),
    ).toThrow(UnbalancedJournalError);
  });

  it('refuses a single-line entry — that is single-entry bookkeeping', () => {
    expect(() =>
      buildJournal({
        transactionId: 'tx-2',
        entryType: 'DEPOSIT',
        lines: [{ account: customerAccount('u1', 'IRR'), asset: 'IRR', amount: 100n }],
      }),
    ).toThrow(UnbalancedJournalError);
  });

  it('refuses a zero-amount line, which records nothing and hides intent', () => {
    expect(() =>
      buildJournal({
        transactionId: 'tx-3',
        entryType: 'TRADE',
        lines: [
          { account: customerAccount('u1', 'IRR'), asset: 'IRR', amount: 0n },
          { account: platformAccount('IRR', 'CLEARING'), asset: 'IRR', amount: 0n },
        ],
      }),
    ).toThrow(RangeError);
  });

  it('requires every asset to balance, not just the total', () => {
    // Rial and metal netting against each other would look balanced in a naive
    // sum and be catastrophically wrong.
    expect(() =>
      buildJournal({
        transactionId: 'tx-4',
        entryType: 'TRADE',
        lines: [
          { account: customerAccount('u1', 'IRR'), asset: 'IRR', amount: -100n },
          { account: customerAccount('u1', 'GOLD'), asset: 'GOLD', amount: 100n },
        ],
      }),
    ).toThrow(UnbalancedJournalError);
  });

  it('reports which assets drifted and by how much', () => {
    try {
      buildJournal({
        transactionId: 'tx-5',
        entryType: 'TRADE',
        lines: [
          { account: customerAccount('u1', 'IRR'), asset: 'IRR', amount: -100n },
          { account: platformAccount('IRR', 'CLEARING'), asset: 'IRR', amount: 97n },
        ],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnbalancedJournalError);
      expect((error as UnbalancedJournalError).drift.get('IRR')).toBe(-3n);
    }
  });
});

describe('reversal', () => {
  it('negates every line and points back at the original', () => {
    const original = postDeposit(ctx('tx-a'), { userId: 'u1', amountRial: 1_000_000n });
    const correction = reverse(original, 'tx-b', 'duplicate PSP callback');

    expect(correction.reversesTransactionId).toBe('tx-a');
    expect(correction.entryType).toBe('REVERSAL');
    expect(isBalanced(correction.lines)).toBe(true);

    // Original plus reversal nets to nothing, without either being deleted.
    expect(balanceOf([original, correction], customerAccount('u1', 'IRR'), 'IRR')).toBe(0n);
  });
});

describe('postDeposit', () => {
  it('credits the customer against the gateway clearing account', () => {
    const entry = postDeposit(ctx('tx-d'), { userId: 'u1', amountRial: 5_000_000n });
    expect(isBalanced(entry.lines)).toBe(true);
    expect(balanceOf([entry], customerAccount('u1', 'IRR'), 'IRR')).toBe(5_000_000n);
    expect(balanceOf([entry], platformAccount('IRR', 'PAYMENT_GATEWAY_CLEARING'), 'IRR')).toBe(
      -5_000_000n,
    );
  });

  it('rejects a non-positive amount', () => {
    expect(() => postDeposit(ctx('tx-d2'), { userId: 'u1', amountRial: 0n })).toThrow(RangeError);
  });
});

describe('postBuy', () => {
  const entry = postBuy(ctx('tx-buy'), {
    userId: 'u1',
    asset: 'GOLD',
    grossRial: 100_000_000n,
    feeRial: 500_000n,
    netRial: 99_500_000n,
    weightUg: 992_023n,
  });

  it('balances rial against rial and metal against metal', () => {
    expect(isBalanced(entry.lines)).toBe(true);
    expect(drift(entry.lines).get('IRR')).toBe(0n);
    expect(drift(entry.lines).get('GOLD')).toBe(0n);
  });

  it('moves metal out of platform inventory and into the customer', () => {
    expect(balanceOf([entry], customerAccount('u1', 'GOLD'), 'GOLD')).toBe(992_023n);
    expect(balanceOf([entry], platformAccount('GOLD', 'INVENTORY'), 'GOLD')).toBe(-992_023n);
  });

  it("records the fee as the platform's only clean revenue line", () => {
    expect(balanceOf([entry], platformAccount('IRR', 'FEE_REVENUE'), 'IRR')).toBe(500_000n);
  });

  it('refuses when fee and net do not reconstitute gross', () => {
    expect(() =>
      postBuy(ctx('tx-bad'), {
        userId: 'u1',
        asset: 'GOLD',
        grossRial: 100n,
        feeRial: 1n,
        netRial: 97n,
        weightUg: 1n,
      }),
    ).toThrow(RangeError);
  });

  it('omits the fee line entirely when the fee floors to zero', () => {
    const free = postBuy(ctx('tx-free'), {
      userId: 'u1',
      asset: 'GOLD',
      grossRial: 100n,
      feeRial: 0n,
      netRial: 100n,
      weightUg: 1n,
    });
    expect(isBalanced(free.lines)).toBe(true);
    expect(free.lines.some((l) => accountKey(l.account).includes('FEE_REVENUE'))).toBe(false);
  });
});

describe('postSell', () => {
  const entry = postSell(ctx('tx-sell'), {
    userId: 'u1',
    asset: 'GOLD',
    grossRial: 99_700_000n,
    feeRial: 498_500n,
    netRial: 99_201_500n,
    weightUg: 1_000_000n,
  });

  it('balances and returns the metal to inventory', () => {
    expect(isBalanced(entry.lines)).toBe(true);
    expect(balanceOf([entry], platformAccount('GOLD', 'INVENTORY'), 'GOLD')).toBe(1_000_000n);
    expect(balanceOf([entry], customerAccount('u1', 'GOLD'), 'GOLD')).toBe(-1_000_000n);
  });

  it('credits the customer net, never gross', () => {
    expect(balanceOf([entry], customerAccount('u1', 'IRR'), 'IRR')).toBe(99_201_500n);
    expect(balanceOf([entry], platformAccount('IRR', 'FEE_REVENUE'), 'IRR')).toBe(498_500n);
  });
});

describe('postProcurement', () => {
  const entry = postProcurement(ctx('tx-proc'), {
    asset: 'GOLD',
    weightUg: 100_000_000n,
    costRial: 9_800_000_000n,
  });

  it('balances each asset against its own supplier counterpart', () => {
    // A cross-asset purchase cannot balance without this: rial and metal have
    // separate invariants and cannot offset each other.
    expect(isBalanced(entry.lines)).toBe(true);
    expect(drift(entry.lines).get('GOLD')).toBe(0n);
    expect(drift(entry.lines).get('IRR')).toBe(0n);
  });

  it('increases the net position', () => {
    expect(balanceOf([entry], platformAccount('GOLD', 'INVENTORY'), 'GOLD')).toBe(100_000_000n);
  });
});

describe('withdrawal', () => {
  it('reserves before submitting, so one balance cannot fund two withdrawals', () => {
    const reserve = postWithdrawalReserve(ctx('tx-w1'), { userId: 'u1', amountRial: 1_000_000n });
    expect(balanceOf([reserve], customerAccount('u1', 'IRR', 'AVAILABLE'), 'IRR')).toBe(-1_000_000n);
    expect(balanceOf([reserve], customerAccount('u1', 'IRR', 'PENDING'), 'IRR')).toBe(1_000_000n);
  });

  it('settles out of pending, never out of available', () => {
    const reserve = postWithdrawalReserve(ctx('tx-w1'), { userId: 'u1', amountRial: 1_000_000n });
    const settle = postWithdrawalSettle(ctx('tx-w2'), { userId: 'u1', amountRial: 1_000_000n });
    expect(balanceOf([reserve, settle], customerAccount('u1', 'IRR', 'PENDING'), 'IRR')).toBe(0n);
  });
});

describe('postCustodyShortfall (SPEC §31)', () => {
  it('records the gap against the platform without touching the customer', () => {
    // The customer's trade already committed. An internal custody failure is
    // the platform's problem and must never become a silent reversal.
    const entry = postCustodyShortfall(ctx('tx-short'), {
      asset: 'GOLD',
      weightUg: 500_000n,
      reason: 'custodian allocation rejected',
    });
    expect(isBalanced(entry.lines)).toBe(true);
    expect(balanceOf([entry], platformAccount('GOLD', 'OPERATIONAL_DEFICIT'), 'GOLD')).toBe(500_000n);
    expect(entry.lines.every((l) => l.account.owner === 'PLATFORM')).toBe(true);
  });
});

describe('a full customer lifecycle', () => {
  it('leaves every asset balanced across many entries', () => {
    const entries: JournalEntry[] = [
      postProcurement(ctx('p1'), { asset: 'GOLD', weightUg: 10_000_000n, costRial: 980_000_000n }),
      postDeposit(ctx('d1'), { userId: 'u1', amountRial: 100_000_000n }),
      postBuy(ctx('b1'), {
        userId: 'u1',
        asset: 'GOLD',
        grossRial: 100_000_000n,
        feeRial: 500_000n,
        netRial: 99_500_000n,
        weightUg: 992_023n,
      }),
      postSell(ctx('s1'), {
        userId: 'u1',
        asset: 'GOLD',
        grossRial: 98_900_000n,
        feeRial: 494_500n,
        netRial: 98_405_500n,
        weightUg: 992_023n,
      }),
      postWithdrawalReserve(ctx('w1'), { userId: 'u1', amountRial: 98_405_500n }),
      postWithdrawalSettle(ctx('w2'), { userId: 'u1', amountRial: 98_405_500n }),
    ];

    expect(verifyAll(entries).ok).toBe(true);

    // The customer bought and sold the same weight, so holds no metal…
    expect(balanceOf(entries, customerAccount('u1', 'GOLD'), 'GOLD')).toBe(0n);
    // …withdrew everything, so holds no rial…
    expect(balanceOf(entries, customerAccount('u1', 'IRR', 'AVAILABLE'), 'IRR')).toBe(0n);
    expect(balanceOf(entries, customerAccount('u1', 'IRR', 'PENDING'), 'IRR')).toBe(0n);
    // …and the metal is back in inventory where it started.
    expect(balanceOf(entries, platformAccount('GOLD', 'INVENTORY'), 'GOLD')).toBe(10_000_000n);
    // The platform kept both fees.
    expect(balanceOf(entries, platformAccount('IRR', 'FEE_REVENUE'), 'IRR')).toBe(994_500n);
  });
});

describe('the balance invariant holds for arbitrary inputs', () => {
  it('property: every generated buy balances per asset', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 10n ** 15n }),
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (gross, fee, weight) => {
          fc.pre(fee <= gross);
          const entry = postBuy(ctx('p'), {
            userId: 'u1',
            asset: 'GOLD',
            grossRial: gross,
            feeRial: fee,
            netRial: gross - fee,
            weightUg: weight,
          });
          expect(isBalanced(entry.lines)).toBe(true);
        },
      ),
    );
  });

  it('property: every generated sell balances per asset', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 10n ** 15n }),
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (gross, fee, weight) => {
          fc.pre(fee <= gross);
          const entry = postSell(ctx('p'), {
            userId: 'u1',
            asset: 'GOLD',
            grossRial: gross,
            feeRial: fee,
            netRial: gross - fee,
            weightUg: weight,
          });
          expect(isBalanced(entry.lines)).toBe(true);
        },
      ),
    );
  });

  it('property: a reversal always cancels its original exactly', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: 10n ** 15n }), (amount) => {
        const original = postDeposit(ctx('o'), { userId: 'u1', amountRial: amount });
        const correction = reverse(original, 'r', 'test');
        expect(balanceOf([original, correction], customerAccount('u1', 'IRR'), 'IRR')).toBe(0n);
      }),
    );
  });
});
