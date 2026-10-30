"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import OptionIVAnalytics from "@/components/OptionIVAnalytics";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

const API = "/api/market";
function isRegularNseSession(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).map(p=>[p.type,p.value]));
 const t=Number(parts.hour)*60+Number(parts.minute);
 return parts.weekday!=="Sat"&&parts.weekday!=="Sun"&&t>=555&&t<930;
}

const INDICES = [
  { id: "NIFTY", label: "NIFTY 50", lot: 75 },
  { id: "BANKNIFTY", label: "BANK NIFTY", lot: 35 },
  { id: "FINNIFTY", label: "FIN NIFTY", lot: 65 },
];
const STOCKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"];


const fmtNum = (n) => {
  if (n == null) return "–";
  const a = Math.abs(n);
  if (a >= 1e7) return (n / 1e7).toFixed(2) + "Cr";
  if (a >= 1e5) return (n / 1e5).toFixed(2) + "L";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("en-IN");
};
const fmtPx = (n) => (n == null ? "–" : Number(n).toFixed(2));

function legPayoffAtExpiry(leg, spotAtExpiry) {
  const qty = leg.lots * leg.lotSize;
  let intrinsic = 0;
  if (leg.type === "CE") intrinsic = Math.max(0, spotAtExpiry - leg.strike);
  else intrinsic = Math.max(0, leg.strike - spotAtExpiry);
  const perUnit = leg.side === "BUY" ? (intrinsic - leg.premium) : (leg.premium - intrinsic);
  return perUnit * qty;
}

export default function OptionsPage() {
  const [tab, setTab] = useState("chain");
  const [underlying, setUnderlying] = useState("NIFTY");
  const [expiry, setExpiry] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [stockOptions, setStockOptions] = useState([]);
  const [symbolFeedState, setSymbolFeedState] = useState("loading");
  const [chain, setChain] = useState(null);
  const [spot, setSpot] = useState(0);
  const [expiries, setExpiries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");
  const [legs, setLegs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);
  const [chainLotSize,setChainLotSize] = useState(null);
  const [providerReceivedAt,setProviderReceivedAt] = useState(null);
  const [sessionOpen,setSessionOpen] = useState(false);
  const [lastUpdated,setLastUpdated] = useState(null);
  const [ivHistory,setIvHistory] = useState([]);
  const [refreshing,setRefreshing] = useState(false);

  const lotSize = useMemo(() => {
    const idx = INDICES.find((i) => i.id === underlying);
    if (idx) return chainLotSize || idx.lot;
    return chainLotSize || 1;
  }, [underlying, chainLotSize]);

  const loadChain = useCallback(async (ul, exp, isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    if (!isRefresh) { setStatus("loading"); setChain(null); setSpot(0); setExpiries([]); setChainLotSize(null); setErrMsg(""); } else {setRefreshing(true);}
    try {
      const url = `${API}/option-chain/${ul}${exp ? `?expiry=${exp}` : ""}`;
      const r = await fetch(url, { cache: "no-store" });
      const raw = await r.text();
      let j;
      try { j = JSON.parse(raw); }
      catch { throw new Error(`The market-data API returned an invalid response (HTTP ${r.status}).`); }
      const errorText = [j?.error,j?.message,j?.errorCode,JSON.stringify(j?.errors||"")].filter(Boolean).join(" ");
      if (r.status === 401 || /invalid token|token expired|access token|unauthori[sz]ed|upstox.*401/i.test(errorText)) {
        if (requestId === requestIdRef.current) {
          setChain(null);setSpot(0);setStatus("expired");
          setErrMsg("Upstox rejected the backend access token. Reconnect Upstox to restore option-chain data.");
        }
        return;
      }
      if (!r.ok) throw new Error(`Market-data API HTTP ${r.status}: ${r.status >= 500 ? "Backend API error" : "Request rejected"}.`);
      if (requestId !== requestIdRef.current) return;
      if (j.success && j.data?.strikes?.length) {
        const verifiedLot = Number(j.data?.lot_size ?? j.data?.lotSize);
        setChainLotSize(Number.isSafeInteger(verifiedLot) && verifiedLot > 0 ? verifiedLot : null);
        setChain(j.data.strikes);
        if (!isRefresh) window.dispatchEvent(new CustomEvent("ahq:analytics",{detail:{name:"option_chain_opened"}}));
        setProviderReceivedAt(j.data.received_at||null);
        setSpot(j.data.spot_price || 0);
        setExpiries(j.data.expiries || []);
        if (!exp && j.data.expiry) setExpiry(j.data.expiry);
        setStatus("live");
        setErrMsg("");
        setLastUpdated(Date.now());
        if(isRegularNseSession()){
          const near=[...j.data.strikes].filter(row=>Number.isFinite(Number(row.strike_price))).sort((a,b)=>Math.abs(a.strike_price-j.data.spot_price)-Math.abs(b.strike_price-j.data.spot_price))[0];
          const cv=near?.call?.iv,pv=near?.put?.iv;
          if(near&&(cv!=null||pv!=null))setIvHistory(prev=>[...prev,{time:new Date().toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour12:false}),call:cv==null?null:Number(cv),put:pv==null?null:Number(pv)}].slice(-160));
        }
      } else {
        setChain(null);
        setSpot(0);
        setStatus("unavailable");
        setErrMsg("The backend returned no option chain. Check Upstox authentication first; then verify F&O eligibility and the instrument mapping.");
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setChain(null);
      setSpot(0);
      setStatus("error");
      setErrMsg(e instanceof TypeError ? "Cannot contact market-data API." : e.message || "Market-data request failed.");
    } finally {
      if(requestId===requestIdRef.current)setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active=true;
    fetch("/api/market/screener", {cache:"no-store"})
      .then(r=>r.json())
      .then(j=>{if(active){setStockOptions(Array.isArray(j?.data)?j.data:[]);setSymbolFeedState("ready");}})
      .catch(()=>{if(active)setSymbolFeedState("unavailable");});
    return ()=>{active=false;};
  },[]);
  const matches=useMemo(()=>{
    const q=stockQuery.trim().toLowerCase();
    if(!q)return [];
    return stockOptions.filter(x=>String(x.symbol||"").toLowerCase().includes(q) || String(x.name||"").toLowerCase().includes(q)).slice(0,12);
  },[stockQuery,stockOptions]);
  const chooseUnderlying=useCallback(value=>{
    const symbol=String(value||"").trim().toUpperCase();
    if(!/^[A-Z0-9._-]{1,40}$/.test(symbol))return;
    requestIdRef.current++;
    setExpiry("");setLegs([]);setStockQuery("");setIvHistory([]);setLastUpdated(null);setProviderReceivedAt(null);setUnderlying(symbol);
  },[]);
  useEffect(() => { loadChain(underlying, ""); }, [underlying, loadChain]);
  useEffect(() => { if (expiry && expiry !== "(demo)") loadChain(underlying, expiry); }, [expiry, underlying, loadChain]);

  useEffect(()=>{
    const check=()=>setSessionOpen(isRegularNseSession());
    check();const id=setInterval(check,30000);return()=>clearInterval(id);
  },[]);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh && sessionOpen && status === "live") {
      timerRef.current = setInterval(() => {
        if (!document.hidden) loadChain(underlying, expiry, true);
      }, 5000);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh, sessionOpen, status, underlying, expiry, loadChain]);

  const { atmStrike, maxOI } = useMemo(() => {
    if (!chain?.length) return { atmStrike: null, maxOI: 1 };
    let atm = chain[0].strike_price, best = Infinity, mx = 1;
    for (const row of chain) {
      const d = Math.abs(row.strike_price - spot);
      if (d < best) { best = d; atm = row.strike_price; }
      mx = Math.max(mx, row.call?.oi || 0, row.put?.oi || 0);
    }
    return { atmStrike: atm, maxOI: mx };
  }, [chain, spot]);

  const addLeg = (side, type, strike, premium) => {
    if (!chainLotSize && !INDICES.some(i=>i.id===underlying)) { setErrMsg("Verified contract lot size unavailable from this option-chain response. Strategy legs are disabled to avoid misleading payoff calculations."); return; }
    setLegs((L) => [...L, { id: Date.now() + Math.random(), side, type, strike, premium: premium || 0, lots: 1, lotSize }]);
    window.dispatchEvent(new CustomEvent("ahq:analytics",{detail:{name:"strategy_builder_opened"}}));
    setTab("builder");
  };

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <p className="eyebrow mb-3">[ AHQ : DERIVATIVES — OPTION CHAIN &amp; STRATEGY BUILDER ]</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Options Desk</h1>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setTab("chain")} className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${tab === "chain" ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>OPTION CHAIN</button>
          <button onClick={() => {window.dispatchEvent(new CustomEvent("ahq:analytics",{detail:{name:"strategy_builder_opened"}}));setTab("builder");}} className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${tab === "builder" ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>STRATEGY BUILDER{legs.length ? ` (${legs.length})` : ""}</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {INDICES.map((i) => (
          <button key={i.id} onClick={() => chooseUnderlying(i.id)}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${underlying === i.id ? "border-amber text-amber bg-amber/[0.04]" : "border-line text-muted hover:text-body"}`}>
            {i.label}
          </button>
        ))}
        <span className="text-muted/40 mx-1">|</span>
        {STOCKS.map((s) => (
          <button key={s} onClick={() => chooseUnderlying(s)}
            className={`font-mono text-[11px] px-2.5 py-1.5 rounded border transition-colors ${underlying === s ? "border-amber text-amber bg-amber/[0.04]" : "border-line text-muted hover:text-body"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 border border-line rounded-xl p-4 bg-surface" role="search" aria-label="Search stock option chains">
        <label htmlFor="ahq-option-search" className="text-xs text-amber font-mono uppercase tracking-wider block mb-2">Search any NSE stock or ticker</label>
        <div className="flex gap-2">
          <input id="ahq-option-search" type="search" value={stockQuery} onChange={e=>setStockQuery(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();chooseUnderlying(matches[0]?.symbol||stockQuery);}}}
            placeholder="Example: AXISBANK, ITC, MARUTI…" autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-line bg-raised px-4 py-3 text-body placeholder:text-muted focus-visible:outline-2 focus-visible:outline-amber"/>
          <button type="button" className="btn-primary text-sm" onClick={()=>chooseUnderlying(matches[0]?.symbol||stockQuery)}>View chain</button>
        </div>
        {stockQuery.trim()&&matches.length>0&&<div className="mt-2 max-h-60 overflow-y-auto border border-line rounded-lg divide-y divide-line">
          {matches.map(x=><button key={x.symbol} type="button" onClick={()=>chooseUnderlying(x.symbol)} className="w-full text-left p-3 hover:bg-raised">
            <span className="text-body text-sm font-semibold">{x.symbol}</span><span className="text-muted text-xs ml-3">{x.name||""}</span>
          </button>)}
        </div>}
        {symbolFeedState==="loading"&&<p className="text-xs mt-2 text-muted">Loading stock suggestions…</p>}
        {symbolFeedState==="unavailable"&&<p className="text-xs mt-2 text-muted">Suggestions unavailable; you can enter an exact NSE symbol manually.</p>}
        {symbolFeedState==="ready"&&stockQuery.trim()&&matches.length===0&&<p className="text-xs mt-2 text-muted">No match in the available screener feed. You may still try an exact NSE symbol.</p>}
        <p className="text-xs text-muted mt-3">Selected: <span className="font-semibold text-body">{underlying}</span>. Only NSE F&O-eligible stocks with a supported Upstox chain can return real options data. Search suggestions are not proof of derivatives eligibility.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted tracking-wider">SPOT</span>
          <span className="font-mono text-2xl font-bold text-body">{spot ? spot.toLocaleString("en-IN") : "–"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-gain animate-pulse" : status === "demo" || status === "expired" ? "bg-amber" : status === "loading" ? "bg-muted" : "bg-loss"}`} />
          <span className="font-mono text-[11px] text-muted">
            {status === "live" ? "Upstox chain received" : status === "loading" ? "Loading…" : status === "expired" ? "Upstox login expired" : "No verified chain"}
          </span>
        </div>
        {status === "live" && (
          <button onClick={() => setAutoRefresh((a) => !a)} className={`font-mono text-[10px] px-2 py-0.5 rounded border ${autoRefresh ? "border-gain/40 text-gain" : "border-line text-muted"}`}>
            {autoRefresh ? "AUTO-REFRESH ON" : "AUTO-REFRESH OFF"}
          </button>
        )}
        {status === "expired" && (
          <a href="https://zerohedgequant-backend.onrender.com/auth/login" target="_blank" rel="noreferrer" className="font-mono text-[10px] px-2 py-0.5 rounded border border-amber/40 text-amber hover:bg-amber/10">
            RE-AUTH UPSTOX →
          </a>
        )}
      </div>

      {errMsg && (
        <p className="mt-2 font-mono text-[11px] text-amber/80">{errMsg}</p>
      )}

      {expiries.length > 0 && status === "live" && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {expiries.slice(0, 8).map((e) => (
            <button key={e} onClick={() => setExpiry(e)}
              className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-colors ${expiry === e ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>{sessionOpen ? "Regular NSE session" : "Outside regular NSE hours (holidays not detected)"}</span>
        <span>{providerReceivedAt ? "Backend received "+new Date(providerReceivedAt).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"})+" IST" : "Awaiting verified quotes"}</span>
        <button type="button" onClick={()=>loadChain(underlying,expiry,true)} disabled={refreshing} className="rounded border border-line px-3 py-1.5 hover:text-body disabled:opacity-50">{refreshing?"Refreshing…":"Refresh now"}</button>
      </div>
      <OptionIVAnalytics chain={chain} spot={spot} history={ivHistory} expiry={expiry} marketOpen={sessionOpen} lastUpdated={lastUpdated}/>
      {tab === "chain"
        ? <OptionChainTable chain={chain} spot={spot} atmStrike={atmStrike} maxOI={maxOI} status={status} onAdd={addLeg} />
        : <StrategyBuilder legs={legs} setLegs={setLegs} spot={spot} lotSize={lotSize} underlying={underlying} chain={chain} />}
    </div>
  );
}

function OptionChainTable({ chain, spot, atmStrike, maxOI, status, onAdd }) {
  if (status === "loading") {
    return (
      <div className="mt-6 h-64 rounded-lg border border-line bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!chain?.length) {
    return <div className="mt-6 h-40 rounded-lg border border-line bg-surface flex items-center justify-center text-muted font-mono text-sm">No verified option chain data available for the selected instrument.</div>;
  }
  return (
    <div className="mt-6 rounded-lg border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs font-mono">
          <thead>
            <tr className="text-muted">
              <th colSpan={5} className="py-2 text-center text-gain tracking-wider border-b border-line bg-gain/[0.03]">CALLS</th>
              <th className="py-2 text-center text-muted tracking-wider border-b border-line">STRIKE</th>
              <th colSpan={5} className="py-2 text-center text-loss tracking-wider border-b border-line bg-loss/[0.03]">PUTS</th>
            </tr>
            <tr className="text-muted/70 text-[10px]">
              <th className="py-1.5 px-2 text-right font-normal">OI</th>
              <th className="py-1.5 px-2 text-right font-normal">CHG OI</th>
              <th className="py-1.5 px-2 text-right font-normal">VOL</th>
              <th className="py-1.5 px-2 text-right font-normal">IV</th>
              <th className="py-1.5 px-2 text-right font-normal">LTP</th>
              <th className="py-1.5 px-2 text-center font-normal text-muted">—</th>
              <th className="py-1.5 px-2 text-left font-normal">LTP</th>
              <th className="py-1.5 px-2 text-left font-normal">IV</th>
              <th className="py-1.5 px-2 text-left font-normal">VOL</th>
              <th className="py-1.5 px-2 text-left font-normal">CHG OI</th>
              <th className="py-1.5 px-2 text-left font-normal">OI</th>
            </tr>
          </thead>
          <tbody>
            {chain.map((row) => {
              const isATM = row.strike_price === atmStrike;
              const callItm = spot > row.strike_price;
              const putItm = spot < row.strike_price;
              const c = row.call || {}, p = row.put || {};
              const cOIpct = Math.min(100, ((c.oi || 0) / maxOI) * 100);
              const pOIpct = Math.min(100, ((p.oi || 0) / maxOI) * 100);
              return (
                <tr key={row.strike_price} className={`border-b border-line/40 ${isATM ? "bg-amber/[0.06]" : ""}`}>
                  <td className={`py-1.5 px-2 text-right relative ${callItm ? "bg-gain/[0.04]" : ""}`}>
                    <span className="absolute right-0 top-0 h-full bg-gain/10" style={{ width: `${cOIpct}%` }} />
                    <span className="relative">{fmtNum(c.oi)}</span>
                  </td>
                  <td className={`py-1.5 px-2 text-right ${(c.oi_change || 0) >= 0 ? "text-gain/80" : "text-loss/80"}`}>{fmtNum(c.oi_change)}</td>
                  <td className="py-1.5 px-2 text-right text-muted">{fmtNum(c.volume)}</td>
                  <td className="py-1.5 px-2 text-right text-muted">{c.iv != null ? c.iv : "–"}</td>
                  <td onClick={() => onAdd("BUY", "CE", row.strike_price, c.ltp)} className="py-1.5 px-2 text-right text-body font-semibold cursor-pointer hover:text-amber" title="Click to add as Buy CE leg"><span className="block">{fmtPx(c.ltp)}</span><span className="block text-[9px] text-muted font-normal">B {c.bid_price>0?fmtPx(c.bid_price):"—"} ({fmtNum(c.bid_qty)}) · A {c.ask_price>0?fmtPx(c.ask_price):"—"} ({fmtNum(c.ask_qty)})</span></td>
                  <td className={`py-1.5 px-2 text-center font-bold ${isATM ? "text-amber" : "text-body"}`}>{row.strike_price}</td>
                  <td onClick={() => onAdd("BUY", "PE", row.strike_price, p.ltp)} className="py-1.5 px-2 text-left text-body font-semibold cursor-pointer hover:text-amber" title="Click to add as Buy PE leg"><span className="block">{fmtPx(p.ltp)}</span><span className="block text-[9px] text-muted font-normal">B {p.bid_price>0?fmtPx(p.bid_price):"—"} ({fmtNum(p.bid_qty)}) · A {p.ask_price>0?fmtPx(p.ask_price):"—"} ({fmtNum(p.ask_qty)})</span></td>
                  <td className="py-1.5 px-2 text-left text-muted">{p.iv != null ? p.iv : "–"}</td>
                  <td className="py-1.5 px-2 text-left text-muted">{fmtNum(p.volume)}</td>
                  <td className={`py-1.5 px-2 text-left ${(p.oi_change || 0) >= 0 ? "text-gain/80" : "text-loss/80"}`}>{fmtNum(p.oi_change)}</td>
                  <td className={`py-1.5 px-2 text-left relative ${putItm ? "bg-loss/[0.04]" : ""}`}>
                    <span className="absolute left-0 top-0 h-full bg-loss/10" style={{ width: `${pOIpct}%` }} />
                    <span className="relative">{fmtNum(p.oi)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 font-mono text-[10px] text-muted border-t border-line">
        Green shading = ITM calls · red = ITM puts · amber row = ATM. Bid/ask prices and quantities are shown only when supplied by Upstox; — means unavailable. Click an LTP to add a leg. {status === "demo" || status === "expired" ? "No synthetic option quotes." : "Refreshes during regular NSE hours when enabled."}
      </p>
    </div>
  );
}

const PRESETS = {
  long_straddle: "Long Straddle",
  short_straddle: "Short Straddle",
  bull_call: "Bull Call Spread",
  bear_put: "Bear Put Spread",
  iron_condor: "Iron Condor",
};

function StrategyBuilder({ legs, setLegs, spot, lotSize, underlying, chain }) {
  const updateLeg = (id, field, val) => setLegs((L) => L.map((l) => l.id === id ? { ...l, [field]: field === "lots" ? Math.max(1, parseInt(val) || 1) : field === "premium" || field === "strike" ? parseFloat(val) || 0 : val } : l));
  const removeLeg = (id) => setLegs((L) => L.filter((l) => l.id !== id));
  const clearAll = () => setLegs([]);

  const atm = useMemo(() => {
    if (!chain?.length) return Math.round(spot / 50) * 50;
    let best = Infinity, a = chain[0].strike_price;
    for (const r of chain) { const d = Math.abs(r.strike_price - spot); if (d < best) { best = d; a = r.strike_price; } }
    return a;
  }, [chain, spot]);

  const ltpAt = useCallback((strike, type) => {
    const row = chain?.find((r) => r.strike_price === strike);
    if (!row) return null;
    const px = type === "CE" ? row.call?.ltp : row.put?.ltp;
    return Number.isFinite(Number(px)) && px != null ? Number(px) : null;
  }, [chain]);

  const strikes = (chain||[]).map(r=>Number(r.strike_price)).filter(Number.isFinite).sort((a,b)=>a-b);
  const step = strikes.length>1 ? Math.min(...strikes.slice(1).map((x,i)=>x-strikes[i]).filter(x=>x>0)) : 50;

  const applyPreset = (key) => {
    if(!chain?.length || !spot || !lotSize || (lotSize===1 && !INDICES.some(x=>x.id===underlying)))return;
    const mk = (side, type, strike) => {
      const premium=ltpAt(strike,type);
      return premium===null ? null : {id:Date.now()+Math.random(),side,type,strike,premium,lots:1,lotSize};
    };
    if (key === "long_straddle") setLegs([mk("BUY", "CE", atm), mk("BUY", "PE", atm)].filter(Boolean));
    else if (key === "short_straddle") setLegs([mk("SELL", "CE", atm), mk("SELL", "PE", atm)].filter(Boolean));
    else if (key === "bull_call") setLegs([mk("BUY", "CE", atm), mk("SELL", "CE", atm + step * 2)].filter(Boolean));
    else if (key === "bear_put") setLegs([mk("BUY", "PE", atm), mk("SELL", "PE", atm - step * 2)].filter(Boolean));
    else if (key === "iron_condor") setLegs([mk("SELL", "PE", atm - step * 2), mk("BUY", "PE", atm - step * 4), mk("SELL", "CE", atm + step * 2), mk("BUY", "CE", atm + step * 4)].filter(Boolean));
  };

  const payoff = useMemo(() => {
    if (!legs.length || !spot) return null;
    const lo = Math.round(spot * 0.85), hi = Math.round(spot * 1.15);
    const stepN = Math.max(1, Math.round((hi - lo) / 120));
    const pts = [];
    let netPremium = 0;
    for (const l of legs) {
      const qty = l.lots * l.lotSize;
      netPremium += (l.side === "BUY" ? -l.premium : l.premium) * qty;
    }
    let maxP = -Infinity, minP = Infinity;
    const breakevens = [];
    let prevPL = null, prevX = null;
    for (let x = lo; x <= hi; x += stepN) {
      let pl = 0;
      for (const l of legs) pl += legPayoffAtExpiry(l, x);
      pts.push({ spot: x, pl: Math.round(pl) });
      if (pl > maxP) maxP = pl;
      if (pl < minP) minP = pl;
      if (prevPL !== null && ((prevPL < 0 && pl >= 0) || (prevPL > 0 && pl <= 0))) {
        const be = prevX + (x - prevX) * (0 - prevPL) / (pl - prevPL);
        breakevens.push(Math.round(be));
      }
      prevPL = pl; prevX = x;
    }
    return { pts, maxProfit: maxP, maxLoss: minP, netPremium, breakevens };
  }, [legs, spot]);

  const markToMarket = useMemo(() => {
    if (!legs.length || !chain?.length) return null;
    const marks = legs.map(l => {
      const row=chain.find(r=>Number(r.strike_price)===Number(l.strike));
      const quote=l.type==="CE"?row?.call:row?.put;
      const executableSide=l.side==="BUY"?Number(quote?.bid_price):Number(quote?.ask_price);
      const sideQuote=executableSide>0 ? executableSide : null;
      const ltp=quote?.ltp != null && Number(quote.ltp)>0 ? Number(quote.ltp) : null;
      const mark=sideQuote??ltp;
      if(mark===null || !Number.isFinite(mark)) return {...l,mark:null,pl:null,source:null};
      const quantity=l.lots*l.lotSize;
      const pl=(l.side==="BUY"?1:-1)*(mark-l.premium)*quantity;
      return {...l,mark,pl,source:sideQuote!==null?(l.side==="BUY"?"Bid (sell to close)":"Ask (buy to close)"):"LTP"};
    });
    const complete=marks.every(m=>m.pl!==null);
    return {marks,complete,total:complete?marks.reduce((sum,m)=>sum+m.pl,0):null};
  },[legs,chain]);

  const greeks = useMemo(() => {
    if (!legs.length || !chain) return null;
    let d = 0, g = 0, t = 0, v = 0, found = false;
    for (const l of legs) {
      const row = chain.find((r) => r.strike_price === l.strike);
      const o = row ? (l.type === "CE" ? row.call : row.put) : null;
      if (o && o.delta != null) {
        found = true;
        const sign = l.side === "BUY" ? 1 : -1;
        const qty = l.lots * l.lotSize;
        d += sign * (o.delta || 0) * qty;
        g += sign * (o.gamma || 0) * qty;
        t += sign * (o.theta || 0) * qty;
        v += sign * (o.vega || 0) * qty;
      }
    }
    return found ? { delta: d, gamma: g, theta: t, vega: v } : null;
  }, [legs, chain]);

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_1.1fr] gap-6">
      <div className="space-y-4">
        <div>
          <p className="font-mono text-xs text-muted tracking-wider mb-2">STRATEGY PRESETS · QUOTES REQUIRED</p>
          <p className="text-xs text-muted mb-3">Construct strategies from available strike prices. If an exact leg's quote is missing, do not assume its premium.</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([k, label]) => (
              <button key={k} onClick={() => applyPreset(k)} disabled={!chain?.length} className="disabled:opacity-40 font-mono text-[10px] px-2.5 py-1 rounded border border-line text-muted hover:border-amber/40 hover:text-amber transition-colors">{label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-muted tracking-wider">LEGS ({legs.length})</p>
          <div className="flex gap-1.5">
            <button onClick={() => setLegs((L) => [...L, { id: Date.now() + Math.random(), side: "BUY", type: "CE", strike: atm, premium: ltpAt(atm, "CE") ?? 0, lots: 1, lotSize }])} className="font-mono text-[10px] px-2 py-1 rounded border border-amber/40 text-amber hover:bg-amber/10">+ ADD LEG</button>
            {legs.length > 0 && <button onClick={clearAll} className="font-mono text-[10px] px-2 py-1 rounded border border-line text-muted hover:text-loss">CLEAR</button>}
          </div>
        </div>

        {legs.length === 0 ? (
          <div className="h-40 rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted px-6 text-center">
            <p className="font-display text-base opacity-50">No legs yet</p>
            <p className="text-[11px] mt-1 opacity-40 font-mono">Pick a preset, click + ADD LEG, or click an LTP in the chain.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {legs.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5 p-2 rounded-lg border border-line bg-surface">
                <button onClick={() => updateLeg(l.id, "side", l.side === "BUY" ? "SELL" : "BUY")} className={`font-mono text-[10px] px-2 py-1 rounded w-12 ${l.side === "BUY" ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"}`}>{l.side}</button>
                <button onClick={() => updateLeg(l.id, "type", l.type === "CE" ? "PE" : "CE")} className={`font-mono text-[10px] px-2 py-1 rounded w-9 border ${l.type === "CE" ? "border-gain/40 text-gain" : "border-loss/40 text-loss"}`}>{l.type}</button>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => updateLeg(l.id, "strike", l.strike - step)} className="font-mono text-xs text-muted hover:text-body px-1">−</button>
                  <input value={l.strike} onChange={(e) => updateLeg(l.id, "strike", e.target.value)} className="w-16 bg-raised/40 border border-line rounded px-1.5 py-1 font-mono text-[11px] text-body text-center focus:outline-none focus:border-amber/40" />
                  <button onClick={() => updateLeg(l.id, "strike", l.strike + step)} className="font-mono text-xs text-muted hover:text-body px-1">+</button>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[8px] text-muted/60">PREM</span>
                  <input value={l.premium} onChange={(e) => updateLeg(l.id, "premium", e.target.value)} className="w-14 bg-raised/40 border border-line rounded px-1.5 py-0.5 font-mono text-[11px] text-body focus:outline-none focus:border-amber/40" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[8px] text-muted/60">LOTS</span>
                  <input value={l.lots} onChange={(e) => updateLeg(l.id, "lots", e.target.value)} className="w-10 bg-raised/40 border border-line rounded px-1.5 py-0.5 font-mono text-[11px] text-body focus:outline-none focus:border-amber/40" />
                </div>
                <button onClick={() => removeLeg(l.id)} className="ml-auto font-mono text-xs text-muted hover:text-loss px-1">✕</button>
              </div>
            ))}
          </div>
        )}

        {legs.length>0 && <div className="rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap gap-2 justify-between items-center"><p className="font-mono text-xs text-muted tracking-wider">ESTIMATED LIVE MARK-TO-MARKET</p><span className="text-xs text-muted">Prices refresh with chain</span></div>
          <p className="font-mono text-xl mt-2 font-bold text-body">{markToMarket?.complete ? "₹"+Math.round(markToMarket.total).toLocaleString("en-IN") : "Not available"}</p>
          <p className="text-xs text-muted leading-relaxed mt-2">Theoretical change in value since each leg's saved entry premium. Uses the bid to value long legs and the ask to value short legs when available, otherwise the Upstox last traded price. Excludes brokerage, taxes, slippage and margin. Not account P&L or an executable exit quote.</p>
          <div className="mt-3 divide-y divide-line">{markToMarket?.marks.map(m=><div key={m.id} className="flex flex-wrap gap-2 py-2 items-center justify-between text-xs">
            <span className="text-body">{m.side} {m.strike} {m.type} · {m.lots} lot(s)</span>
            <span className="text-muted">Mark: {m.mark==null?"—":fmtPx(m.mark)} {m.source?"("+m.source+")":""}</span>
            <span className={m.pl==null?"text-muted":m.pl>=0?"text-gain":"text-loss"}>{m.pl==null?"No quote":"₹"+Math.round(m.pl).toLocaleString("en-IN")}</span>
          </div>)}</div>
        </div>}
        {legs.length>0 && <div className="rounded-lg border border-line bg-surface p-3">
          <p className="font-mono text-xs text-muted">BROKER MARGIN REQUIREMENT</p>
          <p className="text-sm font-semibold mt-1 text-body">Not available</p>
          <p className="text-xs text-muted mt-2">Accurate margin needs a broker-backed margin API for the complete strategy and an authenticated account. No margin estimate is invented.</p>
        </div>}
        {greeks && (
          <div className="grid grid-cols-4 gap-2">
            {[["Δ Delta", greeks.delta, 1], ["Γ Gamma", greeks.gamma, 4], ["Θ Theta", greeks.theta, 0], ["V Vega", greeks.vega, 0]].map(([label, val, dp]) => (
              <div key={label} className="p-2 rounded-lg border border-line bg-surface text-center">
                <p className="font-mono text-[9px] text-muted tracking-wider">{label}</p>
                <p className={`font-mono text-sm font-bold ${val >= 0 ? "text-gain" : "text-loss"}`}>{Number(val).toFixed(dp)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {!payoff ? (
          <div className="h-full min-h-[300px] rounded-lg border border-line bg-surface flex items-center justify-center text-muted font-mono text-sm">
            Add legs to see the payoff diagram
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg border border-line bg-surface">
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">P&L HIGH (CHART RANGE)</p>
                <p className="font-mono text-sm font-bold text-gain">{"₹" + Math.round(payoff.maxProfit).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-line bg-surface">
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">P&L LOW (CHART RANGE)</p>
                <p className="font-mono text-sm font-bold text-loss">{"₹" + Math.round(payoff.maxLoss).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-line bg-surface">
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">{payoff.netPremium >= 0 ? "NET CREDIT" : "NET DEBIT"}</p>
                <p className={`font-mono text-sm font-bold ${payoff.netPremium >= 0 ? "text-gain" : "text-loss"}`}>₹{Math.abs(Math.round(payoff.netPremium)).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-line bg-surface">
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">BREAKEVEN</p>
                <p className="font-mono text-sm font-bold text-body">{payoff.breakevens.length ? payoff.breakevens.map((b) => b.toLocaleString("en-IN")).join(", ") : "–"}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-mono text-xs text-muted tracking-wider mb-4">PAYOFF AT EXPIRY</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={payoff.pts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="plGain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2DD482" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2DD482" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="spot" tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(v) => v.toLocaleString("en-IN")} />
                  <YAxis tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}
                    formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "P&L"]}
                    labelFormatter={(l) => `Spot: ${Number(l).toLocaleString("en-IN")}`}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                  <ReferenceLine x={Math.round(spot)} stroke="#F0A93B" strokeDasharray="4 4" label={{ value: "Spot", fill: "#F0A93B", fontSize: 10, fontFamily: "monospace", position: "top" }} />
                  {payoff.breakevens.map((b) => (
                    <ReferenceLine key={b} x={b} stroke="#4f5b7a" strokeDasharray="2 2" />
                  ))}
                  <Area type="monotone" dataKey="pl" stroke="#2DD482" strokeWidth={2} fill="url(#plGain)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="font-mono text-[10px] text-muted mt-2">
                Amber line = current spot ({spot.toLocaleString("en-IN")}). Grey dashed = breakeven(s). P&amp;L is at expiry, per the combined legs. Premiums default to chain LTP — edit any leg above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
