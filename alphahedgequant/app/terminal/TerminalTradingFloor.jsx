"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import "./terminal-floor.css";

const DEFAULT_WINDOWS = [
  {id:"orders",title:"Orders",x:0.7,y:82,w:18.3,h:214},
  {id:"account",title:"Account Summary",x:19.3,y:82,w:17.3,h:194},
  {id:"messages",title:"Messages",x:0.7,y:306,w:18.3,h:152},
  {id:"order-entry",title:"Order Entry",x:0.7,y:468,w:29.5,h:179},
  {id:"depth",title:"Level 2 · Market Depth",x:0.7,y:660,w:32.7,h:298},
  {id:"blocks",title:"Block Trades",x:53.6,y:10,w:18.2,h:176},
  {id:"options",title:"Options Most Active",x:31.4,y:201,w:39.9,h:360},
  {id:"timesales",title:"Time & Sales",x:33.8,y:574,w:37.8,h:383},
  {id:"chart",title:"Price Chart · 5-Minute Bars",x:72.2,y:10,w:27.1,h:360},
  {id:"alerts",title:"Ticker Alerts",x:72.2,y:384,w:27.1,h:252},
  {id:"movers",title:"Risers & Fallers",x:72.2,y:650,w:27.1,h:308},
];
const INIT = Object.fromEntries(DEFAULT_WINDOWS.map((p,i)=>[p.id,{...p,z:10+i,hidden:false,collapsed:false}]));
const n=v=>v===null||v===undefined||v===""||!Number.isFinite(Number(v))?null:Number(v);
const px=(v,d=2)=>n(v)===null?"—":Number(v).toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d});
const compact=v=>n(v)===null?"—":Number(v).toLocaleString("en-IN",{notation:"compact",maximumFractionDigits:1});
const ist=t=>new Date(t).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
const first=(row,...keys)=>{for(const k of keys)if(n(row?.[k])!==null)return n(row[k]);return null;};
const signed=x=>x===null?"":x>=0?"gain":"loss";
const pc=row=>first(row,"changePercent","changePct","pctChange","percentageChange","change_percent","pChange");
const sym=row=>String(row?.symbol||row?.trading_symbol||"").trim().toUpperCase();
function FloorWindow({windowDef,children,onStart,onBring,onCollapse,onClose}){
  const p=windowDef;
  if(p.hidden)return null;
  return <section
    data-floor-window={p.id}
    className={"floor-window"+(p.collapsed?" floor-collapsed":"")}
    style={{left:p.x+"%",top:p.y+"px",width:p.w+"%",height:p.collapsed?"31px":p.h+"px",zIndex:p.z}}
    onPointerDown={()=>onBring(p.id)}
    aria-label={p.title}
  >
    <header className="floor-window-title" onPointerDown={e=>onStart(e,p.id)} aria-label={"Drag "+p.title+" window"}>
      <div className="floor-window-label"><span className="floor-green-dot" aria-hidden="true"/> {p.title}</div>
      <div className="floor-window-buttons">
        <button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>onCollapse(p.id)} title={p.collapsed?"Expand panel":"Collapse panel"} aria-label={(p.collapsed?"Expand ":"Collapse ")+p.title}>{p.collapsed?"▢":"−"}</button>
        <button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>onClose(p.id)} title="Hide window" aria-label={"Hide "+p.title}>×</button>
      </div>
    </header>
    {!p.collapsed&&<div className="floor-window-body">{children}</div>}
  </section>;
}
function PanelBlank({title,body,children}){
  return <div className="floor-blank"><strong>{title}</strong><p>{body}</p>{children}</div>;
}
function TapeNumber({name,value,change}){
  return <div className="floor-tape-cell"><span>{name}</span><strong>{value}</strong>{change!==undefined&&change!==null&&<small className={signed(change)}>{change>=0?"▲":"▼"} {px(Math.abs(change))}</small>}</div>;
}
function CandleChart({bars}){
  const points=(bars||[]).filter(b=>[b.open,b.high,b.low,b.close].every(v=>n(v)!==null&&n(v)>0)).slice(-46);
  if(points.length<2)return <PanelBlank title="NO CONFIRMED PRICE BARS" body="The historical 5-minute candle endpoint has not returned enough valid observations."/>;
  const width=620,height=264,L=53,R=18,T=14,B=20,base=207;
  const lo=Math.min(...points.map(x=>x.low)),hi=Math.max(...points.map(x=>x.high)),range=Math.max(0.01,hi-lo),vmax=Math.max(1,...points.map(x=>Number(x.volume)||0));
  const y=v=>T+(hi-v)/range*(base-T-8);
  const dx=(width-L-R)/points.length,barWidth=Math.max(2,Math.min(8,dx*.7));
  return <svg viewBox={"0 0 "+width+" "+height} className="floor-chart-svg" role="img" aria-label="Historical 5-minute OHLC candlestick chart with volume histogram">
    {[0,.25,.5,.75,1].map(t=><g key={t}><line x1={L} x2={width-R} y1={y(lo+(hi-lo)*t)} y2={y(lo+(hi-lo)*t)} stroke="#27352d" strokeDasharray="3 4"/><text x={width-2} y={y(lo+(hi-lo)*t)+3} fill="#c0c8bd" textAnchor="end" fontSize="10">{px(lo+(hi-lo)*t)}</text></g>)}
    {points.map((p,i)=>{const x=L+dx*(i+.5),up=p.close>=p.open,col=up?"#35db6a":"#f44b5b";
      return <g key={i}><line x1={x} x2={x} y1={y(p.high)} y2={y(p.low)} stroke={col} strokeWidth="1.5"/>
      <rect x={x-barWidth/2} y={Math.min(y(p.open),y(p.close))} width={barWidth} height={Math.max(1.5,Math.abs(y(p.open)-y(p.close)))} fill={col}/>
      <rect x={x-barWidth/2} y={base+9+(1-(Number(p.volume)||0)/vmax)*33} width={barWidth} height={Math.max(1,(Number(p.volume)||0)/vmax*33)} fill={up?"#267f43":"#953540"} opacity=".9"/></g>})}
    <line x1={L} y1={base+5} x2={width-R} y2={base+5} stroke="#52634e"/>
    {[0,Math.floor(points.length/2),points.length-1].map(i=><text key={i} x={L+dx*(i+.5)} y={height-2} fill="#b6c1b7" fontSize="10" textAnchor="middle">{points[i].time||""}</text>)}
    <text x={7} y={base+31} fill="#7d9484" fontSize="10">VOL</text>
  </svg>;
}
function MarketDepth({quote,symbol}){
  const bids=Array.isArray(quote?.bids)?quote.bids.slice(0,5):[],asks=Array.isArray(quote?.asks)?quote.asks.slice(0,5):[];
  if(!bids.length&&!asks.length)return <PanelBlank title="DEPTH NOT AVAILABLE" body={"Five-level NSE bid/ask depth for "+symbol+" requires a valid Upstox quote snapshot."}/>;
  return <div className="floor-depth">
    <div className="floor-stat-grid"><span>SYMBOL <b>{symbol}</b></span><span>LAST <b>{px(quote?.price)}</b></span></div>
    <div className="floor-depth-head"><span>BID QTY</span><span>BID ₹</span><span>ASK ₹</span><span>ASK QTY</span></div>
    {Array.from({length:5},(_,i)=><div className="floor-depth-row" key={i}>
      <span className="gain">{compact(bids[i]?.quantity)}</span><span className="gain">{px(bids[i]?.price)}</span>
      <span className="loss">{px(asks[i]?.price)}</span><span className="loss">{compact(asks[i]?.quantity)}</span>
    </div>)}
    <p className="floor-footnote">Top 5 snapshot levels only · not a complete order book or execution tape.</p>
  </div>;
}
function OptionsActivity({chain,optionSymbol,setOptionSymbol,onRefresh}){
  const rows=(Array.isArray(chain?.strikes)?chain.strikes:[]).flatMap(x=>[
    {strike:x.strike_price,type:"CE",...x.call},
    {strike:x.strike_price,type:"PE",...x.put},
  ]).filter(x=>n(x.volume)!==null&&x.volume>=0).sort((a,b)=>(n(b.volume)||0)-(n(a.volume)||0)).slice(0,35);
  return <><div className="floor-innerbar">
    <label>CONTRACT <select value={optionSymbol} onChange={e=>setOptionSymbol(e.target.value)}>
      {[...new Set(["NIFTY","BANKNIFTY","RELIANCE",optionSymbol])].map(s=><option key={s} value={s}>{s}</option>)}
    </select></label>
    <button type="button" onClick={onRefresh}>↻ REFRESH</button>
    <Link href="/options">FULL OPTION DESK ↗</Link>
  </div>
  <p className="floor-caveat">Most active contracts <strong>within the selected chain only</strong> · volume-ranked · {chain?.expiry||"expiry unconfirmed"}</p>
  {rows.length?<div className="floor-table-scroll"><table className="floor-table"><thead><tr><th>CONTRACT</th><th>VOLUME</th><th>LTP ₹</th><th>OI</th><th>IV</th></tr></thead><tbody>
    {rows.map((x,i)=><tr key={String(x.strike)+x.type} className={i===0?"floor-highlight":""}><td>{optionSymbol} {px(x.strike,0)} {x.type}</td><td>{compact(x.volume)}</td><td className={x.type==="CE"?"gain":"loss"}>{px(x.ltp)}</td><td>{compact(x.oi)}</td><td>{px(x.iv,2)}</td></tr>)}
  </tbody></table></div>:<PanelBlank title="NO VERIFIED NSE F&O CONTRACTS" body="Option activity will appear when the selected symbol returns a supported Upstox chain."/>}
  </>;
}
function SortedMovers({data,onChoose}){
  const available=data.filter(x=>sym(x)&&pc(x)!==null&&first(x,"price","ltp","last_price")!==null);
  const up=available.filter(x=>pc(x)>0).sort((a,b)=>pc(b)-pc(a)).slice(0,7);
  const down=available.filter(x=>pc(x)<0).sort((a,b)=>pc(a)-pc(b)).slice(0,7);
  if(!available.length)return <PanelBlank title="MARKET RANKINGS UNAVAILABLE" body="Waiting for usable NSE screener prices and percentage changes; no gainers or losers are fabricated."/>;
  return <><p className="floor-caveat">NSE screener snapshot · not exchange-certified tick-by-tick</p><div className="floor-movers-grid">
    {[["RISERS",up],["FALLERS",down]].map(([title,items])=><div key={title}><div className="floor-mini-head">{title}</div>
      {items.length?items.map(x=><button className="floor-mover-row" type="button" key={sym(x)} onClick={()=>onChoose(sym(x))}><span>{sym(x)}</span><strong className={pc(x)>0?"gain":"loss"}>{pc(x)>0?"+":""}{px(pc(x))}%</strong></button>):<p className="floor-footnote">No qualifying symbols</p>}
    </div>)}</div></>;
}
export default function TerminalTradingFloor({symbol,onChoose,quote,quoteError,seen,bars,chain,optionSymbol,setOptionSymbol,chainLoad,watch,refresh,historyError}){
  const [windows,setWindows]=useState(()=>INIT);
  const [z,setZ]=useState(50);
  const [orderSide,setOrderSide]=useState("BUY"),[qty,setQty]=useState("1"),[limit,setLimit]=useState("");
  const [screener,setScreener]=useState([]),[screenerStatus,setScreenerStatus]=useState("LOADING"),[screenerAt,setScreenerAt]=useState(null);
  const [ticks,setTicks]=useState([]);
  const prev=useRef(null),drag=useRef(null),floorRef=useRef(null);
  const reset=useCallback(()=>{setWindows(INIT);setZ(50)},[]);
  const bring=id=>{setZ(prevZ=>{const next=prevZ+1;setWindows(p=>({...p,[id]:{...p[id],z:next}}));return next})};
  const collapse=id=>setWindows(p=>({...p,[id]:{...p[id],collapsed:!p[id].collapsed}}));
  const hide=id=>setWindows(p=>({...p,[id]:{...p[id],hidden:true}}));
  const restore=id=>setWindows(p=>({...p,[id]:{...p[id],hidden:false,collapsed:false}}));
  const startDrag=(event,id)=>{
    if(event.button!==0||event.target.closest("button")||!floorRef.current||window.matchMedia("(max-width: 1100px)").matches)return;
    const bounds=floorRef.current.getBoundingClientRect();
    drag.current={id,bounds,startX:event.clientX,startY:event.clientY,x:windows[id].x,y:windows[id].y};
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const move=e=>{
    if(!drag.current||!floorRef.current)return;
    const {id,bounds,startX,startY,x,y}=drag.current;
    const width=floorRef.current.querySelector('[data-floor-window="'+id+'"]')?.getBoundingClientRect().width||200;
    const maxX=Math.max(0,100-width/bounds.width*100);
    const nx=Math.min(maxX,Math.max(0,x+(e.clientX-startX)/bounds.width*100));
    const ny=Math.min(Math.max(0,bounds.height-31),Math.max(0,y+e.clientY-startY));
    setWindows(p=>({...p,[id]:{...p[id],x:nx,y:ny}}));
  };
  const endDrag=()=>{drag.current=null};
  useEffect(()=>{
    prev.current=null;setTicks([]);
  },[symbol]);
  useEffect(()=>{
    const p=n(quote?.price);
    if(p===null||p<=0)return;
    const old=prev.current;
    const at=Date.now();
    if(old&&old.symbol===symbol&&old.price!==p){
      setTicks(t=>[{symbol,price:p,change:p-old.price,direction:p>old.price?"UP":"DOWN",at},...t].slice(0,18));
    }
    prev.current={symbol,price:p};
  },[quote,symbol]);
  useEffect(()=>{
    let mounted=true;const ctrl=new AbortController();
    async function load(){
      try{
        const r=await fetch("/api/market/screener",{cache:"no-store",signal:ctrl.signal});
        const j=await r.json();
        const items=Array.isArray(j?.data)?j.data:Array.isArray(j?.data?.stocks)?j.data.stocks:[];
        if(!r.ok||!j?.success||!items.length)throw Error("No verified screener data");
        if(mounted){setScreener(items);setScreenerStatus("READY");setScreenerAt(Date.now())}
      }catch(e){if(mounted&&!ctrl.signal.aborted){setScreener([]);setScreenerStatus("UNAVAILABLE")}}
    }
    load();
    return()=>{mounted=false;ctrl.abort()};
  },[]);
  const dayMove=n(quote?.change);
  const shown=Object.values(windows).filter(p=>!p.hidden).length;
  return <div className="floor-terminal" aria-label="AlphaHedgeQuant eleven-window trading terminal">
    <div className="floor-terminal-header">
      <div className="floor-wordmark"><span className="floor-diamond">α</span><div><strong>ALPHAHEDGEQUANT</strong><small>LIGHTSPEED-STYLE QUANT WORKSTATION · NSE</small></div></div>
      <div className="floor-commands">
        <span className={"floor-readonly "+(quote?"feed-on":"")}>{quote?"● PRICE SNAPSHOT":"○ QUOTE NOT VERIFIED"}</span>
        <span className="floor-readonly">READ ONLY · NO BROKER EXECUTION</span>
        <button type="button" onClick={reset}>↶ RESET LAYOUT</button>
        <details className="floor-windows-menu"><summary>WINDOWS {shown}/11</summary><div>{DEFAULT_WINDOWS.map(p=><button type="button" key={p.id} onClick={()=>restore(p.id)}>{windows[p.id].hidden?"＋":"✓"} {p.title}</button>)}</div></details>
      </div>
    </div>
    <div className="floor-ticker-tape">
      <TapeNumber name="SYMBOL" value={symbol}/>
      <TapeNumber name="LAST ₹" value={px(quote?.price)} change={dayMove}/>
      <TapeNumber name="OPEN" value={px(quote?.open)}/>
      <TapeNumber name="HIGH" value={px(quote?.dayHigh)}/>
      <TapeNumber name="LOW" value={px(quote?.dayLow)}/>
      <TapeNumber name="VOLUME" value={compact(quote?.volume)}/>
      <TapeNumber name="OPTION CHAIN" value={optionSymbol}/>
      <div className="floor-tape-status">{seen?"Quote fetched "+ist(seen)+" IST":"Awaiting Upstox response"}<small>Poll every {refresh/1000}s · not a tick stream</small></div>
    </div>
    <div className="floor-desktop-hint">DRAG TITLE BARS TO MOVE · DRAG WINDOW CORNERS TO RESIZE · USE × TO HIDE · RESET TO RESTORE</div>
    <div className="floor-windows-canvas" ref={floorRef} onPointerMove={move} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      <FloorWindow windowDef={windows.orders} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-table-scroll"><table className="floor-table"><thead><tr><th>SYMBOL</th><th>SIDE</th><th>QTY</th><th>STATUS</th></tr></thead></table></div>
        <PanelBlank title="NO ORDER FEED CONNECTED" body="Connect a broker-authorized orders endpoint before displaying live, pending or filled orders."/>
        <Link className="floor-inline-link" href="/options">Open Options Desk ↗</Link>
      </FloorWindow>
      <FloorWindow windowDef={windows.account} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-account">
          {[["Marked P&L","—"],["Open P&L","—"],["Closed P&L","—"],["Positions","—"],["Available buying power","—"]].map(([name,val])=><div key={name}><span>{name}</span><strong>{val}</strong></div>)}
          <p className="floor-footnote">Account balances and P&L require authorized broker portfolio data. Nothing is estimated.</p>
        </div>
      </FloorWindow>
      <FloorWindow windowDef={windows.messages} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-messages">
          <p className={quote?"gain":"loss"}>{quote?"● QUOTE SNAPSHOT RECEIVED":"○ QUOTE NOT AVAILABLE"}</p>
          <p>{quoteError?"PRICE FEED: "+quoteError:"Selected "+symbol+" · REST quote polling"}</p>
          <p>{chain?"OPTIONS: CHAIN RECEIVED":"OPTIONS: NO VERIFIED CHAIN"}</p>
          <p>{historyError?"HISTORY: "+historyError:"HISTORY: 5-MINUTE SOURCE"}</p>
          <p>ORDER ROUTING: NOT CONNECTED</p>
        </div>
      </FloorWindow>
      <FloorWindow windowDef={windows["order-entry"]} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-order-ticket">
          <div className="floor-order-fields"><label>SYMBOL<input value={symbol} readOnly aria-label="Selected order planning ticker"/></label>
            <label>QTY<input value={qty} inputMode="numeric" onChange={e=>setQty(e.target.value.replace(/[^0-9]/g,"").slice(0,8))} aria-label="Quantity for planning only"/></label>
            <label>LIMIT PRICE ₹<input value={limit} inputMode="decimal" onChange={e=>setLimit(e.target.value.replace(/[^0-9.]/g,"").slice(0,12))} placeholder="Not set" aria-label="Limit price for planning only"/></label></div>
          <div className="floor-plan-actions"><button className={orderSide==="SELL"?"floor-sell selected":"floor-sell"} type="button" onClick={()=>setOrderSide("SELL")}>SELL PLAN</button><button className={orderSide==="BUY"?"floor-buy selected":"floor-buy"} type="button" onClick={()=>setOrderSide("BUY")}>BUY PLAN</button></div>
          <p className="floor-footnote">Planning form only: {orderSide} {qty||"0"} {symbol}. <strong>No orders are transmitted.</strong></p>
        </div>
      </FloorWindow>
      <FloorWindow windowDef={windows.depth} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}><MarketDepth quote={quote} symbol={symbol}/></FloorWindow>
      <FloorWindow windowDef={windows.blocks} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-table-scroll"><table className="floor-table"><thead><tr><th>SYMBOL</th><th>SIZE</th><th>TIME</th></tr></thead></table></div>
        <PanelBlank title="BLOCK PRINTS NOT CONNECTED" body="A verified block-trade feed and exchange trade timestamps are required. Quote changes are not block executions."/>
      </FloorWindow>
      <FloorWindow windowDef={windows.options} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}><OptionsActivity chain={chain} optionSymbol={optionSymbol} setOptionSymbol={setOptionSymbol} onRefresh={chainLoad}/></FloorWindow>
      <FloorWindow windowDef={windows.timesales} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-innerbar"><strong>{symbol}</strong><span>PRICE · QTY · TIME · EXCHANGE</span></div>
        <div className="floor-table-scroll"><table className="floor-table"><thead><tr><th>PRICE ₹</th><th>SIZE</th><th>TIME</th><th>EXCH</th></tr></thead></table></div>
        <PanelBlank title="NO VERIFIED TRADE PRINTS" body="Time & Sales requires a licensed trade-by-trade or time-and-sales feed. We will not fabricate fills from price snapshots."/>
      </FloorWindow>
      <FloorWindow windowDef={windows.chart} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-price-head"><strong>{symbol}</strong><span className={signed(dayMove)}>{px(quote?.price)} {dayMove!==null?(dayMove>=0?"▲ ":"▼ ")+px(Math.abs(dayMove)):""}</span></div>
        <CandleChart bars={bars}/><p className="floor-footnote">5-minute historical candles · last available session · volume below. Not a streaming 1-minute chart.</p>
      </FloorWindow>
      <FloorWindow windowDef={windows.alerts} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        <div className="floor-innerbar"><strong>{symbol} PRICE CHANGES</strong><span>OBSERVED SNAPSHOTS</span></div>
        {ticks.length?<div>{ticks.map((t,i)=><div key={t.at+":"+i} className={"floor-alert-row "+(t.change>0?"gain":"loss")}><span>{t.symbol}</span><span>{px(t.price)} ({t.change>0?"+":""}{px(t.change)})</span><small>{ist(t.at)}</small></div>)}</div>:
          <PanelBlank title="NO NEW PRICE-CHANGE ALERTS" body="This panel logs actual differences between quotes observed while this tab is open; it does not replay historical market alerts."/>}
      </FloorWindow>
      <FloorWindow windowDef={windows.movers} onStart={startDrag} onBring={bring} onCollapse={collapse} onClose={hide}>
        {screenerStatus==="READY"?<SortedMovers data={screener} onChoose={onChoose}/>:<PanelBlank title={"SCREENER "+screenerStatus} body="Live ranking requires a usable NSE screener response; no placeholder market movers."/>}
        {screenerAt&&<p className="floor-footnote">Response fetched {ist(screenerAt)} IST. Source timestamp may differ.</p>}
      </FloorWindow>
    </div>
    <div className="floor-bottom-disclosure">MARKET OBSERVATION ONLY · REAL NSE SOURCES WHEN AVAILABLE · ACCOUNT / ORDERS / BLOCK TRADES / TIME & SALES NOT CONNECTED · CLOSE OR RESIZE ANY WINDOW · NO SYNTHETIC TRADE PRINTS</div>
  </div>;
}
