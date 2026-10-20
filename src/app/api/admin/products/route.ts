import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { productCreate } from "@/lib/product-schema";

const COLS = "id,title,description_bullets,price,mrp,stock,images,category_id,avg_rating,rating_count,is_active,created_at,updated_at";

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(u.searchParams.get("limit") ?? 25));
  const q = (u.searchParams.get("q") ?? "").replace(/[%_,]/g, "").trim();

  let query = sb.from("products").select(COLS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, count, error } = await query;
  if (error) return Response.json({ error: "Query failed" }, { status: 500 });
  return Response.json({ data, total: count, page, limit });
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  const parsed = productCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await sb.from("products").insert(parsed.data).select(COLS).single();
  if (error) return Response.json({ error: error.message }, { status: error.code === "23514" || error.code === "23503" ? 400 : 500 });
  return Response.json(data, { status: 201 });
}
