// Live, read-only Googlebot-style smoke checks for publicly indexable pages.
// Simulates the crawler user agent but does NOT assert Google's actual index status.
const root="https://www.alphahedgequant.com";
const crawler="Googlebot/2.1 (+http://www.google.com/bot.html)";
const checks=[];
async function get(path,userAgent=crawler){
 const r=await fetch(root+path,{redirect:"manual",headers:{"User-Agent":userAgent,"Accept":"text/html,application/xml,text/plain"},signal:AbortSignal.timeout(18000)});
 return {status:r.status,headers:r.headers,body:await r.text()};
}
function result(name,pass,details){
 const row={name,pass:!!pass,...details};
 checks.push(row);
 console.log("AHQ_SEO_CRAWL_CHECK",JSON.stringify(row));
}
function cleanCanonical(html,expected){
 const links=[...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)].map(m=>m[0]);
 return links.length===1 && links[0].includes('href="'+expected+'"');
}
for(const [path,label] of [["/","homepage"],["/ipo","ipo"]]){
 try{
  const x=await get(path);
  const metaNoindex=/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(x.body);
  const headerNoindex=(x.headers.get("x-robots-tag")||"").toLowerCase().includes("noindex");
  const canonical=root+(path==="/"?"/":path);
  const title=x.body.includes("AlphaHedgeQuant");
  const topic=path==="/ipo"?x.body.includes("Indian IPO Intelligence"):x.body.includes("AlphaHedgeQuant IPO Intelligence");
  result(label+" responds to Googlebot",x.status===200&&!metaNoindex&&!headerNoindex&&cleanCanonical(x.body,canonical)&&title&&topic,{
    status:x.status,canonicalOk:cleanCanonical(x.body,canonical),canonicalTags:[...x.body.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)].map(x=>x[0].slice(0,240)),brandedTitle:title,publicTopicVisible:topic,noindex:metaNoindex||headerNoindex
  });
 }catch(e){result(label+" responds to Googlebot",false,{error:e.name==="TimeoutError"?"timeout":"https unavailable"});}
}
try{
 const a=await get("/robots.txt");
 const pass=a.status===200&&/User-agent:\s*\*/i.test(a.body)&&/Sitemap:\s*https:\/\/www\.alphahedgequant\.com\/sitemap\.xml/i.test(a.body)&&!/^Disallow:\s*\/\s*$/im.test(a.body);
 result("robots.txt allows crawling",pass,{status:a.status});
}catch(e){result("robots.txt allows crawling",false,{error:e.name==="TimeoutError"?"timeout":"https unavailable"});}
try{
 const a=await get("/sitemap.xml");
 const pass=a.status===200&&a.body.includes("<urlset")&&a.body.includes("https://www.alphahedgequant.com/ipo")&&a.body.includes("https://www.alphahedgequant.com/");
 result("sitemap lists homepage and IPO",pass,{status:a.status});
}catch(e){result("sitemap lists homepage and IPO",false,{error:e.name==="TimeoutError"?"timeout":"https unavailable"});}
try{
 const r=await fetch("https://alphahedgequant.com/",{redirect:"manual",signal:AbortSignal.timeout(18000)});
 const pass=[301,302,307,308].includes(r.status)&&(r.headers.get("location")||"").includes("www.alphahedgequant.com");
 result("apex canonical redirect",pass,{status:r.status});
}catch(e){result("apex canonical redirect",false,{error:e.name==="TimeoutError"?"timeout":"https unavailable"});}
const count=checks.filter(x=>x.pass).length;
console.log("AHQ_SEO_CRAWL_SUMMARY",JSON.stringify({passed:count,total:checks.length,checkedAt:new Date().toISOString(),indexStatus:"NOT_VERIFIED_REQUEST_SEARCH_CONSOLE"}));
if(count!==checks.length)process.exitCode=1;
