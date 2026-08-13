/**
 * Admin roles and permissions. SPEC §63, §64, §65.
 *
 * ## The rule that shapes this file
 *
 * **No role, including SUPER_ADMIN, may edit a balance** (SPEC §64). There is no
 * `balance:edit` permission in the enum at all — the capability is absent from
 * the type system, so it cannot be granted by a configuration mistake, a
 * migration, or a well-meaning patch. A balance changes only through a posted
 * journal entry, and a correction goes through the maker-checker adjustment
 * workflow (SPEC §65).
 *
 * A test asserts this and will fail if anyone adds such a permission.
 */

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'TREASURY'
  | 'COMPLIANCE'
  | 'KYC_REVIEWER'
  | 'SUPPORT'
  | 'SECURITY_AUDITOR'
  | 'INCIDENT_COMMANDER';

export type Permission =
  // Customers
  | 'user:read'
  | 'user:search'
  | 'user:restrict'
  // KYC
  | 'kyc:read'
  | 'kyc:review'
  // Trading and market configuration
  | 'trade:read'
  | 'pricing:configure'
  | 'fee:configure'
  | 'trading_session:configure'
  // Treasury
  | 'treasury:read'
  | 'procurement:read'
  | 'procurement:create'
  | 'procurement:approve'
  // Money movement
  | 'payment:read'
  | 'withdrawal:read'
  | 'withdrawal:approve'
  // Corrections — proposing and approving are separate permissions so that
  // maker-checker cannot be satisfied by one person holding both.
  | 'adjustment:propose'
  | 'adjustment:approve'
  // Reconciliation
  | 'reconciliation:read'
  | 'reconciliation:resolve'
  // Emergency
  | 'killswitch:activate'
  | 'incident:manage'
  // Oversight
  | 'audit:read'
  | 'compliance:review'
  | 'support:respond'
  // Administration
  | 'admin:manage_roles';

const ROLE_PERMISSIONS: Readonly<Record<AdminRole, readonly Permission[]>> = {
  SUPER_ADMIN: [
    'user:read',
    'user:search',
    'user:restrict',
    'kyc:read',
    'trade:read',
    'treasury:read',
    'procurement:read',
    'payment:read',
    'withdrawal:read',
    'reconciliation:read',
    'audit:read',
    'admin:manage_roles',
    'killswitch:activate',
  ],
  OPERATIONS: [
    'user:read',
    'user:search',
    'kyc:read',
    'trade:read',
    'payment:read',
    'withdrawal:read',
    'reconciliation:read',
    'trading_session:configure',
    'killswitch:activate',
    'incident:manage',
  ],
  FINANCE: [
    'trade:read',
    'payment:read',
    'withdrawal:read',
    'withdrawal:approve',
    'reconciliation:read',
    'reconciliation:resolve',
    'adjustment:propose',
    // FINANCE holds both halves of maker-checker, but never for one request:
    // `evaluateAdjustment` rejects self-approval, so two people are always
    // required.
    'adjustment:approve',
    'fee:configure',
  ],
  TREASURY: [
    'treasury:read',
    'procurement:read',
    'procurement:create',
    'procurement:approve',
    'pricing:configure',
    'reconciliation:read',
    'killswitch:activate',
  ],
  COMPLIANCE: [
    'user:read',
    'user:search',
    'user:restrict',
    'kyc:read',
    'compliance:review',
    'audit:read',
    // An approver outside the finance line, so a correction can always be
    // checked by someone with no stake in the numbers.
    'adjustment:approve',
  ],
  KYC_REVIEWER: ['kyc:read', 'kyc:review', 'user:read'],
  SUPPORT: ['user:read', 'user:search', 'trade:read', 'support:respond'],
  SECURITY_AUDITOR: ['audit:read', 'user:read', 'trade:read', 'treasury:read', 'reconciliation:read'],
  INCIDENT_COMMANDER: ['killswitch:activate', 'incident:manage', 'treasury:read', 'trade:read'],
};

/**
 * SUPER_ADMIN is deliberately not omnipotent.
 *
 * It cannot approve adjustments, approve withdrawals, or resolve reconciliation
 * items. Those are the actions that move money, and separating them from the
 * account that manages roles is what stops a single compromised credential from
 * both granting itself power and using it.
 */
export function can(role: AdminRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function canAny(roles: readonly AdminRole[], permission: Permission): boolean {
  return roles.some((role) => can(role, permission));
}

export function permissionsFor(roles: readonly AdminRole[]): Permission[] {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      granted.add(permission);
    }
  }
  return [...granted].sort();
}

/** Every permission the system defines. Used by the test that guards SPEC §64. */
export function allPermissions(): Permission[] {
  return [...new Set(Object.values(ROLE_PERMISSIONS).flat())].sort();
}

export const ALL_ROLES: readonly AdminRole[] = Object.keys(ROLE_PERMISSIONS) as AdminRole[];

/* ------------------------------------------------------------------ */
/* Maker-checker                                                       */
/* ------------------------------------------------------------------ */

export interface AdjustmentRequest {
  readonly id: string;
  readonly proposedBy: string;
  readonly reason: string;
  readonly evidenceRef: string;
  readonly approvedBy: string | null;
}

export type AdjustmentDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: 'SAME_PERSON' | 'MISSING_PERMISSION' | 'MISSING_REASON' | 'MISSING_EVIDENCE';
    };

/**
 * Whether a financial adjustment may be posted. SPEC §65.
 *
 * The self-approval check is the point of the whole workflow: an adjustment
 * approved by the person who proposed it is not maker-checker, it is a single
 * point of failure with extra paperwork.
 */
export function evaluateAdjustment(
  request: AdjustmentRequest,
  approver: { readonly id: string; readonly roles: readonly AdminRole[] },
): AdjustmentDecision {
  if (request.reason.trim().length === 0) {
    return { allowed: false, reason: 'MISSING_REASON' };
  }
  if (request.evidenceRef.trim().length === 0) {
    return { allowed: false, reason: 'MISSING_EVIDENCE' };
  }
  if (approver.id === request.proposedBy) {
    return { allowed: false, reason: 'SAME_PERSON' };
  }
  if (!canAny(approver.roles, 'adjustment:approve')) {
    return { allowed: false, reason: 'MISSING_PERMISSION' };
  }
  return { allowed: true };
}
