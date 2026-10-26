"use client";
import { useEffect,useState } from "react";
import { ResponsiveContainer,LineChart,Line,CartesianGrid,XAxis,YAxis,Tooltip,Legend } from "recharts";
const PANEL="rounded-xl border border-white/10 bg-[#10141c] p-4";
const display=x=>Number.isFinite(Number(x))?Number(x).toLocaleString("en-IN",{maximumFractionDigits:2}):"—";
const symbols=[["RELIANCE","NSE_EQ|INE002A01018"],["HDFCBANK","NSE_EQ|INE040A01034"],["NIFTY 50","NSE_INDEX|Nifty 50"]];
export default function TradingTerminal(){
  const [key,setKey]=useState(symbols[0][1]),[lookback,setLookback]=useState(15),[expiry,setExpiry]=useState(""),[volume,setVolume]=useState(null),[chain,setChain]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const refresh=async()=>{setBusy(true);setError("");setVolume(null);setChain(null);
    try{
      const jobs=[fetch("/api/terminal?mode=volume&instrument="+encodeURIComponent(key)+"&lookback="+lookback,{cache:"no-store"}).then(async r=>({ok:r.ok,data:await r.json()}))];
      if(expiry)jobs.push(fetch("/api/terminal?mode=chain&instrument="+encodeURIComponent(key)+"&expiry="+expiry,{cache:"no-store"}).then(async r=>({ok:r.ok,data:await r.json()})));
      const results=await Promise.all(jobs);if(results[0].ok)setVolume(results[0].data);else setError(results[0].data.error);
      if(results[1]){if(results[1].ok)setChain(results[1].data);else setError(e=>[e,results[1].data.error].filter(Boolean).join(" · "));}
    }catch(e){setError("Unable to connect to market-data gateway.");}finally{setBusy(false);}};
  useEffect(()=>{refresh();},[key,lookback,expiry]);
  const points=volume?.points||[];
  const latest=[...points].reverse().find(p=>p.today!==null);
  return <main className="mx-auto max-w-[1600px] px-4 py-8 text-[#e6eaf2]">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-[#e3be4f]">AHQ / Markets</p><h1 className="mt-1 text-3xl font-semibold">Trading Terminal</h1><p className="mt-2 text-sm text-slate-400">Upstox-powered research workspace · Data shown only when confirmed</p></div><span className="rounded border border-amber-600/50 px-3 py-2 font-mono text-xs text-amber-300">RESEARCH ONLY · NO EXECUTION</span></div>
    <div className={PANEL+" mb-4 flex flex-wrap items-end gap-4"}>
      <label className="text-sm">Instrument<select aria-label="Instrument" className="mt-1 block rounded bg-[#080b10] p-2" value={key} onChange={e=>setKey(e.target.value)}>{symbols.map(([name,id])=><option value={id} key={id}>{name}</option>)}</select></label>
      <label className="text-sm">Reference sessions<select aria-label="Lookback" className="mt-1 block rounded bg-[#080b10] p-2" value={lookback} onChange={e=>setLookback(Number(e.target.value))}>{[5,10,15,20,30].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      <label className="text-sm">Option expiry<input aria-label="Expiry" type="date" className="mt-1 block rounded bg-[#080b10] p-2" value={expiry} onChange={e=>setExpiry(e.target.value)}/></label>
      <button onClick={refresh} disabled={busy} className="rounded bg-[#e3be4f] px-4 py-2 font-semibold text-black disabled:opacity-50">{busy?"Loading":"Refresh"}</button>
      <span className="ml-auto text-xs text-slate-400">No simulated prices or volumes</span>
    </div>
    {error&&<div role="alert" className="mb-4 rounded border border-amber-500/50 p-3 text-sm text-amber-200">{error}</div>}
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <section className={PANEL}><h2 className="font-semibold">Intraday cumulative volume · Today vs historical</h2><p className="mb-4 text-xs text-slate-400">NSE-local minutes · {lookback} completed sessions · last confirmed minute only</p>
      {points.length?<div className="h-[360px] w-full"><ResponsiveContainer><LineChart data={points}><CartesianGrid stroke="#243042" strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fill:"#aab3c3",fontSize:10}} interval={59}/><YAxis tick={{fill:"#aab3c3",fontSize:10}} tickFormatter={n=>Number(n).toLocaleString("en-IN",{notation:"compact"})}/><Tooltip contentStyle={{background:"#10141c",border:"1px solid #344054"}} formatter={v=>display(v)}/><Legend/><Line dot={false} connectNulls={false} type="monotone" dataKey="today" stroke="#39bdf0" name="Today's volume"/><Line dot={false} type="monotone" dataKey="mean" stroke="#e3be4f" name="Historical mean"/><Line dot={false} type="monotone" dataKey="median" stroke="#a78bfa" name="Historical median"/></LineChart></ResponsiveContainer></div>:<div className="flex h-[360px] items-center justify-center text-slate-400">Historical volume awaiting verified Upstox data</div>}
      <div className="mt-3 flex flex-wrap gap-4 text-sm"><span>Today: <b>{display(latest?.today)}</b></span><span>Historical mean: <b>{display(latest?.mean)}</b></span><span>RVOL: <b>{latest?.rvol==null?"—":latest.rvol.toFixed(2)+"×"}</b></span><span>Eligible sessions: <b>{volume?.eligibleSessions??"—"}</b></span></div>
      </section>
      <section className={PANEL}><h2 className="font-semibold">Level 2 · Bid / Ask Depth</h2><p className="mt-1 text-xs text-slate-400">Independent ladder · pending verified Upstox depth-feed entitlement</p><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded bg-emerald-950/30 p-3">BEST BID<div className="mt-2 text-2xl">—</div></div><div className="rounded bg-red-950/30 p-3">BEST ASK<div className="mt-2 text-2xl">—</div></div></div><div className="mt-5 rounded border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Depth is not connected. No fabricated ladder or liquidity imbalance will be shown.</div><div className="mt-3 text-xs text-slate-500">5/30-level depth requires validated Market Data Feed V3 subscriptions and permissions.</div></section>
    </div>
    <section className={PANEL+" mt-4 overflow-x-auto"}><h2 className="font-semibold">Options chain · Upstox</h2><p className="mb-4 mt-1 text-xs text-slate-400">Select expiry to request live API snapshot; updates occur on refresh.</p>
      {chain?.rows?.length?<table className="w-full min-w-[850px] text-right font-mono text-xs"><thead className="border-b border-white/10 text-slate-400"><tr>{["CE OI","CE LTP","CE IV","CE Δ","STRIKE","PE Δ","PE IV","PE LTP","PE OI"].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{chain.rows.map((x,i)=><tr key={x.strike+"-"+i} className="border-b border-white/5"><td className="p-2">{display(x.call?.market_data?.oi)}</td><td className="p-2">{display(x.call?.market_data?.ltp)}</td><td className="p-2">{display(x.call?.option_greeks?.iv)}</td><td className="p-2">{display(x.call?.option_greeks?.delta)}</td><td className="p-2 text-[#e3be4f]">{display(x.strike)}</td><td className="p-2">{display(x.put?.option_greeks?.delta)}</td><td className="p-2">{display(x.put?.option_greeks?.iv)}</td><td className="p-2">{display(x.put?.market_data?.ltp)}</td><td className="p-2">{display(x.put?.market_data?.oi)}</td></tr>)}</tbody></table>:<div className="rounded border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No verified option-chain snapshot. Select a valid expiry with an authenticated Upstox connection.</div>}
      <p className="mt-4 text-xs text-slate-500">Last fetched: {chain?.fetchedAt?new Date(chain.fetchedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"—"} · Live websocket streaming not yet connected</p>
    </section>
  </main>;
}
