"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildCartView,
  checkQuantity,
  type CartView,
  type StoredCartItem,
  type VariantLine,
} from "@/lib/cart";
import { notify } from "@/lib/notify";
import { readStore, useHydrated, useStore, writeStore } from "@/lib/demo-store/storage";

type CartContextValue = {
  cart: CartView;
  /** False until the stored cart has been matched with catalog data (avoids a flash of "empty"). */
  ready: boolean;
  /** True while catalog data is being fetched (buttons show a busy state). */
  busy: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Add one or more units of a product's default variant (or a specific variant). */
  add: (
    target: { slug?: string; variantId?: number; name?: string },
    quantity?: number,
    options?: { openDrawer?: boolean },
  ) => Promise<boolean>;
  /** Add several products and open the drawer once (the Home bundle). */
  addMany: (slugs: string[]) => Promise<boolean>;
  setQuantity: (variantId: number, quantity: number) => Promise<boolean>;
  remove: (variantId: number) => Promise<void>;
  clear: () => Promise<void>;
  /** Re-read prices and stock; resolves with the up-to-date cart. */
  refresh: () => Promise<CartView>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}

export const CART_KEY = "cart";
const NO_ITEMS: StoredCartItem[] = [];
/** The stored cart right now (handlers read it fresh, so two quick adds never overwrite each other). */
const readItems = () => readStore<StoredCartItem[]>(CART_KEY, NO_ITEMS);

async function fetchLines(query: string): Promise<VariantLine[] | null> {
  try {
    const response = await fetch(`/api/variants?${query}`, { cache: "no-store" });
    if (!response.ok) return [];
    return ((await response.json()) as { lines: VariantLine[] }).lines;
  } catch {
    return null; // offline: keep what we know
  }
}

/**
 * Cart state for the whole storefront (demo mode). The cart is just ids and quantities in the browser;
 * prices and stock are read from the data provider through `/api/variants`, and stock limits are enforced
 * here (CRT-005). Replace this provider with calls to your own cart API to go live.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useStore<StoredCartItem[]>(CART_KEY, NO_ITEMS);
  const [known, setKnown] = useState<Map<number, VariantLine>>(() => new Map());
  const [attempted, setAttempted] = useState<Set<number>>(() => new Set());
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inflight = useRef(0);
  const knownRef = useRef(known);
  useEffect(() => {
    knownRef.current = known;
  }, [known]);

  const remember = useCallback((lines: VariantLine[], asked: number[] = []) => {
    setKnown((previous) => {
      const next = new Map(previous);
      for (const line of lines) next.set(line.variantId, line);
      return next;
    });
    setAttempted((previous) => new Set([...previous, ...asked, ...lines.map((l) => l.variantId)]));
  }, []);

  const track = useCallback(async <T,>(work: () => Promise<T>): Promise<T> => {
    inflight.current += 1;
    setBusy(true);
    try {
      return await work();
    } finally {
      inflight.current -= 1;
      if (inflight.current === 0) setBusy(false);
    }
  }, []);

  const load = useCallback(
    async (ids: number[]): Promise<VariantLine[]> => {
      if (ids.length === 0) return [];
      const lines = await fetchLines(ids.map((id) => `variant=${id}`).join("&"));
      if (lines) remember(lines, ids);
      return lines ?? [];
    },
    [remember],
  );

  // Fetch catalog data for any stored item we have not seen yet.
  const idsKey = items.map((i) => i.variantId).join(",");
  useEffect(() => {
    if (!hydrated) return;
    const missing = readItems()
      .map((i) => i.variantId)
      .filter((id) => !knownRef.current.has(id) && !attempted.has(id));
    void load(missing);
  }, [hydrated, idsKey, attempted, load]);

  const refresh = useCallback(async () => {
    const lines = await load(readItems().map((i) => i.variantId));
    // a product that vanished is no longer in `lines`, so it must not stay in the view
    const fresh = new Map(lines.map((l) => [l.variantId, l]));
    return buildCartView(readItems(), fresh.size > 0 ? fresh : knownRef.current);
  }, [load]);

  // Back/forward cache and other tabs: re-read prices and stock when the page becomes visible again.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const save = (next: StoredCartItem[]) => writeStore(CART_KEY, next);

  const add = useCallback<CartContextValue["add"]>(
    (target, quantity = 1, options) =>
      track(async () => {
        const query =
          target.variantId !== undefined
            ? `variant=${target.variantId}`
            : `slug=${encodeURIComponent(target.slug ?? "")}`;
        const fetched = await fetchLines(query);
        if (fetched === null) {
          notify("Could not reach the shop. Check your connection and try again.", "error");
          return false;
        }
        const line = fetched[0];
        if (!line) {
          notify("Product not found.", "error");
          return false;
        }
        remember([line]);
        const current = readItems().find((i) => i.variantId === line.variantId)?.quantity ?? 0;
        const error = checkQuantity(current + quantity, line.available);
        if (error) {
          notify(error.message, "error");
          return false;
        }
        const rest = readItems().filter((i) => i.variantId !== line.variantId);
        const existing = readItems().find((i) => i.variantId === line.variantId);
        // a line keeps its place in the cart when its quantity changes
        save(
          existing
            ? readItems().map((i) =>
                i.variantId === line.variantId ? { ...i, quantity: current + quantity } : i,
              )
            : [...rest, { variantId: line.variantId, quantity }],
        );
        if (options?.openDrawer !== false) setDrawerOpen(true);
        return true;
      }),
    [remember, track],
  );

  const addMany = useCallback<CartContextValue["addMany"]>(
    async (slugs) => {
      let allOk = true;
      for (const slug of slugs) {
        // one lookup per product keeps each stock check independent
        allOk = (await add({ slug }, 1, { openDrawer: false })) && allOk;
      }
      setDrawerOpen(true);
      return allOk;
    },
    [add],
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (variantId, quantity) =>
      track(async () => {
        if (!readItems().some((i) => i.variantId === variantId)) {
          notify("That item is not in your cart.", "error");
          return false;
        }
        let line = knownRef.current.get(variantId);
        if (!line) {
          line = (await fetchLines(`variant=${variantId}`))?.[0];
          if (line) remember([line]);
        }
        const error = checkQuantity(quantity, line?.available ?? 0);
        if (error) {
          notify(error.message, "error");
          return false;
        }
        save(readItems().map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
        return true;
      }),
    [remember, track],
  );

  const remove = useCallback<CartContextValue["remove"]>(async (variantId) => {
    save(readItems().filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(async () => {
    save([]);
  }, []);

  const cart = useMemo(() => buildCartView(items, known), [items, known]);
  const ready =
    hydrated && items.every((i) => known.has(i.variantId) || attempted.has(i.variantId));

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      busy,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      addMany,
      setQuantity,
      remove,
      clear,
      refresh,
    }),
    [cart, ready, busy, drawerOpen, add, addMany, setQuantity, remove, clear, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
