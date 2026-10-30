"use client";
import {useCallback,useEffect,useState} from "react";
const METRICS={
 income:["revenueFromOperations","grossSalesAndServices","otherIncome","totalIncome","totalExpenses","profitBeforeTax","taxExpense","profitForYear","ebit","ebitda","interestExpense"],
 balance:["nonCurrentAssets","currentAssets","totalAssets","cashAndEquivalents","shortTermBorrowings","longTermBorrowings","currentLiabilities","nonCurrentLiabilities","totalLiabilities","totalEquity","inventories","tradeReceivables","tradePayables"],
 cash:["operatingCashFlow","investingCashFlow","financingCashFlow","changeInCash","closingCash","capitalExpenditure"]
};
const nice=s=>s.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/^./,v=>v.toUpperCase());
const num=n=>n==null?"—":Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
const initial=()=>({statement:"income",metric:"revenueFromOperations",period_end:"",period_type:"annual",reporting_scope:"consolidated",amount_inr_crore:"",source_url:"",source_document:"",source_page:"",evidence:"",audited:true});
export default function TerminalReviewedFinancialFacts({symbol}){
 const [facts,setFacts]=useState([]),[pending,setPending]=useState([]),[editor,setEditor]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(true),[form,setForm]=useState(initial),[visible,setVisible]=useState(false);
 const refresh=useCallback(async()=>{setLoading(true);try{
 const r=await fetch("/api/terminal/financial-facts?symbol="+encodeURIComponent(symbol)+"&review=1",{cache:"no-store"}),j=await r.json();
 if(!j.ok)throw Error(j.error||"Financial facts unavailable");
 setFacts(j.items||[]);setPending(j.pending||[]);setEditor(Boolean(j.canReview));setError("");
 }catch(e){setFacts([]);setPending([]);setError(e.message)}finally{setLoading(false)}},[symbol]);
 useEffect(()=>{setVisible(false);setForm(initial());refresh()},[symbol,refresh]);
 const approve=async(id,status)=>{try{const r=await fetch("/api/terminal/financial-facts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})}),j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||"Review failed");await refresh()}catch(e){setError(e.message)}};
 const submit=async e=>{e.preventDefault();try{const r=await fetch("/api/terminal/financial-facts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,symbol,amount_inr_crore:Number(form.amount_inr_crore)})}),j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||"Unable to save");setForm(initial());setVisible(false);await refresh()}catch(e){setError(e.message)}};
 return <section className="qt-panel qt-fin-facts"><div className="qt-panel-top"><strong>VERIFIED FINANCIAL FACTS · FILING DATABASE</strong><span>Consolidated / standalone, annual / quarterly</span></div><div className="qt-report-body">
 <p>Additional financial figures are displayed only after source review. Figures from a third-party screener are not automatically relabelled as audited.</p>
 {loading&&<p>Checking verified filings…</p>}
 {error&&<p role="status" className="qt-intel-alert">{error}</p>}
 {facts.length?<div className="qt-fin-scroll"><table className="qt-financial-table"><thead><tr><th>Period</th><th>Scope</th><th>Statement</th><th>Metric</th><th>₹ Cr</th><th>Report</th></tr></thead><tbody>{facts.map(f=><tr key={f.id}><td>{String(f.period_end).slice(0,10)}</td><td>{f.reporting_scope}</td><td>{f.statement}</td><td>{nice(f.metric)}</td><td>{num(f.amount_inr_crore)}</td><td><a href={f.source_url} target="_blank" rel="noopener noreferrer">{f.source_document} · p.{f.source_page} ↗</a></td></tr>)}</tbody></table></div>:!loading&&<p className="qt-report-empty">No additional verified filing figures for {symbol}. Official audited snapshots (where available) are displayed separately above.</p>}
 {editor&&<><div className="qt-report-review-head"><strong>FINANCIAL DATA EDITOR</strong><span>{pending.length} waiting for verification</span></div>
 {pending.map(f=><article className="qt-report-row" key={f.id}><b>{f.statement} / {nice(f.metric)} · {String(f.period_end).slice(0,10)} · ₹{num(f.amount_inr_crore)} Cr</b><p>{f.evidence}</p><a target="_blank" rel="noopener noreferrer" href={f.source_url}>{f.source_document} · p.{f.source_page} ↗</a><div className="qt-report-actions"><button onClick={()=>approve(f.id,"verified")} type="button">Approve verified fact</button><button onClick={()=>approve(f.id,"rejected")} type="button">Reject</button></div></article>)}
 <div className="qt-intel-actions"><button type="button" onClick={()=>setVisible(x=>!x)}>{visible?"Close editor":"Enter audited report figure"}</button></div>
 {visible&&<form onSubmit={submit} className="qt-network-form"><p>Enter figures only after checking the original report and specify the printed PDF page. New figures remain unpublished until explicitly approved.</p>
 <label>Statement<select value={form.statement} onChange={e=>setForm(o=>({...o,statement:e.target.value,metric:METRICS[e.target.value][0]}))}>{Object.keys(METRICS).map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Metric<select value={form.metric} onChange={e=>setForm(o=>({...o,metric:e.target.value}))}>{METRICS[form.statement].map(x=><option key={x} value={x}>{nice(x)}</option>)}</select></label>
 <label>Period end<input type="date" required value={form.period_end} onChange={e=>setForm(o=>({...o,period_end:e.target.value}))}/></label>
 <label>Period type<select value={form.period_type} onChange={e=>setForm(o=>({...o,period_type:e.target.value}))}><option value="annual">Annual</option><option value="quarterly">Quarterly</option></select></label>
 <label>Consolidation<select value={form.reporting_scope} onChange={e=>setForm(o=>({...o,reporting_scope:e.target.value}))}><option value="consolidated">Consolidated</option><option value="standalone">Standalone</option></select></label>
 <label>Amount, ₹ crore<input type="number" step="any" required value={form.amount_inr_crore} onChange={e=>setForm(o=>({...o,amount_inr_crore:e.target.value}))}/></label>
 <label>Source document<input required minLength={5} value={form.source_document} onChange={e=>setForm(o=>({...o,source_document:e.target.value}))}/></label>
 <label>Official HTTPS document<input type="url" required value={form.source_url} onChange={e=>setForm(o=>({...o,source_url:e.target.value}))}/></label>
 <label>Document page<input required value={form.source_page} onChange={e=>setForm(o=>({...o,source_page:e.target.value}))}/></label>
 <label>Evidence<textarea required minLength={15} value={form.evidence} onChange={e=>setForm(o=>({...o,evidence:e.target.value}))}/></label>
 <label>Audited status<select value={String(form.audited)} onChange={e=>setForm(o=>({...o,audited:e.target.value==="true"}))}><option value="true">Issuer filing identifies audited</option><option value="false">Unaudited / other filing</option></select></label>
 <button type="submit">Save for review</button></form>}
 </>}
 </div></section>;
}
