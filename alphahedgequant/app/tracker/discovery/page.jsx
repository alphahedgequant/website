"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {RESEARCH_PUBLISHERS} from "@/lib/trackerPublishers";
const initial={publisher_id:"icici-direct",source_url:"",headline:"",published_on:"",symbol:"",rating:"",target_price:"",entry_price:"",horizon_days:"",notes:""};
export default function Discovery(){
 const [draft,setDraft]=useState(initial),[items,setItems]=useState([]),[status,setStatus]=useState(""),[access,setAccess]=useState("loading"),[busy,setBusy]=useState(false),[filter,setFilter]=useState("all");
 const load=async()=>{
  try{const r=await fetch("/api/tracker/discovery",{cache:"no-store"}),j=await r.json();
   if(!r.ok){setAccess(r.status===401?"signed-out":r.status===403?"restricted":"unavailable");setStatus(j.error||"Unable to load editor queue");return}
   setAccess("editor");setItems(j.items||[]);
  }catch{setAccess("unavailable");setStatus("Unable to connect to discovery queue")}
 };
 useEffect(()=>{load()},[]);
 const submit=async(e)=>{
  e.preventDefault();setBusy(true);setStatus("");
  try{const r=await fetch("/api/tracker/discovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)}),j=await r.json();
   if(!r.ok)throw Error(j.error||"Unable to save");
   setStatus("Publication added to private review queue. It is NOT a public recommendation or scored record.");
   setDraft(x=>({...initial,publisher_id:x.publisher_id}));await load();
  }catch(e){setStatus(e.message)}finally{setBusy(false)}
 };
 const changeStatus=async(id,next)=>{
  setBusy(true);try{const r=await fetch("/api/tracker/discovery",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:next})}),j=await r.json();if(!r.ok)throw Error(j.error||"Update failed");await load()}catch(e){setStatus(e.message)}finally{setBusy(false)}
 };
 const fields=[["headline","Report headline","text"],["source_url","Original publisher URL","url"],["published_on","Published date","date"],["symbol","Ticker","text"],["target_price","Target price","number"],["entry_price","Recommendation/entry price","number"],["horizon_days","Time horizon (days)","number"]];
 const visible=items.filter(x=>filter==="all"||x.review_status===filter);
 return <main className="max-w-shell mx-auto px-5 md:px-10 py-12">
  <Link className="text-amber text-xs font-mono" href="/tracker">← Trust Tracker</Link>
  <p className="eyebrow mt-8 mb-3">[ AHQ : EVIDENCE DISCOVERY ]</p>
  <h1 className="font-display text-3xl md:text-4xl">Brokerage Research Intake</h1>
  <p className="mt-3 max-w-3xl text-sm text-muted leading-relaxed">A controlled workflow for gathering dated, original research recommendations. We link to publisher portals; no unauthorized third-party datasets are copied. Candidate reports are private and cannot affect Trust Scores until separately reviewed.</p>
  <h2 className="text-xl font-display mt-10 mb-4">Research publisher directory</h2>
  <div className="grid gap-4 md:grid-cols-2">{RESEARCH_PUBLISHERS.map(x=><div className="card p-5" key={x.id}><p className="text-body font-semibold">{x.name}</p><p className="text-xs text-muted leading-relaxed mt-2">{x.notes}</p><a href={x.portal} target="_blank" rel="noopener noreferrer" className="text-amber underline text-sm inline-block mt-3">View original research portal ↗</a></div>)}</div>
  <div className="mt-10 border border-line bg-surface rounded-xl p-5 md:p-8">
   <h2 className="font-display text-2xl">Private review queue</h2>
   {access==="loading"&&<p className="text-muted mt-4">Checking editor access…</p>}
   {access==="signed-out"&&<p className="text-muted mt-4">Sign in with an approved editor account to submit research candidates. <Link className="text-amber" href="/sign-in">Sign in</Link></p>}
   {access==="restricted"&&<p className="text-muted mt-4">This area is for approved editors only. The public Trust Tracker remains available to everyone.</p>}
   {access==="unavailable"&&<p className="text-muted mt-4">The discovery queue is temporarily unavailable.</p>}
   {status&&<p role="status" className="mt-4 text-sm text-amber">{status}</p>}
   {access==="editor"&&<>
    <form onSubmit={submit} className="mt-5 border-b border-line pb-7">
     <label className="text-xs text-muted block mb-2">Original publisher</label>
     <select value={draft.publisher_id} onChange={e=>setDraft(x=>({...x,publisher_id:e.target.value}))} className="rounded-lg border border-line bg-raised px-4 py-2 text-sm mb-4 w-full sm:w-[300px]">{RESEARCH_PUBLISHERS.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select>
     <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label,type])=><label key={key} className="text-xs text-muted">{label}<input type={type} step={type==="number"?"any":undefined} required={["headline","source_url"].includes(key)} value={draft[key]} onChange={e=>setDraft(x=>({...x,[key]:e.target.value}))} className="w-full mt-2 rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-body" /></label>)}
      <label className="text-xs text-muted">Publisher's original rating<select value={draft.rating} onChange={e=>setDraft(x=>({...x,rating:e.target.value}))} className="w-full mt-2 rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-body">{["","BUY","HOLD","SELL","ACCUMULATE","REDUCE","NEUTRAL"].map(x=><option key={x} value={x}>{x||"Not transcribed"}</option>)}</select></label>
     </div>
     <label className="text-xs text-muted block mt-4">Research notes<textarea value={draft.notes} onChange={e=>setDraft(x=>({...x,notes:e.target.value}))} className="w-full mt-2 rounded-lg border border-line bg-raised p-3 text-sm text-body" rows={3} placeholder="Source page, rating definition, report restrictions, split/bonus warnings…" /></label>
     <button disabled={busy} className="btn-primary mt-4 disabled:opacity-60">{busy?"Saving…":"Add to private review queue"}</button>
    </form>
    <div className="flex flex-wrap justify-between gap-3 items-center mt-7"><h3 className="font-display text-xl">Submitted sources ({items.length})</h3><select aria-label="Filter queue" className="bg-raised border border-line p-2 rounded-lg text-sm" value={filter} onChange={e=>setFilter(e.target.value)}>{["all","pending","reviewing","rejected"].map(x=><option value={x} key={x}>{x}</option>)}</select></div>
    {!visible.length&&<p className="mt-5 text-sm text-muted">No candidate reports in this view. No example recommendations are fabricated.</p>}
    <div className="space-y-3 mt-4">{visible.map(x=><div className="rounded-lg border border-line p-4" key={x.id}><p className="text-sm font-semibold">{x.headline}</p><p className="text-xs text-muted mt-1">{RESEARCH_PUBLISHERS.find(p=>p.id===x.publisher_id)?.name||x.publisher_id} · {x.published_on?String(x.published_on).slice(0,10):"Publication date pending"} · {x.review_status}</p><p className="text-sm text-muted mt-2">{[x.symbol,x.rating,x.target_price&&"Target "+x.target_price].filter(Boolean).join(" · ")}</p><div className="flex flex-wrap gap-4 items-center mt-3"><a className="text-amber underline text-sm" target="_blank" rel="noopener noreferrer" href={x.source_url}>Original publication ↗</a>{x.review_status!=="reviewing"&&<button disabled={busy} onClick={()=>changeStatus(x.id,"reviewing")} className="text-sm hover:text-amber">Review</button>}{x.review_status!=="rejected"&&<button disabled={busy} onClick={()=>changeStatus(x.id,"rejected")} className="text-sm hover:text-loss">Reject</button>}{x.review_status!=="pending"&&<button disabled={busy} onClick={()=>changeStatus(x.id,"pending")} className="text-sm hover:text-amber">Restore pending</button>}</div></div>)}</div>
    <p className="text-xs text-muted mt-6">Review workflow only. Publication into Trust Tracker requires separate approved entry and verification; this queue never auto-publishes a brokerage call.</p>
   </>}
  </div>
 </main>;
}
