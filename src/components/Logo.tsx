// Original mark: a market-stall awning over a shop front ("haat" = traditional market).
// Rename via NEXT_PUBLIC_BRAND. Not derived from any other company's logo.
const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "Haatly";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0F766E" />
      <path d="M7.5 7h17l2.5 6H5z" fill="#FFFFFF" />
      <path d="M5 13a3.67 3.67 0 0 0 7.33 0a3.67 3.67 0 0 0 7.34 0a3.67 3.67 0 0 0 7.33 0z" fill="#FFFFFF" />
      <rect x="8" y="18" width="16" height="8" rx="1.5" fill="#FFFFFF" opacity=".92" />
      <circle cx="16" cy="22" r="2" fill="#D9381E" />
    </svg>
  );
}

/** tone="light" = white text for the navy header; tone="dark" = navy text for light backgrounds. */
export function Logo({ size = 28, tone = "light", wordmark = true, name = BRAND }:
  { size?: number; tone?: "light" | "dark"; wordmark?: boolean; name?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={name}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-heading text-xl font-bold tracking-tight" style={{ color: tone === "light" ? "#FFFFFF" : "#12203A" }}>
          {name}
        </span>
      )}
    </span>
  );
}
