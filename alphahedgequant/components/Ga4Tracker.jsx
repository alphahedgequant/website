"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {recordGa4Feature,recordGa4Page} from "@/lib/ga4Client.mjs";

// This component has no visual UI. When no GA4 ID or explicit opt-in is
// present, the Google tag is never requested and no events are sent.
export default function Ga4Tracker(){
  const path=usePathname();
  useEffect(()=>{
    recordGa4Page(path);
    const feature=e=>recordGa4Feature(e?.detail?.name,path);
    const consent=()=>recordGa4Page(path);
    window.addEventListener("ahq:analytics",feature);
    window.addEventListener("ahq:ga4-consent-change",consent);
    return()=>{
      window.removeEventListener("ahq:analytics",feature);
      window.removeEventListener("ahq:ga4-consent-change",consent);
    };
  },[path]);
  return null;
}
