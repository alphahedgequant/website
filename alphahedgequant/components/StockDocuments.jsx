"use client";
import { useEffect, useState } from "react";

const GROUPS = [
  { key:"announcements", name:"Announcements", caption:"Exchange disclosures and board-meeting notices", icon:"◉" },
  { key:"annual_reports", name:"Annual Reports", caption:"Audited annual financial statements", icon:"▤" },
  { key:"credit_ratings", name:"Credit Ratings", caption:"Published rating actions and rationales", icon:"◇" },
  { key:"concalls", name:"Earnings Calls", caption:"Transcripts, audio and presentations", icon:"♫" },
];
const OFFICIAL = {
  NSE:[
    {label:"NSE announcements",url:"https://www.nseindia.com/companies-listing/corporate-filings-announcements"},
    {label:"NSE financial results",url:"https://www.nseindia.com/companies-listing/corporate-filings-financial-results"},
    {label:"NSE board meetings",url:"https://www.nseindia.com/companies-listing/corporate-filings-board-meetings"},
  ],
  US:[
    {label:"SEC EDGAR filings",url:"https://www.sec.gov/edgar/search/"},
    {label:"SEC company facts and filings",url:"https://www.sec.gov/search-filings"},
  ]
};
const allowedSource = url => {
  try { const u=new URL(url); return u.protocol==="https:" && !u.username && !u.password; } catch { return false; }
};
export default function StockDocuments({symbol,market="NSE",documents=[]}) {
  const [filter,setFilter]=useState("all");
  const [feed,setFeed]=useState([]);
  const [feedStatus,setFeedStatus]=useState("idle");
  useEffect(()=>{
    if(market!=="US"){setFeed([]);setFeedStatus("idle");return;}
    let active=true;
    setFeedStatus("loading");
    fetch("/api/company-documents?symbol="+encodeURIComponent(symbol),{cache:"no-store"})
      .then(r=>r.json())
      .then(j=>{if(active){setFeed(Array.isArray(j.documents)?j.documents:[]);setFeedStatus(j.status||"unavailable");}})
      .catch(()=>{if(active){setFeed([]);setFeedStatus("unavailable");}});
    return ()=>{active=false;};
  },[market,symbol]);
  // Only render validated, matching issuer documents from an explicit verified feed.
  const combined=[...(Array.isArray(documents)?documents:[]),...feed];
  const clean=combined.filter(d=>d && d.symbol===symbol && d.market===market && GROUPS.some(g=>g.key===d.category) && allowedSource(d.url) && d.verified===true);
  const filtered=filter==="all"?clean:clean.filter(d=>d.category===filter);
  const byGroup=GROUPS.map(g=>({...g,items:filtered.filter(d=>d.category===g.key)}));
  return <section className="card mt-5 p-5 md:p-7" id="company-documents" aria-label="Company documents">
    <div className="flex flex-wrap justify-between gap-3 items-start">
      <div>
        <p className="eyebrow mb-2">Primary-source research</p>
        <h2 className="font-display text-2xl md:text-3xl text-body">Documents &amp; Earnings Calls</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">Financial filings, rating actions, announcements and management commentary—linked to their original publishers.</p>
      </div>
      <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">{clean.length} verified documents indexed</span>
    </div>
    {market==="US" && feedStatus==="loading" && <p role="status" className="mt-3 text-xs text-muted">Checking SEC EDGAR for issuer filings…</p>}
    {market==="US" && feedStatus==="not_configured" && <p className="mt-3 text-xs text-muted">Automatic SEC lookup requires a configured SEC_USER_AGENT. Official links remain available below.</p>}
    {market==="US" && feedStatus==="unavailable" && <p className="mt-3 text-xs text-muted">SEC filings could not be retrieved. The official SEC search link remains available.</p>}
    <div className="flex gap-2 flex-wrap my-5" aria-label="Filter document categories">
      {[{key:"all",name:"All documents"},...GROUPS].map(g=><button type="button" key={g.key}
        aria-pressed={filter===g.key} onClick={()=>setFilter(g.key)}
        className={`rounded-lg border px-3 py-2 text-xs ${filter===g.key?"border-amber bg-amber/10 text-amber":"border-line text-muted hover:text-body"}`}>{g.name}</button>)}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {byGroup.filter(g=>filter==="all"||g.key===filter).map(g=><div className="rounded-xl border border-line bg-raised p-4 md:p-5" key={g.key}>
        <h3 className="text-base font-semibold text-body"><span className="mr-2 text-amber" aria-hidden="true">{g.icon}</span>{g.name}</h3>
        <p className="text-xs mt-1 text-muted">{g.caption}</p>
        {g.items.length ? <ul className="mt-4 space-y-3">{g.items.map((d,i)=><li key={d.url+"-"+i} className="border-t border-line pt-3">
          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-amber hover:underline">{d.title} ↗</a>
          <div className="mt-1 text-xs text-muted">{d.publisher || "Original publisher"}{d.publishedAt ? " · "+d.publishedAt : ""}</div>
          {d.description && <p className="mt-2 text-sm leading-relaxed text-body/80">{d.description}</p>}
        </li>)}</ul>:
        <p className="mt-4 rounded-lg border border-line p-3 text-sm text-muted">No verified {g.name.toLowerCase()} indexed for this company yet. This does not mean none have been published.</p>}
      </div>)}
    </div>
    <div className="mt-5 rounded-xl border border-line p-4">
      <h3 className="text-sm font-semibold text-body">Find original filings</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">These links open official issuer-search pages, not prefiltered results for {symbol}. Search by symbol, legal name or ISIN.</p>
      <div className="flex flex-wrap gap-2 mt-3">{(OFFICIAL[market]||OFFICIAL.NSE).map(x=><a key={x.url} className="btn-ghost !px-3 !py-2 !text-xs" href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>)}</div>
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted">No documents or AI summaries are invented. Published documents may have usage restrictions; issuer-specific indexing and optional source-linked explanations can be enabled after a permitted ingestion feed is integrated.</p>
  </section>;
}
