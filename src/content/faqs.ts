import { SHIPPING_COUNTRIES } from "@/config/store";
import type { IconName } from "@/components/ui/Icon";
import { site } from "@/config/site";

/**
 * FAQs (CNT-004, Figma "FAQs" 3:27601 and the Contact page list). The questions and the first shipping
 * answer are the design's; the other answers are written from the store's own rules (returns, shipping,
 * payment methods, checkout) and are demo copy for buyers to replace.
 */
export type Faq = { id: string; q: string; a: string };
export type FaqCategory = {
  id: string;
  /** Tab text in the sidebar. */
  tab: string;
  title: string;
  icon: IconName;
  items: Faq[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "orders-shipping",
    tab: "Orders & Shipping",
    title: "Orders & shipping",
    icon: "package",
    items: [
      {
        id: "shipping-time",
        q: "How long does shipping take?",
        a: "Orders ship within 1–2 business days and typically arrive within 3–5 business days in the US and a little longer for other countries. Once your order is on its way, you’ll receive a tracking link by email so you can easily follow.",
      },
      {
        id: "change-cancel",
        q: "Can I change or cancel my order?",
        a: "Contact us with your order ID as soon as you can. An order that has not shipped yet can be changed or cancelled.",
      },
      {
        id: "international",
        q: "Do you ship internationally?",
        a: `We currently deliver to: ${SHIPPING_COUNTRIES.join(", ")}.`,
      },
      {
        id: "tracking-delivered",
        q: "My tracking says delivered but I don't have it",
        a: "Check with neighbours and around your delivery address first. If it still has not turned up, contact us with your order ID and we will look into it.",
      },
    ],
  },
  {
    id: "returns-refunds",
    tab: "Returns & Refunds",
    title: "Returns & refunds",
    icon: "rotate",
    items: [
      {
        id: "return-policy",
        q: "What's your return policy?",
        a: `You can return eligible, unopened products within ${site.commerce.returnWindowDays} days of delivery.`,
      },
      {
        id: "start-return",
        q: "How do I start a return?",
        a: "Contact us with your order ID and the email address you used at checkout and we will tell you how to send the product back.",
      },
      {
        id: "damaged",
        q: "My product arrived damaged or wrong — now what?",
        a: "We are sorry. Contact us with your order ID and a photo of the product and the packaging, and we will make it right.",
      },
      {
        id: "refund-time",
        q: "How long do refunds take?",
        a: "We will email you as soon as your refund has been issued. How long it takes to reach you depends on how you paid.",
      },
    ],
  },
  {
    id: "skin-ingredients",
    tab: "Skin & Ingredients",
    title: "Skin & Ingredients",
    icon: "mortar",
    items: [
      {
        id: "sensitive-skin",
        q: "Are your products suitable for sensitive skin?",
        a: "Our in-house chemists work alongside skin specialists, and each product goes through patch testing for sensitive skin before launch.",
      },
      {
        id: "cruelty-free",
        q: "Are your products cruelty-free and vegan?",
        a: "Our formulas are cruelty free. The full list of ingredients is on every product page, so you can check what suits you.",
      },
      {
        id: "skin-type",
        q: "How do I know which products are right for my skin type?",
        a: "Our beauty support team is happy to help you choose. Contact us and tell us a little about your skin.",
      },
      {
        id: "ingredient-origins",
        q: "Where do your ingredients come from?",
        a: "We choose ingredients from certified growers and test each delivery for purity.",
      },
    ],
  },
  {
    id: "account-payments",
    tab: "Account & Payments",
    title: "Account & Payments",
    icon: "user-circle",
    items: [
      {
        id: "payment-methods",
        q: "What payment methods do you accept?",
        a: "At checkout you can pay by direct bank transfer, cash on delivery or check. Orders paid by bank transfer or check ship once the payment has cleared.",
      },
      {
        id: "subscription",
        q: "How do I cancel or edit my subscription?",
        a: "Subscriptions are not available yet. Every order is a one-time purchase.",
      },
      {
        id: "payment-secure",
        q: "Is my payment information secure?",
        a: "We never store card details on this website, and your personal data is handled as described in our privacy policy.",
      },
      {
        id: "forgot-password",
        q: "I forgot my password, how do I reset it?",
        a: "Choose “Lost your password” on the login page, enter your user name or email address, and we will send you a link to choose a new one.",
      },
    ],
  },
];

/** Questions shown on the Contact page (Figma 3:27361): four from the FAQs plus one that only appears here. */
export const CONTACT_FAQS: Faq[] = [
  ...["shipping-time", "return-policy", "damaged", "skin-type"].map((id) =>
    FAQ_CATEGORIES.flatMap((c) => c.items).find((f) => f.id === id)!,
  ),
  {
    id: "wholesale",
    q: "Do you offer wholesale or stockist accounts?",
    a: "Get in touch using the form above and choose “Wholesale and stockists” as the topic. We will come back to you and tell you what is possible.",
  },
];
