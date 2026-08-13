import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  convertPurity,
  fineFromGross,
  formatGrams,
  grossFromFine,
  roundToIncrement,
} from '../src/metal.js';
import { microgram, partsPerThousand, PURITY } from '../src/units.js';

describe('purity conversion', () => {
  it('computes fine content of 18 carat gold', () => {
    // 1 gram of 750 gold contains 0.750 g of fine gold.
    expect(fineFromGross(microgram(1_000_000n), PURITY.K18)).toBe(750_000n);
  });

  it('computes fine content of melted 705 gold', () => {
    expect(fineFromGross(microgram(1_000_000n), PURITY.MELTED_705)).toBe(705_000n);
  });

  it('computes the gross weight backing a fine holding', () => {
    // 0.750 g fine is exactly 1 g of 18 carat.
    expect(grossFromFine(microgram(750_000n), PURITY.K18)).toBe(1_000_000n);
  });

  it('floors gross-from-fine by default so redemption never over-promises', () => {
    // 1 µg fine backs 1.333… µg of 18k; the customer is credited 1 µg, not 2.
    expect(grossFromFine(microgram(1n), PURITY.K18)).toBe(1n);
    expect(grossFromFine(microgram(1n), PURITY.K18, 'ceil')).toBe(2n);
  });

  it('converts a 705 balance into the 18 carat weight it backs', () => {
    // 10 g of 705 melted gold is 7.05 g fine, which is 9.4 g of 18 carat.
    const asK18 = convertPurity(microgram(10_000_000n), PURITY.MELTED_705, PURITY.K18);
    expect(asK18).toBe(9_400_000n);
  });

  it('round-trips without gain', () => {
    // Converting out and back may lose a sub-microgram to flooring, but must
    // never manufacture metal.
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 12n }), (ug) => {
        const there = convertPurity(microgram(ug), PURITY.MELTED_705, PURITY.K18);
        const back = convertPurity(there, PURITY.K18, PURITY.MELTED_705);
        expect(back <= ug).toBe(true);
      }),
    );
  });

  it('property: fine content never exceeds gross weight', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 15n }),
        fc.integer({ min: 1, max: 1000 }),
        (ug, ppt) => {
          const fine = fineFromGross(microgram(ug), partsPerThousand(ppt));
          expect(fine <= ug).toBe(true);
        },
      ),
    );
  });

  it('rejects out-of-range purity', () => {
    expect(() => partsPerThousand(0)).toThrow();
    expect(() => partsPerThousand(1001)).toThrow();
    expect(() => partsPerThousand(750.5)).toThrow();
  });
});

describe('roundToIncrement', () => {
  it('rounds down to the tradable increment', () => {
    expect(roundToIncrement(microgram(1_234_567n), 1_000n)).toBe(1_234_000n);
  });

  it('leaves exact multiples untouched', () => {
    expect(roundToIncrement(microgram(1_234_000n), 1_000n)).toBe(1_234_000n);
  });

  it('rejects a non-positive increment', () => {
    expect(() => roundToIncrement(microgram(1n), 0n)).toThrow(RangeError);
  });
});

describe('formatGrams', () => {
  it('renders micrograms as grams', () => {
    expect(formatGrams(microgram(3_241_000n))).toBe('3.241');
    expect(formatGrams(microgram(1_000_000n))).toBe('1.000');
    expect(formatGrams(microgram(500n), 6)).toBe('0.000500');
  });

  it('truncates rather than rounding, so a display never overstates a balance', () => {
    expect(formatGrams(microgram(3_241_999n))).toBe('3.241');
  });

  it('handles zero decimals and negatives', () => {
    expect(formatGrams(microgram(3_900_000n), 0)).toBe('3');
    expect(formatGrams(microgram(-3_241_000n))).toBe('-3.241');
  });

  it('rejects an out-of-range precision', () => {
    expect(() => formatGrams(microgram(1n), 7)).toThrow(RangeError);
  });
});
