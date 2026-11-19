"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";

const BATCH_SIZE=1000;
const TABLES=["coverage","summary","financials","filings"];
const labels={coverage:"Company coverage",summary:"Screener metrics",financials:"Financial statements",filings:"NSE filing index"};
async function post(body){
  const response=await fetch("/api/admin/screener-import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||result.ok===false)throw new Error(result.error||("Import request failed ("+response.status+")"));
  return result;
}
async function readBundle(file){
  const bytes=await file.arrayBuffer();
  let text;
  if(file.name.toLowerCase().endsWith(".gz")){
    if(typeof DecompressionStream==="undefined")throw new Error("This browser cannot decompress the prepared .gz bundle. Please use a current Safari, Chrome or Firefox browser.");
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    text=await new Response(stream).text();
  }else text=new TextDecoder().decode(bytes);
  return JSON.parse(text);
}
export default function ScreenerImportClient(){
  const [file,setFile]=useState(null),[status,setStatus]=useState("Checking published dataset…");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[progress,setProgress]=useState({done:0,total:0,table:""});
  const [current,setCurrent]=useState(null);
  useEffect(()=>{let alive=true;fetch("/api/screener/fundamentals?view=meta",{cache:"no-store"}).then(r=>r.json()).then(x=>{if(!alive)return;setCurrent(x.status==="ready"?x.meta:null);setStatus(x.status==="ready"?"A published dataset is active.":"No NSE fundamentals dataset has been published yet.");}).catch(()=>{if(alive)setStatus("Dataset status is temporarily unavailable.");});return()=>{alive=false}},[]);
  const percent=progress.total?Math.min(100,Math.round(progress.done/progress.total*100)):0;
  const counts=useMemo(()=>current?[
    ["Coverage",current.coverage_count],["Screener summaries",current.summary_count],
    ["Financial records",current.financial_count],["Filing-index records",current.filing_count]
  ]:[],[current]);
  async function start(){
    if(!file||busy)return;
    setBusy(true);setError("");setProgress({done:0,total:0,table:"Reading bundle"});
    try{
      const bundle=await readBundle(file),meta=bundle?.meta||{},expected=meta.counts||{};
      if(meta.format!=="AHQ_NSE_FUNDAMENTALS_V1"||meta.sourceWorkbook!=="NSE_Filings_Fundamentals_20261119.xlsx"||
        !/^nse-20261119-[a-f0-9]{12}$/.test(meta.importId)||!Array.isArray(bundle.coverage)||
        !Array.isArray(bundle.summary)||!Array.isArray(bundle.financials)||!Array.isArray(bundle.filings))
        throw new Error("This is not the prepared 19 November NSE fundamentals bundle.");
      for(const table of TABLES)if(bundle[table].length!==expected[table])throw new Error("Bundle count mismatch for "+table+". No data was uploaded.");
      const total=TABLES.reduce((n,k)=>n+bundle[k].length,0);
      setProgress({done:0,total,table:"Starting staged import"});
      const begun=await post({action:"begin",meta});
      if(begun.alreadyPublished){setStatus("This exact workbook version is already published.");setCurrent({source_workbook:meta.sourceWorkbook,source_sha256:meta.sourceSha256,coverage_count:expected.coverage,summary_count:expected.summary,financial_count:expected.financials,filing_count:expected.filings});return;}
      let done=0;
      for(const table of TABLES){
        const rows=bundle[table];
        setProgress(p=>({...p,table:labels[table]}));
        for(let start=0;start<rows.length;start+=BATCH_SIZE){
          const batch=rows.slice(start,start+BATCH_SIZE);
          await post({action:"batch",importId:meta.importId,table,rows:batch});
          done+=batch.length;
          setProgress({done,total,table:labels[table]});
        }
      }
      setProgress({done:total,total,table:"Verifying every row"});
      const final=await post({action:"finalize",importId:meta.importId});
      setCurrent({source_workbook:meta.sourceWorkbook,source_sha256:meta.sourceSha256,
        coverage_count:final.counts.coverage,summary_count:final.counts.summary,
        financial_count:final.counts.financials,filing_count:final.counts.filings});
      setStatus("All row counts matched. The NSE fundamentals dataset is now published.");
    }catch(e){setError(e?.message||"Import failed");setStatus("Import not published. You can retry the same bundle safely.");}
    finally{setBusy(false);}
  }
  return <main className="max-w-5xl mx-auto px-5 py-10">
    <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
      <div><p className="eyebrow mb-2">ALPHAHEDGEQUANT · DATA OPERATIONS</p>
        <h1 className="font-display text-3xl md:text-4xl text-body">NSE fundamentals import</h1>
        <p className="text-sm text-muted mt-2 max-w-2xl">Owner-only staging workflow for the 19 November 2026 NSE filings workbook. Existing published data stays live until every new row passes the final count check.</p>
      </div>
      <Link href="/screener" className="btn-ghost">Open screener ↗</Link>
    </div>
    <section className="card p-5 md:p-7">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-body">Published dataset</h2>
        <span className="text-xs font-mono rounded-full border border-line px-3 py-1.5 text-muted">{current?"ACTIVE":"NOT PUBLISHED"}</span>
      </div>
      <p className="text-sm text-muted">{status}</p>
      {current&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {counts.map(([label,value])=><div key={label} className="rounded-lg border border-line bg-raised p-3"><div className="text-xs text-muted">{label}</div><div className="font-mono text-lg text-body mt-1">{Number(value||0).toLocaleString("en-IN")}</div></div>)}
      </div>}
      {current&&<p className="text-xs text-muted mt-4">Source: {current.source_workbook}. SHA-256: <span className="font-mono break-all">{current.source_sha256}</span></p>}
    </section>
    <section className="card p-5 md:p-7 mt-5">
      <h2 className="font-display text-xl text-body mb-2">Upload prepared workbook bundle</h2>
      <p className="text-sm text-muted leading-relaxed mb-5">Choose the <span className="font-mono text-body">.json.gz</span> file generated from your uploaded Excel workbook. The importer stores coverage, both reporting bases, every financial period and all filing-index revisions. It publishes only after database counts exactly match the bundle.</p>
      <label className="block rounded-xl border border-dashed border-line bg-raised p-5 cursor-pointer hover:border-amber/50 transition-colors">
        <span className="block text-sm font-semibold text-body">Select NSE fundamentals bundle</span>
        <span className="block text-xs text-muted mt-1">Compressed JSON · approximately 7–10 MB</span>
        <input type="file" accept=".gz,.json,application/gzip,application/json" disabled={busy} onChange={e=>setFile(e.target.files?.[0]||null)} className="block w-full mt-4 text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-card file:px-3 file:py-2 file:text-body"/>
      </label>
      {file&&<p className="text-xs text-muted mt-3">Selected: {file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}
      {busy&&<div className="mt-5">
        <div className="flex justify-between text-xs font-mono text-muted mb-2"><span>{progress.table}</span><span>{progress.done.toLocaleString("en-IN")} / {progress.total.toLocaleString("en-IN")} · {percent}%</span></div>
        <div className="h-2 rounded-full bg-raised overflow-hidden"><div className="h-full rounded-full bg-[#2DD482] transition-all" style={{width:percent+"%"}}/></div>
      </div>}
      {error&&<div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button type="button" disabled={!file||busy} onClick={start} className="btn-primary disabled:opacity-50">{busy?"Importing…":"Validate & publish dataset"}</button>
        <span className="text-xs text-muted">Retry-safe · staging first · no partial publication</span>
      </div>
      <p className="text-xs text-muted mt-5 leading-relaxed">The workbook contains latest-revised financial statement values. Its first-publication timestamps and revision counts are retained, but it is not a revision-complete point-in-time backtest dataset. Cash-flow figures remain labelled YTD.</p>
    </section>
  </main>;
}
