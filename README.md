# PRDS Marketing

Public acquisition implementation for a bounded broker-intelligence evaluation. No private engine imports, customer exports, secrets, product API or payment backend live in this repository.

## Implemented

Twelve static routes cover the offer, illustrative review method, bounded pilot pricing, coverage, methods, request preparation, data handling, and two Field Notes. A browser-local CSV diagnostic checks repeated full rows, missingness, whitespace and optional strict-ISO date bins. It does not identify businesses, verify contactability, or upload the list.

The request contract supports bounded fields, reply-only consent, idempotency and correlated durable receipts. Default intake is **not connected**: the UI prepares an explicitly unsent local draft. Proposed $300/two-week and $500/month capped continuation prices are not active checkout or entitlements. Publication defaults remain noindex, no accepted live coverage, no intake, no checkout, and no invented canonical domain.

## Build and verify

Use Node 24.19.0 (`.nvmrc`) and npm 11.9.0, matching the inherited supported runtime. The app retains the existing Astro 7.3.3 version. Its real generated dependency lock is committed; installation must not silently resolve a different graph.

```sh
npm install --global npm@11.9.0
cd apps/site
npm ci --no-audit --no-fund
npm test
npm run build
```

CI uses immutable action revisions, read-only repository permissions, bash pipefail, the committed lock, actual Astro builds, emitted-route checks, and Chromium desktop/mobile behavior checks. It does not deploy, change branches, read customer data, or launch a coding agent.

`npm run preview:offline` renders the same shared page renderer without Astro dependencies. This is useful in a constrained environment but is **not** an Astro build or a production-deployment receipt.

## Verification evidence

Run **36086362472**, head **2d9fa1ac5628a393bde41f1aa6bfaf6cbc55fab4**, passed 71 Node tests, the actual 12-page Astro build/link verifier, and **159 Chromium assertions** across 390/768/1440 widths plus local-file privacy and unsent-request behavior. Its artifacts and history are recorded in [verification evidence](docs/VERIFICATION.md). Later lock/CI-hardening revisions must pass their own PR check; old evidence is not automatically inherited by a new head.

## Activation and ownership

Read [activation contract](docs/ACTIVATION.md) and [commercial operating kit](docs/COMMERCIAL-OPERATING-KIT.md). Existing ops owns hosting/API integration; commerce owns offers, payments and entitlements. The public publication manifest is not a second billing catalogue.

A local draft is not a received lead. A successful test is not deployment acceptance. A source adapter is not purchasable coverage. No customer payment or renewal is claimed.

Coordination: issue #2 and PR #3; inherited audience #469/#470/#481; commercial #468; delivery #473. Preserve other agents' claims and all inherited acceptance obligations.
