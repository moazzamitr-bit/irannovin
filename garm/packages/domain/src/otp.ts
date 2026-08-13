/**
 * OTP issuance and verification policy. SPEC §15, §16.
 *
 * Pure decision logic: no I/O, no clock, no randomness. The caller supplies the
 * current time and the persisted counters; this module decides. That makes
 * every rate-limit and lockout rule exhaustively testable, which matters
 * because these are the rules standing between an attacker and an account.
 *
 * The OTP code itself never appears in a return value, a log line, or an error
 * message (SPEC §16).
 */

export interface OtpPolicy {
  readonly codeLength: number;
  readonly ttlSeconds: number;
  /** Wrong guesses allowed against one challenge before it is burned. */
  readonly maxAttempts: number;
  /** Minimum wait between sends to the same number. */
  readonly resendCooldownSeconds: number;
  readonly perPhoneWindowSeconds: number;
  readonly maxRequestsPerPhoneWindow: number;
  readonly perIpWindowSeconds: number;
  readonly maxRequestsPerIpWindow: number;
  /** How long a number is frozen after exhausting its allowance. */
  readonly lockoutSeconds: number;
}

export const DEFAULT_OTP_POLICY: OtpPolicy = {
  codeLength: 6,
  ttlSeconds: 120,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  perPhoneWindowSeconds: 3_600,
  maxRequestsPerPhoneWindow: 5,
  perIpWindowSeconds: 3_600,
  maxRequestsPerIpWindow: 20,
  lockoutSeconds: 900,
};

/** Persisted counters for one phone number, plus the requesting IP's counter. */
export interface OtpRequestState {
  readonly phoneRequestsInWindow: number;
  readonly ipRequestsInWindow: number;
  readonly lastSentAt: Date | null;
  readonly lockedUntil: Date | null;
}

export type OtpRequestDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: 'LOCKED_OUT' | 'COOLDOWN' | 'PHONE_RATE_LIMITED' | 'IP_RATE_LIMITED';
      /** Seconds until the caller may retry. Safe to show the user. */
      readonly retryAfterSeconds: number;
    };

function secondsBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 1000);
}

/**
 * Decide whether an OTP may be sent.
 *
 * Checks run cheapest-and-most-severe first, so a locked-out number is never
 * told about cooldowns it could game to infer state.
 */
export function evaluateOtpRequest(
  state: OtpRequestState,
  now: Date,
  policy: OtpPolicy = DEFAULT_OTP_POLICY,
): OtpRequestDecision {
  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      allowed: false,
      reason: 'LOCKED_OUT',
      retryAfterSeconds: secondsBetween(now, state.lockedUntil),
    };
  }

  if (state.lastSentAt) {
    const elapsed = secondsBetween(state.lastSentAt, now);
    if (elapsed < policy.resendCooldownSeconds) {
      return {
        allowed: false,
        reason: 'COOLDOWN',
        retryAfterSeconds: policy.resendCooldownSeconds - elapsed,
      };
    }
  }

  if (state.phoneRequestsInWindow >= policy.maxRequestsPerPhoneWindow) {
    return {
      allowed: false,
      reason: 'PHONE_RATE_LIMITED',
      retryAfterSeconds: policy.lockoutSeconds,
    };
  }

  // The IP limit is deliberately checked last and is far looser: many
  // legitimate Iranian users share a carrier NAT, so a strict IP rule locks out
  // real customers long before it inconveniences an attacker.
  if (state.ipRequestsInWindow >= policy.maxRequestsPerIpWindow) {
    return {
      allowed: false,
      reason: 'IP_RATE_LIMITED',
      retryAfterSeconds: policy.perIpWindowSeconds,
    };
  }

  return { allowed: true };
}

/** A challenge as persisted. The code is stored hashed; the hash never leaves the auth module. */
export interface OtpChallenge {
  readonly codeHash: string;
  readonly createdAt: Date;
  readonly attempts: number;
  readonly consumedAt: Date | null;
}

export type OtpVerifyDecision =
  | { readonly outcome: 'ACCEPTED' }
  | { readonly outcome: 'WRONG_CODE'; readonly attemptsRemaining: number }
  | { readonly outcome: 'EXPIRED' }
  | { readonly outcome: 'ALREADY_USED' }
  | { readonly outcome: 'TOO_MANY_ATTEMPTS' };

/**
 * Decide the result of a verification attempt.
 *
 * `codeMatches` is supplied by the caller from a constant-time comparison of
 * hashes — this module never sees a plaintext code, so it cannot leak one.
 */
export function evaluateOtpVerification(
  challenge: OtpChallenge,
  codeMatches: boolean,
  now: Date,
  policy: OtpPolicy = DEFAULT_OTP_POLICY,
): OtpVerifyDecision {
  if (challenge.consumedAt) {
    return { outcome: 'ALREADY_USED' };
  }
  if (challenge.attempts >= policy.maxAttempts) {
    return { outcome: 'TOO_MANY_ATTEMPTS' };
  }
  // Expiry is checked before the code comparison so that a correct-but-late
  // code and a wrong-and-late code are indistinguishable to the caller.
  if (secondsBetween(challenge.createdAt, now) >= policy.ttlSeconds) {
    return { outcome: 'EXPIRED' };
  }
  if (!codeMatches) {
    const attemptsRemaining = policy.maxAttempts - (challenge.attempts + 1);
    return { outcome: 'WRONG_CODE', attemptsRemaining: Math.max(0, attemptsRemaining) };
  }
  return { outcome: 'ACCEPTED' };
}

/**
 * Constant-time string comparison.
 *
 * Used for comparing code hashes. A short-circuiting `===` leaks how many
 * leading characters were correct through response timing.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  // Compare over a fixed length so differing lengths do not short-circuit.
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}
