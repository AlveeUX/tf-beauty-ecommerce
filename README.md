# Cosmia - Beauty eCommerce (ThemeForest edition, in preparation)

A Next.js eCommerce storefront built from a Figma design, being prepared for sale on ThemeForest as a
**front-end template with JSON mock data**. See `docs/themeforest-plan.md` for the plan.

There is no database, no server-side accounts and no admin. The catalog and blog are JSON files in
`src/data`; the cart, checkout, accounts and forms work in the browser (localStorage) in demo mode, and
one interface, `DataProvider`, is the place to plug in a real backend.

## Requirements

- Node.js >= 22 and npm

## Setup

```bash
npm install
npx playwright install chromium   # once, for E2E tests
npm run dev                       # http://localhost:3000
```

No `.env` file is needed. `.env.example` lists the optional settings.

To rebrand the template, edit `src/config/site.ts` (name, tagline, contact details, social links, currency,
shipping rules). A unit test fails if the brand name or demo contact details appear anywhere else in `src`.

## Scripts

| Command                                       | Purpose                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`             | Next.js                                                                                       |
| `npm run typecheck` / `lint` / `format:check` | Static checks                                                                                 |
| `npm test`                                    | Vitest unit + integration tests                                                               |
| `npm run e2e`                                 | Playwright: builds, serves on :3100, runs `tests/e2e` (`E2E_REUSE=1` reuses a running server) |

## What you can open locally (`npm run dev`, http://localhost:3000)

| Page                             | URL                                                               |
| -------------------------------- | ----------------------------------------------------------------- |
| **Demo hub (every layout, one click)** | `/demos`                                                  |
| Home                             | `/`                                                               |
| Shop (filters, sort, pagination) | `/shop` (layouts: `?layout=`)                                     |
| Product details                  | `/product/the-renewal-serum` (layouts: `?layout=`)                |
| Cart, checkout                   | `/cart`, `/checkout`                                              |
| Account (demo)                   | `/register`, `/login`, `/account`                                 |
| Track order (demo)               | `/track-order` - try order `CSM-DEMO2026` with `demo@example.com` |
| Blog, content pages              | `/blog`, `/about`, `/contact`, `/faqs`, `/store-locator`          |
| UI kit (components and tokens)   | `/ui-kit`                                                         |

## Demo mode

Everything a server would normally do is done in the browser and stored under the `cosmia.demo.` prefix in
localStorage: the cart (ids and quantities), orders, accounts (passwords as a salted digest, **not real
security**), saved addresses, reset links, and the newsletter, contact, comment and review entries.
Nothing is sent anywhere and nothing is charged. A dismissible note on the login, account and checkout
pages says so. To test the payment-failure message, set `localStorage["cosmia.demo.simulate"]` to
`"decline"` and pay with the test card (`NEXT_PUBLIC_PAYMENT_METHODS` must include `card_test`).

## Layout

```
src/app        routes and the few read-only API route handlers (catalog, search, variants, health)
src/data       JSON content, Zod schemas, the DataProvider interface and its JSON implementation
src/server     read services that delegate to the DataProvider
src/lib        shared logic: cart rules, order types, validation, demo-store (browser storage)
src/components UI components
src/styles     design tokens
tests          unit, integration, api, e2e, visual
```

## Project documents (in `docs/`)

`docs/themeforest-plan.md` (the plan: phases, task contracts, checklist) - `docs/PRD.md` (requirements and
Figma inventory; database/auth/admin parts apply to `main` only) - `docs/e2e-testing-strategy.md`
(verification) - `docs/context.md` (current state) - `docs/decision-log.md` (why).
