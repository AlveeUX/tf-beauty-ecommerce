import { site } from "@/config/site";
/**
 * About us copy (CNT-002, Figma 3:28603). The words are the design's own, including its rough edges
 * ("Reasons to choose us", "effectives"), so the client can correct them in the admin pages screen (P9).
 */
export const ABOUT = {
  hero: {
    label: `About ${site.name}`,
    title: "Thoughtful skincare and colour for your everyday ritual.",
    text: `${site.name} started in a small studio in ${site.foundedYear} with one rule: if we wouldn't put on our own faces every day, we don't sell it. Today we make simple, well-tested formulas for every skin tone and type.`,
    cta: { label: "Shop bestseller", href: "/shop?badge=best-seller" },
    stats: [
      { value: "120+", label: "Tested on real skin" },
      { value: "30k", label: "Customers reorder" },
      { value: "92%", label: "Recyclable packaging" },
    ],
  },
  reasons: {
    label: "Reasons to choose us",
    title: "Better choices for beautiful skin",
    items: [
      {
        image: "/images/about/reason-1.jpg",
        title: "Create canvas",
        text: "Every ingredient is listed with its purpose. No hidden “fragrance,” no filler. Our shade range is built with testers of 40+ skin tones.",
        width: 394,
      },
      {
        image: "/images/about/reason-2.jpg",
        title: "Made for every tone",
        text: "Our shade range is built with testers of 40+ skin tones, not added at the end. Every ingredient is listed with its purpose for skin care.",
        width: 420,
      },
      {
        image: "/images/about/reason-3.jpg",
        title: "Kind to the planet",
        text: "Refill pouches, recycled glass and carbon-neutral shipping on all orders. Our shade range not added at the end of every time.",
        width: 370,
      },
    ],
  },
  quote: {
    text: "Beauty shouldn't need a ten-step routine or a chemistry degree. It should feel good, work well, and be honest about what's inside.",
    name: "Meelies Charies",
    role: "[CEO and Founder]",
    portrait: "/images/about/founder.jpg",
  },
  expert: {
    label: "Expert Care",
    title: "Formulated with dermatologists",
    text: "Our in-house chemists work alongside skin specialists to keep formulas gentle and effective. Each product goes through patch testing on sensitive skin.",
    points: [
      "Dermatologist-guided development",
      "Skin-first formulation process",
      "Tested before every launch",
    ],
    cta: { label: "Read our science", href: "/blog" },
    image: "/images/about/expert.jpg",
  },
  transparency: {
    label: "Full Transparency",
    title: "Ingredients we can trace",
    text: "We believe you deserve to know exactly what goes into your skincare. From carefully selected ingredients to their origins and purpose, we prioritize at every step.",
    points: [
      "Responsibly sourced ingredients",
      "Fair prices for growers",
      "Sourced without middlemen",
    ],
    cta: { label: "Meet our suppliers", href: "/contact" },
    image: "/images/about/transparency.jpg",
  },
  origins: {
    label: "Pure Origins",
    title: "From farm to Your ritual routine.",
    steps: [
      {
        n: "01",
        title: "Source",
        text: "We choose ingredients from certified growers and test each delivery for purity.",
      },
      {
        n: "02",
        title: "Blend and test",
        text: "Small batches are mixed in our studio, then checked for stability and skin safety.",
      },
      {
        n: "03",
        title: "Fill and ship",
        text: "Products are packed in recycled glass or refill pouches and sent within 48 hours.",
      },
    ],
  },
} as const;
