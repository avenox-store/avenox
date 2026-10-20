import { z } from "zod";
import { sb } from "@/lib/supabase-admin";

const schema = z.object({ order_number: z.string().trim().min(4).max(20), phone: z.string().regex(/^[6-9]\d{9}$/) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your order number and 10-digit mobile number" }, { status: 400 });
  const { data, error } = await sb.rpc("track_order", { p_order_number: parsed.data.order_number, p_phone: parsed.data.phone });
  if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
  if (!data) return Response.json({ error: "No order matches those details" }, { status: 404 });
  return Response.json(data);
}
