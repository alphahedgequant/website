// Read-only live monitoring for the public IPO page; never captures visitor data.
const base="https://www.alphahedgequant.com";
const results=[];
async function get(path){
  const response=await fetch(base+path,{redirect:"manual",headers:{Accept:"text/html,application/json,application/xml;q=0.8"},signal:AbortSignal.timeout(16000)});
  const text=await response.text();
  return {response,text};
}
async function check(label,fn){
 try{const x=await fn();const record={label,passed:x.passed,status:x.status,note:x.note||null};results.push(record);console.log("AHQ_IPO_LIVE_CHECK",JSON.stringify(record))}
 catch(e){const record={label,passed:false,error:e.name==="TimeoutError"?"timeout":"request failed"};results.push(record);console.log("AHQ_IPO_LIVE_CHECK",JSON.stringify(record))}
}
await check("IPO public page SEO",async()=>{
 const {response,text}=await get("/ipo");
 const passed=response.status===200&&/Indian IPO Intelligence/.test(text)&&/name="description"/.test(text)&&/alphahedgequant.com\/ipo/.test(text)&&!/name="robots" content="noindex"/.test(text)&&/isAccessibleForFree/.test(text);
 return {status:response.status,passed,note:passed?"Public, descriptive HTML and canonical URL":"Missing SEO content or login redirect"};
});
await check("IPO read-only API",async()=>{
 const {response,text}=await get("/api/ipo");
 let j={};try{j=JSON.parse(text)}catch{}
 const passed=response.status===200&&j.ok===true&&j.buckets&&typeof j.count==="number"&&typeof j.disclaimer==="string";
 return {status:response.status,passed,note:passed?"Returns structured IPO calendar with source disclaimer":"Feed unavailable or invalid"};
});
await check("sitemap contains IPO",async()=>{
 const {response,text}=await get("/sitemap.xml");
 const passed=response.status===200&&text.includes("https://www.alphahedgequant.com/ipo");
 return {status:response.status,passed};
});
await check("private analytics still protected",async()=>{
 const {response}=await get("/api/admin/analytics");
 return {status:response.status,passed:[301,302,303,307,308,401,403,404].includes(response.status)};
});
const passed=results.filter(x=>x.passed).length;
console.log("AHQ_IPO_LIVE_SUMMARY",JSON.stringify({passed,total:results.length,checkedAt:new Date().toISOString()}));
if(passed!==results.length)process.exitCode=1;
