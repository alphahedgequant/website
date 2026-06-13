export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zerohedgequant-backend.onrender.com";

export async function api(path) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Fetch one stock's live price + fundamentals.
// 1) Try the rich NSE endpoint (/api/stock/:symbol) — live Upstox OHLC + Yahoo fundamentals.
// 2) Fall back to the screener feed and locate the row — covers US + extended NSE names.
export async function fetchStock(symbol, market = "NSE") {
  const sym = String(symbol || "").toUpperCase();
  if (market === "NSE") {
    try {
      const r = await api(`/api/stock/${encodeURIComponent(sym)}`);
      if (r?.success && r.data && r.data.price > 0) return { ...r.data, market };
    } catch {}
  }
  const scr = market === "US" ? "/api/us-screener" : "/api/screener";
  const r = await api(scr);
  const rows = Array.isArray(r?.data) ? r.data : [];
  const row = rows.find((x) => String(x.symbol).toUpperCase() === sym);
  if (!row) return null;
  return {
    symbol: row.symbol, name: row.name, sector: row.sector, industry: row.industry,
    price: row.price ?? 0, change: row.change ?? null, changePct: row.changePct ?? null,
    open: row.open ?? null, high: row.high ?? null, low: row.low ?? null,
    prevClose: row.prevClose ?? null, volume: row.volume ?? null,
    fundamentals: row, // screener rows carry fundamentals at top level
    market,
    dataSource: { price: market === "US" ? "Yahoo Finance" : "Screener feed", fundamentals: "Yahoo Finance" },
  };
}
