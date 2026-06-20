// app/api/tracker/calls/route.js
// Trust Tracker — list + add analyst calls. Uses the SAME Neon setup as waitlist.
// GET  -> all calls, each auto-scored against the live price (via your Express /api/prices)
// POST -> add a new call
import { neon } from "@neondatabase/serverless";

const PRICE_API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

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
  return { resolved: true, madeMoney, targetHit, priceNow, returnPct: +retPct.toFixed(2) };
}

export async function GET() {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensureTable(sql);
    const rows = await sql`SELECT * FROM analyst_calls ORDER BY call_date DESC, id DESC`;

    const symbols = [...new Set(rows.map((r) => r.symbol))];
    const priceCache = {};
    await Promise.all(symbols.map(async (s) => { priceCache[s] = await latestClose(s); }));

    const calls = rows.map((c) => ({ ...c, ...scoreCall(c, priceCache[c.symbol]) }));
    return Response.json({ success: true, calls });
  } catch (e) {
    console.error("[Tracker GET]", e);
    return Response.json({ success: false, error: "Could not load calls." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const body = await request.json();
    const { house, symbol, rating = "BUY", target_price, price_at_call, call_date, horizon_days = 365, note = "" } = body || {};
    if (!house || !symbol || !target_price || !price_at_call || !call_date) {
      return Response.json({ success: false, error: "house, symbol, target_price, price_at_call, call_date are required." }, { status: 400 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensureTable(sql);
    const rows = await sql`
      INSERT INTO analyst_calls (house, symbol, rating, target_price, price_at_call, call_date, horizon_days, note)
      VALUES (${house.trim()}, ${symbol.toUpperCase().trim()}, ${String(rating).toUpperCase()},
              ${Number(target_price)}, ${Number(price_at_call)}, ${call_date}, ${Number(horizon_days)}, ${note})
      RETURNING *
    `;
    return Response.json({ success: true, call: rows[0] });
  } catch (e) {
    console.error("[Tracker POST]", e);
    return Response.json({ success: false, error: "Could not add call." }, { status: 500 });
  }
}
