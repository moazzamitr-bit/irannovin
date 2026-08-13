/**
 * Metal weight, purity, and weight basis. SPEC §10, §12.
 *
 * ## Why this module exists
 *
 * "3.241 grams of gold" is ambiguous until two things are pinned down:
 *
 *   1. **Purity** — Iranian melted gold (طلای آب‌شده) is customarily assayed at
 *      705, retail gold is 18 carat (750), investment bars are 999. A gram of
 *      one is not a gram of another.
 *   2. **Weight basis** — is the number the *fine* metal content, or the
 *      *gross* weight of the alloy? They differ by the purity factor: 1 g of
 *      18k gold is 0.750 g fine.
 *
 * A platform that stores a bare `weight_ug` without declaring both will
 * eventually hand a customer a different quantity of physical metal than they
 * believe they own. The two are reconciled here, once, explicitly.
 *
 * ## Storage convention
 *
 * Balances are stored on the basis declared by the asset. Converting between
 * bases is always explicit and always names its rounding direction — there is
 * no implicit conversion anywhere in this package.
 */

import { ceilDiv, floorDiv, type RoundingMode } from './arithmetic.js';
import {
  microgram,
  PPT_DENOMINATOR,
  UG_PER_GRAM,
  type Microgram,
  type PartsPerThousand,
} from './units.js';

/** Whether a weight counts pure metal content or the whole alloy. */
export type WeightBasis = 'FINE' | 'GROSS';

/** Which market the reference price is taken from. Affects how a quote is derived. */
export type ReferenceMarket = 'DOMESTIC_MELTED' | 'SPOT_DERIVED';

/**
 * A tradable asset. The financial core is generic over this — nothing below
 * knows the difference between gold and the staging-only TEST_METAL
 * (SPEC §13).
 */
export interface AssetDefinition {
  readonly code: string;
  readonly purity: PartsPerThousand;
  readonly weightBasis: WeightBasis;
  readonly referenceMarket: ReferenceMarket;
  /** Smallest tradable weight increment, in the asset's own basis. */
  readonly weightIncrementUg: bigint;
}

/** Fine metal content of a gross alloy weight: `gross × purity / 1000`. */
export function fineFromGross(
  grossUg: Microgram,
  purity: PartsPerThousand,
  mode: RoundingMode = 'floor',
): Microgram {
  const numerator = grossUg * BigInt(purity);
  return microgram(
    mode === 'floor' ? floorDiv(numerator, PPT_DENOMINATOR) : ceilDiv(numerator, PPT_DENOMINATOR),
  );
}

/**
 * Gross alloy weight containing a given fine content: `fine × 1000 / purity`.
 *
 * Defaults to flooring. At redemption this is the conservative direction: the
 * platform never promises a physical piece larger than the customer's fine
 * holding actually backs.
 */
export function grossFromFine(
  fineUg: Microgram,
  purity: PartsPerThousand,
  mode: RoundingMode = 'floor',
): Microgram {
  const numerator = fineUg * PPT_DENOMINATOR;
  const denominator = BigInt(purity);
  return microgram(mode === 'floor' ? floorDiv(numerator, denominator) : ceilDiv(numerator, denominator));
}

/**
 * Convert a weight between two purities, holding fine content constant.
 *
 * This is the conversion that matters when a customer holding a balance priced
 * off 705 melted gold asks to redeem an 18-carat piece.
 */
export function convertPurity(
  weightUg: Microgram,
  from: PartsPerThousand,
  to: PartsPerThousand,
  mode: RoundingMode = 'floor',
): Microgram {
  const fine = fineFromGross(weightUg, from, mode);
  return grossFromFine(fine, to, mode);
}

/** Round a weight down to a whole multiple of the asset's tradable increment. */
export function roundToIncrement(weightUg: Microgram, incrementUg: bigint): Microgram {
  if (incrementUg <= 0n) {
    throw new RangeError('increment must be positive');
  }
  return microgram(floorDiv(weightUg, incrementUg) * incrementUg);
}

/**
 * Render a weight in grams for display.
 *
 * Presentation only — never feed the result back into a calculation. Truncates
 * rather than rounds, so a displayed balance is never larger than the real one.
 */
export function formatGrams(weightUg: Microgram, decimals = 3): string {
  if (decimals < 0 || decimals > 6) {
    throw new RangeError('decimals must be within [0, 6]');
  }
  const negative = weightUg < 0n;
  const magnitude = negative ? -weightUg : weightUg;
  const whole = magnitude / UG_PER_GRAM;
  const fraction = magnitude % UG_PER_GRAM;
  const sign = negative ? '-' : '';
  if (decimals === 0) {
    return `${sign}${whole}`;
  }
  const padded = fraction.toString().padStart(6, '0').slice(0, decimals);
  return `${sign}${whole}.${padded}`;
}
