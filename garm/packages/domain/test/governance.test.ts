import { describe, expect, it } from 'vitest';

import {
  ALL_ROLES,
  allPermissions,
  can,
  canAny,
  evaluateAdjustment,
  permissionsFor,
  type AdjustmentRequest,
} from '../src/rbac.js';
import {
  canTransition,
  DEFAULT_KYC_CONFIGURATION,
  deriveStatus,
  KycTransitionError,
  permits,
  remainingSteps,
  transition,
  type StepOutcome,
} from '../src/kyc.js';
import {
  DEFAULT_STEP_UP_POLICY,
  evaluateStepUp,
  type RiskContext,
} from '../src/stepup.js';

describe('RBAC — the balance-edit prohibition (SPEC §64)', () => {
  it('defines no permission that could edit a balance, for any role', () => {
    // The capability is absent from the Permission union, so this cannot be
    // granted by mistake. This test guards the runtime grant table too, and
    // will fail the moment anyone adds such a permission to a role.
    const forbidden = /balance.*(edit|write|set|adjust)|(edit|write|set).*balance/i;
    const offending = allPermissions().filter((p) => forbidden.test(p));
    expect(offending).toEqual([]);
  });

  it('grants SUPER_ADMIN no money-moving power', () => {
    // Managing roles and moving money are separated so a single compromised
    // credential cannot both grant itself authority and use it.
    expect(can('SUPER_ADMIN', 'admin:manage_roles')).toBe(true);
    expect(can('SUPER_ADMIN', 'adjustment:approve')).toBe(false);
    expect(can('SUPER_ADMIN', 'withdrawal:approve')).toBe(false);
    expect(can('SUPER_ADMIN', 'reconciliation:resolve')).toBe(false);
  });

  it('gives every role at least one permission', () => {
    for (const role of ALL_ROLES) {
      expect(permissionsFor([role]).length).toBeGreaterThan(0);
    }
  });

  it('keeps read-only roles read-only', () => {
    expect(can('SECURITY_AUDITOR', 'audit:read')).toBe(true);
    expect(can('SECURITY_AUDITOR', 'pricing:configure')).toBe(false);
    expect(can('SECURITY_AUDITOR', 'killswitch:activate')).toBe(false);
    expect(can('SUPPORT', 'user:restrict')).toBe(false);
  });

  it('lets an incident commander hit the kill switch without being a super admin', () => {
    // SPEC §62: an emergency must not wait for one specific person to wake up.
    expect(can('INCIDENT_COMMANDER', 'killswitch:activate')).toBe(true);
    expect(can('OPERATIONS', 'killswitch:activate')).toBe(true);
    expect(can('TREASURY', 'killswitch:activate')).toBe(true);
  });

  it('merges and de-duplicates permissions across roles', () => {
    const merged = permissionsFor(['SUPPORT', 'KYC_REVIEWER']);
    expect(merged).toEqual([...new Set(merged)].sort());
    expect(canAny(['SUPPORT', 'KYC_REVIEWER'], 'kyc:review')).toBe(true);
  });

  it('has at least one role able to approve an adjustment', () => {
    // Without this the maker-checker workflow would be unsatisfiable and every
    // correction would be impossible to post.
    expect(ALL_ROLES.some((role) => can(role, 'adjustment:approve'))).toBe(true);
  });
});

describe('maker-checker adjustments (SPEC §65)', () => {
  const request: AdjustmentRequest = {
    id: 'adj-1',
    proposedBy: 'admin-1',
    reason: 'PSP settlement short by 1 rial on ref 88213',
    evidenceRef: 's3://evidence/88213.pdf',
    approvedBy: null,
  };

  it('allows a different authorised person to approve', () => {
    expect(evaluateAdjustment(request, { id: 'admin-2', roles: ['FINANCE'] }).allowed).toBe(true);
  });

  it('refuses self-approval even with the right permission', () => {
    const decision = evaluateAdjustment(request, { id: 'admin-1', roles: ['FINANCE'] });
    expect(decision.allowed).toBe(false);
    expect(decision.allowed === false && decision.reason).toBe('SAME_PERSON');
  });

  it('refuses an approver without the permission', () => {
    const decision = evaluateAdjustment(request, { id: 'admin-2', roles: ['SUPPORT'] });
    expect(decision.allowed === false && decision.reason).toBe('MISSING_PERMISSION');
  });

  it('refuses a correction with no stated reason or no evidence', () => {
    expect(
      evaluateAdjustment({ ...request, reason: '   ' }, { id: 'admin-2', roles: ['FINANCE'] })
        .allowed,
    ).toBe(false);
    expect(
      evaluateAdjustment({ ...request, evidenceRef: '' }, { id: 'admin-2', roles: ['FINANCE'] })
        .allowed,
    ).toBe(false);
  });
});

describe('KYC state machine', () => {
  it('walks the ordinary path', () => {
    expect(transition('NOT_STARTED', 'IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(transition('IN_PROGRESS', 'PENDING_PROVIDER')).toBe('PENDING_PROVIDER');
    expect(transition('PENDING_PROVIDER', 'VERIFIED')).toBe('VERIFIED');
  });

  it('refuses to skip straight from not-started to verified', () => {
    expect(() => transition('NOT_STARTED', 'VERIFIED')).toThrow(KycTransitionError);
  });

  it('treats VERIFIED and REJECTED as terminal', () => {
    expect(canTransition('VERIFIED', 'IN_PROGRESS')).toBe(false);
    expect(canTransition('REJECTED', 'IN_PROGRESS')).toBe(false);
  });

  it('lets a case that needs an update be resumed', () => {
    expect(transition('NEEDS_UPDATE', 'IN_PROGRESS')).toBe('IN_PROGRESS');
  });
});

describe('KYC status derivation', () => {
  const pass = (step: StepOutcome['step']): StepOutcome => ({ step, status: 'PASSED' });

  it('is NOT_STARTED with no outcomes', () => {
    expect(deriveStatus([])).toBe('NOT_STARTED');
  });

  it('verifies once every required step has passed', () => {
    const outcomes = DEFAULT_KYC_CONFIGURATION.requiredSteps.map(pass);
    expect(deriveStatus(outcomes)).toBe('VERIFIED');
  });

  it('does not require the optional liveness step to verify', () => {
    // Demanding a selfie before the customer has seen the product is the
    // largest drop-off in this category; it is deferred to a higher tier.
    expect(DEFAULT_KYC_CONFIGURATION.optionalSteps).toContain('LIVENESS');
    const outcomes = DEFAULT_KYC_CONFIGURATION.requiredSteps.map(pass);
    expect(deriveStatus(outcomes)).toBe('VERIFIED');
  });

  it('rejects as soon as any step fails', () => {
    expect(deriveStatus([pass('IDENTITY'), { step: 'DOCUMENT', status: 'FAILED' }])).toBe('REJECTED');
  });

  it('reports pending while a provider is still deciding', () => {
    expect(deriveStatus([pass('IDENTITY'), { step: 'DOCUMENT', status: 'PENDING' }])).toBe(
      'PENDING_PROVIDER',
    );
  });

  it('lists the steps still outstanding', () => {
    expect(remainingSteps([pass('IDENTITY'), pass('MOBILE_OWNERSHIP')])).toEqual([
      'DOCUMENT',
      'BANK_ACCOUNT',
    ]);
  });

  it('keeps mobile ownership and bank ownership as separate required steps', () => {
    // SPEC §19: different government services, different providers. One is
    // never evidence for the other.
    expect(DEFAULT_KYC_CONFIGURATION.requiredSteps).toContain('MOBILE_OWNERSHIP');
    expect(DEFAULT_KYC_CONFIGURATION.requiredSteps).toContain('BANK_ACCOUNT');
  });
});

describe('KYC gating', () => {
  it('blocks every money capability until verified', () => {
    for (const capability of ['TRADE', 'DEPOSIT', 'WITHDRAW', 'PHYSICAL_REDEMPTION'] as const) {
      expect(permits('IN_PROGRESS', capability)).toBe(false);
      expect(permits('MANUAL_REVIEW', capability)).toBe(false);
      expect(permits('REJECTED', capability)).toBe(false);
      expect(permits('VERIFIED', capability)).toBe(true);
    }
  });
});

describe('risk-based step-up (SPEC §43)', () => {
  const NOW = new Date('2026-08-13T12:00:00Z');
  const trusted: RiskContext = {
    amountRial: 10_000_000n,
    deviceFirstSeenAt: new Date(NOW.getTime() - 30 * 24 * 3_600 * 1000),
    sessionStartedAt: new Date(NOW.getTime() - 600 * 1000),
    cumulative24hRial: 0n,
    anomalyFlagged: false,
    now: NOW,
  };

  it('does not prompt for a small buy on a trusted device', () => {
    // The saving product depends on frequent small buys. A PIN on each one is
    // friction that trains reflexive entry rather than adding security.
    expect(evaluateStepUp('BUY', trusted).required).toBe(false);
  });

  it('always prompts for actions that move value out of reach', () => {
    for (const action of [
      'WITHDRAWAL',
      'BANK_ACCOUNT_CHANGE',
      'PHYSICAL_REDEMPTION',
      'SECURITY_SETTINGS_CHANGE',
      'CREDIT_ACCEPTANCE',
    ] as const) {
      const decision = evaluateStepUp(action, trusted);
      expect(decision.required).toBe(true);
      expect(decision.required && decision.reasons).toEqual(['ALWAYS_REQUIRED']);
    }
  });

  it('prompts once a single trade crosses the configured threshold', () => {
    const decision = evaluateStepUp('BUY', {
      ...trusted,
      amountRial: DEFAULT_STEP_UP_POLICY.tradeThresholdRial,
    });
    expect(decision.required && decision.reasons).toContain('AMOUNT_THRESHOLD');
  });

  it('prompts when many small trades accumulate past the daily threshold', () => {
    // Otherwise the amount threshold is trivially evaded by splitting.
    const decision = evaluateStepUp('BUY', {
      ...trusted,
      cumulative24hRial: DEFAULT_STEP_UP_POLICY.dailyCumulativeThresholdRial,
    });
    expect(decision.required && decision.reasons).toContain('CUMULATIVE_THRESHOLD');
  });

  it('prompts on a device the account has barely met', () => {
    const decision = evaluateStepUp('BUY', { ...trusted, deviceFirstSeenAt: NOW });
    expect(decision.required && decision.reasons).toContain('UNTRUSTED_DEVICE');
  });

  it('prompts on a stale session', () => {
    const decision = evaluateStepUp('SELL', {
      ...trusted,
      sessionStartedAt: new Date(NOW.getTime() - 24 * 3_600 * 1000),
    });
    expect(decision.required && decision.reasons).toContain('STALE_SESSION');
  });

  it('prompts when the anomaly detector has flagged the session', () => {
    const decision = evaluateStepUp('BUY', { ...trusted, anomalyFlagged: true });
    expect(decision.required && decision.reasons).toContain('ANOMALY');
  });

  it('collects every triggering reason, not just the first', () => {
    // The audit record should say everything that made an action risky.
    const decision = evaluateStepUp('BUY', {
      ...trusted,
      amountRial: 999_000_000_000n,
      cumulative24hRial: 999_000_000_000n,
      deviceFirstSeenAt: NOW,
      sessionStartedAt: new Date(NOW.getTime() - 24 * 3_600 * 1000),
      anomalyFlagged: true,
    });
    expect(decision.required && decision.reasons).toEqual([
      'AMOUNT_THRESHOLD',
      'CUMULATIVE_THRESHOLD',
      'UNTRUSTED_DEVICE',
      'STALE_SESSION',
      'ANOMALY',
    ]);
  });

  it('has no hardcoded universal amount — the policy is injectable', () => {
    const strict = { ...DEFAULT_STEP_UP_POLICY, tradeThresholdRial: 1n };
    expect(evaluateStepUp('BUY', trusted, strict).required).toBe(true);
  });
});
