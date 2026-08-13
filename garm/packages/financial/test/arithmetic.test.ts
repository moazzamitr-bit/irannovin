import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { abs, ceilDiv, distribute, floorDiv, split } from '../src/arithmetic.js';

describe('floorDiv / ceilDiv', () => {
  it('matches exact division when the result is whole', () => {
    expect(floorDiv(10n, 5n)).toBe(2n);
    expect(ceilDiv(10n, 5n)).toBe(2n);
    expect(floorDiv(-10n, 5n)).toBe(-2n);
    expect(ceilDiv(-10n, 5n)).toBe(-2n);
  });

  it('rounds toward negative infinity, not toward zero', () => {
    // Native bigint `/` truncates: (-7n / 2n) === -3n. Flooring must give -4n.
    expect(floorDiv(-7n, 2n)).toBe(-4n);
    expect(floorDiv(7n, 2n)).toBe(3n);
    expect(floorDiv(7n, -2n)).toBe(-4n);
    expect(floorDiv(-7n, -2n)).toBe(3n);
  });

  it('rounds toward positive infinity for ceil', () => {
    expect(ceilDiv(7n, 2n)).toBe(4n);
    expect(ceilDiv(-7n, 2n)).toBe(-3n);
    expect(ceilDiv(7n, -2n)).toBe(-3n);
    expect(ceilDiv(-7n, -2n)).toBe(4n);
  });

  it('rejects division by zero', () => {
    expect(() => floorDiv(1n, 0n)).toThrow(RangeError);
    expect(() => ceilDiv(1n, 0n)).toThrow(RangeError);
  });

  it('property: floor <= exact <= ceil, and they differ by at most one', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: -(10n ** 18n), max: 10n ** 18n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (n, d) => {
          const f = floorDiv(n, d);
          const c = ceilDiv(n, d);
          expect(f * d <= n).toBe(true);
          expect(c * d >= n).toBe(true);
          expect(c - f === 0n || c - f === 1n).toBe(true);
        },
      ),
    );
  });
});

describe('split', () => {
  it('reconstitutes the total exactly', () => {
    const result = split(1_000_003n, 50n, 10_000n);
    expect(result.part).toBe(5_000n);
    expect(result.part + result.rest).toBe(result.total);
  });

  it('floors the carved part, so a fee never rounds up against the payer', () => {
    // 0.5% of 199 rial is 0.995 rial — the fee must be 0, not 1.
    expect(split(199n, 50n, 10_000n).part).toBe(0n);
  });

  it('property: part + rest === total for any rate', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 18n }),
        fc.bigInt({ min: 0n, max: 10_000n }),
        (total, bps) => {
          const s = split(total, bps, 10_000n);
          expect(s.part + s.rest).toBe(total);
          expect(s.part >= 0n).toBe(true);
          expect(s.rest >= 0n).toBe(true);
        },
      ),
    );
  });

  it('rejects a non-positive denominator', () => {
    expect(() => split(100n, 1n, 0n)).toThrow(RangeError);
  });
});

describe('distribute', () => {
  it('sums to the total even when the split is inexact', () => {
    const parts = distribute(100n, [1n, 1n, 1n]);
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(100n);
  });

  it('assigns the remainder to the largest weight', () => {
    // 10 split 1:4 is 2 and 8 exactly; 11 split 1:4 is 2.2 and 8.8 —
    // floors are 2 and 8, and the leftover 1 goes to the larger share.
    expect(distribute(11n, [1n, 4n])).toEqual([2n, 9n]);
  });

  it('is independent of input ordering', () => {
    const a = distribute(1_000_001n, [3n, 5n, 7n]).reduce((x, y) => x + y, 0n);
    const b = distribute(1_000_001n, [7n, 5n, 3n]).reduce((x, y) => x + y, 0n);
    expect(a).toBe(b);
  });

  it('property: parts always sum to the total', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 15n }),
        fc.array(fc.bigInt({ min: 0n, max: 10n ** 6n }), { minLength: 1, maxLength: 8 }),
        (total, weights) => {
          fc.pre(weights.reduce((a, b) => a + b, 0n) > 0n);
          const parts = distribute(total, weights);
          expect(parts.reduce((a, b) => a + b, 0n)).toBe(total);
        },
      ),
    );
  });

  it('rejects empty, negative, and all-zero weights', () => {
    expect(() => distribute(10n, [])).toThrow(RangeError);
    expect(() => distribute(10n, [-1n, 2n])).toThrow(RangeError);
    expect(() => distribute(10n, [0n, 0n])).toThrow(RangeError);
  });
});

describe('abs', () => {
  it('returns magnitude', () => {
    expect(abs(-5n)).toBe(5n);
    expect(abs(5n)).toBe(5n);
    expect(abs(0n)).toBe(0n);
  });
});
