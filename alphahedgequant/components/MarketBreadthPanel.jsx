"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";

const MARKETS={
 NSE:{name:"NSE / INDIA",index:"/api/market/indices",stocks:"/api/market/screener",currency:"₹",disclosure:"Provider NSE snapshot; 15-second source refresh elsewhere does not guarantee an exchange tick here."},
 US:{name:"US / DELAYED",index:"/api/market/us-indices",stocks:"/api/market/us-screener",currency:"$",disclosure:"US equities are third-party delayed quotes, not live consolidated tape."}
};
const v=n=>n!==null&&n!==undefined&&n!==""&&Number.isFinite(Number(n))?Number(n):null;
const display=(n,d=2)=>v(n)===null?"—":Number(n).toLocaleString("en-IN",{maximumFractionDigits:d});
const move=(n)=>v(n)===null?"—":(n>0?"+":"")+display(n)+"%";
const shade=(n)=>n>0?"#53d8a5":n<0?"#ff687a":"#b8c4d3";
const clock=s=>{if(!s)return "NO PROVIDER TIME";const d=new Date(s);return Number.isFinite(+d)?d.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short",hour12:false})+" IST":"NO PROVIDER TIME"};
function validIndices(payload){
 const data=payload?.data;
 if(!payload?.success||!data||Array.isArray(data)||typeof data!=="object")return[];
 return Object.entries(data).map(([key,z])=>{
   const p=v(z?.value??z?.price),pct=v(z?.changePct);
   return {key,price:p,pct,prevClose:v(z?.prevClose)};
 }).filter(x=>x.price!==null&&x.price>0).slice(0,12);
}
function validStocks(payload){
 if(!payload?.success||!Array.isArray(payload.data))return[];
 return payload.data.filter(r=>typeof r?.symbol==="string"&&v(r?.price)!==null&&v(r.price)>0&&v(r?.changePct)!==null)
  .map(r=>({symbol:r.symbol,name:r.name||r.symbol,sector:String(r.sector||"Unclassified"),price:v(r.price),changePct:v(r.changePct),priceAsOf:r.priceAsOf||null}))
  .slice(0,3500);
}
export default function MarketBreadthPanel({onChoose=()=>{}}){
 const [market,setMarket]=useState("NSE"),[open,setOpen]=useState(true);
 const [manualWeight,setManualWeight]=useState("4.0"),[manualReturn,setManualReturn]=useState("-1.0"),[manualIndex,setManualIndex]=useState("");
 const [payload,setPayload]=useState({indices:[],stocks:[],stocksAt:null,indicesAt:null,stale:false,status:"CHECKING",error:""});
 const active=useRef(null);
 const load=useCallback(async()=>{
   if(active.current===market)return;active.current=market;
   const conf=MARKETS[market];
   const read=async url=>{const r=await fetch(url,{cache:"no-store"});const j=await r.json();if(!r.ok||!j?.success)throw Error(j?.error||"Source unavailable");return j;};
   const [a,b]=await Promise.allSettled([read(conf.index),read(conf.stocks)]);
   if(active.current!==market)return;
   if(a.status==="fulfilled"||b.status==="fulfilled"){
     const indices=a.status==="fulfilled"?validIndices(a.value):[];
     const stocks=b.status==="fulfilled"?validStocks(b.value):[];
     setPayload({indices,stocks,indicesAt:a.status==="fulfilled"?(a.value.fetchedAt||null):null,
       stocksAt:b.status==="fulfilled"?(b.value.fetchedAt||null):null,
       stale:b.status==="fulfilled"&&b.value.stale===true,
       status:stocks.length||indices.length?"AVAILABLE":"NO VERIFIED ROWS",
       error:!stocks.length?"Verified constituent prices unavailable; market breadth cannot be calculated.":""});
   }else setPayload({indices:[],stocks:[],stocksAt:null,indicesAt:null,stale:false,
     status:"SOURCE UNAVAILABLE",error:"The connected market-data service did not return a valid snapshot. Figures have been withheld."});
   if(active.current===market)active.current=null;
 },[market]);
 useEffect(()=>{
   setPayload({indices:[],stocks:[],stocksAt:null,indicesAt:null,stale:false,status:"CHECKING",error:""});
   load();
 },[market,load]);
 useEffect(()=>{
   if(!open)return;
   const timer=setInterval(()=>{if(!document.hidden)load();},30000);
   return ()=>clearInterval(timer);
 },[open,load]);
 const stats=useMemo(()=>{
   const listed=payload.stocks;
   const advance=listed.filter(r=>r.changePct>0).length,decline=listed.filter(r=>r.changePct<0).length,flat=listed.length-advance-decline;
   const sorted=[...listed].sort((a,b)=>b.changePct-a.changePct);
   const groups=new Map();
   for(const r of listed){const a=groups.get(r.sector)||{name:r.sector,sum:0,count:0};a.sum+=r.changePct;a.count++;groups.set(r.sector,a);}
   const sector=[...groups.values()].map(x=>({...x,change:x.sum/x.count})).sort((a,b)=>b.change-a.change).slice(0,12);
   return {advance,decline,flat,total:listed.length,
     breadth:listed.length?((advance-decline)/listed.length)*100:null,
     up:sorted.slice(0,3),down:sorted.slice(-3).reverse(),sector};
 },[payload.stocks]);
 const priceLabel=(r)=>MARKETS[market].currency+display(r.price);
 const validIndex=payload.indices.filter(x=>x.prevClose!==null&&x.prevClose>0);
 const index=validIndex.find(x=>x.key===manualIndex)||validIndex[0]||null;
 const weight=v(manualWeight),pct=v(manualReturn);
 const contribution=index&&weight!==null&&pct!==null&&weight>=0&&weight<=100&&pct>=-100&&pct<=200
   ?index.prevClose*(weight/100)*(pct/100):null;

 return <section className="qt-panel" aria-label="AHQ market at a glance and breadth" style={{margin:"12px 0 16px",padding:"15px 18px",background:"#0c121b",borderColor:"#243349",color:"#f3f7ff"}}>
   <header style={{display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
     <div><div style={{fontSize:10,letterSpacing:".16em",fontWeight:800,color:"#7cb2f8"}}>AHQ / MARKET INTELLIGENCE</div>
       <h2 style={{fontSize:19,fontWeight:750,margin:"4px 0"}}>Market at a glance <span style={{fontSize:12,color:"#9fb0c6",fontWeight:500}}>· breadth &amp; sector dispersion</span></h2></div>
     <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
       {Object.keys(MARKETS).map(m=><button key={m} type="button" onClick={()=>setMarket(m)} aria-pressed={m===market} style={{border:"1px solid "+(m===market?"#7cb2f8":"#304051"),background:m===market?"#192c43":"transparent",color:"#e4ecf6",padding:"6px 10px",fontSize:11}}>{MARKETS[m].name}</button>)}
       <button type="button" onClick={load} style={{border:"1px solid #304051",padding:"6px 10px",fontSize:11}}>↻ Refresh</button>
       <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open} style={{border:"1px solid #304051",padding:"6px 10px",fontSize:11}}>{open?"Collapse −":"Expand +"}</button>
     </div>
   </header>
   <div style={{fontSize:11,color:"#91a4bc",marginTop:7}}>{payload.status} {payload.stale?"· STALE SOURCE SNAPSHOT":""} · STOCKS {clock(payload.stocksAt)} · INDEX {clock(payload.indicesAt)} · {stats.total?stats.total+" verified stocks":"No verified breadth sample"}</div>
   {open&&<div style={{marginTop:13}}>
     {payload.error&&<p role="status" style={{padding:"9px 11px",border:"1px solid #465064",color:"#cad5e5",fontSize:12}}>{payload.error}</p>}
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginBottom:11}}>
       {(payload.indices.length?payload.indices.slice(0,5):[]).map(r=><div key={r.key} style={{border:"1px solid #2e3e52",background:"#121b28",padding:"11px 13px"}}>
         <div style={{fontSize:10,color:"#a6b7cb",letterSpacing:".06em"}}>{r.key}</div><div style={{fontSize:18,fontWeight:800,marginTop:5}}>{priceLabel(r)}</div>
         <div style={{fontSize:12,color:shade(r.pct)}}>{r.prevClose>0?move(r.pct):"Change unavailable"}</div></div>)}
       <div style={{border:"1px solid #2e3e52",background:"#121b28",padding:"11px 13px"}}>
         <div style={{fontSize:10,color:"#a6b7cb"}}>ADVANCERS / DECLINERS</div>
         <div style={{fontSize:17,fontWeight:800,marginTop:6}}>{stats.total?stats.advance+" / "+stats.decline:"—"}</div>
         <div style={{fontSize:11,color:"#a6b7cb"}}>{stats.total?stats.flat+" unchanged · A−D/N "+display(stats.breadth,1)+"%":"Requires stock quote sample"}</div>
       </div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
       <section style={{border:"1px solid #2e3e52",background:"#111925",padding:13}}>
         <div style={{fontWeight:800,fontSize:11,letterSpacing:".08em",marginBottom:10}}>SECTOR DISPERSION <span style={{fontWeight:500,color:"#9fb0c6"}}>· equal-weight observed stocks</span></div>
         {stats.sector.length?stats.sector.map(x=><div key={x.name} style={{display:"grid",gridTemplateColumns:"minmax(100px,1fr) 2fr 55px",alignItems:"center",gap:8,margin:"9px 0",fontSize:11}}>
           <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={x.name}>{x.name} <small style={{color:"#8b9eb8"}}>({x.count})</small></span>
           <div style={{height:7,background:"#253449",position:"relative"}}><div style={{height:7,width:Math.min(100,Math.abs(x.change)*17)+"%",background:shade(x.change)}}/></div>
           <span style={{color:shade(x.change),textAlign:"right"}}>{move(x.change)}</span></div>):<p style={{fontSize:12,color:"#a6b7cb"}}>No verified sector returns available.</p>}
       </section>
       <section style={{border:"1px solid #2e3e52",background:"#111925",padding:13}}>
         <div style={{fontWeight:800,fontSize:11,letterSpacing:".08em",marginBottom:10}}>LARGEST OBSERVED MOVERS <span style={{fontWeight:500,color:"#9fb0c6"}}>· not index-point contributions</span></div>
         {stats.total?[[stats.up,"RISING"],[stats.down,"FALLING"]].map(([group,label])=><div key={label} style={{marginBottom:13}}>
           <div style={{fontSize:10,letterSpacing:".12em",color:"#9fb0c6",marginBottom:6}}>{label}</div>
           {group.map(x=><button key={x.symbol} type="button" onClick={()=>market==="NSE"&&onChoose(x.symbol)} disabled={market!=="NSE"} style={{display:"flex",width:"100%",justifyContent:"space-between",gap:8,alignItems:"center",borderBottom:"1px solid #29374a",padding:"6px 0",textAlign:"left",color:"#f3f7ff",fontSize:12,opacity:market==="NSE"?1:.8}}>
             <span>{x.symbol} <small style={{color:"#8295ac"}}>{x.sector}</small></span><span style={{color:shade(x.changePct)}}>{move(x.changePct)}</span></button>)}
         </div>):<p style={{fontSize:12,color:"#a6b7cb"}}>No verified stock movers available.</p>}
       </section>
     </div>
     <section aria-label="Hypothetical cap-weighted index point contribution calculator" style={{border:"1px solid #2e3e52",background:"#111925",padding:14,marginTop:10}}>
       <div style={{fontSize:11,fontWeight:800,letterSpacing:".09em",color:"#d5e7fa"}}>CONSTITUENT IMPACT · MANUAL WHAT-IF, NOT AN OBSERVED CONTRIBUTION</div>
       <p style={{fontSize:11,color:"#9db0c9",margin:"7px 0 12px"}}>Enter a constituent's independently verified index weight and daily stock return. This approximates how many points that one stock would contribute to a cap-weighted index.</p>
       <div style={{display:"flex",alignItems:"end",gap:10,flexWrap:"wrap"}}>
         <label style={{fontSize:11,color:"#a9bad0"}}>Index snapshot
           <select value={index?.key||""} onChange={e=>setManualIndex(e.target.value)} style={{display:"block",marginTop:4,padding:"8px 10px",background:"#192434",color:"#f4f9ff",border:"1px solid #304051"}}>
             {!validIndex.length?<option value="">No verified prior close</option>:validIndex.map(x=><option key={x.key} value={x.key}>{x.key}</option>)}
           </select>
         </label>
         <label style={{fontSize:11,color:"#a9bad0"}}>Weight at prior close (%)
           <input type="number" min="0" max="100" step=".01" value={manualWeight} onChange={e=>setManualWeight(e.target.value)} style={{display:"block",marginTop:4,width:130,padding:"8px",background:"#192434",color:"#f4f9ff",border:"1px solid #304051"}}/>
         </label>
         <label style={{fontSize:11,color:"#a9bad0"}}>Constituent day return (%)
           <input type="number" min="-100" max="200" step=".01" value={manualReturn} onChange={e=>setManualReturn(e.target.value)} style={{display:"block",marginTop:4,width:130,padding:"8px",background:"#192434",color:"#f4f9ff",border:"1px solid #304051"}}/>
         </label>
         <div style={{marginLeft:"auto",padding:"7px 12px",border:"1px solid #304051"}}>
           <div style={{fontSize:10,color:"#afbdd0"}}>HYPOTHETICAL INDEX POINTS</div>
           <strong style={{fontSize:20,color:contribution===null?"#e2e9f2":shade(contribution)}}>{contribution===null?"—":(contribution>0?"+":"")+display(contribution,3)}</strong>
         </div>
       </div>
       <p style={{fontSize:10,color:"#9db0c9",lineHeight:1.5,marginTop:10}}>Approximation = previous index close × start-of-day index weight × constituent's observed or manually entered return. Corporate actions, divisor changes and intraday weight drift are excluded. AHQ does not supply verified index weights here; no live company-level point drag is claimed.</p>
     </section>
     <div style={{fontSize:11,color:"#9dacc1",marginTop:11,lineHeight:1.5}}>
       {MARKETS[market].disclosure} Counts describe only {stats.total||0} stocks with valid price and change data; they are not the full exchange breadth. Sector returns are equal-weight averages, not market-cap index contributions. No signal is a trade recommendation. <Link href="/screener" style={{color:"#7cb2f8",textDecoration:"underline"}}>Full screener ↗</Link>
     </div>
   </div>}
 </section>;
}
