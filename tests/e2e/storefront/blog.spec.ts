import { expect, test, type Locator } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import { stored } from "../fixtures/flows";

// E2E-BLG-01..05 (PRD BLG-001..004): journal list in five layouts, filters, details and comments.
// Coordinates are page coordinates at 1920 wide from the Figma frames 3:25805, 3:25320, 3:28943, 3:24811, 3:26684.
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

const SLUG = "inside-the-formula-behind-beautiful-skin";

test.describe("Blog list", () => {
  test("E2E-BLG-01 grid shows the 12 posts as 3 columns of 420 x 515 cards", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
    const cards = page.getByTestId("blog-card");
    await expect(cards).toHaveCount(12);
    expect(await pageBox(cards.nth(0))).toMatchObject({ x: 300, y: 690, w: 420, h: 515 });
    expect(await pageBox(cards.nth(1))).toMatchObject({ x: 750, y: 690, w: 420, h: 515 });
    expect(await pageBox(cards.nth(11))).toMatchObject({ x: 1200, y: 2325, w: 420, h: 515 });
    await expect(cards.nth(0)).toContainText("Inside the formula behind beautiful skin.");
    await expect(cards.nth(0)).toContainText("Science");
    await expect(cards.nth(0)).toContainText("08 Oct 2026");
    await expect(page.getByRole("region", { name: "Why shop with us" })).toHaveCount(0);

    await cards
      .nth(1)
      .getByRole("link", { name: /Read more/ })
      .click();
    await expect(page).toHaveURL(/\/blog\/skin-simplified-for-smarter-skincare-routine$/);
  });

  test("E2E-BLG-02 list, standard and sidebar layouts follow their frames and paginate", async ({
    page,
  }) => {
    await page.goto("/blog?layout=list");
    const rows = page.getByTestId("blog-card");
    await expect(rows).toHaveCount(6);
    expect(await pageBox(rows.nth(0))).toMatchObject({ x: 750, y: 690, w: 870, h: 285 });
    expect(await pageBox(rows.nth(5))).toMatchObject({ y: 2265, h: 285 });
    const aside = page.getByRole("complementary", { name: "Blog sidebar" });
    expect(await pageBox(aside)).toMatchObject({ x: 300, y: 690, w: 390 });
    for (const heading of ["Search here", "Categories", "Recent Blog", "Tags"]) {
      await expect(aside.getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(aside.getByText("Use code: GLOW30")).toBeVisible();

    const pager = page.getByRole("navigation", { name: "Pagination" });
    expect(await pageBox(pager)).toMatchObject({ x: 750, y: 2600, h: 40 });
    await pager.getByRole("link", { name: /02/ }).click();
    await expect(page).toHaveURL(/layout=list&page=2/);
    await expect(rows).toHaveCount(6);

    await page.goto("/blog?layout=sidebar-left");
    await expect(page.getByTestId("blog-card")).toHaveCount(8);
    expect(await pageBox(page.getByTestId("blog-card").first())).toMatchObject({
      x: 750,
      y: 690,
      w: 420,
    });
    await page.goto("/blog?layout=sidebar-right");
    expect(await pageBox(page.getByTestId("blog-card").first())).toMatchObject({ x: 300, y: 690 });
    expect(await pageBox(page.getByRole("complementary", { name: "Blog sidebar" }))).toMatchObject({
      x: 1230,
      y: 690,
      w: 390,
    });
    await page.goto("/blog?layout=standard");
    await expect(page.getByTestId("blog-card")).toHaveCount(3);
    expect(await pageBox(page.getByTestId("blog-card").first())).toMatchObject({
      x: 300,
      y: 690,
      w: 870,
    });
    // an unknown layout falls back to the grid
    await page.goto("/blog?layout=nope");
    await expect(page.getByTestId("blog-card")).toHaveCount(12);
  });

  test("E2E-BLG-03 categories, tags and search narrow the list and explain an empty result", async ({
    page,
  }) => {
    await page.goto("/blog?layout=list");
    const aside = page.getByRole("complementary", { name: "Blog sidebar" });
    await aside.getByRole("link", { name: /^Guides/ }).click();
    await expect(page).toHaveURL(/category=Guides/);
    await expect(page.getByTestId("blog-card")).toHaveCount(1);
    await expect(page.getByTestId("blog-filter")).toContainText("1 post for “Guides”");
    await page.getByTestId("blog-filter").getByRole("link", { name: "Show all" }).click();
    await expect(page.getByTestId("blog-card")).toHaveCount(6);

    await page
      .getByRole("complementary")
      .getByRole("link", { name: "Evening", exact: true })
      .click();
    await expect(page.getByTestId("blog-card")).toHaveCount(2);

    await page.goto("/blog?layout=list");
    await page.getByTestId("blog-search").fill("makeup");
    await page.getByTestId("blog-search").press("Enter");
    await expect(page).toHaveURL(/q=makeup/);
    await expect(page.getByTestId("blog-card")).toHaveCount(1);
    await page.goto("/blog?layout=list&q=zzzz-nothing");
    await expect(page.getByTestId("blog-none")).toContainText("No posts match");
  });
});

test.describe("Blog details", () => {
  test("E2E-BLG-04 article, neighbours and the approved comments follow the frame", async ({
    page,
  }) => {
    await page.goto(`/blog/${SLUG}`);
    await expect(page.getByRole("heading", { level: 1, name: "Blog details" })).toBeVisible();
    const post = page.getByTestId("blog-post");
    expect(await pageBox(post.locator("h1"))).toMatchObject({ x: 300 });
    await expect(post).toContainText("Beautiful skin is rarely about doing more.");
    await expect(post.getByText("Support Your Barrier")).toBeVisible();
    await expect(post.getByText("Marta Lindqvist · Director of Skinlama")).toBeVisible();
    await expect(post.getByText("Prefer to keep it simple?")).toBeVisible();
    await expect(post.getByRole("heading", { name: "02 Comments" })).toBeVisible();
    await expect(post.getByTestId("blog-comment")).toHaveCount(3);
    await expect(post.getByRole("heading", { name: "Leave a Comment" })).toBeVisible();

    await expect(page.getByTestId("blog-next")).toHaveAttribute(
      "href",
      "/blog/skin-simplified-for-smarter-skincare-routine",
    );
    await expect(page.getByTestId("blog-previous")).toHaveAttribute(
      "href",
      "/blog/how-to-create-a-skincare-routine-that-works",
    );
    await page.getByTestId("blog-next").click();
    await expect(page).toHaveURL(/skin-simplified/);

    const missing = await page.goto("/blog/no-such-post");
    expect(missing?.status()).toBe(404);
  });

  test("E2E-BLG-05 a comment is validated and kept as pending in the browser (demo mode)", async ({
    page,
  }) => {
    await page.goto(`/blog/${SLUG}`);
    await page.getByTestId("submit-comment").click();
    await expect(page.getByText("Write at least 5 characters.")).toBeVisible();
    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Enter your email address.")).toBeVisible();

    const email = uniqueEmail("blogger");
    await page.getByTestId("field-body").fill("A very useful read, thank you.");
    await page.getByTestId("field-name").fill("Ana Lopez");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("submit-comment").click();
    await expect(page.getByTestId("comment-sent")).toContainText("approved");
    await expect(page.getByTestId("field-body")).toHaveValue("");
    expect(await stored(page, "blog-comments")).toMatchObject([
      { slug: SLUG, name: "Ana Lopez", email, status: "pending", parentId: null },
    ]);
    // pending comments stay hidden
    await page.reload();
    await expect(page.getByTestId("blog-comment")).toHaveCount(3);

    // replying attaches the comment to its parent
    await page.getByTestId("blog-comment").first().getByRole("button", { name: "Reply" }).click();
    await expect(page.getByTestId("replying-to")).toContainText("Replying to Eleanor Pena");
    await page.getByTestId("field-body").fill("Thank you for the kind words!");
    await page.getByTestId("field-name").fill("Ana Lopez");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("submit-comment").click();
    await expect(page.getByTestId("comment-sent")).toBeVisible();
    const comments = (await stored<{ parentId: number | null }[]>(page, "blog-comments")) ?? [];
    expect(comments.map((c) => c.parentId !== null)).toEqual([false, true]);
  });
});
