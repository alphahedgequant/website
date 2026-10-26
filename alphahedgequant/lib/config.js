export const API_URL = "/api/market";

export async function api(path) {
  const route = path.startsWith("/api/") ? path.slice(4) : path;
  const res = await fetch(API_URL + route, { cache: "no-store" });
  if (!res.ok) throw new Error("Market-data API HTTP " + res.status);
  return res.json();
}

// Fetch one stock's deep fundamentals + price history + earnings.
// 1) Try /api/fundamentals/:symbol — ratios + annual/quarterly + price history.
// 2) Fall back to /api/stock then the screener feed.
export async function fetchStock(symbol, market = "NSE") {
  const sym = String(symbol || "").toUpperCase();
  try {
    const r = await api("/api/fundamentals/" + encodeURIComponent(sym) + "?market=" + market);
    if (r?.success && r.data && r.data.price != null) {
      return { ...r.data, market, dataSource: { price: "Market data provider", fundamentals: "Market data provider" } };
    }
  } catch {}
  if (market === "NSE") {
    try {
      const r = await api("/api/stock/" + encodeURIComponent(sym));
      if (r?.success && r.data && r.data.price > 0) return { ...r.data, market, history: [], annual: [], quarterly: [] };
    } catch {}
  }
  const scr = market === "US" ? "/api/us-screener" : "/api/screener";
  const r = await api(scr);
  const rows = Array.isArray(r?.data) ? r.data : [];
  const row = rows.find(x => String(x.symbol).toUpperCase() === sym);
  if (!row) return null;
  return {
    symbol: row.symbol, name: row.name, sector: row.sector, industry: row.industry,
    price: row.price ?? null, change: row.change ?? null, changePct: row.changePct ?? null,
    open: row.open ?? null, high: row.high ?? null, low: row.low ?? null,
    prevClose: row.prevClose ?? null, volume: row.volume ?? null,
    fundamentals: row, history: [], annual: [], quarterly: [],
    market, dataSource: { price: "Screener feed", fundamentals: "Screener feed" },
  };
}
