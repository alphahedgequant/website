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

// Watchlist — ~100 of the most liquid, most-analyst-covered NSE names.
// RATE LIMIT: IndianAPI free tier = 300 calls/day. The cron makes 2 calls per
// stock (price + target), so 100 stocks = 200 calls/day, leaving ~100 buffer
// for the IPO endpoint, retries, and manual checks. Do NOT exceed ~140 stocks
// on the free tier or the daily quota will 429 mid-run. Full Nifty 500 needs
// a paid plan.
const WATCHLIST = [
  // Nifty 50 core
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "BHARTIARTL",
  "KOTAKBANK", "LT", "AXISBANK", "ITC", "HINDUNILVR", "BAJFINANCE", "MARUTI",
  "TATAMOTORS", "SUNPHARMA", "TITAN", "NTPC", "ASIANPAINT", "HCLTECH",
  "WIPRO", "ULTRACEMCO", "ONGC", "NESTLEIND", "POWERGRID", "TATASTEEL",
  "ADANIENT", "ADANIPORTS", "COALINDIA", "BAJAJFINSV", "JSWSTEEL", "GRASIM",
  "HINDALCO", "TECHM", "INDUSINDBK", "DRREDDY", "CIPLA", "EICHERMOT",
  "BRITANNIA", "DIVISLAB", "HEROMOTOCO", "BAJAJ-AUTO", "TATACONSUM",
  "APOLLOHOSP", "BPCL", "SBILIFE", "HDFCLIFE", "M&M", "SHRIRAMFIN", "LTIM",
  // High-coverage mid/large caps
  "DMART", "PIDILITIND", "GODREJCP", "DABUR", "MARICO", "COLPAL", "BERGEPAINT",
  "SIEMENS", "ABB", "HAVELLS", "BOSCHLTD", "BEL", "HAL", "BHEL", "SAIL",
  "VEDL", "JINDALSTEL", "NMDC", "GAIL", "IOC", "PFC", "RECLTD", "IRFC",
  "DLF", "GODREJPROP", "OBEROIRLTY", "LODHA", "ZOMATO", "PAYTM", "NYKAA",
  "POLICYBZR", "IRCTC", "INDIGO", "TRENT", "DIXON", "PERSISTENT", "COFORGE",
  "MPHASIS", "LTTS", "TVSMOTOR", "ASHOKLEY", "BHARATFORG", "MOTHERSON",
  "TATAPOWER", "TORNTPHARM", "LUPIN", "AUROPHARMA", "ZYDUSLIFE", "BIOCON",
  "MAXHEALTH", "FORTIS", "ICICIGI", "ICICIPRULI", "BANKBARODA", "PNB",
  "CANBK", "IDFCFIRSTB", "FEDERALBNK", "AUBANK", "CHOLAFIN", "MUTHOOTFIN",
];

function num(s) {
  if (s == null) return NaN;
  const n = Number(String(s).replace(/[, ₹]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

// Map ONE IndianAPI stock response to our analyst_calls row shape.
// The 3 marked lines are the only place field names may need adjusting after
// you see a real response.
// Takes the two confirmed IndianAPI responses:
//   stockJson  = GET /stock?name=SYMBOL            -> currentPrice.NSE
//   targetJson = GET /stock_target_price?stock_id=SYMBOL
//                  -> priceTarget.UnverifiedMean / .PreliminaryMean (the target)
//                  -> recommendation.Mean (1=Buy 2=Outperform 3=Hold 4=Underperform 5=Sell)
function mapResponse(symbol, stockJson, targetJson) {
  const pt = targetJson?.priceTarget ?? {};
  const target = num(pt.UnverifiedMean ?? pt.PreliminaryMean ?? pt.Mean);
  const current = num(stockJson?.currentPrice?.NSE ?? stockJson?.currentPrice?.BSE);
  const recoMean = num(targetJson?.recommendation?.UnverifiedMean ?? targetJson?.recommendation?.Mean);

  if (!(target > 0) || !(current > 0)) {
    return { ok: false, reason: "missing-target-or-price" };
  }

  // Map IndianAPI's numeric recommendation Mean to a rating label.
  function recoToRating(m) {
    if (m == null) return null;
    if (m < 1.5) return "Buy";
    if (m < 2.5) return "Accumulate";   // Outperform
    if (m < 3.5) return "Hold";
    if (m < 4.5) return "Reduce";        // Underperform
    return "Sell";
  }

  // Prefer the analyst recommendation; fall back to target-vs-price direction.
  let rating = recoToRating(recoMean);
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
  const headers = { "X-API-Key": apiKey, "Accept": "application/json" };
  // 1) current price
  const sRes = await fetch(`${BASE}/stock?name=${encodeURIComponent(symbol)}`, { headers });
  if (!sRes.ok) throw new Error(`${symbol}: /stock HTTP ${sRes.status}`);
  const stockJson = await sRes.json();
  // 2) analyst target + recommendation
  const tRes = await fetch(`${BASE}/stock_target_price?stock_id=${encodeURIComponent(symbol)}`, { headers });
  // target endpoint can 404/500 for stocks without coverage — treat as "no target"
  let targetJson = {};
  if (tRes.ok) {
    try { targetJson = await tRes.json(); } catch { targetJson = {}; }
  }
  return mapResponse(symbol, stockJson, targetJson);
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
    await new Promise((r) => setTimeout(r, 500)); // 500ms between stocks (2 calls each)
  }
  return { valid, report };
}

module.exports = { fetchConsensus, mapResponse, WATCHLIST };
