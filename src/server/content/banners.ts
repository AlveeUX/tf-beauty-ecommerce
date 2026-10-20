import { getProvider } from "@/data";

export type Banner = {
  id: number;
  slot: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string | null;
  data: Record<string, unknown>;
  endsAt: Date | null;
};

/**
 * Active banners for a content slot, in display order. A banner is shown only while
 * `is_active` is set and now is inside its optional [starts_at, ends_at) window (ACN-001, HOM-006).
 */
export const getBanners = (slot: string, now?: Date): Banner[] =>
  getProvider().getBanners(slot, now);
