import { sb } from "@/lib/supabase";
import { Hero, Slide } from "@/components/Hero";
import { Grid4, Rail, P } from "@/components/Cards";

export const revalidate = 300;
const COLS = "id,title,price,mrp,images,avg_rating,rating_count";
const SLIDES: Slide[] = [
  { title: "Festive deals are live", sub: "Up to 70% off across categories", href: "/s?deals=1", bg: "bg-navy-800" },
  { title: "Top rated picks", sub: "Loved by thousands of shoppers", href: "/s?sort=rating", bg: "bg-teal-800" },
  { title: "Pay your way", sub: "UPI, cards, NetBanking or Cash on Delivery", href: "/s", bg: "bg-coral-700" },
];

export default async function Home() {
  const get = (col: string) => sb.from("products").select(COLS).eq("is_active", true).gt("stock", 0)
    .order(col, { ascending: false }).limit(12).then((r) => (r.data ?? []) as P[]);
  const [newest, top] = await Promise.all([get("created_at"), get("avg_rating")]);
  const off = (p: P) => (p.mrp - p.price) / p.mrp;
  const deals = [...newest].sort((a, b) => off(b) - off(a));
  return (
    <>
      <Hero slides={SLIDES} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Grid4 title="Up to 70% off | Styles for you" items={deals.slice(0, 4)} />
        <Grid4 title="Deals of the Day" items={deals.slice(4, 8)} />
        <Grid4 title="Top rated products" items={top.slice(0, 4)} />
        <Grid4 title="New arrivals" items={newest.slice(0, 4)} />
      </div>
      <Rail title="Top rated products" items={top} />
      <Rail title="New arrivals" items={newest} />
    </>
  );
}
