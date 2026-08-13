/**
 * External provider boundary. SPEC §14, §18.
 *
 * Every external system the platform depends on is reached through an interface
 * declared here. Business logic must never import a vendor SDK, name a vendor,
 * or branch on which vendor is configured.
 *
 * Two reasons this matters more than usual here:
 *
 *   1. The commercial decisions are not made yet (DECISIONS.md OPEN-5 … OPEN-8).
 *      Building against interfaces lets Phases 1–3 proceed while contracts are
 *      still being negotiated.
 *   2. Iranian fintech vendors get replaced. A KYC or PSP switch should be a
 *      new implementation of an interface, not a migration.
 *
 * Every method returns a discriminated `ProviderResult` rather than throwing,
 * because the failure modes are part of the domain — `UNKNOWN` in particular is
 * a real state that must never be collapsed into `FAILED` (SPEC §40).
 */

export type ProviderResult<T> =
  | { readonly outcome: 'OK'; readonly value: T }
  | { readonly outcome: 'REJECTED'; readonly reason: string; readonly code?: string }
  | { readonly outcome: 'UNAVAILABLE'; readonly reason: string; readonly retryable: true }
  | { readonly outcome: 'TIMEOUT'; readonly reason: string; readonly retryable: true }
  /**
   * The call may or may not have taken effect. Never treat this as failure —
   * it must go to reconciliation (SPEC §40, §57).
   */
  | { readonly outcome: 'UNKNOWN'; readonly reason: string; readonly correlationId?: string };

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export interface HealthReport {
  readonly state: HealthState;
  readonly checkedAt: Date;
  readonly detail?: string;
}

export interface Provider {
  readonly name: string;
  healthCheck(): Promise<HealthReport>;
}

/* ---------------------------------------------------------------- */
/* Identity and KYC                                                  */
/* ---------------------------------------------------------------- */

/**
 * Matches a mobile number to a national ID (the Shahkar service).
 *
 * Deliberately NOT the same interface as bank-account ownership. They are
 * different government services with different providers, different failure
 * modes, and different legal weight (SPEC §19).
 */
export interface MobileOwnershipProvider extends Provider {
  verify(input: {
    mobile: string;
    nationalId: string;
  }): Promise<ProviderResult<{ matched: boolean }>>;
}

/** Civil-registry lookup: does this national ID and birth date identify a real person? */
export interface IdentityProvider extends Provider {
  inquire(input: {
    nationalId: string;
    birthDate: string;
  }): Promise<ProviderResult<{ firstName: string; lastName: string; alive: boolean }>>;
}

/** Document capture and assessment. */
export interface KycProvider extends Provider {
  submitDocument(input: {
    nationalId: string;
    documentType: 'NATIONAL_ID_CARD';
    imageRef: string;
  }): Promise<ProviderResult<{ referenceId: string; accepted: boolean }>>;
  getStatus(referenceId: string): Promise<ProviderResult<{ status: KycProviderStatus }>>;
}

export type KycProviderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_RESUBMIT';

/** Liveness and face match. Returns a score; the threshold is platform policy, not vendor policy. */
export interface LivenessProvider extends Provider {
  check(input: {
    selfieRef: string;
    referenceImageRef: string;
  }): Promise<ProviderResult<{ live: boolean; matchScoreBps: number }>>;
}

/** Bank account ownership — IBAN or account number against a national ID. Separate from Shahkar. */
export interface BankAccountVerificationProvider extends Provider {
  verifyOwnership(input: {
    iban: string;
    nationalId: string;
  }): Promise<ProviderResult<{ matched: boolean; accountHolderName?: string }>>;
}

/** Bank card ownership, where the regulator or PSP requires it separately. */
export interface BankCardVerificationProvider extends Provider {
  verifyOwnership(input: {
    pan: string;
    nationalId: string;
  }): Promise<ProviderResult<{ matched: boolean }>>;
}

/* ---------------------------------------------------------------- */
/* Money movement                                                    */
/* ---------------------------------------------------------------- */

export type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN' | 'REFUNDED';

export interface PaymentProvider extends Provider {
  createPayment(input: {
    amountRial: bigint;
    idempotencyKey: string;
    callbackUrl: string;
    description: string;
  }): Promise<ProviderResult<{ providerRef: string; redirectUrl: string }>>;
  /** Server-to-server verification. Never trust the browser's return trip (SPEC §41). */
  verifyPayment(input: {
    providerRef: string;
  }): Promise<ProviderResult<{ status: PaymentStatus; amountRial: bigint }>>;
  getPayment(providerRef: string): Promise<ProviderResult<{ status: PaymentStatus }>>;
  refund(input: {
    providerRef: string;
    idempotencyKey: string;
  }): Promise<ProviderResult<{ refundRef: string }>>;
}

export type PayoutStatus =
  | 'SUBMITTED'
  | 'BANK_PROCESSING'
  | 'SETTLED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'RETURNED';

export interface PayoutProvider extends Provider {
  submit(input: {
    amountRial: bigint;
    destinationIban: string;
    idempotencyKey: string;
  }): Promise<ProviderResult<{ payoutRef: string; status: PayoutStatus }>>;
  getStatus(payoutRef: string): Promise<ProviderResult<{ status: PayoutStatus; bankRef?: string }>>;
}

/* ---------------------------------------------------------------- */
/* Market data                                                       */
/* ---------------------------------------------------------------- */

export type PriceFeedStatus = 'LIVE' | 'DEGRADED' | 'STALE' | 'UNAVAILABLE';

export interface PriceTick {
  readonly assetCode: string;
  /** Rial per gram, on the asset's declared weight basis. */
  readonly priceRialPerGram: bigint;
  readonly observedAt: Date;
  readonly sourceName: string;
}

/**
 * A single upstream price source. At least two independent implementations must
 * be configured in production — a lone feed is a single point of insolvency
 * (SPEC §23).
 *
 * Staleness detection, deviation guards, and the halt decision live in the
 * pricing service, not here. A source's only job is to report what it sees.
 */
export interface PriceProvider extends Provider {
  getLatest(assetCode: string): Promise<ProviderResult<PriceTick>>;
  subscribe(assetCode: string, onTick: (tick: PriceTick) => void): () => void;
}

/* ---------------------------------------------------------------- */
/* Custody                                                           */
/* ---------------------------------------------------------------- */

/**
 * Where controlled metal is physically held.
 *
 * Custody answers "where is it". Treasury answers "how much should we own, what
 * did it cost, what is our exposure". Keeping them apart is deliberate
 * (SPEC §55) — this interface must never grow a procurement method.
 */
export interface CustodyProvider extends Provider {
  getReservePosition(assetCode: string): Promise<ProviderResult<{ weightUg: bigint }>>;
  allocate(input: {
    assetCode: string;
    weightUg: bigint;
    idempotencyKey: string;
  }): Promise<ProviderResult<{ allocationRef: string }>>;
  release(input: {
    allocationRef: string;
    idempotencyKey: string;
  }): Promise<ProviderResult<{ released: true }>>;
  reconcile(assetCode: string): Promise<ProviderResult<{ weightUg: bigint; asOf: Date }>>;
}

/* ---------------------------------------------------------------- */
/* Messaging and storage                                             */
/* ---------------------------------------------------------------- */

export interface SmsProvider extends Provider {
  send(input: {
    mobile: string;
    template: string;
    variables: Readonly<Record<string, string>>;
  }): Promise<ProviderResult<{ messageRef: string }>>;
}

export interface NotificationProvider extends Provider {
  push(input: {
    deviceTokens: readonly string[];
    title: string;
    body: string;
    deepLink?: string;
  }): Promise<ProviderResult<{ delivered: number }>>;
}

export interface StorageProvider extends Provider {
  /** Stores an object encrypted at the application layer (SPEC §77). */
  put(input: {
    key: string;
    contentType: string;
    body: Uint8Array;
  }): Promise<ProviderResult<{ ref: string }>>;
  getSignedUrl(input: { ref: string; ttlSeconds: number }): Promise<ProviderResult<{ url: string }>>;
}

/** Regulatory reporting / sandbox connector. Shape will follow the licence decision (OPEN-3). */
export interface RegulatorProvider extends Provider {
  reportTrade(input: {
    tradeId: string;
    assetCode: string;
    side: 'BUY' | 'SELL';
    weightUg: bigint;
    amountRial: bigint;
    occurredAt: Date;
  }): Promise<ProviderResult<{ acknowledgementRef: string }>>;
}

/** Registry of everything the platform depends on externally. */
export interface ProviderRegistry {
  readonly mobileOwnership: MobileOwnershipProvider;
  readonly identity: IdentityProvider;
  readonly kyc: KycProvider;
  readonly liveness: LivenessProvider;
  readonly bankAccountVerification: BankAccountVerificationProvider;
  readonly payment: PaymentProvider;
  readonly payout: PayoutProvider;
  readonly prices: readonly PriceProvider[];
  readonly custody: CustodyProvider;
  readonly sms: SmsProvider;
  readonly notifications: NotificationProvider;
  readonly storage: StorageProvider;
}
