// US option chain in the same normalised shape as /api/market/option-chain (India).
import { fetchUsChain } from "@/lib/usOptionsProvider.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { symbol } = await params;
  const sym = String(symbol || "").toUpperCase();
  if (!/^[A-Z0-9.^-]{1,12}$/.test(sym)) return Response.json({ success: false, error: "Invalid US symbol" }, { status: 400 });
  const expiry = new URL(request.url).searchParams.get("expiry");
  try {
    const payload = await fetchUsChain(sym, expiry && /^\d{4}-\d{2}-\d{2}$/.test(expiry) ? expiry : null);
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const notConnected = e?.code === "US_OPTIONS_NOT_CONNECTED";
    return Response.json({ success: false, code: notConnected ? "US_OPTIONS_NOT_CONNECTED" : "US_PROVIDER_ERROR",
      error: notConnected ? "US options feed not connected yet" : "US options provider error" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
