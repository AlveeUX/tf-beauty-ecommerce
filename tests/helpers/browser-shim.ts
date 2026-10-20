/**
 * Minimal browser globals so the demo-store modules (localStorage + window events) can run under Vitest's
 * node environment. Call `installBrowser()` in a `beforeEach` to start every test with empty storage.
 */
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

export function installBrowser(): void {
  const target = new EventTarget();
  const localStorage = new MemoryStorage();
  Object.assign(globalThis, {
    window: {
      localStorage,
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    },
  });
  Object.defineProperty(globalThis, "localStorage", { value: localStorage, configurable: true });
}
