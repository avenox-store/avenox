// Browser helper: call from your checkout button.
const loadScript = (src: string) => new Promise<void>((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement("script");
  s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("Script load failed"));
  document.body.appendChild(s);
});

export async function payNow(payload: unknown) {
  const res = await fetch("/api/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const o = await res.json();
  if (!res.ok) throw new Error(o.error ?? "Checkout failed");
  if (o.payment_method === "cod") return o; // order placed, pay on delivery

  await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: o.key_id, order_id: o.razorpay_order_id, amount: o.amount, currency: o.currency,
      name: "Your Store", prefill: o.prefill,
      method: { upi: true, card: true, netbanking: true, wallet: false, emi: false, paylater: false },
      handler: async (r: any) => {
        const v = await fetch("/api/payments/verify", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r),
        });
        const j = await v.json().catch(() => ({}));
        if (!v.ok) return reject(new Error(j.error ?? "Payment verification failed"));
        resolve({ ...j, order_number: o.order_number });
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}
