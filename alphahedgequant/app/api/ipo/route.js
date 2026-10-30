// Licensed public GMP feed. Xflot asks for attribution, <=1 request/minute and disclaimer.
// This is an observed unofficial grey-market report, NOT a model-predicted gain.
export const runtime = "nodejs";
export const revalidate = 60;
const SOURCE = "https://xflot.com";
const num = x => x === null || x === undefined || x === "" ? null : Number.isFinite(Number(x)) ? Number(x) : null;
function normalize(x) {
  const issuePrice = num(x.priceMax);
  const gmp = num(x.lastGmp);
  const status = String(x.status || "").toLowerCase();
  return {
    id: String(x.slug || ""), name: x.name || "IPO", symbol: x.symbol || null,
    segment: x.board === "SME" ? "SME" : "Mainboard", status,
    priceBand: num(x.priceMin) != null && issuePrice != null ? "₹" + x.priceMin + "–₹" + issuePrice : issuePrice != null ? "₹" + issuePrice : null,
    issuePrice, lotSize: num(x.lotSize), issueSize: num(x.issueSizeCr),
    open: x.openDate || null, close: x.closeDate || null,
    listingDate: x.listingDate || null,
    gmp, gmpPct: gmp !== null && issuePrice > 0 ? +(100*gmp/issuePrice).toFixed(2) : null,
    estimatedListingPrice: gmp !== null && issuePrice > 0 ? +(issuePrice+gmp).toFixed(2) : null,
    gmpSources: num(x.gmpSources), gmpSpread: num(x.gmpSpread), gmpDisputed: x.gmpDisputed === true,
    subscription: num(x.lastSubX), listingGain: num(x.listingGainPct),
    source: "Xflot", sourceUrl: "https://xflot.com/ipo-gmp",
    gmpUnofficial: true
  };
}
export async function GET() {
  try {
    // Next.js revalidate cache is shared across visitors, avoiding a vendor request per pageview.
    const res = await fetch(SOURCE + "/api/public/market/ipos?limit=200", {
      next: { revalidate: 60 }, headers: {Accept:"application/json"},
      signal:AbortSignal.timeout(10000)
    });
    if (!res.ok) throw Error("Provider unavailable");
    const payload = await res.json();
    if (!payload.ok || !Array.isArray(payload.ipos)) throw Error("Invalid provider response");
    const buckets = {open:[],upcoming:[],closed:[],listed:[]};
    for(const row of payload.ipos) {
      const ipo = normalize(row);
      if (ipo.id && Object.hasOwn(buckets,ipo.status)) buckets[ipo.status].push(ipo);
    }
    return Response.json({
      ok:true, source:"Xflot", sourceUrl:"https://xflot.com/api-docs", buckets,
      fetchedAt:new Date().toISOString(), stale:false, partial:false,
      disclaimer: payload.disclaimer || "GMP is an unofficial, unregulated, unverifiable grey-market quote. It is not a guarantee of listing gain."
    },{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=60"}});
  } catch (e) {
    console.error("[IPO GMP] Feed unavailable",e instanceof Error ? e.message : "");
    return Response.json({ok:false,error:"Reported IPO GMP feed is temporarily unavailable.",source:"Xflot"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
