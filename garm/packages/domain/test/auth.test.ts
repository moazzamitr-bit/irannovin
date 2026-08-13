import { describe, expect, it } from 'vitest';

import {
  constantTimeEquals,
  DEFAULT_OTP_POLICY,
  evaluateOtpRequest,
  evaluateOtpVerification,
  type OtpChallenge,
  type OtpRequestState,
} from '../src/otp.js';
import { evaluateRefresh, isNewDevice, activeDevices, type RefreshTokenRecord, type DeviceRecord } from '../src/session.js';

const NOW = new Date('2026-08-13T12:00:00Z');
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);
const ahead = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);

const cleanState: OtpRequestState = {
  phoneRequestsInWindow: 0,
  ipRequestsInWindow: 0,
  lastSentAt: null,
  lockedUntil: null,
};

describe('OTP request policy', () => {
  it('allows a first request', () => {
    expect(evaluateOtpRequest(cleanState, NOW).allowed).toBe(true);
  });

  it('enforces the resend cooldown and reports the wait', () => {
    const decision = evaluateOtpRequest({ ...cleanState, lastSentAt: ago(20) }, NOW);
    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.reason).toBe('COOLDOWN');
    expect(decision.retryAfterSeconds).toBe(DEFAULT_OTP_POLICY.resendCooldownSeconds - 20);
  });

  it('allows again once the cooldown has elapsed', () => {
    expect(evaluateOtpRequest({ ...cleanState, lastSentAt: ago(60) }, NOW).allowed).toBe(true);
  });

  it('rate-limits per phone number', () => {
    const decision = evaluateOtpRequest({ ...cleanState, phoneRequestsInWindow: 5 }, NOW);
    expect(decision.allowed === false && decision.reason).toBe('PHONE_RATE_LIMITED');
  });

  it('rate-limits per IP far more loosely than per phone', () => {
    // Carrier NAT means many real users share an IP. The IP limit exists, but
    // it must not fire before the per-phone limit for ordinary traffic.
    expect(DEFAULT_OTP_POLICY.maxRequestsPerIpWindow).toBeGreaterThan(
      DEFAULT_OTP_POLICY.maxRequestsPerPhoneWindow,
    );
    const decision = evaluateOtpRequest({ ...cleanState, ipRequestsInWindow: 20 }, NOW);
    expect(decision.allowed === false && decision.reason).toBe('IP_RATE_LIMITED');
  });

  it('reports lockout ahead of every other reason, leaking no other state', () => {
    const decision = evaluateOtpRequest(
      {
        phoneRequestsInWindow: 99,
        ipRequestsInWindow: 99,
        lastSentAt: ago(1),
        lockedUntil: ahead(300),
      },
      NOW,
    );
    expect(decision.allowed === false && decision.reason).toBe('LOCKED_OUT');
  });

  it('releases the lock once it expires', () => {
    expect(evaluateOtpRequest({ ...cleanState, lockedUntil: ago(1) }, NOW).allowed).toBe(true);
  });
});

describe('OTP verification policy', () => {
  const fresh: OtpChallenge = { codeHash: 'h', createdAt: ago(10), attempts: 0, consumedAt: null };

  it('accepts a matching code inside the window', () => {
    expect(evaluateOtpVerification(fresh, true, NOW).outcome).toBe('ACCEPTED');
  });

  it('counts down remaining attempts on a wrong code', () => {
    const decision = evaluateOtpVerification({ ...fresh, attempts: 2 }, false, NOW);
    expect(decision.outcome).toBe('WRONG_CODE');
    expect(decision.outcome === 'WRONG_CODE' && decision.attemptsRemaining).toBe(2);
  });

  it('never reports negative attempts remaining', () => {
    const decision = evaluateOtpVerification({ ...fresh, attempts: 4 }, false, NOW);
    expect(decision.outcome === 'WRONG_CODE' && decision.attemptsRemaining).toBe(0);
  });

  it('burns the challenge after too many attempts', () => {
    expect(evaluateOtpVerification({ ...fresh, attempts: 5 }, true, NOW).outcome).toBe(
      'TOO_MANY_ATTEMPTS',
    );
  });

  it('treats a correct-but-late code exactly like a wrong-and-late one', () => {
    // Both return EXPIRED, so response shape cannot confirm a guessed code
    // after the window closes.
    const late = { ...fresh, createdAt: ago(200) };
    expect(evaluateOtpVerification(late, true, NOW).outcome).toBe('EXPIRED');
    expect(evaluateOtpVerification(late, false, NOW).outcome).toBe('EXPIRED');
  });

  it('refuses a challenge that was already consumed', () => {
    expect(
      evaluateOtpVerification({ ...fresh, consumedAt: ago(1) }, true, NOW).outcome,
    ).toBe('ALREADY_USED');
  });

  it('expires exactly at the TTL boundary', () => {
    const atBoundary = { ...fresh, createdAt: ago(DEFAULT_OTP_POLICY.ttlSeconds) };
    expect(evaluateOtpVerification(atBoundary, true, NOW).outcome).toBe('EXPIRED');
    const justInside = { ...fresh, createdAt: ago(DEFAULT_OTP_POLICY.ttlSeconds - 1) };
    expect(evaluateOtpVerification(justInside, true, NOW).outcome).toBe('ACCEPTED');
  });
});

describe('constantTimeEquals', () => {
  it('compares equal and unequal strings correctly', () => {
    expect(constantTimeEquals('abc123', 'abc123')).toBe(true);
    expect(constantTimeEquals('abc123', 'abc124')).toBe(false);
    expect(constantTimeEquals('', '')).toBe(true);
  });

  it('does not short-circuit on differing lengths', () => {
    expect(constantTimeEquals('abc', 'abcdef')).toBe(false);
    expect(constantTimeEquals('abcdef', 'abc')).toBe(false);
  });

  it('does not short-circuit on a differing first character', () => {
    expect(constantTimeEquals('xbc123', 'abc123')).toBe(false);
  });
});

describe('refresh token rotation', () => {
  const active: RefreshTokenRecord = {
    id: 't1',
    familyId: 'fam-1',
    deviceId: 'dev-1',
    status: 'ACTIVE',
    issuedAt: ago(60),
    expiresAt: ahead(3_600),
    rotatedToId: null,
  };

  it('rotates a valid active token', () => {
    const decision = evaluateRefresh(active, NOW);
    expect(decision.outcome).toBe('ROTATE');
    expect(decision.outcome === 'ROTATE' && decision.familyId).toBe('fam-1');
  });

  it('detects reuse of an already-rotated token and revokes the family', () => {
    const decision = evaluateRefresh({ ...active, status: 'ROTATED', rotatedToId: 't2' }, NOW);
    expect(decision.outcome).toBe('REUSE_DETECTED');
    expect(decision.outcome === 'REUSE_DETECTED' && decision.revokeFamily).toBe(true);
  });

  it('detects reuse even when the stolen token has expired', () => {
    // An expired stolen token still proves a leak. Returning EXPIRED here would
    // silently drop the signal and leave the family live.
    const decision = evaluateRefresh(
      { ...active, status: 'ROTATED', expiresAt: ago(10) },
      NOW,
    );
    expect(decision.outcome).toBe('REUSE_DETECTED');
  });

  it('rejects a revoked token without claiming reuse', () => {
    expect(evaluateRefresh({ ...active, status: 'REVOKED' }, NOW).outcome).toBe('REVOKED');
  });

  it('rejects an expired active token', () => {
    expect(evaluateRefresh({ ...active, expiresAt: ago(1) }, NOW).outcome).toBe('EXPIRED');
  });

  it('rejects an unknown token', () => {
    expect(evaluateRefresh(null, NOW).outcome).toBe('UNKNOWN_TOKEN');
  });
});

describe('devices', () => {
  const devices: DeviceRecord[] = [
    { id: 'dev-1', userId: 'u1', label: 'Pixel', firstSeenAt: ago(1000), lastSeenAt: NOW, revokedAt: null },
    { id: 'dev-2', userId: 'u1', label: 'iPhone', firstSeenAt: ago(2000), lastSeenAt: NOW, revokedAt: ago(10) },
  ];

  it('recognises a known active device', () => {
    expect(isNewDevice(devices, 'dev-1')).toBe(false);
  });

  it('treats a revoked device as new, so it must re-verify', () => {
    expect(isNewDevice(devices, 'dev-2')).toBe(true);
  });

  it('treats an unseen device as new', () => {
    expect(isNewDevice(devices, 'dev-9')).toBe(true);
  });

  it('lists only active devices in the security centre', () => {
    expect(activeDevices(devices).map((d) => d.id)).toEqual(['dev-1']);
  });
});
