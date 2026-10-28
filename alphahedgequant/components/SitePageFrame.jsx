"use client";
import {usePathname} from "next/navigation";
import {useEffect,useRef} from "react";
export default function SitePageFrame({children}){
 const path=usePathname();
 const ref=useRef(null);
 useEffect(()=>{
  const page=ref.current;
  if(!page)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced)return;
  const targets=[...page.querySelectorAll("h1,h2,section > p:first-child,.card,.glass")].filter(el=>!el.closest(".premium-page"));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("ahq-in-view");observer.unobserve(entry.target)}}),{threshold:.06,rootMargin:"0px 0px -20px 0px"});
  targets.forEach(el=>{el.classList.add("ahq-scroll-entry");observer.observe(el)});
  return()=>observer.disconnect();
 },[path]);
 const editorial=path==="/"||path==="/about";
 return <div ref={ref} key={path} data-ahq-page={editorial?"editorial":"product"} className={editorial?"ahq-page-editorial":"ahq-page-product"}>{children}</div>;
}
