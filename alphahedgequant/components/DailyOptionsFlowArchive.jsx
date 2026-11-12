"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {unusualVolumeBaseline} from "@/lib/dailyOptionsFlow.mjs";
const count=x=>typeof x==="number"&&Number.isFinite(x)?x.toLocaleString("en-IN",{maximumFractionDigits:0}):"—";
const value=(x,d=2)=>typeof x==="number"&&Number.isFinite(x)?x.toLocaleString("en-IN",{maximumFractionDigits:d}):"—";
const ist=x=>x?new Date(x).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})+" IST":"—";
const DAILY_SOURCE="Daily snapshots capture observed NSE F&O option-chain volume, OI and IV, not signed buy/sell transactions. Receipt timestamps are not exchange tick timestamps.";
export default function DailyOptionsFlowArchive({selectedTicker="",stockOptions=[],onOpenChain}){
 const [day,setDay]=useState(""),[loadedDay,setLoadedDay]=useState("");
 const [rows,setRows]=useState([]),[coverage,setCoverage]=useState(null),[runDetails,setRunDetails]=useState([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [query,setQuery]=useState(""),[focusSymbol,setFocusSymbol]=useState(""),[history,setHistory]=useState([]);
 const [detailLoading,setDetailLoading]=useState(false),[detailError,setDetailError]=useState("");
 const [refresh,setRefresh]=useState(0);
 const load=useCallback(async(signal)=>{
  setLoading(true);setError("");
  try{
   const url="/api/options-flow"+(day?"?day="+encodeURIComponent(day):"");
   const r=await fetch(url,{cache:"no-store",signal});
   const j=await r.json();
   if(!r.ok||!j.success)throw Error(j.error||"Daily options archive unavailable");
   if(signal.aborted)return;
   setRows(Array.isArray(j.items)?j.items:[]);
   setCoverage(j.coverage||null);setRunDetails(Array.isArray(j.runs)?j.runs:[]);
   setLoadedDay(j.day||"");
  }catch(e){
   if(signal.aborted)return;
   setRows([]);setCoverage(null);setRunDetails([]);
   setError(e.message||"Historical options archive currently unavailable");
  }finally{if(!signal.aborted)setLoading(false)}
 },[day]);
 useEffect(()=>{const c=new AbortController();load(c.signal);return()=>c.abort()},[load,refresh]);
 useEffect(()=>{
  if(!focusSymbol){setHistory([]);setDetailError("");return}
  const c=new AbortController();setDetailLoading(true);setDetailError("");
  fetch("/api/options-flow?symbol="+encodeURIComponent(focusSymbol),{cache:"no-store",signal:c.signal})
   .then(async r=>{const j=await r.json();if(!r.ok||!j.success)throw Error(j.error||"Ticker history unavailable");return j})
   .then(j=>{if(!c.signal.aborted)setHistory(j.history||[])})
   .catch(e=>{if(!c.signal.aborted){setHistory([]);setDetailError(e.message)}})
   .finally(()=>{if(!c.signal.aborted)setDetailLoading(false)});
  return()=>c.abort();
 },[focusSymbol,refresh]);
 const ranked=useMemo(()=>{
  const q=query.trim().toUpperCase();
  return rows.filter(x=>!q||x.symbol.includes(q)).slice(0,350);
 },[rows,query]);
 const todayHistory=useMemo(()=>history.find(x=>x.day===loadedDay)||history[0]||null,[history,loadedDay]);
 const ratios=useMemo(()=>{
  if(!todayHistory)return {call:null,put:null};
  const previous=history.filter(x=>x.day<todayHistory.day&&x.expiry===todayHistory.expiry).slice(0,15);
  return {
   call:unusualVolumeBaseline(todayHistory.call_volume,previous.map(x=>x.call_volume).reverse()),
   put:unusualVolumeBaseline(todayHistory.put_volume,previous.map(x=>x.put_volume).reverse())
  };
 },[history,todayHistory]);
 const hasSelection=Boolean(focusSymbol);
 return <section className="qt-daily-archive" aria-label="Persistent daily NSE options flow archive" data-testid="daily-options-flow-archive">
  <div className="qt-archive-head"><div>
   <p className="qt-archive-kicker">NSE DERIVATIVES / PERSISTENT MARKET HISTORY</p>
   <h2>Daily Unusual Options Activity</h2>
   <p>Every trading day, scheduled collectors sample eligible NSE stock-option underlyings and preserve their volume, open interest and abnormal contract metrics for historical review.</p>
  </div><button type="button" onClick={()=>setRefresh(n=>n+1)} disabled={loading}>↻ Check archive</button></div>
  <div className="qt-archive-controls">
   <label>Date <input aria-label="Options archive trading date" type="date" value={day||loadedDay} max={new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})} onChange={e=>setDay(e.target.value)}/></label>
   <label>Ticker <input aria-label="Filter archived NSE option tickers" type="search" placeholder="Search NSE F&O ticker" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <button type="button" onClick={()=>{setDay("");setQuery("");setFocusSymbol("")}}>Latest records</button>
   {selectedTicker&&<button type="button" onClick={()=>setFocusSymbol(selectedTicker)}>Inspect {selectedTicker}</button>}
  </div>
  <div className="qt-archive-metrics" aria-label="Archive coverage">
   <div><small>TRADING DATE</small><strong>{loadedDay||"—"}</strong></div>
   <div><small>F&O ELIGIBLE TICKERS</small><strong>{count(coverage?.eligible)}</strong></div>
   <div><small>TICKERS RECORDED</small><strong>{count(coverage?.observed)}</strong></div>
   <div><small>COLLECTION WINDOWS</small><strong>{coverage?coverage.batches+"/8":"—"}</strong></div>
  </div>
  {coverage?.incomplete&&<p className="qt-archive-warning" role="status">Incomplete NSE F&O coverage for this date: some scheduled windows have not completed or returned valid data. Missing tickers are not treated as having zero activity.</p>}
  {error&&<p className="qt-archive-warning" role="alert">{error}</p>}
  {!loading&&!error&&!rows.length&&<p className="qt-archive-warning" role="status">No verified snapshots have been stored for this trading date. Collections begin only when the scheduled job, Neon database and valid Upstox session are available.</p>}
  <div className="qt-archive-scroll"><table aria-label="Daily unusual options activity leaderboard">
   <thead><tr><th>TICKER</th><th>ACTIVITY SCORE</th><th>FLAGGED CONTRACTS</th><th>CALL VOL</th><th>PUT VOL</th><th>PUT/CALL OI</th><th>LAST OBSERVED</th><th>DETAILS</th></tr></thead>
   <tbody>{ranked.map(item=><tr key={item.symbol}>
    <td><strong>{item.symbol}</strong></td>
    <td><span className={item.activity_score>0?"qt-flow-active":""}>{count(item.activity_score)}</span></td>
    <td>{count(item.alert_count)}</td><td>{count(item.call_volume)}</td><td>{count(item.put_volume)}</td><td>{value(item.pcr_oi,3)}</td>
    <td>{ist(item.observed_at)}</td>
    <td><button type="button" onClick={()=>setFocusSymbol(item.symbol)}>History ↗</button></td>
   </tr>)}</tbody>
  </table></div>
  {hasSelection&&<div className="qt-archive-detail">
    <div className="qt-archive-detail-head"><div><h3>{focusSymbol} · Ticker history</h3><p>Archive of the last 45 recorded trading sessions</p></div>
    <div><button type="button" onClick={()=>onOpenChain?.(focusSymbol)}>Open option chain ↗</button><button type="button" onClick={()=>setFocusSymbol("")}>Close</button></div></div>
    {detailLoading?<p>Retrieving historical snapshots…</p>:detailError?<p role="alert">{detailError}</p>:!history.length?<p>No verified historical observations are stored for {focusSymbol}.</p>:<>
     <div className="qt-archive-metrics">
      <div><small>LATEST EXPIRY</small><strong>{todayHistory?.expiry||"—"}</strong></div>
      <div><small>15-SESSION CALL VOLUME</small><strong>{ratios.call===null?"Building baseline":ratios.call+"× median"}</strong></div>
      <div><small>15-SESSION PUT VOLUME</small><strong>{ratios.put===null?"Building baseline":ratios.put+"× median"}</strong></div>
      <div><small>RECENT SCORE</small><strong>{count(todayHistory?.activity_score)}</strong></div>
     </div>
     {todayHistory?.top_contracts?.length>0&&<div className="qt-archive-scroll"><table aria-label="Ticker unusual option contracts"><thead><tr><th>STRIKE</th><th>TYPE</th><th>VOL</th><th>OI</th><th>VOL/OI</th><th>OI Δ</th><th>OI Δ%</th><th>IV</th></tr></thead><tbody>{todayHistory.top_contracts.filter(x=>x.score>0).slice(0,14).map(x=><tr key={x.strike+":"+x.type}><td>{value(x.strike)}</td><td>{x.type}</td><td>{count(x.volume)}</td><td>{count(x.oi)}</td><td>{value(x.ratio)}×</td><td>{count(x.changeOI)}</td><td>{x.changeOIPct===null?"—":value(x.changeOIPct)+"%"}</td><td>{value(x.iv)}</td></tr>)}</tbody></table></div>}
     <div className="qt-archive-scroll"><table aria-label="Ticker daily options history"><thead><tr><th>DAY</th><th>EXPIRY</th><th>CALL VOL</th><th>PUT VOL</th><th>PCR OI</th><th>ACTIVITY</th><th>RECORDED</th></tr></thead><tbody>{history.map(x=><tr key={x.day}><td>{x.day}</td><td>{x.expiry}</td><td>{count(x.call_volume)}</td><td>{count(x.put_volume)}</td><td>{value(x.pcr_oi,3)}</td><td>{count(x.activity_score)}</td><td>{ist(x.observed_at)}</td></tr>)}</tbody></table></div>
     <p className="qt-archive-caption">Historical 15-session volume median is shown only with 10 or more comparable, same-expiry trading-day observations. Missing dates, rollovers and incomplete coverage are never filled with estimates.</p>
    </>}
   </div>}
  <p className="qt-archive-caption">{DAILY_SOURCE} Activity scores are non-predictive filters based on meaningful volume/open-interest ratios and changes in OI. Scheduled jobs may be skipped on market holidays, provider outages or expired broker authorization. {runDetails.length>0?"Last collection window: "+ist(runDetails.at(-1)?.checked_at)+".":""}</p>
 </section>;
}
