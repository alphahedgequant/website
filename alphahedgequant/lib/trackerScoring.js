// Evidence-based, horizon-aware analyst call scoring.
const PRICE_API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";
export function utcDay(date) { const s=String(date??"").slice(0,10);const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.valueOf())?d:null; }
export async function fetchHistory(symbol) {
 try {
  const url=new URL("/api/prices",PRICE_API);
  url.searchParams.set("symbol",symbol);url.searchParams.set("interval","1d");
  const r=await fetch(url,{next:{revalidate:900},signal:AbortSignal.timeout(9000)});
  if(!r.ok)return [];
  const json=await r.json();
  return json.success&&Array.isArray(json.data)?json.data.filter(x=>Number.isFinite(Number(x.close)) && utcDay(x.date)).sort((a,b)=>String(a.date).localeCompare(String(b.date))):[];
 }catch{return []}
}
export function scoreAnalystCall(c,bars,now=new Date()){
 const start=utcDay(c.call_date),entry=Number(c.price_at_call),target=Number(c.target_price),days=Number(c.horizon_days),rating=String(c.rating||"").toUpperCase();
 if(!start||!Number.isFinite(entry)||entry<=0||!Number.isFinite(target)||target<=0||!Number.isInteger(days)||days<1||days>3650||!["BUY","SELL","HOLD"].includes(rating))return {resolved:false,status:"invalid"};
 const expiry=new Date(start.valueOf()+days*86400000), today=utcDay(now.toISOString().slice(0,10));
 const path=bars.filter(b=>utcDay(b.date)>=start&&utcDay(b.date)<=expiry);
 const current=bars.length?Number(bars[bars.length-1].close):null;
 if(!today||today<expiry)return {resolved:false,status:"active",priceNow:current,expiryDate:expiry.toISOString().slice(0,10)};
 // Use actual bar at or just after the specified horizon, not today's arbitrary close.
 const final=bars.find(b=>utcDay(b.date)>=expiry && utcDay(b.date)<=new Date(expiry.valueOf()+7*86400000));
 if(!final)return {resolved:false,status:"unverified",priceNow:current,expiryDate:expiry.toISOString().slice(0,10)};
 const px=Number(final.close);
 const retPct=rating==="SELL"?(entry-px)/entry*100:(px-entry)/entry*100;
 const hit=rating==="BUY"?path.some(b=>Number(b.high)>=target):rating==="SELL"?path.some(b=>Number(b.low)<=target):false;
 const madeMoney=rating==="HOLD"?null:retPct>0;
 return {resolved:rating!=="HOLD",status:rating==="HOLD"?"hold_unscored":"resolved",priceNow:current,evaluationPrice:px,evaluationDate:String(final.date).slice(0,10),returnPct:+retPct.toFixed(2),madeMoney,targetHit:hit,expiryDate:expiry.toISOString().slice(0,10)};
}
