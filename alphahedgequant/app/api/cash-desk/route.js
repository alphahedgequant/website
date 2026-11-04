// Server-controlled read-only research snapshot. This gateway never sends broker orders.
// No quote, timestamp, candidate, or target is fabricated on backend failure.
import {CASH_MODELS,normalizeBars,evaluateCashModel,intradayWatch} from "@/lib/cashSignals";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ROOT=(process.env.MARKET_DATA_API_URL||process.env.NEXT_PUBLIC_API_URL||"https://zerohedgequant-backend.onrender.com").replace(/\/$/,"");
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const allowed=s=>/^[A-Z0-9&_.-]{1,30}$/.test(s);
async function upstream(path){
 try{
  const res=await fetch(new URL(path,ROOT),{cache:"no-store",headers:{Accept:"application/json"},signal:AbortSignal.timeout(14000)});
  const j=await res.json();
  if(!res.ok||j?.success===false)return {ok:false,error:"Upstream HTTP "+res.status};
  return {ok:true,data:j};
 }catch{return {ok:false,error:"Market-data connection unavailable"}}
}
const extractBars=p=>{
 const raw=p?.data?.candles??p?.data?.history??p?.data?.data??p?.data?.prices??p?.data??p?.candles??p?.prices??[];
 return normalizeBars(raw);
};
function quotePayload(p){
 const q=p?.data?.quote??p?.data??p?.quote??p??{};
 const price=Number(q.price??q.ltp??q.last_price??q.lastPrice??q.lastTradedPrice);
 let timestamp=q.timestamp??q.lastTradeTime??q.last_trade_time??q.lastUpdated??q.updatedAt??p?.timestamp??null;
 if(typeof timestamp==="number"&&timestamp<1e11)timestamp*=1000;
 const d=timestamp?new Date(timestamp):null;
 const asOf=d&&Number.isFinite(+d)?d.toISOString():null;
 const age=asOf?(Date.now()-new Date(asOf))/1000:null;
 return {symbol:q.symbol??null,name:q.name??null,price:Number.isFinite(price)&&price>0?price:null,asOf,ageSeconds:age,verifiedFresh:age!==null&&age>=0&&age<=120};
}
function nominalSession(now){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(now);
 const x=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 const mins=Number(x.hour)*60+Number(x.minute);
 return !["Sat","Sun"].includes(x.weekday)&&mins>=555&&mins<930;
}
export async function GET(req){
 const q=new URL(req.url).searchParams;
 const symbol=String(q.get("symbol")||"RELIANCE").trim().toUpperCase();
 if(!allowed(symbol))return reply({ok:false,error:"Invalid NSE cash symbol"},400);
 const isMetal=["GOLDBEES","HDFCSILVER"].includes(symbol);
 const paths=[
  "/api/terminal/quote/"+encodeURIComponent(symbol),
  "/api/prices?symbol="+encodeURIComponent(symbol)+"&interval=1d",
  "/api/prices?symbol="+encodeURIComponent(symbol)+"&interval=5m",
  "/api/prices?symbol=NIFTY50&interval=1d"
 ];
 if(isMetal)paths.push("/api/prices?symbol="+encodeURIComponent(symbol==="GOLDBEES"?"HDFCSILVER":"GOLDBEES")+"&interval=1d");
 const feeds=await Promise.all(paths.map(upstream));
 const quote=feeds[0].ok?quotePayload(feeds[0].data):{symbol:null,name:null,price:null,asOf:null,ageSeconds:null,verifiedFresh:false};
 const daily=feeds[1].ok?extractBars(feeds[1].data):[];
 const intraday=feeds[2].ok?extractBars(feeds[2].data):[];
 const market=feeds[3].ok?extractBars(feeds[3].data):[];
 const other=isMetal&&feeds[4]?.ok?extractBars(feeds[4].data):[];
 const context={symbol,marketBars:market,goldBars:symbol==="GOLDBEES"?daily:other,silverBars:symbol==="HDFCSILVER"?daily:other};
 const strategies=CASH_MODELS.map(model=>evaluateCashModel(model.id,daily,context));
 const sessionWindow=nominalSession(new Date());
 const near=sessionWindow&&quote.verifiedFresh?intradayWatch(intraday,quote.price,quote.asOf):{
  status:"NOT ACTIVE",reason:!sessionWindow?"Outside nominal NSE equity session (exchange holiday calendar not checked)":quote.price&&!quote.verifiedFresh?"Quote time unavailable or older than 120 seconds":"No verified quote"
 };
 const diagnostics={
  quote:feeds[0].ok?"CONNECTED":"UNAVAILABLE",
  daily:daily.length?"AVAILABLE":"MISSING",
  intraday:intraday.length?"AVAILABLE":"MISSING",
  benchmark:market.length?"AVAILABLE":"MISSING",
  goldSilverPair:isMetal&&other.length?"AVAILABLE":"MISSING",
  dailyBars:daily.length,intradayBars:intraday.length,benchmarkBars:market.length,
 };
 return reply({ok:true,kind:"OBSERVED / RESEARCH ONLY",symbol,checkedAt:new Date().toISOString(),
  sessionWindow,source:"Existing AHQ market-data service",quote,strategies,near,diagnostics,
  historical:daily.slice(-40).map(x=>({time:x.time,close:x.close,volume:x.volume})),
  modelVersion:"cash-10-v1",execution:"DISABLED",note:"Daily models cannot be reinterpreted as 15–20 minute trade forecasts. Intraday breakout proximity is a separate conditional watch, never a predicted fill."
 });
}
