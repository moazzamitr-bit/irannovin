# Current Architecture — Repository Audit

> SPEC §5 deliverable. Produced at the start of Phase 0, before any
> architectural change.

---

## 1. Headline finding

**The existing repository is not a گرم marketing site.** SPEC §5 instructs the
build to "find the existing marketing website" and "do not destroy an existing
working homepage", on the assumption that a Geram/GARM public site already
exists here. It does not.

What is actually in the repository is a complete, working marketing site for
**کانون ایران‌نوین** — an advertising and integrated-marketing agency. Evidence:

| Signal | Value |
|---|---|
| `package.json` name | `irannovin` |
| Root layout `<title>` | `کانون ایران‌نوین \| گروه تبلیغات و بازاریابی یکپارچه` |
| Meta description | «ایران‌نوین؛ شریک یکپارچه رشد برندها…» |
| Page set | about, services, work, industries, insights, careers, contact |
| Section components | Clients, Services, Industries, Careers, Repositioning |

This is an agency corporate site, unrelated to precious-metals trading.

**Action taken:** it has been preserved intact and moved with `git mv` (history
retained) to `apps/irannovin/`. Nothing in it was edited.

**Action needed from the operator:** confirm the relationship between the two
projects — see [Open question 1](#open-questions).

---

## 2. Stack as found

| Aspect | Finding |
|---|---|
| Framework | Next.js `16.2.6`, App Router, React `19.2.4` |
| Language | TypeScript, `strict: true` already enabled |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Animation | `framer-motion` `^12.40.0` |
| UI primitives | `@radix-ui/react-accordion`, `@radix-ui/react-dialog` |
| Icons | `lucide-react` |
| Package manager | npm (`package-lock.json`, lockfile v3) |
| Fonts | Vazirmatn + Inter, loaded from Google Fonts CDN in `layout.tsx` |
| Direction | `<html lang="fa" dir="rtl">` — RTL already correct |
| Node | v22.22.2 available in the environment |

### Not present
No backend, no database, no ORM, no API routes, no authentication, no tests, no
CI workflow, no Docker configuration, no environment handling, no i18n layer.
The repository is a static marketing front end and nothing else.

---

## 3. What is reusable

- **RTL and Persian typography setup.** `dir="rtl"`, `lang="fa"`, and the
  Vazirmatn stack are already correct and match what SPEC §5 asks for.
- **Tailwind v4 configuration** as a starting point for `packages/design-tokens`.
- **npm as package manager** — npm workspaces is therefore the lowest-friction
  monorepo choice and needs no new tooling.
- **TypeScript strict** is already on, so no migration is needed there.

## 4. Technical debt found

| Item | Impact | Recommendation |
|---|---|---|
| Fonts loaded from Google Fonts CDN | Will be slow or blocked for Iranian users; also a third-party request on every page load | Self-host Vazirmatn in `packages/design-tokens` |
| `README.md` is the unmodified `create-next-app` boilerplate | No onboarding information | Replaced at the root; the app keeps its own |
| Zero test coverage | No regression safety on the marketing site | Acceptable for a static site; not acceptable for anything financial |
| `next.config.ts` is empty | No security headers configured | Add headers when the site is next deployed |
| Tailwind config duplicated design values | Will drift from the platform's tokens | Extract to `packages/design-tokens` when the two need to share a look |

---

## 5. Target structure and what exists so far

```
apps/
  irannovin/     ← EXISTING agency site, moved intact, untouched
  api/           ← not yet created (Phase 1)
  client/        ← not yet created (blocked on OPEN-2)
  admin/         ← not yet created (Phase 1)

packages/
  financial/     ← CREATED — money, metal, pricing, treasury arithmetic
  providers/     ← CREATED — external-system interfaces + deterministic mocks
  design-tokens/ ← not yet created (blocked on OPEN-2)
  ui/            ← not yet created (blocked on OPEN-2)
  domain/        ← not yet created (Phase 1)
```

`packages/financial` and `packages/providers` were built first deliberately.
They have no dependency on the web/native decision that is still open, they are
pure TypeScript with no I/O, and they are the code where a silent defect is most
expensive — so they are the right thing to build and test while commercial and
architectural decisions are still being made.

---

## 6. Verification status

Everything claimed below was executed in this environment, not assumed.

```
packages/financial   70 tests passed    tsc --noEmit clean
packages/providers   13 tests passed    tsc --noEmit clean
```

The financial suite includes property-based tests (`fast-check`) over the
invariants that matter most:

- `fee + net === gross` for every rate and amount
- `distribute()` parts always sum to the total
- realised P&L components always sum to the realised total
- fine metal content never exceeds gross weight
- available-to-sell is never negative and never exceeds controlled metal
- converting rial → weight → rial never manufactures value

---

## 7. Two spec corrections found while building

Both were raised during review and are now enforced in code rather than only
described in prose.

**Spread is not a revenue line.** SPEC §54 lists "Spread Revenue" and "Realised
Inventory P&L" as separate items. In a principal model they are the same money:
spread is one of the two *components* of inventory profit. `realisedPnl()` in
`packages/financial/src/treasury.ts` therefore computes the total exactly and
derives the inventory component by subtraction, so
`spread + inventory === realised` holds under integer arithmetic. A
property-based test asserts it.

**Weight is meaningless without purity and basis.** A bare `weight_ug` cannot
say whether it means fine metal content or gross alloy weight, nor at what
assay — and Iranian melted gold (705) differs from retail 18 carat (750).
`AssetDefinition` now carries `purity`, `weightBasis`, and `referenceMarket`,
and every conversion in `metal.ts` is explicit about its rounding direction.

---

## 8. Open questions

1. **Relationship between ایران‌نوین and گرم.** Is GARM a client project of the
   agency, a separate venture sharing this repository, or should the two live in
   different repositories entirely? The agency site is preserved either way, but
   the answer determines whether a split is warranted before more is built.

2. **OPEN-1 (name) and OPEN-2 (web/native strategy)** in `DECISIONS.md` remain
   unresolved and block client scaffolding. `GARM` is in use as an internal
   codename only; it appears in package names (`@garm/*`) and nowhere
   user-visible, so renaming is a find-and-replace rather than a migration.
