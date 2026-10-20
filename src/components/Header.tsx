"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, MapPin, ShoppingCart, X } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { validPin } from "@/lib/format";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "Haatly";
type Cat = { name: string; slug: string };
const NAV: [string, string][] = [["Today's Deals", "/s?deals=1"], ["Best Sellers", "/s?sort=rating"],
  ["Mobiles", "/s?cat=mobiles"], ["Fashion", "/s?cat=fashion"], ["Electronics", "/s?cat=electronics"]];

function PincodeModal({ onClose }: { onClose: () => void }) {
  const { setLoc } = useStore();
  const [pin, setPin] = useState(""), [msg, setMsg] = useState("");
  const apply = async () => {
    if (!validPin(pin)) return setMsg("Enter a valid 6-digit pincode");
    const j = await fetch(`/api/pincode/${pin}`).then((r) => r.json()).catch(() => ({}));
    if (!j.city) return setMsg("We couldn't find that pincode");
    setLoc(pin, j.city); onClose();
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 text-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-h3 font-bold">Choose your delivery location</h2>
        <p className="mt-1 text-small text-slate-500">Delivery options and dates depend on your pincode.</p>
        <div className="mt-4 flex gap-2">
          <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit pincode" className="h-control flex-1 rounded-md border border-line px-3" />
          <button className="btn btn-cart" onClick={apply}>Apply</button>
        </div>
        {msg && <p className="mt-2 text-small text-red-700">{msg}</p>}
      </div>
    </div>
  );
}

export function Header({ categories }: { categories: Cat[] }) {
  const { count, pin, city } = useStore();
  const [drawer, setDrawer] = useState(false), [modal, setModal] = useState(false);
  const loc = pin ? `${city} ${pin}` : "Select pincode";
  return (
    <>
      <header className="sticky top-0 z-50 text-white">
        <div className="flex h-header-m items-center gap-3 bg-header px-4 md:h-header md:gap-5">
          <button aria-label="Menu" className="md:hidden" onClick={() => setDrawer(true)}><Menu /></button>
          <Link href="/" aria-label={BRAND}><Logo /></Link>
          <button onClick={() => setModal(true)} className="hidden items-center gap-1 text-left text-small md:flex">
            <MapPin size={20} /><span><span className="block text-caption text-[#B6C2D9]">Deliver to</span>{loc}</span>
          </button>
          <div className="hidden flex-1 md:block"><SearchBar categories={categories} /></div>
          <Link href="/track-order" className="ml-auto hidden text-small md:block">Track order</Link>
          <Link href="/cart" aria-label="Cart" className="relative ml-auto md:ml-0">
            <ShoppingCart size={24} />
            {count > 0 && <b className="absolute -right-2 -top-2 rounded-full bg-buy px-1.5 text-caption">{count > 99 ? "99+" : count}</b>}
          </Link>
        </div>
        <div className="bg-header px-4 pb-2 md:hidden"><SearchBar categories={categories} /></div>
        <button onClick={() => setModal(true)} className="flex h-9 w-full items-center gap-1 bg-subnav px-4 text-small md:hidden">
          <MapPin size={16} />Deliver to {loc}
        </button>
        <nav className="hidden h-10 items-center gap-5 bg-subnav px-4 text-small md:flex">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-1 font-semibold"><Menu size={18} />All</button>
          {NAV.map(([l, h]) => <Link key={l} href={h} className="hover:underline">{l}</Link>)}
        </nav>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-[70] bg-navy-950/50" onClick={() => setDrawer(false)}>
          <aside className="h-full w-80 max-w-[85%] overflow-y-auto bg-white p-4 text-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-h3 font-bold">Shop by category</h2>
              <button aria-label="Close" onClick={() => setDrawer(false)}><X /></button></div>
            {categories.map((c) => (
              <Link key={c.slug} href={`/s?cat=${c.slug}`} onClick={() => setDrawer(false)}
                className="block border-b border-line py-3 text-body">{c.name}</Link>
            ))}
          </aside>
        </div>
      )}
      {modal && <PincodeModal onClose={() => setModal(false)} />}
    </>
  );
}
