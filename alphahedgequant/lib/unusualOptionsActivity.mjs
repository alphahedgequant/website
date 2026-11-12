// Honest snapshot-based activity ranking. This does not infer transaction
// direction, sweeps, blocks or institutionally initiated orders.
export const finite=v=>v===null||v===undefined||v===""||!Number.isFinite(Number(v))?null:Number(v);
export function rankOptionActivity(chain){
 const strikes=Array.isArray(chain?.strikes)?chain.strikes:[];
 return strikes.flatMap(row=>["call","put"].map(side=>{
  const leg=row?.[side]||{},volume=finite(leg.volume),oi=finite(leg.oi),
    change=finite(leg.oi_change),strike=finite(row?.strike_price);
  if(volume===null||volume<0||strike===null||strike<=0)return null;
  const ratio=oi!==null&&oi>0?volume/oi:null;
  return {id:String(strike)+side,strike,type:side==="call"?"CE":"PE",
    volume,oi,change,ratio,ltp:finite(leg.ltp),iv:finite(leg.iv)};
 })).filter(Boolean).sort((a,b)=>(b.ratio??-1)-(a.ratio??-1)||b.volume-a.volume);
}
