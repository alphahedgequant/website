// Daily NSE F&O options-activity archive. Pure transformations: no orders,
// signed trade prints, or institutional intent are inferred from Upstox chain snapshots.
export const NSE_SYMBOL=/^[A-Z0-9&_.-]{1,40}$/;
export const FLOW_SLOTS=8;
export const FLOW_GROUPS=4;
export const INDEX_OPTION_SYMBOLS=Object.freeze(["NIFTY","BANKNIFTY","FINNIFTY"]);
const MAX_STORED_CONTRACTS=28;
const f=v=>v===null||v===undefined||v===""||!Number.isFinite(Number(v))?null:Number(v);
const positive=v=>{const n=f(v);return n!==null&&n>0?n:null;};
export function istCalendar(at=new Date()){
 const time=new Date(at);
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"})
  .formatToParts(time).map(x=>[x.type,x.value]));
 return {day:[parts.year,parts.month,parts.day].join("-"),
  weekday:parts.weekday,minutes:Number(parts.hour)*60+Number(parts.minute)};
}
export function isSafeNseCollectionTime(at=new Date()){
 const t=istCalendar(at);
 return !["Sat","Sun"].includes(t.weekday)&&t.minutes>=9*60+15&&t.minutes<=17*60+30;
}
export function selectFnoBatch(symbols,slot){
 if(!Number.isInteger(slot)||slot<0||slot>=FLOW_SLOTS)return [];
 return [...new Set((Array.isArray(symbols)?symbols:[]).map(x=>String(x?.symbol||x||"").toUpperCase())
   .filter(x=>NSE_SYMBOL.test(x)))].sort().filter((_,i)=>i%FLOW_GROUPS===slot%FLOW_GROUPS);
}
export function normalizeDailyChain(raw,symbol,receivedAt=new Date().toISOString()){
 const data=raw?.data||raw;
 if(!NSE_SYMBOL.test(symbol)||!data||!Array.isArray(data.strikes)||!data.strikes.length)return null;
 const spot=positive(data.spot_price),expiry=String(data.expiry||"");
 if(!spot||!/^20\d{2}-\d{2}-\d{2}$/.test(expiry))return null;
 const contracts=[];
 const totals={callVolume:0,putVolume:0,callOI:0,putOI:0,callCount:0,putCount:0};
 for(const strikeRow of data.strikes){
  const strike=positive(strikeRow?.strike_price);
  if(!strike)continue;
  for(const [type,side] of [["CE","call"],["PE","put"]]){
   const o=strikeRow?.[side];
   if(!o||typeof o!=="object")continue;
   const volume=f(o.volume),oi=f(o.oi);
   if(volume===null&&oi===null)continue;
   if((volume!==null&&volume<0)||(oi!==null&&oi<0))continue;
   const changeOI=f(o.oi_change),prevOI=oi!==null&&changeOI!==null?oi-changeOI:null;
   const ratio=oi!==null&&oi>0&&volume!==null?volume/oi:null;
   const deltaPct=prevOI!==null&&prevOI>0&&changeOI!==null?100*changeOI/prevOI:null;
   // Heuristic thresholds screen volume/OI and reported changes in OI only.
   // Both need meaningful absolute quantities to avoid low-liquidity noise.
   const volAlert=ratio!==null&&ratio>=1.5&&volume>=500;
   const oiAlert=changeOI!==null&&Math.abs(changeOI)>=500&&deltaPct!==null&&Math.abs(deltaPct)>=20;
   const signal=volAlert||oiAlert;
   const score=signal?Math.round(Math.min(100,
     (volAlert?Math.min(65,18*ratio):0)+(oiAlert?Math.min(35,Math.abs(deltaPct)*0.3):0))):0;
   contracts.push({strike,type,volume,oi,changeOI,prevOI,ltp:f(o.ltp),iv:f(o.iv),
     bid:f(o.bid_price),ask:f(o.ask_price),ratio:ratio===null?null:+ratio.toFixed(3),
     changeOIPct:deltaPct===null?null:+deltaPct.toFixed(2),volAlert,oiAlert,score});
   totals[side+"Volume"]+=volume||0;totals[side+"OI"]+=oi||0;totals[side+"Count"]++;
  }
 }
 if(!contracts.length)return null;
 contracts.sort((a,b)=>b.score-a.score||(b.volume||0)-(a.volume||0));
 const significant=contracts.filter(x=>x.score>0);
 const seen=Date.parse(receivedAt);
 if(!Number.isFinite(seen))return null;
 return {
  symbol,expiry,spot,receivedAt:new Date(seen).toISOString(),
  backendReceivedAt:data.received_at&&Number.isFinite(Date.parse(data.received_at))?new Date(data.received_at).toISOString():null,
  source:"Upstox option-chain REST",timestampBasis:"RECEIPT_TIME_NOT_EXCHANGE_TICK",
  totals,contractCount:contracts.length,
  score:significant[0]?.score||0,alertCount:significant.length,
  // Store the meaningful top contracts and aggregate all strikes; a full
  // exchange-tick tape or full strike-by-strike history is not claimed.
  topContracts:contracts.slice(0,MAX_STORED_CONTRACTS),
  pcrOI:totals.callOI>0?+(totals.putOI/totals.callOI).toFixed(4):null,
  pcrVolume:totals.callVolume>0?+(totals.putVolume/totals.callVolume).toFixed(4):null
 };
}
export function median(values){
 const nums=(Array.isArray(values)?values:[]).filter(x=>f(x)!==null).map(Number).sort((a,b)=>a-b);
 return nums.length?nums.length%2?nums[(nums.length-1)/2]:(nums[nums.length/2-1]+nums[nums.length/2])/2:null;
}
export function unusualVolumeBaseline(today,previousSessions){
 // Compare only when >=10 *complete daily sessions* exist. The current
 // intraday volume vs previous EOD daily volume is not directly comparable.
 if(!today||!Array.isArray(previousSessions)||previousSessions.length<10)return null;
 const values=previousSessions.slice(-15).map(x=>f(x));
 if(values.some(x=>x===null||x<0))return null;
 const m=median(values);
 return m>0?+(Number(today)/m).toFixed(2):null;
}
