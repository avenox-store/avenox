import { z } from "zod";
import { sb } from "@/lib/supabase-admin";
import { razorpay, verifyCheckoutSignature } from "@/lib/razorpay";

const schema = z.object({
  razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = parsed.data;

  if (!verifyCheckoutSignature(oid, pid, sig))
    return Response.json({ error: "Signature mismatch" }, { status: 400 });

  // Confirm with Razorpay: right order, and money actually captured
  const payment = await razorpay.payments.fetch(pid);
  if (payment.order_id !== oid)
    return Response.json({ error: "Order mismatch" }, { status: 400 });
  if (payment.status !== "captured")
    return Response.json({ status: "processing" }, { status: 202 }); // webhook will finalise

  const { error } = await sb.rpc("mark_order_paid", {
    p_razorpay_order_id: oid, p_payment_id: pid, p_amount_paise: Number(payment.amount),
  });
  if (error)
    return Response.json({ error: error.message }, { status: error.message.includes("mismatch") ? 400 : 500 });
  return Response.json({ status: "paid" });
}
