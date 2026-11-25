"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import OptionIVAnalytics from "@/components/OptionIVAnalytics";
import OptionOIProfile from "@/components/OptionOIProfile";
import {computeTerminalRisk} from "@/lib/terminalRisk.mjs";

const finite=x=>x!==null&&x!==undefined&&x!==""&&Number.isFinite(Number(x))?Number(x):null;
const total=(rows,side,key)=>rows.reduce((sum,r)=>sum+(finite(r?.[side]?.[key])??0),0);
const n=x=>x===null||!Number.isFinite(x)?"—":x.toLocaleString("en-IN",{maximumFractionDigits:2});
const compact=x=>x===null||!Number.isFinite(x)?"—":x.toLocaleString("en-IN",{notation:"compact",maximumFractionDigits:2});
const pct=x=>x===null||!Number.isFinite(x)?"—":x.toFixed(2)+"%";
function duringNseSession(){
 const fields=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 const minutes=Number(fields.hour)*60+Number(fields.minute);
 return !["Sat","Sun"].includes(fields.weekday)&&minutes>=555&&minutes<930;
}
function Metric({label,value,detail,tone=""}){
 return <div className="qt-operational-metric"><small>{label}</small><strong className={tone}>{value}</strong><span>{detail}</span></div>;
}
function Empty({title,children}){
 return <div className="qt-operational-empty"><strong>{title}</strong><p>{children}</p></div>;
}
function Section({title,detail,children}){
 return <section className="qt-options-section"><header><div><h3>{title}</h3><p>{detail}</p></div></header>{children}</section>;
}
function StrikeProfile({rows,spot}){
 const valid=rows.filter(r=>finite(r.strike_price)!==null);
 if(!valid.length)return <Empty title="STRIKE PROFILE UNAVAILABLE">No valid strike rows were returned by the provider.</Empty>;
 const max=Math.max(1,...valid.flatMap(r=>[finite(r.call?.oi)||0,finite(r.put?.oi)||0]));
 return <div className="qt-options-strikes">{valid.map(r=>{
  const c=finite(r.call?.oi),p=finite(r.put?.oi),strike=finite(r.strike_price),atm=spot!==null&&Math.abs(strike-spot)===Math.min(...valid.map(x=>Math.abs(finite(x.strike_price)-spot)));
  return <div className={atm?"qt-options-strike is-atm":"qt-options-strike"} key={strike}>
   <span className="call">{compact(c)}</span><div className="call-track"><i style={{width:(c===null?0:c/max*100)+"%"}}/></div>
   <b>{n(strike)}</b><div className="put-track"><i style={{width:(p===null?0:p/max*100)+"%"}}/></div><span className="put">{compact(p)}</span>
  </div>;
 })}</div>;
}
const TABS=["OVERVIEW","GAMMA LAB","DELTA & FLOW","VOLATILITY","REPLAY","QUICK WIDGETS"];
export function TerminalOptionAnalytics({symbol,chain,chainError,onRefresh}){
 const [view,setView]=useState("OVERVIEW");
 const [history,setHistory]=useState([]);
 const [prior,setPrior]=useState(null);
 const rows=useMemo(()=>Array.isArray(chain?.strikes)?chain.strikes:[],[chain]);
 const spot=finite(chain?.spot_price),expiry=chain?.expiry||"";
 const atm=useMemo(()=>rows.reduce((best,r)=>spot===null||finite(r.strike_price)===null?best:!best||Math.abs(Number(r.strike_price)-spot)<Math.abs(Number(best.strike_price)-spot)?r:best,null),[rows,spot]);
 const values=useMemo(()=>{
  const callOI=total(rows,"call","oi"),putOI=total(rows,"put","oi"),callVol=total(rows,"call","volume"),putVol=total(rows,"put","volume");
  const callGamma=rows.reduce((s,r)=>s+(finite(r.call?.gamma)??0)*(finite(r.call?.oi)??0),0);
  const putGamma=rows.reduce((s,r)=>s+(finite(r.put?.gamma)??0)*(finite(r.put?.oi)??0),0);
  const gammaRows=rows.filter(r=>finite(r.call?.gamma)!==null||finite(r.put?.gamma)!==null);
  const deltaRows=rows.filter(r=>finite(r.call?.delta)!==null||finite(r.put?.delta)!==null);
  const callDex=rows.reduce((s,r)=>s+(finite(r.call?.delta)??0)*(finite(r.call?.oi)??0),0);
  const putDex=rows.reduce((s,r)=>s+(finite(r.put?.delta)??0)*(finite(r.put?.oi)??0),0);
  return {callOI,putOI,callVol,putVol,oiPcr:callOI>0?putOI/callOI:null,volPcr:callVol>0?putVol/callVol:null,
   callGamma:gammaRows.length?callGamma:null,putGamma:gammaRows.length?putGamma:null,netGamma:gammaRows.length?callGamma+putGamma:null,
   callDex:deltaRows.length?callDex:null,putDex:deltaRows.length?putDex:null,netDex:deltaRows.length?callDex+putDex:null,
   gammaCoverage:gammaRows.length,deltaCoverage:deltaRows.length};
 },[rows]);
 useEffect(()=>{setHistory([]);setPrior(null)},[symbol,expiry]);
 useEffect(()=>{
  const call=finite(atm?.call?.iv),put=finite(atm?.put?.iv);
  if(!rows.length||(call===null&&put===null))return;
  const now=new Date(),time=now.toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour12:false});
  setHistory(prev=>[...prev,{time,call,put}].slice(-120));
  const snapshot={at:now.toISOString(),callOI:values.callOI,putOI:values.putOI};
  setPrior(old=>old?{...snapshot,changeCall:snapshot.callOI-old.callOI,changePut:snapshot.putOI-old.putOI,elapsed:Math.max(0,Math.round((now-new Date(old.at))/1000))}:snapshot);
 },[chain,atm,rows.length,values.callOI,values.putOI]);
 const callIV=finite(atm?.call?.iv),putIV=finite(atm?.put?.iv);
 const volumeRows=useMemo(()=>rows.flatMap(r=>[{strike:finite(r.strike_price),side:"CE",...r.call},{strike:finite(r.strike_price),side:"PE",...r.put}]).filter(r=>finite(r.volume)!==null).sort((a,b)=>b.volume-a.volume).slice(0,8),[rows]);
 const maxVol=Math.max(1,...volumeRows.map(r=>finite(r.volume)||0));
 const atmStraddle=finite(atm?.call?.ltp)!==null&&finite(atm?.put?.ltp)!==null?Number(atm.call.ltp)+Number(atm.put.ltp):null;
 const ready=rows.length>0;
 return <div className="qt-operational-workspace qt-options-analytics" data-terminal-panel="ANALYTICS">
  <div className="qt-operational-header"><div><small>DERIVATIVES / OPTIONS INTELLIGENCE</small><h2>{symbol} · Options Analytics</h2><p>Unified analytics workspace · {expiry||"Expiry not confirmed"} · {ready?rows.length+" strikes received":"Awaiting provider chain"}</p></div><div className="qt-options-actions"><span className="qt-options-asof">{chain?.received_at?"SOURCE "+new Date(chain.received_at).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"}):"SOURCE TIME UNAVAILABLE"}</span><button type="button" onClick={onRefresh}>↻ Refresh chain</button><Link href="/options">Full Options Desk ↗</Link></div></div>
  <nav className="qt-options-nav" aria-label="Options analytics views">{TABS.map(t=><button key={t} type="button" aria-pressed={view===t} onClick={()=>setView(t)}>{t}</button>)}</nav>
  {!ready?<Empty title="NO VERIFIED OPTION-CHAIN SNAPSHOT">{chainError||"Select an NSE F&O underlying and refresh. Analytics are withheld until provider data arrives."} <Link href="/options">Open Options Desk</Link></Empty>:<>
   {view==="OVERVIEW"&&<>
    <div className="qt-operational-metrics">
     <Metric label="SPOT" value={spot===null?"—":"₹"+n(spot)} detail="Provider-reported underlying"/>
     <Metric label="CALL OPEN INTEREST" value={compact(values.callOI)} detail="Selected expiry · provider units"/>
     <Metric label="PUT OPEN INTEREST" value={compact(values.putOI)} detail="Selected expiry · provider units"/>
     <Metric label="PUT/CALL OI" value={values.oiPcr===null?"—":values.oiPcr.toFixed(3)+"×"} detail="PE OI ÷ CE OI"/>
     <Metric label="CALL VOLUME" value={compact(values.callVol)} detail="Selected chain"/>
     <Metric label="PUT VOLUME" value={compact(values.putVol)} detail="Selected chain"/>
     <Metric label="ATM IV · CALL / PUT" value={callIV===null&&putIV===null?"—":n(callIV)+" / "+n(putIV)} detail="Provider IV units; not rescaled"/>
     <Metric label="ATM STRADDLE" value={atmStraddle===null?"—":"₹"+n(atmStraddle)} detail="ATM CE LTP + PE LTP"/>
    </div>
    <Section title="OI concentration by strike" detail="Call OI on the left · put OI on the right · nearest strike to spot highlighted"><StrikeProfile rows={rows} spot={spot}/></Section>
    <div className="qt-operational-caveat">OI is outstanding contracts, not buyer/seller intent. This view uses the selected expiry only. <Link href="/options">Open full option chain ↗</Link></div>
   </>}
   {view==="GAMMA LAB"&&<><div className="qt-operational-metrics">
    <Metric label="CALL GAMMA × OI" value={values.callGamma===null?"—":n(values.callGamma)} detail="Calculated from provider gamma fields"/>
    <Metric label="PUT GAMMA × OI" value={values.putGamma===null?"—":n(values.putGamma)} detail="Calculated from provider gamma fields"/>
    <Metric label="NET GAMMA INPUT SUM" value={values.netGamma===null?"—":n(values.netGamma)} detail="Not dealer positioning or standardized GEX"/>
    <Metric label="GAMMA FIELD COVERAGE" value={values.gammaCoverage+"/"+rows.length} detail="Strikes with at least one gamma field"/>
   </div><Section title="Gamma levels and exposure profile" detail="Requires validated contract gamma, lot size, multiplier and documented dealer-side assumptions">
    <Empty title={values.netGamma===null?"GAMMA INPUTS NOT PROVIDED":"GEX ENGINE NOT YET VALIDATED"}>{values.netGamma===null?"The current option-chain response does not contain contract gamma fields. Flip, call wall, put wall, pin and GEX are therefore withheld.":"Raw gamma × OI is shown above for diagnostics only. Standardized GEX, gamma flip, walls, pin pressure and HHI require lot-size scaling, sign conventions and independent validation before publication."}</Empty>
   </Section></>}
   {view==="DELTA & FLOW"&&<><div className="qt-operational-metrics">
    <Metric label="CALL DELTA × OI" value={values.callDex===null?"—":n(values.callDex)} detail="Provider delta fields, if present"/>
    <Metric label="PUT DELTA × OI" value={values.putDex===null?"—":n(values.putDex)} detail="Provider delta fields, if present"/>
    <Metric label="NET DELTA INPUT SUM" value={values.netDex===null?"—":n(values.netDex)} detail="Not signed dealer inventory"/>
    <Metric label="DELTA FIELD COVERAGE" value={values.deltaCoverage+"/"+rows.length} detail="Strikes with at least one delta field"/>
    <Metric label="OI CHANGE · CALL" value={prior?.changeCall==null?"—":(prior.changeCall>0?"+":"")+compact(prior.changeCall)} detail={prior?"Browser-observed interval · "+prior.elapsed+"s":"Second snapshot required"}/>
    <Metric label="OI CHANGE · PUT" value={prior?.changePut==null?"—":(prior.changePut>0?"+":"")+compact(prior.changePut)} detail="Browser-observed interval, not since open"/>
   </div><Section title="Most active contracts" detail="Volume-ranked within the selected expiry; no aggressor-side inference">
    {volumeRows.length?<div className="qt-options-volume-list">{volumeRows.map((r,i)=><div key={r.strike+"-"+r.side}><span>{r.strike} {r.side}</span><div><i style={{width:((finite(r.volume)||0)/maxVol*100)+"%"}}/></div><b>{compact(r.volume)}</b></div>)}</div>:<Empty title="VOLUME UNAVAILABLE">Provider returned no valid contract volume.</Empty>}
   </Section><Section title="Flow classification" detail="Trade-level evidence is required for aggressor balance and opening/closing classification"><Empty title="TRADE-LEVEL FLOW NOT CONNECTED">This feed snapshot provides chain OI and volume only. Buyer/seller aggressor balance, OI rotation by minute, long/short buildup and futures buildup are not inferred from OI alone.</Empty></Section></>}
   {view==="VOLATILITY"&&<><div className="qt-operational-metrics">
    <Metric label="ATM CALL IV" value={callIV===null?"—":n(callIV)} detail="Provider units unchanged"/>
    <Metric label="ATM PUT IV" value={putIV===null?"—":n(putIV)} detail="Provider units unchanged"/>
    <Metric label="ATM STRADDLE" value={atmStraddle===null?"—":"₹"+n(atmStraddle)} detail="Call + put premium"/>
    <Metric label="UPPER BREAKEVEN" value={atmStraddle===null||spot===null?"—":"₹"+n(spot+atmStraddle)} detail="Spot + ATM straddle premium"/>
    <Metric label="LOWER BREAKEVEN" value={atmStraddle===null||spot===null?"—":"₹"+n(spot-atmStraddle)} detail="Spot − ATM straddle premium"/>
   </div><OptionIVAnalytics chain={rows} spot={spot} expiry={expiry} history={history} marketOpen={duringNseSession()} lastUpdated={chain?.received_at&&Number.isFinite(Date.parse(chain.received_at))?chain.received_at:null}/><Section title="IV surface and realized volatility" detail="Current chain snapshot plus browser-session IV observations"><Empty title="HISTORICAL IV / RV BASELINE NOT CONNECTED">The IV trace starts during this browser visit. A historical option-chain archive and aligned underlying return series are required for a defensible IV surface, term structure, skew history and realized-volatility comparison.</Empty></Section></>}
   {view==="REPLAY"&&<Section title="Historical replay" detail="Synchronized historical chain, Greeks, OI and spot snapshots">
    <Empty title="HISTORICAL OPTION SNAPSHOTS NOT CONNECTED">The terminal currently receives a current chain snapshot. Minute-by-minute historical option quotes and OI are required for true replay. No historical chain is reconstructed from current data.</Empty>
   </Section>}
   {view==="QUICK WIDGETS"&&<div className="qt-options-widget-grid">
    <Section title="OI · Top Builds & Unwinds" detail="BASIC · configurable 5–60 minute lookback"><Empty title="SECOND SNAPSHOT REQUIRED">The browser-observed OI comparison is shown in Delta & Flow. Durable minute snapshots are needed for exchange-session lookbacks.</Empty></Section>
    <Section title="Unusual Volume" detail="PRO · time-of-day normalized"><Empty title="HISTORICAL BASELINE REQUIRED">Relative volume requires a time-of-day historical average or median. Current volume rank alone is not an unusual-volume signal.</Empty></Section>
    <Section title="Straddle · Decay Clock" detail="PRO · comparable time-to-expiry sessions"><Metric label="CURRENT ATM STRADDLE" value={atmStraddle===null?"—":"₹"+n(atmStraddle)} detail="Current snapshot only"/><p>Historical comparable-session decay is not connected.</p></Section>
    <Section title="OI · Index Futures Buildup" detail="BASIC · futures price, OI and volume"><Empty title="FUTURES SNAPSHOT NOT CONNECTED">Index futures price/OI snapshots are not included in this option-chain response.</Empty></Section>
    <Section title="Pin · Pressure" detail="PRO · transparent 0–100 score"><Empty title="PIN MODEL NOT VALIDATED">No conviction score is displayed until GEX, expiry context and scoring weights are independently validated.</Empty></Section>
    <Section title="IV · ATM IV, Straddle & RV" detail="BASIC · implied vs realized volatility"><Metric label="ATM IV CALL / PUT" value={callIV===null&&putIV===null?"—":n(callIV)+" / "+n(putIV)} detail="Provider values"/><Metric label="ATM STRADDLE" value={atmStraddle===null?"—":"₹"+n(atmStraddle)} detail="Current premium"/><p>Historical realized-volatility comparison requires aligned underlying history.</p></Section>
   </div>}
   <OptionOIProfile rows={rows} spot={spot} expiry={expiry} symbol={symbol} receivedAt={chain?.received_at||null}/>
   <p className="qt-operational-caveat">Data integrity: observed provider fields are separated from model outputs. Missing fields are never treated as zero. GEX/DEX dealer positioning, aggressor flow, historical replay and time-of-day baselines remain unavailable until their required data and calculation services are connected.</p>
  </>}
 </div>;
}
export function TerminalRiskWorkspace({symbol,candles,historyError}){
 const [confidence,setConfidence]=useState("95"),[windowSize,setWindowSize]=useState("750");
 const stats=useMemo(()=>computeTerminalRisk(candles,confidence==="99"?0.99:0.95,Number(windowSize)),[candles,confidence,windowSize]);
 return <div className="qt-operational-workspace" data-terminal-panel="RISK">
  <div className="qt-operational-header"><div><small>QUANTITATIVE RISK / VERIFIED HISTORICAL RETURNS</small><h2>{symbol} · Historical Risk Monitor</h2><p>Empirical interval risk estimates from available intraday prices. Not a portfolio-level VaR forecast.</p></div><Link href="/backtest">Open strategy backtester ↗</Link></div>
  <div className="qt-operational-filters">
   <label>Confidence <select aria-label="VaR confidence level" value={confidence} onChange={e=>setConfidence(e.target.value)}><option value="95">95%</option><option value="99">99%</option></select></label>
   <label>Observations <select aria-label="Risk lookback intervals" value={windowSize} onChange={e=>setWindowSize(e.target.value)}><option value="250">250 intervals</option><option value="750">750 intervals</option><option value="1500">1,500 intervals</option></select></label>
  </div>
  {!stats.ready?<div className="qt-operational-empty" role="status">{historyError||("Insufficient verified history: "+stats.samples+"/30 valid consecutive 5-minute observations.")} Risk measures are withheld rather than filled with sample numbers.</div>:
   <div className="qt-operational-metrics">
    <Metric label={confidence+"% HISTORICAL VAR"} value={pct(stats.varPct)} detail="Empirical 5-minute loss threshold"/>
    <Metric label="EXPECTED SHORTFALL" value={pct(stats.expectedShortfallPct)} detail="Average worst-tail interval loss"/>
    <Metric label="INTERVAL VOLATILITY" value={pct(stats.volatilityPct)} detail="Sample std. dev., 5-minute returns"/>
    <Metric label="MAX OBSERVED DRAWDOWN" value={pct(stats.maxDrawdownPct)} detail="Within contiguous intraday runs"/>
    <Metric label="WORST INTERVAL" value={pct(stats.worstPct)} detail="Historical observation"/>
    <Metric label="BEST INTERVAL" value={pct(stats.bestPct)} detail="Historical observation"/>
    <Metric label="POSITIVE INTERVALS" value={pct(stats.positivePct)} detail="Fraction of positive intervals"/>
    <Metric label="VALID INTERVALS" value={n(stats.samples)} detail="Overnight returns excluded"/>
   </div>}
   <p className="qt-operational-caveat">{stats.note} No return series is generated when source prices are missing. <Link href="/backtest">Run full historical strategy tests ↗</Link></p>
 </div>;
}
