// Evidence-weighted description of third-party published analyst recommendations.
// This is not a regulated or independently certified research-performance rating.
const finite=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
export const MIN_RANKED_CALLS=10;
export function wilsonLowerBound(wins,observations,z=1.96){
 if(!Number.isInteger(wins)||!Number.isInteger(observations)||observations<=0||wins<0||wins>observations)return null;
 const p=wins/observations,z2=z*z,den=1+z2/observations;
 const lower=(p+z2/(2*observations)-z*Math.sqrt(p*(1-p)/observations+z2/(4*observations*observations)))/den;
 return Math.max(0,Math.min(1,lower));
}
const round=(value,digits=1)=>+value.toFixed(digits);
export function aggregateCallOutcomes(entries,scoreFn){
 const byFirm=new Map(),byAnalyst=new Map();
 function seed(house,analystName=null){
  return {house,analystName,total:0,verified:0,resolved:0,active:0,
   wins:0,targetHits:0,targetEligible:0,ret:[],counts:{BUY:0,SELL:0,HOLD:0}};
 }
 for(const call of entries){
  const house=String(call.house||"").trim();
  if(!house)continue;
  const analystName=String(call.analyst_name||"").trim();
  const identity=analystName?house.toLocaleLowerCase("en")+"::"+analystName.toLocaleLowerCase("en"):null;
  const firmId=house.toLocaleLowerCase("en");
  if(!byFirm.has(firmId))byFirm.set(firmId,seed(house));
  if(identity&&!byAnalyst.has(identity))byAnalyst.set(identity,seed(house,analystName));
  const metrics=[byFirm.get(firmId),...(identity?[byAnalyst.get(identity)]:[])];
  const outcome=scoreFn(call);
  for(const row of metrics){
   row.total++;
   if(call.verification_status!=="verified")continue;
   row.verified++;
   if(!outcome?.resolved){
    if(outcome?.status==="active")row.active++;
    continue;
   }
   if(!["BUY","SELL"].includes(call.rating))continue;
   row.resolved++;
   row.counts[call.rating]++;
   if(outcome.madeMoney===true)row.wins++;
   if(outcome.targetHit!==null&&outcome.targetHit!==undefined){
    row.targetEligible++;
    if(outcome.targetHit===true)row.targetHits++;
   }
   if(finite(outcome.returnPct)!==null)row.ret.push(outcome.returnPct);
  }
 }
 function summarize(x){
  const count=x.resolved,lower=wilsonLowerBound(x.wins,count);
  const returns=[...x.ret].sort((a,b)=>a-b);
  const midpoint=returns.length?returns.length%2?returns[(returns.length-1)/2]:(returns[returns.length/2-1]+returns[returns.length/2])/2:null;
  return {house:x.house,analystName:x.analystName,
   totalCalls:x.total,verifiedCalls:x.verified,resolvedCalls:count,activeCalls:x.active,
   unverifiedCalls:x.total-x.verified,wins:x.wins,
   winRate:count?round(100*x.wins/count):null,
   // Retain previous interface field for API compatibility, but the UI
   // calls this observed directional win rate, not objective "trust".
   trustScore:count>=MIN_RANKED_CALLS?Math.round(100*x.wins/count):null,
   confidenceFloor:count>=MIN_RANKED_CALLS?round(100*lower):null,
   rankEligible:count>=MIN_RANKED_CALLS,
   sampleWarning:count<MIN_RANKED_CALLS?"At least "+MIN_RANKED_CALLS+" resolved verified BUY/SELL calls are required to rank":null,
   targetHitRate:x.targetEligible?round(100*x.targetHits/x.targetEligible):null,
   targetEvidenceCount:x.targetEligible,
   avgReturn:x.ret.length?round(x.ret.reduce((s,v)=>s+v,0)/x.ret.length,2):null,
   medianReturn:midpoint===null?null:round(midpoint,2),
   ratings:x.counts};
 }
 const sort=(a,b)=>Number(b.rankEligible)-Number(a.rankEligible)||
  (b.confidenceFloor??-1)-(a.confidenceFloor??-1)||
  b.resolvedCalls-a.resolvedCalls||a.house.localeCompare(b.house);
 return {leaderboard:[...byFirm.values()].map(summarize).sort(sort),
   analysts:[...byAnalyst.values()].map(summarize).sort(sort),
   methodology:{minimumResolved:MIN_RANKED_CALLS,
    ranking:"95% Wilson lower confidence bound on observed directional win rate, among eligible verified and horizon-resolved BUY/SELL calls",
    benchmarkAdjusted:false,dividendsIncluded:false,transactionCostsIncluded:false,
    caveat:"Descriptive sample statistics; not regulator/PaRRVA-verified, not a prediction of an analyst's future accuracy."}};
}
