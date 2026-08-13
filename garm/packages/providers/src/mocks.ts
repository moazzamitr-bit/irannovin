/**
 * Deterministic mock providers for local development and tests.
 *
 * These are not happy-path stubs. A mock that only succeeds builds false
 * confidence — the states that break a financial system are `UNKNOWN`
 * payments, stale price feeds, and KYC rejections, so every mock here can be
 * driven into its failure modes on demand.
 *
 * Selection is by input, not by randomness, so a test that wants a timeout asks
 * for one and gets it every run.
 */

import type {
  HealthReport,
  IdentityProvider,
  KycProvider,
  MobileOwnershipProvider,
  PaymentProvider,
  PaymentStatus,
  PriceProvider,
  PriceTick,
  ProviderResult,
  SmsProvider,
} from './types.js';

/** Suffix a caller appends to an input to force a given outcome. */
export const MOCK_SCENARIO = {
  reject: '__reject',
  unavailable: '__unavailable',
  timeout: '__timeout',
  unknown: '__unknown',
} as const;

function scenarioFor<T>(input: string): ProviderResult<T> | null {
  if (input.includes(MOCK_SCENARIO.reject)) {
    return { outcome: 'REJECTED', reason: 'mock: rejected by scenario', code: 'MOCK_REJECT' };
  }
  if (input.includes(MOCK_SCENARIO.unavailable)) {
    return { outcome: 'UNAVAILABLE', reason: 'mock: provider unavailable', retryable: true };
  }
  if (input.includes(MOCK_SCENARIO.timeout)) {
    return { outcome: 'TIMEOUT', reason: 'mock: provider timed out', retryable: true };
  }
  if (input.includes(MOCK_SCENARIO.unknown)) {
    return { outcome: 'UNKNOWN', reason: 'mock: outcome indeterminate', correlationId: 'mock-corr' };
  }
  return null;
}

function healthy(name: string): () => Promise<HealthReport> {
  return async () => ({ state: 'HEALTHY', checkedAt: new Date(), detail: `${name} (mock)` });
}

/* ---------------------------------------------------------------- */

/** Captures sent messages so tests can assert on them without a network. */
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock-sms';
  readonly sent: { mobile: string; template: string; variables: Record<string, string> }[] = [];

  healthCheck = healthy(this.name);

  async send(input: {
    mobile: string;
    template: string;
    variables: Readonly<Record<string, string>>;
  }): Promise<ProviderResult<{ messageRef: string }>> {
    const scenario = scenarioFor<{ messageRef: string }>(input.mobile);
    if (scenario) {
      return scenario;
    }
    this.sent.push({ ...input, variables: { ...input.variables } });
    return { outcome: 'OK', value: { messageRef: `mock-sms-${this.sent.length}` } };
  }

  /** The most recently sent message, for tests that need to read an OTP back. */
  lastMessage(): { mobile: string; variables: Record<string, string> } | undefined {
    return this.sent.at(-1);
  }
}

/** Matches when mobile and national ID are both present and neither carries a scenario. */
export class MockMobileOwnershipProvider implements MobileOwnershipProvider {
  readonly name = 'mock-mobile-ownership';
  healthCheck = healthy(this.name);

  async verify(input: {
    mobile: string;
    nationalId: string;
  }): Promise<ProviderResult<{ matched: boolean }>> {
    const scenario = scenarioFor<{ matched: boolean }>(`${input.mobile}${input.nationalId}`);
    if (scenario) {
      return scenario;
    }
    // A national ID ending in 0 models the "real person, wrong SIM holder" case:
    // the inquiry succeeds but the answer is no.
    return { outcome: 'OK', value: { matched: !input.nationalId.endsWith('0') } };
  }
}

export class MockIdentityProvider implements IdentityProvider {
  readonly name = 'mock-identity';
  healthCheck = healthy(this.name);

  async inquire(input: {
    nationalId: string;
    birthDate: string;
  }): Promise<ProviderResult<{ firstName: string; lastName: string; alive: boolean }>> {
    const scenario = scenarioFor<{ firstName: string; lastName: string; alive: boolean }>(
      input.nationalId,
    );
    if (scenario) {
      return scenario;
    }
    return {
      outcome: 'OK',
      value: { firstName: 'مهدی', lastName: 'محمدی', alive: true },
    };
  }
}

export class MockKycProvider implements KycProvider {
  readonly name = 'mock-kyc';
  healthCheck = healthy(this.name);
  private readonly statuses = new Map<string, 'PENDING' | 'APPROVED' | 'REJECTED'>();

  async submitDocument(input: {
    nationalId: string;
    documentType: 'NATIONAL_ID_CARD';
    imageRef: string;
  }): Promise<ProviderResult<{ referenceId: string; accepted: boolean }>> {
    const scenario = scenarioFor<{ referenceId: string; accepted: boolean }>(input.imageRef);
    if (scenario) {
      return scenario;
    }
    const referenceId = `mock-kyc-${this.statuses.size + 1}`;
    this.statuses.set(referenceId, 'PENDING');
    return { outcome: 'OK', value: { referenceId, accepted: true } };
  }

  async getStatus(referenceId: string): Promise<ProviderResult<{ status: 'PENDING' | 'APPROVED' | 'REJECTED' }>> {
    const status = this.statuses.get(referenceId);
    if (!status) {
      return { outcome: 'REJECTED', reason: 'unknown reference', code: 'NOT_FOUND' };
    }
    return { outcome: 'OK', value: { status } };
  }

  /** Test hook: advance a submission without waiting on a real reviewer. */
  resolve(referenceId: string, status: 'APPROVED' | 'REJECTED'): void {
    this.statuses.set(referenceId, status);
  }
}

/** Models the payment lifecycle including the `UNKNOWN` state that must never become `FAILED`. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock-payment';
  healthCheck = healthy(this.name);
  private readonly payments = new Map<string, { status: PaymentStatus; amountRial: bigint }>();

  async createPayment(input: {
    amountRial: bigint;
    idempotencyKey: string;
    callbackUrl: string;
    description: string;
  }): Promise<ProviderResult<{ providerRef: string; redirectUrl: string }>> {
    const scenario = scenarioFor<{ providerRef: string; redirectUrl: string }>(input.idempotencyKey);
    if (scenario) {
      return scenario;
    }
    const providerRef = `mock-pay-${input.idempotencyKey}`;
    // Idempotent by construction: the same key yields the same reference.
    if (!this.payments.has(providerRef)) {
      this.payments.set(providerRef, { status: 'PENDING', amountRial: input.amountRial });
    }
    return {
      outcome: 'OK',
      value: { providerRef, redirectUrl: `https://mock.invalid/pay/${providerRef}` },
    };
  }

  async verifyPayment(input: {
    providerRef: string;
  }): Promise<ProviderResult<{ status: PaymentStatus; amountRial: bigint }>> {
    const scenario = scenarioFor<{ status: PaymentStatus; amountRial: bigint }>(input.providerRef);
    if (scenario) {
      return scenario;
    }
    const payment = this.payments.get(input.providerRef);
    if (!payment) {
      return { outcome: 'REJECTED', reason: 'unknown payment reference', code: 'NOT_FOUND' };
    }
    return { outcome: 'OK', value: { ...payment } };
  }

  async getPayment(providerRef: string): Promise<ProviderResult<{ status: PaymentStatus }>> {
    const payment = this.payments.get(providerRef);
    if (!payment) {
      return { outcome: 'REJECTED', reason: 'unknown payment reference', code: 'NOT_FOUND' };
    }
    return { outcome: 'OK', value: { status: payment.status } };
  }

  async refund(input: {
    providerRef: string;
    idempotencyKey: string;
  }): Promise<ProviderResult<{ refundRef: string }>> {
    const payment = this.payments.get(input.providerRef);
    if (!payment) {
      return { outcome: 'REJECTED', reason: 'unknown payment reference', code: 'NOT_FOUND' };
    }
    this.payments.set(input.providerRef, { ...payment, status: 'REFUNDED' });
    return { outcome: 'OK', value: { refundRef: `mock-refund-${input.idempotencyKey}` } };
  }

  /** Test hook: drive a payment to any terminal state, including UNKNOWN. */
  settle(providerRef: string, status: PaymentStatus): void {
    const payment = this.payments.get(providerRef);
    if (payment) {
      this.payments.set(providerRef, { ...payment, status });
    }
  }
}

/**
 * Emits a scripted price series.
 *
 * The script can include a stall (no ticks) and a spike, which are the two
 * inputs the pricing guards must reject (SPEC §23, §24).
 */
export class MockPriceProvider implements PriceProvider {
  readonly name: string;
  healthCheck = healthy('mock-price');
  private readonly series: bigint[];
  private index = 0;

  constructor(options: { name?: string; series: bigint[] }) {
    this.name = options.name ?? 'mock-price';
    if (options.series.length === 0) {
      throw new RangeError('price series must not be empty');
    }
    this.series = [...options.series];
  }

  async getLatest(assetCode: string): Promise<ProviderResult<PriceTick>> {
    const scenario = scenarioFor<PriceTick>(assetCode);
    if (scenario) {
      return scenario;
    }
    return { outcome: 'OK', value: this.next(assetCode) };
  }

  subscribe(assetCode: string, onTick: (tick: PriceTick) => void): () => void {
    let active = true;
    const timer = setInterval(() => {
      if (active) {
        onTick(this.next(assetCode));
      }
    }, 1_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }

  private next(assetCode: string): PriceTick {
    const price = this.series[this.index % this.series.length] ?? this.series[0];
    this.index += 1;
    return {
      assetCode,
      priceRialPerGram: price as bigint,
      observedAt: new Date(),
      sourceName: this.name,
    };
  }
}
