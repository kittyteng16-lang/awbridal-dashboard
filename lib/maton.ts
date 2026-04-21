/**
 * Maton API Gateway 基础请求封装
 * 所有请求都在服务端执行，API Key 不暴露到客户端
 */

const GATEWAY = "https://gateway.maton.ai";
const KEY = process.env.MATON_API_KEY!;

export async function matonGet<T>(path: string): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
    next: { revalidate: 0 },   // 不使用 Next.js 自带缓存，由 Supabase 控制
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Maton GET ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function matonPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Maton POST ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
