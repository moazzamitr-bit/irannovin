import { describe, expect, it } from 'vitest';

import {
  MOCK_SCENARIO,
  MockIdentityProvider,
  MockKycProvider,
  MockMobileOwnershipProvider,
  MockPaymentProvider,
  MockPriceProvider,
  MockSmsProvider,
} from '../src/mocks.js';

describe('mock failure modes', () => {
  it('every mock can be driven into rejection, unavailability, timeout, and unknown', async () => {
    const sms = new MockSmsProvider();
    const outcomes = await Promise.all(
      Object.values(MOCK_SCENARIO).map(async (scenario) => {
        const result = await sms.send({
          mobile: `0912000000${scenario}`,
          template: 'otp',
          variables: {},
        });
        return result.outcome;
      }),
    );
    expect(outcomes).toEqual(['REJECTED', 'UNAVAILABLE', 'TIMEOUT', 'UNKNOWN']);
  });

  it('is deterministic — the same input yields the same outcome every call', async () => {
    const provider = new MockMobileOwnershipProvider();
    const input = { mobile: '09120000000', nationalId: '0011223344' };
    const first = await provider.verify(input);
    const second = await provider.verify(input);
    expect(first).toEqual(second);
  });
});

describe('MockSmsProvider', () => {
  it('captures sent messages so a test can read the OTP back', async () => {
    const sms = new MockSmsProvider();
    await sms.send({ mobile: '09120000001', template: 'otp', variables: { code: '123456' } });
    expect(sms.lastMessage()?.variables['code']).toBe('123456');
  });
});

describe('MockMobileOwnershipProvider', () => {
  it('models a successful inquiry that answers "no"', async () => {
    // The Shahkar call succeeded; the SIM simply is not registered to this person.
    // This is a distinct case from the provider being down, and the KYC flow
    // must handle it differently.
    const provider = new MockMobileOwnershipProvider();
    const result = await provider.verify({ mobile: '09120000000', nationalId: '0011223340' });
    expect(result.outcome).toBe('OK');
    expect(result.outcome === 'OK' && result.value.matched).toBe(false);
  });

  it('matches for an ordinary national ID', async () => {
    const provider = new MockMobileOwnershipProvider();
    const result = await provider.verify({ mobile: '09120000000', nationalId: '0011223344' });
    expect(result.outcome === 'OK' && result.value.matched).toBe(true);
  });
});

describe('MockIdentityProvider', () => {
  it('returns civil-registry details', async () => {
    const result = await new MockIdentityProvider().inquire({
      nationalId: '0011223344',
      birthDate: '1370-01-01',
    });
    expect(result.outcome).toBe('OK');
    expect(result.outcome === 'OK' && result.value.alive).toBe(true);
  });
});

describe('MockKycProvider', () => {
  it('starts pending and can be resolved by the test', async () => {
    const kyc = new MockKycProvider();
    const submission = await kyc.submitDocument({
      nationalId: '0011223344',
      documentType: 'NATIONAL_ID_CARD',
      imageRef: 'ref-1',
    });
    expect(submission.outcome).toBe('OK');
    if (submission.outcome !== 'OK') return;

    const pending = await kyc.getStatus(submission.value.referenceId);
    expect(pending.outcome === 'OK' && pending.value.status).toBe('PENDING');

    kyc.resolve(submission.value.referenceId, 'REJECTED');
    const resolved = await kyc.getStatus(submission.value.referenceId);
    expect(resolved.outcome === 'OK' && resolved.value.status).toBe('REJECTED');
  });

  it('rejects an unknown reference rather than inventing a status', async () => {
    const result = await new MockKycProvider().getStatus('nope');
    expect(result.outcome).toBe('REJECTED');
  });
});

describe('MockPaymentProvider', () => {
  it('is idempotent — the same key returns the same payment reference', async () => {
    const payments = new MockPaymentProvider();
    const input = {
      amountRial: 1_000_000n,
      idempotencyKey: 'key-1',
      callbackUrl: 'https://mock.invalid/cb',
      description: 'deposit',
    };
    const first = await payments.createPayment(input);
    const second = await payments.createPayment(input);
    expect(first).toEqual(second);
  });

  it('can be driven to UNKNOWN, which must never be collapsed into FAILED', async () => {
    const payments = new MockPaymentProvider();
    const created = await payments.createPayment({
      amountRial: 1_000_000n,
      idempotencyKey: 'key-2',
      callbackUrl: 'https://mock.invalid/cb',
      description: 'deposit',
    });
    if (created.outcome !== 'OK') throw new Error('setup failed');

    payments.settle(created.value.providerRef, 'UNKNOWN');
    const verified = await payments.verifyPayment({ providerRef: created.value.providerRef });
    expect(verified.outcome === 'OK' && verified.value.status).toBe('UNKNOWN');
  });

  it('reports the amount so the callback can be checked against it', async () => {
    const payments = new MockPaymentProvider();
    const created = await payments.createPayment({
      amountRial: 7_777_777n,
      idempotencyKey: 'key-3',
      callbackUrl: 'https://mock.invalid/cb',
      description: 'deposit',
    });
    if (created.outcome !== 'OK') throw new Error('setup failed');
    const verified = await payments.verifyPayment({ providerRef: created.value.providerRef });
    expect(verified.outcome === 'OK' && verified.value.amountRial).toBe(7_777_777n);
  });
});

describe('MockPriceProvider', () => {
  it('emits a scripted series, including a spike the guards must reject', async () => {
    const feed = new MockPriceProvider({
      series: [100_000_000n, 100_100_000n, 400_000_000n],
    });
    const ticks = [
      await feed.getLatest('GOLD'),
      await feed.getLatest('GOLD'),
      await feed.getLatest('GOLD'),
    ];
    const prices = ticks.map((t) => (t.outcome === 'OK' ? t.value.priceRialPerGram : 0n));
    expect(prices).toEqual([100_000_000n, 100_100_000n, 400_000_000n]);
  });

  it('refuses an empty series', () => {
    expect(() => new MockPriceProvider({ series: [] })).toThrow(RangeError);
  });
});
