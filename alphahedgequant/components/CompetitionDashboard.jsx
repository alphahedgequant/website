"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {competitionStatus,registrationStatus,COUNTRY_LIST,CATEGORIES} from "@/lib/competitionEvents.mjs";

const monthFmt=new Intl.DateTimeFormat("en",{month:"long",year:"numeric",timeZone:"UTC"});
const dateFmt=new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const parseDay=s=>s?new Date(s+"T12:00:00Z"):null;
const dateLabel=s=>s?dateFmt.format(parseDay(s)):"Date to be confirmed";
const rangeLabel=e=>!e.start?"Date to be confirmed":e.end&&e.end!==e.start?dateLabel(e.start)+" — "+dateLabel(e.end):dateLabel(e.start);
const symbols={Chess:"♞",Hackathons:"⌘",Quant:"∑"};
const noOp=()=>{};
function EventCard({event,today}){
 const status=competitionStatus(event,today);
 return <article className="cq-event">
   <div className="cq-event-top">
     <span className={"cq-type cq-type-"+event.category.toLowerCase()}><span aria-hidden="true">{symbols[event.category]}</span> {event.category}</span>
     <span className={"cq-status cq-status-"+status.toLowerCase().replace(/\s/g,"-")}>{status}</span>
   </div>
   <div className="cq-event-date">{rangeLabel(event)}</div>
   <h3><Link href={"/competitions/"+event.slug}>{event.title}</Link></h3>
   <p className="cq-event-description">{event.description}</p>
   <div className="cq-event-meta"><span>◎ {event.country==="Worldwide"?"Worldwide / remote":event.city+", "+event.country}</span><span>◷ {event.mode}</span></div>
   <div className="cq-event-bottom">
     <span>{event.organiser}</span>
     <Link href={"/competitions/"+event.slug} aria-label={"View details for "+event.title}>View event <span aria-hidden="true">↗</span></Link>
   </div>
 </article>;
}
function Calendar({events,month,onMonth,today}){
 const year=month.getUTCFullYear(),m=month.getUTCMonth();
 const monthStart=new Date(Date.UTC(year,m,1));
 const offset=(monthStart.getUTCDay()+6)%7;
 const days=new Date(Date.UTC(year,m+1,0)).getUTCDate();
 const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>i-offset+1);
 const keyOf=d=>year+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
 const byDate=useMemo(()=>{
   const r={};
   for(const e of events) {
     if(!e.start)continue;
     const start=new Date(e.start+"T12:00:00Z");
     const end=new Date((e.end||e.start)+"T12:00:00Z");
     const boundedEnd=new Date(Math.min(end.getTime(),start.getTime()+70*86400000));
     for(let d=new Date(start);d<=boundedEnd;d.setUTCDate(d.getUTCDate()+1)){
       const k=d.toISOString().slice(0,10);
       if(!r[k])r[k]=[];
       r[k].push(e);
     }
   }
   return r;
 },[events]);
 return <section className="cq-calendar" aria-label="Competition calendar">
   <div className="cq-calendar-toolbar"><h2>{monthFmt.format(monthStart)}</h2><div>
     <button type="button" onClick={()=>onMonth(new Date(Date.UTC(year,m-1,1)))} aria-label="Previous month">←</button>
     <button type="button" onClick={()=>onMonth(new Date(Date.UTC(year,m+1,1)))} aria-label="Next month">→</button>
   </div></div>
   <div className="cq-calendar-grid">
     {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div className="cq-weekday" key={d}>{d}</div>)}
     {cells.map((day,i)=>{
       const active=day>0&&day<=days;
       const date=active?keyOf(day):"";
       const matches=active?(byDate[date]||[]):[];
       return <div className={"cq-day"+(!active?" cq-day-empty":"")+(date===today?" cq-day-today":"")} key={i}>
         {active&&<>
           <span className="cq-day-number">{day}</span>
           <div className="cq-day-events">
             {matches.slice(0,3).map(e=><Link key={e.slug} className={"cq-day-pill cq-pill-"+e.category.toLowerCase()} title={e.title} href={"/competitions/"+e.slug}>{e.title}</Link>)}
             {matches.length>3&&<span className="cq-day-extra">+{matches.length-3} more</span>}
           </div>
         </>}
       </div>;
     })}
   </div>
   <p className="cq-note">Dates are calendar-day schedules, not live game results. Check the organiser for round times and timezone.</p>
 </section>;
}
export default function CompetitionDashboard({initialEvents,verifiedAsOf}){
 const [category,setCategory]=useState("All");
 const [statusFilter,setStatusFilter]=useState("All");
 const [country,setCountry]=useState("All countries");
 const [mode,setMode]=useState("All formats");
 const [query,setQuery]=useState("");
 const [view,setView]=useState("cards");
 const [sort,setSort]=useState("soonest");
 const [month,setMonth]=useState(()=>new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1)));
 const [live,setLive]=useState({status:"loading",events:[]});
 const today=new Date().toISOString().slice(0,10);
 useEffect(()=>{
   let alive=true;
   async function reload(){
     try{
       const response=await fetch("/api/competitions/live-chess",{cache:"no-store"});
       if(!response.ok)throw Error("Unavailable");
       const result=await response.json();
       if(alive)setLive({status:result.status==="ok"?"ok":"unavailable",events:Array.isArray(result.events)?result.events:[]});
     }catch{if(alive)setLive({status:"unavailable",events:[]});}
   }
   reload();
   const timer=setInterval(reload,300000);
   return ()=>{alive=false;clearInterval(timer);};
 },[]);
 const countBy=s=>initialEvents.filter(e=>competitionStatus(e,today)===s).length;
 const upcoming=useMemo(()=>initialEvents.filter(e=>competitionStatus(e,today)==="Upcoming").sort((a,b)=>a.start.localeCompare(b.start)),[initialEvents,today]);
 const filtered=useMemo(()=>{
   const q=query.trim().toLocaleLowerCase();
   const data=initialEvents.filter(e=>
     (category==="All"||e.category===category)&&
     (statusFilter==="All"||competitionStatus(e,today)===statusFilter)&&
     (country==="All countries"||e.country===country)&&
     (mode==="All formats"||e.mode===mode)&&
     (!q||[e.title,e.organiser,e.country,e.city,e.description,...(e.tags||[]),...(e.participants||[])].join(" ").toLocaleLowerCase().includes(q))
   );
   return data.sort((a,b)=>sort==="az"?a.title.localeCompare(b.title):
     sort==="latest"?(b.start||"").localeCompare(a.start||""):
     (a.start||"").localeCompare(b.start||""));
 },[initialEvents,category,statusFilter,country,mode,query,sort,today]);
 const reset=()=>{setCategory("All");setStatusFilter("All");setCountry("All countries");setMode("All formats");setQuery("");};
 return <div className="cq-shell">
   <div className="cq-container">
     <header className="cq-hero">
       <div className="cq-kicker"><span className="cq-pulse"/> ALPHAHEDGEQUANT / GLOBAL COMPETITION INTELLIGENCE <span className="cq-kicker-rule"/></div>
       <div className="cq-hero-columns">
         <div><h1>The world is <em>competing.</em><br/>Know where to be.</h1>
           <p>One curated command centre for chess tournaments, hackathons and quantitative finance championships. Explore country-wise schedules, entry windows and confirmed competitors.</p>
           <div className="cq-hero-actions"><a className="cq-primary" href="#events">Explore competitions <span aria-hidden="true">↘</span></a><a className="cq-secondary" href="#live-chess">Chess broadcasts <span aria-hidden="true">↗</span></a></div>
         </div>
         <div className="cq-hero-terminal" aria-label="Competition category overview">
           <div className="cq-term-title"><span>GLOBAL / EVENT INDEX</span><span className="cq-terminal-dots">● ● ●</span></div>
           <div className="cq-term-body">
             <div><span>01 / Chess</span><strong>♞</strong><small>Federations · Boards · Broadcasts</small></div>
             <div><span>02 / Hackathons</span><strong>⌘</strong><small>Builders · Projects · Deadlines</small></div>
             <div><span>03 / Quant</span><strong>∑</strong><small>Alphas · Market making · Trading</small></div>
           </div>
           <div className="cq-term-footer">WORLDWIDE <span>—</span> COUNTRY-WISE <span>—</span> SOURCE-LINKED</div>
         </div>
       </div>
     </header>
     <div className="cq-stats" aria-label="Catalog summary">
       <div><span>Curated events</span><strong>{initialEvents.length}</strong><small>Published in the AHQ index</small></div>
       <div><span>Upcoming</span><strong>{countBy("Upcoming")}</strong><small>Scheduled for a later date</small></div>
       <div><span>In progress</span><strong>{countBy("In progress")}</strong><small>Active by calendar dates</small></div>
       <div><span>Countries / online</span><strong>{COUNTRY_LIST.length-1}</strong><small>Locations represented</small></div>
     </div>
     <section className="cq-section cq-live-section" id="live-chess">
       <div className="cq-section-heading"><div><p className="cq-overline">REAL-TIME SOURCE / LICHESS</p><h2>Chess broadcast <i>monitor.</i></h2><p>Current broadcast listings supplied by Lichess, separately from the event calendar.</p></div><a className="cq-arrow-link" href="https://lichess.org/broadcast" target="_blank" rel="noopener noreferrer">Open Lichess ↗</a></div>
       {live.status==="loading"?<div className="cq-live-empty">Checking the Lichess live broadcast feed…</div>:
        live.status==="unavailable"?<div className="cq-live-empty">Live feed is temporarily unavailable. <a href="https://lichess.org/broadcast" target="_blank" rel="noopener noreferrer">Check broadcasts directly ↗</a></div>:
        live.events.length===0?<div className="cq-live-empty">No active broadcasts were returned. <a href="https://lichess.org/broadcast" target="_blank" rel="noopener noreferrer">See the complete calendar ↗</a></div>:
        <div className="cq-live-list">{live.events.slice(0,6).map(item=><a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="cq-live-row"><span className="cq-live-mark"/><div><strong>{item.title}</strong><small>{item.round}{item.players.length?" · "+item.players.join(", "):""}</small></div><span>Watch ↗</span></a>)}</div>
       }
       <p className="cq-live-disclosure">Broadcast availability depends on Lichess coverage and feed availability; game boards, moves and standings remain on the source website.</p>
     </section>
     <section id="events" className="cq-section cq-directory">
       <div className="cq-section-heading"><div><p className="cq-overline">EXPLORE / DISCOVER / FOLLOW</p><h2>Competition <i>directory.</i></h2><p>Verified source links and event windows. Use the filters to focus your search.</p></div><span className="cq-index-count">{filtered.length} matching events</span></div>
       <div className="cq-controls" aria-label="Competition filters">
         <div className="cq-category-row">{CATEGORIES.map(c=><button key={c} type="button" className={category===c?"active":""} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c!=="All"&&<span>{symbols[c]}</span>}{c==="All"?"All competitions":c}</button>)}</div>
         <div className="cq-form-row">
           <label className="cq-search"><span className="sr-only">Search competitions</span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search events, hosts, players…"/></label>
           <label className="cq-select"><span className="sr-only">Country</span><select value={country} onChange={e=>setCountry(e.target.value)}>{COUNTRY_LIST.map(c=><option key={c}>{c}</option>)}</select></label>
           <label className="cq-select"><span className="sr-only">Mode</span><select value={mode} onChange={e=>setMode(e.target.value)}>{["All formats","Online","In person","Hybrid"].map(c=><option key={c}>{c}</option>)}</select></label>
           <label className="cq-select"><span className="sr-only">Status</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>{["All","Upcoming","In progress","Completed"].map(c=><option key={c} value={c}>{c==="All"?"Any status":c}</option>)}</select></label>
         </div>
         <div className="cq-subcontrols">
           <div className="cq-view-toggle"><button type="button" aria-pressed={view==="cards"} className={view==="cards"?"active":""} onClick={()=>setView("cards")}>▤ List view</button><button type="button" aria-pressed={view==="calendar"} className={view==="calendar"?"active":""} onClick={()=>setView("calendar")}>▦ Calendar</button></div>
           <div className="cq-sort"><label>Sort <select value={sort} onChange={e=>setSort(e.target.value)}><option value="soonest">Date: earliest</option><option value="latest">Date: latest</option><option value="az">Name A–Z</option></select></label></div>
         </div>
       </div>
       {filtered.length===0?<div className="cq-empty"><strong>No matching competitions</strong><p>Try another country, category or status. This is a curated catalog, not an exhaustive index.</p><button type="button" onClick={reset}>Clear filters</button></div>:
        view==="calendar"?<Calendar events={filtered} month={month} onMonth={setMonth} today={today}/>:
        <div className="cq-grid">{filtered.map(e=><EventCard key={e.slug} event={e} today={today}/>)}</div>}
     </section>
     <section className="cq-section cq-next"><div><p className="cq-overline">FORWARD CALENDAR</p><h2>Coming up <i>next.</i></h2><p>Next scheduled starts from the curated global directory.</p></div>
       <div className="cq-next-list">{upcoming.slice(0,5).map((e,i)=><Link key={e.slug} href={"/competitions/"+e.slug} className="cq-next-item"><span>{String(i+1).padStart(2,"0")}</span><div><strong>{e.title}</strong><small>{e.country} · {e.category}</small></div><time dateTime={e.start}>{dateLabel(e.start)}</time><span aria-hidden="true">↗</span></Link>)}</div>
     </section>
     <footer className="cq-disclaimer"><span>DATA STANDARD / {verifiedAsOf}</span><p>Events are manually curated from organiser calendars and public listings, verified on {dateLabel(verifiedAsOf)}. This directory is not a complete list of worldwide events. “In progress” is based on published event dates, not live scores or confirmation of games underway. Check official links for schedule revisions, eligibility, results, participants and registration before making travel or entry decisions.</p></footer>
   </div>
 </div>;
}
