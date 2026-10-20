"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { etaLabel, inr, validPin } from "@/lib/format";

type BP = { id: string; title: string; price: number; stock: number; images: string[] };
export function BuyBox({ p }: { p: BP }) {
  const { add, pin, setLoc } = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1), [draft, setDraft] = useState("");
  const out = p.stock < 1;
  const line = { id: p.id, title: p.title, price: p.price, image: p.images[0] };
  const check = async () => {
    if (!validPin(draft)) return;
    const j = await fetch(`/api/pincode/${draft}`).then((r) => r.json()).catch(() => ({}));
    setLoc(draft, j.city ?? "");
  };
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4 md:sticky md:top-32">
      <div className="price text-price font-bold">{inr(p.price)}</div>
      <p className="text-small text-slate-700">{pin ? etaLabel(pin, p.price) : "Enter your pincode to see the delivery date"}</p>
      <div className="flex gap-2">
        <input inputMode="numeric" maxLength={6} value={draft} placeholder={pin || "Pincode"}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))} className="h-control w-28 rounded-md border border-line px-3" />
        <button className="btn btn-ghost" onClick={check}>Check</button>
      </div>
      <p className={out ? "text-red-700" : p.stock <= 10 ? "text-amber-700" : "text-green-700"}>
        {out ? "Out of stock" : p.stock <= 10 ? `Only ${p.stock} left` : "In stock"}</p>
      <select aria-label="Quantity" value={qty} onChange={(e) => setQty(+e.target.value)} className="h-control rounded-md border border-line px-3">
        {Array.from({ length: Math.min(10, p.stock) }, (_, n) => <option key={n}>{n + 1}</option>)}
      </select>
      <button disabled={out} className="btn btn-cart btn-block" onClick={() => add(line, qty)}>Add to cart</button>
      <button disabled={out} className="btn btn-buy btn-block" onClick={() => { add(line, qty); router.push("/checkout"); }}>Buy now</button>
      <p className="text-caption text-slate-500">UPI, cards, NetBanking and Cash on Delivery accepted.</p>
    </div>
  );
}
