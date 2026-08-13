/**
 * Refresh-token rotation with reuse detection. SPEC §15.
 *
 * ## The attack this defends against
 *
 * A refresh token is a long-lived credential. If one is stolen — from device
 * storage, a proxy, a backup — the thief can mint access tokens indefinitely,
 * and nothing distinguishes them from the real user.
 *
 * Rotation makes the theft self-revealing. Each refresh issues a new token and
 * retires the old one. If a retired token is ever presented again, exactly one
 * of two things happened: the legitimate client replayed (it lost the response
 * and retried), or an attacker is using a stolen copy. Both are handled the
 * same way — the entire token family is revoked and every device in it is
 * logged out — because the safe action is identical and telling them apart is
 * not possible from the server's position.
 *
 * The family is the unit of revocation: every token descended from one login,
 * so revoking it ends that session lineage without touching the user's other
 * devices.
 */

export type TokenStatus = 'ACTIVE' | 'ROTATED' | 'REVOKED';

export interface RefreshTokenRecord {
  readonly id: string;
  /** All tokens descended from one login share this. Revocation acts on it. */
  readonly familyId: string;
  readonly deviceId: string;
  readonly status: TokenStatus;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  /** Set when this token was exchanged; points at its successor. */
  readonly rotatedToId: string | null;
}

export type RefreshDecision =
  | {
      readonly outcome: 'ROTATE';
      readonly familyId: string;
      readonly deviceId: string;
    }
  | {
      /**
       * A retired token was presented. Revoke the whole family and notify the
       * user — this is the signal that a credential leaked.
       */
      readonly outcome: 'REUSE_DETECTED';
      readonly familyId: string;
      readonly revokeFamily: true;
    }
  | { readonly outcome: 'EXPIRED' }
  | { readonly outcome: 'REVOKED' }
  | { readonly outcome: 'UNKNOWN_TOKEN' };

/**
 * Decide what to do with a presented refresh token.
 *
 * Order matters. Reuse is checked before expiry: a stolen token that has since
 * expired still proves a leak occurred, and the family must still be revoked.
 */
export function evaluateRefresh(
  token: RefreshTokenRecord | null,
  now: Date,
): RefreshDecision {
  if (!token) {
    return { outcome: 'UNKNOWN_TOKEN' };
  }

  if (token.status === 'ROTATED') {
    return { outcome: 'REUSE_DETECTED', familyId: token.familyId, revokeFamily: true };
  }

  if (token.status === 'REVOKED') {
    return { outcome: 'REVOKED' };
  }

  if (token.expiresAt <= now) {
    return { outcome: 'EXPIRED' };
  }

  return { outcome: 'ROTATE', familyId: token.familyId, deviceId: token.deviceId };
}

export interface DeviceRecord {
  readonly id: string;
  readonly userId: string;
  readonly label: string;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
  readonly revokedAt: Date | null;
}

/**
 * Whether a login on this device needs the extra confirmation step.
 *
 * A device the account has never seen gets a security notification to the
 * existing sessions, so a user whose SIM was swapped finds out on their other
 * devices rather than after the money has gone.
 */
export function isNewDevice(
  known: readonly DeviceRecord[],
  fingerprint: string,
): boolean {
  return !known.some((device) => device.id === fingerprint && device.revokedAt === null);
}

/** Sessions a user can see and revoke in the security centre (SPEC §79). */
export function activeDevices(devices: readonly DeviceRecord[]): DeviceRecord[] {
  return devices.filter((device) => device.revokedAt === null);
}
