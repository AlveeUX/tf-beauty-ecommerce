# ThemeForest Release Plan — Cosmia storefront

> **This is the plan we execute** (D-050). It replaces `development-plan.md` (P0–P12), which was retired; its task-contract template now lives in §3 below.
> Phase IDs use the prefix **TF** so they don't collide with the old P0–P12 IDs used in the decision log.
> Written 2026-10-20 against commit `ea92b0d` (57/57 Figma frames built, 149/149 Playwright tests passing). Work happens on branch `themeforest`.

---

## Current state (verified 2026-10-20)

| Item | State |
|---|---|
| Original project | `C:\Projects\beauty-ecommerce` — untouched, stays the full-stack app |
| ThemeForest copy | `C:\Projects\themeforest-projects\tf-beauty-ecommerce` (629 files, same history as original at `ea92b0d`) |
| GitHub repo | `https://github.com/AlveeUX/tf-beauty-ecommerce.git` — full history pushed. **Repo is PUBLIC by the user's choice** (D-051); the history contains the Figma-sourced photos (see TF0-T05) |
| Envato account | `TreeTech_Themes`, author since Aug 2024, but `/upload` redirects to the dashboard and the menu still shows "Become an Author". Support ticket sent 2026-10-20 — **waiting** |
| Figma design ownership | **Unconfirmed** (TF0-T02) |
| `npm install` in the copy | **Fails** (checked 2026-10-20, Node 24.18, no VS Build Tools) on `better-sqlite3` (no prebuilt binary for Node 24.18, no C++ build tools). Local-machine issue, not a repo problem. Fix in TF1-T00 below; the problem disappears for good once TF1-T09 removes the native module |
| Not started | TF0 answers, TF1–TF8 |

---

## 0. Decisions this plan is built on

| # | Decision | Why |
|---|---|---|
| TF-D1 | **Product = Next.js eCommerce front-end template with JSON mock data. No database, no server auth, no admin.** | Buyers expect a front end they connect to their own backend (Shopify headless, Medusa, Saleor, custom API). `better-sqlite3` is a native module that fails on most buyer hosts (Vercel, Netlify, shared hosting), and every failure becomes a support ticket during the 6-month support window. Reviewers score design, code quality, docs and the live preview — a backend adds review surface and no score. |
| TF-D2 | **Work happens on a `themeforest` branch. `main` stays the full-stack app.** | The backend (auth, orders, state machine, payments) keeps its value for client work or a later full-stack product. Nothing is thrown away. |
| TF-D3 | **P7–P9 (admin) are out of scope for the ThemeForest product.** P11 (responsive) becomes TF3. P12 becomes TF4–TF7. | The admin has no Figma design and no buyer value inside a template. |
| TF-D4 | **All layout variants ship as demos** (10 shop, 11 product, 6 blog). Replaces OQ-06 "ship one layout" for this branch. | On ThemeForest the variants are the selling point. They're already built. |
| TF-D5 | **Images: placeholders in the download zip; licensed photos only in the live preview.** All current Figma-sourced photos and product PNGs are removed from the zip. | Ownership of the Figma photos is unconfirmed (OQ-02). This is the standard marketplace pattern and removes the licensing risk from review. |
| TF-D6 | **Keep the service-function signatures; swap what's underneath.** `src/server/*` read functions keep their names and types but read JSON instead of SQLite. Write flows (cart, auth, checkout, reviews, contact, newsletter) move to client-side stores. | 64 files import `@/server` or `@/db`. Swapping under the services keeps page and component churn small. It also gives buyers one clean seam to plug in their own API — a selling point. |
| TF-D7 | **Deployment target: any Node host or Vercel/Netlify (`next build && next start`).** Static export is a stretch goal, not a requirement. | `/shop` filtering is URL-driven on the server (`searchParams`), which static export doesn't support without a rewrite. |

Log TF-D1…TF-D7 in `decision-log.md` as the next D-numbers when TF1 starts.

---

## 1. Phase overview

| Phase | Name | Effort | Blocks submission? |
|---|---|---|---|
| TF0 | Gates: account, design ownership, name | 1–3 days (mostly waiting) | **Yes** |
| TF1 | Branch + data-layer swap (remove DB/backend) | 4–6 days | Yes |
| TF2 | Demo hub + template polish | 2–3 days | Yes |
| TF3 | Responsive + accessibility | 6–9 days | **Yes — biggest risk** |
| TF4 | Quality bar: browsers, performance, code hygiene | 2–3 days | Yes |
| TF5 | Images, fonts, legal, credits | 2–3 days | Yes |
| TF6 | Buyer documentation | 2–3 days | Yes |
| TF7 | Packaging + live preview | 2 days | Yes |
| TF8 | Listing assets + submission + support setup | 2–3 days | — |

**Total: about 4–6 weeks.** TF0 runs in parallel with TF1–TF2. TF5 photo sourcing can run in parallel with TF3.

---

## 2. Phases

### TF0 — Gates

| Field | Content |
|---|---|
| Objective | Confirm the item can legally and practically be sold on ThemeForest before investing further. |
| Tasks | **TF0-T01** Wait for Envato support reply on upload rights for TreeTech_Themes (ticket opened 2026-10-20). Do **not** click "Become an Author" unless support says to. · **TF0-T02** Confirm who designed the Figma file "Ecommerce (Copy)" (`sXBQCd1Az2To21ejk56Yjc`). If you or your team designed it → OK. If it was bought or copied (UI kit, Figma Community, another author) → read that licence; most UI-kit licences forbid reselling a coded version as a template. If not allowed → stop and redesign. · **TF0-T03** Envato author account: complete profile (avatar, bio), tax info, payout details, ID check. · **TF0-T04** Choose the product name. Brand first, item type stated, ≤100 characters, none of: Amazing, Awesome, Best, Bundle, Discount, Free, Premium, Pro, Ultimate. Example shape: `Cosmia – Skincare & Beauty eCommerce Next.js Template`. Check that "Cosmia" isn't already a registered beauty brand or an existing ThemeForest item. |
**TF0-T05 (decided, D-051)** The user chose to keep `tf-beauty-ecommerce` **public** and pushed the full history (about 130 MB). The history contains Figma-sourced photos and product images whose rights are unconfirmed (TF0-T02), so while the repo is public they are being redistributed. **Accepted risk, to be closed by TF5:** if the photos turn out not to be the user's to share, delete the GitHub repo, run TF5-T01, create a fresh history without the photos and push again. Before submitting to Envato, the public repo must either be private or contain no unlicensed images.
**TF0-T06** Dependency hygiene: nothing else to do now; the install problem is handled in TF1-T00. |
| Completion criteria | Repo risk decision recorded (D-051) and closed before submission; support confirms Site Templates (or Jamstack) upload rights; design ownership confirmed in writing; name chosen. |
| Exit gate | All four answers logged in `decision-log.md`. |
| If a gate fails | Upload rights refused → the same zip sells on your own store (Lemon Squeezy / Gumroad) or another marketplace; only TF8 changes. Design not yours → stop; this is not fixable by code. |

### TF1 — Branch and data-layer swap

| Field | Content |
|---|---|
| Objective | The app builds and runs with **no database, no native modules, no server state**, with every page still rendering exactly as today. |
| Prerequisites | `main` clean and pushed (it is: `ea92b0d`). User approval to create the branch. |
| Tasks | **TF1-T00 Get a working baseline without installing native code.** The copy's `npm install` fails because `better-sqlite3` can't be built on this machine. Pick one: **(a) fastest, no changes to your system:** copy the original's already-working `node_modules` into the copy (`robocopy C:\Projects\beauty-ecommerce\node_modules C:\Projects\themeforest-projects\tf-beauty-ecommerce\node_modules /E /NFL /NDL`), then run `npm run build` and `npm test` to confirm the baseline. The lockfile is identical, so this is safe. **(b)** use Node 22 LTS (the project's `engines` says ≥22) via nvm-windows/fnm, then `npm install`. **(c)** install Visual Studio Build Tools (C++ workload) — large, changes the system, not recommended. After TF1-T09 deletes `better-sqlite3`, none of this matters. Run the baseline once, record it in the decision log, and move on. · **TF1-T01** `git switch -c themeforest` (in the copy, so `main` still mirrors the original). · **TF1-T02** Export the current seed (catalog, categories, variants, blog, content, stores, FAQs, reviews) to typed JSON in `src/data/*.json`, with Zod schemas in `src/data/schema.ts`. Write a one-off export script; don't hand-copy. · **TF1-T03** Create `src/data/provider.ts`: a `DataProvider` interface (getProducts, getProduct, getCategories, search, getPosts, …) and a `JsonProvider` implementation. Read-side functions in `src/server/catalog`, `blog`, `content`, `search` call the provider instead of Drizzle. Keep their signatures. · **TF1-T04** Cart → client store (`localStorage`, same shape as today's API responses). Wishlist/compare are already `localStorage`. · **TF1-T05** Checkout → client-side validation (keep the Zod schemas), "place order" writes a demo order to `localStorage` and routes to `/checkout/confirmation/[number]`. Payment methods shown, none charged. · **TF1-T06** Login / register / forgot / reset / account → demo mode: client validation, a demo session in `localStorage`, account pages read demo orders and addresses from `localStorage`. Add a small dismissible "Demo mode" note on these pages. · **TF1-T07** Track order → looks up `localStorage` orders plus one seeded sample order (documented in the docs). · **TF1-T08** Reviews, contact, newsletter → client validation + success state, no persistence. · **TF1-T09** Remove `src/db`, `drizzle/`, `drizzle.config.ts`, `scripts/db-*`, `scripts/test-reset.ts`, `data/`, `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `serverExternalPackages`, `/api/*` routes that are no longer called, `src/server/{auth,orders,payments,email,security,account}`. · **TF1-T10** Update `.env.example` (likely empty or removed), README, `CLAUDE.md` (branch rules). |
| E2E / tests | Rewrite DB-dependent tests: drop `tests/integration/db.test.ts` etc.; keep the 149 Playwright specs, changing only fixtures/setup (no `test:reset`). Add a unit test that every JSON file passes its Zod schema. |
| Completion criteria | `npm ci && npm run build && npm start` works on a clean clone with **no** `.env` and no DB. All pages render. `npm ls better-sqlite3` returns nothing. |
| Exit gate | typecheck, lint, Vitest, Playwright (Chromium) all pass; side-by-side screenshots of Home, Shop, PDP, Cart, Checkout unchanged vs `main`. |

#### TF1 task contract — **status: PASSED 2026-10-20** (approved by the user the same day; outcome in D-053)

Measured on the branch: 85 files under `src/` import `@/db` or `@/server`; 26 API route handlers; 17 server modules in 13 folders; 18 Playwright storefront specs, 10 Vitest integration files (`db.test.ts`, `auth`, `orders` etc. are DB-specific).

```
Task ID:            TF1 (sub-tasks T00-T10 below, one at a time, local commit after each passing task)
Objective:          The app builds and runs with no database, no native modules and no server state, every page rendering as today.
Exact scope:        INCLUDED  JSON data + Zod schemas; DataProvider/JsonProvider; read services on JSON; cart, checkout,
                              auth/account, tracking, reviews, comments, contact, newsletter as client-side demo flows; removal
                              of DB, Drizzle, better-sqlite3, dead API routes; test/doc updates.
                    EXCLUDED  any visual change; responsive work (TF3); demo hub (TF2); image changes (TF5); admin (never).
Figma node IDs:     none (no frame changes; baseline screenshots must stay identical).
Requirement IDs:    storefront requirements in PRD sections 4/6/15 (CAT, SRCH, CART, WISH, CMP, CHK, CNT, BLG); DB/auth/admin IDs do not apply.
Files/modules:      new  src/data/{*.json,schema.ts,provider.ts,json-provider.ts}, scripts/export-seed.ts (one-off, deleted in T09), src/lib/demo-store/*
                    change  src/server/{catalog,blog,content,cart,contact,newsletter}, the pages and components that call them, playwright.config.ts, tests/*
                    delete (T09)  src/db, drizzle/, drizzle.config.ts, scripts/db-*.ts, scripts/test-reset.ts, data/,
                    src/server/{auth,orders,payments,email,security,account}, unused src/app/api/* routes, three DB deps, serverExternalPackages
Prerequisites:      TF-D1..D7 (D-050); working baseline (T00, done below).
Acceptance criteria:
  A1  Given a clean clone with no .env and no data/ folder, when `npm ci && npm run build && npm start`, then every route returns 200 and renders.
  A2  `npm ls better-sqlite3 drizzle-orm drizzle-kit` lists nothing; `grep -r "@/db" src` finds nothing.
  A3  Read services keep their exported names and types; swapping the provider changes no page code (proved by a unit test with a fake provider).
  A4  Every src/data/*.json file passes its Zod schema (unit test); IDs/slugs are unique; every FK-like reference resolves.
  A5  Cart add/update/remove/clear, coupon-free totals, and stock limits behave as before, persisted in localStorage, survive reload.
  A6  Checkout validates (same Zod schemas), "Place order" stores a demo order and opens /checkout/confirmation/[number]; nothing is charged.
  A7  Login/register/forgot/reset create and clear a demo session; /account pages read demo orders and addresses; signed-out visitors are redirected as today.
  A8  Track order finds a locally stored order or the one seeded sample order.
  A9  Reviews, comments, contact, newsletter validate and show their success state (no persistence beyond the browser).
  A10 Demo-mode notice on login/register/account/checkout is dismissible and does not shift the Figma layout of the form.
Responsive:         not in scope (1920 desktop as today).
Functional tests:   Vitest: schema validation of all JSON; JsonProvider queries (filters, sort, paging, search, related); demo-store cart/orders/session;
                    fake-provider swap test. Delete DB-only tests (db, auth, orders, store-status as applicable) and port the logic tests.
E2E scenarios:      keep the existing 149 specs; change only fixtures/setup (remove test:reset and SQLite). Specs that assert server cookies/DB rows
                    are rewritten to assert localStorage state. New: E2E-DEMO-01 clean-clone smoke (no .env), E2E-DEMO-02 demo order end to end.
Visual verification: tests/visual capture of Home, Shop, PDP, Cart, Checkout on this branch vs the same captures on main (existing diff.mjs); identical.
Regression risks:   pages that are server components reading the cart/session (cart, checkout, account, header badge); the 10 shop / 10 PDP / 6 blog
                    layout URLs; search overlay and quick-view endpoints; sticky bar; wishlist popup (already localStorage).
Evidence required:  typecheck, lint, Vitest, Playwright results per sub-task (counts), clean-clone build log, `npm ls` output, visual diff report.
Status:             PASSED 2026-10-20 (evidence and deviations: decision-log D-053)
```

**Sub-task order and design choices I propose (please confirm or change):**

1. **T00 baseline — done.** `node_modules` copied from the original (same lockfile). Typecheck, lint, 126/126 Vitest and build pass; Playwright not yet re-run on the copy (7 min), I will run it as the T01 baseline.
2. **T01 branch — done** (`themeforest`). T02 export script writes JSON from `src/db/seed`, then T03 provider, in that order, with the DB still present so old and new can be compared.
3. **Seam:** the provider interface (`getProducts`, `getProduct`, `getCategories`, `search`, `getPosts`, ...) is the single place buyers replace. I keep the read-only `/api/catalog/*`, `/api/search`, `/api/products/*` routes (quick view, search overlay and lookups call them) backed by JSON, and delete every write route.
4. **Client demo store:** one small module (`src/lib/demo-store`) holding cart, orders, session, addresses and reviews in `localStorage` under a `cosmia.demo.*` prefix. Server components that read the cart or session today (cart, checkout, account, header badge) become client components or read it through a client wrapper; the markup stays the same.
5. **Order numbers and the sample order:** generated client-side (`CS-` + date + counter); one seeded sample order is shown on Track order and documented.
6. **Order of removal (T09) last**, after all flows run on the client and the old tests are ported, so the suite stays green at each commit.
7. **Risk:** the biggest unknown is how many server components need to become client components for cart/checkout/account without a flash of empty content. I will do cart first (T04) and report before continuing if it needs more than a wrapper.

**Not decided by this contract (need your answer):** none blocking. Defaults I will use unless you say otherwise: keep `/api/health`; keep `NEXT_PUBLIC_*` out entirely in TF1; Playwright stays Chromium-only until TF4.

### TF2 — Demo hub and template polish

| Field | Content |
|---|---|
| Objective | A reviewer or buyer can find every variant in one click, and nothing looks like a dev artifact. |
| Tasks | **TF2-T01** Build a **Demos landing page** (e.g. `/demos`): cards for each shop layout (10), product layout (11), blog layout (6), key pages (cart, checkout, account, 404). This is also the source for preview screenshots. · **TF2-T02** Mega menu "Shop Pages" entries point at the real variant URLs (already mostly done, D-049) — verify none are placeholders. · **TF2-T03** `/dev/components` → either delete, or polish into a documented **UI Kit** page (buttons, inputs, badges, cards, modals). Recommendation: polish it — buyers value it. · **TF2-T04** Replace demo copy that contradicts itself (free-shipping $50 vs $100, multiple addresses, "2026" copyright) with consistent demo content stored in `src/data/site.json`. · **TF2-T05** Centralise brand settings (name, logo, colours, contact, socials, currency, free-shipping threshold) in one `src/config/site.ts` so buyers rebrand in one file. · **TF2-T06** Loading and error states (`loading.tsx`, `error.tsx`) for main routes. |
| Completion criteria | `/demos` lists every variant with a working link; no placeholder links anywhere in menus or footer. |
| Exit gate | A link-crawl E2E test (all internal links return 200) passes. |

#### TF2 task contract — **status: PASSED 2026-10-20** (approved by the user the same day; outcome and deviations in D-054; B6 amended, see below)

Measured on the branch before writing this: 10 shop layouts (`SHOP_LAYOUTS`), 10 product layouts (`PDP_LAYOUTS`; "out of stock" is a state, and the mega menu also has a sticky add-to-cart bar), **5** blog list layouts (`BLOG_LAYOUTS`, plus the post page; the plan's "6" was wrong); **4** `href="#"` placeholders (Home footer socials, Home Instagram strip, blog share buttons, wishlist share buttons); no `loading.tsx` / `error.tsx` anywhere; "Cosmia" and the contact details are hard-coded in 14 files; the free-shipping copy says **$100** (announcement bar, cart logic) and **$50** (benefit strip).

```
Task ID:            TF2 (T01-T07 below, one at a time, local commit after each passing task)
Objective:          A reviewer or buyer reaches every layout and page from one hub, nothing looks like a dev artifact, and the brand is changed in one file.
Exact scope:        INCLUDED  /demos hub; /ui-kit page (replaces the dev-only /dev/components); the 4 placeholder links made real;
                              src/config/site.ts as the single place for brand, contact, social, currency and shipping settings;
                              consistent free-shipping copy; loading and error states; link-crawl and brand-guard tests.
                    EXCLUDED  responsive work (TF3); real photos or thumbnails (TF5, TF8); header/footer/menu redesign; sitemap and SEO (TF4);
                              new Figma frames (the hub, UI kit and error/loading screens are proposed designs, flagged as such).
Figma node IDs:     none new. Built frames change only in text/link targets: BenefitStrip copy, footer/Home social links, share buttons.
Requirement IDs:    CNT (content pages), NAV (menus), plus TF-D4 (all variants ship as demos).
Files/modules:      new  src/config/site.ts, src/app/(site)/demos/page.tsx, src/components/demos/*, src/app/(site)/ui-kit/page.tsx,
                         src/app/(site)/loading.tsx, src/app/(site)/error.tsx, src/app/(home)/loading.tsx, src/app/(home)/error.tsx, src/app/global-error.tsx,
                         src/components/feedback/ErrorPanel.tsx, tests/e2e/storefront/demos.spec.ts, tests/unit/brand-guard.test.ts
                    change  Header/HomeHeader (announcement), BenefitStrip, Footer/HomeFooter, ContactPage, content/policies.ts, layout metadata,
                            checkout methods copy, BlogDetail and WishlistPage share links, config/store.ts (shipping values move to site.ts)
                    delete  src/app/(site)/dev/components (moved to /ui-kit)
Prerequisites:      TF1 passed (D-053). Decisions below confirmed.
Acceptance criteria:
  B1  Given /demos, then it lists all 10 shop layouts, all 10 product layouts (plus sticky bar and out-of-stock), the 5 blog list layouts and a blog post,
      and the key pages (cart, checkout, wishlist, compare, search, categories, login, register, account, track order, about, contact, FAQs,
      store locator, the four policies, 404, UI kit), each as a link that opens the right variant.
  B2  A link crawl starting at /demos, the header menus (shop mega menu and every dropdown), both footers and the Home page follows every internal link
      and each answers 200 (the 404 example excepted); no rendered page in the crawl contains `href="#"`.
  B3  Given src/config/site.ts, when its name, tagline, contact details, social URLs or free-shipping threshold are edited, then the document title,
      both headers and footers, copyright line, contact page, policy contact emails, announcement bar, benefit strip, cart bar and checkout copy follow.
      A unit test fails if "Cosmia" or the demo contact details appear hard-coded in src outside site.ts, src/data and tests.
  B4  The free-shipping threshold reads the same everywhere (default $100) and the checkout total logic uses the same value.
  B5  /ui-kit shows buttons, form fields, checkbox, quantity stepper, badges, product cards, free-shipping bar, modal, toast, icons, colour and type
      tokens; it has no axe violations (serious/critical); /dev/components no longer exists and /ui-kit works in the production build.
  B6  Loading and error states: a route that throws shows the error panel with "Try again" and "Go home" (and recovers); loading UI exists for the
      (site) and (home) groups; the 404 page is unchanged.
  B7  Social links open in a new tab with rel="noopener noreferrer"; share buttons use real share URLs for the current page (as the product share popup does).
  B8  Visual: against main (tests/visual/compare-main.mjs), only the benefit-strip text and the new link targets differ; no layout shift.
Responsive:         not in scope (1920 desktop). The hub and UI kit use the existing container and tokens.
Functional tests:   Vitest: brand guard (B3), site config schema (shipping/contact values are well-formed), demos catalogue lists every layout id exported by
                    SHOP_LAYOUTS / PDP_LAYOUTS / BLOG_LAYOUTS (so a new layout cannot be forgotten).
E2E scenarios:      E2E-DEMO-01 hub lists and opens every variant; E2E-DEMO-02 crawl (B2); E2E-DEMO-03 /ui-kit axe and sections;
                    E2E-DEMO-04 error panel via a UI-kit button that throws inside the (site) boundary, then recovers;
                    E2E-DEMO-05 free-shipping copy equal on Home, cart and checkout; existing 150 specs stay green.
Visual verification: compare-main.mjs on the 11 routes of TF1 plus /demos and /ui-kit (new, no main equivalent: screenshot reviewed by eye).
Regression risks:   header/footer markup (mega menu highlight tests E2E-MEG-*), content pages (E2E-CNT-*), policy text, checkout copy (E2E-CHK-*).
Evidence required:  typecheck, lint, Vitest and Playwright counts per sub-task; crawl output (links checked, failures); compare-main table.
Status:             PASSED 2026-10-20 (D-054)
```

> **B6 as built:** loading UI exists for Home only. A `loading.tsx` under `(site)` turned missing pages into HTTP 200 (soft 404) and rendered pages twice on query-only navigation (D-054), so it was removed and a test now forbids it.

**Sub-tasks, in order:** T01 `site.ts` + move hard-coded brand/contact/shipping values to it + brand-guard test (do first, everything else reads it).
T02 consistent copy (free shipping, one address/phone/email set across Contact, footers, policies, checkout). T03 the 4 placeholder links.
T04 `/ui-kit` (moved and extended from `/dev/components`; its "show the error page" button is also the test for T06).
T05 `/demos` hub + catalogue tests. T06 `loading.tsx`, `error.tsx`, `global-error.tsx`, `ErrorPanel`. T07 link-crawl E2E, compare-main run, docs.

**Decisions I made in this contract (change any you disagree with):**
1. **One settings file, not two.** The plan listed both `src/data/site.json` (demo copy) and `src/config/site.ts` (brand). I use only `src/config/site.ts`; page copy such as About and FAQs stays in its components and data files. Two sources for the same brand name would be worse for buyers.
2. **Free-shipping threshold is $100** everywhere (the value the cart and checkout already enforce; D-004). The Figma benefit card says $50, so that one sentence changes from the design. I will log it as a deviation.
3. **Social links** point to each network's home page (`https://www.instagram.com/` etc.), not to any account, so nothing implies a real profile; buyers set their own in `site.ts`.
4. **/demos is not added to the header or footer** (Figma stays as drawn). It is the entry point for the live preview (TF7-T04) and is linked from the README; say so and I add a footer link.
5. **/ui-kit is public but `noindex`**, because buyers value it and it is harmless.
6. **No thumbnails on the hub yet.** Cards show the layout name and its traits as text (from `SHOP_LAYOUT_TRAITS` etc.); preview images come with TF8 when real photos exist.
7. **Route-level error and loading screens are proposed designs** (not in Figma) and use existing tokens only.

### TF3 — Responsive and accessibility (biggest risk)

| Field | Content |
|---|---|
| Objective | Every route works and looks deliberate at 1920, 1440, 1024, 768 and 390 px. |
| Prerequisites | TF1 done. |
| Tasks | **TF3-T01** Design mobile frames in Figma for the templates that set the patterns: Home, Shop (with filter drawer), Product, Cart, Checkout, Header/menu drawer, Footer. Everything else follows these patterns. If you skip Figma, write a responsive spec instead and approve it before coding. · **TF3-T02** Audit existing breakpoints (today: 34 rules at 1100 px, 9 at 700 px, a few one-offs) and consolidate to tokens: `--bp-xl 1440`, `--bp-lg 1024`, `--bp-md 768`, `--bp-sm 390`. · **TF3-T03** Header: logo + search + cart + hamburger; mega menu → accordion drawer. · **TF3-T04** Shop: sidebar → existing Filter Drawer pattern (`3:11424`); grid 4/3 → 2 → 2-compact. · **TF3-T05** Product page: gallery above info, swipeable thumbnails, sticky add-to-cart bar on mobile (exists — verify). · **TF3-T06** Cart table → stacked cards; checkout single column, summary collapsible. · **TF3-T07** Carousels swipeable with visible controls; modals full-screen on mobile. · **TF3-T08** Accessibility: keyboard walk-through of every overlay and menu; **fix the colour-contrast pairs accepted in D-033** (adjust the gray tokens slightly) — this replaces D-033 on this branch. |
| E2E / tests | Add the five viewports to the Playwright config as projects; run the full suite at each; axe at each with colour-contrast **included**. Visual baselines per viewport. |
| Completion criteria | No horizontal scroll at any viewport on any route; all journeys pass at all viewports; axe 0 critical/serious including contrast. |
| Exit gate | Responsive + a11y report recorded in the decision log. |

### TF4 — Quality bar

| Field | Content |
|---|---|
| Objective | Pass a reviewer's technical check without comment. |
| Tasks | **TF4-T01** Playwright on Chromium, Firefox and WebKit (add projects). · **TF4-T02** Upgrade to the **latest public Next.js minor** (and React) at submission time; re-run everything. · **TF4-T03** Lighthouse on Home, Shop, PDP, Checkout (mobile + desktop): target Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. Fix image sizing (`next/image` sizes), font loading, CLS. · **TF4-T04** HTML validity check on rendered pages (W3C validator or `html-validate`). · **TF4-T05** Code hygiene: no `console.log`, no commented-out blocks, no TODOs, no unused files/exports (`knip` or `ts-prune`), consistent naming, comments where non-obvious. Remove `tests/visual/_dbg.mjs`, `_m2–_m4.mjs`, `_outline.py` style scratch files. · **TF4-T06** `npm audit` 0 high/critical; pin dependency versions. · **TF4-T07** Metadata: per-page `<title>`/description, Open Graph image, favicon set, `robots.txt`, `sitemap.xml`. · **TF4-T08** Make sure the site can render inside an **iframe** (ThemeForest's live preview frames your demo): no `X-Frame-Options: DENY` and no `frame-ancestors 'none'` on the preview deploy. |
| Exit gate | All suites green on 3 browsers × 5 viewports; Lighthouse report saved; validator clean. |

### TF5 — Images, fonts, legal, credits

| Field | Content |
|---|---|
| Objective | Nothing in the zip that you don't have the right to redistribute. |
| Tasks | **TF5-T01** Remove every Figma-sourced photo and product PNG from the zip build (`public/images/**` photos — about 150 files). · **TF5-T02** Generate placeholder images in code (neutral blocks in the theme palette with dimensions printed, correct aspect ratios) — a script, not AI image generation. · **TF5-T03** Source **preview** photos from Unsplash or Pexels (cosmetics, skincare, models, flat-lays). Record each: URL, photographer, licence, where used, in `CREDITS.md`. No AI-generated images anywhere in the zip. · **TF5-T04** Build flag: `NEXT_PUBLIC_DEMO_IMAGES=real|placeholder`; the preview deploy uses `real`, the packaged zip defaults to `placeholder`. Keep both image sets out of each other's build. · **TF5-T05** Fonts: Instrument Sans, Prata, Allura via `@fontsource` (SIL OFL 1.1) — include licence texts in `licenses/`. · **TF5-T06** Icons and logos: confirm the source of every SVG icon; payment logos (Visa, Mastercard, Amex, Discover, PayPal, Bitcoin) are acceptable as payment indicators — keep them unmodified; **remove the B Corp badge** (it's a certification mark; implying certification is misleading). Social icons: use official/brand-guideline shapes. · **TF5-T07** Third-party npm licences: generate a list (`license-checker`) into `licenses/THIRD-PARTY.txt`. · **TF5-T08** No author logo, URL, watermark or personal email anywhere in the item. |
| Exit gate | `CREDITS.md` complete; a grep of the zip build for `.jpg/.png` finds only placeholders + your own SVGs. |

### TF6 — Buyer documentation

| Field | Content |
|---|---|
| Objective | A buyer who has never seen the project installs, rebrands and deploys it from the docs alone. |
| Format | HTML (`documentation/index.html`, self-contained, English) — the conventional ThemeForest format. |
| Sections | 1 Introduction & features · 2 Requirements (Node ≥ 22, npm) · 3 Quick start (`npm install`, `npm run dev`) · 4 Folder structure · 5 Rebranding (`src/config/site.ts`, logo, fonts) · 6 Theming with design tokens (`src/styles/tokens.css`) · 7 Pages and demos (route list, how to choose a default shop/product/blog layout) · 8 Content (`src/data/*.json`: products, categories, blog, pages) · 9 **Connecting a real backend** (the `DataProvider` interface; example adapter outline for a REST API / headless commerce) · 10 Cart, checkout and accounts in demo mode (what they do, what to replace) · 11 Images (replacing placeholders) · 12 Deployment (Vercel, Netlify, Node server) · 13 Accessibility & browser support · 14 Credits & licences · 15 Changelog · 16 FAQ & troubleshooting · 17 Support policy (what is/isn't covered, how to contact). |
| Exit gate | A fresh tester (or a fresh Claude Code session with only the zip + docs) completes quick start, a rebrand and a deploy without help. |

### TF7 — Packaging and live preview

| Field | Content |
|---|---|
| Tasks | **TF7-T01** `scripts/package-themeforest.mjs` builds the zip from an **allow-list** (not a deny-list): <br>`cosmia-nextjs-v1.0.0.zip` → `cosmia/` (theme source, folder named after the theme) · `documentation/` · `licenses/` · `CREDITS.md` · `changelog.txt`. <br>Excluded automatically: `.git`, `.next`, `node_modules`, `tests/`, `playwright-report/`, `test-results/`, `data/`, `uploads/`, `docs/` (internal), `CLAUDE.md`, `.vercelignore`, `tsconfig.tsbuildinfo`, real photos. · **TF7-T02** Version 1.0.0 in `package.json`; `"private": true` stays; `"name"` = theme slug. · **TF7-T03** Clean-room test: unzip into an empty folder → `npm install` → `npm run build` → `npm start` → follow docs. Also on Windows and macOS/Linux if possible. · **TF7-T04** Live preview deploy (Vercel or your own server) on **your own domain**, real-photo build, `/demos` as entry. Needs explicit approval per `CLAUDE.md`. · **TF7-T05** Confirm the preview loads inside an iframe and over HTTPS. |
| Exit gate | Zip < 2 GB (expect < 20 MB), clean-room test passes, preview URL live. |

### TF8 — Listing, submission, support

| Field | Content |
|---|---|
| Tasks | **TF8-T01** Cover image: 3:2, **2340×1560** (minimum 1170×780), ≤ 20 MB, JPEG/PNG. Show the brand name, "Next.js", the hero, and a mobile frame. · **TF8-T02** Preview images: up to 15 — Home, Shop variants grid, PDP variants grid, Cart/Checkout, Account, Blog, mobile set, UI Kit. · **TF8-T03** Title (≤ 100 chars, brand first), description (features, tech, pages count, layout counts, "connect any backend", what's in the zip, credits note on placeholder images), tags (≤ 15), category (choose at upload — check where comparable Next.js eCommerce templates sit: Site Templates or Jamstack). · **TF8-T04** Price: look at 5–10 comparable Next.js eCommerce templates and price in their range; remember the 50% author fee. · **TF8-T05** Submit. Soft reject → fix every listed point and resubmit quickly. Hard reject → final for that item; read the reasons before building the next one. · **TF8-T06** Support: support email or channel, response target (e.g. 1–2 business days), support policy page (6 months included, customization and installation excluded), update cadence, changelog per release. |

---

## 3. Task contracts

No task may be coded until its contract is written and the user has approved it (write it in this file under the phase, or in `tasks/<TASK-ID>.md`).

```
Task ID:            TF1-T03
Objective:          one sentence
Exact scope:        included / excluded (explicit list)
Figma node IDs:     if the task changes a built frame, or adds a new one
Requirement IDs:    PRD IDs that still apply on this branch
Files/modules:      expected paths to create/change/delete
Prerequisites:      task/phase IDs, decisions
Acceptance criteria: Given/When/Then, testable
Responsive:         viewports and behaviours (Figma-defined vs proposed)
Functional tests:   unit/integration cases
E2E scenarios:      E2E-... IDs (positive, negative, boundary)
Visual verification: route, viewport, state, comparison method
Regression risks:   modules that may be affected + tests to re-run
Evidence required:  report IDs / screenshots to attach
Status:             NOT_STARTED | IN_PROGRESS | BLOCKED | FAILED | PASSED
```

Rules:
1. Before coding: re-read the relevant PRD requirements. For a frame, fetch its screenshot and design context via Figma MCP; temporary Figma asset URLs are never committed.
2. Reuse shared components and tokens; no hardcoded values that exist as tokens.
3. Write or extend tests with the task. A task is not done until its E2E lifecycle (`e2e-testing-strategy.md` §3) passes. Never report an unrun test as passed.
4. Record deviations and decision changes in the decision log; update `context.md` and tick §6.
5. One task at a time. Commit locally when a task passes; ask before every push.
6. A phase is done only when its exit gate is met and the evidence is recorded in the decision log.

---

## 4. What to stop / not do on the `themeforest` branch

- Don't start **P7 admin dashboard** (or P8/P9). If you want them for `main`, do them later on `main`.
- Don't push the `themeforest` branch or deploy without asking (same rule as `CLAUDE.md`).
- Don't ship the SQLite files, test databases, screenshots, Figma references or internal docs in the zip.
- Don't use AI-generated images in the zip.

---

## 5. Kickoff prompt for Claude Code

```
Read docs/themeforest-plan.md first, then CLAUDE.md, docs/context.md and docs/decision-log.md.
This folder is the ThemeForest copy of the Cosmia storefront, branch `themeforest`. The original at
C:\Projects\beauty-ecommerce must never be modified. Remote: origin = AlveeUX/tf-beauty-ecommerce
(public by my choice, D-051; ask before every push).
Do NOT start P7. Start TF1 only:
1. (Done: TF-D1..TF-D7 are logged as D-050.)
2. Write the TF1 task contract (plan section 3 format) and show it to me
   before coding.
3. After I approve: do TF1-T00 (baseline without compiling native code, option (a) or (b)), then
   do TF1-T02..T10 one task at a time, running typecheck, lint,
   Vitest and Playwright after each, and commit locally after each passing task.
Stop at the TF1 exit gate and report evidence.
```

**Open before submission:** the repo is public with unlicensed-photo history (TF0-T05, D-051).

---

## 6. Master checklist

**TF0 Gates**
- [ ] Public-repo risk closed (private, or history without unlicensed photos)
- [ ] Envato support confirms upload rights (ticket open)
- [ ] Figma design ownership confirmed
- [ ] Author profile, tax, payout, ID done
- [ ] Product name chosen

**TF1 Data-layer swap**
- [x] `themeforest` branch (created 2026-10-20)
- [x] TF1 task contract approved; TF1-T00 baseline (node_modules copied from the original)
- [x] Seed → JSON + Zod schemas
- [x] `DataProvider` + `JsonProvider`; services read JSON
- [x] Cart, checkout, auth, account, tracking, reviews, contact, newsletter → client demo mode
- [x] DB, Drizzle, `better-sqlite3`, unused APIs removed
- [x] Clean-clone build with no `.env`; all tests green (Playwright 150 + 3 re-run, Vitest 111; D-053)

**TF2 Demos & polish**
- [x] `/demos` hub
- [x] Menus have no placeholder links (crawl: 138 internal links, none dead, no `href="#"`)
- [x] UI Kit page (`/ui-kit`; `/dev/components` removed)
- [x] Consistent demo copy; one `site.ts` for branding (brand guard test)
- [x] Loading/error states (error screens site-wide; loading screen for Home only, see B6 note)

**TF3 Responsive & a11y**
- [ ] Mobile frames/spec approved
- [ ] Breakpoint tokens; header, shop, PDP, cart, checkout, carousels, modals responsive
- [ ] Contrast fixed; keyboard walk-through
- [ ] 5 viewports × full suite green

**TF4 Quality**
- [ ] Chromium, Firefox, WebKit
- [ ] Latest Next.js minor
- [ ] Lighthouse targets met
- [ ] HTML validity, code hygiene, `npm audit`
- [ ] SEO metadata, sitemap, robots
- [ ] Renders inside an iframe

**TF5 Legal**
- [ ] Figma photos removed from zip; placeholders generated
- [ ] Preview photos licensed + `CREDITS.md`
- [ ] Image build flag
- [ ] Font, icon, npm licences in `licenses/`
- [ ] B Corp badge removed; no author branding

**TF6 Docs**
- [ ] HTML documentation, 17 sections
- [ ] Fresh-tester run passes

**TF7 Package & preview**
- [ ] Allow-list packaging script
- [ ] Clean-room install test
- [ ] Live preview on own domain (approved)

**TF8 Listing**
- [ ] Cover 2340×1560 + up to 15 previews
- [ ] Title, description, tags, category, price
- [ ] Submit; support policy and channel ready
