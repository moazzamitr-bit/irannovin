/**
 * KYC state machine and step configuration. SPEC §17, §18, §19.
 *
 * The set of required steps is configuration, not code (SPEC §17): regulatory
 * requirements change, and a platform that hardcodes today's rules has to ship
 * a release to comply with tomorrow's.
 */

export type KycStep =
  | 'IDENTITY'
  | 'MOBILE_OWNERSHIP'
  | 'DOCUMENT'
  | 'LIVENESS'
  | 'BANK_ACCOUNT';

export type KycStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PENDING_PROVIDER'
  | 'MANUAL_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_UPDATE';

export interface KycConfiguration {
  readonly requiredSteps: readonly KycStep[];
  /** Steps that may be completed later without blocking a verified status. */
  readonly optionalSteps: readonly KycStep[];
}

/**
 * Launch default.
 *
 * Mobile ownership and bank-account ownership are distinct steps backed by
 * distinct providers — they answer different questions and one is not evidence
 * for the other (SPEC §19).
 *
 * Liveness is optional at this tier. Requiring a selfie before a customer has
 * seen the product is the single largest drop-off in this category, and the
 * step can be demanded later when a withdrawal limit is crossed.
 */
export const DEFAULT_KYC_CONFIGURATION: KycConfiguration = {
  requiredSteps: ['IDENTITY', 'MOBILE_OWNERSHIP', 'DOCUMENT', 'BANK_ACCOUNT'],
  optionalSteps: ['LIVENESS'],
};

const ALLOWED_TRANSITIONS: Readonly<Record<KycStatus, readonly KycStatus[]>> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['PENDING_PROVIDER', 'MANUAL_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_UPDATE'],
  PENDING_PROVIDER: ['IN_PROGRESS', 'MANUAL_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_UPDATE'],
  MANUAL_REVIEW: ['VERIFIED', 'REJECTED', 'NEEDS_UPDATE'],
  NEEDS_UPDATE: ['IN_PROGRESS'],
  // Terminal. A verified case that must change goes through a fresh case with
  // its own audit trail rather than being edited back down.
  VERIFIED: [],
  REJECTED: [],
};

export function canTransitionKyc(from: KycStatus, to: KycStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

export class KycTransitionError extends Error {
  constructor(from: KycStatus, to: KycStatus) {
    super(`illegal KYC transition: ${from} → ${to}`);
    this.name = 'KycTransitionError';
  }
}

export function transitionKyc(from: KycStatus, to: KycStatus): KycStatus {
  if (!canTransitionKyc(from, to)) {
    throw new KycTransitionError(from, to);
  }
  return to;
}

export interface StepOutcome {
  readonly step: KycStep;
  readonly status: 'PASSED' | 'FAILED' | 'PENDING';
}

/**
 * Derive the case status from the outcomes recorded so far.
 *
 * Deriving rather than storing means the status can never disagree with the
 * evidence behind it.
 */
export function deriveStatus(
  outcomes: readonly StepOutcome[],
  configuration: KycConfiguration = DEFAULT_KYC_CONFIGURATION,
): KycStatus {
  if (outcomes.length === 0) {
    return 'NOT_STARTED';
  }
  if (outcomes.some((o) => o.status === 'FAILED')) {
    return 'REJECTED';
  }

  const passed = new Set(outcomes.filter((o) => o.status === 'PASSED').map((o) => o.step));
  const allRequiredPassed = configuration.requiredSteps.every((step) => passed.has(step));

  if (allRequiredPassed) {
    return 'VERIFIED';
  }
  if (outcomes.some((o) => o.status === 'PENDING')) {
    return 'PENDING_PROVIDER';
  }
  return 'IN_PROGRESS';
}

/** Required steps not yet passed, in configured order. */
export function remainingSteps(
  outcomes: readonly StepOutcome[],
  configuration: KycConfiguration = DEFAULT_KYC_CONFIGURATION,
): KycStep[] {
  const passed = new Set(outcomes.filter((o) => o.status === 'PASSED').map((o) => o.step));
  return configuration.requiredSteps.filter((step) => !passed.has(step));
}

/**
 * Gate for every money-moving capability. SPEC §18.
 *
 * One function, so there is exactly one place the rule lives and exactly one
 * place to audit.
 */
export function isVerified(status: KycStatus): boolean {
  return status === 'VERIFIED';
}

export type GatedCapability = 'TRADE' | 'DEPOSIT' | 'WITHDRAW' | 'PHYSICAL_REDEMPTION';

export function permits(status: KycStatus, capability: GatedCapability): boolean {
  // Every listed capability requires full verification today. The signature
  // takes the capability so that a future tiered model changes this function
  // rather than every call site.
  void capability;
  return isVerified(status);
}
