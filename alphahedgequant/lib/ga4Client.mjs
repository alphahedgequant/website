// Consent-gated, coarse GA4 instrumentation. No tag is loaded unless a
// real GA4 property ID is configured AND this browser explicitly opts in.
import {analyticsAllowed} from "./insightsClient.mjs";

export const GA4_ID=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID||"";
export const GA4_CONSENT_KEY="ahq_ga4_consent_v1";
const ID=/^G-[A-Z0-9]{5,20}$/;
const pages=new Set(["/","/about","/learn","/research","/reports","/ipo","/options",
  "/terminal","/screener","/backtest","/models","/tracker","/copilot"]);
const detailed=new Set(["learn","research","reports","models"]);
const featureEvents=new Set(["option_chain_opened","options_page_viewed",
  "strategy_builder_opened","screener_viewed","model_lesson_opened",
  "backtest_viewed","quant_terminal_opened","ipo_page_opened","article_opened",
  "waitlist_opened"]);

export function validGa4Id(id){return typeof id==="string"&&ID.test(id);}
export function coarseGa4Path(path){
  if(typeof path!=="string"||path.length>180||path.includes("?")||path.includes("#"))return null;
  const p=path.length>1?path.replace(/\/$/,""):path;
  if(pages.has(p))return p;
  const parts=p.split("/").filter(Boolean);
  // Group public long-form readings, never send a searched ticker, private
  // account path, user identifier, query term or strategy parameter to GA4.
  if(parts.length===2&&detailed.has(parts[0])&&/^[a-z0-9-]{1,80}$/i.test(parts[1]))
    return "/"+parts[0]+"/reading";
  return null;
}
export function safeGa4Event(name){return featureEvents.has(name)?name:null;}
export function hasGa4Consent(){
  if(typeof window==="undefined"||!validGa4Id(GA4_ID)||!analyticsAllowed())return false;
  try{return localStorage.getItem(GA4_CONSENT_KEY)==="granted";}catch{return false;}
}
function updateGoogleConsent(granted){
  if(typeof window==="undefined"||!validGa4Id(GA4_ID))return;
  window["ga-disable-"+GA4_ID]=!granted;
  if(typeof window.gtag==="function"){
    window.gtag("consent","update",{
      analytics_storage:granted?"granted":"denied",ad_storage:"denied",
      ad_user_data:"denied",ad_personalization:"denied"
    });
  }
}
export function setGa4Consent(granted){
  if(typeof window==="undefined")return false;
  try{
    const yes=Boolean(granted)&&analyticsAllowed()&&validGa4Id(GA4_ID);
    localStorage.setItem(GA4_CONSENT_KEY,yes?"granted":"denied");
    updateGoogleConsent(yes);
    window.dispatchEvent(new Event("ahq:ga4-consent-change"));
    return yes;
  }catch{return false;}
}
export function ensureGa4(){
  if(!hasGa4Consent())return false;
  if(!window.__ahqGa4Initialized){
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    // Basic consent mode: not even the tag script is loaded before opt-in.
    window.gtag("consent","default",{
      analytics_storage:"denied",ad_storage:"denied",
      ad_user_data:"denied",ad_personalization:"denied"
    });
    updateGoogleConsent(true);
    window.gtag("js",new Date());
    window.gtag("config",GA4_ID,{
      send_page_view:false,allow_google_signals:false,
      allow_ad_personalization_signals:false
    });
    const script=document.createElement("script");
    script.async=true;
    script.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(GA4_ID);
    script.dataset.ahqGa4="true";
    document.head.appendChild(script);
    window.__ahqGa4Initialized=true;
  }else updateGoogleConsent(true);
  return true;
}
export function recordGa4Page(path){
  const safe=coarseGa4Path(path);
  if(!safe||!ensureGa4())return false;
  window.gtag("event","page_view",{
    page_location:window.location.origin+safe,
    page_path:safe,page_title:"AlphaHedgeQuant"
  });
  return true;
}
export function recordGa4Feature(name,path){
  const safe=coarseGa4Path(path),event=safeGa4Event(name);
  if(!safe||!event||!ensureGa4())return false;
  window.gtag("event",event,{
    page_location:window.location.origin+safe,page_path:safe
  });
  return true;
}
