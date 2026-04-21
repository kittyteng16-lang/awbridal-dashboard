import { createClient } from "@supabase/supabase-js";

// ── 客户端（浏览器，只用 anon key） ───────────────────
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── 服务端（API Route / Server Action，用 service_role） ─
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── 缓存辅助 ──────────────────────────────────────────
const TTL_HOURS = 6;   // 缓存有效期

export async function getCached<T>(section: string): Promise<T | null> {
  const db = createServerClient();
  const { data } = await db
    .from("dashboard_cache")
    .select("data, expires_at")
    .eq("section", section)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;   // 已过期
  return data.data as T;
}

export async function setCached<T>(section: string, payload: T): Promise<void> {
  const db = createServerClient();
  const now = new Date();
  const expires = new Date(now.getTime() + TTL_HOURS * 60 * 60 * 1000);

  await db.from("dashboard_cache").upsert(
    {
      section,
      data: payload,
      fetched_at: now.toISOString(),
      expires_at: expires.toISOString(),
    },
    { onConflict: "section" }
  );
}
