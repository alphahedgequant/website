// Browser-only first-party analytics identity. No email, query, financial
// symbol, search text or Clerk session ID is sent to the collector.
const VISITOR_KEY="ahq_insights_visitor_v1";
const SESSION_KEY="ahq_insights_session_v1";
const ATTRIBUTION_KEY="ahq_insights_attribution_v1";
const OPTOUT_KEY="ahq_analytics_optout";
const permittedSources=new Set(["direct","google","bing","duckduckgo","x","linkedin","reddit","valuepickr","other"]);
const clean=x=>typeof x==="string"&&/^[a-z0-9][a-z0-9_.-]{0,49}$/i.test(x)?x.toLowerCase():null;
export function analyticsAllowed(){
  if(typeof window==="undefined"||!window.crypto?.randomUUID)return false;
  try{
    return window.localStorage.getItem(OPTOUT_KEY)!=="1" &&
      navigator.doNotTrack!=="1" && window.doNotTrack!=="1" &&
      navigator.globalPrivacyControl!==true;
  }catch{return false;}
}
function referrerCategory(referrer){
  try{
    if(!referrer)return "direct";
    const host=new URL(referrer).hostname.toLowerCase();
    if(host==="alphahedgequant.com"||host==="www.alphahedgequant.com"||host===location.hostname)return "direct";
    if(host==="google.com"||host.endsWith(".google.com")||host.endsWith(".google.co.in"))return "google";
    if(host==="bing.com"||host.endsWith(".bing.com"))return "bing";
    if(host==="duckduckgo.com"||host.endsWith(".duckduckgo.com"))return "duckduckgo";
    if(["x.com","twitter.com","t.co"].includes(host))return "x";
    if(host==="linkedin.com"||host.endsWith(".linkedin.com")||host==="lnkd.in")return "linkedin";
    if(host==="reddit.com"||host.endsWith(".reddit.com"))return "reddit";
    if(host==="forum.valuepickr.com"||host==="valuepickr.com")return "valuepickr";
    return "other";
  }catch{return "direct";}
}
export function getInsightsContext(){
  if(!analyticsAllowed())return null;
  try{
    let visitor=localStorage.getItem(VISITOR_KEY);
    if(!visitor){visitor=crypto.randomUUID();localStorage.setItem(VISITOR_KEY,visitor);}
    let session=sessionStorage.getItem(SESSION_KEY);
    if(!session){session=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,session);}
    let attr;
    const saved=sessionStorage.getItem(ATTRIBUTION_KEY);
    if(saved){try{attr=JSON.parse(saved)}catch{attr=null}}
    if(!attr){
      const params=new URLSearchParams(window.location.search);
      const utmSource=clean(params.get("utm_source"));
      const utmMedium=clean(params.get("utm_medium"));
      const utmCampaign=clean(params.get("utm_campaign"));
      attr={source:permittedSources.has(utmSource)?utmSource:referrerCategory(document.referrer),
        utmSource,utmMedium,utmCampaign};
      sessionStorage.setItem(ATTRIBUTION_KEY,JSON.stringify(attr));
    }
    return {visitor,session,...attr};
  }catch{return null}
}
export function sendInsightsEvent(name,path,activeSeconds=0){
  const ctx=getInsightsContext();
  if(!ctx || typeof path!=="string" || path.startsWith("/admin"))return;
  const body=JSON.stringify({event:name,path,activeSeconds,...ctx});
  try{
    fetch("/api/insights/event",{
      method:"POST",headers:{"Content-Type":"text/plain"},
      credentials:"omit",mode:"same-origin",cache:"no-store",
      keepalive:true,body
    }).catch(()=>{});
  }catch{}
}
export async function optOutAndDeleteInsights(){
  if(typeof window==="undefined")return false;
  let visitor=null;
  try{visitor=localStorage.getItem(VISITOR_KEY);localStorage.setItem(OPTOUT_KEY,"1");}catch{return false}
  let deleted=true;
  if(visitor){
    try{
      const r=await fetch("/api/insights/event",{method:"DELETE",headers:{"Content-Type":"text/plain"},
        credentials:"omit",cache:"no-store",body:JSON.stringify({visitor})});
      deleted=r.ok;
    }catch{deleted=false}
  }
  try{
    // Retain the random visitor ID if deletion failed so the browser can
    // retry erasure later, while OPTOUT_KEY prevents any further collection.
    if(deleted)localStorage.removeItem(VISITOR_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ATTRIBUTION_KEY);
  }catch{}
  return deleted;
}
export function allowInsightsAgain(){
  if(typeof window==="undefined")return;
  try{localStorage.removeItem(OPTOUT_KEY); }catch{}
}
export function isInsightsOptedOut(){
  if(typeof window==="undefined")return false;
  try{return localStorage.getItem(OPTOUT_KEY)==="1"}catch{return true}
}
