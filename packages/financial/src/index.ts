/**
 * `@garm/financial` — the only module permitted to perform financial
 * arithmetic (SPEC §11).
 *
 * Everything exported here is deterministic, integer-only, and unit tested.
 * No floating point, no `Date.now()`, no I/O. That makes the whole surface
 * exhaustively testable, which is the point: this is the code where a silent
 * bug is most expensive.
 */

export * from './units.js';
export * from './arithmetic.js';
export * from './metal.js';
export * from './pricing.js';
export * from './treasury.js';
export * from './format.js';
