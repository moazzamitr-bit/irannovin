# SPEC — Digital Precious Metals Trading Platform

> **Status:** v2 draft · Reference document, not a prompt.
> **Codename:** `PLATFORM` (see [OPEN-1](#open-1-product-name) — the name "Geram" collides with an existing Iranian competitor at `geram.ir`).

---

## 0. How to use this document

This is the **single source of truth** for what gets built. It is not an
instruction to build everything at once.

- Agents and developers **read this document**, then execute one phase at a
  time from `docs/prompts/phase-N.md`.
- Anything that contradicts this document is a bug in the code or a change
  request to this document — never a silent deviation.
- Irreversible or contested decisions live in `docs/DECISIONS.md`. **Do not
  resolve an open decision by picking one and moving on.** Stop and ask.

Sections marked **[NON-NEGOTIABLE]** are correctness requirements. A phase is
not done if it violates one, regardless of how well the feature works.

---

## 1. Product definition

Users buy and sell digital gold, silver, and copper backed by physical stock
held in a vault owned by the platform operator. Users may redeem digital
balance for physical bullion or coins in standard weights, collected in
person or shipped.

### 1.1 The trading model is **dealer / principal**, not an exchange

This determines most of the architecture, so it is stated first and
explicitly:

- Users do **not** trade with each other. Every trade has the **platform as
  counterparty**.
- The platform publishes a two-way quote (a buy price and a sell price) and
  fills against its own inventory.
- Therefore: **there is no matching engine, no order book, and no `pending`
  order state in normal operation.** An order is either executed atomically
  or rejected.
- Therefore: **the platform carries price risk.** See §10.

> The original spec's `orders.status ENUM[pending, filled, cancelled]` implied
> an order book. It is replaced by `executed | rejected | reversed`.
> `pending` exists only for **trigger orders** (§9.4), which are a scheduled
> execution against the platform's own quote — not a resting order in a book.

### 1.2 Delivery targets

One product, three surfaces: web (PWA), Android, iOS. The code-sharing
strategy is **[OPEN-2](#open-2-webnative-code-sharing-strategy)** — do not
scaffold until it is resolved.

---

## 2. Non-negotiable money invariants **[NON-NEGOTIABLE]**

Everything in this section is enforced by automated tests that run in CI on
every push. A red invariant test blocks merge.

### 2.1 Units

| Quantity | Stored as | Rationale |
|---|---|---|
| Money | `BIGINT`, **Iranian rial**, integer | Rial is the legal unit; toman is a display convention. Storing rial removes ×10 ambiguity at every boundary. |
| Metal weight | `BIGINT`, **micrograms (µg)** | 1 g = 1,000,000 µg. A 200,000-toman minimum gold buy is ~20,000 µg — ample precision headroom for rounding. |
| Prices | `BIGINT`, **rial per gram** | Integer, no scaling factor to forget. |
| Percentages (fees, spreads) | `INTEGER`, **basis points** | 50 bps = 0.5%. Never a float. |

- **Never** `FLOAT`, `DOUBLE`, or JS `number` for any of the above. Use
  `BigInt` in TypeScript and `BIGINT`/`NUMERIC` in Postgres.
- Display conversion (rial → toman, µg → gram) happens **only** in the
  presentation layer, never in storage or business logic.

### 2.2 The ledger is double-entry

The original spec had only user wallets. That is single-entry: when a user
buys gold, the rial has no recorded destination, the books never balance, and
correctness cannot be proven. Corrected model:

- Accounts exist for **users and for the platform**. Platform accounts are at
  minimum: `inventory` (per metal), `settlement` (rial), `fee_revenue`,
  `rounding`, and `liability` (per metal — what is owed to users).
- **Every** balance-changing event writes **two or more entries sharing one
  `transaction_id`**, and for each asset those entries **sum to exactly
  zero**.
- Entries are **append-only**. No `UPDATE`, no `DELETE`, ever. A correction is
  a new transaction with reversing entries and `reverses_transaction_id` set.

```sql
-- Invariant 1: every transaction balances, per asset.
SELECT transaction_id, asset, SUM(amount) AS drift
FROM ledger_entries
GROUP BY transaction_id, asset
HAVING SUM(amount) <> 0;
-- MUST return zero rows.

-- Invariant 2: materialized balance matches the ledger.
SELECT a.id, a.balance, COALESCE(SUM(e.amount), 0) AS derived
FROM accounts a
LEFT JOIN ledger_entries e ON e.account_id = a.id
GROUP BY a.id, a.balance
HAVING a.balance <> COALESCE(SUM(e.amount), 0);
-- MUST return zero rows.

-- Invariant 3: platform is never short. Issued user liability for a metal
-- never exceeds vault inventory.
-- (Threshold-alerting version in §10.2.)
```

Both invariants run as: (a) a Jest global teardown assertion after every
integration test suite, and (b) a scheduled production job (§12.3).

### 2.3 Rounding

Sub-unit remainders are **never discarded** — discarded remainders are how
ledgers silently drift.

1. Compute the exact result using integer arithmetic.
2. Round the **user-facing credited amount** in the user's favour.
3. Post the difference to the `platform:rounding` account so the transaction
   still sums to zero.

The rounding account's balance is a monitored metric. A steadily growing
magnitude means a calculation bug, not a business outcome.

### 2.4 Idempotency

Every endpoint that can move money **must** accept an `Idempotency-Key`
header and is **required** to be safe under retry. Iranian mobile networks
drop connections mid-request; clients retry; users double-tap.

- Key is stored with the request fingerprint and the resulting
  `transaction_id`.
- A repeat with the same key returns the **original response**, and performs
  no new work.
- A repeat with the same key but a **different body** is a `409`.
- Retention: 24 hours minimum.

### 2.5 Concurrency

- Debits acquire a row lock on the account (`SELECT … FOR UPDATE`) inside the
  transaction. No optimistic-retry loop for balance changes.
- **`balance_after` is removed from `ledger_entries`.** It cannot be computed
  correctly under concurrent writes to the same account without serialising
  them, and it duplicates state that Invariant 2 already validates.
- Required test: N parallel sell orders against a balance that covers only
  one must result in exactly one success and N−1 clean rejections, with the
  ledger balanced. This test runs in CI.

---

## 3. Architecture

### 3.1 Settled

- **Backend:** Node.js + NestJS, TypeScript `strict`, PostgreSQL via Prisma,
  Redis for live price cache, rate limiting, OTP storage, and idempotency
  keys.
- **Money core is server-side only.** The client never computes an executable
  number. It displays server-computed values and submits a `quote_id`.
- **Admin panel is a separate web application.** It is never bundled into the
  mobile app and never shares an auth realm with the user API.
- **Local dev:** Docker Compose (postgres, redis, api). CI: GitHub Actions
  running typecheck, lint, unit, integration, and the invariant suite.
- **Hosting:** inside Iran (regulatory requirement, payment gateway access,
  latency).

### 3.2 Open — resolve before Phase 0

See `docs/DECISIONS.md`. Summary: web/native code-sharing strategy, product
name, KYC provider, SMS provider, PSP, price feed vendors, and whether the
operator holds its own licence or partners with a licence holder.

### 3.3 Service boundaries

```
client (web + native)
        ↓  REST + WebSocket
API gateway (NestJS)
        ↓
┌───────────────────────────────────────────────────────┐
│ auth        OTP, sessions, devices, transaction PIN   │
│ kyc         provider-agnostic, behind an interface    │
│ pricing     feed ingestion, guards, spread, quotes    │
│ trading     quote execution, trigger orders           │
│ ledger      double-entry core — the source of truth   │
│ payments    PSP deposits, Paya/Satna withdrawals      │
│ treasury    inventory, exposure limits, hedge signals │
│ redemption  physical fulfilment                       │
│ notify      SMS, push, in-app                         │
└───────────────────────────────────────────────────────┘
        ↓
PostgreSQL · Redis · object storage (encrypted KYC documents)
```

`ledger` is the only module permitted to write to `accounts` and
`ledger_entries`. Every other module calls it. This is enforced by an ESLint
boundary rule, not by convention.

---

## 4. Tech stack — client

- TypeScript `strict: true`. No `any`. No `@ts-ignore` without an adjacent
  comment giving the reason.
- **State:** Zustand for local UI state; TanStack Query for all server data.
- **Optimistic updates:** permitted for *navigation and UI affordances only*.
  **Never** optimistically show a balance change before the server confirms
  the transaction. Show the pending state instead. A balance that briefly
  displays a wrong number destroys trust in a financial product faster than a
  200 ms delay does.
- **Realtime:** WebSocket subscription to a `prices` channel. Ticks are
  advisory display data. They are **never** the basis for execution — only a
  server-issued quote is (§9.1).
- **i18n:** from the first commit. Persian (primary, RTL) and English
  (secondary, LTR). No hardcoded strings in components, including error
  messages and toasts.

---

## 5. Design system

- **Palette:** warm gold/amber primary (`#D4A24C` family); deep warm charcoal
  for dark surfaces; warm off-white for light. Silver-grey and copper-orange
  are **semantic asset colours** — used only to denote the silver and copper
  assets in charts, badges, and rows. They are not decorative accents.
- **Typography:** Vazirmatn or IRANSans via `expo-font` (or self-hosted
  `@font-face` on web — never a CDN link, it will be blocked or slow).
  Type scale: display, h1–h3, body, caption.
- **Numerals:** all monetary and weight values use `tabular-nums` and Persian
  thousand separators in the `fa` locale.
- **Themes:** light and dark, both fully designed. Default follows system;
  explicit choice persists.
- **Motion:** Reanimated. Price ticks flash green/red; balances animate on
  change; skeletons on every load — never a blank screen. All motion respects
  `prefers-reduced-motion`.
- **Shared component package:** `Button`, `Card`, `Input`, `NumericInput`,
  `BottomSheet`, `Tabs`, `StatBadge`, `AssetRow`, `PriceChart`, `Toast`,
  `QuoteTimer`, `EmptyState`, `ErrorState`. One-off styled components in
  screens are a review rejection.
- **RTL:** use logical properties (`start`/`end`), never `left`/`right`. Every
  screen is verified in both directions.

---

## 6. Screens

### Auth
Phone entry → OTP → (new user: profile setup) / (existing: dashboard).
Referral code auto-fill via deep link and its web equivalent.

**No password authentication.** See §7.1 for the rationale and the
replacement.

### KYC — target under 3 minutes
1. National ID + birth date → server-side identity inquiry.
2. National ID card capture.
3. Liveness / selfie check.

Status: `not_started | step1_done | step2_done | pending_review | verified |
rejected`. Rejection always carries a user-readable reason and a retry path.

### Main tabs
- **Home** — rial and metal balances, 24h change badges, price chart
  (day/week/month/year), quick actions, recent activity.
- **Trade** — per asset. *Simple* mode: enter rial **or** weight, the other
  side and full fee breakdown compute live; a visible quote countdown.
  *Advanced* mode: candlestick/line chart, trigger orders.
- **Portfolio** — per-asset breakdown, allocation donut, 24h change,
  per-asset shortcuts.
- **Cash** — bank card management (ownership-verified), deposit (gateway and
  identified transfer), withdrawal to own account with an explicit
  settlement-time notice.
- **Redeem** — physical redemption in standard tiers, with price, service
  fee, and tax itemised before submission; pickup code and official invoice
  on approval.
- **Reports** — trades, deposits, withdrawals, redemptions, referral
  earnings. Date filtering, CSV export.
- **Referral** — code, share link, live stats, earnings by period.
- **Settings** — profile, transaction PIN, email, notification preferences,
  KYC status, linked cards, devices/sessions with revoke, about, logout,
  account deletion request.

### Admin (separate web app)
User management · KYC review queue with reasoned approve/reject · price,
spread, and fee configuration per asset · **treasury dashboard: inventory vs.
issued liability vs. net exposure** · order and transaction monitoring ·
manual reversal tool (dual-approval, fully audited) · redemption fulfilment
queue · support inbox · **kill switch** (§10.3).

---

## 7. Authentication

### 7.1 No passwords **[NON-NEGOTIABLE]**

The original spec offered optional password login with OTP-based reset. That
makes the password strictly weaker than the OTP that resets it: it adds
credential-stuffing exposure, argon2 tuning, and a recovery flow, while
adding no security. It is removed.

**Replacement:**
- **Phone + OTP** for authentication.
- **Device binding** — a new device requires OTP plus a notification to
  existing sessions. Sessions are listed and individually revocable.
- **Transaction PIN** (6 digits, argon2id-hashed, rate-limited with lockout)
  required for: withdrawals, redemption requests, adding a bank card, and
  trades above a configurable threshold. Biometric unlock may front the PIN
  on native, never replace it server-side.

### 7.2 Tokens
JWT access (short-lived) + refresh with rotation and reuse detection. Reuse
of a rotated refresh token revokes the whole device session family and
notifies the user.

### 7.3 OTP
- Rate-limited per phone **and** per IP, with exponential backoff.
- 6 digits, single use, ≤120 s validity, constant-time comparison.
- Never logged, never returned in a response body, never in an error message.

---

## 8. Data model

Names are indicative; adjust for Prisma conventions but preserve semantics.

```
users(id, phone, national_id_encrypted, full_name, birth_date,
      email NULLABLE, kyc_status, transaction_pin_hash NULLABLE,
      referral_code, referred_by, aml_tier, deleted_at, created_at)

devices(id, user_id, device_info, last_seen_at, revoked_at)
refresh_tokens(id, device_id, token_hash, rotated_to, revoked_at, created_at)

accounts(id, owner_type ENUM[user, platform], owner_id NULLABLE,
         asset ENUM[IRR, XAU, XAG, XCU],
         kind ENUM[available, locked, inventory, settlement,
                   fee_revenue, rounding, liability],
         balance BIGINT NOT NULL DEFAULT 0,
         UNIQUE(owner_type, owner_id, asset, kind))

ledger_entries(id, transaction_id UUID, account_id, asset,
               amount BIGINT,              -- signed; + debit, − credit
               entry_type ENUM[deposit, withdrawal, trade, fee,
                               referral_reward, redemption, rounding,
                               reversal, adjustment],
               reference_id, reverses_transaction_id NULLABLE, created_at)
               -- append-only; no balance_after (§2.5)

quotes(id, user_id, asset, side ENUM[buy, sell],
       unit_price BIGINT, amount_rial BIGINT, amount_metal BIGINT,
       fee_rial BIGINT, expires_at, consumed_at NULLABLE,
       consumed_by_order_id NULLABLE, created_at)

orders(id, user_id, quote_id, asset, side, amount_rial, amount_metal,
       unit_price, fee_rial, transaction_id,
       status ENUM[executed, rejected, reversed],
       rejection_reason NULLABLE, idempotency_key, created_at)

trigger_orders(id, user_id, asset, side, target_price, amount_rial NULLABLE,
               amount_metal NULLABLE, expires_at,
               status ENUM[armed, triggered, executed, cancelled, expired],
               resulting_order_id NULLABLE, created_at)

bank_cards(id, user_id, card_number_encrypted, card_number_masked, iban,
           owner_match_verified BOOL, verified_at, deleted_at)

deposits(id, user_id, method ENUM[gateway, identified, manual],
         amount BIGINT, status, psp_ref, transaction_id NULLABLE, created_at)

withdrawals(id, user_id, amount BIGINT, bank_card_id, status,
            bank_ref NULLABLE, transaction_id NULLABLE, created_at)

physical_redemptions(id, user_id, asset, tier_id, weight_ug BIGINT,
                     metal_price BIGINT, service_fee BIGINT, tax BIGINT,
                     status ENUM[requested, awaiting_payment, reserved,
                                 ready_for_pickup, delivered, cancelled],
                     pickup_code, invoice_number, transaction_id, created_at)

redemption_tiers(id, asset, label, weight_ug, service_fee, tax_bps,
                 active BOOL)

vault_inventory(id, asset, tier_id NULLABLE, quantity, reserved_quantity,
                updated_at)

referrals(id, referrer_id, referee_id, created_at)
referral_rates(id, asset, rate_bps, effective_from)   -- versioned, not
                                                      -- stored per referral
referral_rewards(id, referral_id, order_id, amount BIGINT, transaction_id,
                 created_at)

kyc_submissions(id, user_id, step, provider, provider_ref,
                provider_response_encrypted, status, reviewed_by, reason,
                created_at)

price_ticks(asset, source, price BIGINT, received_at)     -- raw, per source
prices(asset, buy_price, sell_price, mid_price, spread_bps, source_count,
       status ENUM[live, stale, halted], updated_at)      -- Redis + hourly
                                                          -- Postgres snapshot

asset_config(asset, fee_bps, spread_bps, min_trade_rial, max_trade_rial,
             trading_enabled, updated_by, updated_at)

exposure_limits(asset, max_net_short_ug, max_net_long_ug, warn_ratio_bps)

idempotency_keys(key, user_id, endpoint, request_hash, response_body,
                 transaction_id NULLABLE, created_at)

outbox(id, aggregate, payload, status, attempts, next_attempt_at, created_at)

audit_log(id, actor_type, actor_id, action, target, before, after,
          ip, user_agent, created_at)                     -- append-only
```

Note `referral_rates` is versioned globally rather than copied into each
`referrals` row — the original design made a rate change require rewriting
historical rows.

---

## 9. Core flows

### 9.1 Quote → execute **[NON-NEGOTIABLE]**

```
1. Client requests a quote: { asset, side, amount_rial | amount_metal }
2. Server:
     - reads current guarded price (§10.1)
     - applies spread and fee from asset_config
     - persists a quotes row with expires_at = now + T   (T configurable,
       default 20s)
     - returns { quote_id, unit_price, amount_rial, amount_metal,
                 fee_rial, expires_at }
3. Client displays a countdown. It sends back ONLY quote_id.
4. Server executes, in ONE database transaction:
     a. load quote FOR UPDATE; reject if expired or consumed
     b. lock the debited account FOR UPDATE
     c. verify KYC status, AML tier limit, asset trading_enabled
     d. verify treasury exposure limit (§10.2)
     e. write balanced ledger entries:
            user:IRR         −(amount_rial)
            platform:settle  +(amount_rial − fee)
            platform:fee     +(fee)
            user:XAU         +(amount_metal)
            platform:liab    −(amount_metal)
            platform:round   ±(remainder)
        (mirrored for a sell)
     f. insert order row, mark quote consumed
   COMMIT
5. Enqueue outbox events: notification, referral reward, treasury signal.
```

- An expired quote returns `410` with a fresh quote attached, so the client
  can re-confirm in one tap.
- **A price supplied by the client is never accepted for any purpose.**

### 9.2 Deposit
Gateway callback → verify signature and amount against the PSP → idempotent
ledger credit → outbox notification. A callback for an unknown or already
settled reference is a no-op that returns 200 (PSPs retry).

### 9.3 Withdrawal
PIN required → validate the destination card belongs to the verified user →
debit to a `locked` account immediately → queue for Paya/Satna → on bank
confirmation move locked → out. On bank rejection, reverse to `available`
with a reversal transaction. Users see settlement-cycle expectations before
confirming.

### 9.4 Trigger orders
A trigger order is **armed**, not resting. A background evaluator checks armed
orders against the guarded price. On trigger it issues a server-side quote and
executes it through the exact same path as §9.1 — no parallel execution code
path is permitted. If execution fails (insufficient funds, limit breach), the
order moves to `cancelled` with a reason and the user is notified.

### 9.5 Physical redemption
Check `vault_inventory.quantity − reserved_quantity` for the tier. If
insufficient, the tier renders as *temporarily unavailable* — never oversell.
On request: reserve inventory, lock the user's metal, itemise metal price +
service fee + tax, take payment for fees, then move through the fulfilment
state machine. Locked metal is released on cancellation via a reversal.

### 9.6 Referral rewards
Computed at each invitee trade, from the **realised fee** of that trade, at
the `referral_rates` rate effective at trade time. Never a flat bonus, never
retroactive. Posted as its own balanced transaction referencing the order.

---

## 10. Treasury and price risk

Absent from the original spec, and the largest business risk in a dealer
model.

### 10.1 Price feed guards **[NON-NEGOTIABLE]**
- **Minimum two independent sources.** A single source is a single point of
  insolvency.
- Reject a tick deviating more than `X%` from the trailing median; alert.
- If sources disagree by more than `Y%`: mark `halted`.
- If no fresh tick within `N` seconds: mark `stale`, then `halted`.
- `halted` blocks quote issuance and trigger execution. The client shows an
  honest "pricing temporarily unavailable" state — never a stale number
  presented as live.

### 10.2 Exposure limits
Net position per metal = `vault_inventory − issued_user_liability`.
- Beyond `warn_ratio` → alert the operator, emit a hedge signal.
- Beyond `max_net_short` → **automatically stop accepting buy orders for that
  metal** while continuing to accept sells. Partial degradation, not outage.
- Invariant 3 (§2.2) is evaluated continuously, not only on a dashboard.

### 10.3 Kill switch
A single admin action that halts quote issuance and execution, globally or
per asset, taking effect within one second across all instances. Built in
**Phase 2**, not later. In-flight quotes are honoured; no new ones are
issued.

### 10.4 Market hours
Define behaviour explicitly for Iranian holidays and periods when the
reference market is closed: either widen the spread by a configured amount or
halt. Silence here means a stale price gets traded against.

---

## 11. Security and compliance

- Trading, withdrawal, and redemption are gated on `kyc_status = verified` —
  enforced in a backend guard, never only in the UI.
- Bank cards are accepted only when the card's owner national ID matches the
  user's verified national ID, checked server-side. A mismatch is rejected
  with a clear reason and is audit-logged.
- **AML:** per-tier transaction and velocity limits (single, daily, monthly),
  pattern flags (rapid deposit → trade → withdraw; structuring below
  thresholds), and a review queue. Limits are configuration, not code.
- National ID, card numbers, and KYC provider payloads are encrypted at the
  **application layer** with a KMS-held key — not merely disk encryption.
- Full masking in logs: no card numbers, OTPs, national IDs, PINs, or tokens
  in plaintext anywhere, including error traces and third-party monitoring.
- `audit_log` is append-only and covers every admin action and every
  balance-changing event.
- Input validation with `zod`/`class-validator` on **every** endpoint. Strict
  CORS. CSRF protection on the admin panel.
- Transaction PIN and OTP endpoints have lockout, not just rate limiting.

### 11.1 Regulatory track — runs in parallel from day one
Absent from the original spec and on the project's critical path. Online
precious-metals platforms in Iran are supervised by the Ministry of Industry,
Mine and Trade (وزارت صمت) together with the virtual businesses union. Required
in parallel with engineering: eNamad, the MIMT regulatory sandbox admission,
computer trade organisation licence, and gold and silver union approval.

**A platform with finished code and no licence is worth zero.** Legal work
starts in Phase 0 and gates the public launch, not the build.

---

## 12. Reliability

### 12.1 Transactional outbox **[NON-NEGOTIABLE]**
Side effects (SMS, push, referral posting, treasury signals, webhooks) are
written to `outbox` **inside** the same database transaction as the ledger
write, then delivered asynchronously with retry and backoff. Never call an
external service inside a money transaction, and never fire a side effect
that the transaction may still roll back.

### 12.2 Partial failure
Every external interaction defines its reconciliation path: PSP confirmed but
ledger write failed; bank transfer submitted but response lost; KYC provider
timed out after charging. Each gets a reconciliation job that converges to a
correct state, plus a manual admin resolution tool with dual approval.

### 12.3 Reconciliation jobs
- **Continuous:** invariants 1–3.
- **Daily:** PSP settlement report vs. ledger deposits; bank statement vs.
  withdrawals; vault physical count vs. `inventory` account.
- Any discrepancy pages the operator. Reconciliation is not a report someone
  reads when they remember to; it is an alarm.

---

## 13. Quality process

- TypeScript `strict`. ESLint + Prettier enforced in CI; **warnings fail the
  build**.
- **Unit tests** for every fee, spread, price, rounding, and ledger
  calculation. Property-based tests where feasible — these functions are the
  highest-risk code in the product.
- **Integration tests** for quote→execute, deposit, withdrawal, redemption,
  and referral posting.
- **Concurrency tests** (§2.5) — parallel requests, asserted no double-spend.
- **Invariant suite** — runs after every integration suite and in production
  on a schedule.
- **E2E:** Playwright for web; Detox for native. Covering signup + OTP, KYC
  happy path, buy, sell, deposit, redemption request.
- **Accessibility pass** per screen: touch target sizes, contrast in both
  themes, RTL mirroring, screen-reader labels.

No TODOs, no dead code, no `any`, no unhandled rejections in merged work.

---

## 14. Build order

Phases are separate pull requests, executed in order. Each has its own prompt
in `docs/prompts/`.

| Phase | Content | Notes |
|---|---|---|
| **0** | Repo scaffolding, CI, Docker Compose, design-system package, theming, i18n, provider **interfaces with fake implementations** (SMS, KYC, PSP, price feed) | Real vendors are not chosen yet — building against fakes is deliberate, not a shortcut |
| **1** | Auth: OTP, devices/sessions, transaction PIN. KYC 3-step against the fake provider. Profile | No passwords |
| **2** | **Ledger core + invariant suite + admin manual credit + price feed with guards + kill switch + quote/execute for ONE metal (silver)** | The most important phase. Admin manual credit exists so the flow is testable end-to-end before real deposits |
| **3** | Gold and copper, advanced trade mode, trigger orders, portfolio, reports | |
| **4** | Real PSP deposit, withdrawal, bank card ownership verification | Requires PSP contract |
| **5** | Physical redemption, vault inventory, admin fulfilment | |
| **6** | Referral programme | |
| **7** | Treasury dashboard, exposure automation, AML tooling, admin hardening | |
| **8** | Security review, load testing on the price and execution paths, EAS release builds | |

Two corrections against the original ordering:

1. **Phase 2 gains admin manual credit.** The original put deposits in Phase
   4, leaving trading in Phases 2–3 with no way for a user to hold rial —
   untestable end to end.
2. **KYC in Phase 1 runs against a fake provider** behind an interface,
   because the real provider is a pending commercial decision. The same
   applies to SMS, PSP, and the price feed.

---

## 15. Definition of done — every phase

- Works identically on web, Android, and iOS.
- No console errors or warnings; no unhandled rejections.
- Every new endpoint: input validation, auth guard, rate limit where
  relevant, and at least one automated test.
- Loading, empty, and error states designed — not only the happy path.
- Light and dark verified; RTL and LTR verified.
- Invariant suite green.
- No open `[NON-NEGOTIABLE]` violations.

---

## 16. Open decisions

Do not resolve these unilaterally. They live in `docs/DECISIONS.md`.

### OPEN-1: Product name
"Geram" collides with `geram.ir`, an existing Iranian gold platform. Resolve
before it is baked into package identifiers, deep-link schemes, and domains.

### OPEN-2: Web/native code-sharing strategy
Expo + `react-native-web` gives one codebase but a heavier, SEO-hostile web
build, weaker RTL support than native CSS, and a known charting problem. The
alternative — Next.js for web, Expo for native, sharing `packages/core` (API
client, types, business logic, i18n) — costs more code and gives each surface
a proper experience. **Reversing this later is expensive.**

### OPEN-3 … OPEN-7
Licence strategy (own vs. partner with a holder), hedging posture (carry
position vs. hedge every trade), KYC provider, SMS provider, PSP, price feed
vendors.

**OPEN-3 (licence) and the hedging posture question change the architecture
and the financial model.** They are answered before Phase 2.
