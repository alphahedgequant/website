"use client";
import {useEffect,useMemo,useState} from "react";

const eventNames={
 option_chain_opened:"Option chain opened",
 options_page_viewed:"Options analytics viewed",
 strategy_builder_opened:"Strategy builder",
 screener_viewed:"Market screener",
 model_lesson_opened:"Quant lessons",
 backtest_viewed:"Backtesting",
 quant_terminal_opened:"Quant terminal",
 ipo_page_opened:"IPO intelligence",
 article_opened:"Research articles",
 waitlist_opened:"Waitlist opened",
 ipo_tab_selected:"IPO calendar tab selected",
 academy_area_selected:"Academy section selected",
 mental_math_round_started:"Mental Math challenge started",
 mental_math_answer_submitted:"Mental Math answer submitted",
 interview_mock_started:"Quant mock interview started",
 interview_answer_checked:"Interview answer checked",
 interview_mock_answer_submitted:"Mock interview answer submitted",
 interview_bookmark_toggled:"Interview bookmark toggled",
 interview_answer_revealed:"Interview worked answer revealed",
 screener_market_switched:"NSE / US market switched",
 screener_filters_opened:"Screener filter panel opened",
 screener_filter_changed:"Screener filter applied",
 screener_view_selected:"Screener view selected",
 screener_exported:"Screener CSV exported",
 screener_stock_opened:"Screener company selected",
 terminal_tab_selected:"Quant Terminal tab selected",
 terminal_stock_selected:"Terminal watchlist stock selected",
 option_chain_refreshed:"Option chain refreshed",
 option_chain_selected:"Option chain selected",
 strategy_leg_added:"Options strategy leg added",
 backtest_run_submitted:"Backtest launched",
 research_search_submitted:"Research library searched",
 research_filter_selected:"Research category selected",
 trust_tracker_viewed:"Trust Tracker visited"
};
const nf=n=>Number(n||0).toLocaleString("en-IN");
const time=n=>{
 const x=Number(n||0);
 if(!Number.isFinite(x)||x<=0)return "—";
 return x>=60?(x/60).toFixed(1)+" min":Math.round(x)+" sec";
};
const knownCount=x=>Number.isInteger(x)&&x>=0?nf(x):"—";
const pageEvents=new Set(["option_chain_opened","options_page_viewed","screener_viewed","model_lesson_opened","backtest_viewed","quant_terminal_opened","ipo_page_opened","article_opened","waitlist_opened","trust_tracker_viewed"]);
const pill=(x)=>x===0?"No activity":nf(x);
function Metric({label,value,foot}){
 return <div className="border border-line rounded-xl bg-surface/80 p-5 md:p-6">
  <p className="text-[11px] tracking-[.09em] uppercase text-muted font-mono">{label}</p>
  <p className="text-3xl md:text-4xl font-semibold tabular-nums text-body mt-4">{value}</p>
  <p className="text-xs text-muted mt-3">{foot}</p>
 </div>;
}
function Panel({title,subtitle,children}){
 return <section className="border border-line bg-surface/80 rounded-xl p-5 md:p-7 min-w-0">
  <h2 className="font-display text-xl md:text-2xl text-body">{title}</h2>
  {subtitle&&<p className="text-xs text-muted mt-2 mb-5">{subtitle}</p>}
  {children}
 </section>;
}
const download=(data)=>{
 const rows=[
  ["SECTION","NAME","PAGEVIEWS","VISITORS","ACTIVE_SECONDS","WAITLIST_SIGNUPS"],
  ...data.pages.map(p=>["page",p.path,p.views,p.visitors,p.active_seconds,""]),
  ...data.sources.map(p=>["source",p.source,p.pageviews,p.visitors,"",p.waitlist_signups]),
  ...data.features.map(f=>["feature",f.feature,f.uses,f.visitors,"",""])
 ];
 const csv=rows.map(row=>row.map(c=>{
  let val=String(c??"");
  // Even exported aggregate labels are guarded against CSV formula injection.
  if(/^[=+@\-\t\r]/.test(val))val="'"+val;
  return '"'+val.replace(/"/g,'""')+'"';
 }).join(",")).join("\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="ahq-insights-aggregates.csv";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
export default function OwnerInsightsDashboard(){
 const [days,setDays]=useState(7),[refresh,setRefresh]=useState(0),[data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const ctrl=new AbortController();
  setLoading(true);setError("");
  fetch("/api/admin/analytics?days="+days,{credentials:"same-origin",cache:"no-store",signal:ctrl.signal})
   .then(async res=>{const body=await res.json();if(!res.ok)throw Error(body.error||"Analytics unavailable");return body})
   .then(setData).catch(e=>{if(!ctrl.signal.aborted){setData(null);setError(e.message)}})
   .finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});
  return()=>ctrl.abort();
 },[days,refresh]);
 const o=data?.overview||{},pages=data?.pages||[],features=data?.features||[],trend=data?.trend||[],sources=data?.sources||[];
 const maxTrend=Math.max(1,...trend.map(x=>Number(x.visitors||0)));
 const maxFeature=Math.max(1,...features.map(x=>Number(x.uses||0)));
 const maxSource=Math.max(1,...sources.map(x=>Number(x.visitors||0)));
 return <main className="max-w-[1460px] mx-auto px-5 md:px-10 py-12 md:py-16 min-h-[70vh]">
  <div className="flex flex-wrap gap-5 items-end justify-between pb-8 border-b border-line">
   <div>
    <p className="text-xs font-mono uppercase tracking-[.18em] text-amber">ALPHAHEDGEQUANT / OWNER ACCESS</p>
    <h1 className="font-display text-4xl md:text-5xl font-semibold mt-3 text-body">Insights<span className="text-amber">.</span></h1>
    <p className="text-sm text-muted mt-3 max-w-[680px]">Your private first-party audience, research and product analytics. Stored on your PostgreSQL database—not in a third-party analytics service.</p>
   </div>
   <div className="flex gap-2 flex-wrap items-center">
    <div role="group" aria-label="Date range" className="p-1 border border-line rounded-lg bg-surface flex gap-1">
     {[1,7,30,90].map(d=><button type="button" key={d} onClick={()=>setDays(d)} aria-pressed={days===d}
       className={`rounded-md px-3 py-2 text-xs font-mono ${days===d?"bg-body text-ink":"text-muted hover:text-body"}`}>{d}D</button>)}
    </div>
    <button type="button" onClick={()=>setRefresh(x=>x+1)} disabled={loading}
      className="border border-line text-sm text-body rounded-lg px-4 py-2.5 hover:bg-raised disabled:opacity-40">Refresh</button>
    <button type="button" onClick={()=>data&&download(data)} disabled={!data||loading}
      className="border border-line text-sm text-body rounded-lg px-4 py-2.5 hover:bg-raised disabled:opacity-40">Export CSV</button>
   </div>
  </div>
  {loading?<p role="status" className="py-16 text-muted">Loading your private analytics…</p>:error?<div role="alert" className="mt-8 border border-line p-6 rounded-xl"><h2 className="text-xl text-body">Analytics unavailable</h2><p className="text-muted mt-2">{error}</p><p className="text-muted text-sm mt-2">No fabricated statistics are displayed. Check the database and owner permissions.</p></div>:<>
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
    <Metric label="Visitors · chosen period" value={nf(o.visitors)} foot="Unique pseudonymous browsers"/>
    <Metric label="Page views" value={nf(o.pageviews)} foot={nf(o.sessions)+" distinct browser sessions"}/>
    <Metric label="Registered accounts · all time" value={knownCount(o.registered_users_total)} foot="Actual users in production Clerk"/>
    <Metric label="New accounts · chosen period" value={knownCount(o.registered_users_new)} foot="Created Clerk accounts, not page visits"/>
    <Metric label="DAU · today (IST)" value={nf(o.dau)} foot="Unique browsers since midnight IST"/>
    <Metric label="Average active time" value={time(o.avg_active_seconds)} foot="Focused activity per session"/>
    <Metric label="WAU · rolling 7 days" value={nf(o.wau)} foot="Active pseudonymous browsers"/>
    <Metric label="MAU · rolling 30 days" value={nf(o.mau)} foot="Active pseudonymous browsers"/>
    <Metric label="Confirmed waitlist signups" value={nf(o.waitlist_signups)} foot="New database entries only"/>
    <Metric label="Signup / visitor ratio" value={nf(o.conversion_percent)+"%"} foot="Aggregate estimate, not matched attribution"/>
   </div>
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
    <Panel title="Visitor trend" subtitle="Daily distinct browsers · Asia/Kolkata calendar">
     {trend.length?<><div className="overflow-x-auto">
      <div className="flex gap-1.5 items-end border-b border-line h-[190px] pb-1" style={{minWidth:Math.max(280,trend.length*13)}}>
       {trend.map(t=><div key={t.day} className="flex-1 h-full flex items-end group relative" title={t.day+" · "+nf(t.visitors)+" visitors · "+nf(t.pageviews)+" views"}>
        <div className="bg-amber/80 rounded-t-sm w-full min-h-[3px] group-hover:bg-amber" style={{height:Math.max(2,(Number(t.visitors||0)/maxTrend)*100)+"%"}}/>
       </div>)}
      </div></div>
      <div className="flex justify-between text-xs text-muted mt-3 font-mono"><span>{trend[0]?.day}</span><span>{trend.at(-1)?.day}</span></div>
      </>:<p className="text-sm text-muted mt-5">No visitor events have been recorded yet.</p>}
    </Panel>
    <Panel title="Where readers arrive" subtitle="First-party session source and safe UTM categories">
     {sources.length? sources.slice(0,12).map((x,i)=><div key={x.source+"-"+i} className="py-2.5 border-b border-line/60">
      <div className="flex justify-between text-sm gap-2"><span className="capitalize text-body truncate">{x.source||"direct"}</span><span className="font-mono whitespace-nowrap text-muted">{nf(x.visitors)} visitors · {nf(x.waitlist_signups)} signups</span></div>
      <div className="h-1.5 bg-raised rounded-full mt-2"><div className="h-full rounded-full bg-amber/80" style={{width:(100*Number(x.visitors||0)/maxSource)+"%"}}/></div>
     </div>):<p className="text-sm text-muted mt-5">Source data will appear after first-party visits begin.</p>}
    </Panel>
   </div>
   <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
    <Panel title="Most visited pages" subtitle="Views, unique visitors and estimated active reading time">
     {pages.length?<div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="text-xs text-muted border-b border-line"><tr><th className="text-left font-medium pb-3">Page</th><th className="text-right font-medium pb-3">Views</th><th className="text-right font-medium pb-3">Visitors</th><th className="text-right font-medium pb-3">Avg time</th></tr></thead>
      <tbody>{pages.map(p=><tr key={p.path} className="border-b border-line/50"><td className="py-3 pr-3 truncate max-w-[180px]" title={p.path}>{p.path}</td><td className="py-3 text-right font-mono">{nf(p.views)}</td><td className="py-3 text-right font-mono">{nf(p.visitors)}</td><td className="py-3 text-right font-mono text-amber whitespace-nowrap">{time(p.avg_active_seconds)}</td></tr>)}</tbody>
     </table></div>:<p className="text-sm text-muted mt-5">No page views recorded during this period.</p>}
    </Panel>
    <Panel title="Most-used functions" subtitle="Actions and product visits, with distinct counts; no search terms, stock symbols or trades are recorded">
     {features.length? features.map(f=><div key={f.feature} className="py-2.5">
      <div className="flex justify-between items-baseline gap-3 text-sm"><span>{eventNames[f.feature]||f.feature} <span className="ml-1 text-[10px] text-muted">· {pageEvents.has(f.feature)?"visit":"action"}</span></span><span className="font-mono text-amber whitespace-nowrap">{nf(f.uses)} uses · {nf(f.visitors)} visitors</span></div>
      <div className="bg-raised rounded-full h-2 mt-2"><div className="h-full bg-amber/85 rounded-full" style={{width:(100*Number(f.uses||0)/maxFeature)+"%"}}/></div>
     </div>):<p className="text-sm text-muted mt-5">Feature adoption metrics will appear when features are used.</p>}
    </Panel>
   </div>
   <p className="text-xs text-muted mt-7 max-w-5xl leading-relaxed">
    DAU, WAU, MAU and visitor counts are pseudonymous browser estimates, not account-user counts. Separate registered-account totals come from Clerk when available; "—" means the provider could not be reached. Focused engagement excludes background tabs and long idle periods. Browser privacy controls and opt-outs can reduce measured visitors. Page visits and explicit feature interactions are labelled separately; repeated clicks may count more than once. Waitlist signups are confirmed by database insertions; conversion is an aggregate estimate, not causal attribution. Collection cannot reconstruct earlier visitor data.
   </p>
   <p className="text-xs text-muted mt-2 font-mono">Time zone: {data?.timezone||"Asia/Kolkata"} · Last updated: {data?.generatedAt?new Date(data.generatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"—"}</p>
  </>}
 </main>;
}
