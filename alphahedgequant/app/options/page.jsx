"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

const INDICES = [
  { id: "NIFTY", label: "NIFTY 50", lot: 75 },
  { id: "BANKNIFTY", label: "BANK NIFTY", lot: 35 },
  { id: "FINNIFTY", label: "FIN NIFTY", lot: 65 },
];
const STOCKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"];
const LOT_DEFAULT = { RELIANCE: 250, TCS: 175, HDFCBANK: 550, INFY: 400, ICICIBANK: 700, SBIN: 750 };

const fmtNum = (n) => {
  if (n == null) return "–";
  const a = Math.abs(n);
  if (a >= 1e7) return (n / 1e7).toFixed(2) + "Cr";
  if (a >= 1e5) return (n / 1e5).toFixed(2) + "L";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("en-IN");
};
const fmtPx = (n) => (n == null ? "–" : Number(n).toFixed(2));

function demoChain(underlying, spot) {
  const step = underlying === "BANKNIFTY" ? 100 : underlying === "NIFTY" ? 50 : underlying === "FINNIFTY" ? 50 : 20;
  const atm = Math.round(spot / step) * step;
  const strikes = [];
  for (let k = atm - step * 10; k <= atm + step * 10; k += step) {
    const dist = Math.abs(k - spot);
    const callItm = spot > k;
    const putItm = spot < k;
    const callLtp = Math.max(0.5, callItm ? (spot - k) + 40 * Math.exp(-dist / (step * 6)) : 40 * Math.exp(-dist / (step * 6)));
    const putLtp = Math.max(0.5, putItm ? (k - spot) + 40 * Math.exp(-dist / (step * 6)) : 40 * Math.exp(-dist / (step * 6)));
    const oiBase = Math.round(80000 * Math.exp(-dist / (step * 5)) + Math.random() * 20000);
    strikes.push({
      strike_price: k,
      call: { ltp: +callLtp.toFixed(2), change: +(Math.random() * 20 - 10).toFixed(2), volume: Math.round(oiBase * 1.5), oi: oiBase + Math.round(Math.random() * 10000), oi_change: Math.round((Math.random() - 0.5) * 30000), iv: +(12 + dist / step).toFixed(2), delta: +(callItm ? 0.5 + 0.4 * (1 - Math.exp(-dist / (step * 4))) : 0.5 * Math.exp(-dist / (step * 4))).toFixed(3), gamma: 0.0008, theta: -(5 + Math.random() * 5), vega: 8 + Math.random() * 4 },
      put: { ltp: +putLtp.toFixed(2), change: +(Math.random() * 20 - 10).toFixed(2), volume: Math.round(oiBase * 1.3), oi: oiBase + Math.round(Math.random() * 10000), oi_change: Math.round((Math.random() - 0.5) * 30000), iv: +(12 + dist / step).toFixed(2), delta: +(putItm ? -(0.5 + 0.4 * (1 - Math.exp(-dist / (step * 4)))) : -0.5 * Math.exp(-dist / (step * 4))).toFixed(3), gamma: 0.0008, theta: -(5 + Math.random() * 5), vega: 8 + Math.random() * 4 },
    });
  }
  return strikes;
}
const DEMO_SPOT = { NIFTY: 24850, BANKNIFTY: 53200, FINNIFTY: 24100, RELIANCE: 1328, TCS: 3420, HDFCBANK: 1690, INFY: 1560, ICICIBANK: 1280, SBIN: 820 };

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
  const [chain, setChain] = useState(null);
  const [spot, setSpot] = useState(0);
  const [expiries, setExpiries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");
  const [legs, setLegs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef(null);

  const lotSize = useMemo(() => {
    const idx = INDICES.find((i) => i.id === underlying);
    if (idx) return idx.lot;
    return LOT_DEFAULT[underlying] || 1;
  }, [underlying]);

  const loadChain = useCallback(async (ul, exp, isRefresh = false) => {
    if (!isRefresh) setStatus("loading");
    try {
      const url = `${API}/api/option-chain/${ul}${exp ? `?expiry=${exp}` : ""}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.success && j.data?.strikes?.length) {
        setChain(j.data.strikes);
        setSpot(j.data.spot_price || 0);
        setExpiries(j.data.expiries || []);
        if (!exp && j.data.expiry) setExpiry(j.data.expiry);
        setStatus("live");
        setErrMsg("");
      } else {
        const ds = DEMO_SPOT[ul] || 1000;
        setChain(demoChain(ul, ds));
        setSpot(ds);
        setExpiries(["(demo)"]);
        setStatus(j.spot_price ? "demo" : "expired");
        setErrMsg(j.error || "Live options data unavailable — showing a demo chain.");
      }
    } catch (e) {
      const ds = DEMO_SPOT[ul] || 1000;
      setChain(demoChain(ul, ds));
      setSpot(ds);
      setStatus("error");
      setErrMsg("Backend unreachable — showing a demo chain.");
    }
  }, []);

  useEffect(() => { loadChain(underlying, ""); }, [underlying, loadChain]);
  useEffect(() => { if (expiry && expiry !== "(demo)") loadChain(underlying, expiry); }, [expiry, underlying, loadChain]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh && status === "live" && tab === "chain") {
      timerRef.current = setInterval(() => {
        if (!document.hidden) loadChain(underlying, expiry, true);
      }, 8000);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh, status, tab, underlying, expiry, loadChain]);

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
    setLegs((L) => [...L, { id: Date.now() + Math.random(), side, type, strike, premium: premium || 0, lots: 1, lotSize }]);
    setTab("builder");
  };

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <p className="eyebrow mb-3">[ AHQ : DERIVATIVES — OPTION CHAIN &amp; STRATEGY BUILDER ]</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Options Desk</h1>
          <p className="text-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
            Live NSE option chains for indices and stocks (Upstox), with a Sensibull-style strategy builder —
            payoff, breakevens, and net Greeks. Click any LTP in the chain to add it as a leg.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setTab("chain")} className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${tab === "chain" ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>OPTION CHAIN</button>
          <button onClick={() => setTab("builder")} className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${tab === "builder" ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>STRATEGY BUILDER{legs.length ? ` (${legs.length})` : ""}</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {INDICES.map((i) => (
          <button key={i.id} onClick={() => { setUnderlying(i.id); setExpiry(""); }}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${underlying === i.id ? "border-amber text-amber bg-amber/[0.04]" : "border-line text-muted hover:text-body"}`}>
            {i.label}
          </button>
        ))}
        <span className="text-muted/40 mx-1">|</span>
        {STOCKS.map((s) => (
          <button key={s} onClick={() => { setUnderlying(s); setExpiry(""); }}
            className={`font-mono text-[11px] px-2.5 py-1.5 rounded border transition-colors ${underlying === s ? "border-amber text-amber bg-amber/[0.04]" : "border-line text-muted hover:text-body"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted tracking-wider">SPOT</span>
          <span className="font-mono text-2xl font-bold text-body">{spot ? spot.toLocaleString("en-IN") : "–"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-gain animate-pulse" : status === "demo" || status === "expired" ? "bg-amber" : status === "loading" ? "bg-muted" : "bg-loss"}`} />
          <span className="font-mono text-[11px] text-muted">
            {status === "live" ? "Live · Upstox" : status === "loading" ? "Loading…" : status === "expired" ? "Token expired — demo data" : status === "demo" ? "Market closed — demo data" : "Demo data"}
          </span>
        </div>
        {status === "live" && (
          <button onClick={() => setAutoRefresh((a) => !a)} className={`font-mono text-[10px] px-2 py-0.5 rounded border ${autoRefresh ? "border-gain/40 text-gain" : "border-line text-muted"}`}>
            {autoRefresh ? "AUTO-REFRESH ON" : "AUTO-REFRESH OFF"}
          </button>
        )}
        {status === "expired" && (
          <a href={`${API}/auth/login`} target="_blank" rel="noreferrer" className="font-mono text-[10px] px-2 py-0.5 rounded border border-amber/40 text-amber hover:bg-amber/10">
            RE-AUTH UPSTOX →
          </a>
        )}
      </div>

      {errMsg && (status === "expired" || status === "error") && (
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
    return <div className="mt-6 h-40 rounded-lg border border-line bg-surface flex items-center justify-center text-muted font-mono text-sm">No chain data.</div>;
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
                  <td onClick={() => onAdd("BUY", "CE", row.strike_price, c.ltp)} className="py-1.5 px-2 text-right text-body font-semibold cursor-pointer hover:text-amber" title="Click to add as Buy CE leg">{fmtPx(c.ltp)}</td>
                  <td className={`py-1.5 px-2 text-center font-bold ${isATM ? "text-amber" : "text-body"}`}>{row.strike_price}</td>
                  <td onClick={() => onAdd("BUY", "PE", row.strike_price, p.ltp)} className="py-1.5 px-2 text-left text-body font-semibold cursor-pointer hover:text-amber" title="Click to add as Buy PE leg">{fmtPx(p.ltp)}</td>
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
        Green shading = ITM calls · red = ITM puts · amber row = ATM. Click a LTP to add it to the strategy builder. {status === "demo" || status === "expired" ? "Demo values shown." : "Auto-refreshes every 8s."}
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
    if (!row) return 0;
    return (type === "CE" ? row.call?.ltp : row.put?.ltp) || 0;
  }, [chain]);

  const step = underlying === "BANKNIFTY" ? 100 : 50;

  const applyPreset = (key) => {
    const mk = (side, type, strike) => ({ id: Date.now() + Math.random(), side, type, strike, premium: ltpAt(strike, type) || 50, lots: 1, lotSize });
    if (key === "long_straddle") setLegs([mk("BUY", "CE", atm), mk("BUY", "PE", atm)]);
    else if (key === "short_straddle") setLegs([mk("SELL", "CE", atm), mk("SELL", "PE", atm)]);
    else if (key === "bull_call") setLegs([mk("BUY", "CE", atm), mk("SELL", "CE", atm + step * 2)]);
    else if (key === "bear_put") setLegs([mk("BUY", "PE", atm), mk("SELL", "PE", atm - step * 2)]);
    else if (key === "iron_condor") setLegs([mk("SELL", "PE", atm - step * 2), mk("BUY", "PE", atm - step * 4), mk("SELL", "CE", atm + step * 2), mk("BUY", "CE", atm + step * 4)]);
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
        t += sign * (o.theta || 0) * l.lots;
        v += sign * (o.vega || 0) * l.lots;
      }
    }
    return found ? { delta: d, gamma: g, theta: t, vega: v } : null;
  }, [legs, chain]);

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_1.1fr] gap-6">
      <div className="space-y-4">
        <div>
          <p className="font-mono text-xs text-muted tracking-wider mb-2">PRESETS</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([k, label]) => (
              <button key={k} onClick={() => applyPreset(k)} className="font-mono text-[10px] px-2.5 py-1 rounded border border-line text-muted hover:border-amber/40 hover:text-amber transition-colors">{label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-muted tracking-wider">LEGS ({legs.length})</p>
          <div className="flex gap-1.5">
            <button onClick={() => setLegs((L) => [...L, { id: Date.now() + Math.random(), side: "BUY", type: "CE", strike: atm, premium: ltpAt(atm, "CE") || 50, lots: 1, lotSize }])} className="font-mono text-[10px] px-2 py-1 rounded border border-amber/40 text-amber hover:bg-amber/10">+ ADD LEG</button>
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
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">MAX PROFIT</p>
                <p className="font-mono text-sm font-bold text-gain">{payoff.maxProfit > 1e6 ? "Unlimited" : "₹" + Math.round(payoff.maxProfit).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-line bg-surface">
                <p className="font-mono text-[9px] text-muted tracking-wider mb-0.5">MAX LOSS</p>
                <p className="font-mono text-sm font-bold text-loss">{payoff.maxLoss < -1e6 ? "Unlimited" : "₹" + Math.round(payoff.maxLoss).toLocaleString("en-IN")}</p>
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
