"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";

const TABS=[
 {key:"open",label:"Open now",empty:"No IPOs with a confirmed active bidding window are in the current feed."},
 {key:"upcoming",label:"Upcoming",empty:"No upcoming IPOs with announced dates are in the current feed."},
 {key:"closed",label:"Closed issues",empty:"No closed IPOs are in the current feed."},
 {key:"listed",label:"Recently listed",empty:"No recent listings are available in the current feed."},
 {key:"other",label:"Other statuses",empty:"No issues with an unrecognized source status."}
];
const number=x=>typeof x==="number"&&Number.isFinite(x)?x:null;
const rupees=x=>number(x)===null?"—":"₹"+new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(x);
const plain=x=>number(x)===null?"—":new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(x);
const times=x=>number(x)===null?"—":plain(x)+"×";
const percent=x=>number(x)===null?"—":(x>0?"+":"")+plain(x)+"%";
const day=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)?x:null;
function dateLabel(x){
 if(!day(x))return "—";
 return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(x+"T00:00:00Z"));
}
function timestamp(x){
 if(!x||Number.isNaN(Date.parse(x)))return null;
 return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata",hour12:true}).format(new Date(x))+" IST";
}
function todayInIndia(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const value=k=>parts.find(x=>x.type===k)?.value;
 return value("year")+"-"+value("month")+"-"+value("day");
}
function daysBetween(today,next){
 if(!day(next))return null;
 const a=Date.parse(today+"T00:00:00Z"),b=Date.parse(next+"T00:00:00Z");
 return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000):null;
}
function Delta({value}){
 if(number(value)===null)return <span className="ipo-no-data">Not available</span>;
 const positive=value>0,negative=value<0;
 return <span className={positive?"ipo-positive":negative?"ipo-negative":"ipo-neutral"}>{percent(value)}</span>;
}
function Metric({label,value,note}){
 return <div className="ipo-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function Fact({label,children}){
 return <div className="ipo-fact"><span>{label}</span><strong>{children??"—"}</strong></div>;
}
function Gmp({ipo,showPercent=true}){
 if(ipo.gmpDisputed)return <span className="ipo-disputed">Disputed · withheld</span>;
 if(number(ipo.gmp)===null)return <span className="ipo-no-data">Not reported</span>;
 return <><strong className="ipo-gmp-amount">{rupees(ipo.gmp)}</strong>{showPercent&&number(ipo.gmpPct)!==null?<small className="ipo-gmp-percent">{percent(ipo.gmpPct)} implied</small>:null}</>;
}
function IpoCard({ipo,actual,onOpen}){
 const listed=ipo.status==="listed";
 const gain=number(actual?.actualPct)!==null?actual.actualPct:ipo.listingGain;
 return <article className="ipo-issue">
  <div className="ipo-issue-head">
   <div className="ipo-issue-title"><span className="ipo-issue-label">{ipo.segment} <span aria-hidden="true">·</span> {listed?"LISTED":ipo.status.toUpperCase()}</span><h3>{ipo.name}</h3>{ipo.symbol&&<span className="ipo-issue-symbol">{ipo.symbol}</span>}</div>
   <div className="ipo-gmp-block"><span>{listed?"LISTING-DAY MOVE":"REPORTED GMP · UNOFFICIAL"}</span>{listed?<Delta value={gain}/>:<Gmp ipo={ipo}/>}</div>
  </div>
  <div className="ipo-issue-facts">
   <Fact label="Issue price band">{ipo.priceBand||"Not published"}</Fact>
   <Fact label="Total subscribed">{times(ipo.subscription)}</Fact>
   <Fact label="Opens">{dateLabel(ipo.open)}</Fact>
   <Fact label="Closes">{dateLabel(ipo.close)}</Fact>
   <Fact label="Lot size">{number(ipo.lotSize)===null?"—":plain(ipo.lotSize)+" shares"}</Fact>
   <Fact label="Issue size">{number(ipo.issueSize)===null?"—":"₹"+plain(ipo.issueSize)+" Cr"}</Fact>
   {listed?<><Fact label="Listing date">{dateLabel(actual?.listedOn||ipo.listingDate)}</Fact><Fact label="Reported listing price">{rupees(actual?.listingPrice)}</Fact></>:
   <><Fact label="Indicative listing price">{number(ipo.estimatedListingPrice)===null?"Not available":rupees(ipo.estimatedListingPrice)}</Fact><Fact label="Minimum lot at top band">{rupees(ipo.minimumInvestment)}</Fact></>}
  </div>
  {ipo.dateAdjusted&&<p className="ipo-correction">Bidding status adjusted because the published issue dates have elapsed or changed.</p>}
  {ipo.gmpDisputed&&<p className="ipo-correction">Reported GMP sources materially disagree. No implied price is shown.</p>}
  <div className="ipo-issue-bottom">
   <span>{listed?"ACTUAL REPORTED DEBUT, NOT GMP":"GMP IS NOT A LISTING FORECAST"}</span>
   <button type="button" data-ahq-event="ipo_issue_opened" onClick={()=>onOpen(ipo)}>View details <span aria-hidden="true">↗</span></button>
  </div>
 </article>;
}
function Chart({history}){
 const rows=(history||[]).filter(x=>number(x.gmp)!==null).slice(-24);
 if(rows.length<2)return null;
 const vals=rows.map(x=>x.gmp),low=Math.min(...vals),high=Math.max(...vals),span=Math.max(1,high-low);
 const points=rows.map((x,i)=>[14+i*(492/Math.max(1,rows.length-1)),102-(x.gmp-low)*80/span].join(",")).join(" ");
 return <div className="ipo-history-chart"><svg viewBox="0 0 520 120" role="img" aria-label="Reported historical grey-market premium, unofficial rupees per share" preserveAspectRatio="none"><path d="M14 25H506M14 64H506M14 102H506" stroke="currentColor" opacity=".12" fill="none"/><polyline points={points} fill="none" stroke="#d7b477" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></svg><div className="ipo-history-ends"><span>{dateLabel(rows[0].observedAt)} · {rupees(rows[0].gmp)}</span><span>{dateLabel(rows[rows.length-1].observedAt)} · {rupees(rows[rows.length-1].gmp)}</span></div></div>;
}
function IpoDetails({ipo,onClose}){
 const [detail,setDetail]=useState(null),[error,setError]=useState(null),[loading,setLoading]=useState(true);
 const closeRef=useRef(null),panelRef=useRef(null);
 useEffect(()=>{
  let alive=true;const ctrl=new AbortController();
  setDetail(null);setError(null);setLoading(true);
  fetch("/api/ipo?slug="+encodeURIComponent(ipo.id),{cache:"no-store",signal:ctrl.signal})
   .then(r=>r.json()).then(j=>{if(!alive)return;if(j.ok)setDetail(j);else setError(j.error||"Detail feed unavailable.");})
   .catch(e=>{if(alive&&e.name!=="AbortError")setError("Detailed subscription and historical GMP are temporarily unavailable.");})
   .finally(()=>{if(alive)setLoading(false);});
  return()=>{alive=false;ctrl.abort();};
 },[ipo.id]);
 useEffect(()=>{
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  closeRef.current?.focus();
  const handler=e=>{
   if(e.key==="Escape"){e.preventDefault();onClose();return;}
   if(e.key!=="Tab")return;
   const nodes=Array.from(panelRef.current?.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])')||[]);
   if(!nodes.length)return;
   const first=nodes[0],last=nodes[nodes.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",handler);
  return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener("keydown",handler);};
 },[onClose]);
 const subs=detail?.subscriptions||[];
 const history=detail?.gmpHistory||[];
 return <div className="ipo-modal-root">
  <button type="button" className="ipo-modal-scrim" onClick={onClose} aria-label="Close IPO detail panel"/>
  <aside ref={panelRef} className="ipo-detail-panel" role="dialog" aria-modal="true" aria-label={ipo.name+" IPO details"}>
   <div className="ipo-detail-top"><span className="ipo-eyebrow">AHQ / IPO DETAILS</span><button type="button" ref={closeRef} onClick={onClose} className="ipo-detail-close" aria-label="Close details">×</button></div>
   <p className="ipo-detail-segment">{ipo.segment} · {ipo.status.toUpperCase()}</p><h2>{ipo.name}</h2>
   <p className="ipo-detail-sub">Issue details and observed demand. Values may be delayed; reported GMP is not exchange-verified.</p>
   <div className="ipo-detail-grid">
    <Fact label="Price band">{ipo.priceBand||"—"}</Fact><Fact label="Minimum application">{rupees(ipo.minimumInvestment)}</Fact>
    <Fact label="Issue size">{number(ipo.issueSize)===null?"—":"₹"+plain(ipo.issueSize)+" Cr"}</Fact>
    <Fact label="Overall demand">{times(ipo.subscription)}</Fact>
    <Fact label="Opening date">{dateLabel(ipo.open)}</Fact><Fact label="Closing date">{dateLabel(ipo.close)}</Fact>
    <Fact label="Listing date">{dateLabel(ipo.listingDate)}</Fact><Fact label="Reported GMP"><Gmp ipo={ipo} showPercent={false}/></Fact>
   </div>
   {loading?<p className="ipo-detail-state" role="status">Loading available subscription categories and GMP history…</p>:error?<p className="ipo-detail-state" role="alert">{error}</p>:<>
    <section className="ipo-detail-section"><h3>Subscription by investor category</h3>{subs.length?
      <div className="ipo-subscriptions">{subs.map((s,i)=><div className="ipo-subscription" key={s.category+"-"+i}><span>{s.category}</span><strong>{times(s.timesSub)}</strong></div>)}</div>:
      <p className="ipo-detail-muted">Category-wise subscription was not available from the connected feed.</p>}</section>
    <section className="ipo-detail-section"><h3>Reported GMP history</h3><p className="ipo-detail-muted">Historical grey-market observations, not prices quoted on a regulated exchange.</p>{ipo.gmpDisputed?<p className="ipo-correction">Current GMP is disputed. Historical observations below are not a consensus price.</p>:null}<Chart history={history}/>{history.length===0?<p className="ipo-detail-muted">No reported GMP history available.</p>:null}</section>
   </>}
   <div className="ipo-detail-sources"><p>For authoritative bid and issue information, verify on the exchanges. Data aggregated by <a href="https://www.xflot.com/ipo" target="_blank" rel="noopener noreferrer">Xflot</a>; GMP is unofficial.</p><div><a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noopener noreferrer">NSE issue details ↗</a><a href="https://www.bseindia.com/markets/PublicIssues/IPOIssues_new.aspx?id=1&Type=p" target="_blank" rel="noopener noreferrer">BSE public issues ↗</a></div></div>
  </aside>
 </div>;
}
export default function IpoScreen(){
 const [tab,setTab]=useState("open"),[segment,setSegment]=useState("all"),[query,setQuery]=useState(""),[sort,setSort]=useState("date");
 const [buckets,setBuckets]=useState(null),[meta,setMeta]=useState(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(null);
 const [selected,setSelected]=useState(null),[board,setBoard]=useState(null),[boardError,setBoardError]=useState(false);
 const [lastCheck,setLastCheck]=useState(null);
 const closeDetails=useCallback(()=>setSelected(null),[]);
 const load=useCallback(async(initial=false)=>{
  if(!initial)setRefreshing(true);
  try {
   const r=await fetch("/api/ipo",{cache:"no-store"});
   const j=await r.json();
   if(!r.ok||!j.ok||!j.buckets)throw Error(j.error||"IPO feed unavailable");
   setBuckets(j.buckets);setMeta(j);setLastCheck(new Date().toISOString());setError(null);
  }catch(e){setError("The live IPO feed is temporarily unavailable. Displayed records, if any, are from an earlier successful check.");}
  finally{setLoading(false);setRefreshing(false);}
 },[]);
 useEffect(()=>{
  load(true);
  const timer=setInterval(()=>{if(document.visibilityState==="visible")load();},60000);
  const onFocus=()=>load();
  window.addEventListener("focus",onFocus);
  return()=>{clearInterval(timer);window.removeEventListener("focus",onFocus);};
 },[load]);
 useEffect(()=>{
  if(tab!=="listed"||board||boardError)return;
  let active=true;
  fetch("/api/ipo?view=scoreboard",{cache:"no-store"}).then(r=>r.json()).then(j=>{
   if(!active)return;
   if(j.ok&&Array.isArray(j.rows))setBoard(j);else setBoardError(true);
  }).catch(()=>{if(active)setBoardError(true);});
  return()=>{active=false;};
 },[tab,board,boardError]);
 const actualById=useMemo(()=>Object.fromEntries((board?.rows||[]).map(x=>[x.slug,x])),[board]);
 const today=todayInIndia();
 const soon=useMemo(()=>{
  if(!buckets)return [];
  return [...(buckets.closed||[]),...(buckets.open||[]),...(buckets.upcoming||[])]
   .map(x=>({ipo:x,days:daysBetween(today,x.listingDate)}))
   .filter(x=>x.days!==null&&x.days>=0&&x.days<=7)
   .sort((a,b)=>a.days-b.days).slice(0,6);
 },[buckets,today]);
 const issues=useMemo(()=>{
  let rows=[...(buckets?.[tab]||[])];
  if(segment!=="all")rows=rows.filter(x=>x.segment.toLowerCase()===segment);
  const q=query.trim().toLowerCase();
  if(q)rows=rows.filter(x=>(x.name+" "+(x.symbol||"")).toLowerCase().includes(q));
  if(sort==="name")rows.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==="demand")rows.sort((a,b)=>(b.subscription??-Infinity)-(a.subscription??-Infinity));
  if(sort==="gmp")rows.sort((a,b)=>(b.gmpPct??-Infinity)-(a.gmpPct??-Infinity));
  if(sort==="gain")rows.sort((a,b)=>(actualById[b.id]?.actualPct??b.listingGain??-Infinity)-(actualById[a.id]?.actualPct??a.listingGain??-Infinity));
  return rows;
 },[buckets,tab,segment,query,sort,actualById]);
 const allCount=(buckets&&Object.values(buckets).reduce((n,x)=>n+x.length,0))||0;
 return <section className="ahq-ipo-screen" aria-label="IPO market dashboard">
  <div className="ipo-shell">
   <div className="ipo-board-head"><div><span className="ipo-eyebrow">01 / MARKET BOARD</span><h2>Today's IPO <em>landscape.</em></h2><p>Issue calendars, bidding demand, unofficial GMP and actual listing outcomes — separated, timestamped and available without signing in.</p></div>
    <button type="button" className="ipo-refresh" disabled={refreshing||loading} onClick={()=>load()}>{refreshing?"Checking…":"↻ Refresh feed"}</button>
   </div>
   <div className="ipo-metrics" aria-label="IPO coverage counts">
    <Metric label="Open for bidding" value={buckets?plain(buckets.open.length):"—"} note="Date-checked status"/>
    <Metric label="Announced upcoming" value={buckets?plain(buckets.upcoming.length):"—"} note="Tracked by the feed"/>
    <Metric label="Closed issues" value={buckets?plain(buckets.closed.length):"—"} note="Not open for bids"/>
    <Metric label="Recently listed" value={buckets?plain(buckets.listed.length):"—"} note="Recent provider coverage"/>
   </div>
   <div className="ipo-feed-meta" role="status">
    <span className={error?"ipo-feed-dot ipo-feed-error":meta?.freshness==="timestamp_within_48h"?"ipo-feed-dot":"ipo-feed-dot ipo-feed-unknown"}/>
    <strong>{error?"Feed unavailable":meta?.freshness==="possibly_stale"?"Upstream data may be stale":meta?.freshness==="timestamp_within_48h"?"Upstream timestamp within 48h":"Upstream quote age unverified"}</strong>
    {meta?.upstreamUpdatedAt?<span>Source updated: {timestamp(meta.upstreamUpdatedAt)}</span>:null}
    {lastCheck?<span>Checked: {timestamp(lastCheck)}</span>:null}
    {meta?.correctedStatuses>0?<span>{meta.correctedStatuses} expired bidding statuses reconciled</span>:null}
   </div>
   <p className="ipo-feed-caveat">A successful check is not proof that GMP or subscription figures updated at that moment. The source permits a maximum refresh of once per minute; this page follows that limit.</p>
   {error&&<p className="ipo-alert" role="alert">{error}</p>}
   {meta?.partial&&<p className="ipo-alert">Some source records were duplicated, incomplete or used unrecognized statuses. Counts reflect valid records only.</p>}
   {soon.length>0&&<section className="ipo-listing-soon"><div className="ipo-listing-title"><span className="ipo-eyebrow">NEXT 7 DAYS</span><h3>Expected listing dates</h3></div><div className="ipo-soon-grid">{soon.map(({ipo,days})=><button type="button" key={ipo.id} data-ahq-event="ipo_issue_opened" onClick={()=>setSelected(ipo)}><strong>{ipo.name}</strong><span>{days===0?"Scheduled today":days===1?"Scheduled tomorrow":"In "+days+" days"} · {dateLabel(ipo.listingDate)}</span></button>)}</div></section>}
   <div className="ipo-controls"><div className="ipo-tabs" role="tablist" aria-label="IPO status">{TABS.map(t=><button type="button" role="tab" aria-selected={tab===t.key} aria-controls="ahq-ipo-results" key={t.key} data-ahq-event={tab===t.key?undefined:"ipo_tab_selected"} onClick={()=>setTab(t.key)} className={tab===t.key?"active":""}>{t.label}<span>{buckets?plain((buckets[t.key]||[]).length):"—"}</span></button>)}</div>
    <div className="ipo-filters"><label className="ipo-search"><span className="sr-only">Search company or ticker</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search company or ticker…" aria-label="Search IPOs"/></label>
     <label className="ipo-filter-label"><span>Board</span><select value={segment} data-ahq-event="ipo_filter_changed" onChange={e=>setSegment(e.target.value)} aria-label="IPO board filter"><option value="all">All issues</option><option value="mainboard">Mainboard</option><option value="sme">SME</option></select></label>
     <label className="ipo-filter-label"><span>Sort</span><select value={sort} data-ahq-event="ipo_filter_changed" onChange={e=>setSort(e.target.value)} aria-label="IPO sort order"><option value="date">Date / source order</option><option value="name">Company name</option><option value="demand">Highest subscription</option><option value="gmp">Highest implied GMP %</option><option value="gain">Highest listing gain</option></select></label>
    </div>
   </div>
   <div className="ipo-results-label"><span>{loading?"Checking issues…":plain(issues.length)+" displayed · "+plain(allCount)+" issues in current feed"}</span><span>{query||segment!=="all"?"Filtered results":"Showing current tracked coverage, not the complete exchange universe"}</span></div>
   <div id="ahq-ipo-results" role="tabpanel" aria-label={TABS.find(t=>t.key===tab)?.label} aria-live="polite">
    {loading&&!buckets?<div className="ipo-empty">Checking the IPO data feed…</div>:null}
    {!loading&&buckets&&issues.length===0?<div className="ipo-empty"><strong>{query||segment!=="all"?"No matching issues":"No records for this stage"}</strong><p>{query||segment!=="all"?"Try clearing the search or selecting all issue types.":TABS.find(t=>t.key===tab)?.empty}</p>{query||segment!=="all"?<button type="button" onClick={()=>{setQuery("");setSegment("all");}}>Clear filters</button>:null}</div>:null}
    {!loading&&!buckets?<div className="ipo-empty"><strong>Issue data currently unavailable</strong><p>Please use the NSE and BSE links below to confirm active offers while the provider is unavailable.</p></div>:null}
    {issues.length>0?<div className="ipo-grid">{issues.map(ipo=><IpoCard key={ipo.id} ipo={ipo} actual={actualById[ipo.id]} onOpen={setSelected}/>)}</div>:null}
   </div>
   {tab==="listed"&&<section className="ipo-scoreboard"><div className="ipo-scoreboard-head"><span className="ipo-eyebrow">02 / LISTING REALITY CHECK</span><h3>What GMP implied. <em>What actually happened.</em></h3><p>Only historical issues with recorded comparisons are included. Missing closing-day GMP must stay missing — never an assumed zero.</p></div>
     {board?.summary?.n>0&&<div className="ipo-board-stats"><Metric label="Issues in scorecard" value={plain(board.summary.n)} note="Available historical sample"/><Metric label="Average absolute gap" value={number(board.summary.avgAbsErrorPp)===null?"—":plain(board.summary.avgAbsErrorPp)+" pp"} note="Percentage points"/><Metric label="Direction hit" value={number(board.summary.directionHitPct)===null?"—":plain(board.summary.directionHitPct)+"%"} note="Historical direction match"/></div>}
     {board?.rows?.length>0?<div className="ipo-table-scroll"><table className="ipo-score-table"><thead><tr><th>IPO</th><th>Reported GMP at close</th><th>GMP implied</th><th>Actual listing</th><th>Forecast gap</th></tr></thead><tbody>{board.rows.slice(0,35).map(row=><tr key={row.slug}><th scope="row">{row.name}<small>{dateLabel(row.listedOn)}</small></th><td>{rupees(row.gmpAtClose)}</td><td>{percent(row.impliedPct)}</td><td><Delta value={row.actualPct}/></td><td>{number(row.errorPp)===null?"—":plain(row.errorPp)+" pp"}</td></tr>)}</tbody></table></div>:<p className="ipo-detail-muted">{boardError?"The listing scorecard is temporarily unavailable. The issue board above remains usable.":"Loading the historical listing scorecard…"}</p>}
   </section>}
   <div className="ipo-methodology"><div><span className="ipo-eyebrow">DATA INTEGRITY / READ BEFORE ACTING</span><h3>Three different signals. Three different meanings.</h3></div><div className="ipo-method-grid"><article><b>01 / ISSUE PRICE</b><p>The official share price or price band published for an IPO. Confirm it in the RHP and exchange documents.</p></article><article><b>02 / REPORTED GMP</b><p>Unofficial premium above the issue price. Indicative gap = reported GMP ÷ upper issue price × 100. It is not an official quote or a prediction. Disputed estimates are withheld.</p></article><article><b>03 / ACTUAL LISTING</b><p>Reported debut price compared with the final issue price. After listing, use actual data instead of a pre-listing GMP estimate.</p></article></div></div>
   <footer className="ipo-source-footer"><p>Market information aggregated from <a href="https://www.xflot.com/api-docs" target="_blank" rel="noopener noreferrer">Xflot</a> (required source attribution). Official primary-market verification: <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noopener noreferrer">NSE</a> and <a href="https://www.bseindia.com/markets/PublicIssues/IPOIssues_new.aspx?id=1&Type=p" target="_blank" rel="noopener noreferrer">BSE</a>. GMP is unofficial, not exchange-verified, and may differ across reporting sources. This is educational information, not investment advice.</p></footer>
  </div>
  {selected&&<IpoDetails ipo={selected} onClose={closeDetails}/>}
 </section>;
}
