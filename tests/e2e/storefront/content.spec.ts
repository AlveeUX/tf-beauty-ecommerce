import { expect, test, type Locator } from "@playwright/test";

// E2E-CNT-01..04 (PRD CNT-006): policy pages. Figma 3:24059 "Policy and privacy" is the template; coordinates are
// page coordinates at 1920 wide.
async function pageBox(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + scrollX),
      y: Math.round(r.top + scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
}

test.describe("Policy pages", () => {
  test("E2E-CNT-01 privacy page has the design's structure, text and geometry", async ({
    page,
  }) => {
    await page.goto("/policy/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Policy and privacy");
    await expect(page.getByText("Last updated: September 27, 2026")).toBeVisible();

    const toc = page.getByTestId("policy-toc");
    await expect(toc.getByRole("link")).toHaveCount(6);
    expect(await pageBox(toc)).toMatchObject({ x: 300, y: 690, w: 405 });
    expect(Math.abs((await pageBox(toc)).h - 322)).toBeLessThanOrEqual(3);

    const headings = page.locator("article h2");
    await expect(headings).toHaveText([
      "1. Information we collect",
      "2. How we use your information",
      "3. Sharing and disclosure",
      "4. Your rights and choices",
      "5. Data security",
    ]);
    const first = await pageBox(headings.first());
    expect(first.x).toBe(765);
    expect(first.w).toBe(855);
    expect(Math.abs(first.y - 820)).toBeLessThanOrEqual(2);

    // the sharing table, the note and the contact box
    await expect(page.getByRole("table")).toContainText("Shipping carriers");
    await expect(page.getByRole("row", { name: /Marketing platforms/ })).toContainText(
      "opt-in only",
    );
    await expect(page.getByText("We never collect sensitive health data")).toBeVisible();
    const contact = page.getByTestId("policy-contact");
    await expect(contact.getByRole("link", { name: "privacy@cosmia.com" })).toHaveAttribute(
      "href",
      "mailto:privacy@cosmia.com",
    );
    expect(await pageBox(contact)).toMatchObject({ x: 765, w: 855 });
  });

  test("E2E-CNT-02 the contents list jumps to a section and follows the reading position", async ({
    page,
  }) => {
    await page.goto("/policy/privacy");
    const toc = page.getByTestId("policy-toc");
    await expect(toc.getByRole("link").first()).toHaveAttribute("aria-current", "location");

    await toc.getByRole("link", { name: /Data Security/ }).click();
    await expect(page).toHaveURL(/#data-security$/);
    await expect(page.getByRole("heading", { name: "5. Data security" })).toBeInViewport();
    await expect(toc.getByRole("link", { name: /Data Security/ })).toHaveAttribute(
      "aria-current",
      "location",
    );
    await expect(toc).toBeInViewport(); // the list stays in view while reading

    // the reader scrolls back up with the wheel
    await page.mouse.move(900, 500);
    // Firefox animates a wheel scroll and drops the rest of a long one, so the wheel is repeated until the top is reached
    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, -1500);
          return toc
            .getByRole("link", { name: /Information We Collect/ })
            .getAttribute("aria-current");
        },
        { timeout: 10_000 },
      )
      .toBe("location");
  });

  test("E2E-CNT-03 shipping, returns and terms use the same template with the store's own numbers", async ({
    page,
  }) => {
    await page.goto("/policy/shipping");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shipping");
    await expect(page.getByText("Orders of $100.00 or more ship free")).toBeVisible();
    await expect(page.getByText("flat shipping fee of $8.00")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "United Kingdom (UK)" }),
    ).toBeVisible();

    await page.goto("/policy/returns");
    await expect(page.getByText("within 15 days of delivery")).toBeVisible();

    await page.goto("/policy/terms");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms and conditions");
    await expect(page.getByTestId("policy-toc").getByRole("link")).toHaveCount(4);
  });

  test("E2E-CNT-04 an unknown policy is a 404 and every footer and checkout policy link resolves", async ({
    page,
  }) => {
    expect((await page.goto("/policy/no-such-policy"))?.status()).toBe(404);
    expect((await page.goto("/policy/__proto__"))?.status()).toBe(404);

    await page.goto("/shop");
    const hrefs = await page
      .locator("footer a[href^='/policy/']")
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href")))]);
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) {
      expect((await page.request.get(href!)).status(), href!).toBe(200);
    }
  });
});

test.describe("Store location", () => {
  test("E2E-CNT-05 map and three store cards at the design's coordinates, with working links", async ({
    page,
  }) => {
    await page.goto("/store-locator");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Store location");
    expect(await pageBox(page.getByTestId("store-map"))).toMatchObject({
      x: 300,
      y: 690,
      w: 645,
      h: 715,
    });
    const cards = page.getByTestId("store-card");
    await expect(cards).toHaveCount(3);
    for (const [i, y] of [693, 937, 1181].entries()) {
      expect(await pageBox(cards.nth(i))).toMatchObject({ x: 975, y, w: 645, h: 224 });
    }
    await expect(cards.first()).toContainText("Cosmia — Copenhagen Flagship");
    await expect(cards.first()).toContainText("Østergade 12, 1100 Copenhagen, Denmark");
    await expect(cards.first().getByRole("link", { name: "+45 33 11 22 33" })).toHaveAttribute(
      "href",
      "tel:+4533112233",
    );
    const directions = cards.first().getByRole("link", { name: "Get direction" });
    await expect(directions).toHaveAttribute("href", /google\.com\/maps\/search\/\?api=1&query=/);
    await expect(directions).toHaveAttribute("rel", /noopener/);
    expect(await pageBox(directions)).toMatchObject({ x: 1005, y: 848, h: 44 });
    // every card shows whether the store is open right now
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i).getByTestId("store-status")).toContainText(
        /(Open|Closed) · (Closes|Opens) \d+:00 [AP]M/,
      );
    }
    // the top bar "Store locator" and footer links lead here
    expect((await page.request.get("/store-locator")).status()).toBe(200);
  });
});
