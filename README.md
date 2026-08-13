# GARM — digital precious-metals platform

Monorepo for the Gold MVP described in [`docs/SPEC.md`](docs/SPEC.md).

`GARM` is an internal codename only. The final name is unresolved — see
[OPEN-1](docs/DECISIONS.md) — and appears nowhere user-visible.

---

## Layout

```
apps/
  irannovin/          Pre-existing کانون ایران‌نوین marketing site (Next.js 16).
                      Unrelated to the metals platform; preserved intact.
                      See docs/current-architecture.md §1.
packages/
  financial/          Money, metal, pricing and treasury arithmetic.
  providers/          External-system interfaces and deterministic mocks.
docs/                 Spec, decisions, audit, readiness.
```

## Setup

Requires Node 22+ and Docker.

```bash
npm install                 # install all workspaces
docker compose up -d        # postgres + redis for local development
npm run typecheck
npm run lint
npm run test
```

There is no API or client application yet. Phase 0 deliberately builds the
financial core and the provider boundary first: both are pure TypeScript with no
I/O, neither depends on the unresolved web/native decision, and they are the code
where a silent defect costs the most.

## Current state

| Package | Tests | Typecheck | Lint |
|---|---|---|---|
| `@garm/financial` | 70 passing | clean | clean, 0 warnings |
| `@garm/providers` | 13 passing | clean | clean, 0 warnings |

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
| [`docs/gerami-analysis-and-plan.md`](docs/gerami-analysis-and-plan.md) | Competitor teardown that informed the spec |

## Open decisions blocking further work

`OPEN-1` (product name) and `OPEN-2` (web/native code-sharing strategy) block
client scaffolding. `OPEN-3` (licence strategy) and `OPEN-4` (hedging posture)
must be answered before the treasury phase. See
[`docs/DECISIONS.md`](docs/DECISIONS.md).

No secrets belong in this repository. Environment variables are documented in
each app's `.env.example` as those apps are created.
