import { beforeEach, describe, expect, it } from "vitest";
import { readStore, removeStore, writeStore } from "../../src/lib/demo-store/storage";
import { installBrowser } from "../helpers/browser-shim";

// TF4-T05: in a third-party frame Safari (and Chrome with blocked cookies) refuses localStorage. The shop must still
// keep the cart for the page view, because the live preview is shown inside such a frame.
function blockStorage() {
  const refuse = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  Object.defineProperty(window, "localStorage", { get: refuse, configurable: true });
}

describe("demo store with working storage", () => {
  beforeEach(() => installBrowser());

  it("round-trips a value and clears it", () => {
    writeStore("cart", [{ variantId: 1, quantity: 2 }]);
    expect(readStore("cart", [])).toEqual([{ variantId: 1, quantity: 2 }]);
    removeStore("cart");
    expect(readStore("cart", [])).toEqual([]);
  });
});

describe("demo store with storage blocked", () => {
  beforeEach(() => {
    installBrowser();
    blockStorage();
  });

  it("reads the fallback when nothing was written", () => {
    expect(readStore("cart-blocked-empty", ["fallback"])).toEqual(["fallback"]);
  });

  it("keeps what was written for the rest of the page view", () => {
    writeStore("cart-blocked", [{ variantId: 7, quantity: 1 }]);
    expect(readStore("cart-blocked", [])).toEqual([{ variantId: 7, quantity: 1 }]);
  });

  it("returns the same object on every read (useSyncExternalStore needs a stable snapshot)", () => {
    writeStore("cart-stable", [{ variantId: 3, quantity: 1 }]);
    expect(readStore("cart-stable", [])).toBe(readStore("cart-stable", []));
  });

  it("forgets a removed value", () => {
    writeStore("cart-removed", [1]);
    removeStore("cart-removed");
    expect(readStore("cart-removed", [])).toEqual([]);
  });
});
