"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {compareSnapshots,numericDisplay,readFeedError,toSnapshot} from "@/lib/unusualOptions.mjs";

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

const pctMove=e=>!e?"—":Number.isFinite(e.relative)?(e.direction==="UP"?"+":"−")+(e.relative*100).toFixed(1)+"%":(e.direction==="UP"?"+":"")+numericDisplay(e.change);
const numberOrDash=(v,dec=2)=>v===null||v===undefined||!Number.isFinite(Number(v))?"—":Number(v).toLocaleString("en-IN",{maximumFractionDigits:dec});
function FlowGlyph({type}){
  const paths={
    NIFTY:<><rect x="4" y="12" width="3" height="7" rx=".7"/><rect x="10.5" y="8" width="3" height="11" rx=".7"/><rect x="17" y="4" width="3" height="15" rx=".7"/></>,
    BANKNIFTY:<><path d="M3 9l9-5 9 5M4 20h16M5 11v7m4-7v7m6-7v7m4-7v7"/></>,
    CRUDEOIL:<path d="M12 2c-2 4-7 9-7 13a7 7 0 0 0 14 0c0-4-5-9-7-13Z"/>,
    GOLD:<><path d="m7 6 10 0 4 6-9 9L3 12Z"/><path d="M3 12h18M7 6l5 6 5-6M12 12v9"/></>,
    ALL:<><rect x="4" y="4" width="16" height="5" rx="1"/><rect x="6" y="11" width="14" height="4" rx="1"/><rect x="8" y="17" width="12" height="4" rx="1"/></>
  };
  return <span className="ahq2-icon"><svg viewBox="0 0 24 24" width="23" height="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden="true">{paths[type]||paths.ALL}</svg></span>;
}
function InstrumentCard({item,state,events}){
  const connected=item.kind!=="MCX", last=state?.last, top=events[0], error=state?.error;
  const feed=connected?(error?"Unavailable":last?"Observing":"Waiting"):"No MCX feed";
  return <article className="ahq2-instrument" aria-label={item.label+" unusual options movements"} data-unusual-card={item.label}>
    <div className="ahq2-instrument-head">
      <FlowGlyph type={item.id}/><div className="ahq2-instrument-title"><h3>{item.label}</h3><span className="ahq2-feed" data-state={last?"ok":error?"error":"waiting"}>{feed}</span></div>
    </div>
    <div className="ahq2-instrument-value">{last?numberOrDash(last.spot,2):"—"}<small>{connected?"Underlying spot · latest snapshot":"Awaiting verified MCX options feed"}</small></div>
    <div className="ahq2-instrument-stats">
      <div><small>TOP METRIC</small><strong>{top?top.label:"—"}</strong></div>
      <div><small>CHANGE</small><strong className={top?.direction==="UP"?"ahq2-up":top?.direction==="DOWN"?"ahq2-down":""}>{top?pctMove(top):"—"}</strong></div>
      <div><small>MOVEMENTS</small><strong>{events.length||"0"}</strong></div>
    </div>
    {top?<p className="ahq2-card-foot">{numberOrDash(top.strike,2)} {top.kind} · {nowIST(top.observedAt)} IST</p>:<p className="ahq2-card-foot">{connected?(error?short(error,72):last?"No qualifying change in this sample":"Two snapshots needed to compare"):"No option-chain Greeks are being inferred"}</p>}
  </article>;
}
function MovementRow({event,selected,onSelect,onOpen}){
  const statusName=event.metric==="iv"?(event.direction==="UP"?"IV rise":"IV fall"):event.metric==="oi"?"OI shift":event.metric==="ltp"?"Premium move":"Greek shift";
  return <tr className={selected?"ahq2-selected":""} data-event-metric={event.metric}>
    <td><button type="button" className="ahq2-symbol-link" onClick={()=>onOpen(event.symbol)} title={"Open "+event.symbol+" option chain"}>{event.symbol} ↗</button></td>
    <td className="ahq2-num">{numberOrDash(event.strike,2)}</td>
    <td><span className={"ahq2-kind "+(event.kind==="PE"?"put":"call")}>{event.kind}</span></td>
    <td>{event.label}</td>
    <td className="ahq2-num">{numericDisplay(event.previous)}</td>
    <td className="ahq2-num">{numericDisplay(event.current)}</td>
    <td className={event.direction==="UP"?"ahq2-up":"ahq2-down"}><strong>{pctMove(event)}</strong></td>
    <td className="ahq2-num">{nowIST(event.observedAt)}</td>
    <td><button type="button" className="ahq2-row-select" aria-pressed={selected} onClick={()=>onSelect(event.id)}>{selected?"Selected":"Inspect"}</button><span className="ahq2-sr-only"> {statusName}</span></td>
  </tr>;
}

export default function UnusualOptionsMonitor({selectedTicker="NIFTY",stockOptions=[],onOpenChain}){
  const [auto,setAuto]=useState(true),[pulse,setPulse]=useState(0),[now,setNow]=useState(Date.now());
  const [status,setStatus]=useState({}),[alerts,setAlerts]=useState([]),[checked,setChecked]=useState({});
  const [selectedEventId,setSelectedEventId]=useState("");
  const [metricFilter,setMetricFilter]=useState("ALL");
  const snapshots=useRef(new Map()),scanCursor=useRef(0),scanBatch=useRef([]),scanPhase=useRef(0);
  const candidates=useMemo(()=>{
    const fromFeed=stockOptions.filter(x=>x&&typeof x.symbol==="string"&&/^[A-Z0-9._-]{1,40}$/.test(x.symbol)).map(x=>x.symbol);
    const all=fromFeed.length?fromFeed:DEFAULT_SYMBOLS;
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
      setStatus(s=>({...s,[symbol]:{last:{...snap,options:undefined},contracts:[...snap.options.values()],spotDiff:prev?.spot>0?snap.spot-prev.spot:null,error:null}}));
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
  const eventsFor=symbol=>fresh.filter(e=>e.symbol===symbol).sort((a,b)=>b.score-a.score);
  const marketEvents=[...fresh].sort((a,b)=>b.score-a.score||b.observedAt-a.observedAt);
  const visibleEvents=marketEvents.filter(e=>metricFilter==="ALL"||(metricFilter==="IV"&&e.metric==="iv")||(metricFilter==="GREEKS"&&["delta","gamma","theta","vega"].includes(e.metric))||(metricFilter==="OI_PRICE"&&["oi","ltp"].includes(e.metric)));
  const inspected=marketEvents.find(e=>e.id===selectedEventId)||eventsFor(selectedTicker)[0]||marketEvents[0]||null;
  const detailSymbol=inspected?.symbol||selectedTicker;
  const detailSnapshot=status[detailSymbol]?.last||null;
  const detailContract=inspected?status[detailSymbol]?.contracts?.find(c=>c.strike===inspected.strike&&c.kind===inspected.kind):status[detailSymbol]?.contracts?.[0];
  const detailTitle=inspected?detailSymbol+" "+numberOrDash(inspected.strike,2)+" "+inspected.kind:detailSymbol;
  const detailMetrics=[
    ["DELTA",detailContract?.delta,4],["GAMMA",detailContract?.gamma,6],["THETA",detailContract?.theta,4],
    ["VEGA",detailContract?.vega,4],["IV",detailContract?.iv,2],["OPEN INTEREST",detailContract?.oi,0],["OPTION LTP",detailContract?.ltp,2]
  ];
  const ivRises=fresh.filter(e=>e.metric==="iv"&&e.direction==="UP").length;
  const ivFalls=fresh.filter(e=>e.metric==="iv"&&e.direction==="DOWN").length;
  const greekShifts=fresh.filter(e=>["delta","gamma","theta","vega"].includes(e.metric)).length;
  const topIv=[...marketEvents].filter(e=>e.metric==="iv").sort((a,b)=>(b.relative||0)-(a.relative||0))[0];
  const topMovement=marketEvents[0]||null;
  const bySymbol=marketEvents.reduce((m,e)=>(m[e.symbol]=(m[e.symbol]||0)+1,m),{});
  const mostActive=Object.entries(bySymbol).sort((a,b)=>b[1]-a[1])[0];
  const activeMarket=isNseSession();
  const lastFetched=Math.max(0,...Object.values(status).map(s=>s?.last?.observedAt||0));
  return <section className="ahq2-flow" data-testid="unusual-options-monitor" aria-label="Unusual options movements scanner">
    <div className="ahq2-flow-header">
      <div>
        <p className="ahq2-eyebrow">ALPHAHEDGEQUANT / QUANT TERMINAL</p>
        <h2>Unusual Options Flow</h2>
        <p className="ahq2-subtitle">Large or sudden changes in option Greeks, IV, premium or open interest that may signal unusual activity.</p>
      </div>
      <div className="ahq2-header-actions">
        <button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)} className="ahq2-button">{auto?"◉ Auto Refresh · 15s":"○ Auto Refresh · Off"}</button>
        <button type="button" onClick={()=>setPulse(v=>v+1)} className="ahq2-button ahq2-button-primary">↻ Refresh Now</button>
      </div>
    </div>
    <div className="ahq2-market-strip" aria-label="Observed market snapshot indicators">
      <span className="ahq2-market-label"><i className={activeMarket?"ahq2-live":""}></i>{activeMarket?"NSE HOURS":"NSE SESSION CLOSED"}</span>
      {CORE.map(item=><div key={item.id} className="ahq2-market-ticker"><b>{item.label}</b><strong>{numberOrDash(status[item.id]?.last?.spot,2)}</strong><small>last sampled spot</small></div>)}
      <span className="ahq2-market-source">Observed quotes · not exchange tick tape</span>
    </div>
    <div className="ahq2-instruments" aria-label="Instrument monitoring summary">
      {CORE.map(item=><InstrumentCard key={item.id} item={item} state={status[item.id]} events={eventsFor(item.id)}/>)}
      {COMMODITIES.map(item=><InstrumentCard key={item.id} item={item} state={null} events={[]}/>)}
      <article className="ahq2-instrument ahq2-all" aria-label="All NSE F&O sampled coverage">
        <div className="ahq2-instrument-head"><FlowGlyph type="ALL"/><div className="ahq2-instrument-title"><h3>ALL NSE F&O</h3><span className="ahq2-feed">{candidates.length} candidate symbols</span></div></div>
        <div className="ahq2-all-count"><strong>{marketEvents.length}</strong><small>recent observed movements</small></div>
        <div className="ahq2-instrument-stats">
          <div><small>CHAINS</small><strong>{seenCount}</strong></div>
          <div><small>UNAVAILABLE</small><strong>{unsupportedCount}</strong></div>
          <div><small>SCANNER</small><strong>Sampled</strong></div>
        </div>
        <p className="ahq2-card-foot">Not a complete market-wide ranking</p>
      </article>
    </div>
    <div className="ahq2-main-grid">
      <div className="ahq2-panel ahq2-board" aria-label="NSE options unusual moves">
        <div className="ahq2-panel-head">
          <div className="ahq2-heading-icon"><FlowGlyph type="NIFTY"/><div><h3>NSE F&O Unusual Movers</h3><p>Rolling, rate-limited scan of available NSE F&O option chains.</p></div></div>
          <span className="ahq2-panel-count">{seenCount} chains · {candidates.length} candidates</span>
        </div>
        <div className="ahq2-filters" aria-label="Movement metric filters">
          {[["ALL","All Metrics"],["IV","IV"],["GREEKS","Greeks"],["OI_PRICE","Premium / OI"]].map(([key,label])=><button key={key} type="button" aria-pressed={metricFilter===key} onClick={()=>setMetricFilter(key)}>{label}</button>)}
        </div>
        {visibleEvents.length?<div className="ahq2-table-wrap">
          <table className="ahq2-table" aria-label="Recent unusual NSE option metric changes">
            <thead><tr><th>Symbol</th><th>Strike</th><th>Type</th><th>Metric</th><th>Prev</th><th>Current</th><th>Change</th><th>Time · IST</th><th>Details</th></tr></thead>
            <tbody>{visibleEvents.slice(0,18).map(e=><MovementRow key={e.id} event={e} selected={inspected?.id===e.id} onSelect={setSelectedEventId} onOpen={openChain}/>)}</tbody>
          </table>
        </div>:<div className="ahq2-no-alerts" role="status">
          <strong>{marketEvents.length?"No results for this metric filter":"No qualifying changes in the current sample"}</strong>
          <p>{marketEvents.length?"Choose All Metrics to see other observations.":"Two distinct snapshots are required. No result does not mean there is no market-wide unusual activity."}</p>
          {status[selectedTicker]?.error&&<span>Selected feed: {short(status[selectedTicker].error,160)}</span>}
        </div>}
        <div className="ahq2-board-foot">Click a ticker to open its chain, or Inspect to view Greeks below. Movements describe metrics—not buyer-initiated trades or directional trading signals.</div>
      </div>
      <aside className="ahq2-sidebar">
        <div className="ahq2-panel ahq2-summary">
          <div className="ahq2-side-title"><FlowGlyph type="ALL"/><h3>Movement Summary</h3><span>NSE Sample</span></div>
          <div className="ahq2-summary-tiles">
            <div><strong className="ahq2-up">{ivRises}</strong><small>IV Rises</small></div>
            <div><strong className="ahq2-down">{ivFalls}</strong><small>IV Falls</small></div>
            <div><strong>{greekShifts}</strong><small>Greek Shifts</small></div>
            <div><strong className="ahq2-blue">{marketEvents.length}</strong><small>Total Alerts</small></div>
          </div>
        </div>
        <div className="ahq2-panel ahq2-snapshot">
          <div className="ahq2-side-title"><FlowGlyph type="NIFTY"/><h3>Flow Snapshot</h3></div>
          <div className="ahq2-snapshot-line"><span>Largest metric shift</span><strong>{topMovement?topMovement.label+" "+pctMove(topMovement):"—"}</strong></div>
          <div className="ahq2-snapshot-line"><span>Largest IV change</span><strong className={topIv?.direction==="UP"?"ahq2-up":topIv?.direction==="DOWN"?"ahq2-down":""}>{topIv?topIv.symbol+" · "+pctMove(topIv):"—"}</strong></div>
          <div className="ahq2-snapshot-line"><span>Most flagged symbol</span><strong>{mostActive?mostActive[0]:"—"}</strong></div>
          <div className="ahq2-snapshot-line"><span>Coverage</span><strong>{seenCount} observed / {unsupportedCount} unavailable</strong></div>
        </div>
      </aside>
    </div>
    <div className="ahq2-detail ahq2-panel" aria-label="Selected option contract Greeks">
      <div className="ahq2-detail-title">
        <strong>{detailTitle}</strong><span>{inspected?"UNUSUAL METRIC MOVE":"SNAPSHOT"}</span>
        <small>{detailSnapshot?"Observed "+nowIST(detailSnapshot.observedAt)+" IST · Expiry "+detailSnapshot.expiry:"Awaiting verified contract data"}</small>
      </div>
      <div className="ahq2-detail-metrics">
        {detailMetrics.map(([name,value,dec])=><div key={name}><small>{name}</small><strong>{numberOrDash(value,dec)}</strong></div>)}
      </div>
    </div>
    <div className="ahq2-data-note">
      <span>ⓘ NSE scanner covers a rolling sample; MCX options Greeks are not connected. Metric increases and decreases do not establish trade direction.</span>
      <span>{lastFetched?"● Last observed: "+nowIST(lastFetched)+" IST":"● No verified snapshot yet"}</span>
    </div>
    <details className="ahq2-method">
      <summary>Detection criteria and data limitations</summary>
      <p>IV ≥15% relative and ≥0.002 provider units; Delta ≥0.08; Gamma ≥40%; Theta/Vega ≥40%; option LTP ≥20% and ≥₹1; OI ≥12% and ≥100. Comparisons use matching expiries and strikes within 150 seconds. Prices and Greek units are passed through from Upstox. Alert timestamps reflect local observation unless the provider supplies exchange timestamps. Alerts expire after five minutes. The scanner runs only while this tab is open; exchange holidays are not verified. No claims of institutionally initiated trades or long/short signals are made.</p>
    </details>
  </section>;
}
