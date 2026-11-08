"use client";
import {useEffect,useState} from "react";
import {GA4_ID,validGa4Id,hasGa4Consent,setGa4Consent} from "@/lib/ga4Client.mjs";

export default function Ga4PrivacyControl(){
  const [enabled,setEnabled]=useState(false),[note,setNote]=useState("");
  const available=validGa4Id(GA4_ID);
  useEffect(()=>{setEnabled(hasGa4Consent());},[]);
  if(!available)return <p className="text-sm text-muted mt-3">Google Analytics 4 is not yet connected to a measurement property. No Google Analytics tag is loaded by this website's optional integration.</p>;
  function update(allow){
    const ok=setGa4Consent(allow);
    setEnabled(ok);
    setNote(allow?(ok?"Google Analytics enabled in this browser.":"Google Analytics remains off because browser privacy preferences block tracking."):
      "Google Analytics disabled for future visits from this browser. This does not erase previously collected Google Analytics records.");
  }
  return <div className="border border-line rounded-lg bg-surface p-4 mt-3">
    <p className="text-sm text-body font-medium">Optional Google Analytics 4</p>
    <p className="text-sm text-muted mt-2">Off by default. With your permission, this service measures coarse page groups and feature usage, never private searches, portfolios, credentials or URL query strings. No advertising-personalization consent is requested.</p>
    <div className="flex gap-3 flex-wrap mt-4">
      <button type="button" onClick={()=>update(true)} disabled={enabled} className="px-4 py-2 rounded border border-line text-body text-xs font-semibold disabled:opacity-50">Allow optional Google Analytics</button>
      <button type="button" onClick={()=>update(false)} disabled={!enabled} className="px-4 py-2 rounded bg-body text-ink text-xs font-semibold disabled:opacity-50">Disable Google Analytics</button>
    </div>
    <p role="status" className="text-sm text-muted mt-3">{note||(enabled?"Optional GA4: enabled":"Optional GA4: off")}</p>
  </div>;
}
