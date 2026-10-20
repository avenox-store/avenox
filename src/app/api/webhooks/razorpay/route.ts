import { sb } from "@/lib/supabase-admin";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Dashboard > Settings > Webhooks: enable payment.captured, order.paid, payment.failed
export async function POST(req: Request) {
  const raw = await req.text(); // signature is over the RAW body: never re-serialise JSON
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!sig || !verifyWebhookSignature(raw, sig))
    return Response.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(raw);
  const eventId = req.headers.get("x-razorpay-event-id") ?? `${event.event}:${event.created_at}`;

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const pay = event.payload?.payment?.entity;
    if (pay?.order_id && pay?.id) {
      const { error } = await sb.rpc("mark_order_paid", {
        p_razorpay_order_id: pay.order_id, p_payment_id: pay.id, p_amount_paise: Number(pay.amount),
      });
      // amount mismatch is not retryable: log it and ack. Anything else: let Razorpay retry.
      if (error && !error.message.includes("mismatch"))
        return Response.json({ error: "retry" }, { status: 500 });
      if (error) console.error("Amount mismatch for", pay.order_id);
    }
  }
  // payment.failed: order stays 'pending' because the customer can retry on the
  // same Razorpay order. Unpaid orders are released by release_stale_orders().

  await sb.from("webhook_events")
    .upsert({ event_id: eventId, event_type: event.event }, { onConflict: "event_id", ignoreDuplicates: true });
  return Response.json({ ok: true });
}
