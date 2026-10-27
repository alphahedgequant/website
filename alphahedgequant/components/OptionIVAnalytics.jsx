"use client";
import {useMemo,useState} from "react";
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ReferenceLine} from "recharts";
const numeric=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
export default function OptionIVAnalytics({chain,spot,history,expiry,marketOpen,lastUpdated}){
 const [view,setView]=useState("smile");
 const smile=useMemo(()=>(chain||[]).map(row=>({
   strike:Number(row.strike_price),
   call:numeric(row.call?.iv),
   put:numeric(row.put?.iv)
 })).filter(r=>Number.isFinite(r.strike)&& (r.call!==null||r.put!==null)).sort((a,b)=>a.strike-b.strike),[chain]);
 const atm=useMemo(()=>smile.reduce((best,r)=>!best||Math.abs(r.strike-spot)<Math.abs(best.strike-spot)?r:best,null),[smile,spot]);
 const points=view==="smile"?smile:history;
 const empty=points.length<2;
 return <section className="mt-6 rounded-xl border border-line bg-surface p-4 md:p-5" aria-label="Implied volatility analytics">
   <div className="flex flex-wrap gap-3 items-start justify-between">
     <div><p className="eyebrow mb-2">[ AHQ : OPTIONS VOLATILITY ]</p>
      <h2 className="font-display text-xl md:text-2xl text-body">Implied Volatility Analytics</h2>
      <p className="text-sm text-muted mt-1">Actual option-chain IV observations returned by the connected provider. No synthetic prices.</p></div>
     <div className="flex gap-2">
       <button type="button" aria-pressed={view==="smile"} onClick={()=>setView("smile")} className={`border rounded px-3 py-2 text-xs ${view==="smile"?"border-amber text-amber":"border-line text-muted"}`}>IV smile by strike</button>
       <button type="button" aria-pressed={view==="history"} onClick={()=>setView("history")} className={`border rounded px-3 py-2 text-xs ${view==="history"?"border-amber text-amber":"border-line text-muted"}`}>ATM IV during visit</button>
     </div>
   </div>
   <div className="flex flex-wrap gap-3 mt-4 text-xs font-mono text-muted">
     <span>Expiry: {expiry||"Provider default"}</span>
     <span>ATM strike: {atm?.strike??"—"}</span>
     <span>ATM CE IV: {atm?.call??"—"}</span>
     <span>ATM PE IV: {atm?.put??"—"}</span>
   </div>
   {empty?<div className="rounded-lg border border-line flex justify-center items-center min-h-52 text-sm text-muted mt-4 p-5 text-center">{view==="history"?"The time series starts from fresh responses after you open this page. Keep the desk open during market hours to accumulate at least two observations.":"No usable implied-volatility values were returned for this expiry."}</div>:
     <div className="mt-4 h-[310px]"><ResponsiveContainer width="100%" height="100%">
       <LineChart data={points} margin={{top:12,right:12,left:0,bottom:8}}>
         <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.09}/>
         <XAxis dataKey={view==="smile"?"strike":"time"} tick={{fontSize:11}} minTickGap={25}/>
         <YAxis tick={{fontSize:11}} width={55} domain={["auto","auto"]}/>
         <Tooltip contentStyle={{background:"#161d2d",border:"1px solid #4a5568",color:"#fff"}}/>
         <Legend/>
         {view==="smile"&&atm&&<ReferenceLine x={atm.strike} stroke="#b99054" strokeDasharray="4 4"/>}
         <Line connectNulls={false} type="monotone" dataKey="call" stroke="#34b77a" name="Call IV (provider units)" dot={false} isAnimationActive={false}/>
         <Line connectNulls={false} type="monotone" dataKey="put" stroke="#aa78e7" name="Put IV (provider units)" dot={false} isAnimationActive={false}/>
       </LineChart>
     </ResponsiveContainer></div>}
   <p className="text-xs text-muted leading-relaxed mt-3">{view==="smile"?"Strike IV curve for the selected expiry; each refresh replaces the displayed quote values.":"Session-only samples collected in this browser tab, not historical or persisted time-series data."} Last successful response: {lastUpdated?new Date(lastUpdated).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"}):"Not yet available"} IST. {marketOpen?"Market hours; refresh may be active.":"Outside regular NSE trading hours or market holiday; price updates may stop."} Provider IV units are shown unchanged and may require normalisation.</p>
 </section>;
}
