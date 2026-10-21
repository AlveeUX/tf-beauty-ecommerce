import type { Bundle } from "@/components/home/BundleBuilder";
import { getProductsBySlugs } from "@/server/catalog/service";

/** What the design shows for an item when it differs from the catalog entry. */
type ItemOverride = {
  name?: string;
  label?: string;
  priceCents?: number;
  image?: string;
  /** Figma fill crop of the thumbnail: image height in % and offset from the top in %. */
  crop?: { height: number; top: number };
};

type BundleDefinition = {
  label: string;
  slugs: readonly string[];
  overrides?: Record<number, ItemOverride>;
};

/**
 * Curated bundles for the Home "Explore bundle" tabs (HOM-007, Figma 3:3364). Tab names come from the
 * design; the item choice is demo data until a buyer defines their own bundles. The first tab
 * carries the design's own item names and prices so it matches the frame ($26 + $39 + $45 = $110).
 */
const BUNDLE_DEFINITIONS: BundleDefinition[] = [
  {
    label: "Barely there",
    slugs: ["lift-and-define-brow-gel", "flush-cream-blush", "dew-drop-spray"],
    overrides: {
      0: { priceCents: 2600, label: "Brow Gel · 6ml", image: "/images/home/drops-1.jpg" },
      1: {
        priceCents: 3900,
        label: "Cream Blush · 7g",
        image: "/images/home/drops-2.jpg",
        crop: { height: 124.14, top: -17.26 },
      },
      2: {
        name: "Lift & define brow gel",
        priceCents: 4500,
        label: "Spray · 80ml",
        image: "/images/home/drops-3.jpg",
      },
    },
  },
  {
    label: "Fresh glow",
    slugs: ["glow-veil-highlighter", "glass-glow-primer", "silk-shine-lip-oil"],
  },
  {
    label: "Soft glam",
    slugs: ["luxe-matte-lipstick", "glam-edit-eyeshadow", "soft-sculpt-bronzer"],
  },
  {
    label: "Statement",
    slugs: ["velvet-skin-foundation", "precision-brow-pencil", "luxe-matte-lipstick"],
  },
];

const BUNDLE_DISCOUNT_PERCENT = 20;

export function getBundles(): Bundle[] {
  return BUNDLE_DEFINITIONS.map((def) => {
    const found = getProductsBySlugs([...def.slugs]);
    // keep the order of `slugs`
    const products = def.slugs.flatMap((slug, i) => {
      const p = found.find((f) => f.slug === slug);
      if (!p) return [];
      const o = def.overrides?.[i];
      return [
        {
          ...p,
          name: o?.name ?? p.name,
          label: o?.label ?? p.label,
          priceCents: o?.priceCents ?? p.priceCents,
          image: o?.image ?? p.image,
          imageCrop: o?.crop,
        },
      ];
    });
    return { label: def.label, products, discountPercent: BUNDLE_DISCOUNT_PERCENT };
  }).filter((b) => b.products.length === 3);
}
