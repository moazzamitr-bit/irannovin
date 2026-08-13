# DECISIONS

Architecture decision log. One entry per decision that is expensive to
reverse or that an agent must not resolve on its own.

**Rules**
- An agent encountering an `OPEN` decision **stops and asks**. It does not
  pick one and continue.
- A decision moves to `SETTLED` only when a human records the choice and the
  date here.
- Reversing a `SETTLED` decision means a new entry that supersedes the old
  one. Entries are never edited away.

---

## SETTLED

### D-001 · Trading model: dealer / principal
**Date:** — · **Status:** SETTLED

The platform is the counterparty to every trade. No order book, no matching
engine. Consequences: no `pending` order state in normal operation; the
platform carries price risk; treasury exposure management (SPEC §10) is a
first-class subsystem rather than an afterthought.

### D-002 · Double-entry ledger
**Date:** — · **Status:** SETTLED

User *and* platform accounts. Every transaction sums to zero per asset.
Append-only. `balance_after` is not stored. Invariants are CI gates
(SPEC §2.2).

### D-003 · No password authentication
**Date:** — · **Status:** SETTLED

OTP + device binding + transaction PIN. A password resettable by OTP is
strictly weaker than the OTP and adds only attack surface (SPEC §7.1).

### D-004 · Integer units
**Date:** — · **Status:** SETTLED

Rial as `BIGINT`; metal weight in micrograms as `BIGINT`; rates in basis
points. Toman and grams are presentation-layer conversions only (SPEC §2.1).

### D-005 · Backend-only money math
**Date:** — · **Status:** SETTLED

The client submits a `quote_id` and never a price or a computed total.

### D-006 · Web/native split: Next.js + Expo over a shared core
**Date:** 2026-08-13 · **Status:** SETTLED · **Supersedes:** OPEN-2

`apps/web` is Next.js; `apps/client` is Expo for iOS and Android. Both build on
`packages/core`, which holds the API client, generated types, business logic,
formatting, and i18n catalogues. Only the UI layer differs.

Chosen over a single Expo + `react-native-web` codebase because the web funnel
matters for acquisition in this market, and `react-native-web` produces a
heavy, SEO-hostile build with weaker RTL support than native CSS — plus the
known difficulty of finding a charting library that behaves on both targets.

The cost is accepted: two UI layers, and the discipline to keep logic in
`packages/core` rather than letting it drift into either app.

### D-007 · GARM ships from its own repository
**Date:** 2026-08-13 · **Status:** SETTLED

The platform and کانون ایران‌نوین are separate businesses and will not share a
repository. The platform is self-contained under `garm/` in the interim; the
agency site has been restored to its own repository root.

The GitHub App available to this session cannot create repositories
(`403 Resource not accessible by integration`), so the final move is a manual
step — see the extraction instructions in `garm/README.md`. Nothing in the
platform depends on its parent directory, so the move is a history-preserving
subtree split rather than a migration.

---

## OPEN

### OPEN-1 · Product name
**Blocks:** Phase 0 (package identifiers, deep-link scheme, domain, store
listings)

"Geram" collides with `geram.ir`, an existing Iranian gold trading platform.
Needs a brand and trademark check before the name is embedded in
`app.<name>.*`, the `<name>://` scheme, and the domain.

**Needed from operator:** final name, or explicit approval to proceed with a
placeholder identifier that will be renamed before any store submission.

---

### OPEN-3 · Licence strategy
**Blocks:** Phase 2 · **Critical path for launch**

Does the operator pursue its own licences (eNamad, MIMT sandbox admission,
computer trade organisation, gold and silver union), or partner with an
existing licence holder and operate under it?

This changes the entity model, the custody arrangement, the settlement flow,
and the launch timeline. Legal work starts now regardless — it is longer than
the build.

---

### OPEN-4 · Hedging posture
**Blocks:** Phase 2 · **Changes the financial model**

Does the platform carry a net position (profiting from spread and price
movement, exposed to loss), or hedge every trade immediately (thinner margin,
near-zero price risk)?

Determines exposure limit defaults, whether hedge execution is manual or
automated, and how aggressive the auto-halt in SPEC §10.2 should be.

---

### OPEN-5 · KYC provider
**Blocks:** Phase 4 (real integration) · Phase 1 builds against a fake

Candidates include Finnotech and Jibit for Shahkar mobile/national-ID
matching, civil registry inquiry, IBAN ownership matching, face matching, and
liveness. Per-inquiry pricing is tiered and material at scale — model it.

**Needed:** contract, sandbox credentials, and the API surface actually
purchased.

---

### OPEN-6 · SMS provider
**Blocks:** Phase 4 · Phase 1 builds against a fake

Kavenegar or equivalent. Needs OTP-grade delivery latency and a dedicated
line. Confirm throughput limits and failover.

---

### OPEN-7 · Payment service provider
**Blocks:** Phase 4

Gateway deposit, identified deposit, and Paya/Satna withdrawal. At least two
PSPs are recommended for redundancy. Confirm settlement reporting format —
the daily reconciliation job (SPEC §12.3) depends on it.

---

### OPEN-8 · Price feed vendors
**Blocks:** Phase 2 · **Minimum two independent sources required**

SPEC §10.1 mandates at least two. Identify sources for domestic melted-gold
pricing, silver, and cathode copper, with their update frequency, SLA, and
historical reliability.
