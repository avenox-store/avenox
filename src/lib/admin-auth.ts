import { sb } from "./supabase-admin";

/** Returns the Supabase user if the Bearer token belongs to an admin, else null. */
export async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: row } = await sb
    .from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return row ? data.user : null;
}

export const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });
