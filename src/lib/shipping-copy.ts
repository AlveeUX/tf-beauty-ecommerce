import { site } from "@/config/site";
import { formatMoney } from "@/lib/money";

/** The free-shipping threshold written the way the shop shows it, e.g. "$100". */
export const freeShippingFrom = () => formatMoney(site.commerce.freeShippingThresholdCents);

/** The sentence in the announcement bar above both headers. */
export const freeShippingAnnouncement = () =>
  `Complimentary shipping on orders over ${freeShippingFrom()}`;
