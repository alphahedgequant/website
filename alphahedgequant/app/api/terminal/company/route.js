import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ROOT=(process.env.MARKET_DATA_API_URL||"https://zerohedgequant-backend.onrender.com").replace(/\/$/,"");
export async function GET(request){
 const q=new URL(request.url).searchParams;
 const symbol=String(q.get("symbol")||"").trim().toUpperCase();
 if(!/^[A-Z0-9&_.-]{1,40}$/.test(symbol))return NextResponse.json({ok:false,error:"Invalid NSE ticker"},{status:400});
 try{
  const response=await fetch(ROOT+"/api/fundamentals/"+encodeURIComponent(symbol)+"?market=NSE",{next:{revalidate:900},signal:AbortSignal.timeout(18000)});
  const payload=await response.json();
  if(!response.ok||!payload.success||!payload.data)return NextResponse.json({ok:false,error:payload.error||"Fundamental data unavailable for this stock"},{status:response.status>=400?response.status:503});
  const data=payload.data;
  // Only provider-returned values. No supplier/customer claims are inferred.
  return NextResponse.json({ok:true,symbol,provider:"Yahoo Finance via AHQ market-data backend",retrievedAt:new Date().toISOString(),
    data:{symbol,name:data.name||symbol,sector:data.sector||null,industry:data.industry||null,
      about:data.about||null,price:data.price??null,priceChangePct:data.changePct??null,
      fundamentals:data.fundamentals||{},annual:Array.isArray(data.annual)?data.annual:[],
      quarterly:Array.isArray(data.quarterly)?data.quarterly:[]}},
   {headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=300"}});
 }catch{return NextResponse.json({ok:false,error:"Company financials provider unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
