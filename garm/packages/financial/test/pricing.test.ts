import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  applyFee,
  applySpread,
  priceBuyByRial,
  priceSellByWeight,
  rialForWeight,
  weightForRial,
} from '../src/pricing.js';
import { basisPoints, microgram, rial, rialPerGram } from '../src/units.js';

/** 100,000,000 rial per gram — 10,000,000 toman, a realistic 18k gold price. */
const REFERENCE = rialPerGram(100_000_000n);
const FEE = basisPoints(50); // 0.5%
const SPREAD = basisPoints(30); // 0.3%

describe('applySpread', () => {
  it('moves the price against the customer on both sides', () => {
    expect(applySpread(REFERENCE, SPREAD, 'BUY')).toBe(100_300_000n);
    expect(applySpread(REFERENCE, SPREAD, 'SELL')).toBe(99_700_000n);
  });

  it('is a no-op at zero spread', () => {
    expect(applySpread(REFERENCE, basisPoints(0), 'BUY')).toBe(REFERENCE);
    expect(applySpread(REFERENCE, basisPoints(0), 'SELL')).toBe(REFERENCE);
  });

  it('property: buy price >= reference >= sell price', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        fc.integer({ min: 0, max: 9_000 }),
        (price, bps) => {
          const reference = rialPerGram(price);
          const spread = basisPoints(bps);
          expect(applySpread(reference, spread, 'BUY') >= reference).toBe(true);
          expect(applySpread(reference, spread, 'SELL') <= reference).toBe(true);
        },
      ),
    );
  });

  it('rejects a spread that would drive the price non-positive', () => {
    expect(() => applySpread(rialPerGram(100n), basisPoints(10_000), 'SELL')).toThrow(RangeError);
  });
});

describe('applyFee', () => {
  it('carves the fee and leaves the remainder, summing to gross', () => {
    const { part, rest, total } = applyFee(rial(10_000_000n), FEE);
    expect(part).toBe(50_000n);
    expect(rest).toBe(9_950_000n);
    expect(part + rest).toBe(total);
  });

  it('property: fee + net === gross, always', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 18n }),
        fc.integer({ min: 0, max: 10_000 }),
        (gross, bps) => {
          const s = applyFee(rial(gross), basisPoints(bps));
          expect(s.part + s.rest).toBe(gross);
        },
      ),
    );
  });
});

describe('weight and rial conversion', () => {
  it('converts a weight to its rial value', () => {
    expect(rialForWeight(REFERENCE, microgram(1_000_000n))).toBe(100_000_000n);
    expect(rialForWeight(REFERENCE, microgram(3_241_000n))).toBe(324_100_000n);
  });

  it('converts a rial amount to weight', () => {
    expect(weightForRial(REFERENCE, rial(100_000_000n))).toBe(1_000_000n);
  });

  it('property: round-tripping rial through weight never manufactures value', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 15n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (amount, price) => {
          const p = rialPerGram(price);
          const weight = weightForRial(p, rial(amount), 'floor');
          expect(rialForWeight(p, weight, 'floor') <= amount).toBe(true);
        },
      ),
    );
  });
});

describe('priceBuyByRial', () => {
  const trade = priceBuyByRial({
    referencePrice: REFERENCE,
    spreadBps: SPREAD,
    feeBps: FEE,
    grossRial: rial(100_000_000n), // 10,000,000 toman
  });

  it('takes the fee off the top and converts the remainder', () => {
    expect(trade.feeRial).toBe(500_000n);
    expect(trade.netRial).toBe(99_500_000n);
    expect(trade.feeRial + trade.netRial).toBe(trade.grossRial);
  });

  it('executes above the reference price', () => {
    expect(trade.executionPrice).toBe(100_300_000n);
    expect(trade.executionPrice > trade.referencePrice).toBe(true);
  });

  it('delivers weight backed by the net amount', () => {
    // 99,500,000 rial at 100,300,000 rial/g = 0.99202392… g, floored.
    expect(trade.weightUg).toBe(992_023n);
  });

  it('leaves a conversion residual smaller than one microgram of value', () => {
    // The residual is economic, not a ledger imbalance — but it must stay tiny.
    expect(trade.conversionResidualRial >= 0n).toBe(true);
    expect(trade.conversionResidualRial < trade.executionPrice / 1_000_000n + 1n).toBe(true);
  });

  it('property: never delivers metal worth more than the customer paid', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 15n }),
        fc.bigInt({ min: 1_000n, max: 10n ** 12n }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (gross, price, feeBps, spreadBps) => {
          const t = priceBuyByRial({
            referencePrice: rialPerGram(price),
            spreadBps: basisPoints(spreadBps),
            feeBps: basisPoints(feeBps),
            grossRial: rial(gross),
          });
          expect(t.feeRial + t.netRial).toBe(t.grossRial);
          expect(t.conversionResidualRial >= 0n).toBe(true);
          expect(rialForWeight(t.executionPrice, t.weightUg) <= t.netRial).toBe(true);
        },
      ),
    );
  });
});

describe('priceSellByWeight', () => {
  const trade = priceSellByWeight({
    referencePrice: REFERENCE,
    spreadBps: SPREAD,
    feeBps: FEE,
    weightUg: microgram(1_000_000n),
  });

  it('executes below the reference price', () => {
    expect(trade.executionPrice).toBe(99_700_000n);
    expect(trade.executionPrice < trade.referencePrice).toBe(true);
  });

  it('carves the fee out of gross proceeds', () => {
    expect(trade.grossRial).toBe(99_700_000n);
    expect(trade.feeRial).toBe(498_500n);
    expect(trade.netRial).toBe(99_201_500n);
    expect(trade.feeRial + trade.netRial).toBe(trade.grossRial);
  });

  it('round-trips a buy then sell at an unchanged reference into a loss for the customer', () => {
    // Buying and immediately selling costs two fees plus two half-spreads.
    // Anything else would mean the platform is paying customers to churn.
    const bought = priceBuyByRial({
      referencePrice: REFERENCE,
      spreadBps: SPREAD,
      feeBps: FEE,
      grossRial: rial(1_000_000_000n),
    });
    const sold = priceSellByWeight({
      referencePrice: REFERENCE,
      spreadBps: SPREAD,
      feeBps: FEE,
      weightUg: bought.weightUg,
    });
    expect(sold.netRial < bought.grossRial).toBe(true);
  });
});
