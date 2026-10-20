"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { Stars } from "@/components/Stars";

type R = { id: string; user_name: string; rating: number; title: string | null; comment: string; images: string[]; verified: boolean; status: string; created_at: string; products: { title: string } | null };
const TABS = ["pending", "approved", "hidden"] as const;

export default function ReviewsAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [rows, setRows] = useState<R[]>([]), [draft, setDraft] = useState<Record<string, { title: string; comment: string }>>({});
  const load = async () => { const r = await adminFetch(`/api/admin/reviews?status=${tab}`); if (r.ok) setRows(r.body.data); };
  useEffect(() => { load(); }, [tab]); // eslint-disable-line
  const act = async (id: string, patch: object) => { await adminFetch(`/api/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); load(); };
  const d = (r: R) => draft[r.id] ?? { title: r.title ?? "", comment: r.comment };
  return (
    <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
      <div className="flex gap-2">{TABS.map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-small font-semibold capitalize ${tab === t ? "bg-navy-800 text-white" : "bg-slate-100"}`}>{t}</button>))}</div>
      {rows.length === 0 && <p className="text-small text-slate-500">Nothing here.</p>}
      {rows.map((r) => (
        <article key={r.id} className="space-y-2 border-b border-line pb-4">
          <p className="text-caption text-slate-500">{r.products?.title} · {r.user_name} · {new Date(r.created_at).toLocaleDateString("en-IN")}{r.verified ? " · Verified purchase" : ""}</p>
          <Stars value={r.rating} />
          <input className="h-control w-full rounded-md border border-line px-3" value={d(r).title} placeholder="Headline" onChange={(e) => setDraft({ ...draft, [r.id]: { ...d(r), title: e.target.value } })} />
          <textarea className="h-20 w-full rounded-md border border-line p-3 text-small" value={d(r).comment} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d(r), comment: e.target.value } })} />
          <div className="flex gap-2">{r.images.map((u) => (
            <div key={u} className="relative"><img src={u} alt="Review photo" className="h-16 w-16 rounded-sm border border-line object-cover" />
              <button aria-label="Remove photo" onClick={() => act(r.id, { images: r.images.filter((x) => x !== u) })} className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-700 text-caption text-white">×</button></div>))}</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={() => act(r.id, { title: d(r).title || null, comment: d(r).comment })}>Save edits</button>
            {r.status !== "approved" && <button className="btn btn-cart" onClick={() => act(r.id, { status: "approved", title: d(r).title || null, comment: d(r).comment })}>Approve</button>}
            {r.status !== "hidden" && <button className="btn btn-buy" onClick={() => act(r.id, { status: "hidden" })}>Hide</button>}
          </div>
        </article>
      ))}
    </section>
  );
}
