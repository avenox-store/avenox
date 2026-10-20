export const FREE_DELIVERY_ABOVE = 499;
const METRO = ["11", "40", "56", "60", "70", "50"]; // Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad
export const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
export const pctOff = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
export const validPin = (p: string) => /^[1-9]\d{5}$/.test(p);

/** Simple zone-based ETA. Replace with your courier's serviceability API when you have one. */
export function etaLabel(pin: string, price: number) {
  const d = new Date();
  d.setDate(d.getDate() + (METRO.some((m) => pin.startsWith(m)) ? 2 : 4));
  const when = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  return `${price >= FREE_DELIVERY_ABOVE ? "FREE delivery" : "Delivery"} by ${when}`;
}
