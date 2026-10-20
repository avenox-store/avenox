"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { adminFetch } from "@/lib/admin-client";
import { inr } from "@/lib/format";

type Prod = { id?: string; title: string; description_bullets: string[]; price: number; mrp: number; stock: number; images: string[]; category_id: string | null; is_active: boolean };
const EMPTY: Prod = { title: "", description_bullets: [], price: 0, mrp: 0, stock: 0, images: [], category_id: null, is_active: true };
const inp = "h-control w-full rounded-md border border-line px-3";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function ProductsAdmin() {
  const [rows, setRows] = useState<(Prod & { id: string })[]>([]);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [q, setQ] = useState(""), [edit, setEdit] = useState<Prod | null>(null), [err, setErr] = useState("");
  const [bul, setBul] = useState(""), [imgs, setImgs] = useState("");

  const load = async () => { const r = await adminFetch(`/api/admin/products?limit=100&q=${encodeURIComponent(q)}`); if (r.ok) setRows(r.body.data); };
  useEffect(() => { load(); sb.from("categories").select("id,name").order("name").then(({ data }) => setCats(data ?? [])); }, []); // eslint-disable-line

  const open = (p: Prod) => { setEdit(p); setBul(p.description_bullets.join("\n")); setImgs(p.images.join("\n")); setErr(""); };
  const upload = async (files: FileList | null) => {
    const urls: string[] = [];
    for (const f of Array.from(files ?? [])) {
      const path = `${crypto.randomUUID()}.${f.name.split(".").pop()}`;
      const { error } = await sb.storage.from("product-images").upload(path, f, { contentType: f.type });
      if (error) return setErr("Image upload failed");
      urls.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setImgs((s) => [...lines(s), ...urls].join("\n"));
  };
  const save = async () => {
    if (!edit) return;
    const body = { title: edit.title, description_bullets: lines(bul), images: lines(imgs), price: Number(edit.price), mrp: Number(edit.mrp),
      stock: Math.floor(Number(edit.stock)), category_id: edit.category_id || null, is_active: edit.is_active };
    const r = await adminFetch(edit.id ? `/api/admin/products/${edit.id}` : "/api/admin/products", { method: edit.id ? "PATCH" : "POST", body: JSON.stringify(body) });
    if (!r.ok) return setErr(typeof r.body?.error === "string" ? r.body.error : "Check the fields and try again");
    setEdit(null); load();
  };
  const hide = async (id: string) => { if (confirm("Hide this product from the store?")) { await adminFetch(`/api/admin/products/${id}`, { method: "DELETE" }); load(); } };

  if (edit)
    return (
      <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
        <h1 className="text-h2 font-bold">{edit.id ? "Edit product" : "New product"}</h1>
        <input className={inp} placeholder="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
        <select className={inp} value={edit.category_id ?? ""} onChange={(e) => setEdit({ ...edit, category_id: e.target.value || null })}>
          <option value="">No category</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-3">
          {(["price", "mrp", "stock"] as const).map((k) => (
            <label key={k} className="text-caption uppercase text-slate-500">{k}
              <input className={inp} type="number" min={0} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value as unknown as number })} /></label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-small"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />Visible in store</label>
        <label className="block text-caption uppercase text-slate-500">Bullet specs (one per line)
          <textarea className="h-28 w-full rounded-md border border-line p-3 text-body normal-case" value={bul} onChange={(e) => setBul(e.target.value)} /></label>
        <label className="block text-caption uppercase text-slate-500">Image URLs (one per line, first is the main image)
          <textarea className="h-24 w-full rounded-md border border-line p-3 text-body normal-case" value={imgs} onChange={(e) => setImgs(e.target.value)} /></label>
        <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="text-small" />
        <div className="flex flex-wrap gap-2">{lines(imgs).map((u) => <img key={u} src={u} alt="" className="h-14 w-14 rounded-sm border border-line object-contain" />)}</div>
        {err && <p role="alert" className="text-small text-red-700">{err}</p>}
        <div className="flex gap-2"><button className="btn btn-cart" onClick={save}>Save</button><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
      </section>
    );
  return (
    <section className="space-y-3 rounded-md bg-surface p-4 shadow-card">
      <div className="flex gap-2">
        <input className={inp} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <button className="btn btn-ghost" onClick={load}>Search</button>
        <button className="btn btn-cart whitespace-nowrap" onClick={() => open(EMPTY)}>+ New</button>
      </div>
      {rows.map((p) => (
        <div key={p.id} className="flex items-center gap-3 border-b border-line py-2">
          <img src={p.images[0]} alt="" className="h-12 w-12 object-contain" />
          <div className="min-w-0 flex-1"><p className="line-clamp-1 text-small font-semibold">{p.title}</p>
            <p className="text-caption text-slate-500">{inr(p.price)} · stock {p.stock}{p.is_active ? "" : " · hidden"}</p></div>
          <button className="text-small text-teal-700" onClick={() => open(p)}>Edit</button>
          {p.is_active && <button className="text-small text-red-700" onClick={() => hide(p.id)}>Hide</button>}
        </div>
      ))}
    </section>
  );
}
