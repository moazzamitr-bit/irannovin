/**
 * Risk-based step-up authentication. SPEC §43.
 *
 * ## Why this is not "PIN on every action"
 *
 * Demanding a transaction PIN for every purchase looks like security and is
 * mostly friction. The saving product depends on frequent small buys; a PIN
 * prompt on each one trains the user to enter it reflexively, which is exactly
 * the habit an attacker relies on, and it suppresses the behaviour the product
 * exists to encourage.
 *
 * So: always step up for the actions that move money *out* or change where it
 * can go, and for buys and sells decide from risk. No universal hardcoded
 * amount — thresholds are configuration (SPEC §95).
 */

export type SensitiveAction =
  | 'BUY'
  | 'SELL'
  | 'WITHDRAWAL'
  | 'BANK_ACCOUNT_CHANGE'
  | 'PHYSICAL_REDEMPTION'
  | 'SECURITY_SETTINGS_CHANGE'
  | 'CREDIT_ACCEPTANCE';

/**
 * Actions that always require step-up regardless of amount or context.
 *
 * Every one of them either moves value beyond the platform's reach or changes
 * the destination it can be moved to. Neither is recoverable by support.
 */
const ALWAYS_STEP_UP: ReadonlySet<SensitiveAction> = new Set<SensitiveAction>([
  'WITHDRAWAL',
  'BANK_ACCOUNT_CHANGE',
  'PHYSICAL_REDEMPTION',
  'SECURITY_SETTINGS_CHANGE',
  'CREDIT_ACCEPTANCE',
]);

export interface StepUpPolicy {
  /** Trade value at or above which step-up is required, in rial. */
  readonly tradeThresholdRial: bigint;
  /** A device newer than this is treated as untrusted. */
  readonly deviceTrustAfterSeconds: number;
  /** A session older than this must re-confirm before a trade. */
  readonly maxSessionAgeSeconds: number;
  /** Cumulative trade value in 24h at or above which step-up returns. */
  readonly dailyCumulativeThresholdRial: bigint;
}

export const DEFAULT_STEP_UP_POLICY: StepUpPolicy = {
  tradeThresholdRial: 500_000_000n, // 50,000,000 toman
  deviceTrustAfterSeconds: 7 * 24 * 3_600,
  maxSessionAgeSeconds: 12 * 3_600,
  dailyCumulativeThresholdRial: 1_000_000_000n, // 100,000,000 toman
};

export interface RiskContext {
  readonly amountRial: bigint;
  readonly deviceFirstSeenAt: Date;
  readonly sessionStartedAt: Date;
  readonly cumulative24hRial: bigint;
  /** Set by the anomaly detector — unusual velocity, geography, or pattern. */
  readonly anomalyFlagged: boolean;
  readonly now: Date;
}

export type StepUpReason =
  | 'ALWAYS_REQUIRED'
  | 'AMOUNT_THRESHOLD'
  | 'CUMULATIVE_THRESHOLD'
  | 'UNTRUSTED_DEVICE'
  | 'STALE_SESSION'
  | 'ANOMALY';

export type StepUpDecision =
  | { readonly required: false }
  | { readonly required: true; readonly reasons: readonly StepUpReason[] };

function ageSeconds(from: Date, now: Date): number {
  return Math.floor((now.getTime() - from.getTime()) / 1000);
}

/**
 * Decide whether an action needs a transaction PIN.
 *
 * All triggering reasons are collected rather than returning on the first,
 * because the audit log should record everything that made an action risky,
 * not just whichever check happened to run first.
 */
export function evaluateStepUp(
  action: SensitiveAction,
  context: RiskContext,
  policy: StepUpPolicy = DEFAULT_STEP_UP_POLICY,
): StepUpDecision {
  if (ALWAYS_STEP_UP.has(action)) {
    return { required: true, reasons: ['ALWAYS_REQUIRED'] };
  }

  const reasons: StepUpReason[] = [];

  if (context.amountRial >= policy.tradeThresholdRial) {
    reasons.push('AMOUNT_THRESHOLD');
  }
  if (context.cumulative24hRial >= policy.dailyCumulativeThresholdRial) {
    reasons.push('CUMULATIVE_THRESHOLD');
  }
  if (ageSeconds(context.deviceFirstSeenAt, context.now) < policy.deviceTrustAfterSeconds) {
    reasons.push('UNTRUSTED_DEVICE');
  }
  if (ageSeconds(context.sessionStartedAt, context.now) > policy.maxSessionAgeSeconds) {
    reasons.push('STALE_SESSION');
  }
  if (context.anomalyFlagged) {
    reasons.push('ANOMALY');
  }

  return reasons.length > 0 ? { required: true, reasons } : { required: false };
}
