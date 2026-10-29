// Read-only IPO detail proxy. Identifier is an Upstox IPO id (not ticker).
export const runtime="nodejs";
export const dynamic="force-dynamic";
const BASE=(process.env.MARKET_DATA_API_URL||process.env.NEXT_PUBLIC_API_URL||"https://zerohedgequant-backend.onrender.com").replace(/\/$/,"");
export async function GET(_req,{params}) {
  const id=String(params.symbol||"");
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(id)) return Response.json({ok:false,error:"Invalid IPO identifier"},{status:400});
  try {
    const upstream=await fetch(BASE+"/api/ipos/"+encodeURIComponent(id),{cache:"no-store",headers:{Accept:"application/json"},signal:AbortSignal.timeout(12000)});
    const data=await upstream.json();
    if(!upstream.ok||!data.success||!data.ipo) return Response.json({ok:false,error:"IPO information is currently unavailable"},{status:upstream.status===404?404:503});
    return Response.json({ok:true,ipo:data.ipo,source:"Upstox",stale:Boolean(data.stale),updatedAt:data.updatedAt||null},{headers:{"Cache-Control":"private, no-store"}});
  } catch {return Response.json({ok:false,error:"IPO information is currently unavailable"},{status:503});}
}
