# End-to-End Testing and Visual Verification Strategy

> **ThemeForest branch note (D-050):** on branch `themeforest` the plan in force is `themeforest-plan.md`. Requirements about the database, server auth, orders, payments and the admin dashboard describe the full-stack app on `main` and do not apply to the template.

| Item | Value |
|---|---|
| Version | 0.1 (draft, awaiting approval) |
| Last updated | 2026-10-19 |
| Related | `PRD.md` (requirements/IDs), `themeforest-plan.md` (phases/tasks), `context.md` |
| State | **Nothing is implemented or tested yet.** No test tools are installed. Tools named here are proposals. |

---

## 1. Testing principles

1. **Testability is an architectural requirement.** Stable `data-testid` hooks on key controls, seedable/resettable data, deterministic time and payments, and a health endpoint are part of the definition of each module (PRD NFR).
2. **Critical journeys are automated.** Browse → cart → checkout → order, and admin → storefront propagation are tested in a real browser against the real local app.
3. **Independent verification of AI-generated code.** Tests derive from PRD acceptance criteria *before* implementation; the agent that writes a feature must not be the only evidence it works. Failures are investigated at root cause; tests are not loosened to pass.
4. **Reproducible locally.** One command to reset DB, seed, start app, run tests. Fixed seed data, fixed clock where needed, no network dependence.
5. **Stable test data, isolated from real data.** A dedicated test database/file; never real customers, secrets, or live payments.
6. **Regression prevention.** Every fixed defect gets a test that fails without the fix.
7. **Visual comparison against Figma.** Screenshots of the running app are compared with Figma reference renders (§7), with known limits documented.
8. **Honest handling of unavailable services.** If a service is unavailable (real payment, email, carrier), use a **clearly labeled test double** and report the integration as *not verified*.

---

## 2. Test architecture (proposed — pending stack approval)

| Layer | Tool (proposed) | Purpose | Limits |
|---|---|---|---|
| Unit | Vitest | Pure logic: money math, coupon rules, order state machine, validators | No browser/DB behavior |
| Component / integration | Vitest + Testing Library | Components with props/states; services against a test DB | Not full-page layout |
| API / backend | Vitest or Playwright `request` | Endpoint contracts, validation, permissions, transactions | Doesn't prove UI wiring |
| E2E browser | Playwright (Chromium; Firefox/WebKit for smoke) | User journeys on the actual local app | Slower; flake risk — keep deterministic |
| Accessibility | `@axe-core/playwright` + keyboard tests | Automated WCAG checks, focus/keyboard flows | Catches only a subset of issues |
| Responsive layout | Playwright viewports | Overflow, navigation changes, key actions at each viewport | Layout rules for non-desktop are proposed, not from Figma |
| Visual regression | Playwright screenshots (+ Figma reference images via MCP) | Detect visual drift | Cross-browser/OS font rendering differs; no pixel-perfect guarantee |
| Manual exploratory | Human | Usability, design judgment, unexpected states | Not repeatable |

**Tooling notes.** Playwright is **not** currently installed (repository empty, V). The Claude-in-Chrome MCP can assist exploratory inspection but is not a substitute for the scripted suite. Figma MCP (`get_screenshot`) provides reference renders; they are read-only inputs.

**Suggested layout (P):**
```
tests/
  unit/            # Vitest
  integration/     # services + DB
  api/
  e2e/
    storefront/  admin/  cross-app/
    fixtures/      # seed, auth states, test doubles
  visual/
    references/    # Figma reference PNGs (+ node ID + date in filename)
    baselines/     # approved app screenshots
  reports/         # module reports (see §8)
```

---

## 3. E2E lifecycle required for every module

**No module or meaningful workflow is complete until it passes this lifecycle.**

1. **Review** the module's PRD requirements and acceptance criteria.
2. **Identify** its Figma frames (node IDs) and the states to verify.
3. **Define scenarios:** positive, negative, boundary, permission (where applicable).
4. **Implement** the module.
5. **Run** relevant unit/integration/API tests.
6. **Run browser E2E** against the real local app (not mocks of the UI).
7. **Verify** frontend ↔ backend ↔ database behavior where implemented (assert DB state, not just UI text).
8. **Capture screenshots** at the agreed viewports/states.
9. **Compare** with the Figma reference (or approved wireframe where no Figma exists).
10. **Investigate and fix** failures at root cause.
11. **Run targeted regression** for dependent modules.
12. **Record** results, evidence, unresolved defects, and status (§8).

If a required service is unavailable: report the limitation; use a labeled test double; mark that integration as **not verified**.

---

## 4. Scenario design (use what is relevant; do not force all)

| Category | Typical checks |
|---|---|
| Happy path | Core flow completes; totals and data correct |
| Invalid input | Field-level messages; no server error; no partial save |
| Empty data | Empty cart/wishlist/compare/search/list states (frames `3:29452`, `3:21193`, `3:21946`, `3:14744`) |
| Loading / delayed | Skeleton/spinner; double-submit guarded |
| API/server failure | Error state with retry; no corrupted state |
| Permission denial | 401/403 and hidden UI for forbidden admin actions |
| Boundary values | qty min/max=stock, price 0, long names, max coupon use, empty search |
| Duplicate submissions | Double-click place order creates one order |
| State persistence | Cart/wishlist after reload, login, logout |
| Data consistency | Admin edit visible on storefront; stock matches after orders |
| Navigation / refresh | Back/forward preserves filters; deep links work |
| Responsive | Key actions reachable and no horizontal scroll at each viewport |
| Keyboard accessibility | Tab order, focus trap in drawers/modals, Esc to close, visible focus |

---

## 5. Critical journeys and test IDs

Test IDs are planned names linked to PRD requirement IDs (PRD §15). Status of every ID is `NOT_STARTED`.

### 5.1 Storefront

| Test ID | Journey | Requirements | Figma |
|---|---|---|---|
| E2E-SMOKE-01 | App starts, placeholder/home loads | P1 | — |
| E2E-STO-01…03 | Header counts, mega menu keyboard/mouse, footer links and newsletter validation | STO-001…005 | `3:1452`, `3:22268` |
| E2E-HOM-01…06 | Home sections render from data; hero CTA; carousel controls; hero index and arrows (HOM-05); key boxes on the Figma coordinates at 1920 wide (HOM-06) | HOM-001…007 | `3:2290` |
| E2E-CAT-01 | Browse category → products listed, count text correct | CAT-001, CAT-008 | `3:4833`, `3:28043` |
| E2E-CAT-02 | Apply category + price + availability filters; chips; clear all | CAT-002/003 | `3:4833` |
| E2E-CAT-03 | Sort and paginate; URL state restored on reload/back | CAT-004/005 | `3:4833`, `3:5980` |
| E2E-CAT-04 | No results empty state | CAT-001 | — |
| E2E-CAT-05/06 | Grid/list toggle; filter drawer (if approved) | CAT-006/007 | `3:38190`, `3:11424` |
| E2E-SRC-01…03 | Search overlay suggestions; results; no results | SRC-001/002 | `3:16254` |
| E2E-PRD-01 | View product; select variant updates price/SKU/stock | PRD-001/002 | `3:12708` |
| E2E-PRD-02 | Out-of-stock variant disabled | PRD-008 | `3:16432` |
| E2E-PRD-03 | Add to cart / Buy now | PRD-003 | `3:12708` |
| E2E-PRD-04 | Unpublished product → 404 | BR-10 | — |
| E2E-LAY-01..12 | The ten product layouts: geometry, selection by URL/product, thumbnails, grids, both zooms, colour chips, subscribe rules, live countdown, out of stock, axe | PRD-010/011/012 | `3:34650`, `3:35806`, `3:36996`, `3:29779`, `3:30941`, `3:33384`, `3:32103`, `3:17692`, `3:18997` |
| E2E-CNT-01..04 | Policy pages: structure, contents list behaviour, content from store settings, 404 and footer links | CNT-006 | `3:24059` |
| E2E-MEG-01..05 | Shop mega menu: labels/badges/order, every entry's destination and layout, essentials and promos, current-page highlight, sticky add-to-cart bar | OQ-06, NAV | `3:1452` |
| E2E-OVL-01..06 | Quick view (geometry, arrows, cart, buy now, details link), size guide table, share popup (links, copy), wishlist popup, axe on the four popups | PRD-009, PRD-013..015, WSH-001 | `3:1144`, `3:14003`, `3:14370`, `3:15517` |
| E2E-SHP-01..07 | The ten Shop layouts: structure per layout, geometry, grid/list switch keeping filters, Load more, top panel, horizontal dropdowns, filter drawer | CAT-001..005, OQ-06 | `3:4833`, `3:40462`, `3:38190`, `3:39326`, `3:5980`, `3:7112`, `3:8330`, `3:10357`, `3:9418`, `3:11424` |
| E2E-CNT-05..11 | Store list and open/closed status; About; Contact cards, form validation, storage and rate limit; FAQs accordion and search; designed 404 | CNT-002..005 | `3:24455`, `3:28603`, `3:27227`, `3:27601`, `3:28374` |
| E2E-BLG-01..05 | Blog grid/list/standard/sidebar geometry and pagination; category, tag, search filters; post page and neighbours; comment validation, pending storage, reply, rate limit | CNT-001 | `3:25805`, `3:25320`, `3:28943`, `3:24811`, `3:26239`, `3:26684` |
| E2E-NWS-01..03 | Welcome popup (timing, geometry, validation, storage, Escape/focus, quiet pages); footer form consent, duplicate handling, rate limit | NWS-001 | `3:2009`, `3:22268` |
| E2E-PRD-05/06/07 | Reviews display, review form validation/duplicate submit, related products | PRD-006/007 | `3:12708` |
| E2E-CRT-01..07 | Drawer on add + count; free-shipping bar; cart page totals/undo/remove all; reload persistence; server stock rules; quick add + Home add; empty drawer | CRT-001..005 | `3:20299`, `3:15101`, `3:29452`, `3:14744` |
| E2E-CRT-02 | Qty above stock rejected | CRT-005 | — |
| E2E-CRT-03 | Cart persists across reload; merges on login | CRT-004 | — |
| E2E-CRT-04/05 | Empty cart/drawer states; free-shipping bar threshold | CRT-001/003 | `3:29452`, `3:14744` |
| E2E-WSH-01/02, E2E-CMP-01..03 | Wishlist popup/page/persistence/add to cart/empty; compare table, remove, repeat popup, limit 4, empty | WSH, CMP | `3:20784`, `3:21520`, `3:15517`, `3:15903` |
| E2E-USR-01…05 | Register, login, wrong password/throttle, forgot password (outbox), logout | USR-001…005 | `3:22750`, `3:23089`, `3:23424` |
| E2E-CHK-01 | Guest checkout with mock payment success | CHK-001…006 | `3:22268` |
| E2E-CHK-02 | Registered checkout; address validation errors | CHK-001 | `3:22268` |
| E2E-CHK-03 | Coupon valid/invalid/expired | CHK-002 | `3:22268` |
| E2E-CHK-04 | Mock payment **failure** and **pending** leave consistent order/stock | CHK-004/006 | — |
| E2E-CHK-05 | COD and bank-transfer orders created `pending` payment | CHK-004 | `3:22268` |
| E2E-CHK-06 | Double-click Place Order → one order | CHK-006 | — |
| E2E-CHK-07 | Terms unchecked blocks submit; confirmation page content | CHK-005/007 | `3:22268` |
| E2E-TRK-01…03 | Track with valid id+email; mismatch generic error; rate limiting | TRK-001/002 | `3:23740` |
| E2E-CNT-01…11, E2E-BLG-01…05, E2E-NWS-01…03 | Policy, Store locator, About, Contact, FAQs, 404, Blog, Newsletter (see the rows above) | CNT-001…006, NWS-001 | `3:25805`, `3:28603`, `3:27227`, `3:27601`, `3:24455`, `3:24059`, `3:2009` |

### 5.2 Administration and cross-app

| Test ID | Journey | Requirements |
|---|---|---|
| E2E-ADM-01 | Admin login; customer credentials denied | ADM-001 |
| E2E-ADM-02 | **Permission matrix:** each role × each module action (allowed/denied); direct URL/API access denied | ADM-004, SEC-002 |
| E2E-ADM-03 | Audit entries created for sensitive actions | ADM-005 |
| E2E-ACT-01 | Create product + variants + images; validation errors (duplicate SKU, empty name) | ACT-001/002/004 |
| E2E-ACT-02 | Edit price; archive instead of delete when ordered | ACT-001, BR-09 |
| E2E-ACT-03 | Categories CRUD with delete guard | ACT-003 |
| E2E-AIN-01/02 | Adjust stock; history entry; no negative stock | AIN-001/002 |
| E2E-AOR-01…04 | Orders list filter/search; detail; legal/illegal status transitions; cancel restores stock; add tracking number | AOR-001…004 |
| E2E-ACN-01…03 | Banner/blog/page publish, draft hidden, scheduled | ACN-001…003 |
| E2E-APM-01 | Coupon rules created in admin enforced at checkout | APM-001 |
| E2E-AST-01/02 | Free-shipping threshold and payment method toggles change checkout | AST-001/002 |
| E2E-ACS-01 | Customers list/detail; contact messages; subscribers | ACS-001/002 |
| **E2E-X-01** | Admin creates product → visible on storefront listing, PDP, search | cross-app |
| **E2E-X-02** | Admin changes price/stock → storefront updates; sold-out disables add to cart | cross-app |
| **E2E-X-03** | Storefront order appears in admin; admin changes status → customer tracking reflects | cross-app |
| **E2E-X-04** | Admin unpublishes product → storefront 404 and removed from cart/wishlist flows | cross-app |
| **E2E-X-05** | Admin publishes banner/post → Home/Journal show it | cross-app |
| **E2E-X-06** | Unauthorized user cannot call protected admin APIs | SEC-002 |

Journeys are adapted to the final scope. Payment scenarios use only the local mock/offline methods unless a sandbox is explicitly configured and approved.

---

## 6. Test data and local environment

| Topic | Rule |
|---|---|
| Database | Dedicated test DB (separate file/schema from dev). Never reuse a real/production DB. |
| Seed | Deterministic script producing known products/categories/users/orders (taxonomy from `3:42651`, products from `3:41609` once approved). Tests refer to seed IDs/slugs, not random data. |
| Reset | `npm run test:reset` (planned) drops and reseeds the test DB. Destructive reset is allowed **only** against the test DB path/name; scripts must refuse other targets. |
| Isolation | Each spec starts from a known state (fixture reset or transaction/rollback or unique data per test). Parallel workers use separate data or DB files. |
| Auth fixtures | Pre-created test users (customer, each admin role) with test-only credentials stored in untracked env/fixtures; never real credentials. |
| Payments | Mock gateway with deterministic triggers (e.g., test card numbers/amounts for success/failure/pending). No live processing. |
| Email | Outbox table/file read by tests. |
| Time | Controllable clock for countdowns, coupon dates, scheduling. |
| Secrets | Never in tests, logs, screenshots or docs. |

---

## 7. Visual verification (Figma ↔ local app)

### 7.1 Reference capture
- Use Figma MCP `get_screenshot` on the frame node ID at a documented `maxDimension` (the 1920-wide frames render at native width when `maxDimension` ≥ 1920). Save reference as `tests/visual/references/<nodeId>_<name>_<date>.png`. Reference images are **read from** Figma only; the Figma file is never modified.
- Long frames (Home `3:2290` = 10025 px) are compared in **section slices** (full-page + per-section) to keep diffs interpretable.

### 7.2 Viewports
| Viewport | Source |
|---|---|
| **1920×1080** | **Figma-defined** (all 60 frames are 1920 wide) — primary fidelity target |
| 1440×900, 1024×768, 768×1024, 390×844 | **Proposed** (no Figma); judged against approved responsive rules, not pixel diff |

### 7.3 Comparison method
1. Render the route at the target viewport and state with fonts loaded, animations disabled, fixed seed data and fixed clock.
2. Capture full-page and section screenshots.
3. Compare with reference using (a) automated image diff for *layout/regression signal* and (b) side-by-side human review.
4. Because the design uses placeholder copy/images, **seed content should match the design content for the compared frames**, otherwise differences are content, not defects.

### 7.4 Thresholds
Numerical diff thresholds are **not fixed in advance**. Procedure: after P2, run the shell comparison, inspect diffs, and propose a per-component tolerance with the reasoning (anti-aliasing, subpixel text, image scaling). The threshold's purpose is to catch regressions and obvious drift, not to certify perfection. Limits: font rasterization differs across OS/browsers; Figma renders vs browser layout differ slightly; dynamic content changes pixels. **100% pixel-perfect across browsers/devices is not guaranteed.**

### 7.5 Visual record (one row per comparison)
| Field | Example |
|---|---|
| Reference Figma node | `3:22268` |
| Viewport | 1920×1080 (full page) |
| App route | `/checkout` |
| State | guest, cart with 2 items, no coupon |
| Screenshot path | `tests/visual/baselines/…` |
| Method | image diff + manual review |
| Known rendering differences | e.g., font antialiasing |
| Defects found | listed with IDs |
| Fixes / retest status | `FAILED` → `PASSED` |

---

## 8. Test result reporting

One report per module run, stored in `tests/reports/<module>/<run-id>.md`:

| Field | Content |
|---|---|
| Test run ID | `RUN-<YYYYMMDD>-<module>-<nn>` |
| Module and task ID | e.g., `storefront/checkout`, `P6-T05` |
| Source revision | commit hash if a repo exists; otherwise a timestamp + file hash note (**no Git history may be altered**) |
| Environment | OS, Node version, DB path, app mode (dev/prod build) |
| Browser & viewport | e.g., Chromium 1xx, 1920×1080 |
| Scenarios executed | list of test IDs |
| Counts | passed / failed / blocked / not run |
| Failure details | message, trace, screenshot, root cause |
| Evidence | trace/video/screenshot paths |
| Known limitations | e.g., payment is a mock; mobile references proposed |
| Regression tests executed | IDs |
| Final status | `NOT_STARTED` / `IN_PROGRESS` / `BLOCKED` / `FAILED` / `PASSED` |

**A test that was not executed is never `PASSED`.** `BLOCKED` requires a stated blocker.

---

## 9. Definition of Done (module gate)

A module is done only when **all** are true:

- [ ] PRD requirements and acceptance criteria satisfied.
- [ ] Relevant unit/integration/API tests pass.
- [ ] Relevant E2E tests pass on the real local app.
- [ ] Visual verification completed where a Figma reference (or approved wireframe) exists.
- [ ] Responsive behavior checked at the phase's viewports.
- [ ] No unresolved critical/high defects without explicit user approval.
- [ ] Regression checks for affected modules completed.
- [ ] Evidence and status recorded (§8).
- [ ] `context.md` and `themeforest-plan.md` updated.

---

## 10. Severity and triage

| Severity | Definition | Gate impact |
|---|---|---|
| Critical | Data loss/corruption, security bypass, cannot place order, admin permission bypass | Blocks phase |
| High | Core journey broken or wrong totals/stock; major a11y blocker | Blocks phase unless approved |
| Medium | Feature works with notable defect/visual deviation | Fix or approve deferral |
| Low | Cosmetic, minor | Track |

---

## 11. Known gaps that affect testing

- No admin or mobile/tablet Figma references → admin and responsive checks use approved wireframes/rules, not Figma diffs.
- Missing states in Figma (loading, error, 404, confirmation, tracking result, account) → expected behavior defined by PRD proposals, to be approved.
- Real payment/email/shipping integrations are out of scope → verified only against test doubles and reported as such.
- Visual fidelity thresholds undefined until P2 calibration.


---

## 12. Implemented test inventory and verification record (updated 2026-10-19)

Source of truth for what actually exists. Status here means the tests were **run and passed** on 2026-10-19 against a production build and a freshly reset, seeded test database.

### 12.1 Automated tests

| Layer | Files | Tests | Result |
|---|---|---|---|
| Unit/integration (Vitest) | `tests/integration/db.test.ts`, `catalog.test.ts`, `content.test.ts` | catalog query/facets/search/detail/related, money, banners, bundles, category cards, reviews, seed idempotence | 51 pass |
| API (Vitest, route handlers) | `tests/api/catalog.test.ts` | products, product detail, categories, search, reviews POST (201/400/404/409) | included in 55 total |
| E2E (Playwright) | `tests/e2e/smoke.spec.ts`, `storefront/home|catalog|search|product|product-layouts|cart|lists|auth|checkout|tracking|a11y.spec.ts` | 106 | 106 pass (about 4 min) |

Implemented E2E IDs (the planned IDs in section 5 were refined; this list is authoritative): `E2E-SMOKE-01` (3), `E2E-HOM-01..04`, `E2E-STO-01..06` (STO-04..06 cover the mega menu), `E2E-CAT-01..08`, `E2E-SRC-01..05`, `E2E-PRD-01..11`, `E2E-A11Y-01` (7 routes), `E2E-A11Y-02`.

Not implemented yet: everything for auth, checkout, orders, tracking, content pages and the whole admin dashboard (`E2E-CRT-*`, `E2E-USR-*`, `E2E-CHK-*`, `E2E-ADM-*`, `E2E-X-*` ...). Their status is `NOT_STARTED`.

### 12.2 How to run

```
npm test                 # Vitest
npm run e2e              # builds, resets+seeds data/test.db, serves on :3100, runs Playwright
E2E_REUSE=1 npx playwright test   # against a server you already started (faster iteration)
node tests/visual/capture.mjs <url> <out.png> [width] [height] [full|viewport]
```

### 12.3 Visual verification record (Figma vs local app, 1920 px)

Method: reference render from Figma MCP `get_screenshot`, app render from `tests/visual/capture.mjs`, reviewed side by side (cropped sections at the same scale). **No automated diff or thresholds yet** (section 7.4 calibration is still open).

| Figma node | Route | Result | Known differences |
|---|---|---|---|
| `3:4833` Shop left sidebar | `/shop` | Layout, spacing, cards, filters, pagination match | page 4186 px vs 4263 px; photos are 1x exports; no footer leaf imagery |
| `3:12708` Details default | `/product/the-renewal-serum` | Top block, accordions, cards, reviews, carousels match | 8394 px vs 8340 px; no Size guide link; reviewer initials instead of photos; different serum data (price/SKU/counts) |
| `3:16254` Search overlay | search icon | Matches | popular chips slightly tighter |
| `3:2290` Home | `/` | Full-page and per-section pixel comparison at 1920 wide (`tests/visual/*.mjs`, decision-log D-035) | Height 10025 = 10025 px; mean absolute difference 1.72/255. Remaining: text anti-aliasing, 3 hover states drawn statically in the design, header count badges (P5), 1x Figma exports |
| `3:28043` Categories | `/categories` | Matches | card numbering follows tree order |
| `3:22268` Checkout, `3:22750` Login and ~45 other frames | not built | not compared | built in later phases |

### 12.4 Accessibility record

axe (critical + serious, **color-contrast excluded by decision D-033**): **0 violations** on `/`, `/shop`, `/shop?category=skincare&price=0-50`, `/categories`, `/product/the-renewal-serum`, `/product/glass-glow-primer`, `/search?q=serum` and inside the search dialog. The project keeps the Figma colors exactly, so known contrast findings remain and are recorded per test as the `known-contrast-findings` annotation (2026-10-19: Home 19, Shop 21, Categories 6, Product 28, Product out of stock 26, Search 7, search overlay 6). Other defect classes found and fixed on the way: decision-log D-022 (ARIA/accessible names) and D-031. Automated checks cover a subset of WCAG; keyboard-only and screen-reader review is **not** done beyond the search overlay (`E2E-A11Y-02`).
