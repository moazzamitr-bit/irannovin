/**
 * Display formatting. SPEC §10.
 *
 * Presentation only. Nothing here is ever fed back into a calculation — rial
 * and micrograms are the canonical units and they never leave integer form
 * inside the domain.
 */

import { floorDiv } from './arithmetic.js';
import { RIAL_PER_TOMAN, type Rial } from './units.js';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** Group digits in threes with the given separator. */
function group(digits: string, separator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/**
 * Rial to toman for display.
 *
 * Truncates toward zero rather than rounding: a displayed balance is never
 * larger than the real one. Sub-toman rial is not shown — the canonical value
 * in the ledger is unaffected.
 */
export function rialToTomanString(
  amount: Rial,
  options: { separator?: string; persianDigits?: boolean } = {},
): string {
  const { separator = ',', persianDigits = false } = options;
  const negative = amount < 0n;
  const magnitude = negative ? -amount : amount;
  const toman = floorDiv(magnitude, RIAL_PER_TOMAN);
  const grouped = group(toman.toString(), separator);
  const signed = negative ? `-${grouped}` : grouped;
  return persianDigits ? toPersianDigits(signed) : signed;
}

/** Rial rendered as rial, grouped. For back-office surfaces where rial is the unit. */
export function rialString(
  amount: Rial,
  options: { separator?: string; persianDigits?: boolean } = {},
): string {
  const { separator = ',', persianDigits = false } = options;
  const negative = amount < 0n;
  const magnitude = negative ? -amount : amount;
  const grouped = group(magnitude.toString(), separator);
  const signed = negative ? `-${grouped}` : grouped;
  return persianDigits ? toPersianDigits(signed) : signed;
}

/** Basis points as a human percentage string, e.g. 50 → "0.5". */
export function bpsToPercentString(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = Math.abs(bps % 100);
  if (fraction === 0) {
    return String(whole);
  }
  const padded = String(fraction).padStart(2, '0').replace(/0$/, '');
  return `${whole}.${padded}`;
}
