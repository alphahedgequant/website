// Public, unauthenticated browser audit. This intentionally never submits
// forms or signs in. No credentials, cookies, or captured user data are stored.
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
const root=process.env.AHQ_AUDIT_URL||"https://www.alphahedgequant.com";
const out="ahq-audit";
const pages=["/","/about","/privacy","/terms","/disclaimer","/sign-in","/sign-up"];
const protectedPages=["/terminal","/learn","/screener","/ipo","/research"];
const results=[];
let critical=0;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
function safeUrl(url){try{const u=new URL(url);return u.origin+u.pathname}catch{return "unknown"}}
async function auditPage(context,device,path){
 const page=await context.newPage();
 const exceptions=[],failures=[];
 page.on("pageerror",e=>exceptions.push(String(e.message||e).slice(0,250)));
 page.on("response",r=>{try{if(new URL(r.url()).hostname==="www.alphahedgequant.com"&&r.status()>=500) failures.push({status:r.status(),path:new URL(r.url()).pathname})}catch{}});
 let status=null,error=null,scrollReveal=null;
 try{
  const response=await page.goto(root+path,{waitUntil:"domcontentloaded",timeout:30000});
  status=response?.status()??null;
  await page.waitForTimeout(1600);
  // Trigger the same IntersectionObserver animations a visitor sees while
  // scrolling. Full-page screenshots taken only at the top hide later sections.
  if(path==="/"||path==="/about"){
   const height=await page.evaluate(()=>document.documentElement.scrollHeight);
   const steps=Math.min(70,Math.ceil(Math.max(0,height-(await page.evaluate(()=>innerHeight)))/650)+2);
   for(let n=0;n<=steps;n++){
    await page.evaluate(n=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,n*650)},n);
    await page.waitForTimeout(90);
   }
   await page.waitForTimeout(250);
   scrollReveal={total:await page.locator(".premium-page .pr-reveal").count(),activated:await page.locator(".premium-page .pr-reveal.on").count()};
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(200);
  }
 }catch(e){error=String(e.message||e).slice(0,220)}
 let info={title:"",heading:"",overflow:0,logo:false,footer:false,links:0,external:false,buttons:0};
 try{
  info=await page.evaluate(()=>{
   const ext=Math.max(document.documentElement?.scrollWidth||0,document.body?.scrollWidth||0);
   return {
    title:document.title,
    heading:(document.querySelector("h1")?.textContent||"").trim().slice(0,160),
    overflow:Math.max(0,ext-innerWidth),
    logo:!!document.querySelector('a[aria-label="AlphaHedgeQuant home"]'),
    footer:!!document.querySelector("footer"),
    links:document.querySelectorAll("a[href]").length,
    external:location.hostname!=="www.alphahedgequant.com"&&location.hostname!=="alphahedgequant.com",
    buttons:document.querySelectorAll("button").length
   }
  })
 }catch(e){error=error||String(e.message||e).slice(0,150)}
 const file=path==="/"?"home":path.substring(1).replaceAll("/","-");
 try{await page.screenshot({path:`${out}/${device}-${file}.png`,fullPage:path==="/"||path==="/about",animations:"disabled",timeout:18000})}catch(e){error=error||"Screenshot: "+String(e.message||e).slice(0,150)}
 const row={device,path,status,url:safeUrl(page.url()),...info,scrollReveal,error,exceptions,failures};
 if(!status||status>=500){row.critical="page failed to load";critical++}
 if(info.overflow>8){row.layoutWarning="horizontal page overflow"}
 if(info.external){row.accessNote="redirected to external auth provider"}
 if(exceptions.length)row.javascriptWarning="uncaught page exceptions";
 if(failures.length)row.httpWarning="website HTTP 5xx response";
 results.push(row);
 console.log("AHQ_PUBLIC_AUDIT",JSON.stringify(row));
 await page.close();
}
for(const [device,width,height] of [["desktop",1440,900],["mobile",390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:"en-IN",timezoneId:"Asia/Kolkata",colorScheme:"dark"});
 for(const path of pages)await auditPage(context,device,path);
 // Test actual mobile menu interaction, not just its HTML existence.
 if(device==="mobile"){
  const page=await context.newPage();
  try{
   await page.goto(root,{waitUntil:"domcontentloaded",timeout:30000});
   const menu=page.getByRole("button",{name:"Open menu"});
   const available=await menu.isVisible({timeout:8000}).catch(()=>false);
   if(available)await menu.click({timeout:5000});
   const expanded=available&&await page.locator("#ahq-mobile-navigation").isVisible().catch(()=>false);
   const row={device,interaction:"mobile-menu",available,expanded,url:safeUrl(page.url())};
   results.push(row);console.log("AHQ_INTERACTION",JSON.stringify(row));
   if(!expanded)critical++;
   await page.screenshot({path:out+"/mobile-menu-open.png",animations:"disabled",timeout:15000}).catch(()=>{});
  }catch(e){results.push({device,interaction:"mobile-menu",error:String(e.message||e).slice(0,180)});critical++}
  finally{await page.close()}
 }
 // Test route gating without logging in. Only record safe metadata.
 if(device==="desktop")for(const path of protectedPages){
  const page=await context.newPage();
  let status=null,error=null;
  try{const r=await page.goto(root+path,{waitUntil:"domcontentloaded",timeout:25000});status=r?.status()||null;await page.waitForTimeout(700)}
  catch(e){error=String(e.message||e).slice(0,180)}
  const row={device,protectedRoute:path,status,finalUrl:safeUrl(page.url()),error};
  results.push(row);console.log("AHQ_ROUTE_GATE",JSON.stringify(row));
  await page.close();
 }
 await context.close();
}
await browser.close();
const summary={ranAt:new Date().toISOString(),base:root,critical,publicPages:pages.length*2,protectedRoutesChecked:protectedPages.length,results};
await writeFile(out+"/results.json",JSON.stringify(summary,null,2));
console.log("AHQ_AUDIT_SUMMARY",JSON.stringify({critical,publicPages:summary.publicPages,protectedRoutesChecked:summary.protectedRoutesChecked,layoutWarnings:results.filter(x=>x.layoutWarning).length,javascriptWarnings:results.filter(x=>x.javascriptWarning).length}));
if(critical)process.exitCode=1;
