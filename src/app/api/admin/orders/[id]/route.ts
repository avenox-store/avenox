import { z } from "zod";
import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };
const patch = z.object({
  order_status: z.enum(["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"]).optional(),
  payment_status: z.enum(["cod_collected", "refunded"]).optional(), // "paid" only ever comes from Razorpay
  courier_name: z.string().trim().max(80).optional(),
  awb_number: z.string().trim().max(60).optional(),
  location: z.string().trim().max(100).optional(),
  note: z.string().trim().max(200).optional(),
}).strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" })
  .refine((d) => d.order_status !== "shipped" || (d.courier_name && d.awb_number), { message: "Courier name and AWB are required to mark an order shipped" });

export async function GET(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  const { data } = await sb.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  return data ? Response.json(data) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;

  if (d.order_status === "cancelled") {
    const { error } = await sb.rpc("cancel_order", { p_order_id: id }); // restocks
    if (error) return Response.json({ error: "Cancel failed" }, { status: 500 });
  } else if (d.order_status || d.courier_name || d.awb_number || d.note) {
    const { error } = await sb.rpc("update_fulfilment", {
      p_order_id: id, p_status: d.order_status ?? null, p_courier: d.courier_name ?? null,
      p_awb: d.awb_number ?? null, p_location: d.location ?? null, p_note: d.note ?? null,
    });
    if (error) return Response.json({ error: error.code === "P0001" ? error.message : "Update failed" }, { status: error.code === "P0001" ? 409 : 500 });
  }
  if (d.payment_status === "cod_collected")
    await sb.from("orders").update({ payment_status: "cod_collected" }).eq("id", id).eq("payment_method", "cod");
  if (d.payment_status === "refunded") // issue the actual refund in Razorpay first
    await sb.from("orders").update({ payment_status: "refunded" }).eq("id", id).eq("payment_status", "paid");

  const { data } = await sb.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  return data ? Response.json(data) : Response.json({ error: "Not found" }, { status: 404 });
}
