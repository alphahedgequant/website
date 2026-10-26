// Same-origin, server-side gateway to the existing AHQ Render market-data API.
// This avoids browser CORS and keeps the upstream hostname configurable.
// IMPORTANT: This is intentionally NOT a generic open proxy.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = (process.env.MARKET_DATA_API_URL || "https://zerohedgequant-backend.onrender.com").replace(/\/$/, "");
const ALLOWED = [
  /^screener$/,
  /^us-screener$/,
  /^indices$/,
  /^us-indices$/,
  /^stock\/[A-Za-z0-9._-]{1,40}$/,
  /^fundamentals\/[A-Za-z0-9._-]{1,40}$/,
  /^option-chain\/[A-Za-z0-9._-]{1,40}$/,
];

export async function GET(request, { params }) {
  const path = (params.path || []).join("/");
  if (!ALLOWED.some(re => re.test(path))) {
    return Response.json({ success: false, error: "Market-data endpoint not allowed" }, { status: 404 });
  }
  const url = new URL(BASE + "/api/" + path);
  const input = new URL(request.url);
  // Only forward the query keys needed by existing APIs.
  for (const key of ["market", "expiry"]) {
    if (input.searchParams.has(key)) url.searchParams.set(key, input.searchParams.get(key).slice(0, 80));
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.text();
    let payload;
    try { payload = JSON.parse(body); }
    catch {
      return Response.json({ success: false, error: "Market-data backend returned a non-JSON response", upstreamStatus: response.status }, { status: 502 });
    }
    // Preserve real upstream status codes; never turn failed upstream calls into an apparent success.
    return Response.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store", "X-AHQ-Upstream-Status": String(response.status) },
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    return Response.json({
      success: false,
      error: timedOut ? "Market-data backend timed out" : "Market-data backend connection failed",
      errorCode: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE",
    }, { status: timedOut ? 504 : 502, headers: { "Cache-Control": "no-store" } });
  }
}
