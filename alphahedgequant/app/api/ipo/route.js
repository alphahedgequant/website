// Read-only frontend gateway to the cached Upstox IPO feed on Render.
// No IndianAPI requests, brokerage credentials, or user/account data.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BASE = (process.env.MARKET_DATA_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com").replace(/\/$/, "");
const STATES = ["open", "upcoming", "closed", "listed"];
export async function GET() {
  const results = await Promise.all(STATES.map(async status => {
    try {
      const res = await fetch(BASE + "/api/ipos?status=" + status, {cache:"no-store",headers:{"Accept":"application/json"},signal:AbortSignal.timeout(12000)});
      const j = await res.json();
      if (!res.ok || !j.success || !Array.isArray(j.data)) throw Error("upstream unavailable");
      return {status, data:j.data, stale:Boolean(j.stale), updatedAt:j.updatedAt || null, ok:true};
    } catch { return {status, data:[], ok:false}; }
  }));
  const good=results.filter(x=>x.ok);
  if (!good.length) return Response.json({ok:false,error:"IPO data is temporarily unavailable. Please retry shortly."},{status:503,headers:{"Cache-Control":"no-store"}});
  return Response.json({
    ok:true, source:"Upstox", partial:good.length!==STATES.length,
    stale:good.some(x=>x.stale), fetchedAt:good.map(x=>x.updatedAt).filter(Boolean).sort().at(0)||null,
    unavailable:results.filter(x=>!x.ok).map(x=>x.status),
    buckets:Object.fromEntries(results.map(x=>[x.status,x.data]))
  },{headers:{"Cache-Control":"private, no-store"}});
}
