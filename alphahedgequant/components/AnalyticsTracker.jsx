"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";

const key=process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host=process.env.NEXT_PUBLIC_POSTHOG_HOST||"https://us.i.posthog.com";
const safeHost=(()=>{try{const u=new URL(host);return u.protocol==="https:"&&/^(us|eu)\.i\.posthog\.com$/.test(u.hostname)?u.origin:null}catch{return null}})();
const allowed=(name)=>["$pageview","$pageleave","ahq_page_engagement","option_chain_opened","strategy_builder_opened","screener_viewed","model_lesson_opened","backtest_viewed"].includes(name);
const eventProps=(props)=>Object.fromEntries(Object.entries(props||{}).filter(([k,v])=>["path","active_seconds","page_type"].includes(k)&&["string","number"].includes(typeof v)));
function identity(){try{let id=localStorage.getItem("ahq_anonymous_analytics_id");if(!id){id=crypto.randomUUID();localStorage.setItem("ahq_anonymous_analytics_id",id)}return id}catch{return null}}
function emit(name,props={}){if(!key||!safeHost||!allowed(name)||navigator.doNotTrack==="1"||window.doNotTrack==="1"||navigator.globalPrivacyControl===true)return;const id=identity();if(!id)return;const payload={api_key:key,event:name,distinct_id:id,timestamp:new Date().toISOString(),properties:{$lib:"alphahedgequant-web",...eventProps(props)}};try{fetch(safeHost+"/i/v0/e/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true,mode:"cors"}).catch(()=>{})}catch{}}
export default function AnalyticsTracker(){const pathname=usePathname();useEffect(()=>{if(!key||!safeHost||!pathname||pathname.startsWith("/admin"))return;
 const path=pathname.slice(0,150),start=Date.now();let active=0,last=Date.now(),timer;
 const accrue=()=>{const now=Date.now();if(document.visibilityState==="visible"&&document.hasFocus())active+=Math.max(0,Math.min(10,(now-last)/1000));last=now};
 emit("$pageview",{path});if(pathname==="/screener")emit("screener_viewed",{path});if(pathname==="/backtest")emit("backtest_viewed",{path});if(pathname.startsWith("/models/"))emit("model_lesson_opened",{path});
 const tick=()=>accrue();timer=setInterval(tick,5000);
 const vis=()=>{accrue();last=Date.now()};document.addEventListener("visibilitychange",vis);window.addEventListener("focus",vis);window.addEventListener("blur",vis);
 const event=e=>{const name=e.detail?.name;if(allowed(name))emit(name,{path})};window.addEventListener("ahq:analytics",event);
 return()=>{accrue();clearInterval(timer);document.removeEventListener("visibilitychange",vis);window.removeEventListener("focus",vis);window.removeEventListener("blur",vis);window.removeEventListener("ahq:analytics",event);emit("ahq_page_engagement",{path,active_seconds:Math.round(active)});emit("$pageleave",{path})};
 },[pathname]);return null}
