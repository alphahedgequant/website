// app/api/tracker/leaderboard/route.js
// Per-house aggregate — the "CIBIL" Trust Score = % of resolved calls that made money.
import { neon } from "@neondatabase/serverless";
import {fetchHistory,scoreAnalystCall} from "@/lib/trackerScoring";

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS analyst_calls (
      id            SERIAL PRIMARY KEY,
      house         TEXT NOT NULL,
      symbol        TEXT NOT NULL,
      rating        TEXT NOT NULL DEFAULT 'BUY',
      target_price  NUMERIC NOT NULL,
      price_at_call NUMERIC NOT NULL,
      call_date     DATE NOT NULL,
      horizon_days  INTEGER NOT NULL DEFAULT 365,
      note          TEXT,
      created_at    TIMESTAMPTZ DEFAULT now()
    )
  `;
}

export async function GET() {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensureTable(sql);
    const rows = await sql`SELECT * FROM analyst_calls`;

    const symbols = [...new Set(rows.map((r) => r.symbol))];
    const priceCache = {};
    await Promise.all(symbols.map(async (s) => { priceCache[s] = await fetchHistory(s); }));

    const byHouse = {};
    for (const c of rows) {
      const sc = scoreAnalystCall(c, priceCache[c.symbol] || []);
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
      trustScore: h.resolved >= 5 ? Math.round((h.wins / h.resolved) * 100) : null,\n      sampleWarning: h.resolved < 5 ? "Insufficient resolved sample (min 5)" : null,
      targetHitRate: h.resolved ? Math.round((h.targetHits / h.resolved) * 100) : null,
      avgReturn: h.resolved ? +(h.retSum / h.resolved).toFixed(2) : null,
    })).sort((a, b) => (b.trustScore ?? -1) - (a.trustScore ?? -1));

    return Response.json({ success: true, leaderboard });
  } catch (e) {
    console.error("[Tracker LB]", e);
    return Response.json({ success: false, error: "Could not load leaderboard." }, { status: 500 });
  }
}
