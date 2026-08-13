/**
 * Price, spread, and fee arithmetic. SPEC §22–§26, §43.
 *
 * A price here is always rial per gram, on the weight basis of the asset it
 * belongs to. Mixing a 705-basis price with an 18k-basis weight is the kind of
 * error `metal.ts` exists to make impossible, so conversions happen there and
 * never implicitly here.
 */

import { divide, split, type RoundingMode, type Split } from './arithmetic.js';
import {
  BPS_DENOMINATOR,
  microgram,
  rial,
  rialPerGram,
  UG_PER_GRAM,
  type BasisPoints,
  type Microgram,
  type Rial,
  type RialPerGram,
} from './units.js';

export type TradeSide = 'BUY' | 'SELL';

/** Rial value of a weight at a price. */
export function rialForWeight(
  price: RialPerGram,
  weightUg: Microgram,
  mode: RoundingMode = 'floor',
): Rial {
  return rial(divide(price * weightUg, UG_PER_GRAM, mode));
}

/** Weight purchasable with a rial amount at a price. */
export function weightForRial(
  price: RialPerGram,
  amount: Rial,
  mode: RoundingMode = 'floor',
): Microgram {
  return microgram(divide(amount * UG_PER_GRAM, price, mode));
}

/**
 * Apply the platform spread to a reference price, producing the executable
 * price for one side of the market.
 *
 * The customer is always on the unfavourable side of the spread: they buy above
 * reference and sell below it. That is the dealer model stated plainly — it is
 * not hidden, and SPEC §73 requires both prices be shown on every transaction.
 */
export function applySpread(
  reference: RialPerGram,
  spreadBps: BasisPoints,
  side: TradeSide,
): RialPerGram {
  const delta = divide(reference * BigInt(spreadBps), BPS_DENOMINATOR, side === 'BUY' ? 'ceil' : 'floor');
  const executed = side === 'BUY' ? reference + delta : reference - delta;
  if (executed <= 0n) {
    throw new RangeError('spread produced a non-positive execution price');
  }
  return rialPerGram(executed);
}

/**
 * Carve a fee out of a gross amount.
 *
 * Returns a `Split`, so `fee + net === gross` holds by construction and the
 * journal balances without a rounding line (SPEC §37).
 */
export function applyFee(gross: Rial, feeBps: BasisPoints): Split {
  return split(gross, BigInt(feeBps), BPS_DENOMINATOR);
}

/** The priced result of a buy or sell, ready to become a Quote (SPEC §25). */
export interface PricedTrade {
  readonly side: TradeSide;
  readonly referencePrice: RialPerGram;
  readonly executionPrice: RialPerGram;
  readonly grossRial: Rial;
  readonly feeRial: Rial;
  readonly netRial: Rial;
  readonly weightUg: Microgram;
  /**
   * Rial value of `weightUg` at the execution price, versus the rial actually
   * exchanged. Non-zero only because weight is an integer number of
   * micrograms.
   *
   * This is an economic residual, not a ledger imbalance: the ledger balances
   * per asset, and both the rial legs and the metal legs of this trade are
   * exact. Surfaced so the transparency requirements of SPEC §73 and §96 can
   * be met and so tests can bound it.
   */
  readonly conversionResidualRial: Rial;
}

/**
 * Price a BUY where the customer specifies what they want to spend.
 *
 * The fee is taken off the top; the remainder converts to metal. Weight is
 * floored, so the platform never delivers metal it was not paid for — the
 * residual stays under one microgram's worth of rial.
 */
export function priceBuyByRial(params: {
  referencePrice: RialPerGram;
  spreadBps: BasisPoints;
  feeBps: BasisPoints;
  grossRial: Rial;
}): PricedTrade {
  const executionPrice = applySpread(params.referencePrice, params.spreadBps, 'BUY');
  const { part: feeRial, rest: netRial } = applyFee(params.grossRial, params.feeBps);
  const weightUg = weightForRial(executionPrice, rial(netRial), 'floor');
  const valued = rialForWeight(executionPrice, weightUg, 'floor');
  return {
    side: 'BUY',
    referencePrice: params.referencePrice,
    executionPrice,
    grossRial: params.grossRial,
    feeRial: rial(feeRial),
    netRial: rial(netRial),
    weightUg,
    conversionResidualRial: rial(netRial - valued),
  };
}

/**
 * Price a SELL where the customer specifies the weight they want to sell.
 *
 * Gross proceeds are the metal's value at the execution price; the fee is then
 * carved out of that, so the customer receives `net`.
 */
export function priceSellByWeight(params: {
  referencePrice: RialPerGram;
  spreadBps: BasisPoints;
  feeBps: BasisPoints;
  weightUg: Microgram;
}): PricedTrade {
  const executionPrice = applySpread(params.referencePrice, params.spreadBps, 'SELL');
  const grossRial = rialForWeight(executionPrice, params.weightUg, 'floor');
  const { part: feeRial, rest: netRial } = applyFee(grossRial, params.feeBps);
  return {
    side: 'SELL',
    referencePrice: params.referencePrice,
    executionPrice,
    grossRial,
    feeRial: rial(feeRial),
    netRial: rial(netRial),
    weightUg: params.weightUg,
    conversionResidualRial: rial(0n),
  };
}
