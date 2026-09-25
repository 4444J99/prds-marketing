# PRDS Marketing

Public acquisition implementation for a bounded broker-intelligence evaluation. This repository contains no private engine imports, no customer exports, no secrets, and no product API or payment backend.

## What is implemented

- Twelve static routes: overview, browser-local list check, illustrative sample, pilot pricing, evaluation request, coverage, methods, Field Notes index and two notes, data handling, evaluation boundaries.
- A 2 MiB / 10,000-row CSV diagnostic with quoted-field parsing, exact trimmed-row duplicate detection, missingness, whitespace and optional strict-ISO date bins. No business-identity or contactability claims.
- Validated inquiry transport contract, idempotency/correlated-receipt semantics, no automatic retries or fabricated successful submissions. Default intake is not connected: the UI prepares an explicitly unsent local draft.
- Proposed $300 two-week pilot and $500/month capped continuation, not active checkout/entitlements.
- Review-candidate publication manifest; no live-state claims, no invented domain, and noindex in HTML, robots and hosting headers.

## Build and verify

The public app remains Astro static output. Server adapters, React and private `@prds` package dependencies are not required for these routes. Current source uses the repository's existing Astro 7.3.3, pinned rather than speculatively upgraded.

```
cd apps/site
npm install   # bootstrap only until the generated, verified lock is committed
npm test
npm run build
```

CI uses Node 24.19.0 per the inherited branch constitution, captures the exact dependency lock, builds Astro, checks emitted routes and runs Python Playwright against the output. No deployment, credentials, code-writing agent, or paid account operation is embedded in CI.

`npm run preview:offline` renders the exact shared page renderer without Astro dependencies for constrained local inspection. It is NOT an Astro build or a production-deployment receipt. Source-only unit/contract tests can run offline with Node >=22.12.

Local first-pass verification: 71 Node tests and 12 shared-renderer route/link checks passed on Node 22.16.0. Container network/package installation and browser navigation were unavailable; remote Astro/browser results must be obtained before release. Re-run against the final commit and record evidence rather than preserving this paragraph as a permanent claim.

## Activation boundaries

Read [activation contract](docs/ACTIVATION.md) and [commercial operating kit](docs/COMMERCIAL-OPERATING-KIT.md). The existing ops lane owns hosting/API integration; commerce owns offers, payments and entitlements. `public/launch-status.json` is a sanitized publication boundary, not a second billing catalogue.

The source is a review candidate. A working local draft is not a received lead. A successful test is not production acceptance. A source adapter is not purchasable coverage. No customer payment or renewal is claimed.

Coordination: issue #2; inherited audience #469/#470/#481; commercial #468; delivery #473. One isolated marketing branch/PR; preserve other agents' claims and all inherited acceptance obligations.
