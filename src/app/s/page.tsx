import { sb } from "@/lib/supabase";
import { ProductCard, P } from "@/components/Cards";
import { pctOff } from "@/lib/format";

type SP = { q?: string; cat?: string; sort?: string; deals?: string };
export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { data } = await sb.rpc("search_products", { p_query: sp.q ?? "", p_category_slug: sp.cat ?? null, p_limit: 60 });
  let items = (data ?? []) as P[];
  if (sp.deals) items = items.filter((p) => pctOff(p.price, p.mrp) >= 30).sort((a, b) => pctOff(b.price, b.mrp) - pctOff(a.price, a.mrp));
  if (sp.sort === "rating") items = [...items].sort((a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count);
  return (
    <section className="rounded-md bg-surface p-4 shadow-card">
      <h1 className="text-h2 font-bold">{sp.q ? `Results for “${sp.q}”` : "Products"}</h1>
      <p className="mb-3 text-small text-slate-500">{items.length} results</p>
      {items.length === 0 && <p>No products found. Try a different search.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&_a]:w-full">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
