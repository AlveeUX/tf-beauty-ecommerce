import { connection } from "next/server";
import type { ReactNode } from "react";
import { Toaster } from "@/components/feedback/Toaster";
import { AuthProvider } from "@/components/account/AuthProvider";
import { getCurrentUser } from "@/server/auth/session";
import { ListsUiProvider } from "@/components/lists/ListsUi";
import { CartDrawer } from "./CartDrawer";
import { CartProvider } from "./CartProvider";

/** Cart state (kept in the browser), the cart drawer and toasts for every storefront page. */
export async function StoreProviders({ children }: { children: ReactNode }) {
  // The session cookie differs per visitor, so every page (including 404) renders per request (until TF1-T06).
  await connection();
  const user = await getCurrentUser();
  return (
    <AuthProvider initialUser={user}>
      <CartProvider>
        <ListsUiProvider>
          {children}
          <CartDrawer />
          <Toaster />
        </ListsUiProvider>
      </CartProvider>
    </AuthProvider>
  );
}
