/**
 * Canonical financial units. SPEC §10, §11.
 *
 * Every monetary and weight quantity in this system is an integer. There is no
 * floating point anywhere in this package, and no code outside it is permitted
 * to do financial arithmetic (SPEC §11).
 *
 * The brands are compile-time only — they erase to `bigint`/`number` at
 * runtime — but they make it a type error to pass a weight where a price is
 * expected, or to hand a plain `number` to a money function.
 */

declare const brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [brand]: B };

/** Iranian rial. The canonical currency unit. Toman is display-only. */
export type Rial = Branded<bigint, 'Rial'>;

/** Metal weight in micrograms. 1 gram = 1_000_000 µg. */
export type Microgram = Branded<bigint, 'Microgram'>;

/** A metal price expressed in rial per gram. */
export type RialPerGram = Branded<bigint, 'RialPerGram'>;

/** Basis points. 10_000 bps = 100%. Fees and spreads only. */
export type BasisPoints = Branded<number, 'BasisPoints'>;

/** Purity in parts per thousand. 750 = 18 carat, 999 = fine. SPEC §12. */
export type PartsPerThousand = Branded<number, 'PartsPerThousand'>;

export const UG_PER_GRAM = 1_000_000n;
export const RIAL_PER_TOMAN = 10n;
export const BPS_DENOMINATOR = 10_000n;
export const PPT_DENOMINATOR = 1_000n;

export class FinancialValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinancialValueError';
  }
}

function requireInteger(value: bigint | number, label: string): void {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    throw new FinancialValueError(`${label} must be an integer, received ${value}`);
  }
}

/** Construct a rial amount. Negative values are allowed (ledger entries are signed). */
export function rial(value: bigint): Rial {
  return value as Rial;
}

/** Construct a microgram weight. Negative values are allowed (ledger entries are signed). */
export function microgram(value: bigint): Microgram {
  return value as Microgram;
}

/** Construct a price. Prices must be strictly positive — a zero price is never tradable. */
export function rialPerGram(value: bigint): RialPerGram {
  if (value <= 0n) {
    throw new FinancialValueError(`price must be positive, received ${value}`);
  }
  return value as RialPerGram;
}

/** Construct a basis-point rate. Bounded to [0, 10_000] — a fee over 100% is a bug. */
export function basisPoints(value: number): BasisPoints {
  requireInteger(value, 'basisPoints');
  if (value < 0 || value > 10_000) {
    throw new FinancialValueError(`basisPoints must be within [0, 10000], received ${value}`);
  }
  return value as BasisPoints;
}

/** Construct a purity. Bounded to (0, 1000]. */
export function partsPerThousand(value: number): PartsPerThousand {
  requireInteger(value, 'partsPerThousand');
  if (value <= 0 || value > 1_000) {
    throw new FinancialValueError(`partsPerThousand must be within (0, 1000], received ${value}`);
  }
  return value as PartsPerThousand;
}

/** Common purities, named so call sites read as domain language rather than magic numbers. */
export const PURITY = {
  /** 18 carat — the retail Iranian standard. */
  K18: partsPerThousand(750),
  /** The customary assay of Iranian melted gold (طلای آب‌شده). */
  MELTED_705: partsPerThousand(705),
  /** Investment-grade fine gold. */
  FINE_999: partsPerThousand(999),
} as const;
