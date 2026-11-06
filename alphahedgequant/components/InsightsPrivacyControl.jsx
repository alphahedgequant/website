"use client";
import {useEffect,useState} from "react";
import {allowInsightsAgain,isInsightsOptedOut,optOutAndDeleteInsights} from "@/lib/insightsClient.mjs";

export default function InsightsPrivacyControl(){
 const [opted,setOpted]=useState(null);
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>setOpted(isInsightsOptedOut()),[]);
 async function disable(){
  setBusy(true);
  const ok=await optOutAndDeleteInsights();
  setOpted(true);setBusy(false);
  setStatus(ok?"First-party analytics disabled in this browser. Associated identifiable browser-history events have been deleted.":"Future analytics are disabled in this browser. Previous-record deletion could not be confirmed; contact us to follow up.");
 }
 function enable(){
  allowInsightsAgain();setOpted(false);
  setStatus("Analytics enabled for this browser, unless your Do Not Track or Global Privacy Control preference blocks it.");
 }
 return <div className="border border-line rounded-lg bg-surface p-4 mt-3">
  <p className="text-sm text-body font-medium">First-party analytics preference</p>
  <p className="text-sm text-muted mt-2">You may turn off anonymous website analytics and request removal of the random browser identifier's associated events. Site login and learning progress remain available.</p>
  <div className="flex gap-3 flex-wrap mt-4">
   <button type="button" disabled={busy} onClick={disable}
     className="px-4 py-2 rounded bg-body text-ink text-xs font-semibold disabled:opacity-50">{opted?"Retry removal of past events":"Turn off analytics and erase browser events"}</button>
   <button type="button" disabled={busy||opted!==true} onClick={enable}
     className="px-4 py-2 rounded border border-line text-body text-xs font-semibold disabled:opacity-50">Allow analytics again</button>
  </div>
  {status&&<p role="status" className="text-sm text-muted mt-3">{status}</p>}
  <p className="text-xs text-muted mt-3">Current setting: {opted===null?"Checking…":opted?"Analytics switched off":"Standard browser privacy preferences apply"}</p>
 </div>;
}
