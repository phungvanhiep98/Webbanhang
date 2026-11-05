"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  variant?: string;
  qty: number;
};

type Ctx = {
  lines: CartLine[];
  add: (l: CartLine) => void;
  setQty: (i: number, qty: number) => void;
  remove: (i: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);
  const save = (next: CartLine[]) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };
  const value: Ctx = {
    lines,
    add: (l) => {
      const i = lines.findIndex((x) => x.productId === l.productId && x.variant === l.variant);
      if (i >= 0) save(lines.map((x, j) => (j === i ? { ...x, qty: x.qty + l.qty } : x)));
      else save([...lines, l]);
    },
    setQty: (i, qty) => save(lines.map((x, j) => (j === i ? { ...x, qty: Math.max(1, qty) } : x))),
    remove: (i) => save(lines.filter((_, j) => j !== i)),
    clear: () => save([]),
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export function CartBadge() {
  const { count } = useCart();
  return <span className="badge">{count}</span>;
}
