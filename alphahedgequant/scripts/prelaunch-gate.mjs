// Zero-credential, read-only prelaunch gate for the production website.
// No forms, auth sessions, user records, trading actions or market orders.
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const root="https://www.alphahedgequant.com";
const checks=[];
let blocked=0;
async function inspect(label,url,allowed,{requiredHeaders=[],forbiddenBody=[],expectLocation=null}={}){
  let row={label,passed:false,status:null,location:null,missingHeaders:[],reason:null};
  try{
    const r=await fetch(url,{method:"GET",redirect:"manual",headers:{"Accept":"text/html,application/json,text/plain,application/xml;q=0.8"},signal:AbortSignal.timeout(18000)});
    row.status=r.status;row.location=r.headers.get("location");
    const text=await r.text();
    const matching=allowed.includes(r.status);
    row.missingHeaders=requiredHeaders.filter(x=>!r.headers.get(x));
    const exposed=forbiddenBody.find(x=>text.toLowerCase().includes(x.toLowerCase()));
    row.passed=matching && row.missingHeaders.length===0 && !exposed && (!expectLocation || (row.location||"").includes(expectLocation));
    if(!row.passed)row.reason=!matching?"unexpected status":row.missingHeaders.length?"missing security header":exposed?"unexpected public content":"unexpected redirect";
  }catch(e){row.reason=e.name==="TimeoutError"?"timeout":"HTTPS request failed"}
  checks.push(row);console.log("AHQ_LAUNCH_GATE",JSON.stringify(row));
  if(!row.passed)blocked++;
}
for(const path of ["/","/about","/privacy","/terms","/disclaimer","/sign-in","/sign-up"]){
  await inspect("public "+path,root+path,[200],{requiredHeaders:["x-content-type-options","x-frame-options","strict-transport-security"]});
}
await inspect("canonical apex redirect","https://alphahedgequant.com/",[307,308],{expectLocation:"www.alphahedgequant.com"});
await inspect("robots.txt",root+"/robots.txt",[200]);
await inspect("sitemap.xml",root+"/sitemap.xml",[200]);
await inspect("anonymous admin analytics",root+"/api/admin/analytics",[301,302,303,307,308,401,403,404],{forbiddenBody:['"dau":','"visitors":','"pageviews":']});
await inspect("anonymous market proxy",root+"/api/market/us-screener",[301,302,303,307,308,401,403,404],{forbiddenBody:['"priceAsOf":','"priceSource":']});
await inspect("unauthorized research cron",root+"/api/cron/ingest-research",[401,403]);
for(const path of ["/.env","/.git/config","/api/.env"]){
  await inspect("protected file "+path,root+path,[301,302,303,307,308,401,403,404],{forbiddenBody:["CLERK_SECRET_KEY=","DATABASE_URL=","GEMINI_API_KEY="]});
}
await mkdir("ahq-launch-audit",{recursive:true});
const report={timestamp:new Date().toISOString(),total:checks.length,blocked,checks};
await writeFile("ahq-launch-audit/results.json",JSON.stringify(report,null,2));
console.log("AHQ_LAUNCH_SUMMARY",JSON.stringify({total:checks.length,blocked}));
if(blocked)process.exitCode=1;
