import { z } from "zod";
import { sb } from "@/lib/supabase-admin";
import { razorpay } from "@/lib/razorpay";

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(10).max(500),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
  payment_method: z.enum(["upi", "card", "netbanking", "cod"]),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  // 1. Create the order + reserve stock atomically (prices come from the DB)
  const { data, error } = await sb.rpc("create_order", {
    p_customer_name: d.customer_name, p_phone: d.phone, p_address: d.address,
    p_city: d.city, p_state: d.state, p_pincode: d.pincode,
    p_payment_method: d.payment_method, p_items: d.items,
  });
  if (error) {
    // P0001 = our own `raise exception` messages (stock, unavailable product...)
    return error.code === "P0001"
      ? Response.json({ error: error.message }, { status: 409 })
      : Response.json({ error: "Could not place order" }, { status: 500 });
  }
  const order = data[0] as { o_id: string; o_number: string; o_total: number | string };
  const total = Number(order.o_total);

  // 2. COD: no gateway involved
  if (d.payment_method === "cod") {
    return Response.json(
      { order_id: order.o_id, order_number: order.o_number, payment_method: "cod", total }, { status: 201 });
  }

  // 3. Online: create the Razorpay order (amount in paise)
  try {
    const rp = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order.o_number,
      notes: { order_id: order.o_id },
    });
    const { error: linkErr } = await sb.from("orders").update({ razorpay_order_id: rp.id }).eq("id", order.o_id);
    if (linkErr) throw linkErr;
    return Response.json({
      order_id: order.o_id, order_number: order.o_number, payment_method: d.payment_method,
      key_id: process.env.RAZORPAY_KEY_ID, razorpay_order_id: rp.id,
      amount: rp.amount, currency: "INR",
      prefill: { name: d.customer_name, contact: d.phone },
    }, { status: 201 });
  } catch {
    await sb.rpc("cancel_order", { p_order_id: order.o_id }); // give the stock back
    return Response.json({ error: "Payment gateway unavailable, please retry" }, { status: 502 });
  }
}
