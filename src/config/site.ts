/**
 * Site settings: the one file to edit to rebrand the template.
 * Brand name, contact details, social links, currency and shipping rules are read from here by the
 * header, footer, contact page, policies, checkout and the cart. Page copy that is not a setting
 * (About text, FAQs, product and blog content) lives in `src/content` and `src/data`.
 */
export const site = {
  /** Shown in the logo, page titles, copyright line and legal copy. */
  name: "Cosmia",
  /** Second line of the logo and the suffix of the home page title. */
  tagline: "Skincare & Cosmetics",
  /** Default meta description. */
  description: "Skincare and cosmetics, thoughtfully formulated.",
  /** Public address of the deployed site, used for absolute links in the sitemap, robots.txt and share previews. */
  url: "https://example.com",
  /** Used by the About page ("started in a small studio in ..."). */
  foundedYear: 2014,

  contact: {
    /** City shown in the "Est" line of the announcement bar and Home footer (keep it in step with the address). */
    city: "Portland",
    address: "2571 Oakridge Street, Suite 4B, Portland, OR 97205",
    phone: { display: "+1 (009) 544-7828", href: "tel:+10095447828" },
    emails: {
      support: "support@cosmia.com",
      info: "info@cosmia.com",
      livechat: "livechat@cosmia.com",
      privacy: "privacy@cosmia.com",
    },
  },

  /**
   * Social profiles. The defaults open each network's home page so nothing points at a real account;
   * put your own profile URLs here.
   */
  socials: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    twitter: "https://x.com/",
    linkedin: "https://www.linkedin.com/",
  },

  commerce: {
    /** ISO 4217 code stored on orders. Prices in the data files are integer cents of this currency. */
    currency: "USD",
    /** Orders at or above this subtotal ship free (integer cents). Also drives every free-shipping message. */
    freeShippingThresholdCents: 10_000,
    /** Days a customer may return an eligible, unopened product (benefit strip, FAQs and returns policy). */
    returnWindowDays: 15,
    /** Flat shipping rate below the threshold (integer cents). */
    shippingFlatRateCents: 800,
    /** A cart line may not exceed this even when more is in stock. */
    maxLineQuantity: 20,
    /** Products that can be compared side by side. */
    compareLimit: 4,
    /** Countries offered at checkout. */
    countries: [
      "United Kingdom (UK)",
      "United States (US)",
      "Canada",
      "Australia",
      "Denmark",
      "France",
      "Germany",
      "Ireland",
      "Netherlands",
      "Sweden",
    ],
    /** Discount shown on the "Subscribe and save" product layout. */
    subscribeDiscountPercent: 15,
  },
} as const;
