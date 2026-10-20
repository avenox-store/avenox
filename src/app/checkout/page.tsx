"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { inr, validPin } from "@/lib/format";
import { payNow } from "@/client/pay";

const METHODS = [["upi", "UPI (GPay, PhonePe, Paytm, BHIM)"], ["card", "Credit / Debit card"],
  ["netbanking", "NetBanking"], ["cod", "Cash on Delivery"]] as const;
const inp = "h-control w-full rounded-md border border-line px-3";

export default function Checkout() {
  const { items, clear } = useStore();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ customer_name: "", phone: "", pincode: "", city: "", state: "", address: "" });
  const [method, setMethod] = useState<(typeof METHODS)[number][0]>("upi");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState("");
  const total = items.reduce((a, x) => a + x.price * x.qty, 0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const onPin = async (v: string) => {
    const pincode = v.replace(/\D/g, "").slice(0, 6);
    setF((s) => ({ ...s, pincode }));
    if (!validPin(pincode)) return;
    const j = await fetch(`/api/pincode/${pincode}`).then((r) => r.json()).catch(() => ({}));
    if (j.city) setF((s) => ({ ...s, city: j.city, state: j.state }));
  };
  const next = () => {
    if (f.customer_name.trim().length < 2) return setErr("Enter your full name");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setErr("Enter a valid 10-digit mobile number");
    if (!validPin(f.pincode) || !f.city || !f.state) return setErr("Enter a valid pincode, city and state");
    if (f.address.trim().length < 10) return setErr("Enter your full address");
    setErr(""); setStep(2);
  };
  const place = async () => {
    setBusy(true); setErr("");
    try {
      const r = (await payNow({ ...f, payment_method: method, items: items.map((i) => ({ product_id: i.id, quantity: i.qty })) })) as { order_number: string };
      clear(); setDone(r.order_number);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (done)
    return (
      <div className="rounded-md bg-surface p-8 text-center shadow-card">
        <h1 className="text-h2 font-bold text-green-700">Order placed</h1>
        <p className="mt-2">Your order number is <b>{done}</b>. Keep it with your mobile number to track delivery.</p>
        <Link href="/track-order" className="btn btn-cart mt-4">Track order</Link>
      </div>
    );
  if (!items.length) return <p className="rounded-md bg-surface p-8 text-center">Your cart is empty.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4 rounded-md bg-surface p-4 shadow-card">
        <ol className="flex gap-4 text-small font-semibold">
          <li className={step === 1 ? "text-teal-700" : "text-slate-500"}>1. Address</li>
          <li className={step === 2 ? "text-teal-700" : "text-slate-500"}>2. Payment</li>
        </ol>
        {step === 1 ? (
          <div className="space-y-3">
            <input className={inp} placeholder="Full name" autoComplete="name" value={f.customer_name} onChange={set("customer_name")} />
            <input className={inp} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} autoComplete="tel"
              value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
            <input className={inp} placeholder="Pincode" inputMode="numeric" autoComplete="postal-code" value={f.pincode} onChange={(e) => onPin(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inp} placeholder="City" value={f.city} onChange={set("city")} />
              <input className={inp} placeholder="State" value={f.state} onChange={set("state")} />
            </div>
            <textarea className={`${inp} h-24 py-2`} placeholder="Flat, house no., building, street, area" value={f.address} onChange={set("address")} />
            <button className="btn btn-buy btn-block" onClick={next}>Deliver to this address</button>
          </div>
        ) : (
          <div className="space-y-3">
            {METHODS.map(([v, l]) => (
              <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${method === v ? "border-2 border-teal-600 bg-teal-50" : "border-line"}`}>
                <input type="radio" name="pm" checked={method === v} onChange={() => setMethod(v)} />{l}
              </label>
            ))}
            <button disabled={busy} className="btn btn-buy btn-block" onClick={place}>
              {busy ? "Please wait…" : method === "cod" ? "Place order" : `Pay ${inr(total)}`}
            </button>
            <button className="text-small text-teal-700" onClick={() => setStep(1)}>Edit address</button>
          </div>
        )}
        {err && <p role="alert" className="text-small text-red-700">{err}</p>}
      </section>
      <aside className="h-fit space-y-2 rounded-md bg-surface p-4 text-small shadow-card">
        <h2 className="text-h3 font-bold">Order summary</h2>
        {items.map((x) => <p key={x.id} className="flex justify-between gap-2"><span className="line-clamp-1">{x.title} × {x.qty}</span><span className="price">{inr(x.price * x.qty)}</span></p>)}
        <p className="flex justify-between border-t border-line pt-2 text-body font-bold"><span>Total</span><span className="price">{inr(total)}</span></p>
        <p className="text-caption text-slate-500">Final prices are confirmed securely at checkout.</p>
      </aside>
    </div>
  );
}
