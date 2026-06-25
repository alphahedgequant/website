// app/api/debug-ipo/route.js
// TEMPORARY debug endpoint — DELETE after we've identified the target-price endpoint.
// Probes several candidate IndianAPI endpoints to find which returns a usable
// analyst price target, and reports each one's status + shape.
//
// Protected by CRON_SECRET.

const BASE = "https://stock.indianapi.in";

// Candidate endpoints to probe for a price target. We try several because the
// exact path/params vary; we'll keep whichever returns a real target Mean.
const CANDIDATES = [
  { label: "stock_target_price?stock_id=RELIANCE", path: "/stock_target_price?stock_id=RELIANCE" },
  { label: "target_price?stock_id=RELIANCE",       path: "/target_price?stock_id=RELIANCE" },
  { label: "stock_forecasts (EPS Annual)",         path: "/stock_forecasts?stock_id=RELIANCE&measure_code=EPS&period_type=Annual&data_type=Estimates&age=Current" },
  { label: "historical_stats?stock_name=RELIANCE", path: "/historical_stats?stock_name=RELIANCE&stats=priceTarget" },
  { label: "analyst (RELIANCE)",                   path: "/analyst?name=RELIANCE" },
];

function probeShape(obj, depth = 3) {
  if (obj === null) return "null";
  if (typeof obj === "number") return obj;
  if (typeof obj === "string") return obj.length > 30 ? "STR" : obj;
  if (Array.isArray(obj)) return obj.length ? ["arr" + obj.length, probeShape(obj[0], depth - 1)] : "[]";
  if (typeof obj === "object") {
    if (depth <= 0) return Object.keys(obj);
    const o = {};
    for (const k of Object.keys(obj)) o[k] = probeShape(obj[k], depth - 1);
    return o;
  }
  return String(obj);
}

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const key = process.env.INDIANAPI_KEY;
  if (!key) return Response.json({ error: "no key" }, { status: 500 });

  const results = [];
  for (const c of CANDIDATES) {
    try {
      const res = await fetch(`${BASE}${c.path}`, {
        headers: { "X-API-Key": key, "Accept": "application/json" },
        cache: "no-store",
      });
      let body = null, isJson = true;
      const text = await res.text();
      try { body = JSON.parse(text); } catch { isJson = false; body = text.slice(0, 200); }
      results.push({
        label: c.label,
        status: res.status,
        isJson,
        shape: isJson ? probeShape(body, 3) : body,
      });
    } catch (e) {
      results.push({ label: c.label, error: String(e.message || e) });
    }
  }
  return Response.json({ probed: results });
}
