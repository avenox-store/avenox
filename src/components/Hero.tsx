"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { title: string; sub: string; href: string; bg: string };
export function Hero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5000); return () => clearInterval(t); }, [slides.length]);
  return (
    <div className="relative overflow-hidden rounded-md">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s) => (
          <Link key={s.title} href={s.href} className={`flex h-44 w-full shrink-0 flex-col justify-center px-6 text-white md:h-72 md:px-16 ${s.bg}`}>
            <h2 className="font-heading text-h1 font-bold md:text-display">{s.title}</h2><p className="mt-1">{s.sub}</p>
          </Link>
        ))}
      </div>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((s, n) => <button key={s.title} aria-label={`Slide ${n + 1}`} onClick={() => setI(n)}
          className={`h-2 w-2 rounded-full ${n === i ? "bg-white" : "bg-white/50"}`} />)}
      </div>
    </div>
  );
}
