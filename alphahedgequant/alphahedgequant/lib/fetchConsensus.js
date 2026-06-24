
// lib/fetchConsensus.js
// Pulls analyst consensus price targets for a watchlist of NSE symbols from
// IndianAPI (https://indianapi.in). Designed to run server-side from a cron.
//
// WHY THIS SOURCE: IndianAPI is purpose-built for NSE/BSE and serves analyst
// consensus targets via a plain X-API-Key REST call — no bot wall, no
// republishing-someone-else's-product problem (you are a registered consumer).
//
// SETUP REQUIRED BY YOU (cannot be automated for you):
//   1. Create an account at indianapi.in and get an API key.
//   2. Add it to your Vercel env as INDIANAPI_KEY.
//   3. After first run, check one real response and confirm the field names in
//      mapResponse() below match — adjust the 3 marked lines if needed.
//
// NOTE: Consensus APIs return ONE aggregated target per stock (street mean),
// not individual "Broker X said Y" calls. So this feeds a CONSENSUS layer.
// Your existing per-broker rows remain the manual/historical layer.

const BASE = "https://stock.indianapi.in"; // confirm exact base from your dashboard
const API_KEY_ENV = "INDIANAPI_KEY";

// Your watchlist. Start with liquid large/mid caps that your /api/prices knows.
// Extend freely — the cron loops over this list.
const WATCHLIST = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN",
  "BHARTIARTL", "KOTAKBANK", "LT", "AXISBANK", "ITC", "HINDUNILVR",
  "BAJFINANCE", "MARUTI", "TATAMOTORS", "SUNPHARMA", "TITAN", "NTPC",
];

function num(s) {
  if (s == null) return NaN;
  const n = Number(String(s).replace(/[, ₹]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

// Map ONE IndianAPI stock response to our analyst_calls row shape.
// The 3 marked lines are the only place field names may need adjusting after
// you see a real response.
function mapResponse(symbol, json) {
  // --- ADJUST THESE 3 LINES TO MATCH THE REAL RESPONSE ---
  const target = num(json?.analystView?.targetPrice ?? json?.priceTarget?.mean ?? json?.targetPrice);
  const current = num(json?.currentPrice?.NSE ?? json?.price ?? json?.lastPrice);
  const reco = json?.analystView?.rating ?? json?.recommendation ?? null;
  // -------------------------------------------------------

  if (!(target > 0) || !(current > 0)) {
    return { ok: false, reason: "missing-target-or-price" };
  }

  // Derive a directional rating from consensus vs current if no explicit reco
  let rating = reco;
  if (!rating) rating = target > current ? "Buy" : (target < current ? "Sell" : "Hold");
  rating = String(rating).charAt(0).toUpperCase() + String(rating).slice(1).toLowerCase();

  // Direction sanity gate (same protection as the report scraper)
  const bullish = ["Buy", "Accumulate", "Add", "Outperform", "Overweight"].includes(rating);
  const bearish = ["Sell", "Reduce", "Underperform", "Underweight"].includes(rating);
  if (bullish && target <= current) return { ok: false, reason: "buy-target-below-price" };
  if (bearish && target >= current) return { ok: false, reason: "sell-target-above-price" };

  return {
    ok: true,
    row: {
      house: "Street Consensus",     // consensus, not a single broker
      symbol,
      rating,
      target_price: target,
      price_at_call: current,
      call_date: new Date().toISOString().slice(0, 10),
      horizon_days: 365,
      note: "auto-consensus",
    },
  };
}

async function fetchOne(symbol, apiKey) {
  const url = `${BASE}/stock?name=${encodeURIComponent(symbol)}`; // confirm endpoint
  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  return mapResponse(symbol, json);
}

// Fetch consensus for the whole watchlist. Sequential with a small delay to be
// polite to the API and stay within free-tier rate limits.
async function fetchConsensus() {
  const apiKey = process.env[API_KEY_ENV];
  if (!apiKey) throw new Error(`Missing env ${API_KEY_ENV}`);

  const valid = [];
  const report = [];
  for (const symbol of WATCHLIST) {
    try {
      const r = await fetchOne(symbol, apiKey);
      if (r.ok) { valid.push(r.row); report.push({ symbol, ok: true }); }
      else report.push({ symbol, ok: false, reason: r.reason });
    } catch (e) {
      report.push({ symbol, ok: false, reason: String(e.message || e) });
    }
    await new Promise((r) => setTimeout(r, 300)); // 300ms between calls
  }
  return { valid, report };
}

module.exports = { fetchConsensus, mapResponse, WATCHLIST };
