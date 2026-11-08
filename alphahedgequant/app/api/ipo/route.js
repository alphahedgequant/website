import {buildIpoBuckets} from "@/lib/ipoFeed.mjs";
import {ipoFreshness} from "@/lib/ipoFreshness.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Provider permits no more than one origin request per minute; fetch cache is shared by Next.
const ORIGIN="https://www.xflot.com";
export async function GET(){
 try{
  const res=await fetch(ORIGIN+"/api/public/market/ipos?limit=200",{
   next:{revalidate:60},headers:{Accept:"application/json"},signal:AbortSignal.timeout(10000)
  });
  if(!res.ok)throw Error("IPO source HTTP "+res.status);
  const payload=await res.json();
  if(payload?.ok!==true||!Array.isArray(payload.ipos))throw Error("Invalid IPO feed response");
  const {buckets,unknownStatuses,invalid,duplicates,accepted}=buildIpoBuckets(payload.ipos);
  const freshness=ipoFreshness(payload.updatedAt??payload.lastUpdated);
  if(payload.ipos.length>0&&accepted===0)throw Error("No recognized IPO records in source response");
  // If a provider introduces a new state, preserve those issues in 'other' rather than dropping.
  if(Object.keys(unknownStatuses).length)console.warn("[IPO] Provider has additional statuses",Object.keys(unknownStatuses));
  return Response.json({
   ok:true,buckets,count:accepted,source:"Xflot",sourceUrl:"https://www.xflot.com/api-docs",
   fetchedAt:new Date().toISOString(),upstreamUpdatedAt:freshness.upstreamUpdatedAt,
   stale:freshness.stale,freshness:freshness.freshness,partial:invalid>0||duplicates>0||Object.keys(unknownStatuses).length>0,
   unknownStatusCounts:unknownStatuses,
   disclaimer:payload.disclaimer||"GMP is unofficial and not exchange verified. An implied listing price is not a prediction."
  },{headers:{"Cache-Control":"public,s-maxage=60,stale-while-revalidate=30"}});
 }catch(e){
  console.error("[IPO] feed unavailable",e instanceof Error?e.message:"unknown");
  return Response.json({ok:false,error:"IPO updates are temporarily unavailable. Please retry shortly.",source:"Xflot"},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
