# Product Requirements Document — E-Commerce Platform

> **ThemeForest branch note (D-050):** on branch `themeforest` the plan in force is `themeforest-plan.md`. Requirements about the database, server auth, orders, payments and the admin dashboard describe the full-stack app on `main` and do not apply to the template.

> Working name of the design brand: **COSMIA** ("Skincare & Cosmetics"). Whether this is the client's real brand is an open question (OQ-01).

---

## 1. Document control

| Item | Value |
|---|---|
| Purpose | Define what the e-commerce platform (customer storefront + administration dashboard) must do, based on inspected evidence. |
| Scope | Storefront and admin dashboard. Local development only for the current phase. |
| Version | 0.1 (draft for approval) |
| Status | Approved to proceed 2026-10-19 (P0-P4 delivered; see section 16). Open questions use provisional defaults — see `decision-log.md` D-004. P1 foundation code exists; no storefront/admin features yet. |
| Last updated | 2026-10-19 |
| Companion documents | `context.md`, `themeforest-plan.md`, `e2e-testing-strategy.md` |

### 1.1 Evidence and assumptions policy

Every material statement carries one of these tags:

| Tag | Meaning |
|---|---|
| **Verified (V)** | Seen directly in the Figma file via MCP (metadata, screenshot, or design context) or in the repository. |
| **Proposed (P)** | Recommendation that needs approval. |
| **Assumption (A)** | Temporarily assumed so planning can proceed; must be confirmed. |
| **Open question (OQ)** | Needs a business or architecture decision. Listed in section 14. |
| **Not applicable (N/A)** | Justified as out of scope. |

A feature being drawn in Figma does **not** make it MVP. Priorities (MUST / SHOULD / COULD / WON'T-for-now) reflect business value, dependency and risk.

### 1.2 Evidence base (what was actually inspected)

| Source | Finding | Tag |
|---|---|---|
| Repository `C:\Projects\beauty-ecommerce` | **At discovery time:** empty directory, not a Git repository. *(Since P1: scaffold added; still not a Git repo.)* | V |
| Local toolchain | Node v24.18.0, npm 11.16.0, Python 3.14.5. `pnpm` not installed. | V |
| Figma file `sXBQCd1Az2To21ejk56Yjc` ("Ecommerce (Copy)") | One page ("Page 1", node `0:1`) with **60 top-level frames**: 58 at 1920 px wide, `3:42651` at 1940 px, `3:42576` at 4275 px. | V |
| Figma MCP | `get_metadata`, `get_screenshot`, `get_variable_defs`, `get_design_context` all responded. `get_variable_defs` on `3:42576` returned `{}` (no variables on that frame). Raw metadata for the whole page was ~3.2 MB, so inspection was done incrementally. | V |
| Figma content | **No** admin-dashboard frames, **no** mobile/tablet frames, **no** account-dashboard / order-history frame, **no** order-confirmation frame, **no** prototype/interaction data was retrieved. | V (absence in inspected metadata) |

**Inspection limits:** screenshots were reviewed for Home (`3:2290`), Shop left sidebar (`3:4833`), Details default (`3:12708`), Checkout (`3:22268`) and frames `3:42651`, `3:41609`, `3:42576`. All other frames were inventoried from node metadata (names, sizes, text-layer names) only, not visually reviewed. Design-token extraction used `get_design_context` on Login (`3:22750`) only.

---

## 2. Product overview

### 2.1 Vision (P)
A fast, brand-faithful online store for skincare and cosmetics, paired with an administration dashboard that lets the client run the shop (catalog, stock, orders, content, promotions) without editing code.

### 2.2 Problem statement (A)
The client needs an operable e-commerce business. A design template exists (storefront only). There is no application, no data model, no back-office, and no verification process.

### 2.3 Business objectives (P — to confirm with client)
1. Sell products online with a checkout that works end-to-end.
2. Let non-technical staff manage products, stock, orders and homepage content.
3. Reproduce the supplied design with high, *measurable* visual fidelity.
4. Keep the codebase maintainable and testable so modules can be built one at a time.

### 2.4 Intended users
See section 3.

### 2.5 Product boundaries
- **In:** storefront, admin dashboard, local backend + database, local test payment.
- **Out (for now):** production hosting, real payment/shipping providers, GitHub, Vercel, mobile native apps, multi-vendor marketplace (see 4.3).

### 2.6 Local-first development constraint (V — user instruction)
All work runs on the developer machine. No pushing to GitHub, no Vercel deploys, no production configuration, no Git history changes. No remote database, payment provider or cloud API is assumed to exist.

### 2.7 Mandatory technology (V — user instruction)
HTML5, CSS3 and JavaScript must remain part of the solution regardless of other choices. See section 10 and `context.md` for how this is honored.

---

## 3. Stakeholders and personas

| Persona | Description | Tag |
|---|---|---|
| **Shopper (guest)** | Browses, searches, uses cart, wishlist, compare, may check out. Evidence: all storefront frames. | V |
| **Registered customer** | Has login/register/forgot-password (`3:22750`, `3:23089`, `3:23424`), tracks orders (`3:23740`). Account dashboard / order history **not designed**. | V (auth), P (account area) |
| **Store owner / client** | Wants to operate the shop without code. Implied by user brief; no Figma evidence. | A |
| **Administrator** | Full access to all admin modules, staff and settings. | P |
| **Catalog / content manager** | Manages products, media, blog, banners, pages. | P |
| **Order-management staff** | Processes orders, updates statuses, adjusts stock. | P |

Personas other than Shopper/Registered customer are proposals because the brief lists them as candidates and no design exists.

---

## 4. Scope and release boundaries

### 4.1 MVP (P)
Storefront: global shell (header/footer/announcement bar), Home, Shop listing (**one** default layout), product details (**one** default layout) with size variants, search, cart page + cart drawer, wishlist, checkout with local/mock payment, login/register/forgot password, order tracking, static content pages (About, Contact, FAQs, Policy, Store locator), blog list + details.
Admin: auth + roles, dashboard home, products & variants, categories, media, inventory, orders & statuses, customers (read-only), coupons, homepage content, blog/pages, store settings, staff & roles.
Platform: local database + seed data, validation, error handling, Playwright E2E for critical journeys, screenshot checks.

### 4.2 Later releases (P)
Compare page & popup, quick view, size-guide modal, share modal, Subscribe-and-save, on-sale countdown, color variants, alternate gallery/zoom layouts, additional shop/list/blog layouts, filter drawer, bundles builder, reviews moderation, reports/analytics, multi-currency/language, real payment & shipping providers, email notifications, customer account dashboard enhancements.

### 4.3 Explicitly excluded for now (P)
Production deployment, CI/CD, real payment capture, marketplace/multi-vendor, native mobile apps, ERP/accounting integrations, loyalty program.

### 4.4 Dependencies
Approval of this PRD; decisions OQ-01…OQ-20 (section 14); asset licensing for imagery (OQ-02); admin UX design (section 8.1).

### 4.5 Open decisions
See section 14. Key ones: tech stack approval, layout variant policy, shipping/tax rules, payment methods, product-variant model.

---

## 5. Functional requirements

Conventions: *Pri* = MUST / SHOULD / COULD. *Ev* = evidence tag. Preconditions and dependencies are stated in the acceptance criteria or *Deps* column. Figma IDs reference section 6.1.

### 5.1 STO — Storefront shell

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| STO-001 | Global header with announcement bar, logo, primary nav (Home, About us, Shop, Categories, Pages, Journal), store-locator link, language & currency selectors, search, account, wishlist count, cart count. | Shopper | Given any storefront page, when it loads, then the header renders with live wishlist/cart counts matching stored state. | MUST | V | `3:2290`, `3:22268`, `3:4833` |
| STO-002 | Mega menu / dropdown for Shop, Categories, Pages. | Shopper | Given hover/focus on a nav item with children, then the panel opens; Escape/blur closes it; links navigate. Keyboard operable. | SHOULD | V (layout), P (behavior) | `3:1452`, `3:1749` |
| STO-003 | Global footer: newsletter subscribe, link columns (Shop now, Quick link, Get help), B Corp badge, payment icons, social links, back-to-top. | Shopper | Footer appears on all pages; links resolve to existing routes; subscribe validates email + consent (see NWS-001). | MUST | V | `3:22268` |
| STO-004 | Benefit strip (Free shipping, Easy returns, Secure checkout, Beauty support). | Shopper | Content editable from admin (ACN-003); not hard-coded. | SHOULD | V | `3:22268`, `3:22750` |
| STO-005 | Page hero banner with breadcrumb on inner pages (Shop, Checkout, etc.). | Shopper | Breadcrumb reflects route hierarchy; each crumb links to its page. | MUST | V | `3:4833`, `3:22268` |

### 5.2 HOM — Home

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| HOM-001 | Hero slider with headline, badge, CTA, slider controls. | Shopper | Slides come from admin-managed banners (ACN-001); CTA links resolve. | MUST | V | `3:2290` |
| HOM-002 | "Find favorites" category cards (4). | Shopper | Cards link to the category listing; set/order from admin. | MUST | V | `3:2290` |
| HOM-003 | Marquee strip of brand claims. | Shopper | Text editable from admin; respects reduced-motion. | COULD | V | `3:2290` |
| HOM-004 | Product carousels: "Trending now", "Most loved product", "Fresh drops" featured promo. | Shopper | Products are driven by catalog flags/collections, not hard-coded; out-of-stock items show correct state. | MUST | V (layout), P (data rules) | `3:2290` |
| HOM-005 | Editorial banner, testimonial carousel ("Made personal"), journal (3 blog cards), Instagram strip. | Shopper | Journal cards pull latest published blog posts; Instagram strip uses managed images (no live Instagram API in MVP). | SHOULD | V / A | `3:2290` |
| HOM-006 | "Glow more, spend less" countdown banner. | Shopper | Countdown ends at admin-set datetime; hides after expiry. | COULD | V | `3:2290`, `3:36996` |
| HOM-007 | "Explore bundle" builder with total and struck-through price. | Shopper | Bundle price = admin-defined bundle; add-to-cart adds all items. | COULD | V (layout), OQ-13 | `3:2290` |

### 5.3 CAT — Catalog listing & navigation

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| CAT-001 | Shop grid (3-column with sidebar; 4-column variants) showing product cards: image, badge(s), rating + review count, name, category·size label, price, compare-at price, hover actions (quick view, compare, wishlist, add to cart). | Shopper | Given N published products, when `/shop` loads, then page 1 shows 12 cards with correct data; "Showing 1–12 of N Products" is accurate. | MUST | V | `3:4833`, `3:41609` |
| CAT-002 | Filters: category (with counts), price range slider + presets (Under $50, $20–$50, $50–$100, $100+), size (Mini 15 ml / Standard 30 ml / Large 50 ml / Jumbo 50 ml+), color swatches (Peach, Blush, Sand, Cocoa, Mocha, Crimson, Rose), rating (≥4.5/4/3.5/3), availability (In stock / On sale). | Shopper | Given filters applied, then results, counts and URL query string agree; reload and back/forward preserve state. | MUST (category, price, availability); SHOULD (size, color, rating) | V | `3:4833` |
| CAT-003 | Active-filter chips with "Clear all". | Shopper | Removing a chip updates results and URL. | MUST | V | `3:4833` |
| CAT-004 | Sort ("Sort by: Best Seller" etc.). | Shopper | Sort options defined in OQ-14; stable ordering for ties. | MUST | V (control), OQ-14 (options) | `3:4833` |
| CAT-005 | Pagination (01 02 03 + prev/next) and "Load more" variant. | Shopper | Out-of-range page returns first/last valid page or 404 per rule; one pagination style is selected (OQ-06). | MUST | V | `3:4833`, `3:5980` |
| CAT-006 | Grid ⇄ list view toggle. | Shopper | Toggle persists across navigation (per session). | SHOULD | V | `3:38190`, `3:39326` |
| CAT-007 | Alternate listing layouts (right sidebar, top filter, horizontal filter, filter drawer). | Shopper | Only variants approved in OQ-06 are built. | COULD | V | see 6.1 group D |
| CAT-008 | Categories index page. | Shopper | Lists all active categories with images and counts. | SHOULD | V (name/size only) | `3:28043` |
| CAT-009 | Mega-menu category data matches taxonomy. | Shopper | Taxonomy in `3:42651` is seed data candidate (OQ-15). | SHOULD | V | `3:42651`, `3:1452` |

### 5.4 PRD — Product details

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| PRD-001 | Product header: gallery (main + thumbnails), name, rating, review count, "Verified", price, unit price (`/ 15ml`), badges, stock status, short description. | Shopper | Data comes from product record; unpublished product → 404. | MUST | V | `3:12708` |
| PRD-002 | Size selector (15/30/50/50 ml+) updating price, SKU, stock and unit price. | Shopper | Given a variant is out of stock, then it is visibly disabled and cannot be added. | MUST | V | `3:12708`, `3:16432` |
| PRD-003 | Quantity stepper, Add to cart, Buy now, Add to wishlist, Compare, Share. | Shopper | Qty min 1, max = available stock; Buy now goes straight to checkout with that item. | MUST (cart, buy now, wishlist); SHOULD (compare, share) | V | `3:12708`, `3:14370` |
| PRD-004 | Meta: SKU, tags, categories, "Ships fast", "Free exchange", "Clean formula" trust badges, secure-checkout icons. | Shopper | SKU displayed equals variant SKU. | MUST | V | `3:12708` |
| PRD-005 | Content blocks: "Inside the formula" accordions (benefits, how to apply, full ingredient transparency, clinical results), "Formulated for renewal" ingredient cards. | Shopper | Content authored per product in admin (rich text + structured stats). | SHOULD | V | `3:12708` |
| PRD-006 | Reviews: average + distribution, list with verified badge and brand reply, "write a review" form (nickname, rating, comment, recommend Y/N, name, email, save-info consent). | Shopper | Review submitted enters moderation queue (OQ-16); validation per field; duplicate submit prevented. | SHOULD | V | `3:12708` |
| PRD-007 | Related products / "More from collection" carousels. | Shopper | Related set rule defined in OQ-17. | SHOULD | V | `3:12708` |
| PRD-008 | Out-of-stock state. | Shopper | Add to cart disabled; label shown; optional back-in-stock (not MVP). | MUST | V | `3:16432` |
| PRD-009 | Color variants. | Shopper | Swatch changes images/SKU. | COULD | V | `3:34650` |
| PRD-010 | Subscribe-and-save purchase option. | Shopper | Requires subscription billing — **deferred**. | COULD | V (layout), OQ-18 | `3:35806` |
| PRD-011 | On-sale countdown. | Shopper | Ends at sale end; price reverts. | COULD | V | `3:36996` |
| PRD-012 | Gallery layout variants (thumbnail left/right, 1/2 column) and zoom (inner / external). | Shopper | **All built** (user request, D-038); the layout is chosen per product or by `?layout=`. | COULD | V | `3:29779`, `3:30941`, `3:33384`, `3:32103`, `3:17692`, `3:18997` |
| PRD-013 | Quick view modal. | Shopper | Shows product summary + add to cart without leaving the page. | COULD | V (frame), presumed overlay | `3:1144` |
| PRD-014 | Size-guide modal. | Shopper | Content from admin/static. | COULD | V (frame), presumed overlay | `3:14003` |
| PRD-015 | Share modal. | Shopper | Copy link + social targets (OQ-19). | COULD | V (frame), presumed overlay | `3:14370` |

### 5.5 SRC — Search

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| SRC-001 | Search overlay ("Search product, ingredients, categories…") with popular terms and trending products. | Shopper | Typing returns matching products (name, category, ingredient, tag); empty result shows an empty state; popular terms editable. | MUST | V | `3:16254` |
| SRC-002 | Search results page. | Shopper | Reuses listing component with query filter. | SHOULD | A (no results frame) | — |

### 5.6 CRT — Cart

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| CRT-001 | Cart drawer (opens on add) and empty drawer. | Shopper | Given add-to-cart, then drawer opens with the line, subtotal and CTAs; empty drawer shows empty state. | MUST | V (name/text) | `3:15101`, `3:14744` |
| CRT-002 | Cart page: table (Product, Price, Quantity, Subtotal), coupon field, free-shipping progress bar, totals. | Shopper | Qty change recalculates totals; line removal works; progress bar reflects shipping threshold (OQ-04). | MUST | V | `3:20299` |
| CRT-003 | Empty cart page. | Shopper | CTA returns to shop. | MUST | V | `3:29452` |
| CRT-004 | Cart persistence. | Shopper | Guest cart survives reload; merges into account cart on login (rule OQ-20). | MUST | P | — |
| CRT-005 | Stock validation. | Shopper | Qty cannot exceed available stock; price/stock re-validated server-side at checkout. | MUST | P | — |

### 5.7 WSH / CMP — Wishlist & Compare

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| WSH-001 | Wishlist page and empty state. | Shopper | Toggling heart on any card updates header count and the page. | SHOULD | V | `3:20784`, `3:21193` |
| WSH-002 | Wishlist drawer/popup (frame `3:15517`, 1000 px tall, same name as page). | Shopper | **Unclear** whether drawer or duplicate (see 6.1). | COULD | OQ | `3:15517` |
| WSH-003 | Wishlist persistence. | Shopper | Guest: local storage; logged in: server. | SHOULD | P | — |
| CMP-001 | Compare page (rating, SKU, size, price, stock, add to cart) and empty state; compare popup. | Shopper | Max items limit set (OQ-10); removing items works. | COULD | V | `3:21520`, `3:21946`, `3:15903` |

### 5.8 CHK — Checkout

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| CHK-001 | Billing form: first name*, last name*, company (opt), country/region*, street address*, apartment (opt), town/city*, postcode*, phone*, email*, order notes (opt). | Shopper | Given a required field is empty/invalid, then submit is blocked with a field-level message; country list per OQ-04. | MUST | V | `3:22268` |
| CHK-002 | Coupon entry ("Have a coupon? Click here"). | Shopper | Valid coupon updates totals; invalid shows error; usage limits enforced server-side. | MUST | V | `3:22268` |
| CHK-003 | Order summary with line items, subtotal, total. | Shopper | Totals equal server-calculated values. | MUST | V | `3:22268` |
| CHK-004 | Payment methods shown: Direct bank transfer, Cash on delivery, Check payments. Card icons shown in footer area. | Shopper | MVP supports **local mock gateway** + COD/bank transfer (no live provider). | MUST | V (design shows 3 offline methods) / OQ-05 | `3:22268` |
| CHK-005 | Terms & privacy consent required. | Shopper | Submit disabled/blocked until checked. | MUST | V | `3:22268` |
| CHK-006 | Place order ("Proceed to checkout"). | Shopper | Creates order atomically: re-validates stock/prices, decrements stock, creates order + payment record; duplicate click does not create two orders. | MUST | P | `3:22268` |
| CHK-007 | Order confirmation page. | Shopper | Shows order ID, items, totals, next steps. **No design exists** — must be designed. | MUST | Missing design | — |
| CHK-008 | Guest vs account checkout. | Shopper | Both allowed (A); OQ-09. | MUST | A | — |
| CHK-009 | Shipping method & cost, tax. | Shopper | No Figma evidence of shipping-method selection or tax lines. Rules in OQ-04. | MUST | OQ-04 | — |

### 5.9 USR — Accounts & authentication

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| USR-001 | Login: username/email*, password*, remember me, links to register and lost password. | Customer | Wrong credentials → generic error; throttling after repeated failures. | MUST | V | `3:22750` |
| USR-002 | Register: username*, email*, password*, privacy consent text. | Customer | Unique email/username; password policy (P: min 8, no common passwords). | MUST | V | `3:23089` |
| USR-003 | Forgot password: username/email → reset link. | Customer | Always returns the same message whether or not the account exists. Local email = log/outbox (no real email). | MUST | V | `3:23424` |
| USR-004 | Account area: profile, addresses, order history, logout. | Customer | **No design exists.** Needs design. | SHOULD | Missing design | — |
| USR-005 | Logout, session expiry. | Customer | Session invalidated server-side. | MUST | P | — |

### 5.10 ORD / TRK — Orders and tracking

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| TRK-001 | Track order form: Order ID*, billing email*. | Shopper | Matching pair → status timeline; mismatch → generic "not found". | MUST | V | `3:23740` |
| TRK-002 | Tracking result view. | Shopper | **No design exists** for the result. | MUST | Missing design | — |
| ORD-001 | Order lifecycle: `pending` → `paid`/`awaiting_payment` → `processing` → `shipped` → `delivered`; plus `cancelled`, `refunded`, `failed`. | System | Only allowed transitions succeed; each transition logged with actor and time. | MUST | P | — |
| ORD-002 | Order ID format and uniqueness. | System | Human-friendly, non-guessable enough for tracking when paired with email (OQ-21). | MUST | P | — |

### 5.11 CNT — Content & informational pages

| ID | Requirement | Actor | Acceptance criteria | Pri | Ev | Figma |
|---|---|---|---|---|---|---|
| CNT-001 | Blog index in 5 layouts (grid, list, standard, left/right sidebar) and blog details. | Shopper | One layout chosen (OQ-06). Only published posts shown; pagination. | SHOULD | V | `3:25805`, `3:28943`, `3:24811`, `3:25320`, `3:26239`, `3:26684` |
| CNT-002 | About us. | Shopper | Content managed in admin. | SHOULD | V | `3:28603` |
| CNT-003 | Contact us: address, emails, phone, live chat; form (full name*, email*, topic select*, message*, privacy consent). | Shopper | Valid submit stores a message visible in admin; no real email in local phase. | SHOULD | V | `3:27227` |
| CNT-004 | FAQs (two frames). | Shopper | Accordion; managed Q&A. | SHOULD | V (names), unclear difference | `3:27601`, `3:28374` |
| CNT-005 | Store location list (phone, distance, hours, directions). | Shopper | Stores managed in admin; "distance" requires geolocation (OQ-22). | COULD | V | `3:24455` |
| CNT-006 | Policy and privacy page. | Shopper | Managed pages. | SHOULD | V | `3:24059` |
| NWS-001 | Newsletter: footer form and popup ("Join today and enjoy 20% off everything"). | Shopper | Email + consent stored; duplicate email handled; offer code issuance per OQ-23. | SHOULD | V | `3:2009` |

### 5.12 Administration requirements

Defined in section 8 with IDs `ADM`, `ACT`, `AIN`, `AOR`, `ACS`, `APM`, `ACN`, `AST`, `AUR`, `ARP`. Cross-cutting `SEC` and `NFR` IDs in 5.13 and 12.

### 5.13 SEC — Security (cross-cutting)

| ID | Requirement | Acceptance criteria | Pri | Ev |
|---|---|---|---|---|
| SEC-001 | Passwords stored with a modern slow hash (argon2id or bcrypt). | No plaintext or reversible storage. | MUST | P |
| SEC-002 | All admin routes and APIs require authentication + permission check server-side. | Unauthenticated → 401/redirect; unauthorized → 403; verified by E2E. | MUST | P |
| SEC-003 | Input validation on every API boundary (shared schema). | Invalid payload → 400 with field errors; no raw SQL string building. | MUST | P |
| SEC-004 | CSRF/session protection, secure cookie flags, rate limiting on auth and order-lookup. | Brute force of tracking endpoint blocked. | MUST | P |
| SEC-005 | Secrets only in untracked `.env`; never in docs, logs or tests. | `.env` is git-ignored; `.env.example` has no real values. | MUST | P |
| SEC-006 | Uploads restricted by type/size; filenames sanitized. | Non-image upload rejected. | MUST | P |
| SEC-007 | Audit log for sensitive admin operations. | See ADM-005. | SHOULD | P |

---

## 6. Page and route specification

### 6.1 Verified Figma inventory

Totals: **60 frames** = 57 screens/states + 3 reference sheets. All 1920 px wide unless noted. IDs are the actual node IDs.

Classification codes: **U** unique page · **T** reusable page template (alternate layout of the same route) · **O** overlay/state of another page · **E** empty state · **R** reference sheet (not a screen) · **?** unclear.

**Group A — Shell & overlays**

| Node | Name | W×H | Class | Notes |
|---|---|---|---|---|
| `3:2009` | Newsletter | 1920×1010 | O | Home header/hero region + newsletter popup |
| `3:1749` | Menu dropdown | 1920×1010 | O | Not visually reviewed |
| `3:1452` | Mega menu | 1920×1010 | O | Includes "Shop Pages" list of layout variants |
| `3:16254` | Serche page *(sic)* | 1920×911 | O | Search overlay with popular terms |
| `3:1144` | Quick view | 1920×1000 | O | Product chooser + summary |
| `3:14003` | Size guide | 1920×1010 | O | Product-details content underneath |
| `3:14370` | Share product | 1920×1010 | O | Product-details content underneath |
| `3:15903` | Compare popup | 1920×1000 | O | Product-details content underneath |
| `3:14744` | Emply cart drawer *(sic)* | 1920×1000 | O/E | Empty cart drawer |
| `3:15101` | Cart drawer | 1920×1000 | O | Product-details content underneath |
| `3:15517` | Wishlist page | 1920×1000 | ? | Same name as `3:20784`, but 1000 px tall — likely a drawer. Not verified |

**Group B — Home**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:2290` | Home Morden cosmetics *(sic)* | 1920×10025 | U |

**Group C — Catalog (listing family, 10 layouts of one route)**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:4833` | Shop left sidebar | 1920×4263 | T (reference layout, reviewed) |
| `3:40462` | Shop right sidebar | 1920×4263 | T |
| `3:38190` | List left sidebar | 1920×6786 | T |
| `3:39326` | List right sidebar | 1920×6786 | T |
| `3:5980` | Load More Button | 1920×4267 | T |
| `3:7112` | Shop Top Filter | 1920×4587 | T |
| `3:8330` | List Top Filter | 1920×7110 | T |
| `3:10357` | Shop Horizontal Filter | 1920×4393 | T |
| `3:9418` | List Horizontal Filter | 1920×6916 | T |
| `3:11424` | Filter Drawer | 1920×1649 | O |
| `3:28043` | Categories | 1920×3043 | U |

**Group D — Product details (11 variants of one route)**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:12708` | Details default | 1920×8340 | T (reference layout, reviewed) |
| `3:34650` | Product color | 1920×6803 | T |
| `3:35806` | Subscribe and save | 1920×7008 | T |
| `3:36996` | On sale countdown | 1920×6873 | T |
| `3:29779` | Thumbnail right | 1920×6792 | T |
| `3:30941` | Thumbnail left | 1920×6786 | T |
| `3:33384` | Gallery 1 column | 1920×9768 | T |
| `3:32103` | Gallery 2 colum *(sic)* | 1920×8329 | T |
| `3:16432` | Out of stock | 1920×8340 | state of details |
| `3:17692` | Inner zoom | 1920×8320 | T |
| `3:18997` | External zoom | 1920×8320 | T |

**Group E — Cart, wishlist, compare, checkout**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:20299` | Cart page | 1920×2587 | U |
| `3:29452` | Empty Cart page | 1920×2354 | E |
| `3:20784` | Wishlist page | 1920×2435 | U |
| `3:21193` | Empty Wishlist page | 1920×2354 | E |
| `3:21520` | Compare page | 1920×2575 | U |
| `3:21946` | Empty Compare page | 1920×2204 | E |
| `3:22268` | Checkout page | 1920×3595 | U (reviewed) |

**Group F — Account**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:22750` | Login | 1920×2457 | U |
| `3:23089` | Register | 1920×2611 | U |
| `3:23424` | Forgot password | 1920×2256 | U |
| `3:23740` | Track order | 1920×2391 | U |

**Group G — Content**

| Node | Name | W×H | Class |
|---|---|---|---|
| `3:24059` | Policy and privacy | 1920×3906 | U |
| `3:24455` | Store location | 1920×2632 | U |
| `3:25805` | Blog grid | 1920×3689 | T |
| `3:28943` | Blog left sidebar | 1920×3689 | T |
| `3:24811` | Blog right sidebar | 1920×3689 | T |
| `3:25320` | Blog list | 1920×3399 | T |
| `3:26239` | Blog standard | 1920×4083 | T |
| `3:26684` | Blog details | 1920×5060 | U |
| `3:28603` | About us | 1920×5313 | U |
| `3:27227` | Contact us | 1920×3303 | U |
| `3:27601` | FAQs | 1920×3809 | U |
| `3:28374` | FAQs *(second frame)* | 1920×1454 | ? (possibly an FAQ state/section) |

**Group H — Reference sheets (not screens)**

| Node | Name | W×H | Content |
|---|---|---|---|
| `3:42651` | 49 | 1940×1434 | Product/category taxonomy lists for three demo stores: Demo 1 Skincare (5 categories), Demo 2 Cosmetics + Skincare (9), Demo 3 Modern Beauty (12 categories: Cleansers, Essentials, Moisturizers, Treatments, Masks, Eyes, Lips, Face, Nails, Haircare, Tools, Fragrance). |
| `3:41609` | 50 | 1920×6629 | Grid of ~40 product cards (badges BEST SELLER / NEW / TRENDING / HOT, ratings, names, category·size labels, prices, compare-at prices). Seed-data source. |
| `3:42576` | 51 | 4275×14646 | Sheet of ~72 product and model photos in the COSMIA style. Asset library. |

**Not present in the file (V):** admin dashboard · mobile/tablet frames · account dashboard/order history · order confirmation · tracking result · search-results page · 404/500 pages · loading/skeleton states · cookie banner.

**Design-template observation (V):** the mega-menu "Shop Pages" list names demo layouts (Shop Default, Grid left sidebar, Grid right sidebar, List left sidebar, List right sidebar, Load more, Top Filter, Horizontal Filter, Filter drawer). These are theme demo variants, not a production navigation requirement. Section 14 OQ-06 asks the client which single layout to ship and whether others should be admin-selectable.

### 6.2 Proposed route map (all routes are **P** — Figma defines no URLs)

| Route | Purpose | Template / Figma | Primary data | Key actions | States to design/handle | Reqs |
|---|---|---|---|---|---|---|
| `/` | Home | `3:2290` | banners, collections, products, posts | browse, add to cart | loading, empty collection, error | HOM-* |
| `/shop` | Catalog listing | `3:4833` (+`3:5980`,`3:11424`) | products, filters, facets | filter, sort, paginate | empty results, error, loading | CAT-* |
| `/categories`, `/category/[slug]` | Category index / filtered listing | `3:28043`, `3:4833` | categories | navigate | empty category | CAT-008 |
| `/product/[slug]` | Product details | `3:12708`, `3:16432` | product, variants, reviews, related | add to cart, wishlist | out of stock, 404, review success/error | PRD-* |
| `/search?q=` | Search results | overlay `3:16254` + listing | products | search | no results | SRC-* |
| `/cart` | Cart | `3:20299`, `3:29452` | cart | qty, remove, coupon | empty, stock conflict | CRT-* |
| `/checkout` | Checkout | `3:22268` | cart, shipping, payment | place order | validation, payment failure, pending | CHK-* |
| `/checkout/confirmation/[orderId]` | Confirmation | **no design** | order | — | success | CHK-007 |
| `/wishlist` | Wishlist | `3:20784`, `3:21193` | wishlist | add to cart, remove | empty | WSH-* |
| `/compare` | Compare | `3:21520`, `3:21946` | compare set | remove, add to cart | empty | CMP-001 |
| `/login`, `/register`, `/forgot-password` | Auth | `3:22750`, `3:23089`, `3:23424` | — | submit | validation, lockout, success | USR-* |
| `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses` | Account | **no design** | user, orders | edit | empty, error | USR-004 |
| `/track-order` | Track order | `3:23740` + result (missing) | order | lookup | not found, result | TRK-* |
| `/blog`, `/blog/[slug]` | Journal | `3:25805` etc., `3:26684` | posts | read, paginate | empty | CNT-001 |
| `/about`, `/contact`, `/faqs`, `/store-locator`, `/policy/[slug]` | Content | `3:28603`, `3:27227`, `3:27601`, `3:24455`, `3:24059` | pages/stores | submit contact | success/error | CNT-* |
| `/admin/**` | Admin | **no design** | see section 8 | see section 8 | see section 8 | ADM-* |

---

## 7. Storefront requirements

Covered by sections 5.1–5.11. Storefront-wide rules:

- **STO-R1 (P):** Storefront reads only *published/active* data; draft or archived items never render publicly.
- **STO-R2 (P):** Prices, stock and totals shown in the UI are advisory; the server recomputes them on cart mutation and order placement.
- **STO-R3 (P):** Every list/detail view defines loading, empty and error states (section 12 NFR-A).
- **STO-R4 (V):** Visual language: Instrument Sans for UI text, Prata for display headings (hero "Glam Defined Perfectly", "Checkout", section titles); near-black `#211a18`, cream `#fdfbf8`/`#f8f5f0`/`#eee9e1`, burgundy `#8e2018`/`#431310`, red `#c7332b`, grays `#736f6d`/`#9e9c9a`/`#ccc8c2`. Extracted from Login (`3:22750`) design context; full token audit is a Phase 2 task (the file defines **no** Figma variables on `3:42576`; other frames not checked).

---

## 8. Administration dashboard requirements

### 8.1 Design status
**No dashboard screens exist in the Figma file (V).** The dashboard is a required product area (the brief says the client must manage the store without code). Recommended: commission or produce admin designs before building admin UI (OQ-24). Proposed UX direction (P): a desktop-first console reusing the storefront's tokens (Instrument Sans, burgundy accent, cream/neutral surfaces) but with denser, utility-focused patterns: left sidebar nav, top bar with user menu, data tables (search, filter, sort, pagination, bulk actions), side-sheet/forms, toast feedback, confirm dialogs. Must be usable at tablet width; full mobile admin is COULD.

### 8.2 Architecture relationship to the storefront (P)
Single source of truth: one database and one domain/service layer. The admin UI and the storefront are two clients of the same services:

```
Admin UI  ─┐                             ┌─> products, variants, stock
           ├─> API / service layer ──────┼─> orders, payments, customers
Storefront ┘   (validation, permissions) ├─> promotions, shipping rules
                                         └─> content (banners, pages, posts, settings)
```
- Admin writes go through permissioned services; storefront reads published data only.
- A product's `status`, `visibility`, variant stock and price changes take effect on the storefront without code changes or redeploys (read-through, no stale static copies; if caching is added, writes must invalidate it).
- Storefront order placement calls the same inventory service the admin uses, so stock cannot diverge.

### 8.3 Dashboard modules

| ID | Module / requirement | Actor | Acceptance criteria | Pri | Ev |
|---|---|---|---|---|---|
| ADM-001 | Admin sign-in separate from customer sign-in; session timeout. | Staff | Customer credentials cannot access `/admin`. | MUST | P |
| ADM-002 | Dashboard home: today's orders, revenue, low-stock, recent orders. | Admin | Numbers equal DB aggregates. | SHOULD | P |
| ADM-003 | Navigation shell, breadcrumbs, responsive sidebar. | Staff | Items hidden if user lacks permission. | MUST | P |
| ADM-004 | Role-based access (RBAC): roles Owner/Admin, Catalog manager, Order manager, Content manager (P) mapped to permissions. | Admin | Each protected action checks permission server-side; E2E negative tests. | MUST | P |
| ADM-005 | Audit log: who/what/when/before→after for price, stock, order-status, role, setting, refund, delete. | Admin | Entries immutable from UI. | SHOULD | P |
| ADM-006 | Destructive-action confirmation and soft delete where referenced by orders. | Staff | Deleting a product that has orders archives it instead. | MUST | P |
| ACT-001 | Product CRUD: name, slug, descriptions, status (draft/published/archived), badges, tags, categories, images, SEO fields, content blocks (PRD-005). | Catalog mgr | Validation: name required, slug unique, price ≥ 0, ≥1 variant for sale. | MUST | P (fields derived from V storefront) |
| ACT-002 | Variants & SKUs: size (15/30/50/50+ ml), optional color; SKU unique; price, compare-at price, weight. | Catalog mgr | Duplicate SKU rejected. | MUST | P (sizes V) |
| ACT-003 | Categories (hierarchy, image, order, active flag) and attributes/filters (size, color, rating derived). | Catalog mgr | Category with products cannot be hard-deleted. | MUST | P |
| ACT-004 | Media library: upload, alt text, reuse. | Catalog mgr | Type/size limits; alt text required (a11y). | MUST | P |
| ACT-005 | Collections ("Trending now", "Fresh drops", "Most loved") assignment. | Content mgr | Drives HOM-004. | SHOULD | P |
| AIN-001 | Inventory per variant: on-hand, reserved, low-stock threshold; manual adjust with reason. | Order/Catalog mgr | Stock never negative unless backorders enabled (OQ-12). | MUST | P |
| AIN-002 | Stock movement history. | Admin | Order placement/cancel/adjust create entries. | SHOULD | P |
| AOR-001 | Orders list: search, filter by status/date, sort, paginate. | Order mgr | Fast on 10k orders (NFR). | MUST | P |
| AOR-002 | Order detail: items, customer, addresses, payment record, timeline, notes. | Order mgr | Read matches what customer saw. | MUST | P |
| AOR-003 | Status transitions per ORD-001; cancel/refund (record only, no live gateway). | Order mgr | Illegal transition rejected; stock restored on cancel. | MUST | P |
| AOR-004 | Shipments: carrier + tracking number entry; shows in TRK-002. | Order mgr | — | SHOULD | P |
| ACS-001 | Customers: list, detail, orders, activate/deactivate. | Admin | Admin cannot see password hashes. | SHOULD | P |
| ACS-002 | Contact-form messages and newsletter subscribers lists/export. | Content mgr | — | SHOULD | P |
| APM-001 | Coupons: code, type (% / fixed / free shipping), min spend, dates, usage limit. | Admin | Checkout (CHK-002) honors rules server-side. | MUST | P (coupon field V) |
| APM-002 | Sale pricing windows & countdown (HOM-006, PRD-011). | Admin | — | COULD | P |
| APM-003 | Newsletter welcome offer (NWS-001). | Admin | — | COULD | P |
| ACN-001 | Homepage banners/hero slides: image, text, CTA, order, active window. | Content mgr | Publishing changes storefront without code change. | MUST | P |
| ACN-002 | Blog posts: draft/published/scheduled, cover, body, categories. | Content mgr | Draft not visible publicly. | SHOULD | P |
| ACN-003 | Static pages (About, Policy, FAQs, Benefit strip, marquee text, footer links, store locations). | Content mgr | — | SHOULD | P |
| AST-001 | Store settings: name, logo, contact info, currency, free-shipping threshold, tax, order-ID prefix. | Admin | Threshold drives CRT-002 progress bar. | MUST | P |
| AST-002 | Shipping zones/rates; payment method toggles (COD, bank transfer, mock card). | Admin | Disabled methods not offered at checkout. | MUST | P |
| AUR-001 | Staff accounts: invite/create, assign role, deactivate, reset password. | Owner | Last Owner cannot be deleted/demoted. | MUST | P |
| ARP-001 | Reports: sales by day, top products, low stock. | Admin | Computed from orders table; CSV export COULD. | COULD | P |

### 8.4 Cross-cutting dashboard rules (P)
- **Forms:** same validation schema as API; inline field errors; unsaved-changes guard.
- **Tables:** server-side pagination/sort/filter; URL-reflected state; empty and error states.
- **Concurrency:** optimistic-concurrency check (updated-at/version) on product and order edits to prevent silent overwrites.
- **Publication:** `draft → published → archived`; scheduled publish for blog/banners.
- **Errors:** user-safe messages; technical detail only in server logs.

---

## 9. Business rules and data model

All entities below are **P** (proposals derived from Figma-visible data fields plus standard commerce needs).

| Entity | Key fields | Relationships / constraints |
|---|---|---|
| Product | id, slug (unique), name, descriptions, status, badges, tags, rating_avg, review_count | has many Variant, Category (M:N), Media, Review |
| Variant | id, product_id, sku (unique), size_label (e.g. 15 ml), color?, price, compare_at_price?, weight | belongs to Product; one InventoryRecord |
| Category | id, slug, name, parent_id?, image, sort, active | hierarchical; product counts derived |
| InventoryRecord | variant_id, on_hand, reserved, low_stock_threshold | `on_hand ≥ 0` unless backorder; movements log |
| Customer | id, email (unique), username, password_hash, status | has Addresses, Orders, Wishlist |
| Cart / CartItem | cart_id, owner (guest token or customer), variant_id, qty | qty ≥1 and ≤ available; merged on login |
| Order | id, public_ref, customer_id?, email, status, totals, billing address snapshot, notes, coupon_id? | immutable price/address snapshot at placement |
| OrderItem | order_id, variant_id, name/sku/price snapshot, qty | — |
| PaymentRecord | order_id, method (cod/bank/mock), status, amount, reference | one or more per order |
| Shipment | order_id, carrier, tracking_no, status | — |
| Discount | code, type, value, min_spend, starts/ends, usage_limit, used_count | validated server-side |
| Review | product_id, customer_id?, rating 1–5, body, recommend, status (pending/approved) | moderation (OQ-16) |
| ContentPage / BlogPost / Banner / StoreLocation | slug, body, status, publish window | managed by admin |
| NewsletterSubscriber / ContactMessage | email/message, consent, created_at | — |
| AdminUser / Role / Permission | user, role, permission set | RBAC; Owner protected |
| AuditLog | actor, action, entity, before, after, at | append-only |

### 9.1 Business rules (all **P** unless noted)

| # | Rule | Tag |
|---|---|---|
| BR-01 | Sellable unit = Variant. SKU unique. | P |
| BR-02 | Displayed price = variant price; if `compare_at_price > price`, show strike-through (Figma shows `$96` with `$110` struck through — V). | V/P |
| BR-03 | Cart total = Σ(line price × qty) − discount + shipping + tax. Computed server-side with integer minor units (cents), never floats. | P |
| BR-04 | Free-shipping progress compares subtotal to threshold from settings. Figma contains **conflicting** thresholds ($100 in announcement bar, $50 in benefit card) — OQ-04. | V conflict |
| BR-05 | Stock reservation/decrement occurs at order placement (not add-to-cart) in MVP. | A |
| BR-06 | Order status machine: `pending → processing → shipped → delivered`; `pending/processing → cancelled`; `paid` orders → `refunded`. Payment states: `pending / paid / failed / refunded`. | P |
| BR-07 | COD / bank transfer orders start `pending` payment; the mock card gateway returns success/failure/pending deterministically for tests. | P |
| BR-08 | Coupon valid only within dates, min spend and usage limit; cannot make total negative. | P |
| BR-09 | A product with orders is archived, never hard-deleted. | P |
| BR-10 | Draft/archived products are hidden from listing, search, direct URL, wishlist (shown as unavailable) and cart (flagged). | P |
| BR-11 | Reviews display only when approved; "Verified" badge only for customers with a delivered order of that product. | P |
| BR-12 | Tracking requires Order ID **and** billing email. | V (form fields) |

Lifecycle diagrams and detailed transition tables will be added to `themeforest-plan.md` task contracts when the owning phase starts.

---

## 10. Frontend requirements

| Topic | Requirement |
|---|---|
| HTML5 / CSS3 / JS | Semantic HTML5 landmarks; CSS3 (custom properties, grid, flexbox, `clamp()`) for all styling; JavaScript/TypeScript for behavior. These remain first-class and visible in the code (no opaque UI kit that hides the markup/CSS). V (mandatory). |
| Recommended stack | See section 11.1 (**P**, pending approval). |
| Component architecture | Primitives (Button, Input, Badge, Rating, Price), composites (ProductCard, FilterGroup, Drawer, Accordion, Carousel, Breadcrumb), sections (Header, Footer, BenefitStrip), page templates. Derived from repeated patterns seen across frames. |
| Routing | File-system or declarative routes per 6.2; URL reflects filter/sort/page state. |
| Styling & tokens | CSS custom properties for color, type scale, spacing, radius, shadow; tokens sourced from Figma (Phase 2). |
| Forms | Controlled forms with shared validation schema; per-field errors; accessible labels (Figma checkout uses visible labels with `*` required markers). |
| State | Server state via data-fetching layer; local state only for UI; cart/wishlist/compare as a small client store synchronized with the server. |
| Data fetching | Server-rendered pages for catalog/PDP/content (SEO), client fetch for interactive filtering, cart. |
| Assets | Images from the 51-sheet exported to local `/public`/asset pipeline at approved sizes; responsive `srcset`; icons as SVG. **Temporary Figma asset URLs must never be committed.** |
| Responsive | Section 12.2. |
| Accessibility | WCAG 2.2 AA target (P): keyboard operable menus/drawers/carousels, focus trapping in modals, visible focus, color contrast (to be audited — several grays like `#9e9c9a` on cream may fail), alt text, `prefers-reduced-motion`. |
| Browser support | Last 2 versions of Chrome, Edge, Firefox, Safari (P). |
| States | Every data view: loading (skeleton), empty, error with retry, success. None of these are in Figma → must be designed/proposed. |

---

## 11. Backend requirements

### 11.1 Recommended architecture and stack (**all P — pending approval; nothing installed**)

| Area | Recommendation | Why | Alternatives considered |
|---|---|---|---|
| Overall shape | **Single repository, modular monolith**: storefront + admin + API in one app, separated by route groups and a domain/service layer. | One DB and one rule set for both areas; simplest local setup; clean seams for later extraction. | Separate storefront/admin/API apps (more ops overhead now); static site + headless commerce SaaS (violates "no external service assumed"). |
| Framework | **Next.js (App Router) + TypeScript** | SSR/SSG for SEO-heavy catalog, file routing, route handlers, first-class Playwright support, large ecosystem. | Plain multi-page HTML/CSS/JS + Express (maximum HTML/CSS/JS purity, but re-invents routing, templating, bundling; slower for 57 screens); Astro (great for content, weaker for app-like admin); Remix/React Router. |
| Language | TypeScript (compiles to JavaScript) | Shared types between UI, API and DB reduce integration bugs, which matters for AI-generated code. | Plain JS (satisfies the mandate literally but loses type safety). |
| Styling | **Handwritten CSS3** using CSS custom-property tokens + CSS Modules (component-scoped). | Keeps CSS3 first-class and inspectable; high design fidelity; no utility-class churn. | Tailwind (fast, but design-token fidelity via config and long class strings; viable alternative); a UI kit like MUI (fights the custom design). |
| Database | **SQLite for local development via an ORM with a Postgres-compatible schema** (e.g., Drizzle or Prisma). | Zero-install local DB, easy reset for tests. | PostgreSQL local (production-parity; requires install/Docker — not verified available here). **Decision pending (OQ-03).** |
| Validation | Shared schema library (e.g., Zod) used by forms and API. | One source of truth for rules. | Hand-written validators. |
| Auth | Server-side sessions with secure cookies; separate customer and admin session scopes; argon2id/bcrypt. | Simple, no external provider needed. | Auth.js; third-party IdP (needs external accounts). |
| Payments | Provider-agnostic `PaymentGateway` interface + **local mock gateway**; COD/bank-transfer as offline methods. | Matches Figma's offline methods; no live provider assumed. | Stripe etc. later behind same interface. |
| Email | Local "outbox" (logged/stored) in dev. | No SMTP assumed. | Real SMTP later. |
| Images | Local file storage behind a storage interface. | Swap to cloud later. | — |
| Testing | Vitest (unit/integration), Playwright (E2E, a11y via axe, screenshots). | See `e2e-testing-strategy.md`. | Cypress. |
| Package manager | npm (already installed, v11.16.0). | No extra install. | pnpm (not installed). |

**Technology decisions pending approval:** framework, styling approach, ORM, database engine for local dev, auth approach (OQ-03). None are approved yet.

### 11.2 API boundaries (P)
Route handlers grouped by domain: `catalog`, `cart`, `checkout/orders`, `auth/account`, `content`, `admin/*`. All endpoints: validate input → authorize → call domain service → return typed JSON with consistent error shape `{code, message, fields?}`.

### 11.3 Business logic, persistence, consistency
- Domain services own rules (pricing, stock, order state machine, coupon validation). UI/route code does not duplicate rules.
- Money in integer minor units; currency from settings.
- Order placement in a single DB transaction (re-validate → decrement stock → create order/items/payment).
- Idempotency key on order placement to prevent duplicates from double-clicks/retries.
- Migrations + deterministic seed data (taxonomy and ~40 products can be seeded from frames `3:42651` and `3:41609` after license/brand approval).

### 11.4 Logging, errors, security
Structured server logs (no PII/secrets), request IDs, user-safe error messages, rate limiting on auth/tracking/contact, security headers, file-upload checks. See SEC-001…007.

### 11.5 Local mock vs real
| Capability | Local phase implementation | Real? |
|---|---|---|
| Database | local file DB | real (local) |
| Auth | real implementation, local users | real (local) |
| Payment card | mock gateway | **mock** |
| COD / bank transfer | offline method records | real logic |
| Email | outbox | **mock** |
| Shipping rates | admin-configured table | real logic, no carrier API |
| Image storage | local disk | real (local) |
| Analytics / geolocation | none | not implemented |

Nothing above exists yet (V: repository is empty).

---

## 12. Non-functional requirements

### 12.1 Targets (all **P** — need stakeholder approval)

| Area | Target |
|---|---|
| Performance | LCP ≤ 2.5 s and CLS ≤ 0.1 on catalog/PDP on a mid-range laptop against local production build; API p95 < 300 ms on 1k-product seed. |
| Scalability | Designed for ≥10k products and ≥100k orders without schema change; pagination everywhere (no unbounded lists). |
| Accessibility | WCAG 2.2 AA; automated axe checks have zero critical/serious violations on MVP routes. |
| Security | SEC-001…007; no secrets in repo. |
| Reliability | Order placement transactional; no partial orders on failure. |
| Maintainability | Strict TypeScript, lint/format, domain-based folders, one shared token file. |
| Testability | Every module has stable `data-testid`s on key controls and seedable data. |
| Observability | Request-ID logs; admin audit log; error boundary reporting to local log. |
| Local DX | `npm install && npm run dev` + seed command bring the app up from a clean clone; documented in README (when created). |

### 12.2 Responsive requirements

**Figma-defined (V):** a single desktop width of **1920 px**. No tablet or mobile design exists.
**Proposed (P):** design-implementation reference 1920 px; engineering breakpoints (to confirm, OQ-07): ≥1440 (wide desktop), 1024–1439 (desktop), 768–1023 (tablet), 360–767 (mobile). Test viewports in the E2E strategy: 1920×1080, 1440×900, 1024×768, 768×1024, 390×844.

Proposed responsive behavior (all P):

| Pattern | Behavior |
|---|---|
| Header | Collapses to logo + search + cart + hamburger; mega menu becomes accordion drawer. |
| Product grid | 3–4 col → 2 col (tablet) → 2 col compact or 1 col (mobile). |
| Shop filters | Sidebar becomes the existing **Filter Drawer** pattern (`3:11424`). |
| PDP | Gallery above info; sticky add-to-cart bar on mobile; thumbnails horizontal scroll. |
| Cart table | Becomes stacked cards. |
| Checkout | Order summary moves above/below form; single column. |
| Carousels | Swipe + visible controls. |
| Tables (admin) | Horizontal scroll or card view; sidebar becomes drawer. |
| Hero/banners | Art-directed crops needed — **missing design**; may need client review. |

Desktop-only (no responsive design) screens: **all 60 frames**.

### 12.3 Visual fidelity
Goal: high, *measured* fidelity to the 1920 px designs through screenshot comparison per `e2e-testing-strategy.md`. 100% pixel-perfect rendering across all browsers/devices is **not** guaranteed or promised.

---

## 13. External integrations

| Integration | Evidence | Status | Needed before integrating |
|---|---|---|---|
| Payment provider | Figma shows card/PayPal-style icons and offline methods | **Not selected** | Provider, currencies, fees, refund policy, compliance, sandbox credentials |
| Shipping carrier / rates | Free-shipping bar only | **Not selected** | Zones, rates, carriers, tax rules |
| Email (transactional + newsletter) | Newsletter forms, forgot-password | **Not selected** | Provider, sender domain, templates |
| Analytics | None in design | Not planned | Tool, consent policy |
| Image/CDN storage | Many images | Local disk first | Hosting decision at deployment time |
| Social (share, Instagram, links) | Share modal, Instagram strip, footer icons | Not planned | Which networks; API vs static |
| Maps / geolocation | Store locator shows "0.4 mi" distances | Not planned | Provider or static list |
| Live chat | Contact page "Live chat" | Not planned | Vendor |

---

## 14. Risks, assumptions and open questions

### 14.1 Risks (ordered by impact)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **No admin designs** — dashboard UX will be invented | High | Approve admin UX direction (8.1) before Phase 8; build on a small design system |
| R2 | **No mobile/tablet designs** — responsive behavior is invented | High | Approve breakpoints and responsive rules; get a few key mobile mocks (Home, PDP, Checkout) |
| R3 | **Many alternate layouts** (10 listing, 11 PDP, 6 blog) could balloon scope | High | Pick one layout per route (OQ-06) |
| R4 | Business rules undefined (shipping, tax, variants, payments, returns) | High | Resolve OQ-04, OQ-05, OQ-11, OQ-12 early |
| R5 | Template data conflicts (shipping thresholds, store addresses, copyright "2026", multiple locations) | Medium | Treat design text as placeholder; get real content |
| R6 | Asset/brand rights (COSMIA brand, photography) | Medium | Confirm ownership/licence (OQ-01, OQ-02) |
| R7 | Visual fidelity drift in AI-generated code | Medium | Token-first approach + screenshot gates |
| R8 | Design-token extraction is partial (only Login sampled; no Figma variables seen) | Medium | Phase 2 token audit across frames |
| R9 | Missing states (loading, error, 404, confirmation, account) | Medium | Propose and approve a minimal state set |
| R10 | Colour-contrast / accessibility issues in the design (light grays on cream) | Medium | Audit; adjust with approval |
| R11 | Frames only inventoried, not all reviewed | Low-Medium | Visually review each frame at the start of its phase |

### 14.2 Assumptions
A1 Guest checkout allowed. A2 USD default currency (EN/USD selectors shown). A3 Single store, single language in MVP. A4 Stock is decremented at order placement. A5 Overlay frames (cart drawer, size guide, share, compare popup, quick view) are overlays on the product page/home. A6 Design copy is placeholder content.

### 14.3 Open questions

| ID | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| OQ-01 | Is "COSMIA" the real brand? Real name, logo, copy? | Branding, legal | Keep COSMIA as placeholder |
| OQ-02 | Who owns / licenses the photography and the template design? | Legal | Use as dev placeholders only |
| OQ-03 | Approve stack (framework, styling, ORM, DB for local)? Is Docker/PostgreSQL acceptable? | Foundation of everything | Section 11.1 |
| OQ-04 | Shipping rules, free-shipping threshold ($50 vs $100), countries, tax/VAT? | Checkout correctness | $100 threshold (announcement bar), flat rate table, no tax |
| OQ-05 | Which payment methods at launch (card provider? COD? bank transfer?) | Checkout scope | Mock card + COD + bank transfer |
| OQ-06 | Which single layout to ship for Shop, PDP gallery/zoom, Blog? Should others be admin-selectable? | Scope (3×) | Shop left sidebar grid; Details default; Blog grid |
| OQ-07 | Breakpoints and mobile designs? | Responsive build | Section 12.2 |
| OQ-08 | Priority of Compare, Quick view, Subscribe-and-save, Bundles? | MVP size | Later release |
| OQ-09 | Guest checkout allowed? Account required for tracking? | UX/data | Guest allowed |
| OQ-10 | Compare item limit? | CMP-001 | 4 |
| OQ-11 | Variant model: sizes only, or shade/color too? Many products show "Color" filter (7 swatches) | Data model | Size first, color later |
| OQ-12 | Backorders / pre-orders allowed? Reservation timing? | Inventory | No backorders |
| OQ-13 | How do bundles price/work? | HOM-007 | Defer |
| OQ-14 | Sort options (best seller, newest, price asc/desc, rating)? "Best seller" definition? | CAT-004 | Those five; best seller = units sold |
| OQ-15 | Category taxonomy: 5, 9 or 12 categories (frame `3:42651`)? | Seed data | Demo 3 (12) |
| OQ-16 | Review moderation required? Who can review? | PRD-006 | Moderated; verified buyers show badge |
| OQ-17 | "Related products" rule (same category? manual?) | PRD-007 | Same category |
| OQ-18 | Is subscription billing wanted? | Complexity | Defer |
| OQ-19 | Share targets? | PRD-015 | Copy link only |
| OQ-20 | Guest→account cart merge rule? | CRT-004 | Merge, sum quantities |
| OQ-21 | Order ID format? | TRK | `CSM-` + 8 alphanumerics |
| OQ-22 | Store-locator distance — real geolocation or static? | CNT-005 | Static list, no distance |
| OQ-23 | Newsletter 20% offer — auto-generated code? | NWS-001 | Manual code in admin |
| OQ-24 | Who designs the admin dashboard? | R1 | Claude proposes wireframes for approval |
| OQ-25 | Languages/currencies beyond EN/USD? | Header selectors | Visual only in MVP |
| OQ-26 | Returns/refund policy ("15 days") — need an RMA flow? | Orders | Record-only refunds |

---

## 15. Traceability

Model: **Figma frame → page/template → requirement → implementation module → E2E test.**
Implementation modules and E2E IDs are *planned names*; nothing is implemented yet. Test IDs are defined in `e2e-testing-strategy.md` §5 (format `E2E-<MODULE>-nn`).

| Figma frame(s) | Page / template | Requirements | Planned module | Planned E2E |
|---|---|---|---|---|
| `3:2290` | Home | HOM-001…007, STO-001/003 | `storefront/home` | E2E-HOM-01…03 |
| `3:1452`, `3:1749` | Menus | STO-002, CAT-009 | `storefront/header` | E2E-STO-02 |
| `3:4833`, `3:5980`, `3:11424`, `3:28043` | Shop listing | CAT-001…009 | `storefront/catalog` | E2E-CAT-01…06 |
| `3:16254` | Search | SRC-001/002 | `storefront/search` | E2E-SRC-01…03 |
| `3:12708`, `3:16432`, `3:34650`… | Product details | PRD-001…015 | `storefront/product` | E2E-PRD-01…07 |
| `3:15101`, `3:14744`, `3:20299`, `3:29452` | Cart | CRT-001…005 | `storefront/cart` | E2E-CRT-01…05 |
| `3:20784`, `3:21193`, `3:21520`, `3:21946`, `3:15903` | Wishlist / compare | WSH-*, CMP-001 | `storefront/lists` | E2E-WSH-01…02, E2E-CMP-01 |
| `3:22268` | Checkout | CHK-001…009 | `storefront/checkout` + `orders` | E2E-CHK-01…07 |
| `3:22750`, `3:23089`, `3:23424` | Auth | USR-001…005 | `auth` | E2E-USR-01…05 |
| `3:23740` | Track order | TRK-001/002, ORD-001 | `storefront/tracking` | E2E-TRK-01…03 |
| `3:24059`, `3:24455`, `3:25805`…`3:28603`, `3:27227`, `3:27601`, `3:28374` | Content | CNT-001…006, NWS-001 | `storefront/content` | E2E-CNT-01…05 |
| *(none — not designed)* | Admin | ADM-*, ACT-*, AIN-*, AOR-*, ACS-*, APM-*, ACN-*, AST-*, AUR-*, ARP-* | `admin/*` | E2E-ADM-*, E2E-ACT-*, … |
| `3:42651`, `3:41609`, `3:42576` | Reference sheets | CAT-009, seed data, assets | `db/seed`, `assets` | seed verification |

*This table must be kept current in `themeforest-plan.md` task contracts as implementation begins.*


---

## 16. Implementation status (updated 2026-10-19)

Status of requirement IDs after P2-P4. "Done" means implemented **and** covered by automated tests; see `e2e-testing-strategy.md` section 12 for test IDs. Everything not listed is not started.

| Requirement | Status | Notes / gaps |
|---|---|---|
| STO-001 header | Partial | Header, announcement bar, mega menu, dropdowns, search, live category links done. Wishlist/cart counts static (P5) |
| STO-002 menus | Done | Shop mega menu (3 columns, badges, 2 promos) + compact dropdowns, hover and keyboard; many layout-variant entries are placeholders pointing at working pages (D-034) |
| STO-003 footer | Partial | Layout done; newsletter validates client-side only (persistence P10) |
| STO-004 benefit strip | Done | Content still constant in code (admin in P9) |
| STO-005 hero + breadcrumb | Done | |
| HOM-001..007 | Done (HOM-001 single slide) | Admin-managed content arrives in P9; HOM-006 countdown covered; HOM-007 add-to-cart is P5 |
| CAT-001..005 | Done | URL-driven, tested |
| CAT-006 grid/list | Not built | OQ-06 |
| CAT-007 alternate layouts | Not built | OQ-06 |
| CAT-008 categories page | Done | |
| CAT-009 taxonomy | Done | Seed uses 14 categories under Skincare/Makeup/Haircare/Tools/Fragrance (D-020) |
| PRD-001, PRD-002 | Done | Gallery, variants, price/SKU/stock |
| PRD-003 | Partial | Quantity, Share done; Add to cart / Buy now / Wishlist / Compare are P5 |
| PRD-004 | Done | Trust badges constant in code |
| PRD-005 | Done | Structured content (serum seeded; others show ingredients) |
| PRD-006 reviews | Partial | Display + submit for moderation done; moderation UI (P9); verified-buyer badge (P6) |
| PRD-007 related | Done | Same category first |
| PRD-008 out of stock | Done | |
| PRD-009 | Partial | Colour chips shown on the Product color layout; no image/SKU switching (D-038) |
| PRD-013..015 | Not built | Quick view, size guide, share modal (COULD) |
| PRD-010 | Built, not purchasable | Subscribe cards shown; no recurring-order backend (D-038) |
| PRD-011 | Built (timer only) | Countdown from `products.sale_ends_at`; price does not revert yet (P9) (D-038) |
| PRD-012 | Done | All 10 layouts + zoom via `?layout=` or `products.pdp_layout` (D-038) |
| SRC-001 | Done | Overlay with live suggestions |
| SRC-002 | Done | Reuses the shop listing |
| SEC-003 input validation | Partial | Zod on query + review API; rest with later APIs |
| CRT-001..005 | Done (merge on login in P6) | Server cart, drawer, page, stock rules (D-036) |
| WSH-001..003 | Done (server sync in P6) | Guest localStorage, popup |
| CMP-001 | Done | Limit 4, popup, empty state |
| CHK-001..009, USR-001..005, TRK-001/002, ORD-001/002 | Done (P6, D-037) | Coupons (CHK-002) pending P9; staff order actions P8 |
| CNT-006 | Done (D-040) | Policy and privacy template + shipping/returns/terms pages |
| CNT-001 (blog), CNT-002..005, 404, NWS-001 | Done (D-041, D-042, D-043); admin management of these (P8/P9) not started | P10 |
| ADM-*, ACT-*, AIN-*, AOR-*, ACS-*, APM-*, ACN-*, AST-*, AUR-*, ARP-* | Not started | P7-P9 |
