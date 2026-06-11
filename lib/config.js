export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zerohedgequant-backend.onrender.com";

export async function api(path) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
