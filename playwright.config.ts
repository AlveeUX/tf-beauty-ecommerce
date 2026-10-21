import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

/** Widths of the responsive spec (docs/responsive-spec.md section 3), plus 320 for the reflow check. */
const RESPONSIVE_WIDTHS: { width: number; height: number; only?: RegExp }[] = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800, only: /R-01/ }, // laptop band: overflow check only
  { width: 1180, height: 820, only: /R-01/ },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // the production server is shared; specs keep their own browser state
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Specs measure and click things; with reduced motion the site's reveals and hovers shrink to short fades.
    reducedMotion: "reduce",
    // The welcome popup would cover pages mid-test, so every test starts as a visitor who already closed it.
    // The popup's own test starts from an empty browser (see storefront/newsletter.spec.ts).
    storageState: {
      cookies: [],
      origins: [
        {
          origin: `http://localhost:${port}`,
          localStorage: [
            {
              name: "cosmia.newsletter-popup",
              value: JSON.stringify({ at: 4102444800000, subscribed: false }),
            },
          ],
        },
      ],
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      testIgnore: "**/responsive/**",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    // TF3: the responsive specs run once per width (npm run e2e:responsive). Phones and tablets are touch devices.
    ...RESPONSIVE_WIDTHS.map(({ width, height, only }) => ({
      name: `r${width}`,
      testMatch: "**/responsive/**/*.spec.ts",
      ...(only ? { grep: only } : {}),
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width, height },
        isMobile: width <= 768,
        hasTouch: width <= 768,
      },
    })),
    // TF4: the same suites in Firefox and WebKit (npm run e2e:browsers). Firefox has no `isMobile`, so its phone
    // project only sets the viewport and touch.
    {
      name: "firefox-desktop",
      testIgnore: "**/responsive/**",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "webkit-desktop",
      testIgnore: "**/responsive/**",
      timeout: 90_000, // axe scans and the 12-layout loops take about three times longer in WebKit
      use: { ...devices["Desktop Safari"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "firefox-r390",
      testMatch: "**/responsive/**/*.spec.ts",
      use: { ...devices["Desktop Firefox"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
    {
      name: "webkit-r390",
      testMatch: "**/responsive/**/*.spec.ts",
      use: { ...devices["Desktop Safari"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
  // Real production build; state lives in each test's own browser context (localStorage).
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: `http://localhost:${port}/api/health`,
    timeout: 240_000,
    // E2E_REUSE=1 reuses a server you started yourself (faster while iterating on tests).
    reuseExistingServer: Boolean(process.env.E2E_REUSE),
    env: {
      // the test card exists only for the E2E run (never enabled by default; read at build time)
      NEXT_PUBLIC_PAYMENT_METHODS: "bank_transfer,cod,check,card_test",
    },
  },
});
