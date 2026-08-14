# apps/web

Next.js customer web app, per decision D-006 (Next.js for web, Expo for native,
shared logic in `packages/core`).

## Status

Not yet scaffolded. What exists is `preview.html` — a self-contained,
interactive prototype of the buy screen, used as the visual and behavioural
reference for the real build.

It is **not** a mock-up in the usual sense. The money arithmetic in it mirrors
`@garm/financial` exactly: rial and micrograms as `BigInt`, a 50bps fee split so
that `fee + net === gross` by construction, a 30bps spread applied against the
customer, floored weight conversion, and no floating point anywhere near a
number that represents value. The ledger panel shows the same five journal lines
`postBuy` produces, with the per-asset drift displayed as zero.

The prices are simulated and the page says so. Nothing in it touches a real
balance.

## What it demonstrates

- **Quote locking.** Twenty seconds with a visible countdown. Let it run out and
  the quote expires rather than executing at a stale price — the behaviour the
  client cannot be trusted to enforce, shown as the customer experiences it.
- **No optimistic financial updates** (SPEC §9). The balance and the ledger move
  only when the timeline reaches `LEDGER_POSTED`, never before.
- **The commit point** (SPEC §30). The timeline continues to `CUSTODY_PENDING`
  after the balances have already moved, making it visible that ownership does
  not wait on the custodian.
- **Refusal paths.** The three guard toggles produce the real refusal codes —
  `FEED_UNAVAILABLE`, `TRADING_DISABLED`, `KYC_NOT_VERIFIED` — plus
  `BELOW_MINIMUM` and `INSUFFICIENT_BALANCE` from the inputs.

## Building the real thing

The prototype is the brief. The Next.js app should reproduce this screen using
`packages/ui` components and `packages/core` for the API client and i18n, with
every number coming from the server rather than being computed client-side —
the arithmetic is duplicated here only because the prototype has no backend to
call.
