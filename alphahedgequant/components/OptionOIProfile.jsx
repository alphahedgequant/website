"use client";
import {useEffect,useMemo,useRef,useState} from "react";
const num=x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))?null:Number(x);
const format=(x,d=2)=>x===null?"—":x.toLocaleString("en-IN",{maximumFractionDigits:d});
const pretty=x=>x===null?"—":x.toLocaleString("en-IN",{notation:"compact",maximumFractionDigits:2});
const getOI=(r,side)=>num(r?.[side]?.oi??r?.[side]?.open_interest);
const count=(rows,side,field)=>rows.reduce((sum,r)=>sum+(num(r?.[side]?.[field])||0),0);
const valid=(rows)=>rows.filter(r=>num(r?.strike_price)!==null).sort((a,b)=>num(a.strike_price)-num(b.strike_price));
export default function OptionOIProfile({rows=[],spot=null,expiry="",symbol="",receivedAt=null}){
 const [span,setSpan]=useState(6);
 const [observed,setObserved]=useState(null);
 const prior=useRef(null);
 const chain=useMemo(()=>valid(Array.isArray(rows)?rows:[]),[rows]);
 const spotValue=num(spot);
 const atmIndex=useMemo(()=>chain.length?chain.reduce((best,r,i)=>spotValue===null?best:Math.abs(num(r.strike_price)-spotValue)<Math.abs(num(chain[best].strike_price)-spotValue)?i:best,0):-1,[chain,spotValue]);
 const windowRows=useMemo(()=>atmIndex<0?[]:chain.slice(Math.max(0,atmIndex-span),Math.min(chain.length,atmIndex+span+1)),[chain,atmIndex,span]);
 const allCall=chain.filter(r=>getOI(r,"call")!==null),allPut=chain.filter(r=>getOI(r,"put")!==null);
 const sumCall=allCall.length?allCall.reduce((sum,r)=>sum+getOI(r,"call"),0):null;
 const sumPut=allPut.length?allPut.reduce((sum,r)=>sum+getOI(r,"put"),0):null;
 const pcr=sumCall>0&&sumPut!==null?sumPut/sumCall:null;
 const cePeak=chain.filter(r=>getOI(r,"call")!==null).sort((a,b)=>getOI(b,"call")-getOI(a,"call")).slice(0,3);
 const pePeak=chain.filter(r=>getOI(r,"put")!==null).sort((a,b)=>getOI(b,"put")-getOI(a,"put")).slice(0,3);
 const ceTop=cePeak[0]?getOI(cePeak[0],"call"):null,peTop=pePeak[0]?getOI(pePeak[0],"put"):null;
 const max=Math.max(1,...windowRows.flatMap(r=>[getOI(r,"call")||0,getOI(r,"put")||0]));
 // Two successive *observed* browser snapshots only. No historical OI assumed.
 useEffect(()=>{
   if(!chain.length){prior.current=null;setObserved(null);return;}
   const key=String(symbol)+"|"+String(expiry);
   const now=Date.now();
   const snapshot=new Map(chain.map(r=>[String(num(r.strike_price)),{call:getOI(r,"call"),put:getOI(r,"put")}]));
   const p=prior.current;
   if(p&&p.key===key&&p.rows!==rows){
     let dc=0,dp=0,nc=0,np=0;
     for(const [strike,cur] of snapshot){
       const old=p.snapshot.get(strike);if(!old)continue;
       if(cur.call!==null&&old.call!==null){dc+=cur.call-old.call;nc++;}
       if(cur.put!==null&&old.put!==null){dp+=cur.put-old.put;np++;}
     }
     setObserved({dc:nc?dc:null,dp:np?dp:null,nc,np,
       elapsed:Math.max(0,Math.round((now-p.time)/1000)),key,
       asof:receivedAt||new Date(now).toISOString()});
   }else if(!p||p.key!==key)setObserved(null);
   prior.current={key,rows,snapshot,time:now};
 },[chain,rows,symbol,expiry,receivedAt]);
 const delta=observed?.key===String(symbol)+"|"+String(expiry)?observed:null;
 if(!chain.length)return <section aria-label="Option open interest profile" className="rounded-lg border border-line bg-surface p-4 mt-5">
   <h3 className="font-semibold text-sm text-body">OPEN INTEREST / STRIKE PROFILE</h3>
   <p className="text-xs mt-2 text-muted">Waiting for a verified NSE option-chain snapshot. No strikes or OI concentration are simulated.</p>
 </section>;
 return <section aria-label={symbol+" open interest distribution and PCR"} className="rounded-xl border border-line bg-[#0c1420] p-4 sm:p-5 mt-5 text-white" data-ahq-oi-profile="true">
  <header className="flex flex-wrap gap-3 items-start justify-between border-b border-white/15 pb-3">
   <div><p className="font-mono text-[10px] tracking-[.16em] text-blue-300">AHQ / OPTIONS POSITIONING</p>
    <h3 className="text-lg sm:text-xl font-semibold text-white mt-1">{symbol||"UNDERLYING"} · Open-interest profile</h3>
    <p className="text-xs text-slate-300 mt-1">One selected expiry: {expiry||"expiry unavailable"} · {chain.length} listed strikes · provider OI units</p>
   </div>
   <label className="text-xs text-slate-300 flex gap-2 items-center">ATM ±
    <select aria-label="Strike range around at-the-money" value={span} onChange={e=>setSpan(Number(e.target.value))}
      className="rounded border border-white/30 px-2 py-1 bg-[#16263a] text-white">
      {[4,6,10,15].map(x=><option key={x} value={x}>{x} strikes</option>)}
    </select></label>
  </header>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
   {[[ "CE OPEN INTEREST",sumCall===null?"—":pretty(sumCall),"Across available call strikes" ],
     [ "PE OPEN INTEREST",sumPut===null?"—":pretty(sumPut),"Across available put strikes" ],
     [ "OI PUT/CALL RATIO",pcr===null?"—":pcr.toFixed(3),"PE OI ÷ CE OI, this expiry" ],
     [ "ATM / SPOT",atmIndex<0?"—":format(num(chain[atmIndex].strike_price))+(spotValue===null?"": " / "+format(spotValue)),"Nearest reported strike and spot" ]
    ].map(([label,value,note])=><div key={label} className="rounded-lg border border-white/15 bg-white/[0.03] p-3">
      <p className="font-mono text-[10px] tracking-wider text-slate-300">{label}</p>
      <strong className="block text-lg mt-1 text-white tabular-nums">{value}</strong><small className="text-slate-400">{note}</small>
    </div>)}
  </div>
  <div className="mt-5">
    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-200 font-semibold mb-3"><span>CALL OI · left</span><span>STRIKE</span><span>PUT OI · right</span></div>
    <div className="space-y-[5px]">{windowRows.map(r=>{
      const strike=num(r.strike_price),call=getOI(r,"call"),put=getOI(r,"put");
      const atm=atmIndex>=0&&strike===num(chain[atmIndex].strike_price);
      return <div key={strike} className={"grid gap-2 items-center "+(atm?"bg-[#19334c] rounded-md py-1":"")} style={{gridTemplateColumns:"minmax(0,1fr) 80px minmax(0,1fr)"}}>
       <div className="flex items-center gap-1 justify-end"><span className="tabular-nums font-mono text-[10px] text-slate-300 shrink-0">{pretty(call)}</span>
         <div className="w-full max-w-[170px] h-[11px] bg-white/5 rounded-sm flex justify-end overflow-hidden"><div style={{width:call===null?"0%":Math.max(1,call/max*100)+"%",background:"#8899b0"}}/></div></div>
       <div className={"text-center text-[11px] tabular-nums "+(atm?"text-white font-extrabold":"text-slate-300")}>{format(strike,2)}{atm?" •":""}</div>
       <div className="flex items-center gap-1"><div className="w-full max-w-[170px] h-[11px] bg-white/5 rounded-sm overflow-hidden"><div style={{width:put===null?"0%":Math.max(1,put/max*100)+"%",background:"#6d9fd4"}}/></div>
         <span className="tabular-nums font-mono text-[10px] text-slate-300 shrink-0">{pretty(put)}</span></div>
      </div>;
    })}</div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
   {[[ "HIGHEST CALL OI",cePeak,"call",sumCall ],[ "HIGHEST PUT OI",pePeak,"put",sumPut ]].map(([label,items,side,sum])=><div key={label} className="rounded-lg border border-white/15 p-3">
     <h4 className="text-xs font-semibold tracking-wider text-blue-200">{label}</h4>
     {items.length?items.map((r,i)=><div key={r.strike_price} className="flex justify-between gap-3 py-2 text-xs border-b border-white/10 last:border-0">
       <span className="text-slate-300">{i+1}. STRIKE {format(num(r.strike_price))}</span>
       <strong className="text-white">{pretty(getOI(r,side))}{sum>0?" · "+(getOI(r,side)/sum*100).toFixed(1)+"%":""}</strong>
     </div>):<p className="text-xs mt-2 text-slate-300">No reported OI in this side of the chain.</p>}
   </div>)}
  </div>
  <div className="mt-4 border-t border-white/15 pt-3">
   <h4 className="text-xs font-semibold tracking-wider text-blue-200">OBSERVED SNAPSHOT CHANGE · SAME EXPIRY</h4>
   {delta&&delta.dc!==null&&delta.dp!==null?
     <p className="text-xs mt-2 text-slate-200">CE OI <strong className={delta.dc>0?"text-emerald-300":delta.dc<0?"text-rose-300":"text-white"}>{delta.dc>0?"+":""}{format(delta.dc,0)}</strong> · PE OI <strong className={delta.dp>0?"text-emerald-300":delta.dp<0?"text-rose-300":"text-white"}>{delta.dp>0?"+":""}{format(delta.dp,0)}</strong> · matched strikes {Math.min(delta.nc,delta.np)} · browser sample window {delta.elapsed}s</p>
     :<p className="text-xs mt-2 text-slate-300">A second distinct valid snapshot of the same expiry is required before computing a change. No ΔOI is invented.</p>}
   <p className="text-[11px] leading-relaxed text-slate-400 mt-3">OI is an outstanding-position count, not executed buy/sell flow. Strong OI strikes are concentration zones, not proven support/resistance. PCR reflects available strikes and cannot determine dealer positioning or market direction. Snapshot changes compare two browser observations; they are not necessarily changes since the exchange opened. Prices and OI depend on the connected Upstox provider.</p>
  </div>
 </section>;
}
