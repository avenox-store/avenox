"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Line = { id: string; title: string; price: number; image?: string; qty: number };
type S = {
  items: Line[]; count: number; pin: string; city: string;
  add: (l: Omit<Line, "qty">, qty: number) => void;
  setQty: (id: string, qty: number) => void; remove: (id: string) => void; clear: () => void;
  setLoc: (pin: string, city: string) => void;
};
const Ctx = createContext<S>(null!);
export const useStore = () => useContext(Ctx);
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Line[]>([]);
  const [loc, setLocState] = useState({ pin: "", city: "" });
  const [ready, setReady] = useState(false);
  useEffect(() => { setItems(load("cart", [])); setLocState(load("loc", { pin: "", city: "" })); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem("cart", JSON.stringify(items)); }, [items, ready]);

  const add: S["add"] = (l, qty) =>
    setItems((cur) => cur.some((x) => x.id === l.id)
      ? cur.map((x) => (x.id === l.id ? { ...x, qty: Math.min(10, x.qty + qty) } : x))
      : [...cur, { ...l, qty }]);
  const setLoc: S["setLoc"] = (pin, city) => { setLocState({ pin, city }); localStorage.setItem("loc", JSON.stringify({ pin, city })); };

  const setQty: S["setQty"] = (id, qty) => setItems((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x)));
  const remove: S["remove"] = (id) => setItems((c) => c.filter((x) => x.id !== id));
  const clear = () => setItems([]);

  return <Ctx.Provider value={{ items, count: items.reduce((a, x) => a + x.qty, 0), add, setQty, remove, clear, setLoc, ...loc }}>{children}</Ctx.Provider>;
}
