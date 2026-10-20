"use client";
import { useState } from "react";

const STEPS = ["Ordered", "Shipped", "Out for delivery", "Delivered"];
const IDX: Record<string, number> = { placed: 0, confirmed: 0, shipped: 1, out_for_delivery: 2, delivered: 3 };
type Ev = { status: string; at: string; note?: string; location?: string };
type T = { order_number: string; order_status: string; courier_name?: string; awb_number?: string; estimated_delivery?: string;
  tracking_events: Ev[]; items: { title: string; quantity: number }[] };
const fmt = (d: string, long = false) => new Date(d).toLocaleString("en-IN", long
  ? { weekday: "long", day: "numeric", month: "short" } : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function TrackOrder() {
  const [order_number, setO] = useState(""), [phone, setP] = useState("");
  const [t, setT] = useState<T | null>(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr(""); setT(null);
    const r = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_number, phone }) });
    const j = await r.json(); setBusy(false);
    r.ok ? setT(j) : setErr(j.error);
  };
  const step = t ? IDX[t.order_status] ?? 0 : 0;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
        <h1 className="text-h2 font-bold">Track your order</h1>
        <input className="h-control w-full rounded-md border border-line px-3" placeholder="Order ID (e.g. ORD-1001)" value={order_number} onChange={(e) => setO(e.target.value)} />
        <input className="h-control w-full rounded-md border border-line px-3" placeholder="Mobile number used at checkout" inputMode="numeric" maxLength={10}
          value={phone} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} />
        <button disabled={busy} className="btn btn-cart btn-block" onClick={go}>{busy ? "Checking…" : "Track"}</button>
        {err && <p role="alert" className="text-small text-red-700">{err}</p>}
      </section>
      {t && (
        <section className="space-y-5 rounded-md bg-surface p-4 shadow-card">
          <div className="flex flex-wrap justify-between gap-2 text-small">
            <b>{t.order_number}</b>
            {t.estimated_delivery && t.order_status !== "delivered" && t.order_status !== "cancelled" &&
              <span>Arriving by <b>{fmt(t.estimated_delivery, true)}</b></span>}
          </div>
          {t.order_status === "cancelled" ? <p className="font-semibold text-red-700">This order was cancelled.</p> : (
            <ol className="flex items-start">
              {STEPS.map((s, n) => (
                <li key={s} className="relative flex-1 text-center text-caption">
                  {n > 0 && <span className={`absolute right-1/2 top-3 h-1 w-full ${n <= step ? "bg-teal-700" : "bg-slate-200"}`} />}
                  <span className={`relative mx-auto grid h-7 w-7 place-items-center rounded-full text-white ${n <= step ? "bg-teal-700" : "bg-slate-300"} ${n === step ? "ring-4 ring-teal-100" : ""}`}>{n <= step ? "✓" : n + 1}</span>
                  <span className={`mt-1 block ${n <= step ? "font-semibold" : "text-slate-500"}`}>{s}</span>
                </li>
              ))}
            </ol>
          )}
          {(t.courier_name || t.awb_number) && (
            <p className="rounded-md bg-slate-100 p-3 text-small">Courier: <b>{t.courier_name ?? "—"}</b> · AWB: <b>{t.awb_number ?? "—"}</b></p>
          )}
          <ul className="space-y-3 border-l-2 border-line pl-4">
            {[...t.tracking_events].reverse().map((e, n) => (
              <li key={n} className="text-small">
                <b className="capitalize">{e.status.replace(/_/g, " ")}</b>{e.location ? ` · ${e.location}` : ""}
                <span className="block text-caption text-slate-500">{fmt(e.at)}{e.note ? ` · ${e.note}` : ""}</span>
              </li>
            ))}
          </ul>
          <p className="text-caption text-slate-500">{t.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}</p>
        </section>
      )}
    </div>
  );
}
