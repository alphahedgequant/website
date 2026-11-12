"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {compareSnapshots,explainMovement,numericDisplay,readFeedError,toSnapshot} from "@/lib/unusualOptions.mjs";

const CORE=[
  {id:"NIFTY",label:"NIFTY 50",desc:"Index options · direction, IV and gamma sensitivity"},
  {id:"BANKNIFTY",label:"BANK NIFTY",desc:"Bank index options · unusual volatility and delta shifts"},
];
const COMMODITIES=[
  {id:"CRUDEOIL",label:"CRUDE OIL",desc:"MCX options · independent Greeks feed required"},
  {id:"GOLD",label:"GOLD",desc:"MCX options · independent Greeks feed required"},
];
const DEFAULT_SYMBOLS=["RELIANCE","HDFCBANK","ICICIBANK","INFY","TCS","SBIN","ITC","LT","AXISBANK","BHARTIARTL","MARUTI","BAJFINANCE","TATAMOTORS","SUNPHARMA","ADANIENT","HINDALCO"];
const PACE_MS=15_000, RECENT_MS=5*60_000;
const nowIST=t=>new Date(t).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
const short=(s,n=110)=>String(s||"").slice(0,n);
function isNseSession(){
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const mins=Number(parts.hour)*60+Number(parts.minute);
  return parts.weekday!=="Sat"&&parts.weekday!=="Sun"&&mins>=555&&mins<930;
}
function EventRow({event,onOpen}){
  return <div className="flex flex-wrap gap-x-3 gap-y-1 items-center border-b border-white/10 py-2 last:border-b-0 text-xs" data-event-metric={event.metric}>
    <button type="button" onClick={()=>onOpen(event.symbol)} className="font-semibold text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" title={"Open "+event.symbol+" option chain"}>{event.symbol} ↗</button>
    <span className="text-neutral-300 font-mono">{numericDisplay(event.strike,2)} {event.kind}</span>
    <span className={"font-bold "+(event.direction==="UP"?"text-emerald-400":"text-red-400")}>{event.label} {event.direction==="UP"?"↑":"↓"}</span>
    <span className="text-neutral-300 font-mono">{numericDisplay(event.previous)} → {numericDisplay(event.current)}</span>
    <span className="text-neutral-500">{nowIST(event.observedAt)} IST</span>
  </div>;
}
const GUIDE = [
  {metric:"IV",meaning:"Expected volatility priced into the option",up:"More volatility priced in",down:"Less volatility priced in"},
  {metric:"Delta",meaning:"How premium responds to an underlying-price move",up:"Check |Delta|, not just the arrow",down:"Check |Delta|, not just the arrow"},
  {metric:"Gamma",meaning:"How quickly Delta may change",up:"More rapid Delta changes",down:"Slower Delta changes"},
  {metric:"Theta",meaning:"Modelled change in option value as time passes",up:"Less negative often means slower decay",down:"More negative often means faster decay"},
  {metric:"Vega",meaning:"How premium responds to changes in IV",up:"More IV sensitivity if magnitude rose",down:"Less IV sensitivity if magnitude fell"},
  {metric:"OI",meaning:"Number of outstanding open contracts",up:"More open positions",down:"Fewer open positions"},
  {metric:"LTP",meaning:"Last traded price, not a current bid/ask quote",up:"Last premium increased",down:"Last premium decreased"},
];
function MoverAlertRow({event,onOpen}) {
  const up=event.direction==="UP";
  return <article className="grid grid-cols-1 gap-3 border-t border-white/10 p-3.5 sm:p-4 md:grid-cols-[minmax(140px,1.2fr)_minmax(180px,1fr)_minmax(0,2.8fr)_90px] md:items-start" data-event-metric={event.metric}>
    <div className="min-w-0">
      <button type="button" onClick={()=>onOpen(event.symbol)} className="text-sm font-semibold text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" title={"Open "+event.symbol+" option chain"}>{event.symbol} ↗</button>
      <p className="mt-1 font-mono text-xs text-neutral-400">{numericDisplay(event.strike,2)} {event.kind}</p>
    </div>
    <div className="min-w-0">
      <span className={"inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold "+(up?"border-emerald-700/50 bg-emerald-950/30 text-emerald-300":"border-red-800/50 bg-red-950/30 text-red-300")}>{event.label} {up?"↑":"↓"}</span>
      <p className="mt-2 font-mono text-xs text-neutral-200 tabular-nums">{numericDisplay(event.previous)} → {numericDisplay(event.current)}</p>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">What this means</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-200">{explainMovement(event)}</p>
    </div>
    <time dateTime={new Date(event.observedAt).toISOString()} className="font-mono text-[11px] text-neutral-400 md:text-right tabular-nums">{nowIST(event.observedAt)}<span className="block text-neutral-500">IST · observed</span></time>
  </article>;
}

function Card({label,description,kind,error,last,events,onOpen,children,checked}){
  const top=events?.[0]||null;
  const status = kind==="MCX"?"NOT CONNECTED":error?"NO DATA":last?"OBSERVING":"AWAITING BASELINE";
  return <section className="rounded-xl border border-white/15 bg-[#0e1014] p-4 sm:p-5 flex flex-col min-h-[270px]" aria-label={label+" unusual options movements"} data-unusual-card={label}>
    <div className="flex justify-between gap-3 items-start">
      <div><h3 className="font-semibold text-white text-base tracking-wide">{label}</h3><p className="text-neutral-400 text-xs mt-1">{description}</p></div>
      <span className={"text-[10px] font-mono border px-2 py-1 rounded shrink-0 "+(error||kind==="MCX"?"border-red-900/60 text-red-300":top?"border-emerald-700/60 text-emerald-300":"border-white/20 text-neutral-300")}>{status}</span>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-neutral-200 min-h-[48px]" role="status">
      {top ? explainMovement(top) :
        kind==="MCX" ? "Upstox's standard option-chain endpoint excludes MCX. No crude or gold Greeks will be invented; an MCX contract-level V3 Greeks subscription must be integrated first." :
        error ? error :
        last ? "Watching observed changes across successive quotes. A new snapshot is not, by itself, an unusual movement." :
        "Waiting for a usable option-chain response. Two distinct observations are needed before any change can be assessed."}
    </p>
    {top&&<div className={"mt-3 rounded-lg border px-3 py-2 text-sm "+(top.direction==="UP"?"border-emerald-800/40 bg-emerald-950/20":"border-red-900/40 bg-red-950/20")}>
      <span className="font-semibold text-white">{top.label} {top.direction==="UP"?"spike ↑":"drop ↓"}</span>
      <span className="ml-2 font-mono text-neutral-200">{numericDisplay(top.previous)} → {numericDisplay(top.current)}</span>
      <p className="text-[11px] mt-1 text-neutral-400">{top.strike} {top.kind} · {nowIST(top.observedAt)} IST</p>
    </div>}
    {events?.length>0&&<div className="mt-3">{events.slice(0,3).map(e=><EventRow key={e.id} event={e} onOpen={onOpen}/>)}</div>}
    {error&&kind!=="MCX"&&<p className="text-xs text-red-300 mt-3">{short(error,200)}</p>}
    {kind==="MCX"&&<p className="text-xs text-neutral-500 mt-3">This panel will not claim live monitoring without verified MCX instrument keys and Greek quotes.</p>}
    {children}
    <div className="mt-auto pt-4 flex justify-between gap-3 text-[10px] text-neutral-500 font-mono">
      <span>{last?("Expiry "+last.expiry):"No confirmed option snapshot"}</span>
      <span>{last?("Observed "+nowIST(last.observedAt)+" IST"):"—"}</span>
    </div>
    {last&&last.timestampKind!=="EXCHANGE_REPORTED"&&<p className="text-[10px] text-neutral-500 mt-1">Backend-snapshot comparison; per-contract exchange-tick time is unavailable.</p>}
  </section>;
}
export default function UnusualOptionsMonitor({selectedTicker="NIFTY",stockOptions=[],onOpenChain}){
  const [auto,setAuto]=useState(true),[pulse,setPulse]=useState(0),[now,setNow]=useState(Date.now());
  const [status,setStatus]=useState({}),[alerts,setAlerts]=useState([]),[checked,setChecked]=useState({});
  const snapshots=useRef(new Map()),scanCursor=useRef(0),scanBatch=useRef([]),scanPhase=useRef(0);
  const candidates=useMemo(()=>{
    const fromFeed=stockOptions.filter(x=>x&&typeof x.symbol==="string"&&/^[A-Z0-9._-]{1,40}$/.test(x.symbol)).map(x=>x.symbol);
    const all=[...DEFAULT_SYMBOLS,...fromFeed];
    return [...new Set(all)].filter(x=>x!=="NIFTY"&&x!=="BANKNIFTY"&&x!=="FINNIFTY").slice(0,500);
  },[stockOptions]);
  const seenCount=Object.values(checked).filter(x=>x==="observed").length;
  const unsupportedCount=Object.values(checked).filter(x=>x==="unavailable").length;
  const openChain=(ticker)=>{if(typeof onOpenChain==="function")onOpenChain(ticker);};
  const fetchOne=useCallback(async(symbol,signal)=>{
    const ctrl=new AbortController();
    const abort=()=>ctrl.abort();signal.addEventListener("abort",abort,{once:true});
    const timeout=setTimeout(()=>ctrl.abort(),11000);
    try{
      const response=await fetch("/api/market/option-chain/"+encodeURIComponent(symbol),{cache:"no-store",signal:ctrl.signal});
      const body=await response.json().catch(()=>({}));
      if(!response.ok||!body?.success) throw Error(readFeedError(response.status,body));
      const snap=toSnapshot(body,symbol,Date.now());
      if(!snap) throw Error("Upstox returned no usable option Greek values or an incomplete option chain.");
      const prev=snapshots.current.get(symbol);
      const movements=compareSnapshots(prev,snap);
      snapshots.current.set(symbol,snap);
      setStatus(s=>({...s,[symbol]:{last:{...snap,options:undefined},error:null}}));
      setChecked(s=>({...s,[symbol]:"observed"}));
      if(movements.length) setAlerts(a=>{
        const ids=new Set(a.map(x=>x.id));
        const recent=a.filter(x=>Date.now()-x.observedAt<RECENT_MS);
        return [...movements.filter(x=>!ids.has(x.id)),...recent].sort((x,y)=>y.observedAt-x.observedAt||y.score-x.score).slice(0,80);
      });
    }catch(e){
      if(signal.aborted)return;
      setStatus(s=>({...s,[symbol]:{last:null,error:e.name==="AbortError"?"Quote request timed out.":e.message}}));
      setChecked(s=>({...s,[symbol]:"unavailable"}));
    }finally{clearTimeout(timeout);signal.removeEventListener("abort",abort);}
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    let timer, active=true;
    async function scan(){
      if(!active)return;
      setNow(Date.now());
      const batch=[];
      if(scanPhase.current===0||!scanBatch.current.length){
        scanBatch.current=[candidates[scanCursor.current%candidates.length],candidates[(scanCursor.current+1)%candidates.length]].filter(Boolean);
        scanPhase.current=1;
      }else{
        scanPhase.current=0;
        scanCursor.current=(scanCursor.current+2)%Math.max(1,candidates.length);
      }
      const selected=/^[A-Z0-9._-]{1,40}$/.test(selectedTicker)?selectedTicker:null;
      for(const symbol of ["NIFTY","BANKNIFTY",selected,...scanBatch.current])if(symbol&&!batch.includes(symbol)&&symbol!=="CRUDEOIL"&&symbol!=="GOLD")batch.push(symbol);
      await Promise.allSettled(batch.map(symbol=>fetchOne(symbol,controller.signal)));
      if(active&&auto&&isNseSession())timer=setTimeout(scan,PACE_MS);
    }
    scan();
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[auto,pulse,selectedTicker,candidates,fetchOne]);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),PACE_MS);return()=>clearInterval(id);},[]);
  const fresh=alerts.filter(e=>now-e.observedAt<RECENT_MS);
  const eventsFor=(symbol)=>fresh.filter(e=>e.symbol===symbol).sort((a,b)=>b.score-a.score);
  const marketEvents=fresh.filter(e=>e.symbol!=="NIFTY"&&e.symbol!=="BANKNIFTY").sort((a,b)=>b.observedAt-a.observedAt||b.score-a.score);
  const activeMarket=isNseSession();
  return <section className="mt-6 rounded-2xl bg-[#080a0c] border border-white/15 p-4 md:p-6 text-white" aria-label="Unusual options movements scanner" data-testid="unusual-options-monitor">
    <header className="flex flex-wrap gap-4 justify-between items-start border-b border-white/10 pb-5">
      <div><p className="text-xs tracking-widest font-mono text-neutral-400">ALPHAHEDGEQUANT / OPTIONS INTELLIGENCE</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Unusual Options Movements</h2>
      <p className="mt-2 text-sm text-neutral-400 max-w-[760px]">Look for sudden changes in delta, gamma, theta, vega, IV, option LTP or open interest between actual option-chain responses. Green means a metric rose; red means it fell — neither is automatically a LONG or SHORT signal.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)} className={"rounded border px-3 py-2 text-xs font-mono "+(auto?"border-emerald-700 text-emerald-300":"border-white/20 text-neutral-300")}>{auto?"AUTO ON · 15s":"AUTO OFF"}</button>
        <button type="button" onClick={()=>setPulse(n=>n+1)} className="rounded border border-white/25 px-3 py-2 text-xs font-mono hover:bg-white/10">REFRESH NOW ↻</button>
      </div>
    </header>
    <p className="text-xs mt-4 text-neutral-400">{activeMarket?"NSE regular hours (holidays not verified).":"Outside regular NSE hours; manual refresh available."} Monitoring runs only while this tab is open. It requires two distinct responses and is not a persisted, exchange-certified tick feed.</p>
    <section id="ahq-unusual-movers" className="mt-4 rounded-2xl border border-white/20 bg-[#0e1014] p-4 sm:p-5 md:p-6 shadow-lg shadow-black/20" aria-label="NSE F&O unusual movers primary monitor" data-primary-monitor="nse">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[.16em] text-neutral-400">Primary options scanner · India</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">NSE F&O <span className="text-neutral-400">/</span> Unusual Movers</h3>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300 leading-relaxed">See the latest unusual changes in option Greeks, IV, open interest and premium across the NSE F&O symbols currently sampled.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-mono text-neutral-300">
          <p>{seenCount} symbols observed</p>
          <p className="mt-1 text-neutral-400">{unsupportedCount} unavailable · {candidates.length} candidates</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[11px] font-medium text-neutral-400">Recent metric alerts</p>
          <p className="mt-1 text-xl font-semibold text-white tabular-nums">{marketEvents.length}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">In this tab · last 5 min</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[11px] font-medium text-neutral-400">Latest flagged ticker</p>
          <p className="mt-1 truncate text-lg font-semibold text-white">{marketEvents[0]?.symbol||"—"}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Not a trade recommendation</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[11px] font-medium text-neutral-400">Latest metric movement</p>
          <p className={"mt-1 text-lg font-semibold "+(marketEvents[0]?.direction==="UP"?"text-emerald-300":marketEvents[0]?.direction==="DOWN"?"text-red-300":"text-white")}>{marketEvents[0]?(marketEvents[0].label+" "+(marketEvents[0].direction==="UP"?"↑":"↓")):"—"}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Numeric rise / fall</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[11px] font-medium text-neutral-400">Latest flagged contract</p>
          <p className="mt-1 truncate text-lg font-semibold text-white font-mono">{marketEvents[0]?(numericDisplay(marketEvents[0].strike,2)+" "+marketEvents[0].kind):"—"}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Not the highest-volume strike</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="text-xs text-neutral-300">
          <span className="text-emerald-300 font-semibold">↑ Green</span> = metric increased
          <span className="px-2 text-neutral-600">·</span>
          <span className="text-red-300 font-semibold">↓ Red</span> = metric decreased
          <span className="px-2 text-neutral-600">·</span> Latest first
        </p>
        <p className="text-[11px] text-neutral-400">Arrows show numeric change, never BUY / SELL</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs">
        <span className="font-medium text-neutral-400">Selected ticker</span>
        <button type="button" onClick={()=>openChain(selectedTicker)} className="font-semibold text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{selectedTicker} ↗</button>
        <span className="text-neutral-400">{status[selectedTicker]?.error ? "Feed: "+short(status[selectedTicker].error,125) : status[selectedTicker]?.last ? "Last observed "+nowIST(status[selectedTicker].last.observedAt)+" IST" : "Awaiting a verified option snapshot"}</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.045] px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Latest unusual option movements</h4>
            <p className="mt-1 text-xs text-neutral-400">Each alert includes the contract, numeric change and a plain-English explanation.</p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Up to 15 recent alerts</span>
        </div>
        {marketEvents.length
          ? marketEvents.slice(0,15).map(e=><MoverAlertRow key={e.id} event={e} onOpen={openChain}/>)
          : <div className="p-6 text-center text-sm leading-relaxed text-neutral-300">No qualifying movements observed yet. Two distinct snapshots are needed before a metric change can be detected. This does not mean the whole market is quiet.</div>}
      </div>
      <details className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-white marker:text-neutral-400 hover:bg-white/[0.04]">Simple guide: What do IV, Delta, Gamma, Theta, Vega, OI and LTP mean?</summary>
        <div className="grid grid-cols-1 gap-2 border-t border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE.map(item=><div key={item.metric} className="rounded-lg border border-white/10 bg-[#101319] p-3">
            <p className="text-sm font-semibold text-white">{item.metric}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-300">{item.meaning}</p>
            <p className="mt-2 text-xs text-neutral-400"><span className="text-emerald-300">↑</span> {item.up}</p>
            <p className="mt-1 text-xs text-neutral-400"><span className="text-red-300">↓</span> {item.down}</p>
          </div>)}
        </div>
        <p className="border-t border-white/10 px-4 py-3 text-xs text-neutral-400"><strong className="text-white">Example — Theta -0.138 → -0.3561:</strong> Theta is now more negative, so modelled time decay is stronger. Theta -0.3561 → -0.138 means the opposite. This assumes consistent provider units and other pricing inputs unchanged.</p>
      </details>
      <p className="mt-4 text-xs leading-relaxed text-neutral-400">Coverage: a rotating, rate-limited sample of NSE symbols, not every contract continuously. Only F&O-eligible tickers with a valid Upstox chain can be ranked. Observed times are backend snapshots unless exchange timestamps are provided. Click a ticker to inspect its option chain.</p>
    </section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
      {CORE.map(item=><Card key={item.id} label={item.label} description={item.desc} error={status[item.id]?.error} last={status[item.id]?.last} events={eventsFor(item.id)} onOpen={openChain}/>)}
      {COMMODITIES.map(item=><Card key={item.id} label={item.label} description={item.desc} kind="MCX" onOpen={openChain}/>)}
    </div>
    <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">Detection rules: IV ≥15% relative and ≥0.002 provider units; Delta ≥0.08; Gamma ≥40%; Theta/Vega ≥40%; option LTP ≥20% and ≥₹1; OI ≥12% and ≥100. Same-expiry, same-strike comparisons only, within 150 seconds. Metric units are preserved from Upstox. Alert timestamps are local observation times unless the upstream explicitly provides an exchange timestamp. Alerts expire after five minutes. Trading or institutional intent cannot be inferred from these readings alone.</p>
  </section>;
}
