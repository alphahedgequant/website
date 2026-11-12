"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import OptionIVAnalytics from "@/components/OptionIVAnalytics";
import {computeTerminalRisk} from "@/lib/terminalRisk.mjs";
const finite=x=>x!==null&&x!==undefined&&x!==""&&Number.isFinite(Number(x))?Number(x):null;
const total=(rows,side,key)=>rows.reduce((sum,r)=>sum+(finite(r?.[side]?.[key])??0),0);
const n=x=>x===null||!Number.isFinite(x)?"—":x.toLocaleString("en-IN",{maximumFractionDigits:2});
const pct=x=>x===null||!Number.isFinite(x)?"—":x.toFixed(2)+"%";
function duringNseSession(){
 const fields=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
  weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date())
  .map(x=>[x.type,x.value]));
 const minutes=Number(fields.hour)*60+Number(fields.minute);
 return !["Sat","Sun"].includes(fields.weekday)&&minutes>=555&&minutes<930;
}
function Metric({label,value,detail}){
 return <div className="qt-operational-metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
export function TerminalOptionAnalytics({symbol,chain,chainError,onRefresh}){
 const [history,setHistory]=useState([]);
 const rows=useMemo(()=>Array.isArray(chain?.strikes)?chain.strikes:[],[chain]);
 const spot=finite(chain?.spot_price);
 const expiry=chain?.expiry||"";
 const atm=useMemo(()=>rows.reduce((best,r)=>spot===null||finite(r.strike_price)===null?best:!best||Math.abs(Number(r.strike_price)-spot)<Math.abs(Number(best.strike_price)-spot)?r:best,null),[rows,spot]);
 const values=useMemo(()=>{
  const callOI=total(rows,"call","oi"),putOI=total(rows,"put","oi");
  const callVol=total(rows,"call","volume"),putVol=total(rows,"put","volume");
  return {callOI,putOI,callVol,putVol,oiPcr:callOI>0?putOI/callOI:null,volPcr:callVol>0?putVol/callVol:null};
 },[rows]);
 useEffect(()=>setHistory([]),[symbol,expiry]);
 useEffect(()=>{
  const call=finite(atm?.call?.iv),put=finite(atm?.put?.iv);
  if(!rows.length||(call===null&&put===null))return;
  const now=new Date(),time=now.toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour12:false});
  setHistory(prev=>[...prev,{time,call,put}].slice(-120));
 },[chain,atm,rows.length]);
 return <div className="qt-operational-workspace" data-terminal-panel="ANALYTICS">
  <div className="qt-operational-header"><div><small>DERIVATIVES / QUANT ANALYTICS</small><h2>{symbol} · Volatility & Open Interest</h2><p>Calculated exclusively from the latest retrieved NSE option-chain snapshot. No synthetic option prices or invented flow prints.</p></div>
   <button type="button" onClick={onRefresh}>↻ Refresh option chain</button>
  </div>
  {!rows.length?<div className="qt-operational-empty" role="status">{chainError||"No verified option-chain data yet. Select an NSE F&O ticker and refresh."} <Link href="/options">Open Options Desk</Link></div>:
   <>
    <div className="qt-operational-metrics">
     <Metric label="CALL OPEN INTEREST" value={n(values.callOI)} detail="Provider-reported contracts"/>
     <Metric label="PUT OPEN INTEREST" value={n(values.putOI)} detail="Provider-reported contracts"/>
     <Metric label="PUT/CALL OI RATIO" value={values.oiPcr===null?"—":values.oiPcr.toFixed(3)+"×"} detail="Observed puts / calls"/>
     <Metric label="PUT/CALL VOLUME RATIO" value={values.volPcr===null?"—":values.volPcr.toFixed(3)+"×"} detail="Today's traded volume ratio"/>
     <Metric label="CALL VOLUME" value={n(values.callVol)} detail="Summed visible strikes"/>
     <Metric label="PUT VOLUME" value={n(values.putVol)} detail="Summed visible strikes"/>
     <Metric label="ATM CALL IV" value={finite(atm?.call?.iv)===null?"—":n(finite(atm.call.iv))} detail="Provider units, unchanged"/>
     <Metric label="ATM PUT IV" value={finite(atm?.put?.iv)===null?"—":n(finite(atm.put.iv))} detail="Provider units, unchanged"/>
    </div>
    <OptionIVAnalytics chain={rows} spot={spot} expiry={expiry} history={history} marketOpen={duringNseSession()} lastUpdated={chain?.received_at&&Number.isFinite(Date.parse(chain.received_at))?chain.received_at:null}/>
    <p className="qt-operational-caveat">The ATM IV history begins during this browser visit only. OI ratios describe positioning, not buyer-initiated trades. Changes may remain unavailable when the broker feed is offline.</p>
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
