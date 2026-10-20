import { expect, test, type Locator } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import { stored } from "../fixtures/flows";

// E2E-CNT-06..11 (PRD CNT-002..004): About us, Contact us, FAQs and the 404 page. Coordinates are page
// coordinates at 1920 wide, taken from the Figma frames (3:28603, 3:27227, 3:27601, 3:28374).
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

test.describe("About us", () => {
  test("E2E-CNT-06 About us follows the frame: hero without a banner, reasons, founder quote, split sections, origins", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thoughtful skincare and colour for your everyday ritual.",
    );
    const hero = await pageBox(page.locator("section[aria-labelledby='about-title']"));
    expect(hero).toMatchObject({ x: 0, y: 111, w: 1920, h: 810 });
    const stats = page.getByTestId("about-stats");
    await expect(stats).toContainText("120+");
    await expect(stats).toContainText("30k");
    await expect(stats).toContainText("92%");
    expect(await pageBox(stats)).toMatchObject({ x: 300, y: 684, w: 581 });

    const cards = page.locator("section[aria-labelledby='reasons-title'] ol li > div");
    await expect(cards).toHaveCount(3);
    for (const [i, x] of [300, 750, 1200].entries()) {
      expect(await pageBox(cards.nth(i))).toMatchObject({ x, y: 1207, w: 420, h: 420 });
    }
    expect(await pageBox(page.getByRole("region", { name: "From our founder" }))).toMatchObject({
      x: 30,
      y: 1855,
      w: 1860,
      h: 774,
    });
    await expect(page.getByText("Meelies Charies")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Formulated with dermatologists" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ingredients we can trace" })).toBeVisible();
    for (const n of ["Source", "Blend and test", "Fill and ship"]) {
      await expect(page.getByRole("heading", { name: n })).toBeVisible();
    }
    // no benefit strip on this page: the footer follows the origins band (frame: y=4654)
    await expect(page.getByRole("region", { name: "Why shop with us" })).toHaveCount(0);
    const footer = await pageBox(page.locator("footer"));
    expect(Math.abs(footer.y - 4654)).toBeLessThanOrEqual(3);

    await expect(page.getByRole("link", { name: "Shop bestseller" })).toHaveAttribute(
      "href",
      "/shop?badge=best-seller",
    );
  });
});

test.describe("Contact us", () => {
  test("E2E-CNT-07 four contact cards and the map beside the form at the design's coordinates", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact us");
    const cards = page.getByTestId("contact-card");
    await expect(cards).toHaveCount(4);
    for (const [i, title] of ["Our location", "Email us", "Call us", "Live chat"].entries()) {
      await expect(cards.nth(i)).toContainText(title);
      expect(await pageBox(cards.nth(i))).toMatchObject({ y: 818, w: 308, h: 263 });
    }
    await expect(cards.nth(1).getByRole("link", { name: "support@cosmia.com" })).toHaveAttribute(
      "href",
      "mailto:support@cosmia.com",
    );
    expect(await pageBox(page.getByTestId("contact-map"))).toMatchObject({
      x: 300,
      y: 1161,
      w: 645,
      h: 715,
    });
    expect(await pageBox(page.getByTestId("contact-form"))).toMatchObject({
      x: 975,
      y: 1161,
      w: 645,
      h: 720,
    });
    // the questions at the bottom use the same accordion as the FAQs page
    const items = page.getByTestId("faq-item");
    await expect(items).toHaveCount(5);
    await expect(items.first()).toHaveAttribute("data-open", "true");
    await items.nth(1).getByRole("button").click();
    await expect(items.nth(1)).toHaveAttribute("data-open", "true");
    await expect(items.nth(1)).toContainText("15 days");
  });

  test("E2E-CNT-08 the form validates and keeps a valid message in the browser (demo mode)", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByTestId("send-message").click();
    for (const field of ["name", "email", "topic", "message", "consent"]) {
      await expect(page.getByTestId(`error-${field}`), field).toBeVisible();
    }

    const email = uniqueEmail("contact");
    await page.getByTestId("field-name").fill("Ana Lopez");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-topic").selectOption("Product advice");
    await page.getByTestId("field-message").fill("short");
    await page.getByTestId("check-consent").check();
    await page.getByTestId("send-message").click();
    await expect(page.getByTestId("error-message")).toContainText("at least 10");
    expect(await stored(page, "contact-messages")).toBeNull();

    await page.getByTestId("field-message").fill("Which serum is best for dry skin in winter?");
    await page.getByTestId("send-message").click();
    await expect(page.getByTestId("contact-sent")).toContainText("Thank you");
    await expect(page.getByTestId("field-message")).toHaveValue(""); // the form resets
    expect(await stored(page, "contact-messages")).toMatchObject([
      {
        name: "Ana Lopez",
        email,
        topic: "Product advice",
        message: "Which serum is best for dry skin in winter?",
      },
    ]);
  });
});

test.describe("FAQs", () => {
  test("E2E-CNT-09 four topics with the first question open, topic list and the contact card", async ({
    page,
  }) => {
    await page.goto("/faqs");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("FAQs");
    await expect(page.getByRole("heading", { name: "Questions, answered" })).toBeVisible();
    const sections = page.getByTestId("faq-section");
    await expect(sections).toHaveCount(4);
    const titles = [
      "Orders & shipping",
      "Returns & refunds",
      "Skin & Ingredients",
      "Account & Payments",
    ];
    for (const [i, title] of titles.entries()) {
      await expect(sections.nth(i).getByRole("heading", { level: 2 })).toHaveText(title);
      await expect(sections.nth(i).getByTestId("faq-item")).toHaveCount(4);
      await expect(sections.nth(i).getByTestId("faq-item").first()).toHaveAttribute(
        "data-open",
        "true",
      );
    }
    expect(await pageBox(sections.first())).toMatchObject({ x: 638, w: 982 });

    // open and close a question
    const second = sections.first().getByTestId("faq-item").nth(1);
    await second.getByRole("button").click();
    await expect(second.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    await second.getByRole("button").click();
    await expect(second.getByRole("button")).toHaveAttribute("aria-expanded", "false");

    // the topic list jumps to a section
    await page
      .getByRole("navigation", { name: "Topics" })
      .getByRole("link", { name: "Returns & Refunds" })
      .click();
    await expect(page).toHaveURL(/#returns-refunds$/);
    await expect(page.getByRole("heading", { name: "Returns & refunds" })).toBeInViewport();

    await expect(page.getByRole("link", { name: "Contact us" }).first()).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  test("E2E-CNT-10 search filters questions and answers, opens the matches and explains an empty result", async ({
    page,
  }) => {
    await page.goto("/faqs");
    await page.getByTestId("faq-search").fill("sensitive");
    await expect(page.getByTestId("faq-section")).toHaveCount(1);
    await expect(page.getByTestId("faq-section").first()).toContainText("Skin & Ingredients");
    await expect(page.getByTestId("faq-item").first()).toHaveAttribute("data-open", "true");

    // answers are searched too, not only the questions
    await page.getByTestId("faq-search").fill("15 days");
    await expect(page.getByTestId("faq-section").first()).toContainText("Returns & refunds");

    await page.getByTestId("faq-search").fill("zzzz-nothing");
    await expect(page.getByTestId("faq-none")).toContainText("No question matches");
    await page.getByTestId("faq-search").fill("");
    await expect(page.getByTestId("faq-section")).toHaveCount(4);
  });
});

test.describe("404", () => {
  test("E2E-CNT-11 an unknown address shows the designed 404 with a way home", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    const notFound = page.getByTestId("not-found");
    await expect(notFound.getByRole("heading", { level: 1 })).toHaveText("Oooop! Page not found");
    await expect(notFound).toContainText("no longer exists or has been moved");
    const home = notFound.getByRole("link", { name: "Go back to home" });
    await expect(home).toHaveAttribute("href", "/");
    expect(await pageBox(home)).toMatchObject({ x: 846, y: 643, w: 228, h: 52 });
    await home.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
