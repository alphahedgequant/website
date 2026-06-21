// app/api/tracker/leaderboard/route.js
// Per-house aggregate — the "CIBIL" Trust Score = % of resolved calls that made money.
import { neon } from "@neondatabase/serverless";

const PRICE_API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

async function latestClose(symbol) {
  try {
    const r = await fetch(`${PRICE_API}/api/prices?symbol=${encodeURIComponent(symbol)}&interval=1d`);
    const j = await r.json();
    if (j.success && j.data?.length) return j.data[j.data.length - 1].close;
  } catch (e) { /* ignore */ }
  return null;
}

function scoreCall(call, priceNow) {
  if (priceNow == null) return { resolved: false };
  const entry = Number(call.price_at_call);
  const tgt = Number(call.target_price);
  const r = (call.rating || "BUY").toUpperCase();
  let madeMoney, targetHit, retPct;
  if (r === "SELL") {
    madeMoney = priceNow < entry;
    targetHit = priceNow <= tgt;
    retPct = ((entry - priceNow) / entry) * 100;
  } else {
    madeMoney = priceNow >= entry;
    targetHit = priceNow >= tgt;
    retPct = ((priceNow - entry) / entry) * 100;
  }
  return { resolved: true, madeMoney, targetHit, returnPct: retPct };
}

export async function GET() {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    // table may not exist yet on a fresh DB — guard with a try
    let rows = [];
    try { rows = await sql`SELECT * FROM analyst_calls`; } catch { rows = []; }

    const symbols = [...new Set(rows.map((r) => r.symbol))];
    const priceCache = {};
    await Promise.all(symbols.map(async (s) => { priceCache[s] = await latestClose(s); }));

    const byHouse = {};
    for (const c of rows) {
      const sc = scoreCall(c, priceCache[c.symbol]);
      if (!byHouse[c.house]) byHouse[c.house] = { house: c.house, total: 0, resolved: 0, wins: 0, targetHits: 0, retSum: 0 };
      const h = byHouse[c.house];
      h.total++;
      if (sc.resolved) {
        h.resolved++;
        if (sc.madeMoney) h.wins++;
        if (sc.targetHit) h.targetHits++;
        h.retSum += sc.returnPct;
      }
    }
    const leaderboard = Object.values(byHouse).map((h) => ({
      house: h.house,
      totalCalls: h.total,
      resolvedCalls: h.resolved,
      trustScore: h.resolved ? Math.round((h.wins / h.resolved) * 100) : null,
      targetHitRate: h.resolved ? Math.round((h.targetHits / h.resolved) * 100) : null,
      avgReturn: h.resolved ? +(h.retSum / h.resolved).toFixed(2) : null,
    })).sort((a, b) => (b.trustScore ?? -1) - (a.trustScore ?? -1));

    return Response.json({ success: true, leaderboard });
  } catch (e) {
    console.error("[Tracker LB]", e);
    return Response.json({ success: false, error: "Could not load leaderboard." }, { status: 500 });
  }
}
