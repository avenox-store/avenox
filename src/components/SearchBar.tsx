"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { sb } from "@/lib/supabase";

type Cat = { name: string; slug: string };
export function SearchBar({ categories }: { categories: Cat[] }) {
  const r = useRouter();
  const [q, setQ] = useState(""), [cat, setCat] = useState(""), [open, setOpen] = useState(false), [i, setI] = useState(-1);
  const [hits, setHits] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      const { data } = await sb.rpc("suggest_products", { p_query: q });
      setHits(data ?? []); setI(-1);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (term = q) => { setOpen(false); r.push(`/s?q=${encodeURIComponent(term)}${cat ? `&cat=${cat}` : ""}`); };
  const key = (e: React.KeyboardEvent) => {
    const n = hits.length || 1;
    if (e.key === "ArrowDown") setI((i + 1) % n);
    else if (e.key === "ArrowUp") setI((i - 1 + n) % n);
    else if (e.key === "Enter") go(hits[i]?.title ?? q);
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative w-full" onBlur={() => setTimeout(() => setOpen(false), 120)}>
      <div className="flex h-control overflow-hidden rounded-full bg-white text-slate-900">
        <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}
          className="hidden w-36 bg-slate-100 px-3 text-small text-slate-700 md:block">
          <option value="">All</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <input role="combobox" aria-expanded={open} value={q} placeholder="Search products"
          className="min-w-0 flex-1 px-4 text-body outline-none"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={key} />
        {q && <button aria-label="Clear search" onClick={() => setQ("")} className="px-2 text-slate-500"><X size={18} /></button>}
        <button aria-label="Search" onClick={() => go()} className="bg-teal-700 px-4 text-white"><Search size={20} /></button>
      </div>
      {open && hits.length > 0 && (
        <ul role="listbox" className="absolute z-[60] mt-1 w-full rounded-md bg-white py-1 text-slate-900 shadow-pop">
          {hits.map((h, n) => (
            <li key={h.id} role="option" aria-selected={n === i} onMouseDown={() => go(h.title)}
              className={`cursor-pointer px-4 py-2 text-small ${n === i ? "bg-slate-100" : ""}`}>{h.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
