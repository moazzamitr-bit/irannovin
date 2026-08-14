/**
 * Ledger account model. SPEC §33, §35.
 *
 * Accounts exist for customers *and* for the platform. That is what makes the
 * ledger double-entry: when a customer buys gold, the rial has a recorded
 * destination and the metal has a recorded source. Without platform accounts
 * the books never balance and correctness cannot be proven.
 */

export type AssetCode = 'IRR' | 'GOLD' | 'SILVER' | 'COPPER' | 'TEST_METAL';

/** Assets that are money rather than metal. Determines which unit applies. */
export const MONETARY_ASSETS: ReadonlySet<AssetCode> = new Set<AssetCode>(['IRR']);

export function isMonetary(asset: AssetCode): boolean {
  return MONETARY_ASSETS.has(asset);
}

export type CustomerAccountKind =
  /** Spendable. */
  | 'AVAILABLE'
  /** Committed to an in-flight operation — a withdrawal in transit, metal
   *  reserved for redemption. Still the customer's, not yet moved. */
  | 'PENDING'
  /** Locked against an obligation, e.g. future credit collateral. */
  | 'RESERVED';

export type PlatformAccountKind =
  /** Metal the platform controls and may sell. */
  | 'INVENTORY'
  /** Metal owed to customers. The mirror of every customer metal balance. */
  | 'CUSTOMER_LIABILITY'
  /** Rial held on the platform's own book. */
  | 'CLEARING'
  /** Explicit trading fees. The one clean revenue line (SPEC §54). */
  | 'FEE_REVENUE'
  /** Absorbs sub-unit remainders from same-asset splits so nothing is lost. */
  | 'ROUNDING'
  /** In flight at the payment provider — neither the customer's nor settled. */
  | 'PAYMENT_GATEWAY_CLEARING'
  /** Submitted to the bank, not yet confirmed settled. */
  | 'BANK_SETTLEMENT_CLEARING'
  /** Control account mirroring what the custodian reports holding. */
  | 'CUSTODY_CONTROL'
  /**
   * The boundary with approved suppliers.
   *
   * Because the ledger balances *per asset*, buying metal with rial cannot
   * balance within one entry unless each side has a counterpart. This account
   * is that counterpart: metal enters inventory from here, and the rial owed
   * for it leaves through here.
   */
  | 'SUPPLIER_CLEARING'
  /**
   * Metal owed to customers that the platform does not currently control.
   * Should be zero. A non-zero balance is an incident, not a business
   * position (SPEC §31, §50).
   */
  | 'OPERATIONAL_DEFICIT';

export type AccountRef =
  | { readonly owner: 'CUSTOMER'; readonly userId: string; readonly asset: AssetCode; readonly kind: CustomerAccountKind }
  | { readonly owner: 'PLATFORM'; readonly asset: AssetCode; readonly kind: PlatformAccountKind };

export function customerAccount(
  userId: string,
  asset: AssetCode,
  kind: CustomerAccountKind = 'AVAILABLE',
): AccountRef {
  return { owner: 'CUSTOMER', userId, asset, kind };
}

export function platformAccount(asset: AssetCode, kind: PlatformAccountKind): AccountRef {
  return { owner: 'PLATFORM', asset, kind };
}

/** Stable string key for an account, used for lookup and equality. */
export function accountKey(ref: AccountRef): string {
  return ref.owner === 'CUSTOMER'
    ? `customer:${ref.userId}:${ref.asset}:${ref.kind}`
    : `platform:${ref.asset}:${ref.kind}`;
}

export function sameAccount(a: AccountRef, b: AccountRef): boolean {
  return accountKey(a) === accountKey(b);
}
