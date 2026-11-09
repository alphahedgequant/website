"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {analyticsAllowed,sendInsightsEvent} from "@/lib/insightsClient.mjs";

const exposedFeatures=new Set([
  "option_chain_opened","options_page_viewed","strategy_builder_opened","screener_viewed",
  "model_lesson_opened","backtest_viewed","quant_terminal_opened",
  "ipo_page_opened","article_opened","waitlist_opened",
  "ipo_tab_selected","academy_area_selected","mental_math_round_started",
  "mental_math_answer_submitted","interview_mock_started","interview_answer_checked",
  "interview_mock_answer_submitted","interview_bookmark_toggled","interview_answer_revealed",
  "screener_market_switched","screener_filters_opened","screener_filter_changed",
  "screener_view_selected","screener_exported","screener_stock_opened",
  "terminal_tab_selected","terminal_stock_selected","option_chain_refreshed",
  "option_chain_selected","strategy_leg_added","backtest_run_submitted",
  "research_search_submitted","research_filter_selected","trust_tracker_viewed"
]);
const ignore=path=>!path||/^\/(admin|api|sign-in|sign-up|account|settings)(\/|$)/.test(path)
  ||/^\/terminal\/import(\/|$)/.test(path);

export default function AnalyticsTracker(){
  const pathname=usePathname();
  useEffect(()=>{
    if(ignore(pathname)||!analyticsAllowed())return;
    let lastTick=Date.now();
    let lastInteraction=Date.now();
    let pending=0;
    const path=pathname;
    const send=(name,seconds=0)=>sendInsightsEvent(name,path,seconds);
    send("pageview");
    if(path==="/screener")send("screener_viewed");
    if(path==="/backtest")send("backtest_viewed");
    if(path==="/options")send("options_page_viewed");
    if(path==="/ipo")send("ipo_page_opened");
    if(path==="/terminal")send("quant_terminal_opened");
    if(path==="/tracker")send("trust_tracker_viewed");
    if(path.startsWith("/models/")||path.startsWith("/learn/"))send("model_lesson_opened");
    if(path.startsWith("/reports/")||path.startsWith("/research/")||path.startsWith("/library/"))send("article_opened");

    const flush=()=>{
      const secs=Math.floor(pending);
      if(secs>0){
        pending-=secs;
        // Batch active seconds to reduce serverless database writes.
        for(let remaining=secs;remaining>0;remaining-=60)send("engagement",Math.min(60,remaining));
      }
    };
    const tick=()=>{
      const now=Date.now();
      const delta=Math.max(0,Math.min(15,(now-lastTick)/1000));
      lastTick=now;
      // Time spent on a background tab is excluded. Prolonged inactivity is
      // not counted as reading after 90 seconds without interaction.
      if(document.visibilityState==="visible"&&document.hasFocus()&&now-lastInteraction<180000)
        pending+=delta;
      if(pending>=45)flush();
    };
    const activity=()=>{lastInteraction=Date.now()};
    const change=()=>{tick();if(document.visibilityState==="hidden")flush()};
    const pagehide=()=>{tick();flush()};
    const custom=event=>{
      const name=event?.detail?.name;
      if(exposedFeatures.has(name))send(name);
    };
    // Listen only to deliberately marked, discrete controls. Never inspect
    // input values or form payloads: only the fixed action name is emitted.
    const action=event=>{
      const el=event.target?.closest?.("[data-ahq-event]");
      if(!el || el.disabled || el.getAttribute("aria-disabled")==="true")return;
      const tag=el.tagName;
      if(event.type==="click" && tag!=="BUTTON" && tag!=="A")return;
      if(event.type==="change" && tag!=="SELECT")return;
      if(event.type==="submit" && tag!=="FORM")return;
      const name=el.getAttribute("data-ahq-event");
      if(exposedFeatures.has(name))send(name);
    };
    document.addEventListener("click",action);
    document.addEventListener("change",action);
    document.addEventListener("submit",action);
    const timer=setInterval(tick,15000);
    document.addEventListener("visibilitychange",change);
    window.addEventListener("focus",activity);
    window.addEventListener("blur",change);
    window.addEventListener("scroll",activity,{passive:true});
    window.addEventListener("pointerdown",activity,{passive:true});
    window.addEventListener("keydown",activity);
    window.addEventListener("pagehide",pagehide);
    window.addEventListener("ahq:analytics",custom);
    return()=>{
      tick();flush();clearInterval(timer);
      document.removeEventListener("visibilitychange",change);
      window.removeEventListener("focus",activity);
      window.removeEventListener("blur",change);
      window.removeEventListener("scroll",activity);
      window.removeEventListener("pointerdown",activity);
      window.removeEventListener("keydown",activity);
      window.removeEventListener("pagehide",pagehide);
      document.removeEventListener("click",action);
      document.removeEventListener("change",action);
      document.removeEventListener("submit",action);
      window.removeEventListener("ahq:analytics",custom);
    };
  },[pathname]);
  return null;
}
