import {istCalendar,isSafeNseCollectionTime,selectFnoBatch,normalizeDailyChain} from "@/lib/dailyOptionsFlow.mjs";
import {flowDB,storeFlowBatch} from "@/lib/dailyOptionsFlowStore.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
const BACKEND=process.env.MARKET_DATA_API_URL||process.env.NEXT_PUBLIC_API_URL||"https://zerohedgequant-backend.onrender.com";
const reply=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function jsonFrom(path,timeout=11000){
 const response=await fetch(new URL(path,BACKEND),{cache:"no-store",signal:AbortSignal.timeout(timeout),headers:{"Accept":"application/json"}});
 const data=await response.json().catch(()=>({}));
 return {status:response.status,data};
}
export async function GET(request,{params}){
 // The Vercel scheduler supplies CRON_SECRET as a Bearer header.
 // Never enable collection from an anonymous browser.
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!=="Bearer "+secret)return reply({error:"Unauthorized"},401);
 const {slot:rawSlot}=await params;
 if(!/^[0-7]$/.test(rawSlot))return reply({error:"Invalid collection slot"},400);
 const slot=Number(rawSlot),calendar=istCalendar();
 if(!isSafeNseCollectionTime())return reply({status:"skipped",reason:"Outside regular NSE weekday collection window (holidays may differ)",day:calendar.day,slot});
 if(!process.env.NEON_DATABASE_URL)return reply({status:"unavailable",error:"Persistent options archive database not configured"},503);
 try{
  // The exchange instrument master, not the 50-stock screener, defines
  // the complete eligible NSE equity-derivatives universe for this date.
  const upstream=await jsonFrom("/api/terminal/fno-universe",19000);
  if(upstream.status!==200||upstream.data?.success!==true||!Array.isArray(upstream.data.data)||upstream.data.data.length<40)
   return reply({status:"unavailable",error:"No validated exchange F&O universe; cannot claim complete coverage",slot},503);
  const universe=upstream.data.data;
  const symbols=selectFnoBatch(universe,slot);
  if(!symbols.length)return reply({status:"unavailable",error:"No eligible F&O tickers selected",slot},503);
  const observations=[],failures={};
  let authMissing=false,cursor=0;
  async function worker(){
   while(cursor<symbols.length){
    if(authMissing)break;
    const symbol=symbols[cursor++];
    try{
     const result=await jsonFrom("/api/option-chain/"+encodeURIComponent(symbol),16000);
     if(result.status===401||result.data?.code==="UPSTOX_AUTH_REQUIRED"||result.data?.code==="UPSTOX_AUTH_EXPIRED"){
      authMissing=true;failures.auth=(failures.auth||0)+1;break;
     }
     if(result.status!==200||result.data?.success!==true){
      const k=result.status===429?"rate_limited":result.status===404?"unavailable_contract":"provider";
      failures[k]=(failures[k]||0)+1;continue;
     }
     const record=normalizeDailyChain(result.data,symbol,new Date().toISOString());
     if(!record){failures.invalid=(failures.invalid||0)+1;continue;}
     observations.push(record);
    }catch{
     failures.timeout_or_network=(failures.timeout_or_network||0)+1;
    }
   }
  }
  await Promise.all(Array.from({length:Math.min(5,symbols.length)},()=>worker()));
  // Store verified observations and a run record in existing Neon.
  // A partial run is NOT represented as a successful full NSE scan.
  const db=flowDB();
  const status=await storeFlowBatch(db,{
   day:calendar.day,slot,eligibleCount:universe.length,plannedCount:symbols.length,
   observations,unavailableCount:symbols.length-observations.length
  });
  return reply({status,day:calendar.day,slot,eligible:universe.length,
   scheduled: symbols.length,captured:observations.length,
   unavailable:symbols.length-observations.length,upstoxReconnectRequired:authMissing,
   failureCategories:failures,
   note:"Stored Upstox chain receipts, not signed order-flow prints or tick-certified times"},
   observations.length?200:503);
 }catch{
  return reply({status:"unavailable",day:calendar.day,slot,error:"Collection/storage failed; no rows claimed"},503);
 }
}
