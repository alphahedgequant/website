"use client";
import {useMemo} from "react";

const num=x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))?null:Number(x);
const display=(x,d=0)=>num(x)===null?"—":Number(x).toLocaleString("en-IN",{maximumFractionDigits:d,minimumFractionDigits:d});
export function rankOptionActivity(chain){
 const strikes=Array.isArray(chain?.strikes)?chain.strikes:[];
 return strikes.flatMap(row=>["call","put"].map(side=>{
  const leg=row[side]||{},volume=num(leg.volume),oi=num(leg.oi),change=num(leg.oi_change);
  if(volume===null||volume<0||num(row.strike_price)===null)return null;
  const ratio=oi!==null&&oi>0?volume/oi:null;
  return {id:String(row.strike_price)+side,strike:Number(row.strike_price),
   type:side==="call"?"CE":"PE",volume,oi,change,ratio,ltp:num(leg.ltp),
   iv:num(leg.iv),notional:num(leg.ltp)!==null?volume*leg.ltp:null};
 })).filter(Boolean).sort((a,b)=>(b.ratio??-1)-(a.ratio??-1)||b.volume-a.volume);
}
export default function UnusualOptionsFlowBox({symbol,chain,onOpenMonitor,onOpenChain}){
 const rows=useMemo(()=>rankOptionActivity(chain).slice(0,14),[chain]);
 const qualified=rows.filter(x=>x.ratio!==null&&x.ratio>=1.5);
 return <div className="qt-unusual-box" aria-label="Unusual options activity box">
   <div className="qt-unusual-intro"><div><strong>UNUSUAL OPTIONS ACTIVITY</strong>
     <span>{symbol} · {chain?.expiry||"expiry unavailable"} · chain snapshot</span></div>
     <button type="button" onClick={onOpenMonitor}>OPEN FLOW MONITOR ↗</button>
   </div>
   <p className="qt-unusual-caption">Activity screen, not signed trade flow. Volume / current OI highlights unusually heavy turnover <em>relative to outstanding open interest</em>; it does not identify sweeps or buyers.</p>
   <div className="qt-unusual-summary">
     <span>CONTRACTS <b>{rows.length?display(rankOptionActivity(chain).length):"—"}</b></span>
     <span>V/OI ≥ 1.5× <b>{rows.length?display(qualified.length):"—"}</b></span>
     <span>UNDERLYING <b>{symbol}</b></span>
   </div>
   {rows.length?<div className="qt-unusual-scroll"><table><thead><tr><th>CONTRACT</th><th>VOL</th><th>OI</th><th>VOL/OI</th><th>Δ OI</th><th>LTP</th></tr></thead><tbody>
   {rows.map(row=><tr key={row.id}><td><button type="button" onClick={onOpenChain}>{display(row.strike,2)} {row.type}</button></td>
     <td>{display(row.volume)}</td><td>{display(row.oi)}</td><td className={row.ratio>=1.5?"qt-unusual-highlight":""}>{row.ratio===null?"—":row.ratio.toFixed(2)+"×"}</td>
     <td className={row.change===null?"":row.change>0?"positive":row.change<0?"negative":""}>{row.change===null?"—":(row.change>0?"+":"")+display(row.change)}</td><td>{display(row.ltp,2)}</td></tr>)}
   </tbody></table></div>:<div className="qt-unusual-empty">No verified NSE option-chain contracts for this ticker. NSE cash stocks without active F&O contracts have no options activity panel.</div>}
   <p className="qt-unusual-caption">Source: Upstox chain snapshot · OI and volume are not a historical 15-session baseline. For actual changes between snapshots, use the FLOW monitor.</p>
 </div>;
}
