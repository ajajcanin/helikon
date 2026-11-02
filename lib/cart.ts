"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CartLine = { variantId: number; qty: number };

const KEY = "hk_cart_v2";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((l) => Number.isInteger(l?.variantId) && Number.isInteger(l?.qty) && l.qty > 0)
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache as CartLine[];
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private windows can refuse storage: the cart still works until the page closes.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The cart only remembers what and how many. Prices and stock always come from the server. */
export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const add = useCallback((variantId: number, qty: number) => {
    const current = read();
    const found = current.find((l) => l.variantId === variantId);
    write(
      found
        ? current.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty + qty } : l))
        : [...current, { variantId, qty }],
    );
  }, []);
  const setQty = useCallback((variantId: number, qty: number) => {
    write(
      qty > 0
        ? read().map((l) => (l.variantId === variantId ? { ...l, qty } : l))
        : read().filter((l) => l.variantId !== variantId),
    );
  }, []);
  const clear = useCallback(() => write([]), []);
  return { lines, add, setQty, clear, count: lines.reduce((sum, l) => sum + l.qty, 0) };
}
