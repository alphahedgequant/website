"use client";
import {useEffect,useMemo,useState} from "react";
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend} from "recharts";
import {ALPHA_PRESETS,OPERATORS,parseFormula,runAlphaResearch} from "@/lib/alphaLabEngine.mjs";
import "./alpha-lab.css";

const TICKERS="RELIANCE,TCS,HDFCBANK,ICICIBANK,INFY,SBIN,ITC,LT";
const fmt=(v,d=2)=>v==null||!Number.isFinite(v)?"—":Number(v).toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>v==null||!Number.isFinite(v)?"—":fmt(v)+"%";
const stats=[
 ["sharpe","Sharpe ratio","annualised"],
 ["sortino","Sortino ratio","downside deviation"],
 ["annReturn","Annualised return","% geometric"],
 ["drawdown","Max drawdown","% peak-to-trough"],
 ["meanIC","Mean rank IC","daily Spearman"],
 ["tStat","Return t-statistic","sample statistic"],
 ["turnover","Daily turnover","% one-way"],
 ["beta","Market beta","equal-weight basket"],
];
const help=[
 ["Matrix transforms","Cross-sectional at each date","rank, zscore, normalize, scale"],
 ["Rolling statistics","Past observations only","ts_mean, ts_std_dev, ts_zscore, ts_rank, ts_corr, ts_cov, ts_beta"],
 ["Higher mathematics","Moments and information theory","ts_autocorr, ts_skewness, ts_kurtosis, ts_entropy, ts_decay_linear"],
 ["Delay and arithmetic","Controlled lookbacks","delay, ts_delta, ts_sum, ts_min, ts_max, ts_arg_max, ts_arg_min, log, exp, power"],
];
function download(name,body,mime){
 const url=URL.createObjectURL(new Blob([body],{type:mime}));
 const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function EquityTooltip({active,payload,label}){
 if(!active||!payload?.length)return null;
 return <div className="al-tooltip"><b>{label}</b>{payload.map(p=><span key={p.name} style={{color:p.color}}>{p.name}: {pct((p.value-1)*100)}</span>)}</div>;
}
export default function AlphaLabPage(){
 const [preset,setPreset]=useState(0);
 const [formula,setFormula]=useState(ALPHA_PRESETS[0].formula);
 const [tickers,setTickers]=useState(TICKERS);
 const [costBps,setCostBps]=useState(5);
 const [activeTab,setActiveTab]=useState("RESULTS");
 const [operatorQuery,setOperatorQuery]=useState("");
 const [result,setResult]=useState(null);
 const [inputMeta,setInputMeta]=useState(null);
 const [notice,setNotice]=useState("");
 const [loading,setLoading]=useState(false);
 const [runLabel,setRunLabel]=useState("Idle");
 const [showGuide,setShowGuide]=useState(true);
 const [showEquation,setShowEquation]=useState(true);
 const [graph,setGraph]=useState("equity");
 useEffect(()=>{try{
   const saved=JSON.parse(localStorage.getItem("ahq-alpha-lab-v1")||"null");
   if(typeof saved?.formula==="string"&&saved.formula.length<=2000)setFormula(saved.formula);
   if(typeof saved?.tickers==="string"&&saved.tickers.length<=160)setTickers(saved.tickers);
 }catch{}},[]);
 useEffect(()=>{try{localStorage.setItem("ahq-alpha-lab-v1",JSON.stringify({formula,tickers}));}catch{}},[formula,tickers]);
 const parsed=useMemo(()=>{try{parseFormula(formula);return{valid:true,message:"Syntax valid"};}catch(e){return{valid:false,message:e.message};}},[formula]);
 const symbols=useMemo(()=>[...new Set(tickers.toUpperCase().split(",").map(s=>s.trim()).filter(Boolean))],[tickers]);
 const canRun=parsed.valid&&symbols.length>=4&&symbols.length<=8&&symbols.every(s=>/^[A-Z][A-Z0-9&._-]{0,25}$/.test(s))&&Number.isFinite(Number(costBps))&&costBps>=0&&costBps<=100;
 const onRun=async()=>{
  if(!canRun||loading)return;
  setLoading(true);setNotice("");setResult(null);setInputMeta(null);setRunLabel("Fetching historical daily OHLCV");
  try{
   const response=await fetch("/api/alpha-lab/prices?symbols="+encodeURIComponent(symbols.join(",")),{cache:"no-store"});
   const payload=await response.json();
   if(!response.ok||!payload.success)throw Error(payload.error||"Historical prices unavailable.");
   setRunLabel("Evaluating rolling matrices");
   await new Promise(resolve=>setTimeout(resolve,20));
   const output=runAlphaResearch(formula,payload.series,Number(costBps));
   setResult(output);setInputMeta(payload);setActiveTab("RESULTS");setRunLabel("Historical test completed");
  }catch(e){setRunLabel("No valid result");setNotice(e?.message||"Simulation failed. No metrics generated.");}
  finally{setLoading(false);}
 };
 const choosePreset=i=>{setPreset(i);setFormula(ALPHA_PRESETS[i].formula);setResult(null);setInputMeta(null);setNotice("");};
 const editorKeys=e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();onRun();}
  if(e.key==="Tab"){e.preventDefault();const start=e.currentTarget.selectionStart,end=e.currentTarget.selectionEnd;
   setFormula(formula.slice(0,start)+"  "+formula.slice(end));
   requestAnimationFrame(()=>{e.target.selectionStart=e.target.selectionEnd=start+2;});
  }
 };
 const filtered=useMemo(()=>OPERATORS.filter(x=>x.toLowerCase().includes(operatorQuery.toLowerCase())),[operatorQuery]);
 const insertOperator=op=>{setFormula(f=>f+(f.trim()?"\n":"")+op);setNotice("Inserted operator signature. Replace placeholders with data fields and numeric windows.");};
 const exportCsv=()=>{if(!result)return;
  const rows=["date,strategy_index,benchmark_index,daily_net_return,one_way_turnover",...result.curve.map(r=>[r.date,r.strategy,r.benchmark,r.daily,r.turnover].join(","))];
  download("AHQ-alpha-research.csv",rows.join("\n"),"text/csv;charset=utf-8");
 };
 const exportConfig=()=>download("AHQ-alpha-formula.json",JSON.stringify({
   formula,tickers:symbols,frequency:"1d",signalAt:"close(t)",executeAt:"open(t+1)",
   costBps:Number(costBps),notes:"Survivorship-free and adjusted-price validation not established."
 },null,2),"application/json");
 const plot=useMemo(()=>{
  if(!result)return[];
  if(graph==="equity")return result.curve;
  let peak=1,benchPeak=1;
  return result.curve.map(r=>{peak=Math.max(peak,r.strategy);benchPeak=Math.max(benchPeak,r.benchmark);
   return{date:r.date,strategy:(r.strategy/peak-1)*100,benchmark:(r.benchmark/benchPeak-1)*100};});
 },[result,graph]);

 return <div className="al-root">
  <div className="al-masthead">
   <div><div className="al-eyebrow"><span className="al-pulse"/> ALPHAHEDGEQUANT / RESEARCH SYSTEMS / 01</div>
    <h1>Alpha <em>Research Lab</em></h1>
    <p>Model the signal. Test the distribution. Distrust the backtest.</p>
   </div>
   <div className="al-mast-actions"><span className="al-series">∑ &nbsp; Cross-sectional intelligence</span><span className="al-mode">NSE · DAILY OHLCV</span>
    <button type="button" onClick={exportConfig} className="al-secondary-btn">Export formula ↓</button></div>
  </div>
  <div className="al-main">
   <section className="al-editor-side" aria-label="Alpha expression editor">
    <div className="al-bar"><span className="al-bar-title"><i/> ALPHA WORKSPACE <small>/ EXPRESSION</small></span><span className="al-tiny">EDITOR / V1</span></div>
    <div className="al-form-controls">
     <label><span>RESEARCH HYPOTHESIS</span><select value={preset} onChange={e=>choosePreset(Number(e.target.value))}>
      {ALPHA_PRESETS.map((a,i)=><option key={a.name} value={i}>{String(i+1).padStart(2,"0")} · {a.name}</option>)}</select></label>
     <label><span>TRANSACTION COST</span><div className="al-cost"><input type="number" min="0" max="100" step="1" value={costBps} onChange={e=>setCostBps(e.target.value)}/><span>bps / traded $</span></div></label>
    </div>
    <div className="al-theory"><div className="al-theory-head"><span>MODEL MOTIVATION</span>
     <button onClick={()=>setShowEquation(!showEquation)} type="button">{showEquation?"HIDE":"SHOW"} EQUATION</button></div>
     <p>{ALPHA_PRESETS[preset].theory}</p>{showEquation&&<div className="al-math">{ALPHA_PRESETS[preset].math}</div>}
    </div>
    <div className="al-code-shell">
     <div className="al-code-header"><span><i/> alpha_{String(preset+1).padStart(3,"0")}.formula</span>
      <span className={parsed.valid?"al-ok":"al-err"}>{parsed.valid?"✓ Parsed":"⚠ Invalid"} · {formula.length} chars</span></div>
     <div className="al-code-area"><div className="al-gutter" aria-hidden="true">
      {Array.from({length:Math.max(12,formula.split("\n").length)},(_,i)=><span key={i}>{i+1}</span>)}</div>
      <textarea value={formula} onChange={e=>{setFormula(e.target.value);setResult(null);setInputMeta(null);setNotice("");}}
       onKeyDown={editorKeys} autoCapitalize="none" spellCheck={false} aria-label="Mathematical alpha expression"
       placeholder="rank(-ts_zscore(ts_delta(log(close),5),60))"/></div>
     <div className="al-code-footer"><span>SAFE DSL · NO EVAL</span><span className={parsed.valid?"al-ok":"al-err"}>{parsed.message}</span></div>
    </div>
    <div className="al-universe"><label htmlFor="al-symbols">CROSS-SECTIONAL UNIVERSE <span>4–8 NSE stocks · comma separated</span></label>
     <input id="al-symbols" value={tickers} onChange={e=>{setTickers(e.target.value);setResult(null);setInputMeta(null);}} spellCheck={false}/>
     <div className="al-tags">{symbols.map((s,i)=><span key={s}>{String(i+1).padStart(2,"0")} {s}</span>)}</div>
    </div>
    <div className="al-run-row"><button type="button" onClick={onRun} disabled={!canRun||loading} className="al-run">
     {loading?"◌ RUNNING RESEARCH…":"▶ SIMULATE ALPHA"}<span>⌘ / Ctrl + Enter</span></button>
     <span className="al-run-state">{runLabel}</span></div>
    {notice&&<div role="alert" className="al-alert">{notice}</div>}
    <div className="al-detail-toggle"><button type="button" onClick={()=>setShowGuide(!showGuide)}>{showGuide?"−":"+"} MODEL CONSTRUCTION NOTES</button></div>
    {showGuide&&<div className="al-guide">
      <div><b>01 — Signal</b><span>Use daily OHLCV and past observations. A score is not a prediction.</span></div>
      <div><b>02 — Execution</b><span>Signal at close(t), enter at open(t+1), observe return to open(t+2). No lookahead.</span></div>
      <div><b>03 — Portfolio</b><span>Top third +100% long, bottom third −100% short. 200% gross exposure, daily rebalance.</span></div>
      <div><b>04 — Friction</b><span>Configurable fee on position changes; borrow, spread, impact and financing excluded.</span></div>
    </div>}
   </section>
   <section className="al-results-side" aria-label="Alpha research output">
    <div className="al-bar al-results-bar"><span className="al-bar-title"><i/> RESEARCH DIAGNOSTICS <small>/ DATA-DRIVEN</small></span>
     <span className="al-status">{result?"● HISTORICAL TEST COMPLETE":"○ NOT SIMULATED"}</span></div>
    <div className="al-nav-tabs" role="tablist" aria-label="Research diagnostics">
     {["RESULTS","YEARLY","VALIDATION","OPERATORS"].map(tab=><button type="button" key={tab} role="tab"
       aria-selected={activeTab===tab} onClick={()=>setActiveTab(tab)} className={activeTab===tab?"active":""}>{tab}</button>)}
    </div>
    {activeTab==="OPERATORS"?<div className="al-functions">
     <div className="al-result-heading"><div><span className="al-section-id">00 / REFERENCE</span><h2>Operator library</h2></div><span>{OPERATORS.length} functions & fields</span></div>
     <p className="al-muted">Evaluated locally in the browser. Windows must be integer literals from 2–252 (delay and lag permit 1).</p>
     <input aria-label="Search operators" placeholder="Search a mathematical function..." value={operatorQuery} onChange={e=>setOperatorQuery(e.target.value)} className="al-op-search"/>
     <div className="al-op-list">{filtered.map((op,i)=><button type="button" key={op} onClick={()=>insertOperator(op)}
       title="Append operator signature"><span>{String(i+1).padStart(2,"0")}</span>{op}<b>+</b></button>)}</div>
     {help.map(([title,desc,body])=><div className="al-function-guide" key={title}><strong>{title}</strong><span>{desc}</span><p>{body}</p></div>)}
    </div>:
    !result?<div className="al-empty-state">
     <div className="al-empty-orbit"><span>α</span><i/><i/><i/></div>
     <span>AWAITING REAL MARKET DATA</span><h2>From formula<br/>to evidence.</h2>
     <p>Choose a mathematical model, select NSE stocks, and run against overlapping daily historical bars. We do not invent Sharpe ratios or backtest returns.</p>
     <div className="al-empty-formula">E[rₚ] = Σᵢ wᵢ,ₜ · (Oᵢ,ₜ₊₂ / Oᵢ,ₜ₊₁ − 1) − λ‖Δwₜ‖₁</div>
     <div className="al-empty-grid">{["Real OHLCV data","Next-open execution","Risk-adjusted metrics","Per-year diagnostics"].map((s,i)=><span key={s}>0{i+1} &nbsp; {s}</span>)}</div>
    </div>:
    activeTab==="RESULTS"?<div className="al-diagnostics">
     <div className="al-result-heading"><div><span className="al-section-id">01 / AGGREGATE PERFORMANCE</span><h2>Signal evaluation</h2></div>
      <span>{result.period.first} → {result.period.last}</span></div>
     <div className="al-metric-grid">{stats.map(([key,title,detail])=><div className="al-metric" key={key}>
      <span>{title}</span><strong>{["annReturn","drawdown","turnover"].includes(key)?pct(result.metrics[key]):fmt(result.metrics[key],key==="meanIC"?3:2)}</strong>
      <small>{detail}</small></div>)}</div>
     <div className="al-result-heading al-chart-heading"><div><span className="al-section-id">02 / FORWARD EXECUTION PATH</span><h2>{graph==="equity"?"Equity index":"Drawdown"}</h2></div>
      <div className="al-segment"><button type="button" className={graph==="equity"?"on":""} onClick={()=>setGraph("equity")}>Equity</button>
       <button type="button" className={graph==="drawdown"?"on":""} onClick={()=>setGraph("drawdown")}>Drawdown</button></div></div>
     <div className="al-chart"><ResponsiveContainer width="100%" height={255}><LineChart data={plot}>
      <CartesianGrid stroke="#203144" strokeDasharray="3 5" vertical={false}/>
      <XAxis dataKey="date" tick={{fill:"#8c9aaa",fontSize:10}} tickFormatter={x=>String(x).slice(5)} minTickGap={50} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:"#8c9aaa",fontSize:10}} tickFormatter={v=>graph==="equity"?fmt((v-1)*100,0)+"%":fmt(v,0)+"%"} width={62} axisLine={false} tickLine={false}/>
      <Tooltip content={graph==="equity"?<EquityTooltip/>:undefined} formatter={graph==="drawdown"?(v,name)=>[pct(v),name]:undefined}/>
      <Legend verticalAlign="top" align="right" iconType="plainline" height={26}/>
      <Line dataKey="strategy" name="Alpha L/S" stroke="#78bafc" strokeWidth={2.3} dot={false} isAnimationActive={false}/>
      <Line dataKey="benchmark" name="Equal-weight long" stroke="#c9d5e3" strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
     </LineChart></ResponsiveContainer></div>
     <div className="al-foot-grid">{[["HIT RATE",pct(result.metrics.hitRate)],["ANNUALISED VOL",pct(result.metrics.volatility)],
       ["INFORMATION RATIO",fmt(result.metrics.informationRatio)],["OBSERVATIONS",result.metrics.observations]].map(([k,v])=>
       <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
     <button type="button" className="al-export" onClick={exportCsv}>↓ Export historical equity and daily returns (CSV)</button>
    </div>:
    activeTab==="YEARLY"?<div className="al-diagnostics">
     <div className="al-result-heading"><div><span className="al-section-id">03 / TEMPORAL STABILITY</span><h2>Year-by-year results</h2></div><span>Net of configured fees</span></div>
     <div className="al-table-scroll"><table className="al-table"><thead><tr><th>Year</th><th>Days</th><th>Alpha L/S</th><th>Equal-weight</th><th>Difference</th></tr></thead><tbody>
      {result.byYear.map(y=><tr key={y.year}><td>{y.year}</td><td>{y.days}</td><td>{pct(y.return)}</td><td>{pct(y.benchmark)}</td><td>{pct(y.return-y.benchmark)}</td></tr>)}
     </tbody></table></div>
     <div className="al-evidence"><b>Why yearly decomposition matters</b><p>High aggregate Sharpe can hide one exceptional regime. Compare yearly stability. Short partial years are not annualised here.</p></div>
     <div className="al-equation-panel"><span>RETURN ESTIMATOR</span><div>Rᵧ = ∏ₜ∈ᵧ(1 + rₜ,net) − 1</div><p>Next-open forward returns. Daily dollar-neutral ranking with fixed nominal fee.</p></div>
    </div>:
    <div className="al-diagnostics">
     <div className="al-result-heading"><div><span className="al-section-id">04 / VALIDITY GATES</span><h2>Research quality checks</h2></div><span>Internal checks, not BRAIN criteria</span></div>
     <div className="al-checks">{result.checks.map((check,i)=><div key={i} className="al-check">
      <span className={"al-check-tag "+check.status}>{check.status==="pass"?"✓":check.status==="warning"?"!":check.status==="pending"?"○":"×"}</span>
      <div><strong>{check.label}</strong><small>{check.status.toUpperCase()}</small></div></div>)}</div>
     <div className="al-evidence"><b>Data provenance</b><p>{inputMeta?.source}. The NSE basket is based on today's selection, not historical point-in-time membership. Price adjustments, borrow costs, slippage, financing and exchange fees have not been audited. Research prototype only.</p></div>
     <div className="al-table-scroll"><table className="al-table"><thead><tr><th>Symbol</th><th>Historical rows</th><th>Last bar</th></tr></thead><tbody>
      {Object.entries(inputMeta?.meta||{}).map(([symbol,m])=><tr key={symbol}><td>{symbol}</td><td>{m.count}</td><td>{String(m.last||"").slice(0,10)}</td></tr>)}
     </tbody></table></div>
     <div className="al-evidence"><b>Before production use</b><p>Require independent corporate-action-adjusted prices, survivorship-free universe, untouched out-of-sample data, correlation to an alpha library, capacity modelling and realistic execution costs. Syntax passing does not establish economic validity.</p></div>
    </div>}
   </section>
  </div>
  <div className="al-footer-note"><span>AHQ / ALPHA RESEARCH LAB 1.0</span><span>Independent research · Not affiliated with WorldQuant BRAIN · Educational simulation only</span></div>
 </div>;
}