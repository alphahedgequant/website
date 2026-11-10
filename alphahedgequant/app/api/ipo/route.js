import {buildIpoBuckets,numberOrNull} from "@/lib/ipoFeed.mjs";
import {ipoFreshness} from "@/lib/ipoFreshness.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Xflot's documented free API requires a maximum of one origin fetch per
// minute. Never add rapid client or server polling of the upstream.
const ORIGIN="https://www.xflot.com";
const cacheHeaders={"Cache-Control":"public,s-maxage=60,stale-while-revalidate=30"};
const isSlug=x=>typeof x==="string"&&/^[a-z0-9][a-z0-9-]{1,119}$/.test(x);
async function load(path){
 const res=await fetch(ORIGIN+path,{
  next:{revalidate:60},headers:{Accept:"application/json"},
  signal:AbortSignal.timeout(11000)
 });
 if(!res.ok)throw Error("IPO upstream HTTP "+res.status);
 const payload=await res.json();
 if(payload?.ok!==true)throw Error("IPO upstream invalid response");
 return payload;
}
const isoDay=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}/.test(x)?x.slice(0,10):null;
async function detail(slug){
 const payload=await load("/api/public/market/ipos/"+encodeURIComponent(slug));
 if(!payload.ipo||typeof payload.ipo!=="object")throw Error("IPO details missing");
 const safeGmp=Array.isArray(payload.ipo.gmp)?payload.ipo.gmp.slice(-80).map(r=>({
  observedAt:isoDay(r?.observedAt),gmp:numberOrNull(r?.gmp),
  gmpPct:numberOrNull(r?.gmpPct),unofficial:true
 })).filter(x=>x.observedAt&&x.gmp!==null):[];
 const safeSubs=Array.isArray(payload.ipo.subs)?payload.ipo.subs.slice(0,30).map(r=>({
  category:String(r?.category||"").slice(0,34).toUpperCase(),
  timesSub:numberOrNull(r?.timesSub)
 })).filter(x=>x.category&&x.timesSub!==null):[];
 return Response.json({
  ok:true,slug,gmpHistory:safeGmp,subscriptions:safeSubs,
  source:"Xflot",checkedAt:new Date().toISOString(),
  disclaimer:payload.disclaimer||"Grey market premiums are unofficial, not exchange-verified."
 },{headers:cacheHeaders});
}
async function scoreboard(){
 const payload=await load("/api/public/market/scoreboard");
 if(!Array.isArray(payload.rows))throw Error("IPO scoreboard missing");
 const rows=payload.rows.slice(0,200).filter(x=>isSlug(x?.slug)).map(x=>({
  slug:x.slug,name:String(x.name||"").slice(0,160),
  issuePrice:numberOrNull(x.issuePrice),gmpAtClose:numberOrNull(x.gmpAtClose),
  impliedPct:numberOrNull(x.impliedPct),listingPrice:numberOrNull(x.listingPrice),
  actualPct:numberOrNull(x.actualPct),errorPp:numberOrNull(x.errorPp),
  directionHit:typeof x.directionHit==="boolean"?x.directionHit:null,
  listedOn:isoDay(x.listedOn)
 }));
 return Response.json({
  ok:true,view:"scoreboard",rows,
  summary:{
   n:numberOrNull(payload.summary?.n),
   avgAbsErrorPp:numberOrNull(payload.summary?.avgAbsErrorPp),
   directionHitPct:numberOrNull(payload.summary?.directionHitPct)
  },
  checkedAt:new Date().toISOString(),source:"Xflot",
  disclaimer:payload.disclaimer||"Historical reported GMP is unofficial. Observations may be missing."
 },{headers:cacheHeaders});
}
export async function GET(request){
 try {
  const url=new URL(request.url);
  const slug=url.searchParams.get("slug");
  const view=url.searchParams.get("view");
  if(slug!==null){
   if(!isSlug(slug))return Response.json({ok:false,error:"Invalid IPO identifier."},{status:400,headers:{"Cache-Control":"no-store"}});
   return await detail(slug);
  }
  if(view==="scoreboard")return await scoreboard();
  if(view!==null)return Response.json({ok:false,error:"Invalid view."},{status:400,headers:{"Cache-Control":"no-store"}});
  const payload=await load("/api/public/market/ipos?limit=200");
  if(!Array.isArray(payload.ipos))throw Error("IPO issue list missing");
  const {buckets,unknownStatuses,invalid,duplicates,correctedStatuses,accepted}=buildIpoBuckets(payload.ipos);
  const freshness=ipoFreshness(payload.updatedAt??payload.lastUpdated);
  if(payload.ipos.length>0&&accepted===0)throw Error("No valid IPO records in source response");
  return Response.json({
   ok:true,buckets,count:accepted,coverageLimit:200,
   counts:Object.fromEntries(Object.entries(buckets).map(([status,items])=>[status,items.length])),
   source:"Xflot",sourceUrl:"https://www.xflot.com/api-docs",
   fetchedAt:new Date().toISOString(),upstreamUpdatedAt:freshness.upstreamUpdatedAt,
   stale:freshness.stale,freshness:freshness.freshness,
   correctedStatuses,
   partial:invalid>0||duplicates>0||Object.keys(unknownStatuses).length>0,
   unknownStatusCounts:unknownStatuses,
   disclaimer:payload.disclaimer||"GMP is unofficial and not exchange verified; implied listing prices are not predictions."
  },{headers:cacheHeaders});
 }catch(e){
  console.error("[IPO] feed unavailable",e instanceof Error?e.message:"unknown");
  return Response.json({
   ok:false,error:"IPO market updates are temporarily unavailable. Try again shortly."
  },{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
