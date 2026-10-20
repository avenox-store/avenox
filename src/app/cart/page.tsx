"use client";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { items, setQty, remove } = useStore();
  const total = items.reduce((a, x) => a + x.price * x.qty, 0);
  const count = items.reduce((a, x) => a + x.qty, 0);
  if (!items.length)
    return (
      <div className="rounded-md bg-surface p-8 text-center shadow-card">
        <h1 className="text-h2 font-bold">Your cart is empty</h1>
        <Link href="/" className="btn btn-cart mt-4">Continue shopping</Link>
      </div>
    );
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-md bg-surface p-4 shadow-card">
        <h1 className="text-h2 font-bold">Shopping cart</h1>
        {items.map((x) => (
          <div key={x.id} className="flex gap-3 border-b border-line py-4">
            <img src={x.image} alt="" className="h-24 w-24 object-contain" />
            <div className="flex-1">
              <Link href={`/p/${x.id}`} className="line-clamp-2">{x.title}</Link>
              <p className="price font-bold">{inr(x.price)}</p>
              <div className="mt-2 flex items-center gap-3 text-small">
                <select aria-label="Quantity" value={x.qty} onChange={(e) => setQty(x.id, +e.target.value)} className="h-9 rounded-md border border-line px-2">
                  {Array.from({ length: 10 }, (_, n) => <option key={n}>{n + 1}</option>)}
                </select>
                <button onClick={() => remove(x.id)} className="flex items-center gap-1 text-teal-700"><Trash2 size={16} />Delete</button>
              </div>
            </div>
          </div>
        ))}
      </section>
      <aside className="h-fit space-y-3 rounded-md bg-surface p-4 shadow-card">
        <p>Subtotal ({count} items): <b className="price">{inr(total)}</b></p>
        <Link href="/checkout" className="btn btn-buy btn-block">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
