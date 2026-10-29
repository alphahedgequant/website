import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
const BACKEND=process.env.NEXT_PUBLIC_API_URL||"https://zerohedgequant-backend.onrender.com";
const allowed=new Set(["RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","SBIN","ITC","LT","AXISBANK","BHARTIARTL","KOTAKBANK","BAJFINANCE","MARUTI"]);
export async function GET(req){
 const {searchParams}=new URL(req.url);
 const symbol=String(searchParams.get("symbol")||"RELIANCE").toUpperCase();
 const view=searchParams.get("view")||"quote";
 if(!allowed.has(symbol))return NextResponse.json({success:false,error:"Select a supported symbol"},{status:400});
 if(!["quote","history"].includes(view))return NextResponse.json({success:false,error:"Invalid view"},{status:400});
 try{
 const path=view==="quote"?"/api/terminal/quote/"+symbol:"/api/prices?symbol="+symbol+"&interval=5m";
 const r=await fetch(new URL(path,BACKEND),{cache:"no-store",signal:AbortSignal.timeout(18000)});
 const payload=await r.json();
 return NextResponse.json(payload,{status:r.status,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({success:false,error:"Market data service is currently unavailable"},{status:503})}
}
