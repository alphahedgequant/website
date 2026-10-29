"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
const SYMBOLS=["RELIANCE","HDFCBANK","ICICIBANK","TCS","INFY","SBIN","ITC","LT","AXISBANK","BHARTIARTL","KOTAKBANK","BAJFINANCE","MARUTI"];
const fmt=n=>Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const compact=n=>Number(n||0).toLocaleString("en-IN",{notation:"compact",maximumFractionDigits:1});
const minute=d=>{const t=new Date(d);if(Number.isNaN(t.getTime()))return null;return t.toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hour12:false})};
const indianDate=d=>{const t=new Date(d);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"})};
function volumeCurve(bars){
 const sessions=new Map();
 for(const bar of bars||[]){
  const date=indianDate(bar.date),t=minute(bar.date),v=Number(bar.volume);
  if(!date||!t||t<"09:15"||t>"15:30"||!Number.isFinite(v)||v<0)continue;
  if(!sessions.has(date))sessions.set(date,new Map());
  sessions.get(date).set(t,(sessions.get(date).get(t)||0)+v);
 }
 const days=[...sessions.keys()].sort();
 if(!days.length)return {points:[],sample:0,todayDate:null};
 // Most recent trading session is plotted as the observed session; reference is preceding 15.
 const day=days[days.length-1],hist=days.slice(-16,-1),current=sessions.get(day);
 const timeKeys=[...new Set([...hist,day].flatMap(d=>[...sessions.get(d).keys()]))].sort();
 const cumulative=d=>{let sum=0;const m=new Map();for(const t of timeKeys){sum+=sessions.get(d).get(t)||0;m.set(t,sum)}return m};
 const curves=hist.map(cumulative),today=cumulative(day);
 const median=vals=>{const sorted=vals.slice().sort((a,b)=>a-b);return sorted.length?sorted[Math.floor((sorted.length-1)/2)]:null};
 return {points:timeKeys.map(time=>({time,today:today.get(time)||0,baseline:median(curves.map(m=>m.get(time)||0))})),sample:hist.length,todayDate:day};
}
function VolumeChart({data}){
 const pts=data.points; if(!pts.length)return <p className="text-muted text-sm py-16 text-center">Intraday candles unavailable. No comparison is displayed.</p>;
 const top=Math.max(1,...pts.flatMap(p=>[p.today,p.baseline||0])),w=840,h=250,left=62,right=18,topPad=22,bottom=36;
 const x=i=>left+(w-left-right)*i/Math.max(1,pts.length-1),y=v=>h-bottom-(v/top)*(h-topPad-bottom);
 const path=key=>pts.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p[key]||0).toFixed(1)).join(" ");
 const tick=[0,.25,.5,.75,1];
 return <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Current latest intraday session cumulative volume compared with previous sessions' median at each time" className="w-full h-auto overflow-visible">
 {tick.map(v=><g key={v}><line x1={left} x2={w-right} y1={y(top*v)} y2={y(top*v)} stroke="currentColor" strokeOpacity=".12"/><text x={left-8} y={y(top*v)+4} textAnchor="end" fill="currentColor" opacity=".6" fontSize="12">{compact(top*v)}</text></g>)}
 <path d={path("baseline")} fill="none" stroke="#4c9fd5" strokeWidth="3" strokeDasharray="7 5"/>
 <path d={path("today")} fill="none" stroke="#e4b865" strokeWidth="3.5"/>
 {[0,Math.floor((pts.length-1)/2),pts.length-1].map(i=><text key={i} x={x(i)} y={h-10} fontSize="12" textAnchor="middle" fill="currentColor" opacity=".65">{pts[i].time}</text>)}
 </svg>;
}
export default function Terminal(){
 const [symbol,setSymbol]=useState("RELIANCE"),[quote,setQuote]=useState(null),[history,setHistory]=useState([]),[error,setError]=useState(""),[volumeError,setVolumeError]=useState(""),[last,setLast]=useState(""),[busy,setBusy]=useState(false);
 const loadQuote=useCallback(async(s)=>{try{const r=await fetch("/api/terminal?symbol="+s+"&view=quote",{cache:"no-store"}),j=await r.json();if(!r.ok||!j.success)throw Error(j.error||"Quote unavailable");setQuote(j);setError("");setLast(new Date().toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"}))}catch(e){setQuote(null);setError(e.message)}},[]);
 const loadHistory=useCallback(async(s)=>{try{const r=await fetch("/api/terminal?symbol="+s+"&view=history",{cache:"no-store"}),j=await r.json();if(!r.ok||!j.success||!Array.isArray(j.data))throw Error(j.error||"No intraday history");setHistory(j.data);setVolumeError("")}catch(e){setHistory([]);setVolumeError(e.message)}},[]);
 useEffect(()=>{setQuote(null);setHistory([]);setBusy(true);Promise.all([loadQuote(symbol),loadHistory(symbol)]).finally(()=>setBusy(false));const id=setInterval(()=>loadQuote(symbol),30000);return()=>clearInterval(id)},[symbol,loadQuote,loadHistory]);
 const curve=useMemo(()=>volumeCurve(history),[history]);
 const bid=quote?.bids||[],ask=quote?.asks||[];const buyQty=bid.reduce((a,b)=>a+b.quantity,0),sellQty=ask.reduce((a,b)=>a+b.quantity,0),imbalance=buyQty+sellQty?(buyQty-sellQty)/(buyQty+sellQty)*100:null;
 const spread=bid[0]?.price&&ask[0]?.price?(ask[0].price-bid[0].price):null;
 const end=curve.points[curve.points.length-1],rvol=end&&end.baseline>0?end.today/end.baseline:null;
 return <main className="mx-auto max-w-[1600px] px-4 md:px-7 py-7 text-body">
  <div className="flex flex-wrap gap-4 justify-between items-start">
   <div><p className="eyebrow">[ AHQ : INSTITUTIONAL MARKET WORKSPACE ]</p><h1 className="font-display text-3xl md:text-4xl mt-2">Quant Terminal <span className="text-amber">α</span></h1><p className="text-xs text-muted mt-2">NSE equity · Upstox quote snapshots · historical intraday volume reference</p></div>
   <div className="flex items-center gap-3"><label htmlFor="terminal-symbol" className="text-xs text-muted">INSTRUMENT</label><select id="terminal-symbol" value={symbol} onChange={e=>setSymbol(e.target.value)} className="bg-surface border border-amber/40 rounded-lg px-4 py-3 text-amber font-mono">{SYMBOLS.map(s=><option value={s} key={s}>{s}</option>)}</select></div>
  </div>
  <div className="flex flex-wrap gap-3 text-xs font-mono text-muted my-5"><span className="border border-line rounded px-2 py-1">QUOTE: {last?"Last refreshed "+last+" IST":"Not connected"}</span><span className="border border-line rounded px-2 py-1">REFRESH: 30 SEC</span><span className="border border-line rounded px-2 py-1">{busy?"LOADING":"READ ONLY · NO ORDER EXECUTION"}</span><Link href="/options" className="text-amber underline px-2 py-1">Open Options Analytics ↗</Link><Link href="/scanner" className="text-amber underline px-2 py-1">Scanner ↗</Link></div>
  {error&&<div role="status" className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-sm text-amber mb-5">Live Upstox quote unavailable: {error}. Depth and price intentionally remain blank. Reconnect the backend Upstox session if needed.</div>}
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
   {[["LAST TRADED PRICE",quote?.price!=null&&quote.price>0?"₹"+fmt(quote.price):"—"],["NET CHANGE",quote?.change!=null?"₹"+fmt(quote.change):"—"],["SESSION VOLUME",quote?.volume!=null?compact(quote.volume):"—"],["TOP 5 DEPTH IMBALANCE",imbalance==null?"—":imbalance.toFixed(1)+"%"]].map(([label,value])=><div className="card p-4" key={label}><p className="text-[11px] font-mono text-muted">{label}</p><p className="text-xl sm:text-3xl font-mono text-body mt-3 tabular-nums">{value}</p></div>)}
  </div>
  <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-4 mt-4">
   <section className="card p-5 md:p-6 min-w-0"><div className="flex items-start justify-between flex-wrap gap-2"><div><p className="eyebrow">VOLUME INTELLIGENCE</p><h2 className="font-display text-xl mt-2">Intraday participation vs 15-session median</h2><p className="text-xs text-muted mt-2">Cumulative 5-minute volume at matching IST clock times · session shown: {curve.todayDate||"—"}</p></div><p className="text-amber font-mono text-lg">{rvol==null?"RVOL —":"RVOL "+rvol.toFixed(2)+"×"}</p></div>
   <div className="flex gap-4 text-xs text-muted mt-5"><span><span className="text-amber">━━</span> Latest session</span><span><span className="text-[#4c9fd5]">┄┄</span> Historical median</span></div><div className="mt-3"><VolumeChart data={curve}/></div>
   {volumeError&&<p className="text-xs text-amber mt-3">Historical data unavailable: {volumeError}</p>}
   <p className="text-xs text-muted mt-3">Baseline: {curve.sample} prior trading sessions (up to 15). Latest available historical session may not be today; missing candles and partial trading sessions can distort comparisons. Historical candles are not an Upstox live-volume stream.</p></section>
   <section className="card p-5 md:p-6 min-w-0"><p className="eyebrow">MARKET MICROSTRUCTURE</p><h2 className="font-display text-xl mt-2">Level 2 · 5 × 5 Depth</h2><p className="text-xs text-muted mt-2">Upstox top-five price levels · snapshot refreshed every 30 seconds, not tick-by-tick</p>
    <div className="grid grid-cols-2 gap-4 mt-6">{[["BIDS",bid,"#51c996"],["ASKS",ask,"#e2797a"]].map(([name,rows,color])=><div key={name}><p className="text-xs font-mono mb-3" style={{color}}>{name}</p><div className="space-y-2">{rows.length?rows.map((d,i)=><div key={i} className="relative overflow-hidden rounded bg-raised px-2 py-2 text-xs font-mono"><div className="absolute inset-y-0 left-0 opacity-15" style={{width:Math.min(100,d.quantity/Math.max(1,...rows.map(z=>z.quantity))*100)+"%",background:color}}/><div className="relative flex flex-wrap gap-1 justify-between"><span>{fmt(d.price)}</span><span>{compact(d.quantity)}</span></div><p className="relative text-[10px] text-muted mt-1">{fmt(d.orders)} orders</p></div>):<p className="text-xs text-muted py-10">No verified depth</p>}</div></div>)}</div>
    <div className="grid grid-cols-2 gap-3 border-t border-line mt-5 pt-5 text-xs"><div><p className="text-muted">Best bid / ask</p><p className="font-mono mt-2">{bid[0]?.price?fmt(bid[0].price):"—"} / {ask[0]?.price?fmt(ask[0].price):"—"}</p></div><div><p className="text-muted">Quoted spread</p><p className="font-mono mt-2">{spread==null?"—":"₹"+fmt(spread)}</p></div><div><p className="text-muted">Visible bid qty</p><p className="font-mono mt-2">{bid.length?compact(buyQty):"—"}</p></div><div><p className="text-muted">Visible ask qty</p><p className="font-mono mt-2">{ask.length?compact(sellQty):"—"}</p></div></div></section>
  </div>
  <div className="card p-5 mt-4"><h2 className="font-display text-lg">Terminal modules</h2><div className="flex flex-wrap gap-3 mt-3 text-sm">{[["Options strategy & Greeks","/options"],["Market scanner","/scanner"],["Gamma and IV models","/models"],["Backtesting","/backtest"]].map(([label,url])=><Link key={url} href={url} className="rounded-lg border border-line px-4 py-3 text-amber hover:border-amber/40">{label} ↗</Link>)}</div><p className="text-xs text-muted mt-4">Phase 1 focuses on trustworthy quote depth and historical volume curves. Full tick-streaming, 15-session Upstox intraday capture, institutional order-flow analytics and gamma-flip overlays require subsequent data-pipeline integration. No signals or depth levels are simulated.</p></div>
 </main>
}
