# Animation Implementation Plan — Cosmia ThemeForest template

> Save as `docs/animation-plan.md` in `tf-beauty-ecommerce`. Written 2026-10-20 against branch `themeforest` (commit `bd0697a`).
> This replaces "STEP 0" of the draft prompt: the inspection is already done (section 1). Claude Code only needs to confirm items marked **verify**.
> It extends `docs/themeforest-plan.md` as track **AN** (phases AN1–AN10). Project rules in `CLAUDE.md` still apply: one phase at a time, log decisions, tests must pass before a phase is "done", never report an unrun test as passed, no push without asking.
> **Token tip:** start every phase in a fresh Claude Code session (`/clear`). This file carries the context.

---

## 0. Validation of the draft prompt

The draft is strong: the principles, token set, reveal system, speed hierarchy, performance rules and accessibility rules are all kept. Checked against the real code, **25 points need adjusting**. Verdicts: **Keep**, **Adjust**, **Blocked** (cannot be done as written), **Drop**.

### 0.1 Where the draft does not match the project

| # | Draft says | Reality in the project | Verdict | Resolution |
|---|---|---|---|---|
| 1 | Motion (framer-motion) for components, GSAP if needed | Next.js 16 App Router, React 19, CSS Modules, **no** animation library, 54 client components, most pages server-rendered. Everything in the draft is doable with CSS transitions, one IntersectionObserver and small hooks | **Adjust** | **Zero animation libraries in the core.** Lenis only as an optional, dynamically imported module (AN9). Why: bundle weight (Lighthouse target ≥90), fewer licences to credit, nothing to break on a Next upgrade, and CSS3/JS visible in the code is a stated project requirement. If the custom FLIP util (M19) proves fragile, reconsider (decision AN-D1) |
| 2 | Tokens named `--dur-*`, `--ease-luxe` | `tokens.css` already has `--ease` and `--duration-fast: 150ms`, used in ~60 places | **Adjust** | Use `--duration-*`. Keep the name `--ease` as an alias of `--ease-luxe` so existing components pick up the new feel with no edits |
| 3 | Header: transparent→solid, hides on scroll down | The Figma header is **not sticky** (`position: relative/absolute`). `HomeHeader` is a separate component overlaying the hero. Sticky/hiding headers are new behaviour, not motion, and hiding the header hides the cart link | **Adjust** | Config `header: "static" \| "sticky" \| "smart"`, default **`static`** (matches Figma). Implement once in a shared hook used by both `Header` and `HomeHeader` |
| 4 | Hero bottle enters, floats, light sweep, leaf parallax, 3D tilt | `HeroSlider.tsx` is **one flattened background image** + text + card + badge. There are no separate bottle or leaf layers | **Blocked** | Do now: bg scale, headline mask reveal, card/badge/CTA entrance, slide-change transition, scroll drift, bg parallax. Bottle/leaf effects only if layered PNG cutouts exist after the TF5 image replacement (optional task AN4-T08) |
| 5 | Hero has no slide transition | `HeroSlider` switches slide instantly via `useState` | **Adjust** | Add a slide-change spec (AN4-T04): cross-fade bg, re-run headline reveal, index dot slide |
| 6 | Trending carousel: scroll-snap + drag, autoplay, progress line, pause button | `ProductTrack.tsx` is native scroll + prev/next arrows only. No drag, no autoplay, no IntersectionObserver | **Adjust** | These are new behaviours, not motion. Build them in AN6. Autoplay default **off** (config `carouselAutoplay`): WCAG 2.2.2, the loop budget, and luxury calm |
| 7 | Marquee only if enabled, mostly for Instagram | A 40 s infinite marquee **already exists** in the Home strip (HOM-003, in the Figma). No pause control | **Adjust** | Keep it; add pause on hover/focus, a visible pause button, pause when off-screen/tab hidden, static in reduced motion |
| 8 | "Animate only transform/opacity, never width/height" | Yet the draft also wants accordion height, line collapse, progress fills. The code has `transition: width 300ms` and `transition: left 300ms` today | **Adjust** | Use the technique table in 2.6 (grid-rows for collapse, `scaleX` for progress, `translateX` for indicators). Migrate the two existing offenders |
| 9 | Product card: action bar slides up 8px, zoom 1.06 | Figma card: actions stack slides in from the **right** (`translateX(8px)`), image zoom 1.03, badge changes on hover | **Adjust** | Enhance, don't re-layout. Keep the right-side geometry; add lift, shadow, token zoom. Second-image crossfade only where a product has more than one image (today only the serum does) |
| 10 | Reduced motion: disable transforms, parallax, tilt, loops… | `globals.css` has a blunt `*{animation-duration:.01ms !important}`. It does not touch JS motion (parallax, tilt, magnetic, rAF counters, autoplay) | **Adjust** | Token-driven reduced motion (section 2.2) plus a JS gate (`lib/motion.ts`). Remove the blunt rule once tokens are in |
| 11 | Reveals hidden "only after JS loads" | Needs a pre-paint script. Setting the class in `useEffect` would flash content, then hide it | **Adjust** | Tiny inline script in `<head>` sets `html.motion-ready` before first paint (2.4) |
| 12 | Reveal at ~15% visibility | A 15% threshold may never fire for tall blocks | **Adjust** | Use `rootMargin: "0px 0px -10% 0px"` and `threshold: 0.01`, once |
| 13 | Spinner→check ~1.2s on add to cart | After TF1 the cart is a local store; adding is instant. A fixed 1.2s delay is theatre | **Adjust** | Spinner only if the action takes >150 ms; success state 900 ms; cart count bump; drawer opens |
| 14 | Skeletons on cards, lazy images etc. | After TF1 all data is local JSON, there is nothing to wait for | **Adjust** | Skeletons only for `loading.tsx` routes and client-side filter transitions. Lazy-image fade stays |
| 15 | Page transitions via View Transitions API | Support in Next 16.4.2 App Router is unverified | **Adjust** | AN9 starts with a spike. If it isn't stable, ship nothing (config stays `false`) |
| 16 | Checkout "step indicator progress" | The Figma checkout is a single page with no step indicator | **Drop** | Adding one is a layout change. Keep validation slide-down and place-order button state |
| 17 | Account "tab switch cross-fade" | Login and Register are separate routes. Only `AccountNav` has tabs | **Adjust** | Apply to `AccountNav` pages only |
| 18 | Blog reading-progress bar | Adds a UI element not in the Figma | **Adjust** | Keep, but as config `readingProgress` (default on, 2 px line) |
| 19 | 404 "one tasteful ambient element" | `NotFoundPage` exists; no ambient element designed | **Adjust** | Reuse an existing illustration/icon with one slow loop (**verify** what it contains) |
| 20 | Toasts slide from bottom-right, 4 s, pause on hover | `Toaster.tsx` shows one notice (3.5 s / 6 s for errors), no hover pause | **Adjust** | Keep the single-notice model; set 4 s, add hover/focus pause, token-driven slide |
| 21 | Ambient budget ≤2 loops per viewport | The draft's own list already breaks it (bottle float + sweep + marquee + carousel autoplay + glow + lipstick float) | **Adjust** | Explicit budget table in 2.7. Hero light sweep becomes once-on-load + hover |
| 22 | Phases assume the app is finished | **TF1** (cart/checkout rewrite), **TF3** (responsive, mobile drawers) and **TF5** (image replacement) all change the same files | **Adjust** | Sequencing in 0.2 |
| 23 | Tests unaffected | 149 Playwright tests and visual baselines assume a static page | **Adjust** | Default Playwright to `reducedMotion: "reduce"`; add a separate `motion` project (AN1-T06) |
| 24 | Page-by-page names ("Find Your Glow", "Trust bar", "Hall of Fame") | Code names differ (`CategoryCards`, `BenefitStrip`/`FeatureStrip`, `MostLoved`…) | **Adjust** | Map in AN5. **Verify** each against the Figma frame `3:2290` |
| 25 | Hover states come from Figma | Figma shows default states only; hover/press/focus are not designed | **Keep** | This file is the source of truth for motion states; layout stays Figma-only |

### 0.2 Sequencing with the ThemeForest plan

| Phase | Needs first | Why |
|---|---|---|
| AN1, AN2 | TF1 done | Tokens, reveal, hovers touch shared components; do them after the data-layer swap to avoid merge pain. Can overlap TF2 |
| AN3 | TF1 + TF3 | Mini-cart/add-to-cart feedback depends on the new client cart store; mobile drawer depends on the responsive build |
| AN4, AN5 | TF3 | Hero and home sections change at tablet/mobile. TF5 images for cutouts (optional bottle) |
| AN6–AN8 | AN1–AN3 | Reuse the pattern catalog |
| AN9, AN10 | TF4 | Lighthouse/QA runs once, after animations, so fold AN10 into TF4's gate |

### 0.3 Defaults chosen for you (override any)

| ID | Decision | Default |
|---|---|---|
| AN-D1 | Animation library | None (Lenis optional) |
| AN-D2 | `header` | `static` |
| AN-D3 | `carouselAutoplay` | `false` |
| AN-D4 | `magnetic` | `true`, primary CTAs only, fine pointer, max 6 px |
| AN-D5 | `tilt` | `false` (config option, max 4°) |
| AN-D6 | `parallax` | `true`, ≤40 px, hero bg + Fresh Drops image only |
| AN-D7 | `smoothScroll`, `customCursor`, `preloader` | `false` each |
| AN-D8 | `pageTransitions` | `false` until the AN9 spike passes |
| AN-D9 | `flyToCart` | `false` |
| AN-D10 | `mode` | `"full"` (`"subtle"` = fades only; `"off"` = nothing) |

---

## 1. Verified project facts (Step 0, done)

- **Stack:** Next.js 16.4.2 App Router, React 19.3, TypeScript, **CSS Modules** + `src/styles/tokens.css` + `src/app/globals.css`. No animation library. Node ≥22.
- **Existing motion:** `--ease`, `--duration-fast: 150ms`; keyframes `toast-in` (160 ms), `modal-in` (180 ms), `drawer-in` (220 ms), `marquee` (40 s linear infinite). `prefers-reduced-motion` handled in `globals.css` (blunt rule) and in 5 module files. One IntersectionObserver in the codebase: `StickyAddToCart.tsx`. Existing `transition: width 300ms` and `left 300ms` (to migrate).
- **Palette for glows/shadows:** `--color-accent-1 #431310`, `--color-secondary #8e2018`, `--color-primary #c7332b`, `--color-bg-light-01 #eee9e1`, `--color-light-01 #fdfbf8`.
- **Components that matter** (all under `src/components/`): `layout/` Header, MegaMenu, AnnouncementBar, BenefitStrip, Footer, NewsletterPopup, SearchOverlay, CounterLink, NavLink · `home/` HeroSlider, HomeHeader, HomeSections (CategoryCards, Marquee, TrendingNow, FreshDrops, FeatureStrip, EditorialBanner, MostLoved, Journal, InstagramStrip, PersonalBand), FlashSale, BundleBuilder, Testimonials, HomeNewsletter, HomeFooter · `product/` ProductCard, CardActions, ProductTrack, ProductCarousel, ProductGallery, ProductInfo, ColorSwatches, Countdown, StickyAddToCart, QuickViewModal, SizeGuideModal, ShareModal, ReviewsSection, ReviewForm, PurchaseOptions · `cart/` CartDrawer, CartPage, FreeShippingBar, QuantityStepper · `shop/` CatalogView, FilterSidebar, ActiveFilters, Pagination, SortSelect, ViewToggle · `ui/` Button, Modal (focus trap, Escape, scroll lock exist), Icon, Price, Rating · `form/` Field, Checkbox · `feedback/` Toaster · `content/` Accordion, FaqPage, AboutPage, ContactPage, ContactForm, NotFoundPage, StoreLocator, PolicyToc · `account/`, `orders/`, `lists/` (WishlistModal, ComparePage…), `blog/`, `checkout/`, `tracking/`.
- **Verify before coding:** (a) which of `HomeSections.tsx` (557 lines) are client vs server components; (b) what `NotFoundPage` contains; (c) Figma frame `3:2290` section order vs the AN5 mapping; (d) `MegaMenu` is hover-opened by CSS or by state.

---

## 2. Architecture: reusable building blocks

**Rule: no page invents its own animation.** Every effect in sections 3+ is one of the patterns below, so the whole site shares one motion language.

### 2.1 Files to create

```
src/config/motion.ts            flags (2.3)
src/lib/motion.ts               prefersReducedMotion(), canHover(), motionOn()
src/styles/motion.css           reveal states, utility classes, shared keyframes; imported by globals.css
src/components/motion/
  MotionInit.tsx                pre-paint <script> (2.4)
  RevealObserver.tsx            ONE client island, mounted once in the root layout
  SplitText.tsx                 server component, word/line mask spans
  Collapse.tsx                  grid-rows height animation (M3)
  ProgressLine.tsx              scaleX progress (M4)
  RollingNumber.tsx, CountUp.tsx  (M5)
  FlipList.tsx                  FLIP re-layout (M19)
  Skeleton.tsx                  cream shimmer (M22)
  hooks/ usePresence, useInView, useAutoplay, useScrollDirection, useMagnetic, useTilt, useParallax, useAddFeedback
docs/animations.md              written in AN10, becomes a section of the TF6 buyer docs
```

### 2.2 Tokens (`tokens.css`, single source of truth)

```css
:root {
  --ease-luxe: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1); /* primary CTA only */
  --ease: var(--ease-luxe);            /* existing name kept */
  --duration-fast: 200ms;              /* was 150ms */
  --duration-base: 350ms;
  --duration-reveal: 700ms;
  --duration-hero: 1100ms;
  --stagger: 90ms;
  --reveal-distance: 28px;
  --hover-lift: -6px;
  --img-zoom: 1.06;
  --shadow-rest:  0 1px 2px rgb(67 19 16 / 0.04), 0 6px 16px rgb(67 19 16 / 0.05);   /* accent-1 tint */
  --shadow-hover: 0 2px 4px rgb(67 19 16 / 0.05), 0 14px 32px rgb(67 19 16 / 0.10), 0 28px 56px rgb(67 19 16 / 0.06);
}
/* Reduced motion = same tokens, near zero. No per-component rules needed. */
@media (prefers-reduced-motion: reduce) { :root { /* durations ≤160ms, --stagger:0ms, --reveal-distance:0px, --hover-lift:0px, --img-zoom:1 */ } }
:root[data-motion="off"], :root[data-motion="subtle"] { /* same overrides; "subtle" keeps fades only */ }
```
Shadow changes use a pseudo-element's opacity, never a `box-shadow` transition.

### 2.3 Config (`src/config/motion.ts`)

```ts
export const motionConfig = {
  mode: "full",            // "full" | "subtle" | "off"
  header: "static",        // "static" | "sticky" | "smart"
  parallax: true, magnetic: true, tilt: false,
  carouselAutoplay: false, marquee: true, readingProgress: true, flyToCart: false,
  smoothScroll: false, customCursor: false, preloader: false, pageTransitions: false,
} as const;
```
The root layout writes these as `data-*` attributes on `<html>` (e.g. `data-motion="full" data-header="static"`). CSS reads the attributes; JS modules (cursor, smooth scroll, preloader, pointer effects) are loaded with `import()` **only when their flag is on**. Buyers edit one file.

### 2.4 Reveal system (pattern M1)

- **Markup:** `data-reveal="fade-up | fade | scale | clip-left | clip-right | clip-up"`; on a parent, `data-reveal-stagger` gives children `--i` (0…7, capped, delay = `--i * var(--stagger)`).
- **Default (`fade-up`):** opacity 0→1, `translateY(var(--reveal-distance))`→0, scale .98→1, `var(--duration-reveal) var(--ease)`. Runs **once** (set `data-revealed`, unobserve). `clip-*` uses `clip-path: inset()` (hero/model/Fresh Drops only).
- **No-JS safe:** hidden state exists only under `html.motion-ready`. The inline script in `<head>` adds that class **before first paint** (never in `useEffect`):
  `<script>document.documentElement.classList.add('motion-ready')</script>`, skipped when `data-motion="off"`. The root `<html>` gets `suppressHydrationWarning`.
- **Zero layout shift:** transform/opacity/clip-path only; space is always reserved.
- **`will-change`:** set on the hidden state, removed on `transitionend`.
- **Observer:** one `IntersectionObserver` (`rootMargin: "0px 0px -10% 0px"`, `threshold: 0.01`). `RevealObserver` rescans on route change (`usePathname`) and watches `main` with a `MutationObserver` for client-rendered nodes.

### 2.5 Pattern catalog

| ID | Pattern | Spec | Implementation | Used by |
|---|---|---|---|---|
| M1 | Reveal | 2.4 | `data-reveal` + `RevealObserver` | every section on every page |
| M2 | Mask text reveal | words/lines slide up from `overflow:hidden` lines, 70 ms stagger; full text in `aria-label`, spans `aria-hidden` | `SplitText` (server) + M1 | Hero title; optional section titles |
| M3 | Collapse | height via `grid-template-rows: 0fr→1fr` + inner `overflow:hidden`, `--duration-base` | `Collapse` | Accordion, FAQ, PDP content blocks, filter groups, cart/bundle/wishlist line removal, mobile menu sub-lists |
| M4 | Progress line | `transform: scaleX()`, origin left | `ProgressLine` | carousel autoplay line, `FreeShippingBar`, flash-sale urgency, reading progress, review distribution bars |
| M5 | Rolling number | digit column `translateY`, `tabular-nums`, fixed width. `CountUp`: rAF 600 ms on first reveal | `RollingNumber`, `CountUp` | `Countdown`/`FlashSale`, bundle total + "You save", cart totals, quantity stepper, PDP price |
| M6 | Primary button | hover scale 1.03, brightness 1.05, shadow pseudo fades in; press .98; `--ease-overshoot` here only; `data-magnetic` (≤6 px) | `.m-btn` in `motion.css` | `ui/Button` primary, hero CTA, "Explore Collection", bundle CTA, add to cart, checkout place order (no magnetic) |
| M7 | Secondary button | fill sweeps from centre via pseudo `scaleX`, text colour swap | `.m-btn-2` | `ui/Button` secondary, outline buttons |
| M8 | Link underline | `::after` `scaleX(0→1)` from centre; no letter-spacing change | `.m-link` | `NavLink`, MegaMenu, footer, titles on card/journal/blog |
| M9 | Card hover | lift `--hover-lift`, shadow pseudo opacity, image zoom `--img-zoom` inside `overflow:hidden`, actions reveal (also on `:focus-within`) | `.m-card`, `.m-zoom` | `ProductCard` everywhere, `BlogCard`, category tiles, journal, UGC, Instagram |
| M10 | Icon ring | circular glow ring (palette colours) + scale 1.08 | `.m-ring` | header icons, benefit icons, social icons, card action icons |
| M11 | One-time shine | gradient sweep once when first revealed | `.m-shine` | badges (NEW/HOT/SALE/award), free-shipping badge |
| M12 | Field focus | border → `--color-secondary` + soft ring; floating label only if the design has one | `.m-field` | `form/Field`, search input, newsletter, review form, coupon |
| M13 | Pop | scale 1→1.18→1 over 280 ms | `.m-pop` | wishlist heart, cart count bump, quantity change, success check |
| M14 | Overlay | backdrop fade; modal scale .96→1; drawer slide-x; dropdown fade + 8 px; toast slide; **exit animations** through `usePresence` (data-state `open/closing`, unmount on `animationend`) | shared keyframes in `motion.css` replacing `modal-in`, `drawer-in`, `toast-in` | `Modal` and all modals, `CartDrawer`, mobile drawer, `SearchOverlay`, `MegaMenu`, dropdowns, `Toaster`, `NewsletterPopup` |
| M15 | Shared observer | one IntersectionObserver | `useInView` | reveal, loops, autoplay, counters, sticky bars |
| M16 | Loop gate | `[data-loop]` animations get `animation-play-state: paused` when off-screen or tab hidden | one observer + `visibilitychange` | marquee, any float, glow, autoplay |
| M17 | Pointer effects | magnetic, tilt, parallax; rAF; fine pointer + not reduced + flag on; lazy-imported | `useMagnetic`, `useTilt`, `useParallax` | CTAs, hero bg, Fresh Drops image, UGC cards (tilt opt-in) |
| M18 | Autoplay | interval only while in view and not hovered/focused; pause button; progress line | `useAutoplay` + M4 | `ProductTrack` (Trending), `Testimonials` |
| M19 | FLIP list | measure → apply → animate transform | `FlipList` | shop grid on filter/sort, cart/wishlist/compare/bundle removals |
| M20 | Scroll state | `useScrollDirection`, scrolled flag, via IO sentinel (no scroll listener) | hook | `Header` + `HomeHeader` (one hook), back-to-top, reading progress |
| M21 | Lazy image | opacity + scale .98→1 on `onLoad`, `aspect-ratio` reserved | `img.m-fade` + handler | all `next/image` |
| M22 | Skeleton | cream→beige→cream shimmer using `--color-light-01`/`--color-bg-light-01`, same dimensions as final | `Skeleton` | `loading.tsx` routes, client filtering |
| M23 | Add feedback | button idle→(spinner if >150 ms)→check (900 ms)→idle, cart count M13, drawer or toast, optional fly-to-cart | `useAddFeedback` | `CardActions`, `ProductInfo`, `QuickViewModal`, `StickyAddToCart`, `BundleBuilder`, `WishlistModal` |

### 2.6 Techniques (so the "transform/opacity only" rule holds)

| Need | Use |
|---|---|
| Height open/close, line removal | M3 `grid-template-rows` (cheap, no JS height measure) |
| Progress/fill | M4 `scaleX` (replace the existing `width` transition) |
| Sliding indicator (thumbnails, tabs, nav underline) | `translateX` + `scaleX` (replace the existing `left` transition) |
| Shadow change | pseudo-element opacity |
| Grid re-layout | M19 FLIP |
| Images | `clip-path` allowed for hero/model reveals only |

### 2.7 Ambient loop budget (≤2 per viewport)

| Loop | Where | Rule |
|---|---|---|
| Marquee (40 s) | Home strip | M16 gated, pause button, hover/focus pause |
| Lipstick card float | "Right colour" section | M16 gated |
| Carousel autoplay | Trending, Testimonials | default off; when on, counts as a loop |
| Flash-sale glow | Flash sale | **static** glow, not a loop |
| Hero | — | **no loops** (light sweep = once on load + on hover) |
| 404 ambient | 404 | one slow loop, no other loop on that page |

Nothing pulses faster than once per 2 s. No flashing.

### 2.8 Reduced motion, JS off, test mode

- **Reduced motion:** tokens collapse durations/distances (2.2). JS effects check `prefersReducedMotion()` and do nothing; marquee shows static; count-ups show final values; no autoplay, parallax, tilt, magnetic, smooth scroll.
- **JS off:** no `motion-ready` class, so everything is visible.
- **Tests:** `playwright.config.ts` gets `use: { reducedMotion: "reduce" }` for the existing suite and visual baselines. A second project, `motion`, uses `no-preference` and runs only `tests/e2e/motion/*.spec.ts`.

---

## 3. Phases

Each phase: do the tasks, run `typecheck`, `lint`, `format:check`, Vitest, Playwright (both projects), update `docs/decision-log.md` and `docs/context.md`, commit locally, then **stop**, summarise, and say how to test by hand.

### AN1 — Foundation
Prerequisite: TF1 passed.

| Task | Content | Files |
|---|---|---|
| AN1-T01 | Add the tokens (2.2); keep `--ease` as alias; remove the blunt reduced-motion rule from `globals.css` | `tokens.css`, `globals.css` |
| AN1-T02 | `motionConfig` + `data-*` on `<html>` + `MotionInit` pre-paint script + `suppressHydrationWarning` | `config/motion.ts`, root `layout.tsx`, `MotionInit.tsx` |
| AN1-T03 | `motion.css` with reveal states and the shared keyframes (empty utility classes are added in AN2+) | `styles/motion.css`, `globals.css` |
| AN1-T04 | `RevealObserver` (2.4) mounted once | `components/motion/` |
| AN1-T05 | `lib/motion.ts` helpers | `lib/motion.ts` |
| AN1-T06 | Playwright: default `reducedMotion: "reduce"`; new `motion` project | `playwright.config.ts`, `tests/e2e/motion/` |
| AN1-T07 | Log AN-D1…D10 | decision log |
| Done when | No visual diff in baselines · CLS < 0.05 · `javaScriptEnabled:false` page shows all content · `data-reveal` demo block in `/dev/components` (or the UI Kit page) reveals once, never replays |

### AN2 — Hover system, buttons, product card
Prerequisite: AN1.

| Task | Content |
|---|---|
| AN2-T01 | Add M6–M13 to `motion.css`, all hover rules inside `@media (hover:hover) and (pointer:fine)` |
| AN2-T02 | `ui/Button`: primary (M6), secondary (M7); magnetic via `data-magnetic` (lazy `useMagnetic`) |
| AN2-T03 | Links: `NavLink`, `MegaMenu`, `Footer`, `HomeFooter`, card/journal titles (M8) |
| AN2-T04 | `ProductCard` + `CardActions`: M9 on the Figma geometry (actions slide from the right), name/price/rating always visible, touch = actions visible and no lift, `:focus-within`; second-image crossfade only if present |
| AN2-T05 | Icons (M10): header counters, social, benefit icons |
| AN2-T06 | Badges (M11, once) |
| AN2-T07 | Inputs and checkboxes (M12): `Field`, `Checkbox`, `NewsletterForm`, `SearchOverlay` input |
| AN2-T08 | Pop (M13): wishlist heart, `QuantityStepper` |
| AN2-T09 | `:focus-visible` audit on every interactive element |
| Done when | Hover-only content is keyboard reachable · no hover effect on touch emulation · axe 0 critical/serious |

### AN3 — Overlays, header, cart feedback, toasts
Prerequisite: AN2, TF1 (cart store), TF3 (mobile drawer).

| Task | Content |
|---|---|
| AN3-T01 | `usePresence` + M14 keyframes replacing `modal-in`, `drawer-in`, `toast-in`, with exit animations |
| AN3-T02 | `Modal` (backdrop fade + scale .96→1, focus trap/Escape/scroll lock already exist, keep them) and every modal built on it |
| AN3-T03 | `CartDrawer`: slide + backdrop; empty state fade; line removal via M3/M19 |
| AN3-T04 | `MegaMenu` + dropdowns: fade + 8 px slide, ~100 ms hover intent, keyboard open/close unchanged |
| AN3-T05 | Mobile menu drawer (after TF3) |
| AN3-T06 | `SearchOverlay`: fade in, input autofocus |
| AN3-T07 | `Toaster`: slide in, 4 s, pause on hover/focus, errors 6 s as today |
| AN3-T08 | M23 `useAddFeedback` wired into `CardActions`, `ProductInfo`, `QuickViewModal`, `StickyAddToCart`, `BundleBuilder`, `WishlistModal`; cart count bump in `CounterLink` |
| AN3-T09 | M20 header hook used by both `Header` and `HomeHeader`; behaviour per `header` config (default `static` = no change); back-to-top fades in after one viewport |
| AN3-T10 | Optional `flyToCart` (default off) |
| Done when | Esc closes with exit animation · focus returns to opener · no scroll jump on close · existing modal tests still pass |

### AN4 — Home hero
Prerequisite: AN1–AN3, TF3.

| Task | Content |
|---|---|
| AN4-T01 | Background: fade + scale 1.05→1 over 1.6 s |
| AN4-T02 | Headline: `SplitText` mask reveal (M2), 70 ms stagger, `aria-label` on the `h1` |
| AN4-T03 | Eyebrow, card text, badge fade in +200 ms; badge shine once (M11); badge glows on hover only (no pulse); CTA last: scale .95→1 with `--ease-overshoot` |
| AN4-T04 | Slide change: cross-fade bg, re-run headline reveal, index dot slide (the draft omitted this). No autoplay |
| AN4-T05 | Scroll drift: content up ≤24 px and fades; bg parallax ≤24 px (M17, flag `parallax`) |
| AN4-T06 | Hero light sweep: once after load and on hover (not a loop) |
| AN4-T07 | Arrow buttons use M10/M6 |
| AN4-T08 | **Optional, only if layered cutouts exist after TF5:** bottle entrance (bottom-right 40 px), ±6 px float over 7 s (a loop, M16), mouse parallax ≤12 px, tilt ≤4° (flag) |
| Done when | LCP not worse than before the phase · no CLS · works with JS off · reduced motion shows the final state |

### AN5 — Remaining Home sections
Prerequisite: AN4. All use M1/M9/M8 unless noted. Verify names against the Figma (0.1 row 24).

| Section (component) | Motion |
|---|---|
| Find favourites (`CategoryCards`) | Stagger left→right (M1). Hover: image zoom, overlay 0→.25, number/title lift 4 px, underline grows from centre (M8). No float |
| Marquee (`Marquee`) | M16 gate, hover/focus pause, pause button, static when reduced. Reveal fade only |
| Trust strip (`BenefitStrip`) | Sequential fade, icons scale .9→1, hover ring (M10). Calm |
| Trending now (`TrendingNow`) | Header fade, cards stagger. Carousel behaviour in AN6 |
| Fresh drops (`FreshDrops`) | Large image `clip-left` reveal + parallax ≤40 px (flag); side list staggers up; hover light sweep on the large image; free-shipping badge static with shine on reveal |
| Four benefits (`FeatureStrip`) | Stagger fade + scale .9→1, hover ring |
| "Right colour" (`EditorialBanner`) | Model image `clip-right` 1.1 s; text slides from left; lipstick card rises with 300 ms delay then slow float (**this section's loop**, M16); hover lift + glow in the product's colour (needs a colour value in the data; **verify**, else use `--color-primary`); CTA magnetic |
| Hall of fame (`MostLoved`) | Global card (M9); award badges shine once; no floating |
| Flash sale (`FlashSale`) | Banner fade + scale .98→1; static soft red glow; urgency line (M4); CTA magnetic. Digits/ended state in AN6 |
| Made personal (`PersonalBand` stories) | Stagger; hover: zoom, overlay, quote opacity up, "Shop now" underline left→right, brand border glow, tilt ≤3° only if `tilt` on |
| Explore bundle (`PersonalBand` bundles, `BundleBuilder`) | Items fade in one by one, "+" scale in between, strongest CTA treatment on the page. Totals in AN6 |
| Journal (`Journal`) | Stagger; zoom, title underline, lift |
| Instagram (`InstagramStrip`) | Grid stagger; hover zoom + icon fade over a soft backdrop |
| Newsletter (`HomeNewsletter`) | Fade up, M12 focus, animated success check |
| Footer (`HomeFooter`) | Link colour change only; back-to-top (AN3-T09) |
| Done when | Whole Home scrolls with no console errors · loops ≤2 per viewport (check at 1920×1080 and 390×844) |

### AN6 — Carousels, countdown, bundle logic
Prerequisite: AN5. These are **new behaviours**, built carefully.

| Task | Content |
|---|---|
| AN6-T01 | `ProductTrack`: scroll-snap, pointer drag, arrows (visible on touch, fade in on hover on desktop), keyboard arrows |
| AN6-T02 | M18 autoplay (5.5 s, only while in view, pause on hover/focus, visible pause/play button, thin progress line M4). Default off via config |
| AN6-T03 | `Testimonials` slider: same hook |
| AN6-T04 | `Countdown`/`FlashSale`: M5 rolling digits, `tabular-nums`, fixed width, no jitter, hydration-safe (render after mount), graceful "sale ended" state at zero |
| AN6-T05 | `BundleBuilder`: totals tween (M5), "You save" tween, removed items collapse (M3/M19) |
| Done when | Autoplay never runs off-screen or in a hidden tab · pause button works by keyboard · Playwright fake timers cover the countdown |

### AN7 — Shop, product detail, cart, checkout
Prerequisite: AN6.

| Page / feature | Motion |
|---|---|
| Shop (`CatalogView`) | Filter drawer slide (M14); grid re-layout via M19 on filter/sort; `ActiveFilters` chips scale in/out; "Load more" staggers new items; `Pagination`/`ViewToggle`/`SortSelect` use M8/M12; skeleton for route `loading.tsx` |
| Product detail (`ProductGallery`) | Gallery cross-fade, sliding active-thumbnail indicator (`translateX`), hover zoom on desktop (keep existing inner/external zoom layouts, don't replace), native pinch on touch |
| PDP info (`ProductInfo`, `ColorSwatches`) | Swatch ring animates; price cross-fades on variant change (M5); stepper digit slide; `StickyAddToCart` slides up when the main button leaves view (already uses IO, add the transition) |
| PDP content | Accordions/tabs via M3 (`ProductContentSections`); `ReviewsSection` distribution bars M4; related products reuse `ProductTrack` + global card |
| Cart (`CartPage`) | Removed lines collapse (M3/M19), totals tween (M5), `FreeShippingBar` fills with M4, empty state fades in |
| Checkout (`CheckoutPage`) | **Minimal only**: validation messages slide down, place-order button state. No loops, cursor, tilt, magnetic. **No step indicator** (not in the design) |
| Done when | Checkout has zero ambient motion · filtering a grid causes no layout jump · all existing E2E (`catalog`, `product`, `cart`, `checkout`, `shop-layouts`, `product-layouts`) pass with reduced motion |

### AN8 — Remaining pages and modals
Prerequisite: AN7.

| Page | Motion |
|---|---|
| Wishlist, Compare (`lists/`) | Card pattern, removal via M19, empty state fade; `WishlistModal`, `CompareExistsModal` via M14 |
| Account, Orders, Login/Register, Track order | `AccountNav` tab cross-fade; toasts for actions; tracking result fades in |
| Blog | Editorial reveals (M1), cards M9; reading-progress bar on detail pages (flag, 2 px line) |
| About, Contact, FAQs, Policy, Store locator | Section reveals; `ContactForm` success state; FAQ via `Accordion` (M3); `PolicyToc` active indicator slides |
| 404 | One slow ambient loop (see 2.7), reveals |
| Modals | `QuickViewModal`, `SizeGuideModal`, `ShareModal`, `NewsletterPopup` all on M14 |
| Done when | Every route has reveals and no page contains a bespoke animation outside the catalog |

### AN9 — Skeletons, lazy images, transitions, optional modules
Prerequisite: AN8.

| Task | Content |
|---|---|
| AN9-T01 | M22 `Skeleton` on `loading.tsx` routes; matches final dimensions exactly |
| AN9-T02 | M21 lazy image fade on all `next/image` |
| AN9-T03 | **Spike:** page transitions with the View Transitions API in Next 16.4.2. If stable, 300 ms cross-fade behind `pageTransitions`; if not, leave off and record why |
| AN9-T04 | Optional `preloader` (brand mark + thin burgundy line, ≤800 ms, once per session, dynamic import) |
| AN9-T05 | Optional `customCursor` (fine pointer only, never over inputs/text, dynamic import) |
| AN9-T06 | Optional `smoothScroll` with Lenis (dynamic import; off on touch and reduced motion). Must not break anchors, sticky elements, modal scroll lock, scroll-snap carousels or browser find. Record name, version, licence for `CREDITS.md` |
| Done when | With every optional flag off, none of those modules appear in the bundle (check the build output) |

### AN10 — QA and documentation
Prerequisite: AN9. Merge with the TF4 gate.

| Task | Content |
|---|---|
| AN10-T01 | Playwright: Chromium, Firefox, WebKit × 360, 768, 1024, 1280, 1440, 1920; no horizontal scroll caused by any animation |
| AN10-T02 | Zero console errors/warnings; JS-off and reduced-motion walkthrough |
| AN10-T03 | Lighthouse: Performance ≥90 desktop, ≥80 mobile, CLS < 0.05; compare to the pre-AN numbers and fix regressions |
| AN10-T04 | Loop audit: ≤2 per viewport on every page (2.7) |
| AN10-T05 | Code hygiene: no leftover inline animation styles, no `will-change` left on idle elements, comments on non-obvious code |
| AN10-T06 | `docs/animations.md`: using `data-reveal`, editing tokens, toggling features in `motion.ts`, animating a new section, library list (none, or Lenis with version and licence) |
| Done when | All flags tested on and off · docs reviewed by a fresh session following only the file |

---

## 4. Test strategy

- **Existing 149 tests + visual baselines:** run with `reducedMotion: "reduce"`. Nothing should change visually.
- **`tests/e2e/motion/` (new):** reveal fires once and never replays · hidden state absent without JS · loop pauses off-screen and when the tab is hidden · autoplay pauses on hover/focus and has a working pause button · modal exit animation then focus returns · toast pauses on hover · countdown reaches the ended state · no horizontal scroll at each viewport.
- **Manual (per phase, in the summary):** keyboard-only pass, touch emulation, Windows "Reduce animations" setting on.
- **Rule from `CLAUDE.md`:** never report a test that wasn't run as passed.

---

## 5. Do not (carried over from the draft, plus findings)

- Hide price or product name behind hover.
- Use bounce/elastic easing anywhere except the primary CTA (`--ease-overshoot`).
- Run more than 2 ambient loops per viewport.
- Use off-palette colours for glows or shadows.
- Add scroll-jacking or pinned horizontal-scroll sections.
- Replay reveals when an element re-enters the view.
- Install any library without saying why first.
- **Change layout, spacing, colours, type or copy.** If a task seems to need it, stop and ask.
- Add UI that isn't in the Figma (step indicators, new bars) without it being a config flag.
- Edit the original project at `C:\Projects\beauty-ecommerce`.

---

## 6. Kickoff prompt for Claude Code

```
Read docs/animation-plan.md, then CLAUDE.md, docs/themeforest-plan.md and docs/decision-log.md.
Step 0 (inspection) is already done in section 1 of the plan; only confirm the items marked "verify".
We are adding the Cosmia motion system on top of the ThemeForest template. Do NOT change layout,
spacing, colours, type or copy. No animation library without asking me first.
Start AN1 only:
1. Log AN-D1..AN-D10 in docs/decision-log.md.
2. Show me the AN1 task contract (development-plan format) before coding.
3. After I approve, do AN1-T01..T07 one task at a time, running typecheck, lint, Vitest and Playwright
   after each, and commit locally after each passing task.
Stop at the AN1 exit gate, summarise what changed and tell me how to test it by hand.
```

---

## 7. Master checklist

**AN1 Foundation** — [ ] tokens + `--ease` alias · [ ] `motionConfig` + `<html data-*>` · [ ] pre-paint script · [ ] `RevealObserver` · [ ] Playwright reduced-motion default + `motion` project · [ ] decisions logged
**AN2 Hover** — [ ] M6–M13 classes · [ ] Button · [ ] links · [ ] ProductCard/CardActions · [ ] icons · [ ] badges · [ ] inputs · [ ] pops · [ ] focus-visible audit
**AN3 Overlays/header/cart** — [ ] `usePresence` + M14 · [ ] Modal + modals · [ ] CartDrawer · [ ] MegaMenu · [ ] mobile drawer · [ ] SearchOverlay · [ ] Toaster · [ ] add feedback · [ ] header hook · [ ] back-to-top
**AN4 Hero** — [ ] bg · [ ] headline · [ ] card/badge/CTA · [ ] slide change · [ ] drift/parallax · [ ] light sweep · [ ] (optional) bottle/leaves
**AN5 Home** — [ ] favourites · [ ] marquee · [ ] trust strip · [ ] trending · [ ] fresh drops · [ ] benefits · [ ] right colour · [ ] hall of fame · [ ] flash sale · [ ] made personal · [ ] bundle · [ ] journal · [ ] instagram · [ ] newsletter · [ ] footer
**AN6 Carousels/countdown/bundle** — [ ] track drag/arrows · [ ] autoplay · [ ] testimonials · [ ] countdown · [ ] bundle totals
**AN7 Shop/PDP/cart/checkout** — [ ] shop grid FLIP · [ ] filters/chips · [ ] gallery · [ ] swatches/price/stepper · [ ] sticky ATC · [ ] accordions · [ ] reviews bars · [ ] cart · [ ] checkout (minimal)
**AN8 Other pages/modals** — [ ] wishlist/compare · [ ] account/orders/auth · [ ] blog · [ ] about/contact/FAQ/policy/stores · [ ] 404 · [ ] all modals
**AN9 Extras** — [ ] skeletons · [ ] lazy images · [ ] transitions spike · [ ] preloader · [ ] cursor · [ ] Lenis
**AN10 QA/docs** — [ ] browsers × viewports · [ ] console clean · [ ] Lighthouse · [ ] loop audit · [ ] hygiene · [ ] `docs/animations.md`
