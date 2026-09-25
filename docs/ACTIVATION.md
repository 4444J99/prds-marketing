# Activation contract — acquisition without a second backend

Owner-authorized marketing tranche, September 24, 2026. Coordination: marketing #2; inherited audience #469/#470/#481, commerce #468, delivery #473. This document is not a production receipt.

## Current boundary

Twelve static pages, a no-upload CSV diagnostic, illustrative review cases, bounded offer explanation, and a local request draft. `public/launch-status.json` says no accepted live coverage, no intake, no checkout, no canonical origin, no indexable public release. This is deliberate and tested. Do not turn a 200 response, an unreviewed fixture, or a successful local test into a customer receipt.

Public price copy is a proposed experiment ($300 / 14 days; $500 / month subject to written caps), not a second entitlement catalogue. `prds-commerce` remains the canonical offer/payment/access owner. Reconcile accepted offer identifiers and versions before any checkout link or purchasable structured data is introduced.

## Integration owner: existing OpenCode ops lane

Do not edit the active ops PR's files concurrently. Supply the accepted receiving URL and a sanitized evidence reference from the existing product API; no second server in this repository.

The existing API must validate the `prds.broker-fit-request.v1` contract implemented in `public/inquiry.mjs`: bounded broker identity/contact, choice of evaluation, target market, goal, explicit reply-only purpose, and optional coarse self-reported acquisition source. Reject extra fields, prospect lists, oversized bodies and unknown content types. Bound body bytes before JSON parsing. Never assume frontend validation enforces server invariants.

- POST with `Content-Type: application/json` and `Idempotency-Key`.
- Exact allowed Origin, preflight allowlist, rate limits/abuse controls, no wildcard credential CORS.
- Durable atomic persist before success; same key + same payload returns same receipt; different payload under same key conflicts. Do not swallow storage failures.
- Response: `{ "schema": "prds.intake-receipt.v1", "state": "received", "requestId": "<same id>", "receiptId": "<opaque durable id>" }`.
- A receipt is an inquiry only, never a purchase, entitlement, scheduled delivery, or marketing subscription.
- Reconcile ambiguous 5xx/timeouts without resubmitting under a fresh key. The frontend blocks further sends after an uncertain result; no auto-retry.
- Show an actual privacy/controller/correction contact and retention notice. Test private record access, correction/deletion, operator notification, suppression, and authorization. Redact inquiry PII in public logs/artifacts.
- Verify a synthetic exact-head end-to-end request in the intended environment, then separately verify an explicitly authorized real inquiry. Test evidence is never a prospect.

To activate, replace `intake` with accepted `url`, sanitized `receipt`, `privacyURL`, `acceptedUntil`; all URLs are HTTPS without query credentials. Update the request-page privacy link/text to display the actual receiving notice. Update only `/request/*` CSP `connect-src` to the exact receiving origin after review; the list checker must retain `connect-src 'none'`. Keep form-action denied because transport is explicit JS, not browser fallback. Current global CSP intentionally blocks all sends until this is completed.

## Deployment owner: existing ops / Cloudflare authority

The source declares Cloudflare Pages, but a repository configuration alone does not prove that project exists or is connected. Verified container network did not permit npm/GitHub access; local browser navigation was administratively blocked. Connected Vercel inventory had no PRDS project. No Cloudflare management connector was returned by plugin discovery. Do not interpret these facts as a missing token or invent a `pages.dev` URL.

Expected build settings with repository root as build root:

```
cd apps/site && npm ci && npm run build
output: apps/site/dist
```

The initial CI bootstraps a real package lock when absent and retains it in an artifact. Before release, commit the generated lock from a successful exact-head install and require `npm ci` only. No hand-invented lock/integrity values. The framework version is retained from the accepted repository, not upgraded speculatively.

Use the existing permitted Pages account/project and record project identity, deployment ID, exact commit, canonical HTTPS origin, response headers, preview protection/indexing behavior, route results, and applicable included-resource allowance. Do not enroll or upgrade an account, provision paid resources, or reuse unrelated credentials. Do not promote runtime ingestion as part of static-site deployment.

## Release acceptance

1. Independent review and successful exact-head unit/contract/build/browser jobs.
2. Actual domain/project confirmed; copy approved by owner. Keep source development distinct from accepted coverage.
3. Intake receipt, privacy notice, error behavior and receiving operator verified.
4. Scope/offer/payment/cancellation/entitlement parity and real seven-run delivery gate remain owned by commerce/ops.
5. Only after a publication receipt: generate canonicals and sitemap using the actual origin; remove noindex consistently from meta, robots and HTTP headers. Preserve noindex on previews.
6. Real inquiries, samples reviewed, pilots paid and renewals are measured independently. No fictional metrics.

No override flag is an acceptance receipt. An unconnected form is a local draft, not a functioning acquisition endpoint. Public launch remains incomplete until these gates pass.
