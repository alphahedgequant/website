"use client";
import {useState} from "react";
export default function ResearchImport(){
 const [file,setFile]=useState(null),[busy,setBusy]=useState(false),[result,setResult]=useState("");
 async function submit(e){e.preventDefault();if(!file)return;setBusy(true);setResult("");try{const raw=await file.text();const parsed=JSON.parse(raw);if(!parsed||Array.isArray(parsed))throw Error("Expected company-data JSON object");
 const r=await fetch("/api/terminal/import-spreadsheet",{method:"POST",headers:{"Content-Type":"application/json"},body:raw});const j=await r.json();if(!r.ok)throw Error(j.error||"Import failed");setResult("Imported "+j.facts+" unverified data points from "+j.companies+" companies. Source verification is still required.");}
 catch(e){setResult(e.message)}finally{setBusy(false)}}
 return <main style={{maxWidth:780,margin:"64px auto",padding:28,color:"#e8edf7",fontFamily:"system-ui"}}><h1>AHQ · Research data import</h1><p>Authorized research administrators only. Upload the normalized AHQ company-data JSON generated from company Excel workbooks. Importing data does not mark it audited or verified.</p><form onSubmit={submit}><input aria-label="Normalized company-data JSON" type="file" accept=".json,application/json" onChange={e=>setFile(e.target.files?.[0]||null)}/><button disabled={busy||!file} style={{margin:16,padding:12}}>{busy?"Importing…":"Import research data"}</button></form><p role="status">{result}</p><p>Existing data remains available in the research database. Only the authorized admin account can upload data.</p></main>
}