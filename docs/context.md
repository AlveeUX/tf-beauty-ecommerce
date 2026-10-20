# Persistent Project Context for Claude Code

> **Direction change (D-050, 2026-10-20):** this folder is the **ThemeForest copy** (branch `themeforest`). The goal is to sell the storefront as a Next.js eCommerce **front-end template with JSON mock data**: no database, no server auth, no admin. The plan in force is `themeforest-plan.md` (phases TF0-TF8). Sections below that describe the database, server auth, orders, payments and the admin dashboard describe the full-stack app on `main` and are **history on this branch** until TF1 removes them. `development-plan.md` was retired.

> **Maintenance rule:** update this file whenever a material architecture decision, requirement, scope item or project status changes. Detail lives in the other documents; keep this one short.

## 1. Project identity and objectives
Original goal (on `main`): a scalable e-commerce platform — customer storefront + administration dashboard — from an existing Figma design (brand shown in design: **COSMIA**, skincare & cosmetics; real brand unconfirmed, PRD OQ-01).
**Goal on this branch:** a ThemeForest-ready Cosmia storefront template: high *measured* Figma fidelity, every layout variant as a demo, responsive and accessible, JSON mock data with a clean `DataProvider` seam for the buyer's own backend, buyer documentation, licensed or placeholder images only, packaged zip and live preview.

## 2. Figma
- URL: https://www.figma.com/design/sXBQCd1Az2To21ejk56Yjc/Ecommerce--Copy-?node-id=0-1
- File key: `sXBQCd1Az2To21ejk56Yjc` · Page "Page 1" node `0:1` · **60 top-level frames** (58 × 1920 px; `3:42651` 1940 px; `3:42576` 4275 px).
- Full inventory with node IDs: `PRD.md` §6.1. Figma MCP tools work (`get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs`). Never fetch the whole page's metadata again (~3.2 MB); query by frame. Temporary asset URLs expire and must never be committed.

## 3. Local project root and repository status
- Root of this copy: `C:\Projects\themeforest-projects\tf-beauty-ecommerce` (branch `themeforest`). The original full-stack app stays untouched at `C:\Projects\beauty-ecommerce` (also `main` here).
- Git: local repo; `origin` = `https://github.com/AlveeUX/tf-beauty-ecommerce.git`, **public** by the user's choice (D-051). Ask before every push; never rewrite history.
- Toolchain verified: Node v24.18.0, npm 11.16.0, Python 3.14.5. `pnpm` and `jq` not installed.

## 4. Mandatory technologies
**HTML5, CSS3, JavaScript** are mandatory (user requirement). Honor by semantic HTML, handwritten CSS3 with custom-property tokens, and JS/TS behavior.

## 5. Technology decisions
| Decision | Status |
|---|---|
| HTML5 / CSS3 / JavaScript | **Approved (mandatory)** |
| Modular monolith, one repo, storefront + admin + API | Proposed |
| Next.js (App Router) + TypeScript | Proposed |
| Handwritten CSS3 + CSS custom-property tokens + CSS Modules | Proposed |
| ORM with SQLite locally (Postgres-compatible schema) | Proposed — OQ-03 |
| Server-side sessions, argon2id/bcrypt; Zod shared validation | Proposed |
| Mock payment gateway behind an interface; COD/bank-transfer offline methods; email outbox; local file storage | Proposed |
| Vitest + Playwright (+axe, screenshots) | Proposed |
| npm as package manager | Proposed (already installed) |

Rationale and alternatives: `PRD.md` §11.1. **Installed in P1** (see `decision-log.md` D-005/D-007): Next 16.4.2, React 19.3.0, TS 5.9.3, Drizzle + better-sqlite3, Zod, Vitest, Playwright, Prettier. Stack status is `ADOPTED-DEFAULT` (the user did not explicitly answer OQ-03).

## 6. Architecture overview (proposed)
Storefront and admin are two clients of one service layer and one database. Domain services own all business rules (pricing in integer cents, stock, order state machine, coupons). Admin writes → persisted → storefront reads published data only. See `PRD.md` §8.2, §9, §11.

## 7. Product scope
MVP and later releases: `PRD.md` §4. Do not treat a visible Figma screen as MVP automatically. Alternate layouts (10 listing, 11 PDP, 6 blog) are theme variants — ship **one** per route unless the client says otherwise (OQ-06).

## 8. Storefront ↔ dashboard relationship
Dashboard controls: products/variants, categories, media, inventory, orders, customers, coupons, banners/collections, blog/pages/FAQ/store locations, settings (shipping threshold, payment toggles), staff/roles. Changes must appear on the storefront without code changes. **No dashboard design exists in Figma** (PRD §8.1).

(Header menus: Shop mega menu + dropdowns, content in `src/config/navigation.ts`, decision-log D-034.)

## 9. Route and module overview (implemented: `/`, `/shop`, `/categories`, `/category/[slug]` (redirect), `/product/[slug]`, `/search`, 404, `/api/*` catalog/search/health; others proposed)
`/`, `/shop`, `/categories`, `/product/[slug]`, `/search`, `/cart`, `/checkout`, `/checkout/confirmation/[id]`, `/wishlist`, `/compare`, `/login`, `/register`, `/forgot-password`, `/account/**`, `/track-order`, `/blog`, `/blog/[slug]`, `/about`, `/contact`, `/faqs`, `/store-locator`, `/policy/[slug]`, `/admin/**`. Module map and Figma node IDs: `PRD.md` §6, §15.

## 10. Design-system conventions (tokens implemented in `src/styles/tokens.css`; see decision-log D-018, D-033)
- Fonts: **Instrument Sans** (UI, Regular/Medium/SemiBold) and **Prata** (display headings and the logo), both Google Fonts, installed from `@fontsource-variable/instrument-sans` and `@fontsource/prata` (D-033). Other fonts seen once (Mona Sans, Manrope) — verify.
- Colors: `#211a18` near-black, `#241c1b`, `#fdfbf8` / `#f8f5f0` / `#eee9e1` creams, `#8e2018` burgundy, `#431310` dark burgundy, `#c7332b` red (CTA/accent), grays `#736f6d` `#9e9c9a` `#ccc8c2`, `#514743` `#4a403d`.
- Text sizes observed: 12/14/15/16/17/20/24/56 px. Radii/shadows not yet extracted.
- No Figma variables found on frame `3:42576`; treat tokens as hand-extracted.
- Always use tokens; never hardcode a value that exists as a token. Figma style names are used as token names (Primary, Secondary, Accent 1/2, BG-Body, BG-Light-01, BG-Dark ...). Figma colors are used **exactly** (D-033); contrast below WCAG AA in a few pairs is accepted and tracked, not fixed.

## 11. Responsive-design policy
Figma defines **only 1920 px desktop**. Proposed breakpoints (unapproved): ≥1440, 1024–1439, 768–1023, 360–767. Test viewports: 1920×1080 (Figma), 1440×900, 1024×768, 768×1024, 390×844 (proposed). Responsive behavior is *proposed*, never presented as Figma-defined (PRD §12.2).

## 12. Coding conventions (proposed; finalize in P1)
Strict TypeScript; domain-based folders; shared validation schemas; money as integer cents; server-side authorization on every admin route; `data-testid` on key controls; semantic HTML and accessible components; no inline styles for tokenized values; match surrounding code style.

## 13. Security and data-handling rules
No secrets in repo/docs/logs (`.env` untracked, `.env.example` blank values). Hash passwords; validate all input; enforce permissions server-side; rate-limit auth/tracking; sanitize uploads; no real customer data or live payments in dev/tests. See `PRD.md` SEC-001…007.

## 14. Testing and visual-verification policy
Every module passes the 12-step E2E lifecycle before it is "done"; untested ≠ passed; reports per run; Figma-vs-app screenshot comparison without claiming pixel-perfect. See `e2e-testing-strategy.md`.

## 15. Local-only restrictions (binding)
Git is allowed locally; **ask before every push** (D-046, D-051). **No** Vercel/any deployment, production config, history rewrites or force-push, real payment/shipping/email providers, or remote DB. The live preview deploy (TF7-T04) needs explicit approval. P1 is approved; do not start P2+ without approval. (A session-start plugin hook suggested Vercel tooling — ignored, see `decision-log.md` D-015.)

## 16. Key decisions and their status
| Decision | Status |
|---|---|
| Documentation set (PRD, context, plan, E2E strategy) | **Approved 2026-10-19 by instruction to start P0/P1** (D-001) |
| Tech stack (§5) | Adopted as default 2026-10-19 (D-005); user may still override |
| One layout per route (OQ-06) | Pending |
| Shipping/free-shipping rule — design conflicts: $100 (announcement bar) vs $50 (benefit card) (OQ-04) | Open |
| Payment methods (design shows Direct bank transfer / COD / Check) (OQ-05) | Open |
| Admin UX direction (OQ-24) | Open |
| Breakpoints/mobile designs (OQ-07) | Open |
| Brand/asset ownership (OQ-01/02) | Open |

Provisional defaults for unanswered OQs: `decision-log.md` D-004. Full open-question list: `PRD.md` §14.3.

## 17. Known limitations and unresolved questions
- Only ~7 of 60 frames were visually reviewed; the rest were inventoried from metadata (names, sizes, text layers). Review each frame fully at the start of its phase.
- Not designed in Figma: admin dashboard, mobile/tablet, account/order history, order confirmation, tracking result, search results, 404/500, loading/error states.
- Unclear frames: `3:15517` (second "Wishlist page", 1000 px tall — likely a drawer), `3:28374` (second "FAQs"), `3:1749` (Menu dropdown, not reviewed).
- Design copy is template placeholder (conflicting thresholds/addresses/prices).

## 18. Project documents
- All documents are in `docs/`.
- `PRD.md` — what to build (requirements, Figma inventory, routes, data model)
- `themeforest-plan.md` — **the plan in force**: phases TF0–TF8, task-contract template, master checklist (`development-plan.md` retired, D-050)
- `decision-log.md` — why decisions were made; troubleshooting index (check this when something breaks)
- `CLAUDE.md` / `README.md` — agent rules and local setup
- `e2e-testing-strategy.md` — test architecture, journeys, visual verification, reporting, Definition of Done

If a decision changes: update this file plus the owning document(s) (stack → PRD §11 + plan P1; scope → PRD §4 + plan; verification → e2e strategy).

## 19. Current phase and completed work
- **P0 — Discovery & approval: PASSED (provisional)** — docs approved by instruction; unanswered OQs use defaults (D-004).
- **P2 (tokens, components, shell), P3 (data model + catalog backend), P4 (Home, Shop, Categories, Product, Search): PASSED 2026-10-19** with documented gaps (decision-log D-029). Gate evidence: decision-log section 5 (typecheck, lint, 55 Vitest, build, 42 Playwright, axe 0 critical/serious).
- **P1 — Foundation & local environment: PASSED (2026-10-19)** — Next.js app, strict TS, ESLint/Prettier, SQLite + Drizzle migrations, `/api/health`, Vitest, Playwright + axe, guarded test-reset, `.env.example`, README, CLAUDE.md. Evidence: `decision-log.md` §4 (typecheck, lint, format, 2/2 unit, build, 3/3 E2E-SMOKE-01).
- Cart (server, cookie token), wishlist and compare (localStorage) are built (P5). **P6 (accounts, checkout, orders, tracking) PASSED 2026-10-20 (D-037):** scrypt auth, server sessions, throttling, guest-to-account merge, checkout with idempotent order placement and stock reservation, local payment gateway, order state machine, email outbox, tracking, account area. **Product page layouts (all 10 Figma layouts, zoom, countdown, subscribe, colour chips) built 2026-10-20 (D-038)** and chosen by `?layout=<id>` or `products.pdp_layout`. **Policy pages (`/policy/privacy|shipping|returns|terms`) built 2026-10-20 (D-040), first part of P10.** All ten Shop listing layouts are built (D-045, `?layout=`) and the last four Figma frames (quick view, size guide, share, wishlist popup; D-047), so every Figma frame is built (docs/figma-page-checklist.md: 57 of 57). Content pages, blog and newsletter (P10) are built (D-041..D-043; Vitest 126; Playwright 149/149 in the last full run, 2026-10-20, 6.9 min). Not done: admin dashboard (P7-P9, including managing posts, comments, contact messages, subscribers), responsive/mobile polish (P11), no Git, no deployment.
- Not verified: clean-clone install on another machine; Firefox/WebKit; viewports below 1920.

## 20. Immediate next actions
**ThemeForest track (D-050):**
1. Status: **TF1 PASSED (D-053) and TF2 PASSED (D-054), 2026-10-20.** The app has no database, no native module and no server state; `npm ci` works on Node 24 with no compiler. Branches `main` and `themeforest` are on the public `tf-beauty-ecommerce` repo (D-051, D-055). TF-D1..D7 are logged (D-050).
2. **TF0 gates** (in parallel with TF1): Envato upload-rights reply (ticket open), Figma ownership, author profile, product name.
3. **TF3 (responsive and accessibility) in progress:** spec approved (gate G1), T02 test harness and T03 breakpoints done (breakpoints are 1439, 1100 and 767; amendment A1). T04 (header, announcement bar, mobile menu drawer) T05 (both footers: fluid at laptop widths, accordions on phones) and T06 (Home sections: fits at 1440, 1280, 1180, 1024, 768, 390 and 320) are done. The sideways scroll every page has between 1101 and 1340 px is NOT the header: it is the footers and fixed-width page sections, fixed in T05, T06 and T10. T07 (shop: filter sheet for every layout up to 1100 px, two columns and list cards on phones) is done. Next: gate G2 (you review phone and tablet screenshots of Header, Home and Shop), then T08 product page. Gates still open in parallel: Envato upload-rights reply, Figma ownership, author profile, product name, and the public-repo risk (D-051). Brand, contact and shop rules are edited in `src/config/site.ts`; the demo hub is `/demos`, the UI kit `/ui-kit`.
4. Do not start P7 (admin).

**Older list (full-stack, kept for history):**
1. **See the storefront locally:** `npm run dev` then open http://localhost:3000 (Home), `/shop`, `/categories`, `/product/the-renewal-serum`, `/search?q=serum`. Run `npm run db:migrate && npm run db:seed` first if the database is empty.
2. **P5 (cart, wishlist, compare) PASSED 2026-10-19 (D-036).** P6 PASSED (D-037). P7 (admin foundation) needs the user's approval before starting. Admin UX wireframes (P7-T01) can be drafted in parallel.
3. User still to confirm provisional defaults (D-004, D-005, D-007, D-008) and the deviations in D-029.
4. Before coding any task: write its task contract (plan section 3) and re-fetch the frame from Figma.
