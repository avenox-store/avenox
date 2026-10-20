"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { inr } from "@/lib/format";

type O = { id: string; order_number: string; customer_name: string; phone: string; address: string; city: string; state: string; pincode: string;
  total_amount: number; payment_method: string; payment_status: string; order_status: string; courier_name: string | null; awb_number: string | null;
  created_at: string; order_items: { id: string; title: string; quantity: number }[] };
const STATUSES = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const inp = "h-control w-full rounded-md border border-line px-3";
const label = (s: string) => s.replace(/_/g, " ");

function OrderCard({ o, onSaved }: { o: O; onSaved: () => void }) {
  const [f, setF] = useState({ order_status: o.order_status, courier_name: o.courier_name ?? "", awb_number: o.awb_number ?? "", location: "", note: "" });
  const [msg, setMsg] = useState("");
  const save = async () => {
    if (f.order_status === "cancelled" && !confirm("Cancel this order and return its stock?")) return;
    const body: Record<string, string> = { order_status: f.order_status };
    for (const k of ["courier_name", "awb_number", "location", "note"] as const) if (f[k].trim()) body[k] = f[k].trim();
    const r = await adminFetch(`/api/admin/orders/${o.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!r.ok) return setMsg(r.body?.error ?? "Update failed");
    setMsg("Updated. The customer's tracking page now shows this."); setF({ ...f, location: "", note: "" }); onSaved();
  };
  return (
    <article className="space-y-3 rounded-md border border-line p-3">
      <div className="flex flex-wrap justify-between gap-2 text-small">
        <b>{o.order_number}</b><span className="capitalize">{label(o.order_status)} · {o.payment_method.toUpperCase()} {label(o.payment_status)}</span>
        <b className="price">{inr(o.total_amount)}</b>
      </div>
      <p className="text-small text-slate-700">{o.customer_name} · {o.phone}<br />{o.address}, {o.city}, {o.state} {o.pincode}</p>
      <p className="text-caption text-slate-500">{o.order_items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}</p>
      {o.order_status !== "cancelled" && o.order_status !== "delivered" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={`${inp} capitalize`} value={f.order_status} onChange={(e) => setF({ ...f, order_status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
          <input className={inp} placeholder="Courier name" value={f.courier_name} onChange={(e) => setF({ ...f, courier_name: e.target.value })} />
          <input className={inp} placeholder="AWB tracking number" value={f.awb_number} onChange={(e) => setF({ ...f, awb_number: e.target.value })} />
          <input className={inp} placeholder="Location (optional)" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <input className={`${inp} sm:col-span-2`} placeholder="Update note shown to the customer (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="btn btn-cart sm:col-span-2" onClick={save}>Update order</button>
        </div>
      )}
      {msg && <p role="status" className="text-small text-slate-700">{msg}</p>}
    </article>
  );
}

export default function OrdersAdmin() {
  const [rows, setRows] = useState<O[]>([]), [status, setStatus] = useState("");
  const load = async () => { const r = await adminFetch(`/api/admin/orders?limit=50${status ? `&order_status=${status}` : ""}`); if (r.ok) setRows(r.body.data); };
  useEffect(() => { load(); }, [status]); // eslint-disable-line
  return (
    <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
      <select className={`${inp} capitalize sm:w-60`} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All orders</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      {rows.length === 0 && <p className="text-small text-slate-500">No orders.</p>}
      {rows.map((o) => <OrderCard key={o.id + o.order_status + o.awb_number} o={o} onSaved={load} />)}
    </section>
  );
}
