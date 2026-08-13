/**
 * Integer arithmetic primitives. SPEC §2.3 (rounding), §11.
 *
 * ## The rule this module exists to enforce
 *
 * When a total is divided into parts, compute every part but the last by
 * rounding, then derive the last part by SUBTRACTION. Never round two parts
 * independently and hope they add up — they will not, and the difference is a
 * ledger imbalance that surfaces weeks later as an unexplained drift.
 *
 * `split()` below guarantees `part + rest === total` by construction, so the
 * invariant cannot be violated by a caller who uses it.
 *
 * ## Where rounding does and does not create ledger imbalance
 *
 * The ledger balances per asset (SPEC §37). A cross-asset conversion — rial in,
 * micrograms out — therefore creates NO ledger imbalance: the rial side
 * balances against the rial side, the metal side against the metal side. What
 * rounding creates there is an *economic* residual (the implied price differs
 * microscopically from the quoted one), which is reported for transparency but
 * needs no journal line.
 *
 * Rounding needs a dedicated rounding account only for multi-way splits within
 * a single asset. Use `split()` for those and the account stays at zero.
 */

/** Floor division for bigint. Native `/` truncates toward zero, which is wrong for negatives. */
export function floorDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError('division by zero');
  }
  const quotient = numerator / denominator;
  // Truncation and flooring differ only when the result is negative and inexact.
  if (quotient * denominator !== numerator && numerator < 0n !== denominator < 0n) {
    return quotient - 1n;
  }
  return quotient;
}

/** Ceiling division for bigint. */
export function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError('division by zero');
  }
  const quotient = numerator / denominator;
  if (quotient * denominator !== numerator && numerator < 0n === denominator < 0n) {
    return quotient + 1n;
  }
  return quotient;
}

/** Rounding direction for a division whose exact result is not an integer. */
export type RoundingMode = 'floor' | 'ceil';

export function divide(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  return mode === 'floor' ? floorDiv(numerator, denominator) : ceilDiv(numerator, denominator);
}

/**
 * A total divided into two parts that provably reconstitute it.
 *
 * `part + rest === total` always holds, so posting both to the ledger balances
 * without a rounding line.
 */
export interface Split {
  readonly total: bigint;
  readonly part: bigint;
  readonly rest: bigint;
}

/**
 * Split `total` into `part = total * numerator / denominator` and the remainder.
 *
 * `part` is floored — the derived `rest` absorbs the fraction. For a fee split
 * this means the fee never rounds up against the user, which is the direction
 * that avoids disputes.
 */
export function split(total: bigint, numerator: bigint, denominator: bigint): Split {
  if (denominator <= 0n) {
    throw new RangeError('denominator must be positive');
  }
  const part = floorDiv(total * numerator, denominator);
  return { total, part, rest: total - part };
}

/**
 * Distribute `total` across `weights` so that the parts sum exactly to `total`.
 *
 * Every part but the largest is floored; the largest absorbs the accumulated
 * remainder. Assigning the remainder to the largest share rather than the last
 * one keeps the relative error smallest and makes the result independent of
 * input ordering.
 */
export function distribute(total: bigint, weights: readonly bigint[]): bigint[] {
  if (weights.length === 0) {
    throw new RangeError('weights must not be empty');
  }
  if (weights.some((w) => w < 0n)) {
    throw new RangeError('weights must be non-negative');
  }
  const totalWeight = weights.reduce((sum, w) => sum + w, 0n);
  if (totalWeight === 0n) {
    throw new RangeError('weights must not sum to zero');
  }

  const parts = weights.map((w) => floorDiv(total * w, totalWeight));
  const assigned = parts.reduce((sum, p) => sum + p, 0n);

  let largestIndex = 0;
  for (let i = 1; i < weights.length; i += 1) {
    if ((weights[i] ?? 0n) > (weights[largestIndex] ?? 0n)) {
      largestIndex = i;
    }
  }
  parts[largestIndex] = (parts[largestIndex] ?? 0n) + (total - assigned);
  return parts;
}

/** Absolute value for bigint. */
export function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}
