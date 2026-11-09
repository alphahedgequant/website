// Verify the real first-party collector can persist an anonymous event and
// erase it afterward. Synthetic UUIDs are never printed or saved.
// No authentication cookies, trades, stock searches or user information.
import {randomUUID} from "node:crypto";

const origin="https://www.alphahedgequant.com";
const visitor=randomUUID();
const session=randomUUID();
const headers={"Content-Type":"text/plain","Origin":origin,"Sec-Fetch-Site":"same-origin"};
const results=[];
let inserted=false;
let cleaned=false;
let error=null;
const gate=async(label,fn)=>{
 try{
  const v=await fn();
  const row={label,status:v.status,passed:v.passed};
  results.push(row);console.log("AHQ_ANALYTICS_SMOKE",JSON.stringify(row));
  return row;
 }catch(e){
  const row={label,passed:false,error:e?.name==="TimeoutError"?"timeout":"request_failed"};
  results.push(row);console.log("AHQ_ANALYTICS_SMOKE",JSON.stringify(row));
  return row;
 }
};
const req=(path,opts)=>fetch(origin+path,{redirect:"manual",signal:AbortSignal.timeout(15000),...opts});
await gate("public_collector_get_does_not_expose_data",async()=>{
 const r=await req("/api/insights/event",{method:"GET"});
 return {status:r.status,passed:r.status===405};
});
await gate("anonymous_private_dashboard_blocked",async()=>{
 const r=await req("/api/admin/analytics?days=7",{method:"GET"});
 return {status:r.status,passed:[301,302,303,307,308,401,403,404].includes(r.status)};
});
try{
 const test=await gate("first_party_event_persisted",async()=>{
  const r=await req("/api/insights/event",{method:"POST",headers,
    body:JSON.stringify({event:"pageview",path:"/ipo",visitor,session,activeSeconds:0,source:"direct"})});
  inserted=r.status===204;
  return {status:r.status,passed:inserted};
 });
 if(!test.passed)error="Collector could not confirm a database write";
}finally{
 // Always attempt deletion, including when persistence could be uncertain.
 for(let attempt=0;attempt<3&&!cleaned;attempt++){
  try{
   const r=await req("/api/insights/event",{method:"DELETE",headers,body:JSON.stringify({visitor})});
   cleaned=r.status===204;
   if(cleaned)break;
   if(attempt===2)results.push({label:"synthetic_visitor_erasure",status:r.status,passed:false});
  }catch(e){
   if(attempt===2)results.push({label:"synthetic_visitor_erasure",passed:false,error:e?.name||"request_failed"});
  }
 }
 console.log("AHQ_ANALYTICS_SMOKE",JSON.stringify({label:"synthetic_visitor_erasure",passed:cleaned}));
}
const passed=results.every(x=>x.passed)&&inserted&&cleaned;
console.log("AHQ_ANALYTICS_SUMMARY",JSON.stringify({passed,checks:results.length,inserted,cleaned,checkedAt:new Date().toISOString(),note:error}));
if(!passed)process.exitCode=1;
