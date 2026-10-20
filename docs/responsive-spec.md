# Responsive specification (TF3-T01)

| Item | Value |
|---|---|
| Status | **PROPOSED, awaiting the user's approval (gate G1).** No layout code is written until this is approved. |
| Written | 2026-10-20, against commit `8f82284` (branch `themeforest`) |
| Authority | Figma defines **only the 1920 px desktop** (PRD 12.2). Everything below is a proposed design, not Figma-defined. At 1920 nothing changes except the contrast colours in section 8. |
| Owner doc | `docs/themeforest-plan.md`, section "TF3 task contract" |

## 1. Where the site stands today (measured)

Tools: `tests/visual/overflow-audit.mjs`, `tests/visual/mobile-audit.mjs`, `tests/visual/contrast-audit.mjs`, run against a production build.

| Measure | Result |
|---|---|
| Stylesheets / lines / absolute pixel positions | 76 / 14,392 / 579 |
| `@media` rules | 34 at 1100 px, 10 at 700 px, 2 at 560, and single rules at 1400, 960, 900, 760, 720, 600. No shared breakpoint values. |
| Pages that scroll sideways (26 routes) | 390 px: 8 (Home +184, Shop list layout +307, Product +90, Blog post +154, About +167, Contact +167, Demos +11, UI kit +11). 768 and 1024 px: Home only (+164). 1440 and 1920: none. |
| Reaching the navigation at 390 px | **Not possible.** The only link in the header is the logo. There is no menu button; the Shop mega menu, dropdowns and Journal are unreachable. |
| Header at 390 px | The logo and the four icons collide on inner pages; on Home the search box pushes the icons off screen. |
| Announcement bar at 390 px | The message wraps onto a second line that is clipped ("...OVER" then "$100" cut off). |
| Shop filters at 390 px | A tall, always-open panel above the products. |
| Product page at 390 px | Title, description and the Buy now button run past the right edge. |
| Touch targets at 390 px | Controls under 44 x 44 px: Home 105 of 156, Shop 125 of 154, Product 123 of 179; about 32 of 38 on Cart, Wishlist, Compare, About (mostly header and footer links). |
| Text under 14 px at 390 px | Home 26 text runs, Shop 18, Product 22, Checkout and Login 5, other pages 2. |
| Colour contrast (axe, 1440 px) | 467 failing text nodes in only **6 colour pairs** (section 8). |

Already acceptable (no sideways scroll at any width; look at 390 to be reviewed in T09/T10): Cart, Checkout, Wishlist, Compare, Categories, Search, FAQs, Store locator, Policies, Login, Register, Track order, 404.

## 2. Principles

1. **Desktop is untouched.** Every change sits inside a `max-width` query; at 1440 and above the existing CSS applies exactly as built.
2. **Same look, rearranged.** Fonts (Prata, Instrument Sans, Allura), colours, borders (dashed rules), buttons and the uppercase button style stay. Layouts stack, collapse or slide; nothing is redrawn.
3. **No page scrolls sideways** at 1440, 1024, 768, 390 and 320. Only designated scrollers may (carousels, the compare table, tab strips) and they show where they continue.
4. **Content order on a phone follows reading order:** heading, picture, price and buy, details, related.
5. **Touch first below 1024.** Nothing depends on hover. Every control is at least 44 x 44 px (inline text links in paragraphs are exempt). Spacing between adjacent controls is at least 8 px.
6. **Readable text:** body text 14 px or larger below 768; 12 px only for badges, legal lines and uppercase micro-labels.
7. **Motion:** new drawers and sheets slide or fade in 200-250 ms and are instant under `prefers-reduced-motion`.
8. **No new photos.** Only existing images are rearranged; image sizing is TF4.

## 3. Breakpoints

Three queries, written as `max-width`, plus the design width. A unit test (C12) fails if any other width appears in an `@media` rule.

| Name | Range | Query | Test width | What it is |
|---|---|---|---|---|
| Desktop | 1440 and above | none (default CSS) | 1440, 1920 | The Figma design as built. Container 1320 px, centred. |
| Laptop | 1024 to 1439 | `@media (max-width: 1439px)` | 1024 (and 1280) | Same structure as desktop; the container becomes fluid with 32 px gutters; grids may lose a column; the full header stays. |
| Tablet | 768 to 1023 | `@media (max-width: 1023px)` | 768 | Mobile menu replaces the header menus; sidebars become drawers; two-column grids; single-column forms and summaries. |
| Phone | up to 767 | `@media (max-width: 767px)` | 390 (and 320 reflow check) | One column; 2-up product grids; sticky buy bar; popups become sheets. |

Mapping of the existing ad hoc rules (decided per component in T03, default shown): 1100 px rules (34) move to **1023**; 700, 720, 760, 600, 560 rules move to **767**; 900 and 960 move to **1023**; the 1400 rule moves to **1439**.

## 4. Global rules

| Topic | Rule |
|---|---|
| Container | Desktop 1320 px (as built). Laptop: fluid, 32 px gutters. Tablet: 24 px. Phone: 16 px. `--gutter` keeps its name and changes per breakpoint. |
| Type scale on phone | Page title (Prata) 3rem to 2.25rem; section headings 3.5rem/3rem to 2rem; hero headline 3.5rem to 2.5rem; body 15-16 px; captions never below 12 px. Line heights keep the design's ratios. |
| Spacing | Vertical section spacing shrinks to about 60% below 1024 and to about 45% below 768 (design values stay on desktop). |
| Touch size token | `--tap: 44px` in `tokens.css`; shared controls (icon buttons, steppers, chips, checkboxes, close buttons) use it below 1024. |
| Focus | The existing visible focus ring stays; drawers trap focus and return it to the opener. |
| Images | Pictures keep their aspect ratio; hero and card images use `object-fit: cover`; no fixed pixel heights on phone. |
| Overflow rule | `html` is never given `overflow-x: hidden` to hide a problem; the cause is fixed. Designated scrollers use `overflow-x: auto` with scroll snapping. |

## 5. Navigation and chrome

### 5.1 Announcement bar
Laptop and above: as built. Tablet and phone: single centred message, up to two lines, 12-13 px, the bar grows to fit (no clipping); previous/next arrows hide below 768; the Est line and language/currency items hide below 1024 (they are repeated in the menu drawer).

### 5.2 Header and mobile menu (the one functional gap)
- **Above 1023:** as built.
- **Below 1024 (tablet and phone):** the header row becomes `[menu button] [logo] [search] [account] [wishlist] [cart]`, with the logo centred on phones and the icons in a 44 px grid. On phones the search icon opens the existing search overlay full width; the wishlist and compare counters keep their badges.
- **Menu button** opens a **left drawer**, 88% of the screen width, at most 380 px, over a dark scrim. Contents, top to bottom: search field; **Shop** (accordion: the three mega-menu columns become three sub-accordions with their entries, badges HOT/NEW kept, plus the two promo cards at the bottom); Categories (accordion); Pages (accordion); Journal (accordion); account, wishlist, compare and track order links; the Est line, store locator and language/currency.
- Every entry the desktop menus have is in the drawer (tested against the same link list as the crawl).
- Behaviour: opens with the button, closes with Escape, the scrim, the close button, or following a link; focus moves into the drawer, is trapped, and returns to the button; body scroll is locked while open; the open/close is 220 ms (instant with reduced motion).
- **Home header** (dark and translucent over the hero) gets the same buttons; the search box becomes an icon below 768; the hero starts below the header as now.

### 5.3 Footer, benefit strip, newsletter
- Footer link columns: 4 across at laptop, 2 across at tablet, **accordions at phone** (heading is a 44 px button, one open at a time, first closed). Socials, copyright and logo stack centred; "Back to top" stays at the right.
- Benefit strip: 4 across, 2 x 2 at tablet, single column at phone with the icon beside the text.
- Newsletter blocks stack picture above form (hide the picture below 768 on the footer card).

## 6. Page templates

### 6.1 Home
| Section | Tablet (768-1023) | Phone (up to 767) |
|---|---|---|
| Hero | Image behind, text card full width under the headline; arrows below the card | Headline 2.5rem; card full width; buttons 44 px high; slide arrows stay at the bottom |
| Category cards | 2 across | 2 across with smaller captions; "More categories" under the heading |
| Marquee | as built | as built, slower, pause on touch |
| Product tracks (Trending, Fresh drops, Loved) | Scroll-snap carousel, 2.3 cards visible, arrows hidden | Scroll-snap carousel, 1.4 cards visible |
| Fresh drops / editorial / flash sale | Two columns become one; countdown digits stay on one row | One column; countdown digits scale down (4 boxes fit 390) |
| Testimonials, journal cards | 2 across | 1 across, horizontal scroll for testimonials |
| Bundle builder | Tabs scroll horizontally; items 3 across | Tabs scroll; items stack |
| Instagram strip | 3 x 2 | 3 x 2 smaller tiles |

The cause of Home's sideways scroll (+164 at 768 and 1024) is found and fixed in T06.

### 6.2 Shop, categories, search
- **Filters:** below 1024 every layout (left, right, top, horizontal, list variants) uses the **filter drawer** (Figma frame `3:11424` is the model, slide-in from the left on phone and tablet). A toolbar above the products shows `[Filter (n)] [Sort] [grid/list]`; applying filters closes the drawer; "n results" and the active-filter chips stay on the page.
- **Grid columns:** Laptop 3; Tablet 3 (4 when the layout is the 4-up top-filter); Phone **2**, with compact cards (name, price, rating; the hover action stack becomes a single 44 px round "add to cart" button that is always visible).
- **List layouts:** below 768 each row becomes a card with the picture on the left (40%) and text on the right; the description is hidden; the buttons wrap under the price.
- Pagination and "Load more" are 44 px high; the page-number strip scrolls if it does not fit.
- Categories page: cards 2 across at tablet, 1 across at phone. Search results use the Shop rules.

### 6.3 Product page (all 10 layouts)
- Gallery above the details at tablet and phone for every layout. Thumbnail layouts: thumbnails become a swipeable strip below the picture; the two gallery layouts (1 and 2 column) become a single swipeable pager.
- **Zoom layouts:** inner zoom and external zoom are hover features; below 1024 the picture opens a full-screen viewer on tap (pinch to zoom), no side pane.
- Details: title, badge, rating, price, size chips (wrap), colour chips, quantity (44 px stepper), then **Add to cart** and **Buy now** full width, one under the other (phone). Compare and wishlist become icon+label links in a row.
- **Sticky add-to-cart bar:** shown on phone for every layout once the buy buttons scroll out of view (today it is opt-in with `?sticky=1`); picture, name, price, one button; it never covers the footer.
- Tabs and content sections (description, ingredients, how to use) become accordions on phone. Reviews: rating summary above the list, the form full width. Related products: scroll-snap carousel. Countdown (sale layout): digits scale to fit. Subscribe-and-save: the two choices stack.

### 6.4 Cart, checkout, account
- **Cart page:** one column below 1024: lines (cards, not a table, on phone), then the totals box; the free-shipping bar stays above the lines; the quantity stepper is 44 px; "Remove" is a labelled button.
- **Cart drawer:** full screen width on phone (still a right-side drawer on tablet, 420 px), buttons at the bottom, safe-area padding.
- **Checkout:** single column below 1024: billing form, then payment methods, then the summary. On phone the summary is a **collapsible bar at the top** ("Order summary - $56.00", tap to expand the lines) and the total is repeated next to the Place order button, which is full width and sticky at the bottom of the form.
- Account pages: the account menu becomes a horizontal scroller of 44 px tabs above the content; order lists become cards; the address grid is one column; forms are one column.
- Login, register, forgot, reset, track order: the card is full width with 16 px margins; the tabs stay.
- Order confirmation: facts stack, buttons full width.

### 6.5 Wishlist, compare
- Wishlist table becomes cards on phone (picture left, name/price/stock, buttons under).
- **Compare:** keeps its table; below 1024 it scrolls horizontally inside its own container with the first column (labels) sticky and a visible fade on the right edge; the add-product tile is the last column.

### 6.6 Content pages
- **Blog index:** all five layouts become one column below 768 (grid becomes 2 columns at tablet); the sidebar layouts put the sidebar **after** the posts; the sidebar's tag cloud and categories stay.
- **Blog post:** the 4-column neighbour strip becomes stacked cards; comment form full width; share icons 44 px; reading column keeps a 65-character measure.
- **About:** hero image under the text; the three stats stay on one row (smaller) at tablet and stack at phone; reason cards 1 across.
- **Contact:** four contact cards 2 x 2 at tablet, one column at phone; map above the form; the heading wraps (the sideways scroll is fixed).
- **FAQs:** the topic list becomes a horizontal scroller above the questions.
- **Store locator:** list above the map; map height 280 px on phone.
- **Policies:** the contents list becomes a collapsible "On this page" box at the top.
- 404, error and loading screens: the big "404" scales with the viewport (clamp), buttons full width on phone.
- Demos hub: 4 across, 2 at tablet, 1 at phone. UI kit: swatches and cards reflow the same way; the sideways scroll is fixed.

### 6.7 Popups (all use the shared `Modal`)
| Popup | Phone behaviour |
|---|---|
| Quick view | Full-screen sheet; picture above details; close button 44 px, top right |
| Size guide | Bottom sheet, table scrolls horizontally inside |
| Share | Bottom sheet, platforms in a 2 x 2 grid |
| Wishlist popup | Bottom sheet, up to 80% of the height, rows scroll |
| Compare popup | Bottom sheet |
| Newsletter popup | Image hidden, form centred, 16 px margins; appears no sooner than the desktop delay and is dismissible with a 44 px button |
| Cart drawer | See 6.4 |
Sheets slide up in 220 ms (instant with reduced motion), have a visible drag handle, trap focus and return it, and close with Escape and the scrim.

## 7. Acceptance and tests (from the contract)

| Contract item | Test |
|---|---|
| C2 no sideways scroll (26 routes and 28 variants, 1440/1024/768/390/320) | R-01 |
| C3 menu drawer reaches every desktop menu entry | R-02, R-05 |
| C4 filter drawer on every shop layout | R-02 |
| C5, C6 product sticky bar, checkout summary and placing an order at 390 | R-02 |
| C8 popups fit 390 x 844 | R-02 |
| C9 axe incl. contrast at four widths, 20+ routes | R-04 |
| C10 44 px targets | R-03 |
| C11 keyboard and focus in overlays | R-05 |
| C12 only the three breakpoints | `tests/unit/breakpoints.test.ts` |
| C13 desktop unchanged | full 1920 suite + comparison with commit `8f64f4d` |

## 8. Colour contrast: proposed changes (replaces decision D-033)

Measured at 1440 px on 29 routes. Each row is a text colour on a background; "proposed" is the nearest colour with the same hue and saturation that reaches WCAG AA (4.5:1 for these text sizes). **These change some Figma colours at every width, including 1920. They need your approval.**

| # | Where it is used | Now | Ratio | Proposed | Ratio | Text nodes | Visual impact |
|---|---|---|---|---|---|---|---|
| 1 | Muted text (`--color-dark-03`) on card beige: product labels, dropdown labels, captions | `#736f6d` | 4.11 | `#6c6967` | 4.51 | 420 | Barely visible (about 1.5% darker). One token. |
| 2 | Struck-through old price on card beige | `#b1aca7` | 1.86 | `#6f6862` | 4.53 | 36 | **Noticeable:** old prices become as dark as other muted text; the line-through and the larger new price keep the hierarchy. |
| 3 | Struck-through old price on the page colour (light card) | `#b6b2af` | 1.93 | `#756f6b` | 4.55 | 7 | Same as 2. |
| 4 | Home hero label "MODERN COSMETICS - STUDIO EDITION" (burgundy on the dark hero) | `#8e2018` | 1.88 | `#e1584f` | 4.54 | 2 | **Noticeable:** from dark burgundy to a coral red on the dark photo. |
| 5 | Compare icon label on the page colour | `#a8a5a1` | 2.25 | `#73706b` | 4.53 | 1 | Darker grey. |
| 6 | Sale countdown seconds (primary red on beige, 20 px) | `#c7332b` | 4.41 | `#c3322a` | 4.56 | 1 | Not visible. Applied to that element only, not to the global red. |

Other widths can add findings once the phone and tablet layouts exist; T11 re-runs the audit at all four widths and any new pair is reported before it is changed.

## 9. Decisions needed at gate G1

1. **Approve this spec** (or list what to change).
2. **Contrast:** approve the table in section 8 as proposed? The two noticeable ones are #2/#3 (old prices darker) and #4 (hero label colour). Alternatives: keep #2/#3 as they are and mark old prices `aria-hidden` (screen readers would not hear the original price), or make the hero label white.
3. **Mobile menu style:** left drawer with accordions (proposed) or a full-screen menu.
4. **Product grid on phone:** 2 columns (proposed) or 1.
5. **Sticky add-to-cart bar on phone for every product layout** (proposed) or keep it opt-in.
6. **Announcement bar:** wrap to up to two lines (proposed) or one truncated line.
7. **Figma:** any screens you want to draw yourself (most likely the Home hero and the header menu)? Default: none; you review screenshots at gates G2 and G3.

How to reproduce the baseline: build and start the app (`npm run build && npm start -- -p 3300`), then `node tests/visual/overflow-audit.mjs http://localhost:3300`, `node tests/visual/mobile-audit.mjs http://localhost:3300 390`, `node tests/visual/contrast-audit.mjs http://localhost:3300 1440`, and `node tests/visual/capture.mjs <url> <out.png> 390 844 viewport` for screenshots.
