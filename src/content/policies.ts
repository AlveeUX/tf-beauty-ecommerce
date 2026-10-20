import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_COUNTRIES,
  SHIPPING_FLAT_RATE_CENTS,
} from "@/config/store";
import { formatMoney } from "@/lib/money";
import { site } from "@/config/site";

/**
 * Policy pages (CNT-006, Figma "Policy and privacy" 3:24059). Content is kept as data so the page template
 * stays generic; the admin "pages" screen (P9) will move it into the database.
 * Only the privacy text comes from the design. Shipping figures come from the store settings, returns from
 * the "Easy Returns" benefit card; the terms page is a stub that the store owner has to complete.
 */
export type PolicyBlock =
  | { type: "p"; text: string; muted?: boolean }
  | { type: "subhead"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "note"; label: string; text: string }
  | { type: "table"; headers: [string, string]; rows: [string, string][] };

export type PolicySection = {
  id: string;
  /** Short name in the "On this page" list. */
  toc: string;
  /** Heading in the text, numbered. */
  title: string;
  blocks: PolicyBlock[];
};

export type Policy = {
  slug: string;
  title: string;
  /** ISO date of the last change. */
  updated: string;
  intro: string;
  sections: PolicySection[];
  contact: { heading: string; lead: string; email: string };
};

const PRIVACY: Policy = {
  slug: "privacy",
  title: "Policy and privacy",
  updated: "2026-09-27",
  intro: `At ${site.name}, we respect your privacy and are committed to protecting the personal information you share with us. This policy explains what we collect, how we use it, and the choices you have.`,
  sections: [
    {
      id: "information-we-collect",
      toc: "Information We Collect",
      title: "1. Information we collect",
      blocks: [
        {
          type: "p",
          text: "We collect information you provide directly, as well as data gathered automatically when you use our site.",
        },
        { type: "subhead", text: "Information you provide" },
        {
          type: "ul",
          items: [
            "Name, email address, and shipping/billing details",
            "Payment information (processed securely by our payment partners)",
            "Account preferences and order history",
          ],
        },
        { type: "subhead", text: "Information collected automatically" },
        {
          type: "ul",
          items: [
            "IP address, browser type, and device information",
            "Pages visited and time spent on our site",
            "Cookies and similar tracking technologies",
          ],
        },
        {
          type: "note",
          label: "Note:",
          text: "We never collect sensitive health data beyond what you voluntarily share (e.g. skin type preferences) to personalize product recommendations.",
        },
      ],
    },
    {
      id: "how-we-use-your-information",
      toc: "How We Use Your Information",
      title: "2. How we use your information",
      blocks: [
        { type: "p", text: "We use the information we collect to:" },
        {
          type: "ol",
          items: [
            "Process and fulfill your orders",
            "Personalize product recommendations",
            "Send order updates and, if opted in, marketing communications",
            "Improve our website, products, and customer service",
            "Detect and prevent fraud or unauthorized activity",
          ],
        },
      ],
    },
    {
      id: "sharing-and-disclosure",
      toc: "Sharing & Disclosure",
      title: "3. Sharing and disclosure",
      blocks: [
        {
          type: "p",
          text: "We do not sell your personal information. We may share data with trusted third parties in the following circumstances:",
        },
        {
          type: "table",
          headers: ["Party", "Purpose"],
          rows: [
            ["Shipping carriers", "Order delivery"],
            ["Payment processors", "Secure transaction handling"],
            ["Marketing platforms", "Email & ad personalization (opt-in only)"],
            ["Legal authorities", "When required by law"],
          ],
        },
      ],
    },
    {
      id: "your-rights-and-choices",
      toc: "Your Rights & Choices",
      title: "4. Your rights and choices",
      blocks: [
        { type: "p", text: "Depending on your location, you may have the right to:" },
        {
          type: "ul",
          items: [
            "Access, correct, or delete your personal data",
            "Opt out of marketing communications at any time",
            "Request a copy of the data we hold about you",
            "Withdraw consent for data processing",
          ],
        },
        { type: "p", text: "To exercise any of these rights, contact us using the details below." },
      ],
    },
    {
      id: "data-security",
      toc: "Data Security",
      title: "5. Data security",
      blocks: [
        {
          type: "p",
          text: "We use industry-standard encryption and access controls to protect your information. While no method of transmission is 100% secure, we continuously review our practices to keep your data safe.",
        },
        {
          type: "p",
          muted: true,
          text: 'This policy may be updated periodically. Material changes will be posted on this page with a revised "last updated" date.',
        },
      ],
    },
  ],
  contact: {
    heading: "Questions about this policy?",
    lead: "Email us at",
    email: site.contact.emails.privacy,
  },
};

const SHIPPING: Policy = {
  slug: "shipping",
  title: "Shipping",
  updated: "2026-10-20",
  intro: "How much delivery costs, where we ship and how you can follow your order.",
  sections: [
    {
      id: "rates",
      toc: "Shipping Rates",
      title: "1. Shipping rates",
      blocks: [
        {
          type: "p",
          text: `Orders of ${formatMoney(FREE_SHIPPING_THRESHOLD_CENTS, "full")} or more ship free. For smaller orders a flat shipping fee of ${formatMoney(SHIPPING_FLAT_RATE_CENTS, "full")} applies. The cost is shown in your order summary before you pay.`,
        },
      ],
    },
    {
      id: "countries",
      toc: "Where We Ship",
      title: "2. Where we ship",
      blocks: [
        { type: "p", text: "We currently deliver to:" },
        { type: "ul", items: [...SHIPPING_COUNTRIES] },
      ],
    },
    {
      id: "tracking",
      toc: "Tracking Your Order",
      title: "3. Tracking your order",
      blocks: [
        {
          type: "p",
          text: "Enter your order ID and the email address you used at checkout on the Track order page to see where your order is. Once it has shipped you will also see the carrier and tracking number there.",
        },
      ],
    },
  ],
  contact: {
    heading: "Need help with a delivery?",
    lead: "Email us at",
    email: site.contact.emails.support,
  },
};

const RETURNS: Policy = {
  slug: "returns",
  title: "Returns",
  updated: "2026-10-20",
  intro: "Not the right fit? Here is how returns work.",
  sections: [
    {
      id: "eligibility",
      toc: "What Can Be Returned",
      title: "1. What can be returned",
      blocks: [
        {
          type: "p",
          text: `You can return eligible, unopened products within ${site.commerce.returnWindowDays} days of delivery.`,
        },
      ],
    },
    {
      id: "how-to-return",
      toc: "How To Return",
      title: "2. How to return an item",
      blocks: [
        {
          type: "p",
          text: "Contact us with your order ID and the email address you used at checkout and we will tell you how to send the product back.",
        },
      ],
    },
  ],
  contact: {
    heading: "Questions about a return?",
    lead: "Email us at",
    email: site.contact.emails.support,
  },
};

const TERMS: Policy = {
  slug: "terms",
  title: "Terms and conditions",
  updated: "2026-10-20",
  intro:
    "These terms describe how orders on this website work. The store owner still has to complete this page before the shop opens.",
  sections: [
    {
      id: "orders",
      toc: "Orders",
      title: "1. Orders",
      blocks: [
        {
          type: "p",
          text: "An order is accepted when you receive an order ID after checkout. Prices are shown in US dollars and the total, including shipping, is shown before you pay.",
        },
      ],
    },
    {
      id: "payment",
      toc: "Payment",
      title: "2. Payment",
      blocks: [
        {
          type: "p",
          text: "Orders paid by bank transfer or check are shipped once the payment has cleared. Orders paid in cash are paid on delivery.",
        },
      ],
    },
    {
      id: "privacy",
      toc: "Your Data",
      title: "3. Your data",
      blocks: [
        { type: "p", text: "How we handle your personal data is described in our privacy policy." },
      ],
    },
  ],
  contact: {
    heading: "Questions about these terms?",
    lead: "Email us at",
    email: site.contact.emails.support,
  },
};

export const POLICIES: Record<string, Policy> = {
  privacy: PRIVACY,
  shipping: SHIPPING,
  returns: RETURNS,
  terms: TERMS,
};

export const getPolicy = (slug: string): Policy | null =>
  Object.hasOwn(POLICIES, slug) ? (POLICIES[slug] ?? null) : null;
