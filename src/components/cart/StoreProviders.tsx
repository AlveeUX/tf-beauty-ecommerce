import type { ReactNode } from "react";
import { Toaster } from "@/components/feedback/Toaster";
import { ListsUiProvider } from "@/components/lists/ListsUi";
import { CartDrawer } from "./CartDrawer";
import { CartProvider } from "./CartProvider";

/** Cart state (kept in the browser), the cart drawer and toasts for every storefront page. */
export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ListsUiProvider>
        {children}
        <CartDrawer />
        <Toaster />
      </ListsUiProvider>
    </CartProvider>
  );
}
