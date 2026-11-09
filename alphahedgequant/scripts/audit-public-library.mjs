// Read-only public search indexability smoke test. No authentication,
// user records, trades, cookies or analytics tracking events are created.
import {RESEARCH_LIBRARY} from "../lib/publicResearchLibrary.mjs";
const root="https://www.alphahedgequant.com";
const checks=[];
async function check(label,path,assertion){
 let result={label,passed:false,status:null};
 try{
  const response=await fetch(root+path,{method:"GET",redirect:"manual",headers:{"User-Agent":"Googlebot/2.1 (+http://www.google.com/bot.html)","Accept":"text/html,application/xml;q=.9,*/*;q=.8"},signal:AbortSignal.timeout(19000)});
  const html=await response.text();result.status=response.status;
  result.passed=assertion({status:response.status,html,headers:response.headers});
 }catch(e){result.error=e?.name==="TimeoutError"?"timeout":"HTTPS request failed"}
 checks.push(result);
 console.log("AHQ_LIBRARY_LIVE",JSON.stringify(result));
}
const noindex=x=>!/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(x.html)&&!(x.headers.get("x-robots-tag")||"").toLowerCase().includes("noindex");
const canonical=(x,path)=>x.html.includes('rel="canonical" href="'+root+path+'"');
await check("library landing publicly readable","/library",x=>x.status===200&&noindex(x)&&canonical(x,"/library")&&x.html.includes("IPO Intelligence")&&x.html.includes("Quantitative Finance")&&x.html.includes('application/ld+json'));
for(const a of RESEARCH_LIBRARY){
 const url="/library/"+a.slug;
 await check("article "+a.slug,url,x=>x.status===200&&noindex(x)&&canonical(x,url)&&x.html.includes("Go to the source.")&&x.html.includes("THE ESSENTIALS")&&x.html.includes("AI assistance")&&x.html.includes('application/ld+json'));
}
await check("sitemap includes all 11 articles","/sitemap.xml",x=>x.status===200&&RESEARCH_LIBRARY.every(a=>x.html.includes(root+"/library/"+a.slug)));
await check("unknown article returns 404","/library/not-a-real-article",x=>x.status===404);
await check("private analytics remains authenticated","/api/admin/analytics",x=>[301,302,303,307,308,401,403,404].includes(x.status));
const passed=checks.filter(x=>x.passed).length;
console.log("AHQ_LIBRARY_LIVE_SUMMARY",JSON.stringify({total:checks.length,passed,failed:checks.length-passed,checkedAt:new Date().toISOString(),googleIndexed:"NOT_VERIFIED"}));
if(passed!==checks.length)process.exitCode=1;
