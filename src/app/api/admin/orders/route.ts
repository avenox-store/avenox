import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(u.searchParams.get("limit") ?? 25));

  let q = sb.from("orders").select("*, order_items(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  for (const f of ["order_status", "payment_status", "payment_method"])
    if (u.searchParams.get(f)) q = q.eq(f, u.searchParams.get(f)!);
  const phone = u.searchParams.get("phone");
  if (phone && /^\d{10}$/.test(phone)) q = q.eq("phone", phone);

  const { data, count, error } = await q;
  if (error) return Response.json({ error: "Query failed" }, { status: 500 });
  return Response.json({ data, total: count, page, limit });
}
