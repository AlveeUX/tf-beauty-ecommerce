import { expect, test } from "@playwright/test";

// E2E-PRD-01..08 (PRD PRD-001..008, BR-10, BR-11)
test.describe("Product details", () => {
  test("E2E-PRD-01 shows the product, and size selection updates price, SKU and unit", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The renewal serum");
    await expect(page.getByTestId("price")).toContainText("$48.00");
    await expect(page.getByRole("radio", { name: "30 ml" })).toBeChecked();
    await expect(page.getByTestId("stock-status")).toHaveText("In Stock");
    await expect(page.getByTestId("sku")).toContainText("-30ML");

    await page.getByRole("radio", { name: "15 ml" }).click();
    await expect(page.getByTestId("price")).toContainText("$28.00");
    await expect(page.getByTestId("price")).toContainText("/ 15ml");
    await expect(page.getByTestId("sku")).toContainText("-15ML");

    await page.getByRole("radio", { name: "50 ml" }).click();
    await expect(page.getByTestId("price")).toContainText("$72.00");
  });

  test("E2E-PRD-02 quantity stays within 1 and the available stock", async ({ page }) => {
    await page.goto("/product/the-renewal-serum");
    const qty = page.getByTestId("quantity");
    await expect(qty.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await qty.getByRole("button", { name: "Increase quantity" }).click({ clickCount: 3 });
    await expect(qty.locator("output")).toHaveText("04");
    await page.getByRole("radio", { name: "15 ml" }).click(); // changing size resets the quantity
    await expect(qty.locator("output")).toHaveText("01");
  });

  test("E2E-PRD-03 gallery thumbnails, arrows and fullscreen work", async ({ page }) => {
    await page.goto("/product/the-renewal-serum");
    const gallery = page.getByTestId("product-gallery");
    await expect(
      gallery.getByRole("list", { name: "Product images" }).locator("button"),
    ).toHaveCount(5);

    const main = gallery.locator("img").first();
    const first = await main.getAttribute("alt");
    await gallery.getByRole("button", { name: "Show image 3 of 5" }).click();
    await expect(main).not.toHaveAttribute("alt", first ?? "");
    await expect(gallery.getByRole("button", { name: "Show image 3 of 5" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await gallery.getByRole("button", { name: "Next image" }).click();
    await expect(gallery.getByRole("button", { name: "Show image 4 of 5" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await gallery.getByRole("button", { name: "Previous image" }).click({ clickCount: 3 });
    await expect(gallery.getByRole("button", { name: "Show image 1 of 5" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await gallery.getByRole("button", { name: "View image full screen" }).click();
    await expect(gallery.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(gallery.getByRole("dialog")).toBeHidden();
  });

  test("E2E-PRD-04 formula sections are collapsible and show the product's content", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum");
    await expect(page.getByRole("heading", { name: "Inside the formula" })).toBeVisible();
    const sections = page.locator("details");
    await expect(sections).toHaveCount(4);
    await expect(page.getByText("Parabens, Phthalates, Synthetic Sulfates")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "98%" }).or(page.getByText("98%")).first(),
    ).toBeVisible();

    const benefits = sections.first();
    await benefits.locator("summary").click();
    await expect(benefits).not.toHaveAttribute("open", "");
    await benefits.locator("summary").click();
    await expect(benefits).toHaveAttribute("open", "");

    await expect(page.getByRole("heading", { name: "Formulated for renewal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Palmitoyl Tripeptide-38" })).toBeVisible();
  });

  test("E2E-PRD-05 products without structured content still list their ingredients", async ({
    page,
  }) => {
    await page.goto("/product/facial-roller");
    await expect(page.getByText("Full ingredient transparency")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Formulated for renewal" })).toHaveCount(0);
  });

  test("E2E-PRD-06 out-of-stock variants disable purchase actions (PRD-008)", async ({ page }) => {
    await page.goto("/product/glass-glow-primer");
    await expect(page.getByTestId("stock-status")).toHaveText("Out of stock");
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
    await expect(page.getByTestId("buy-now")).toBeDisabled();
  });

  test("E2E-PRD-07 unknown and unpublished products are a real 404 (BR-10)", async ({
    page,
    request,
  }) => {
    const res = await page.goto("/product/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("not-found")).toBeVisible();
    expect((await request.get("/api/catalog/products/does-not-exist")).status()).toBe(404);
  });

  test("E2E-PRD-08 only approved reviews appear; the summary and brand reply render", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum");
    await expect(page.getByTestId("rating-average")).toHaveText("4.9");
    const list = page.getByTestId("review-list");
    await expect(list.locator("> li")).toHaveCount(3);
    await expect(list).not.toContainText("Awaiting moderation"); // pending review stays hidden
    await expect(list).toContainText("Cosmia Skin Team");
    await expect(page.getByRole("list", { name: "Rating distribution" }).locator("li")).toHaveCount(
      5,
    );
  });

  test("E2E-PRD-09 review form validates, submits for moderation and blocks duplicates", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum");
    const status = page.getByTestId("review-status");

    // empty submit: every required field is flagged and nothing is sent
    await page.getByTestId("submit-review").click();
    await expect(page.getByText("Please add a headline (3+ characters).")).toBeVisible();
    await expect(page.getByText("Please choose a rating.")).toBeVisible();
    await expect(page.getByText("Please write at least 10 characters.")).toBeVisible();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please enter a valid email.")).toBeVisible();

    const email = `e2e-${Date.now()}@example.com`;
    await page.getByLabel("Review headline*").fill("Great everyday serum");
    await page.getByRole("radio", { name: "5 stars" }).click();
    await page.getByLabel("Comments*").fill("Absorbs quickly and my skin feels calm all day.");
    await page.getByLabel("Enter name*").fill("E2E Shopper");
    await page.getByLabel("Enter email*").fill(email);
    await page.getByTestId("submit-review").click();
    await expect(status).toContainText("Thanks! Your review will appear once approved.");

    // not published, and the reviewer cannot post again for this product
    await page.reload();
    await expect(page.getByTestId("review-list").locator("> li")).toHaveCount(3);
    await page.getByLabel("Review headline*").fill("Second try");
    await page.getByRole("radio", { name: "4 stars" }).click();
    await page.getByLabel("Comments*").fill("Trying to review the same product twice.");
    await page.getByLabel("Enter name*").fill("E2E Shopper");
    await page.getByLabel("Enter email*").fill(email);
    await page.getByTestId("submit-review").click();
    await expect(status).toContainText("You have already reviewed this product.");
  });

  test("E2E-PRD-10 related carousels scroll", async ({ page }) => {
    await page.goto("/product/the-renewal-serum");
    const section = page.getByRole("region", { name: "More from collection" });
    const track = section.getByTestId("carousel-track");
    await expect(track.locator("[data-testid='product-card']")).toHaveCount(8);
    const start = await track.evaluate((el) => el.scrollLeft);
    await section.getByRole("button", { name: "Next More from collection" }).click();
    await expect.poll(async () => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(start);
  });

  test("E2E-PRD-11 share opens the popup and Copy puts the product address on the clipboard", async ({
    page,
    context,
    browserName,
  }) => {
    // only Chromium lets a test read the clipboard; the other engines still check the "Copied" label
    if (browserName === "chromium")
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/product/the-renewal-serum?layout=thumbnail-left");
    await page.getByTestId("share").click();
    await expect(page.getByTestId("share-modal")).toBeVisible();
    await page.getByTestId("share-copy").click();
    await expect(page.getByTestId("share-copy")).toHaveText("Copied");
    // the address is the product page itself, without the layout parameter
    if (browserName === "chromium")
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
        /\/product\/the-renewal-serum$/,
      );
  });
});
