# Phase 0 — Scaffolding, CI, Design System, Provider Interfaces

**Read `docs/SPEC.md` and `docs/DECISIONS.md` in full before writing any
code.** This prompt is scoped to Phase 0 only. Do not implement features from
later phases, even if they seem trivial to add while you are nearby.

---

## Before you start — blocking check

`docs/DECISIONS.md` contains **OPEN-1** (product name) and **OPEN-2**
(web/native code-sharing strategy). Both block scaffolding.

**Stop and ask the operator to resolve them.** Do not pick an option and
proceed. If OPEN-1 is resolved as "placeholder for now", use `platform` as
the identifier everywhere and note every location that will need renaming in
a `RENAME.md` at the repo root.

---

## Scope

### 1. Repository structure
A monorepo, laid out per the OPEN-2 outcome. Regardless of that choice:

- `packages/core` — API client, shared TypeScript types, business-logic
  helpers, formatting (rial↔toman, µg↔gram, Persian numerals), i18n message
  catalogues. **No UI, no platform-specific imports.**
- `packages/ui` — the shared design-system components listed in SPEC §5.
- `apps/api` — NestJS backend.
- `apps/admin` — admin web app (scaffold only; no features this phase).
- Client app package(s) per OPEN-2.

### 2. Backend scaffolding (`apps/api`)
- NestJS, TypeScript `strict: true`.
- Prisma with the **full schema from SPEC §8** written and migrated. Tables
  are created this phase even though most stay unused until later phases —
  the schema is the contract and reviewing it once, whole, is the point.
- Redis wired for cache, rate limiting, OTP storage, and idempotency keys.
- Global validation pipe (`class-validator`), strict CORS, helmet.
- Health endpoint. No business endpoints this phase.
- **ESLint module-boundary rule** enforcing that only the `ledger` module may
  import the `accounts` and `ledger_entries` Prisma models (SPEC §3.3). The
  rule ships now, before there is anything to violate it.

### 3. Money primitives — build and test these first
Before any feature code, in `packages/core`:

- `Rial` and `Microgram` branded `BigInt` types that cannot be mixed
  accidentally or silently coerced to `number`.
- Formatting helpers: rial→toman display, µg→gram display, Persian thousand
  separators, `tabular-nums` alignment.
- Basis-point arithmetic helpers.
- **Unit tests covering rounding behaviour at boundaries** and a test that
  asserts a `number` cannot reach these functions without a type error.

These are the foundation for every financial calculation in the product. They
are worth getting right in isolation, with tests, before anything depends on
them.

### 4. Provider interfaces with fake implementations
Define the interface **and** a fake for each. The fakes are the only
implementations this phase, and they stay in place through Phase 3.

- `SmsProvider` — send OTP. Fake logs to console and exposes the last code to
  the test harness.
- `KycProvider` — identity inquiry, document submission, liveness. Fake
  returns deterministic results keyed by input so tests can drive every
  branch, including rejection.
- `PaymentProvider` — deposit intent, callback verification, payout. Fake
  simulates success, failure, timeout, and duplicate callback.
- `PriceFeedSource` — a single source; the multi-source guard layer arrives
  in Phase 2. Fake emits a configurable series including stale and spike
  scenarios.

Each fake must be able to produce its failure modes on demand. Fakes that
only do the happy path are worse than useless — they build false confidence.

### 5. Design system (`packages/ui`)
Components from SPEC §5, with theming, the type scale, and both light and
dark palettes as tokens. RTL via logical properties throughout. A gallery
screen rendering every component in all four combinations
(light/dark × RTL/LTR) — this is the visual regression surface for later
phases.

### 6. i18n
`fa` (primary, RTL) and `en`. Every string in a catalogue from the first
commit. A lint rule failing on string literals in JSX.

### 7. Local dev and CI
- Docker Compose: postgres, redis, api.
- One-command bootstrap, documented in the root README.
- GitHub Actions on every push: typecheck → lint (warnings fail) → unit tests
  → build. Add the integration and invariant jobs as empty-but-wired stages
  so Phase 2 only has to fill them.

---

## Definition of done

- `docker compose up` plus one command yields a running API and client.
- CI green, zero warnings.
- Component gallery renders correctly in light, dark, RTL, and LTR.
- Money primitives have tests, including boundary rounding.
- Every provider interface has a fake that can produce its failure modes.
- Prisma schema matches SPEC §8, migration applied.
- Module-boundary lint rule active.
- No `any`, no `@ts-ignore` without a reason comment, no TODOs, no dead code.

## Out of scope

Authentication, OTP delivery, KYC logic, any ledger write, any price
ingestion, any screen beyond the gallery and a placeholder shell. If a task
seems to require one of these, it belongs to a later phase — say so rather
than building it.
