# GARM — digital precious-metals platform

Monorepo for the Gold MVP described in [`docs/SPEC.md`](docs/SPEC.md).

`GARM` is an internal codename only. The final name is unresolved — see
[OPEN-1](docs/DECISIONS.md) — and appears nowhere user-visible.

---

## This directory is destined to leave its parent repository

It currently sits inside the کانون ایران‌نوین repository for historical reasons.
The two are separate businesses and share no code (decision D-007). Nothing here
references anything outside this directory, so extraction is a history-preserving
subtree split:

```bash
# From the parent repository root, with a clean working tree:
git subtree split --prefix=garm -b garm-main

# Create an empty repository on GitHub, then:
git push git@github.com:<owner>/garm-platform.git garm-main:main

# Finally, remove the directory from the parent repository:
git rm -r garm && git commit -m "Move platform to its own repository"
```

CI lives at `garm/.github/workflows/ci.yml`. GitHub only runs workflows found at
a repository root, so it stays dormant until the split — at which point it is
already in the right place and runs unchanged.

## Layout

```
packages/
  financial/          Money, metal, pricing and treasury arithmetic.
  domain/             Identity, access, risk and trading policy — OTP, token
                      rotation, KYC, RBAC, step-up, price-feed guards, quote
                      lifecycle, trade state machine.
  ledger/             Double-entry journal and posting builders. The financial
                      source of truth.
  providers/          External-system interfaces and deterministic mocks.
  core/               Shared client logic — API client, types, i18n. (next)
apps/
  api/                Trading service, repository ports, in-memory adapters,
                      Prisma schema. HTTP layer and Prisma adapter next.
  web/                Next.js. (not started, per decision D-006)
  client/             Expo — iOS and Android. (not started, per decision D-006)
docs/                 Spec, decisions, audit, per-phase prompts.
```

## Setup

Requires Node 22+ and Docker.

```bash
npm install                 # install all workspaces
docker compose up -d        # postgres + redis for local development
npm run typecheck
npm run lint
npm run test

npm run demo -w @garm/api   # walk the whole trade path and print what happens
```

There is no UI and no running server yet. `npm run demo` is the closest thing
to seeing the system work: it drives the real services against the in-memory
adapters and prints the quote, the ledger entries, the refusal paths, and the
final balances.

The packages are built before the applications on purpose: they are pure
TypeScript with no I/O, they do not depend on the unresolved decisions in
`DECISIONS.md`, and they hold the logic where a silent defect costs the most —
money arithmetic and security policy.

## Current state

| Package | Tests | Typecheck | Lint |
|---|---|---|---|
| `@garm/financial` | 70 passing | clean | clean, 0 warnings |
| `@garm/domain` | 94 passing | clean | clean, 0 warnings |
| `@garm/ledger` | 26 passing | clean | clean, 0 warnings |
| `@garm/providers` | 13 passing | clean | clean, 0 warnings |
| `@garm/api` | 19 passing | clean | clean, 0 warnings |

**222 tests passing.** Unit, property-based, and service-level tests run here.
The service tests drive the whole trade path — quote, reserve, execute, post,
verify — against in-memory adapters, so sequencing and invariants are covered
without a database. Real locking and true concurrency still need Postgres.

## The rules that matter

Full detail in [`docs/SPEC.md`](docs/SPEC.md). The ones that shape everything
else:

- **No floating point in financial code.** Rial and micrograms are `BIGINT`;
  rates are basis points. `packages/financial` is the only module permitted to
  do financial arithmetic.
- **Rial is canonical, toman is display.** Micrograms are canonical, grams are
  display. Conversion happens at the edge and never flows back inward.
- **The ledger is double-entry and append-only.** Balances are derived, never
  authoritative. Corrections are reversing entries.
- **Never optimistically update a financial balance.** Show the real
  intermediate state until the server confirms.
- **Weight is meaningless without purity and basis.** 705 melted gold and 750
  retail gold are different things; fine content and gross weight are different
  numbers. Both are explicit in the type system.
- **Spread is not a revenue line.** It is a component of realised inventory P&L.
  Booking both double-counts.

## Documentation

| Document | Contents |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | The build specification — the source of truth |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Settled and open architecture decisions |
| [`docs/current-architecture.md`](docs/current-architecture.md) | Phase 0 repository audit |
| [`docs/prompts/`](docs/prompts/) | Per-phase implementation prompts |
| `../docs/gerami-analysis-and-plan.md` | Competitor teardown that informed the spec |

## Open decisions blocking further work

`OPEN-2` is resolved (D-006: Next.js + Expo over a shared core), so client
scaffolding is unblocked. `OPEN-1` (product name) remains open but blocks only
store submission — `GARM` appears in package names and nowhere user-visible, so
renaming is a find-and-replace.

`OPEN-3` (licence strategy) and `OPEN-4` (hedging posture) must be answered
before the treasury phase; both change the architecture. See
[`docs/DECISIONS.md`](docs/DECISIONS.md).

No secrets belong in this repository. Environment variables are documented in
each app's `.env.example` as those apps are created.
