import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

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
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
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
