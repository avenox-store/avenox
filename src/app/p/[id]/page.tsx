import { notFound } from "next/navigation";
import { sb } from "@/lib/supabase";
import { inr, pctOff } from "@/lib/format";
import { Stars } from "@/components/Stars";
import { Gallery } from "@/components/Gallery";
import { BuyBox } from "@/components/BuyBox";
import { ReviewForm } from "@/components/ReviewForm";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: p } = await sb.from("products")
    .select("id,title,description_bullets,price,mrp,stock,images,avg_rating,rating_count,rating_histogram")
    .eq("id", id).eq("is_active", true).maybeSingle();
  if (!p) notFound();
  const { data: reviews } = await sb.from("reviews").select("*").eq("product_id", id)
    .order("helpful_count", { ascending: false }).limit(10);
  const off = pctOff(p.price, p.mrp);
  const hist = p.rating_histogram as Record<string, number>;

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_4fr_3fr]">
      <Gallery images={p.images} alt={p.title} />
      <div className="space-y-3">
        <h1 className="font-heading text-h1 font-bold">{p.title}</h1>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-small">
            <b>{p.avg_rating}</b><Stars value={p.avg_rating} /><span className="text-teal-700 underline">{p.rating_count.toLocaleString("en-IN")} ratings</span>
          </summary>
          <div className="mt-2 w-72 space-y-1 rounded-md border border-line bg-surface p-3 shadow-pop">
            <p className="text-small font-semibold">{p.avg_rating} out of 5 stars</p>
            {[5, 4, 3, 2, 1].map((s) => {
              const pct = p.rating_count ? Math.round(((hist?.[s] ?? 0) / p.rating_count) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-small">
                  <span className="w-12 text-teal-700">{s} star</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-sm bg-slate-200"><div className="h-full bg-gold-500" style={{ width: `${pct}%` }} /></div>
                  <span className="w-9 text-right text-slate-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        </details>
        <hr className="border-line" />
        {off >= 40 && <span className="inline-block rounded-sm bg-coral-600 px-2 py-0.5 text-caption font-semibold text-white">Limited time deal</span>}
        <div className="price flex items-baseline gap-3">
          <span className="text-price font-bold">{inr(p.price)}</span>
          {off > 0 && <span className="text-h3 font-semibold text-coral-600">-{off}%</span>}
        </div>
        {off > 0 && <p className="text-small text-slate-500">M.R.P.: <s>{inr(p.mrp)}</s></p>}
        <ul className="list-disc space-y-1 pl-5 text-small text-slate-700">
          {p.description_bullets.map((b: string) => <li key={b}>{b}</li>)}
        </ul>
      </div>
      <BuyBox p={p} />

      <section id="reviews" className="space-y-4 lg:col-span-3">
        <h2 className="text-h2 font-bold">Customer reviews</h2>
        {(reviews ?? []).map((r) => (
          <article key={r.id} className="border-b border-line pb-4">
            <div className="flex items-center gap-2 text-small">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 font-semibold">{r.user_name[0]}</span>
              <b>{r.user_name}</b>
            </div>
            <div className="mt-1 flex items-center gap-2 text-small">
              <Stars value={r.rating} />
              <span className="text-caption text-slate-500">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              {r.verified && <span className="text-caption font-semibold text-coral-600">Verified Purchase</span>}
            </div>
            {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
            <p className="mt-1 text-small text-slate-700">{r.comment}</p>
            {r.images?.length > 0 && <div className="mt-2 flex gap-2">{r.images.map((u: string) => <img key={u} src={u} alt="Review photo" loading="lazy" className="h-16 w-16 rounded-sm border border-line object-cover" />)}</div>}
          </article>
        ))}
        {!reviews?.length && <p className="text-small text-slate-500">No reviews yet.</p>}
        <ReviewForm productId={p.id} />
      </section>
    </div>
  );
}
