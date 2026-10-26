import { auth } from "@clerk/nextjs/server";
import { volumeSeries } from "@/lib/terminalVolume";
export const dynamic="force-dynamic";
const validKeys = /^(NSE_EQ|NSE_INDEX)\|[A-Za-z0-9 ._&-]{1,90}$/;
async function upstox(path, token) {
  const response=await fetch("https://api.upstox.com"+path,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error("Upstox returned HTTP "+response.status);
  const payload=await response.json(); if(payload.status!=="success")throw new Error("Upstox data unavailable");
  return payload.data;
}
export async function GET(request) {
  const session=auth();
  if(!session.userId)return Response.json({error:"Sign-in required"},{status:401});
  const params=new URL(request.url).searchParams;
  const key=params.get("instrument")||"NSE_EQ|INE002A01018";
  const mode=params.get("mode")||"volume";
  if(!validKeys.test(key))return Response.json({error:"Invalid NSE instrument key"},{status:400});
  if(!["volume","chain"].includes(mode))return Response.json({error:"Invalid mode"},{status:400});
  const token=process.env.UPSTOX_ACCESS_TOKEN;
  if(!token)return Response.json({error:"Upstox token not configured. Live feed unavailable.",configured:false},{status:503});
  try {
    const instrument=encodeURIComponent(key);
    if(mode==="chain"){
      const expiry=params.get("expiry");
      if(!expiry||!/^\d{4}-\d{2}-\d{2}$/.test(expiry))return Response.json({error:"Enter an expiry date (YYYY-MM-DD)"},{status:400});
      const data=await upstox("/v2/option/chain?instrument_key="+instrument+"&expiry_date="+expiry,token);
      const rows=(Array.isArray(data)?data:[]).map(x=>({strike:x.strike_price,expiry:x.expiry,spot:x.underlying_spot_price,call:x.call_options,put:x.put_options}));
      return Response.json({rows,source:"Upstox",fetchedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store"}});
    }
    if(key.startsWith("NSE_INDEX|"))return Response.json({error:"Historical traded volume isn't supported for this index; choose an equity instrument."},{status:422});
    const lookback=Number(params.get("lookback")||15);
    if(![5,10,15,20,30].includes(lookback))return Response.json({error:"Invalid lookback"},{status:400});
    const today=new Date(),end=new Date(today);end.setUTCDate(end.getUTCDate()-1);
    const begin=new Date(today);begin.setUTCDate(begin.getUTCDate()-65);
    const ds=d=>d.toISOString().slice(0,10);
    // Upstox V3 minute candles enforce a 1-month maximum per request.
    // Partition requests into <= 25-day windows to allow up to 30 sessions.
    const ranges=[];let cursor=new Date(begin);
    while(cursor<=end){const stop=new Date(cursor);stop.setUTCDate(stop.getUTCDate()+24);if(stop>end)stop.setTime(end.getTime());ranges.push([new Date(cursor),stop]);cursor=new Date(stop);cursor.setUTCDate(cursor.getUTCDate()+1);}
    const [histories,current]=await Promise.all([
      Promise.all(ranges.map(([from,to])=>upstox("/v3/historical-candle/"+instrument+"/minutes/1/"+ds(to)+"/"+ds(from),token))),
      upstox("/v3/historical-candle/intraday/"+instrument+"/minutes/1",token)
    ]);
    const history=histories.flatMap(h=>h.candles||[]);
    const result=volumeSeries(history,current.candles||[],lookback);
    return Response.json({...result,source:"Upstox",fetchedAt:new Date().toISOString(),note:"Minute candles are interval-updated, not tick-streamed. Partial or missing bars are not zero."},{headers:{"Cache-Control":"private, no-store"}});
  }catch(err){return Response.json({error:"Market data unavailable: "+err.message},{status:502});}
}
