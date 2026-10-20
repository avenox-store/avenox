"use client";
import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [origin, setOrigin] = useState<string | null>(null);
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="flex gap-2 overflow-x-auto md:flex-col">
        {images.map((src, n) => (
          <button key={src} onMouseEnter={() => setI(n)} onClick={() => setI(n)}
            className={`h-16 w-16 shrink-0 rounded-sm bg-white p-1 ${n === i ? "border-2 border-teal-600" : "border border-line"}`}>
            <img src={src} alt="" className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
      <div className="relative aspect-square flex-1 overflow-hidden rounded-md bg-white"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
        onMouseLeave={() => setOrigin(null)}>
        <img src={images[i]} alt={alt} className="h-full w-full object-contain"
          style={origin ? { transformOrigin: origin, transform: "scale(2)" } : undefined} />
      </div>
    </div>
  );
}
