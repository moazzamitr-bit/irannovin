/**
 * Treasury arithmetic: inventory cost basis, net position, platform P&L.
 * SPEC §44–§54.
 *
 * Treasury answers "how much metal should we own, what did it cost, and what is
 * our exposure". Custody answers "where is it". Keeping the two apart is a
 * deliberate architectural boundary (SPEC §55) and this module is strictly the
 * former.
 */

import { abs, floorDiv } from './arithmetic.js';
import {
  microgram,
  rial,
  rialPerGram,
  UG_PER_GRAM,
  type Microgram,
  type Rial,
  type RialPerGram,
} from './units.js';

/**
 * Running weighted-average cost of controlled inventory.
 *
 * Totals are stored and the average is *derived*. Storing the average and
 * mutating it accumulates rounding error on every update; storing the totals
 * cannot drift.
 */
export interface InventoryPosition {
  readonly totalCostRial: Rial;
  readonly totalWeightUg: Microgram;
}

export const EMPTY_INVENTORY: InventoryPosition = {
  totalCostRial: rial(0n),
  totalWeightUg: microgram(0n),
};

/** Weighted average cost, in rial per gram. `null` when there is no inventory to average. */
export function weightedAverageCost(position: InventoryPosition): RialPerGram | null {
  if (position.totalWeightUg <= 0n) {
    return null;
  }
  const perGram = floorDiv(position.totalCostRial * UG_PER_GRAM, position.totalWeightUg);
  return perGram > 0n ? rialPerGram(perGram) : null;
}

/**
 * How metal entered inventory. Both sources feed the same cost-basis pool —
 * economically they are the same event, the platform acquiring metal at a
 * price — but the distinction is retained for procurement reporting and
 * supplier reconciliation (SPEC §57).
 */
export type AcquisitionSource = 'PROCUREMENT' | 'CUSTOMER_SELL';

export interface Acquisition {
  readonly source: AcquisitionSource;
  readonly weightUg: Microgram;
  readonly costRial: Rial;
}

/**
 * Add acquired metal to the cost-basis pool.
 *
 * Customer sell-backs go through here exactly as supplier procurement does. If
 * they did not, the average cost would drift away from what the platform
 * actually paid, and every downstream P&L number would be wrong.
 */
export function acquire(position: InventoryPosition, acquisition: Acquisition): InventoryPosition {
  if (acquisition.weightUg <= 0n) {
    throw new RangeError('acquisition weight must be positive');
  }
  if (acquisition.costRial < 0n) {
    throw new RangeError('acquisition cost must not be negative');
  }
  return {
    totalCostRial: rial(position.totalCostRial + acquisition.costRial),
    totalWeightUg: microgram(position.totalWeightUg + acquisition.weightUg),
  };
}

/** Inventory after metal leaves, with the cost carried out at the average. */
export interface Disposal {
  readonly position: InventoryPosition;
  readonly costOfMetalSoldRial: Rial;
}

/**
 * Remove metal from inventory at weighted-average cost.
 *
 * The cost released is computed from the pre-disposal average, which is what
 * makes the average stable across a disposal: removing metal at its own average
 * cost leaves the average unchanged.
 */
export function dispose(position: InventoryPosition, weightUg: Microgram): Disposal {
  if (weightUg <= 0n) {
    throw new RangeError('disposal weight must be positive');
  }
  if (weightUg > position.totalWeightUg) {
    throw new RangeError('cannot dispose of more metal than is held');
  }
  // Exact when disposing the whole position, so the pool empties cleanly.
  const costOut =
    weightUg === position.totalWeightUg
      ? position.totalCostRial
      : rial(floorDiv(position.totalCostRial * weightUg, position.totalWeightUg));
  return {
    position: {
      totalCostRial: rial(position.totalCostRial - costOut),
      totalWeightUg: microgram(position.totalWeightUg - weightUg),
    },
    costOfMetalSoldRial: rial(costOut),
  };
}

/* ------------------------------------------------------------------ */
/* Net position                                                        */
/* ------------------------------------------------------------------ */

export type PositionDirection = 'LONG' | 'SHORT' | 'FLAT';

export interface NetPosition {
  readonly controlledUg: Microgram;
  readonly customerLiabilityUg: Microgram;
  /** Controlled minus liability. Positive is long, negative is short (SPEC §49). */
  readonly netUg: Microgram;
  readonly direction: PositionDirection;
}

export function netPosition(controlledUg: Microgram, customerLiabilityUg: Microgram): NetPosition {
  const net = controlledUg - customerLiabilityUg;
  return {
    controlledUg,
    customerLiabilityUg,
    netUg: microgram(net),
    direction: net > 0n ? 'LONG' : net < 0n ? 'SHORT' : 'FLAT',
  };
}

/**
 * Metal the platform may still sell.
 *
 * SPEC §51. Every subtracted term is a real claim on inventory: liabilities are
 * already owed to customers, soft reservations are quotes that may still be
 * executed, and the safety buffer is deliberately withheld so that ordinary
 * volatility in demand does not push the platform short.
 */
export function availableToSell(input: {
  controlledUg: Microgram;
  customerLiabilityUg: Microgram;
  openSoftReservationsUg: Microgram;
  safetyBufferUg: Microgram;
  operationalRestrictionsUg?: Microgram;
}): Microgram {
  const restrictions = input.operationalRestrictionsUg ?? microgram(0n);
  const available =
    input.controlledUg -
    input.customerLiabilityUg -
    input.openSoftReservationsUg -
    input.safetyBufferUg -
    restrictions;
  // Never negative: a shortfall is an incident to be surfaced, not a negative
  // capacity number to be arithmetic'd against elsewhere.
  return microgram(available > 0n ? available : 0n);
}

/** Coverage of customer liabilities by controlled metal, in basis points. */
export function coverageRatioBps(
  controlledUg: Microgram,
  customerLiabilityUg: Microgram,
): number | null {
  if (customerLiabilityUg <= 0n) {
    return null;
  }
  return Number(floorDiv(controlledUg * 10_000n, customerLiabilityUg));
}

/* ------------------------------------------------------------------ */
/* Platform P&L                                                        */
/* ------------------------------------------------------------------ */

/**
 * Realised profit on one trade, decomposed.
 *
 * ## Why this is a decomposition and not a sum
 *
 * In a principal (dealer) model, the spread is not a separate revenue stream
 * sitting alongside inventory profit — it is one of the two components that
 * *make up* inventory profit. Booking "spread revenue" and "realised inventory
 * P&L" as independent lines double-counts the same money.
 *
 * The relationship is:
 *
 *     realised = (execution − costBasis) × weight
 *              = (execution − reference) × weight    ← spread component
 *              + (reference − costBasis) × weight    ← inventory component
 *
 * `realised` is computed exactly and `inventory` is derived by subtraction, so
 * `spread + inventory === realised` holds under integer arithmetic, where
 * rounding each of the three independently would not.
 *
 * The split is worth keeping because it answers a real question: did the
 * platform earn this from how it priced, or from what happened to the market
 * while it held the metal? Only the first is repeatable.
 *
 * The explicit trading fee is NOT part of this — it is clean revenue and is
 * accounted separately (SPEC §54).
 */
export interface RealisedPnl {
  readonly weightUg: Microgram;
  readonly costBasis: RialPerGram;
  readonly referencePrice: RialPerGram;
  readonly executionPrice: RialPerGram;
  readonly realisedRial: Rial;
  readonly spreadComponentRial: Rial;
  readonly inventoryComponentRial: Rial;
}

export function realisedPnl(params: {
  weightUg: Microgram;
  costBasis: RialPerGram;
  referencePrice: RialPerGram;
  executionPrice: RialPerGram;
}): RealisedPnl {
  const { weightUg, costBasis, referencePrice, executionPrice } = params;
  if (weightUg < 0n) {
    throw new RangeError('weight must not be negative');
  }
  const realised = floorDiv((executionPrice - costBasis) * weightUg, UG_PER_GRAM);
  const spreadComponent = floorDiv((executionPrice - referencePrice) * weightUg, UG_PER_GRAM);
  return {
    weightUg,
    costBasis,
    referencePrice,
    executionPrice,
    realisedRial: rial(realised),
    spreadComponentRial: rial(spreadComponent),
    // Derived, never independently rounded — this is what makes the parts sum.
    inventoryComponentRial: rial(realised - spreadComponent),
  };
}

/**
 * Mark-to-market on metal still held.
 *
 * A fully-backed platform (SPEC §50, `MaxIntentionalShortPosition = 0`) is long
 * by construction: it must hold inventory ahead of demand. Full backing removes
 * short risk and replaces it with price risk on the unsold buffer. That risk is
 * real money and this is the number that measures it.
 */
export function unrealisedPnl(
  position: InventoryPosition,
  referencePrice: RialPerGram,
): Rial {
  if (position.totalWeightUg <= 0n) {
    return rial(0n);
  }
  const marketValue = floorDiv(referencePrice * position.totalWeightUg, UG_PER_GRAM);
  return rial(marketValue - position.totalCostRial);
}

/** Whether a net position has breached a configured limit. SPEC §50, §79. */
export function exceedsPositionLimit(net: NetPosition, maxAbsoluteUg: Microgram): boolean {
  return abs(net.netUg) > maxAbsoluteUg;
}
