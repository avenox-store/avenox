"use client";
import { sb } from "./supabase";

/** Calls an /api/admin route with the signed-in admin's Supabase access token. */
export async function adminFetch(path: string, init: RequestInit = {}) {
  const { data } = await sb.auth.getSession();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}`, ...(init.headers ?? {}) },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
