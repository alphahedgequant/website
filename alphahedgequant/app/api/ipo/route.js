// app/api/ipo/route.js
// Server-side fetch of IPO data from IndianAPI, normalized for the IPO Screen.
//
// Uses the same INDIANAPI_KEY env var already set in Vercel for the consensus feed.
// The IPO endpoint returns upcoming / open / closed / listed IPOs with
// subscription data and prospectus links.
//
// AFTER FIRST DEPLOY: hit /api/ipo once and check the JSON. If fields come back
// empty, adjust the marked lines in normalize() to match the real response keys.

const BASE = "https://stock.indianapi.in"; // confirm exact base from your dashboard
const API_KEY_ENV = "INDIANAPI_KEY";

// In-memory cache so we don't hammer the API (and stay within free-tier limits).
// IPO data changes slowly (daily-ish), so a 30-min cache is plenty.
let _cache = { at: 0, data: null };
const CACHE_MS = 30 * 60 * 1000;

function num(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Map ONE raw IPO record to our UI shape.
// --- The marked lines are the only place field names may need adjusting. ---
function normalizeOne(raw) {
  return {
    name:        raw?.name ?? raw?.company_name ?? raw?.ipo_name ?? "—",         // ADJUST
    symbol:      raw?.symbol ?? raw?.ticker ?? null,
    status:      (raw?.status ?? raw?.ipo_status ?? "").toString().toLowerCase(), // ADJUST
    priceBand:   raw?.price_band ?? raw?.priceBand ?? raw?.price ?? null,          // ADJUST
    open:        raw?.open_date ?? raw?.bidding_start_date ?? raw?.open ?? null,   // ADJUST
    close:       raw?.close_date ?? raw?.bidding_end_date ?? raw?.close ?? null,   // ADJUST
    listingDate: raw?.listing_date ?? raw?.listingDate ?? null,
    lotSize:     num(raw?.lot_size ?? raw?.lotSize ?? raw?.min_qty),
    issueSize:   raw?.issue_size ?? raw?.issueSize ?? null,
    gmp:         num(raw?.gmp ?? raw?.grey_market_premium),                        // optional
    subscription: raw?.subscription ?? raw?.times_subscribed ?? null,
    listingGain: num(raw?.listing_gain ?? raw?.listing_gains ?? raw?.gain),
    docLink:     raw?.prospectus ?? raw?.rhp ?? raw?.drhp ?? raw?.doc_link ?? null,
    segment:     raw?.segment ?? raw?.type ?? null, // mainboard / SME
  };
}

function categorize(list) {
  const buckets = { upcoming: [], open: [], closed: [], listed: [] };
  for (const ipo of list) {
    const s = ipo.status;
    if (/open|active|live/.test(s)) buckets.open.push(ipo);
    else if (/upcoming|announced/.test(s)) buckets.upcoming.push(ipo);
    else if (/listed|allotment|closed/.test(s)) {
      (/listed/.test(s) ? buckets.listed : buckets.closed).push(ipo);
    } else buckets.upcoming.push(ipo);
  }
  return buckets;
}

export async function GET() {
  const apiKey = process.env[API_KEY_ENV];
  if (!apiKey) {
    return Response.json({ ok: false, error: "Missing INDIANAPI_KEY" }, { status: 500 });
  }

  // serve cache if fresh
  if (_cache.data && Date.now() - _cache.at < CACHE_MS) {
    return Response.json({ ok: true, cached: true, ...(_cache.data) });
  }

  try {
    const res = await fetch(`${BASE}/ipo`, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" },
      // Next.js: don't cache at the fetch layer; we manage our own cache
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`IndianAPI /ipo HTTP ${res.status}`);
    const json = await res.json();

    // The endpoint may return an array, or an object keyed by status.
    // Handle both: flatten to a single list, then categorize ourselves.
    let rawList = [];
    if (Array.isArray(json)) rawList = json;
    else if (json && typeof json === "object") {
      for (const k of Object.keys(json)) {
        if (Array.isArray(json[k])) rawList = rawList.concat(json[k]);
      }
    }

    const normalized = rawList.map(normalizeOne);
    const buckets = categorize(normalized);
    const payload = { buckets, count: normalized.length, fetchedAt: new Date().toISOString() };
    _cache = { at: Date.now(), data: payload };

    return Response.json({ ok: true, cached: false, ...payload });
  } catch (e) {
    // On failure, serve stale cache if we have any, rather than breaking the UI.
    if (_cache.data) {
      return Response.json({ ok: true, cached: true, stale: true, ...(_cache.data) });
    }
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
}
