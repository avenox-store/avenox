import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  if (!["pending", "approved", "hidden"].includes(status)) return Response.json({ error: "Bad status" }, { status: 400 });
  const { data, error } = await sb.from("reviews")
    .select("id,product_id,user_name,rating,title,comment,images,verified,status,created_at,products(title)")
    .eq("status", status).order("created_at", { ascending: false }).limit(100);
  return error ? Response.json({ error: "Query failed" }, { status: 500 }) : Response.json({ data });
}
