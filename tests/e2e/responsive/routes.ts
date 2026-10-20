import { ALL_DEMOS } from "../../../src/content/demos";

/** The pages the responsive specs visit: the key templates plus every layout variant on the /demos hub. */
const KEY_ROUTES = [
  "/",
  "/shop",
  "/product/the-renewal-serum",
  "/cart",
  "/checkout",
  "/wishlist",
  "/compare",
  "/categories",
  "/search?q=serum",
  "/blog",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/policy/privacy",
  "/login",
  "/register",
  "/forgot-password",
  "/track-order",
  "/demos",
  "/ui-kit",
  "/this-page-does-not-exist",
];

/** Key templates and all 28 layout variants, each once (the 404 example is already in KEY_ROUTES). */
export const ALL_ROUTES = [...new Set([...KEY_ROUTES, ...ALL_DEMOS.map((demo) => demo.href)])];

/** Pages used for the accessibility and touch-size checks: one of each template, not every variant. */
export const TEMPLATE_ROUTES = KEY_ROUTES;
