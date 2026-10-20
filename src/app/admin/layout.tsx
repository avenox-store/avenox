"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sb } from "@/lib/supabase";
import { adminFetch } from "@/lib/admin-client";

const TABS = [["orders", "Orders"], ["products", "Products"], ["reviews", "Reviews"]];
const inp = "h-control w-full rounded-md border border-line px-3";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "login" | "denied" | "ok">("loading");
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [err, setErr] = useState("");
  const path = usePathname();

  const check = useCallback(async () => {
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("login");
    const r = await adminFetch("/api/admin/products?limit=1");
    setState(r.ok ? "ok" : "denied");
  }, []);
  useEffect(() => { check(); }, [check]);

  const login = async () => {
    setErr("");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setErr("Invalid email or password");
    check();
  };
  const logout = async () => { await sb.auth.signOut(); setState("login"); };

  if (state === "loading") return <p className="p-8 text-center">Loading…</p>;
  if (state === "login")
    return (
      <div className="mx-auto max-w-sm space-y-3 rounded-md bg-surface p-6 shadow-card">
        <h1 className="text-h2 font-bold">Admin sign in</h1>
        <input className={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inp} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()} />
        <button className="btn btn-cart btn-block" onClick={login}>Sign in</button>
        {err && <p role="alert" className="text-small text-red-700">{err}</p>}
      </div>
    );
  if (state === "denied")
    return (
      <div className="mx-auto max-w-sm space-y-3 rounded-md bg-surface p-6 text-center shadow-card">
        <p>This account does not have admin access.</p>
        <button className="btn btn-ghost" onClick={logout}>Sign out</button>
      </div>
    );
  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 rounded-md bg-surface p-2 shadow-card">
        {TABS.map(([h, l]) => (
          <Link key={h} href={`/admin/${h}`} className={`rounded-full px-4 py-2 text-small font-semibold ${path.startsWith(`/admin/${h}`) ? "bg-teal-700 text-white" : "hover:bg-slate-100"}`}>{l}</Link>
        ))}
        <button className="ml-auto px-3 text-small text-slate-500" onClick={logout}>Sign out</button>
      </nav>
      {children}
    </div>
  );
}
