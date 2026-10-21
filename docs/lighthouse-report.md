# Lighthouse report (TF4-T07)

| Item | Value |
|---|---|
| Date | 2026-10-21 |
| Tool | Lighthouse 13.5.0 (`npx`), Google Chrome, production build (`npm run build && npm start`), `tests/perf/lighthouse.mjs` |
| Method | Each page and device measured **3 times**, median reported. Mobile = Lighthouse default (Moto G Power, simulated slow 4G, 4x CPU slowdown); desktop = `--preset=desktop`. Checkout is measured with one product in the cart (seeded browser profile). |
| Where | A local server over HTTP/1.1 with no CDN and no compression tuning: scores on a real host (HTTP/2, CDN) are usually a little better; they were not measured |
| Images | The full-size Figma photos are still in the build. They are replaced in TF5, so image weight and LCP will change; this report is the code-only baseline |

## Result

Targets (contract D3): Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95.

| Page | Device | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Page weight |
|---|---|---|---|---|---|---|---|---|---|
| Home | desktop | **98** | 97 | 96 | 100 | 0.99 s | 0 | 35 ms | 828 KB |
| Shop | desktop | **99** | 95 | 100 | 100 | 0.94 s | 0.001 | 19 ms | 539 KB |
| Product | desktop | **100** | 100 | 100 | 100 | 0.80 s | 0.002 | 0 ms | 579 KB |
| Checkout | desktop | **100** | 100 | 100 | 69 * | 0.80 s | 0.001 | 0 ms | 479 KB |
| Home | mobile | 72 | 100 | 96 | 100 | 4.4 s | 0 | 444 ms | 691 KB |
| Shop | mobile | 73 | 99 | 100 | 100 | 4.7 s | 0.001 | 323 ms | 421 KB |
| Product | mobile | 73 | 100 | 100 | 100 | 4.0 s | 0.001 | 520 ms | 405 KB |
| Checkout | mobile | **90** | 100 | 100 | 69 * | 3.5 s | 0.042 | 88 ms | 369 KB |

**Met:** all four categories on desktop (except the starred SEO); Accessibility, Best practices and SEO on mobile; Performance on Checkout mobile.
**Not met:** mobile Performance on Home, Shop and Product (72-73, target 90).

\* **Checkout SEO 69 is intended.** Lighthouse's only failing SEO audit there is "page is blocked from indexing": checkout is `noindex` on purpose (a personal page; contract D7, E2E-SEO-08). Every other SEO audit passes.

## What was fixed in T07

| Finding | Before | After | Fix |
|---|---|---|---|
| Home desktop layout shift (footer visible under the short loading screen, then pushed away) | CLS 0.401, Performance 80 | CLS 0, Performance 98 | the Home loading screen is a full screen tall, so the footer starts out of view |
| Checkout (and Cart) layout shift on mobile (empty placeholder, the benefit strip shown first and then pushed down) | CLS 0.113, Performance 82 | CLS 0.042, Performance 90 | the placeholder is a full screen tall until the cart is read |
| Largest image not marked high priority (`fetchPriority`) on Home, page banners and the product gallery | not hinted | hinted | `fetchPriority="high"` on those three images |

## Why mobile Performance is 72-73 on Home, Shop and Product

Measured with the reports of the same runs:

1. **Main-thread work, not downloads.** Total blocking time is 320-520 ms and the largest image is already loaded about 1.2 s before it is painted ("element render delay"): the browser is busy running JavaScript. Almost all of it is framework code: React DOM (235 KB) and the Next.js client runtime (about 280 KB in two chunks); the template's own code is small. Checkout has 513 elements and TBT 88 ms; Home and Product have about 1,700 and TBT 450-520 ms, so the cost follows how much page React has to hydrate, under a 4x CPU slowdown.
2. **Render-blocking stylesheets.** 5-6 stylesheet files block the first paint (estimated 330-770 ms on the throttled run). Part of this is the local HTTP/1.1 server: over HTTP/2 the files load together.
3. **Image weight.** The Figma photos (hero 134 KB at 1920 wide) are replaced in TF5.

Tried and rejected: Next.js `experimental.inlineCss` (stylesheets inlined into the HTML) gave no gain (LCP unchanged, TBT noisy and higher in that run) and is an experimental flag that buyers would inherit, so it was removed.

Run-to-run spread is large on this machine (the same page moved 70 to 78 between single runs), which is why three runs and the median are used.

## Options for reaching 90 on mobile (decision for the gate)

| Option | Effect | Cost |
|---|---|---|
| A. Accept: desktop and Checkout meet the targets, mobile Performance 72-73 on three image-heavy pages | none | none; ThemeForest reviewers do not score Lighthouse, but buyers often run it |
| B. Hydrate less: render below-the-fold sections of Home and the product page only when they scroll near (client wrapper with an intersection check), turn presentational client components into server components | likely 80+ on mobile | 1-2 days, touches many components and their tests |
| C. Re-measure after TF5 (lighter licensed or placeholder images) before deciding | LCP and weight change | free, then A or B |

Recommendation: C, then A or B. The photo change in TF5 will move LCP and weight, so measuring again after it is more useful than refactoring now.

## Reproduce

```
npm run build && npm start -- -p 3300
node tests/perf/lighthouse.mjs http://localhost:3300 3        # all pages, both devices, 3 runs
LH_ONLY=home LH_DEVICES=mobile node tests/perf/lighthouse.mjs http://localhost:3300 1
```
Reports are written to `tests/perf/results/` (git-ignored). One heavy job at a time: do not run it while Playwright or a build is running.
