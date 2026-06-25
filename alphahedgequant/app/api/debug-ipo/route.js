// app/api/debug-ipo/route.js
// TEMPORARY debug endpoint — DELETE after we've read the response shape.
// Fetches one stock from IndianAPI server-side and returns the analyst/price
// portion of the raw JSON so we can confirm exact field names.
//
// Protected by the same CRON_SECRET so it isn't publicly open.

const BASE = "https://stock.indianapi.in";

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const key = process.env.INDIANAPI_KEY;
  if (!key) return Response.json({ error: "no key" }, { status: 500 });

  try {
    const res = await fetch(`${BASE}/stock?name=RELIANCE`, {
      headers: { "X-API-Key": key, "Accept": "application/json" },
      cache: "no-store",
    });
    const json = await res.json();

    // Return only the keys relevant to targets/prices/recommendations,
    // plus the full list of top-level keys so we can see the structure.
    const topKeys = json && typeof json === "object" ? Object.keys(json) : [];
    const relevant = {};
    for (const k of topKeys) {
      if (/price|target|recommend|analyst|current|forecast|valuation/i.test(k)) {
        relevant[k] = json[k];
      }
    }
    return Response.json({
      status: res.status,
      topLevelKeys: topKeys,
      relevant,
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
