export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const w = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span aria-label={`${value} out of 5 stars`} className="relative inline-block leading-none" style={{ fontSize: size }}>
      <span className="text-slate-300">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-gold-500" style={{ width: `${w}%` }}>★★★★★</span>
    </span>
  );
}
