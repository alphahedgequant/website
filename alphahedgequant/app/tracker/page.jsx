"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import "./tracker.css";

const INITIAL={house:"",analyst_name:"",symbol:"",rating:"BUY",target_price:"",price_at_call:"",call_date:"",horizon_days:"",source_url:"",note:""};
const fmt=(x,dp=1)=>x===null||x===undefined||!Number.isFinite(Number(x))?"—":Number(x).toLocaleString("en-IN",{minimumFractionDigits:dp,maximumFractionDigits:dp});
const day=x=>x?String(x).slice(0,10):"—";
const safeSource=x=>typeof x==="string"&&/^https:\/\/[^/]+/i.test(x);
const direction=x=>x>0?"positive":x<0?"negative":"neutral";
function Status({call}){
 if(call.verification_status!=="verified")return <span className="tt-status">Awaiting source review</span>;
 if(call.status==="active")return <span className="tt-status">Horizon active</span>;
 if(call.status==="price_unavailable"||call.status==="insufficient_history"||call.status==="unverified")return <span className="tt-status">Price evidence pending</span>;
 if(call.rating==="HOLD")return <span className="tt-status">HOLD · not directional</span>;
 if(!call.resolved)return <span className="tt-status">Not yet resolved</span>;
 return <span className={"tt-status "+(call.madeMoney?"positive":"negative")}>{call.madeMoney?"Positive outcome":"Negative outcome"}</span>;
}
function Source({call}){
 return safeSource(call.source_url)?
   <a href={call.source_url} rel="noopener noreferrer" target="_blank" className="tt-source">Original publication ↗</a>:
   <span className="tt-secondary">Original publication unavailable</span>;
}
function Summary({label,value,detail}){
 return <div className="tt-summary"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
function CallTable({items,canEdit,onReview,onDelete,compact=false}){
 return <div className="tt-table-scroll"><table>
  <thead><tr><th>Firm / Analyst</th><th>Ticker</th><th>View</th><th>Published</th><th>Entry</th><th>Target</th><th>Horizon</th><th>Outcome</th><th>Evidence</th>{canEdit&&<th>Editor</th>}</tr></thead>
  <tbody>{items.map(call=><tr key={call.id}>
   <td><strong>{call.house}</strong><small>{call.analyst_name||"Named analyst not provided"}</small></td>
   <td className="tt-mono">{call.symbol}</td>
   <td><span className={"tt-rating "+call.rating.toLowerCase()}>{call.rating}</span></td>
   <td className="tt-mono">{day(call.call_date)}</td>
   <td className="tt-mono">{fmt(call.price_at_call,2)}</td>
   <td className="tt-mono">{fmt(call.target_price,2)}</td>
   <td className="tt-mono">{call.horizon_days} days</td>
   <td><Status call={call}/>{call.resolved&&typeof call.returnPct==="number"&&
    <small className={direction(call.returnPct)}>{call.returnPct>0?"+":""}{fmt(call.returnPct,2)}% directional price return</small>}</td>
   <td><Source call={call}/>{call.verification_status==="verified"&&<small>AHQ editorial source review</small>}</td>
   {canEdit&&<td><div className="tt-inline-actions">
     {call.verification_status!=="verified"&&<button onClick={()=>onReview(call)} type="button">Review</button>}
     <button type="button" onClick={()=>onDelete(call)} aria-label={"Archive call "+call.id}>Archive</button>
    </div></td>}
  </tr>)}</tbody>
 </table>{!items.length&&<p className="tt-table-empty">No matching sourced recommendations.</p>}</div>;
}
function EntryForm({onComplete}){
 const [form,setForm]=useState(INITIAL),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const change=(key,value)=>setForm(x=>({...x,[key]:value}));
 const valid=form.house.trim()&&form.symbol.trim()&&Number(form.target_price)>0&&
  Number(form.price_at_call)>0&&form.call_date&&safeSource(form.source_url)&&
  Number.isInteger(Number(form.horizon_days))&&Number(form.horizon_days)>0;
 async function submit(e){
  e.preventDefault();if(!valid||busy)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/tracker/calls",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   const j=await r.json();
   if(!r.ok||!j.success)throw Error(j.error||"Source submission failed");
   setForm({...INITIAL,house:form.house});onComplete("Submitted for editorial source review. It does not affect public rankings until verified.");
  }catch(e){setError(e.message||"Could not submit source")}finally{setBusy(false)}
 }
 return <form className="tt-entry" onSubmit={submit}>
  <div className="tt-section-heading"><h2>Add a documented research call</h2><p>Editorial workflow only. New calls are unverified and excluded from public rankings.</p></div>
  <div className="tt-entry-fields">
   {[
    ["house","Research firm","text","Exact publisher or brokerage name"],
    ["analyst_name","Named analyst (optional)","text","As printed on the report"],
    ["symbol","Equity ticker","text","NSE or US symbol"],
    ["target_price","Published target price","number","Published target"],
    ["price_at_call","Price at publication","number","Historical published close"],
    ["call_date","Publication date","date",""],
    ["horizon_days","Published horizon (days)","number","As stated in source"],
    ["source_url","Original report URL","url","https://publisher.example/report"]
   ].map(([key,label,type,placeholder])=><label key={key}>{label}<input
    type={type} min={type==="number"?0.01:undefined} step={type==="number"?"any":undefined}
    placeholder={placeholder} value={form[key]} required={key!=="analyst_name"} onChange={e=>change(key,key==="symbol"?e.target.value.toUpperCase():e.target.value)}/></label>)}
   <label>Published rating<select value={form.rating} onChange={e=>change("rating",e.target.value)}>
    <option value="BUY">BUY</option><option value="HOLD">HOLD</option><option value="SELL">SELL</option>
   </select></label>
   <label className="tt-field-full">Evidence notes (optional)<textarea value={form.note} rows={3} maxLength={2000} onChange={e=>change("note",e.target.value)} placeholder="Published reasoning, rating definition and adjustments to verify"/></label>
  </div>
  {error&&<p role="alert" className="tt-message">{error}</p>}
  <button className="tt-primary" type="submit" disabled={!valid||busy}>{busy?"Saving…":"Submit for verification"}</button>
  <p className="tt-method-note">Before approval, confirm the actual dated source, attributed firm and analyst, rating, price target and historical entry price. Unverified submissions remain editor-only.</p>
 </form>;
}
export default function TrackerPage(){
 const [view,setView]=useState("firms"),[term,setTerm]=useState(""),[callFilter,setCallFilter]=useState("all");
 const [leaderboard,setLeaderboard]=useState([]),[analysts,setAnalysts]=useState([]),[calls,setCalls]=useState([]);
 const [methodology,setMethodology]=useState(null),[coverage,setCoverage]=useState(null);
 const [canEdit,setCanEdit]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [selected,setSelected]=useState(null),[message,setMessage]=useState("");
 const [revision,setRevision]=useState(0);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  setLoading(true);setError("");
  Promise.all([
   fetch("/api/tracker/leaderboard",{signal:controller.signal,cache:"no-store"}).then(r=>r.json().then(j=>({ok:r.ok,...j}))),
   fetch("/api/tracker/calls",{signal:controller.signal,cache:"no-store"}).then(r=>r.json().then(j=>({ok:r.ok,...j}))),
   fetch("/api/tracker/editor",{signal:controller.signal,cache:"no-store"}).then(r=>r.ok?r.json():{canEdit:false}).catch(()=>({canEdit:false}))
  ]).then(([lb,history,editor])=>{
   if(!active)return;
   if(!lb.ok||!lb.success||!history.ok||!history.success)throw Error("Tracker evidence is temporarily unavailable; historical rankings cannot be confirmed.");
   setLeaderboard(lb.leaderboard||[]);setAnalysts(lb.analysts||[]);
   setMethodology(lb.methodology||null);setCoverage(lb.sourceCoverage||null);
   setCalls(history.calls||[]);setCanEdit(editor.canEdit===true);
  }).catch(e=>{if(active){setError(e.message||"Unable to retrieve tracker records");setLeaderboard([]);setAnalysts([]);setCalls([]);}})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false;controller.abort()};
 },[revision]);
 const ranks=useMemo(()=>{
  const q=term.toLowerCase().trim();
  return (view==="analysts"?analysts:leaderboard).filter(x=>(x.house+" "+(x.analystName||"")).toLowerCase().includes(q));
 },[view,analysts,leaderboard,term]);
 const rows=useMemo(()=>{
  const q=term.toLowerCase().trim();
  return calls.filter(c=>(c.house+" "+(c.analyst_name||"")+" "+c.symbol).toLowerCase().includes(q))
   .filter(c=>callFilter==="all"||callFilter==="reviewed"&&c.verification_status==="verified"||
    callFilter==="pending"&&c.verification_status!=="verified"||
    callFilter==="resolved"&&c.resolved===true);
 },[calls,term,callFilter]);
 const profileCalls=useMemo(()=>{
  if(!selected)return [];
  return calls.filter(c=>c.house.toLowerCase()===selected.house.toLowerCase()&&
   (!selected.analystName||String(c.analyst_name||"").toLowerCase()===selected.analystName.toLowerCase()));
 },[selected,calls]);
 async function modify(call,action){
  if(!canEdit)return;
  const verify=action==="verify";
  const accepted=window.confirm(verify?
   "Confirm that you personally examined the dated original publication and checked the firm's attributed recommendation, date, rating, target and historical price before marking this record editorially reviewed?":
   "Archive this record? It will be removed from public outcomes but kept for the audit trail.");
  if(!accepted)return;
  setMessage("");
  try{
   const r=await fetch("/api/tracker/calls/"+encodeURIComponent(call.id),{
    method:verify?"PATCH":"DELETE",
    headers:{"Content-Type":"application/json"},
    ...(verify?{body:JSON.stringify({status:"verified",confirmedSource:true})}:{})
   });
   const j=await r.json();
   if(!r.ok||!j.success)throw Error(j.error||"Update failed");
   setMessage(verify?"Source review recorded. The call will be scored only when its original horizon can be evaluated.":"Record archived with its audit history retained.");
   reload();
  }catch(e){setMessage(e.message||"Unable to update record")}
 }
 return <main className="tt-page">
  <div className="tt-container">
   <header className="tt-hero">
    <p className="tt-kicker">ALPHAHEDGEQUANT / RESEARCH ACCOUNTABILITY</p>
    <div className="tt-hero-layout"><div>
     <h1>Trust <em>Tracker.</em></h1>
     <p className="tt-lead">Follow what research firms and analysts actually published—and what happened after the stated investment horizon.</p>
    </div><div className="tt-hero-aside"><span>ORIGINAL REPORTS</span><span>DATED CALLS</span><span>OBSERVED OUTCOMES</span></div></div>
    <p className="tt-hero-caveat">An independently calculated historical research log, not an endorsement, official verification, credit rating or forecast of future performance. Records are shown only after editorial evidence review.</p>
   </header>
   <section className="tt-summary-grid" aria-label="Tracker coverage">
    <Summary label="SOURCE-REVIEWED CALLS" value={coverage?.reviewedCalls??"—"} detail="Original publications reviewed"/>
    <Summary label="RESEARCH FIRMS" value={leaderboard.length||0} detail="With reviewed records"/>
    <Summary label="NAMED ANALYSTS" value={analysts.length||0} detail="Attributed in source material"/>
    <Summary label="RESOLVED DIRECTIONAL CALLS" value={leaderboard.reduce((n,x)=>n+x.resolvedCalls,0)} detail="At the stated horizon"/>
   </section>
   <div className="tt-toolbar">
    <div className="tt-tabs" role="tablist" aria-label="Trust Tracker views">
     {[["firms","Firms"],["analysts","Analysts"],["calls","Research calls"],...(canEdit?[["add","Editorial entry"]]:[])].map(([id,label])=><button
      type="button" role="tab" aria-selected={view===id} key={id} className={view===id?"active":""}
      onClick={()=>{setView(id);setSelected(null);setTerm("");}}>{label}</button>)}
    </div>
    <div className="tt-toolbar-right">
     {view!=="add"&&<input aria-label="Search tracked firms analysts and stocks" placeholder="Search firm, analyst or ticker" type="search" value={term} onChange={e=>setTerm(e.target.value)}/>}
     <button type="button" disabled={loading} className="tt-refresh" onClick={reload}>↻ Refresh</button>
    </div>
   </div>
   {loading&&<p className="tt-message" role="status">Checking documented calls and historical price evidence…</p>}
   {error&&<p className="tt-message" role="alert">{error}</p>}
   {message&&<p className="tt-message" role="status">{message}</p>}
   {!loading&&!error&&(view==="firms"||view==="analysts")&&<section className="tt-results">
    <div className="tt-section-heading"><div><h2>{view==="firms"?"Research firm outcomes":"Individual analyst outcomes"}</h2>
     <p>Rank order uses a sample-adjusted confidence bound, not the raw win percentage. Select a name to inspect its published calls and sources.</p></div>
     <span className="tt-caption">{ranks.length} tracked {view==="firms"?"firms":"analysts"}</span></div>
    {ranks.length?<div className="tt-table-scroll"><table>
     <thead><tr><th>#</th><th>{view==="firms"?"Research firm":"Analyst / Firm"}</th><th>Directional win rate</th><th>95% lower bound</th><th>Target hit</th><th>Mean return</th><th>Resolved / Reviewed</th><th>Coverage</th></tr></thead>
     <tbody>{ranks.map((h,i)=><tr key={h.house+"::"+(h.analystName||"")}>
      <td className="tt-mono">{h.rankEligible?i+1:"—"}</td>
      <td><button className="tt-entity-link" type="button" onClick={()=>setSelected(h)}>
       <strong>{h.analystName||h.house}</strong>{h.analystName&&<small>{h.house}</small>}</button></td>
      <td><strong className="tt-large-stat">{h.winRate===null?"—":fmt(h.winRate,1)+"%"}</strong></td>
      <td className="tt-mono">{h.confidenceFloor===null?"Insufficient sample":fmt(h.confidenceFloor,1)+"%"}</td>
      <td className="tt-mono">{h.targetHitRate===null?"—":fmt(h.targetHitRate,1)+"%"}<small>{h.targetEvidenceCount} comparable calls</small></td>
      <td className={"tt-mono "+direction(h.avgReturn)}>{h.avgReturn===null?"—":(h.avgReturn>0?"+":"")+fmt(h.avgReturn,2)+"%"}</td>
      <td className="tt-mono">{h.resolvedCalls} / {h.verifiedCalls}</td>
      <td>{h.rankEligible?<span className="tt-status">Sample eligible</span>:<span className="tt-status">Limited sample</span>}</td>
     </tr>)}</tbody></table></div>:<div className="tt-empty"><strong>No documented outcomes to display</strong><p>Only source-reviewed recommendations enter the public record. No sample analysts, firms or scores are manufactured.</p></div>}
    {selected&&<section className="tt-profile" aria-label="Recommendation evidence details">
     <div className="tt-profile-head"><div><p className="tt-kicker">RECOMMENDATION HISTORY</p><h3>{selected.analystName||selected.house}</h3><p>{selected.analystName?selected.house+" · ":""}{selected.resolvedCalls} resolved calls out of {selected.verifiedCalls} source-reviewed records</p></div>
      <button type="button" onClick={()=>setSelected(null)} aria-label="Close recommendation history">Close ×</button></div>
     <CallTable items={profileCalls} canEdit={canEdit} onReview={c=>modify(c,"verify")} onDelete={c=>modify(c,"delete")} compact/>
    </section>}
   </section>}
   {!loading&&!error&&view==="calls"&&<section className="tt-results">
    <div className="tt-section-heading"><div><h2>Recommendation evidence log</h2><p>All displayed calls retain a dated original publication and separate the entry, target, outcome and verification state.</p></div>
     <select aria-label="Filter recommendation status" value={callFilter} onChange={e=>setCallFilter(e.target.value)}>
      <option value="all">All visible calls</option><option value="reviewed">Source reviewed</option>
      <option value="resolved">Horizon resolved</option>{canEdit&&<option value="pending">Editor review pending</option>}
     </select></div>
    <CallTable items={rows} canEdit={canEdit} onReview={c=>modify(c,"verify")} onDelete={c=>modify(c,"delete")}/>
   </section>}
   {view==="add"&&canEdit&&<div className="tt-add-container">
    <EntryForm onComplete={msg=>{setMessage(msg);setView("calls");reload()}}/>
    <p className="tt-editor-link"><Link href="/tracker/discovery">Original publication intake and private source review queue ↗</Link></p>
   </div>}
   <section className="tt-method" aria-labelledby="tt-method">
    <div><p className="tt-kicker">METHODOLOGY / 01</p><h2 id="tt-method">Evidence before ranking.</h2></div>
    <div>
     <p>A BUY is evaluated on positive price movement, and a SELL on negative price movement, from the documented entry price to the first available historical close at or shortly after its published horizon. HOLD is not assigned an invented directional outcome.</p>
     <p>Firms and named analysts are evaluated independently. A minimum of <strong>{methodology?.minimumResolved??10} source-reviewed, horizon-resolved BUY/SELL calls</strong> is required for sample-eligible ranking. The order uses a 95% Wilson lower bound to account for limited evidence, while the observed win rate is displayed separately.</p>
     <p>Price outcomes are not benchmark-, dividend-, split-, tax- or transaction-cost-adjusted. Target-hit figures are shown only where the required historical high/low data is available. These measures are descriptive and are <strong>not a SEBI/PaRRVA-certified performance record</strong>.</p>
     <p>Corrections and disputed source attributions should be reviewed through the editorial workflow rather than silently changing historical calls.</p>
     {canEdit&&<Link href="/tracker/discovery">Open research intake ↗</Link>}
    </div>
   </section>
  </div>
 </main>;
}
