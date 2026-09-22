# PRDS Marketing

**Public acquisition system** — Approved public pages, pricing explanations, documentation, signup, proof of work.

## Boundary

- **Visibility**: Public
- **Consumes sanitized publication contracts only** — no private engine imports, customer exports, or private planning history
- Public build must succeed without private credentials
- Static-first (Astro 5 on Cloudflare Pages)
- Programmatic SEO from `@prds/types` metadata (not engine implementation)

## Architecture

```
prds-marketing/
├── apps/site/                # Astro 5 on Cloudflare Pages
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.astro           # Hero: "UCC Intelligence for MCA Brokers"
│   │   │   ├── features.astro        # Collector demo, scoring, compliance
│   │   │   ├── pricing.astro         # Tier comparison (reads @prds/entitlements)
│   │   │   ├── docs/                 # API docs, collector guides
│   │   │   ├── blog/                 # SEO content
│   │   │   └── signup.astro          # Stripe Checkout redirect
│   │   ├── components/
│   │   ├── content/                  # MDX collections
│   │   └── layouts/
│   ├── astro.config.mjs              # output: 'static', adapter: cloudflare
│   └── package.json
├── wrangler.toml
└── seed.yaml
```

## Content Strategy

| Page Type | Template | Data Source |
|-----------|----------|-------------|
| Home | `index.astro` | Static + `@prds/types` feature flags |
| Features | `features.astro` | `@prds/types` collector metadata |
| Pricing | `pricing.astro` | `@prds/entitlements` tier definitions |
| Docs | `docs/[...slug].astro` | Markdown + OpenAPI spec |
| Blog | `blog/[...slug].astro` | MDX content collections |
| Signup | `signup.astro` | Stripe Checkout redirect (no custom forms) |

## Public Build Audit

- No private engine logic in bundles
- No secrets in source maps
- No customer data in CI logs
- Clean build succeeds without private credentials

## Deployment

- **Staging**: Auto on push to `main` (Cloudflare Pages preview)
- **Production**: Auto on push to `main` (Cloudflare Pages production)

## Governance

- Lane: `evolve-platform` (audience system, public site)
- Owner: Marketing team
- Seed: `seed.yaml` registered with ORGANVM/Limen