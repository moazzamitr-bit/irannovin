/**
 * `@garm/ledger` — the double-entry financial core. SPEC §33.
 *
 * This is the only module permitted to construct journal entries. An entry that
 * does not balance per asset cannot be built, so it cannot reach the database:
 * the invariant is enforced by construction rather than checked afterwards.
 */

export * from './accounts.js';
export * from './journal.js';
export * from './postings.js';
