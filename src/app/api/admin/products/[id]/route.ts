import { z } from "zod";
import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { productPatch } from "@/lib/product-schema";

type Ctx = { params: Promise<{ id: string }> }; // Next.js 15 (use { id: string } on 14)
const isId = (id: string) => z.string().uuid().safeParse(id).success;

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  if (!isId(id)) return Response.json({ error: "Bad id" }, { status: 400 });

  const parsed = productPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await sb.from("products").update(parsed.data).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: error.code === "23514" ? 400 : 500 });
  return Response.json(data);
}

// Soft delete keeps order history intact
export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  if (!isId(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  const { error } = await sb.from("products").update({ is_active: false }).eq("id", id);
  return error ? Response.json({ error: "Failed" }, { status: 500 }) : new Response(null, { status: 204 });
}
