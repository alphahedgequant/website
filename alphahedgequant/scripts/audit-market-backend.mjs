// Read-only market API health sampling. No authentication, mutations,
// account data, or raw vendor payloads are written to artifacts.
// This verifies reachability/schema, NOT price correctness against an exchange.
import {mkdir,writeFile} from "node:fs/promises";
const BASE="https://zerohedgequant-backend.onrender.com";
const targets=[
 ["/","backend health"],
 ["/api/indices","NSE indices"],
 ["/api/screener","Indian equities"],
 ["/api/us-screener","US equities"],
 ["/api/stock/RELIANCE","NSE single stock"],
 ["/api/option-chain/NIFTY","NSE option chain"],
];
const safeError=s=>String(s||"").replace(/(?:sk|pk)_(?:test|live)_[A-Za-z0-9_-]+/g,"[redacted]").replace(/[A-Za-z0-9_-]{40,}/g,"[redacted]").slice(0,145);
const rows=[];
for(const [path,label] of targets){
 const started=Date.now();let row={label,path,status:null,elapsedMs:null,ok:false,dataShape:null,dataLength:null,success:null,fields:[],error:null};
 try{
  const res=await fetch(BASE+path,{headers:{"Accept":"application/json","User-Agent":"AlphaHedgeQuant-ReadOnly-ReleaseAudit/1.0"},signal:AbortSignal.timeout(42000)});
  row.status=res.status;
  const text=await res.text();
  row.elapsedMs=Date.now()-started;
  let data;
  try{data=JSON.parse(text)}catch{row.error="Response not JSON";rows.push(row);console.log("AHQ_BACKEND_SAMPLE",JSON.stringify(row));continue}
  const val=data?.data??data?.buckets??data;
  row.ok=res.ok && data?.success!==false;
  row.success=typeof data?.success==="boolean"?data.success:null;
  row.fields=data&&typeof data==="object"?Object.keys(data).slice(0,24):[];
  row.dataShape=Array.isArray(val)?"array":typeof val;
  if(Array.isArray(val))row.dataLength=val.length;
  else if(val&&typeof val==="object")row.dataLength=Object.keys(val).length;
  if(!row.ok)row.error=safeError(data?.errorCode||data?.error||data?.message||"non-success status");
  if(row.ok&&row.dataLength===0)row.note="Response valid but dataset empty";
 }catch(e){row.elapsedMs=Date.now()-started;row.error=e?.name==="TimeoutError"?"Timed out after 42 seconds":safeError(e?.code||e?.message||e)}
 rows.push(row);
 console.log("AHQ_BACKEND_SAMPLE",JSON.stringify(row));
}
await mkdir("ahq-backend-audit",{recursive:true});
await writeFile("ahq-backend-audit/results.json",JSON.stringify({timestamp:new Date().toISOString(),sampled:rows.length,failed:rows.filter(r=>!r.ok).length,rows},null,2));
console.log("AHQ_BACKEND_SUMMARY",JSON.stringify({sampled:rows.length,failed:rows.filter(r=>!r.ok).length,empty:rows.filter(r=>r.ok&&r.dataLength===0).length}));
if(rows.some(r=>!r.ok))process.exitCode=1;
