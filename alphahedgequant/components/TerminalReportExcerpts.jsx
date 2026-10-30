"use client";
import {useCallback,useEffect,useState} from "react";

const LABEL={
 financial_statements:"Financial statements",cash_flows:"Cash flow evidence",
 segments:"Business segments",geography:"Geographic mix",
 major_customers:"Major customers",suppliers:"Supplier disclosures"
};
export default function TerminalReportExcerpts({symbol,scope="network"}){
 const [items,setItems]=useState([]),[pending,setPending]=useState([]),[reviewer,setReviewer]=useState(false),[pendingCategories,setPendingCategories]=useState({}),[message,setMessage]=useState(""),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);try{
  const r=await fetch("/api/terminal/report-extracts?symbol="+encodeURIComponent(symbol)+"&review=1",{cache:"no-store"});
  const j=await r.json();if(!j.ok)throw Error(j.error||"Evidence store unavailable");
  setItems(j.items||[]);setPending(j.pending||[]);setReviewer(Boolean(j.canReview));setPendingCategories(j.pendingCategories||{});setMessage("");
 }catch(e){setItems([]);setPending([]);setPendingCategories({});setMessage(e.message)}finally{setLoading(false)}},[symbol]);
 useEffect(()=>{load()},[load]);
 const types=scope==="financial"?new Set(["financial_statements","cash_flows"]):new Set(["segments","geography","major_customers","suppliers"]);
 const filtered=items.filter(x=>types.has(x.category));
 const awaiting=pending.filter(x=>types.has(x.category));
 const pendingVisible=[...types].reduce((acc,type)=>acc+Number(pendingCategories[type]||0),0);
 const review=async(id,status)=>{
  try{const r=await fetch("/api/terminal/report-extracts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})}),j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||"Unable to review");await load()}
  catch(e){setMessage(e.message)}
 };
 return <section className="qt-panel qt-report-evidence">
  <div className="qt-panel-top"><strong>{scope==="financial"?"PRIMARY ANNUAL-REPORT FINANCIAL EVIDENCE":"ANNUAL-REPORT BUSINESS & COUNTERPARTY EXCERPTS"}</strong><span>Page-level citations · not interpreted financial figures</span></div>
  <div className="qt-report-body">
   <p>PDF report passages are automatically indexed but are published here only after an authorized editor checks the original document. Extracted passages are <strong>not</strong> proof of a reported percentage or named relationship on their own.</p>
   {loading&&<p>Loading filing evidence…</p>}
   {!loading&&pendingVisible>0&&<p className="qt-report-empty"><strong>{pendingVisible} machine-extracted passages awaiting source verification</strong> for {symbol} in this section. These do not yet establish named customers, financial figures or revenue shares.</p>}
   {message&&<p role="status" className="qt-intel-alert">{message}</p>}
   {filtered.length?filtered.map(x=><article className="qt-report-row" key={x.id}><div><b>{LABEL[x.category]||x.category} · {x.fiscal_period} · page {x.source_page}</b><a href={x.source_url} target="_blank" rel="noopener noreferrer">Open original report ↗</a></div><p>{x.evidence}</p></article>):!loading&&<p className="qt-report-empty">No verified annual-report excerpts indexed for {symbol}. Missing evidence is not zero revenue or zero customer exposure.</p>}
   {reviewer&&<>
    <div className="qt-report-review-head"><strong>EDITOR REVIEW QUEUE</strong><span>{awaiting.length} pending excerpts shown</span></div>
    {awaiting.length?awaiting.map(x=><article className="qt-report-row" key={x.id}><div><b>{LABEL[x.category]||x.category} · {x.fiscal_period} · page {x.source_page}</b><a href={x.source_url} target="_blank" rel="noopener noreferrer">Check document ↗</a></div><p>{x.evidence}</p><div className="qt-report-actions"><button type="button" onClick={()=>review(x.id,"verified")}>Mark passage verified</button><button type="button" onClick={()=>review(x.id,"rejected")}>Reject</button></div></article>):<p className="qt-report-empty">No pending candidate excerpts for this category.</p>}
    <p className="qt-report-empty">New PDFs can be indexed from the <a href="https://github.com/alphahedgequant/website/actions/workflows/annual-report-ingest.yml" target="_blank" rel="noopener noreferrer">Annual Report Indexing workflow ↗</a> (requires the repository NEON_DATABASE_URL secret).</p>
   </>}
  </div>
 </section>;
}
