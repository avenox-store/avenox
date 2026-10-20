import { z } from "zod";
import { sb } from "@/lib/supabase-admin";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

// Moderation only. `verified`, `rating` and `user_name` are not editable here:
// the Verified Purchase badge must reflect real orders, never admin input.
const patch = z.object({
  status: z.enum(["pending", "approved", "hidden"]),
  title: z.string().trim().max(150).nullable(),
  comment: z.string().trim().min(1).max(2000),
  images: z.array(z.string().url()).max(3),
}).partial().strict().refine((d) => Object.keys(d).length > 0);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const { data, error } = await sb.from("reviews").update(parsed.data).eq("id", id).select("id,status").single();
  return error ? Response.json({ error: "Update failed" }, { status: 500 }) : Response.json(data);
}
