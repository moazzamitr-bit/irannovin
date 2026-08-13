import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  acquire,
  availableToSell,
  coverageRatioBps,
  dispose,
  EMPTY_INVENTORY,
  exceedsPositionLimit,
  netPosition,
  realisedPnl,
  unrealisedPnl,
  weightedAverageCost,
} from '../src/treasury.js';
import { microgram, rial, rialPerGram } from '../src/units.js';

describe('inventory cost basis', () => {
  it('has no average when empty', () => {
    expect(weightedAverageCost(EMPTY_INVENTORY)).toBeNull();
  });

  it('averages procurement lots by weight', () => {
    // 1 g at 100M, then 3 g at 120M → average 115M rial/g.
    let inv = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(1_000_000n),
      costRial: rial(100_000_000n),
    });
    inv = acquire(inv, {
      source: 'PROCUREMENT',
      weightUg: microgram(3_000_000n),
      costRial: rial(360_000_000n),
    });
    expect(weightedAverageCost(inv)).toBe(115_000_000n);
  });

  it('folds customer sell-backs into the same pool as procurement', () => {
    // Metal bought back from a customer is metal the platform acquired at a
    // price. Excluding it would make the average diverge from what was paid.
    const procured = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(1_000_000n),
      costRial: rial(100_000_000n),
    });
    const withBuyback = acquire(procured, {
      source: 'CUSTOMER_SELL',
      weightUg: microgram(1_000_000n),
      costRial: rial(98_000_000n),
    });
    expect(weightedAverageCost(withBuyback)).toBe(99_000_000n);
  });

  it('leaves the average unchanged when metal is disposed of', () => {
    const inv = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(4_000_000n),
      costRial: rial(460_000_000n),
    });
    const before = weightedAverageCost(inv);
    const { position } = dispose(inv, microgram(1_000_000n));
    expect(weightedAverageCost(position)).toBe(before);
  });

  it('empties exactly when the whole position is disposed of', () => {
    const inv = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(3_333_333n),
      costRial: rial(333_333_337n),
    });
    const { position, costOfMetalSoldRial } = dispose(inv, inv.totalWeightUg);
    expect(position.totalWeightUg).toBe(0n);
    expect(position.totalCostRial).toBe(0n);
    expect(costOfMetalSoldRial).toBe(333_333_337n);
  });

  it('refuses to dispose of more than is held', () => {
    const inv = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(1_000n),
      costRial: rial(100n),
    });
    expect(() => dispose(inv, microgram(1_001n))).toThrow(RangeError);
  });

  it('property: cost and weight never go negative across acquire/dispose', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            weight: fc.bigInt({ min: 1n, max: 10n ** 9n }),
            cost: fc.bigInt({ min: 0n, max: 10n ** 15n }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (lots) => {
          let inv = EMPTY_INVENTORY;
          for (const lot of lots) {
            inv = acquire(inv, {
              source: 'PROCUREMENT',
              weightUg: microgram(lot.weight),
              costRial: rial(lot.cost),
            });
          }
          const { position, costOfMetalSoldRial } = dispose(
            inv,
            microgram(inv.totalWeightUg / 2n > 0n ? inv.totalWeightUg / 2n : inv.totalWeightUg),
          );
          expect(position.totalWeightUg >= 0n).toBe(true);
          expect(position.totalCostRial >= 0n).toBe(true);
          expect(costOfMetalSoldRial <= inv.totalCostRial).toBe(true);
        },
      ),
    );
  });
});

describe('net position', () => {
  it('is long when controlled metal exceeds liability', () => {
    const p = netPosition(microgram(10_500_000_000n), microgram(10_000_000_000n));
    expect(p.netUg).toBe(500_000_000n);
    expect(p.direction).toBe('LONG');
  });

  it('is short when liability exceeds controlled metal', () => {
    const p = netPosition(microgram(9_800_000_000n), microgram(10_000_000_000n));
    expect(p.netUg).toBe(-200_000_000n);
    expect(p.direction).toBe('SHORT');
  });

  it('is flat when they match', () => {
    expect(netPosition(microgram(1n), microgram(1n)).direction).toBe('FLAT');
  });

  it('detects a breach of the configured limit in either direction', () => {
    const limit = microgram(100_000n);
    expect(exceedsPositionLimit(netPosition(microgram(200_000n), microgram(0n)), limit)).toBe(true);
    expect(exceedsPositionLimit(netPosition(microgram(0n), microgram(200_000n)), limit)).toBe(true);
    expect(exceedsPositionLimit(netPosition(microgram(50_000n), microgram(0n)), limit)).toBe(false);
  });
});

describe('availableToSell', () => {
  it('subtracts every real claim on inventory', () => {
    const available = availableToSell({
      controlledUg: microgram(10_000_000_000n),
      customerLiabilityUg: microgram(8_000_000_000n),
      openSoftReservationsUg: microgram(500_000_000n),
      safetyBufferUg: microgram(200_000_000n),
    });
    expect(available).toBe(1_300_000_000n);
  });

  it('floors at zero rather than reporting negative capacity', () => {
    const available = availableToSell({
      controlledUg: microgram(1_000n),
      customerLiabilityUg: microgram(5_000n),
      openSoftReservationsUg: microgram(0n),
      safetyBufferUg: microgram(0n),
    });
    expect(available).toBe(0n);
  });

  it('property: never exceeds controlled metal', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        (controlled, liability, reserved, buffer) => {
          const available = availableToSell({
            controlledUg: microgram(controlled),
            customerLiabilityUg: microgram(liability),
            openSoftReservationsUg: microgram(reserved),
            safetyBufferUg: microgram(buffer),
          });
          expect(available >= 0n).toBe(true);
          expect(available <= controlled).toBe(true);
        },
      ),
    );
  });
});

describe('coverageRatioBps', () => {
  it('reports full backing as 10000 bps', () => {
    expect(coverageRatioBps(microgram(1_000n), microgram(1_000n))).toBe(10_000);
  });

  it('reports a shortfall below 10000 bps', () => {
    expect(coverageRatioBps(microgram(980n), microgram(1_000n))).toBe(9_800);
  });

  it('is undefined with no liabilities rather than dividing by zero', () => {
    expect(coverageRatioBps(microgram(1_000n), microgram(0n))).toBeNull();
  });
});

describe('realisedPnl decomposition', () => {
  const base = {
    weightUg: microgram(1_000_000n),
    costBasis: rialPerGram(98_000_000n),
    referencePrice: rialPerGram(100_000_000n),
    executionPrice: rialPerGram(100_300_000n),
  };

  it('splits profit into a spread component and an inventory component', () => {
    const pnl = realisedPnl(base);
    // Sold 1 g at 100.3M that cost 98M → 2.3M realised.
    expect(pnl.realisedRial).toBe(2_300_000n);
    // Of which 0.3M came from pricing, and 2M from the market moving while held.
    expect(pnl.spreadComponentRial).toBe(300_000n);
    expect(pnl.inventoryComponentRial).toBe(2_000_000n);
  });

  it('reports a loss when the market fell below cost', () => {
    const pnl = realisedPnl({
      ...base,
      referencePrice: rialPerGram(95_000_000n),
      executionPrice: rialPerGram(95_285_000n),
    });
    expect(pnl.realisedRial).toBe(-2_715_000n);
    expect(pnl.spreadComponentRial).toBe(285_000n);
    expect(pnl.inventoryComponentRial).toBe(-3_000_000n);
  });

  it('property: the components always sum to the realised total', () => {
    // This is the invariant that stops spread revenue being double-counted
    // alongside inventory P&L. Independent rounding of three quantities would
    // break it; deriving the third by subtraction cannot.
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 12n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (weight, cost, reference, execution) => {
          const pnl = realisedPnl({
            weightUg: microgram(weight),
            costBasis: rialPerGram(cost),
            referencePrice: rialPerGram(reference),
            executionPrice: rialPerGram(execution),
          });
          expect(pnl.spreadComponentRial + pnl.inventoryComponentRial).toBe(pnl.realisedRial);
        },
      ),
    );
  });

  it('rejects a negative weight', () => {
    expect(() => realisedPnl({ ...base, weightUg: microgram(-1n) })).toThrow(RangeError);
  });
});

describe('unrealisedPnl', () => {
  it('is zero with no inventory', () => {
    expect(unrealisedPnl(EMPTY_INVENTORY, rialPerGram(100_000_000n))).toBe(0n);
  });

  it('measures the price risk carried on the unsold buffer', () => {
    // Full backing removes short risk and replaces it with this.
    const inv = acquire(EMPTY_INVENTORY, {
      source: 'PROCUREMENT',
      weightUg: microgram(10_000_000n),
      costRial: rial(1_000_000_000n),
    });
    expect(unrealisedPnl(inv, rialPerGram(105_000_000n))).toBe(50_000_000n);
    expect(unrealisedPnl(inv, rialPerGram(95_000_000n))).toBe(-50_000_000n);
  });
});
