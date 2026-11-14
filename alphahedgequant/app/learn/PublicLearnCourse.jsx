"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {useAuth} from "@clerk/nextjs";
import ContinuousQuantCourse from "@/components/ContinuousQuantCourse";
import "./pencil-reader.css";

const LOCAL_KEY="ahq-public-learn-progress-v1";
export default function PublicLearnCourse(){
 const {isLoaded,isSignedIn}=useAuth();
 const [progress,setProgress]=useState({});
 const [sync,setSync]=useState("Loading your learning progress...");
 useEffect(()=>{
  if(!isLoaded)return;
  if(!isSignedIn){
   try{setProgress(JSON.parse(localStorage.getItem(LOCAL_KEY)||"{}"));}catch{setProgress({});}
   setSync("Free access · progress saved in this browser. Sign in to save across devices.");
   return;
  }
  let canceled=false;
  (async()=>{try{
   const r=await fetch("/api/learn/progress",{cache:"no-store"});
   if(!r.ok)throw Error("Unavailable");
   const j=await r.json();if(!j.ok)throw Error("Unavailable");
   if(!canceled){setProgress(Object.fromEntries(j.progress.map(x=>[x.item_id,x])));setSync("Progress synced with your account");}
  }catch{if(!canceled)setSync("Account progress temporarily unavailable");}})();
  return()=>{canceled=true;};
 },[isLoaded,isSignedIn]);
 const save=useCallback(async(id,score,completed)=>{
  if(!isSignedIn){
   try{
    const local=JSON.parse(localStorage.getItem(LOCAL_KEY)||"{}");
    const updated={...local,[id]:{item_id:id,score,completed,updated_at:new Date().toISOString()}};
    localStorage.setItem(LOCAL_KEY,JSON.stringify(updated));
    setProgress(updated);
    setSync("Progress saved in this browser · sign in to sync across devices");
    return true;
   }catch{setSync("Local progress could not be saved; your lessons remain accessible");return false;}
  }
  try{
   const r=await fetch("/api/learn/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,score,completed})});
   const j=await r.json();if(!j.ok)throw Error("Unavailable");
   setProgress(p=>({...p,[id]:j.record}));setSync("Progress saved to your account");return true;
  }catch{setSync("Could not save account progress; please retry");return false;}
 },[isSignedIn]);
 return <div className="mx-auto max-w-[1280px] px-5 md:px-10 py-14 text-body">
  <p className="eyebrow mb-3">[ AHQ : ACADEMY / PUBLIC LEARNING ]</p>
  <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">The Quant Learning Lab<span className="text-amber">.</span></h1>
  <p className="mt-4 max-w-3xl text-muted leading-relaxed">Study quantitative finance from first principles. All seventeen modules, examples, mathematics and Python practice are free to read — no account required.</p>
  <nav aria-label="Academy areas" className="flex flex-wrap gap-2 mt-6 border-b border-line pb-3">
   <span aria-current="page" className="px-4 py-2.5 rounded-lg border text-sm font-medium bg-white text-black border-white">Learn Quant · Free</span>
   <Link href="/learn/interviews" className="px-4 py-2.5 rounded-lg border text-sm font-medium bg-transparent text-body border-line hover:border-white/60">Quant Interviews <span className="text-muted">· Sign in</span></Link>
   <Link href="/learn/mental-maths" className="px-4 py-2.5 rounded-lg border text-sm font-medium bg-transparent text-body border-line hover:border-white/60">Mental Maths <span className="text-muted">· Sign in</span></Link>
  </nav>
  <ContinuousQuantCourse progress={progress} save={save} sync={sync}/>
 </div>;
}
