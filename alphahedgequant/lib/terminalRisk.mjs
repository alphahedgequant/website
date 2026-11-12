// Pure historical interval-risk statistics for the Quant Terminal.
// 5-minute candles are observational; VaR is a sample estimate, not a forecast.
// Overnight gaps and gaps larger than ten minutes are excluded from the return
// distribution rather than silently being treated as one 5-minute interval.
const validClose=x=>typeof x==="number"&&Number.isFinite(x)&&x>0;
function dayIST(timestamp){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"})
  .formatToParts(new Date(timestamp));
 const part=n=>parts.find(x=>x.type===n)?.value;
 return [part("year"),part("month"),part("day")].join("-");
}
export function computeTerminalRisk(candles,confidence=0.95,maxIntervals=750){
 const threshold=confidence===0.99?0.99:0.95;
 const cap=[250,750,1500].includes(maxIntervals)?maxIntervals:750;
 const indexed=(Array.isArray(candles)?candles:[])
   .map(x=>({timestamp:Date.parse(x?.date),close:typeof x?.close==="number"?x.close:Number(x?.close)}))
   .filter(x=>Number.isFinite(x.timestamp)&&validClose(x.close))
   .sort((a,b)=>a.timestamp-b.timestamp);
 const deduped=indexed.filter((x,i)=>i===indexed.length-1||x.timestamp!==indexed[i+1].timestamp);
 const intraday=[];
 let previous=null,sessionPeak=null,maxDrawdown=0;
 for(const row of deduped){
  const date=dayIST(row.timestamp);
  if(!previous||date!==previous.date){
   sessionPeak=row.close;
  }else{
   const elapsed=(row.timestamp-previous.timestamp)/60000;
   if(elapsed>=1&&elapsed<=10){
    intraday.push((row.close/previous.close-1)*100);
    sessionPeak=Math.max(sessionPeak,row.close);
    maxDrawdown=Math.max(maxDrawdown,(1-row.close/sessionPeak)*100);
   }else sessionPeak=row.close;
  }
  previous={...row,date};
 }
 const sample=intraday.slice(-cap),n=sample.length,ready=n>=30;
 if(!ready)return {ready:false,samples:n,intervalMinutes:5,confidence:threshold,
  varPct:null,expectedShortfallPct:null,volatilityPct:null,maxDrawdownPct:null,
  worstPct:null,bestPct:null,positivePct:null,
  note:"At least 30 valid intraday intervals are required; overnight gaps and missing periods are excluded."};
 const sorted=[...sample].sort((a,b)=>a-b);
 const cutoff=Math.max(1,Math.ceil(n*(1-threshold)));
 const tail=sorted.slice(0,cutoff),tailMean=tail.reduce((a,b)=>a+b,0)/tail.length;
 const mean=sample.reduce((a,b)=>a+b,0)/n;
 const std=Math.sqrt(sample.reduce((sum,r)=>sum+(r-mean)**2,0)/(n-1));
 return {ready:true,samples:n,intervalMinutes:5,confidence:threshold,
  varPct:Math.max(0,-sorted[cutoff-1]),
  expectedShortfallPct:Math.max(0,-tailMean),
  volatilityPct:std,
  // Drawdown is computed from actual contiguous intraday prices, not from a
  // fabricated equity curve, and is not a forecast of portfolio drawdown.
  maxDrawdownPct:maxDrawdown,
  worstPct:sorted[0],bestPct:sorted.at(-1),
  positivePct:100*sample.filter(x=>x>0).length/n,
  note:"Historical 5-minute close-to-close returns, excluding overnight and >10-minute gaps. Sample VaR/ES are not forecasts. Transaction costs, gaps and liquidity risk are excluded."
 };
}
