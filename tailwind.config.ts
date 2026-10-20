import type { Config } from "tailwindcss";

// Mirrors tokens.css. Use semantic names in components (bg-header, text-muted ...).
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "16px", md: "24px" }, screens: { xl: "1280px" } },
    extend: {
      colors: {
        navy: { 950: "#0B1626", 900: "#12203A", 800: "#1B2D4F", 700: "#263C66" },
        slate: { 50: "#F6F8FB", 100: "#EEF2F7", 200: "#E2E8F0", 300: "#CBD5E1", 500: "#64748B", 700: "#334155", 900: "#0F172A" },
        teal: { 50: "#E6F6F4", 600: "#0D9488", 700: "#0F766E", 800: "#115E59" },
        coral: { 50: "#FFF1ED", 600: "#D9381E", 700: "#BF2F17" },
        gold: { 500: "#F5B301" },
        page: "var(--bg-page)", surface: "var(--bg-surface)", muted: "var(--bg-muted)",
        line: "var(--border)", header: "var(--header-bg)", subnav: "var(--header-subnav-bg)",
        buy: { DEFAULT: "var(--btn-buy-bg)", hover: "var(--btn-buy-bg-hover)" },
        cart: { DEFAULT: "var(--btn-cart-bg)", hover: "var(--btn-cart-bg-hover)" },
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
      },
      fontSize: {
        caption: ["12px", "16px"], small: ["14px", "20px"], body: ["16px", "24px"],
        h3: ["18px", "26px"], h2: ["20px", "28px"], h1: ["24px", "32px"],
        display: ["32px", "40px"], price: ["28px", "32px"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "14px" },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08)",
        pop: "0 8px 24px rgba(15,23,42,.14)",
      },
      height: { header: "64px", "header-m": "56px", control: "44px" },
    },
  },
  plugins: [],
} satisfies Config;
