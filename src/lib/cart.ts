import { FREE_SHIPPING_THRESHOLD_CENTS, MAX_LINE_QUANTITY } from "@/config/store";

/** What a cart line needs from the catalog; the data provider supplies it (`getVariantLines`). */
export type VariantLine = {
  variantId: number;
  slug: string;
  name: string;
  /** "Foundation · 30ml" */
  label: string;
  sku: string;
  image: string | null;
  unitCents: number;
  compareAtCents: number | null;
  /** Units that can still be bought. */
  available: number;
};

type CartLine = VariantLine & {
  quantity: number;
  lineCents: number;
};

export type CartView = {
  lines: CartLine[];
  /** Total units (the header badge). */
  count: number;
  subtotalCents: number;
  freeShippingThresholdCents: number;
  /** 0 once the threshold is reached. */
  remainingForFreeShippingCents: number;
};

export type CartError = {
  code: "not_found" | "out_of_stock" | "stock_limit" | "invalid_quantity";
  message: string;
  available?: number;
};

/** What the browser stores for a cart: only ids and quantities; prices and stock come from the provider. */
export type StoredCartItem = { variantId: number; quantity: number };

export const EMPTY_CART: CartView = {
  lines: [],
  count: 0,
  subtotalCents: 0,
  freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
  remainingForFreeShippingCents: FREE_SHIPPING_THRESHOLD_CENTS,
};

/** Joins the stored items with live catalog data; items whose product is gone drop out. */
export function buildCartView(items: StoredCartItem[], known: Map<number, VariantLine>): CartView {
  const lines: CartLine[] = items.flatMap((item) => {
    const v = known.get(item.variantId);
    if (!v) return [];
    return [
      {
        variantId: v.variantId,
        slug: v.slug,
        name: v.name,
        label: v.label,
        sku: v.sku,
        image: v.image,
        unitCents: v.unitCents,
        compareAtCents: v.compareAtCents,
        available: Math.max(0, v.available),
        quantity: item.quantity,
        lineCents: v.unitCents * item.quantity,
      },
    ];
  });
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);
  return {
    lines,
    count: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotalCents,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
    remainingForFreeShippingCents: Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents),
  };
}

/** Quantity rules (CRT-005): a whole number from 1 to the line limit, never beyond stock. */
export function checkQuantity(quantity: number, available: number): CartError | null {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
    return {
      code: "invalid_quantity",
      message: `Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`,
    };
  }
  if (available < 1) {
    return { code: "out_of_stock", message: "This item is out of stock.", available: 0 };
  }
  if (quantity > available) {
    return { code: "stock_limit", message: `Only ${available} left in stock.`, available };
  }
  return null;
}
