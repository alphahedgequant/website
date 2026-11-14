"use client";

import {useCallback, useEffect, useRef, useState} from "react";

/**
 * Keeps the self-contained tournament board running inside the AHQ App Router
 * shell, with the site's actual navbar, footer, analytics and theme controls.
 * Same-origin iframe isolation preserves its self-contained CSS/vanilla JS.
 */
export default function CompetitionBoardFrame(){
  const frameRef=useRef(null);
  const cleanupRef=useRef(null);
  const [frameHeight,setFrameHeight]=useState(1650);

  const onLoad=useCallback(()=>{
    cleanupRef.current?.();
    cleanupRef.current=null;
    const frame=frameRef.current;
    const doc=frame?.contentDocument;
    const win=frame?.contentWindow;
    if(!frame||!doc||!win)return;

    // Remove duplicate AHQ navigation; the outer layout provides it.
    const style=doc.createElement("style");
    style.id="ahq-embedded-competition-style";
    style.textContent=`
      .brandbar{display:none!important}
      html,body{overflow:hidden!important}
      body{margin:0!important;min-width:0!important}
      main.wrap{padding-top:0!important;padding-bottom:30px!important}
      a:focus-visible,button:focus-visible{outline-offset:3px}
    `;
    doc.head.appendChild(style);

    const syncTheme=()=>{
      doc.documentElement.dataset.theme=
        document.documentElement.dataset.theme==="light"?"light":"dark";
      calculate();
    };
    const calculate=()=>{
      const board=doc.querySelector("main.wrap");
      if(!board)return;
      const height=Math.ceil(Math.max(670,board.scrollHeight+board.offsetTop+18));
      setFrameHeight(current=>Math.abs(current-height)>2?height:current);
    };

    // Native Next pages should navigate in the parent, not inside the frame.
    const navigate=(event)=>{
      const anchor=event.target?.closest?.("a[href]");
      if(!anchor||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const href=anchor.getAttribute("href")||"";
      if(!href.startsWith("/")||href.startsWith("//"))return;
      const url=new URL(href,window.location.origin);
      if(url.pathname==="/tournaments.html"||url.pathname==="/competitions"&&url.hash)return;
      event.preventDefault();
      window.location.assign(url.href);
    };

    const sizeObserver=new ResizeObserver(calculate);
    const main=doc.querySelector("main.wrap");
    if(main)sizeObserver.observe(main);
    const themeObserver=new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    doc.addEventListener("click",navigate);
    win.addEventListener("resize",calculate);
    window.addEventListener("resize",calculate);
    syncTheme();
    calculate();
    const second=window.setTimeout(calculate,1600);
    cleanupRef.current=()=>{
      window.clearTimeout(second);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      doc.removeEventListener("click",navigate);
      win.removeEventListener("resize",calculate);
      window.removeEventListener("resize",calculate);
      style.remove();
    };
  },[]);

  useEffect(()=>()=>cleanupRef.current?.(),[]);

  return (
    <section className="ahq-tournament-integrated" aria-label="Global chess, hackathon and quant tournament board">
      <div className="ahq-tournament-integrated-inner">
        <div className="ahq-tournament-integration-bar">
          <span>ALPHAHEDGEQUANT / GLOBAL COMPETITIONS · FREE TO EXPLORE · NO SIGN-IN</span>
          <a href="/tournaments.html" target="_blank" rel="noopener noreferrer">
            Open standalone board ↗
          </a>
        </div>
        <iframe
          ref={frameRef}
          onLoad={onLoad}
          src="/tournaments.html?embedded=1"
          title="Live global tournament board, chess, hackathons and quant championships"
          style={{display:"block",width:"100%",height:frameHeight,border:0,overflow:"hidden",background:"transparent"}}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
