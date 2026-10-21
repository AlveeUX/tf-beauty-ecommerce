import { BLOG_LAYOUTS, type BlogLayout } from "@/lib/blog";
import { PDP_LAYOUT_LABEL, PDP_LAYOUTS, type PdpLayout } from "@/lib/pdp-layouts";
import { SHOP_LAYOUTS, SHOP_LAYOUT_TRAITS, type ShopLayout } from "@/lib/shop-layouts";

/**
 * The /demos hub: every layout variant and key page, one link each. The layout names are typed as
 * `Record<LayoutId, ...>`, so adding a layout id elsewhere fails the type check until it is listed here.
 */
export type Demo = {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Set for the one link that is a 404 on purpose. */
  status?: 404;
};
export type DemoGroup = { id: string; title: string; intro: string; items: Demo[] };

const SHOP_LABEL: Record<ShopLayout, string> = {
  left: "Grid, left filters",
  right: "Grid, right filters",
  "list-left": "List, left filters",
  "list-right": "List, right filters",
  "load-more": "Grid with Load more",
  "top-filter": "Grid, filters on top",
  "list-top-filter": "List, filters on top",
  horizontal: "Grid, horizontal filters",
  "list-horizontal": "List, horizontal filters",
  "filter-drawer": "Filter drawer",
};

const FILTER_TEXT = {
  "sidebar-left": "filters in a left sidebar",
  "sidebar-right": "filters in a right sidebar",
  panel: "a filter panel above the products",
  dropdowns: "filter drop-downs in a bar",
  drawer: "filters in a slide-in drawer",
} as const;

const shopDescription = (layout: ShopLayout) => {
  const t = SHOP_LAYOUT_TRAITS[layout];
  const view = t.view === "grid" ? `${t.columns}-column grid` : "Product rows";
  return `${view}, ${FILTER_TEXT[t.filters]}${t.loadMore ? ", Load more button" : ""}.`;
};

const PDP_SAMPLE = "the-renewal-serum";
/** The countdown layout needs a product that is on sale. */
const PDP_SLUG: Partial<Record<PdpLayout, string>> = {
  "on-sale-countdown": "barrier-repair-cream",
};

const PDP_NOTE: Record<PdpLayout, string> = {
  "details-default": "Gallery below the title block, the standard purchase panel.",
  "product-color": "Colour chips with a name for the selected shade.",
  "subscribe-and-save": "One-time purchase or a subscription price.",
  "on-sale-countdown": "Struck price, SAVE badge and a live countdown.",
  "thumbnail-right": "Thumbnail column beside the main picture (as drawn in the design).",
  "thumbnail-left": "Thumbnail column on the opposite side.",
  "gallery-1-column": "Pictures stacked in one column.",
  "gallery-2-column": "Pictures in a two-column grid.",
  "inner-zoom": "Zoom inside the picture on hover.",
  "external-zoom": "Zoomed view in a pane beside the picture.",
};

const BLOG_LABEL: Record<BlogLayout, string> = {
  grid: "Grid",
  list: "List",
  standard: "Standard",
  "sidebar-left": "Left sidebar",
  "sidebar-right": "Right sidebar",
};

const BLOG_SAMPLE_POST = "inside-the-formula-behind-beautiful-skin";

export const DEMO_GROUPS: DemoGroup[] = [
  {
    id: "shop",
    title: "Shop layouts",
    intro: "Ten ways to list products. Choose one with ?layout= or set the default in the code.",
    items: SHOP_LAYOUTS.map((layout) => ({
      id: `shop-${layout}`,
      title: SHOP_LABEL[layout],
      description: shopDescription(layout),
      href: `/shop?layout=${layout}`,
    })),
  },
  {
    id: "product",
    title: "Product page layouts",
    intro: "Ten product pages, plus the sticky add-to-cart bar and the sold-out state.",
    items: [
      ...PDP_LAYOUTS.map((layout) => ({
        id: `product-${layout}`,
        title: PDP_LAYOUT_LABEL[layout],
        description: PDP_NOTE[layout],
        href: `/product/${PDP_SLUG[layout] ?? PDP_SAMPLE}?layout=${layout}`,
      })),
      {
        id: "product-sticky",
        title: "Sticky add to cart",
        description:
          "A bar with the product and Add to cart appears once the buy buttons scroll away.",
        href: `/product/${PDP_SAMPLE}?sticky=1`,
      },
      {
        id: "product-sold-out",
        title: "Sold out",
        description: "Buying is disabled and the stock line says Out of stock.",
        href: "/product/glass-glow-primer",
      },
    ],
  },
  {
    id: "blog",
    title: "Blog",
    intro: "Five list layouts and the article page.",
    items: [
      ...BLOG_LAYOUTS.map((layout) => ({
        id: `blog-${layout}`,
        title: BLOG_LABEL[layout],
        description: "Journal index.",
        href: `/blog?layout=${layout}`,
      })),
      {
        id: "blog-post",
        title: "Article",
        description: "Reading page with tags, share buttons, neighbours and comments.",
        href: `/blog/${BLOG_SAMPLE_POST}`,
      },
    ],
  },
  {
    id: "shopping",
    title: "Shopping pages",
    intro:
      "Browsing, saving and buying. The cart, checkout and orders are demos that run in the browser.",
    items: [
      {
        id: "categories",
        title: "Categories",
        description: "All categories as cards.",
        href: "/categories",
      },
      {
        id: "search",
        title: "Search results",
        description: "Search with the same filters as the shop.",
        href: "/search?q=serum",
      },
      { id: "wishlist", title: "Wishlist", description: "Saved products.", href: "/wishlist" },
      { id: "compare", title: "Compare", description: "Products side by side.", href: "/compare" },
      {
        id: "cart",
        title: "Cart",
        description: "Lines, quantities, free-shipping bar.",
        href: "/cart",
      },
      {
        id: "checkout",
        title: "Checkout",
        description: "Billing form, payment methods and summary.",
        href: "/checkout",
      },
      {
        id: "track-order",
        title: "Track order",
        description: "Try order CSM-DEMO2026 with demo@example.com.",
        href: "/track-order",
      },
    ],
  },
  {
    id: "account",
    title: "Account pages",
    intro: "Accounts live in this browser only (demo mode).",
    items: [
      { id: "login", title: "Login", description: "Sign in.", href: "/login" },
      { id: "register", title: "Register", description: "Create an account.", href: "/register" },
      {
        id: "forgot",
        title: "Lost password",
        description: "Request a reset link.",
        href: "/forgot-password",
      },
      {
        id: "account",
        title: "My account",
        description: "Profile, orders, addresses (sign in first).",
        href: "/account",
      },
    ],
  },
  {
    id: "content",
    title: "Content pages",
    intro: "About, contact, FAQs, stores and the legal pages.",
    items: [
      {
        id: "about",
        title: "About us",
        description: "Story, numbers and reasons to choose us.",
        href: "/about",
      },
      {
        id: "contact",
        title: "Contact us",
        description: "Contact cards, map and message form.",
        href: "/contact",
      },
      { id: "faqs", title: "FAQs", description: "Four topics of questions.", href: "/faqs" },
      {
        id: "stores",
        title: "Store locator",
        description: "Stores with opening status.",
        href: "/store-locator",
      },
      {
        id: "privacy",
        title: "Privacy policy",
        description: "Policy page with contents list.",
        href: "/policy/privacy",
      },
      {
        id: "shipping",
        title: "Shipping policy",
        description: "Delivery times and costs.",
        href: "/policy/shipping",
      },
      {
        id: "returns",
        title: "Returns policy",
        description: "Returns and refunds.",
        href: "/policy/returns",
      },
      {
        id: "terms",
        title: "Terms and conditions",
        description: "Terms of sale.",
        href: "/policy/terms",
      },
      {
        id: "not-found",
        title: "404 page",
        description: "What an unknown address shows.",
        href: "/this-page-does-not-exist",
        status: 404,
      },
    ],
  },
  {
    id: "tools",
    title: "For developers",
    intro: "Building blocks and design tokens.",
    items: [
      {
        id: "ui-kit",
        title: "UI kit",
        description: "Colours, type, buttons, fields, cards, dialogs, icons.",
        href: "/ui-kit",
      },
    ],
  },
];

/** Every demo link, flattened (used by the tests). */
export const ALL_DEMOS: Demo[] = DEMO_GROUPS.flatMap((group) => group.items);
