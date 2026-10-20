import Link from "next/link";
import { inr, pctOff } from "@/lib/format";
import { Stars } from "./Stars";

export type P = { id: string; title: string; price: number; mrp: number; images: string[]; avg_rating: number; rating_count: number };

export function ProductCard({ p }: { p: P }) {
  return (
    <Link href={`/p/${p.id}`} className="block w-44 shrink-0 snap-start rounded-md border border-line bg-surface p-3 shadow-card md:w-52">
      <img src={p.images[0]} alt="" loading="lazy" className="aspect-square w-full object-contain" />
      <h3 className="mt-2 line-clamp-2 text-small">{p.title}</h3>
      <div className="mt-1 flex items-center gap-1 text-caption text-slate-500"><Stars value={p.avg_rating} size={14} />({p.rating_count})</div>
      <div className="price mt-1"><b>{inr(p.price)}</b> <s className="text-caption text-slate-500">{inr(p.mrp)}</s>{" "}
        <span className="text-caption text-green-700">{pctOff(p.price, p.mrp)}% off</span></div>
    </Link>
  );
}

export function Rail({ title, items }: { title: string; items: P[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-md bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-h2 font-bold">{title}</h2>
      <div className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

export function Grid4({ title, items }: { title: string; items: P[] }) {
  if (items.length < 4) return null;
  return (
    <section className="rounded-md bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-h2 font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.slice(0, 4).map((p) => (
          <Link key={p.id} href={`/p/${p.id}`}>
            <img src={p.images[0]} alt={p.title} loading="lazy" className="aspect-square w-full object-contain" />
            <span className="line-clamp-1 text-caption">{p.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
