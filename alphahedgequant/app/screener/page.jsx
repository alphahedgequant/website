"use client";
import { useState, useEffect, useCallback } from "react";

const SIGNAL_META = {
  "STRONG BUY":  { color: "text-emerald-400",  bg: "bg-emerald-400/10 border-emerald-400/30",  dot: "bg-emerald-400" },
  "BUY":         { color: "text-green-400",     bg: "bg-green-400/10  border-green-400/30",     dot: "bg-green-400" },
  "WEAK BUY":    { color: "text-teal-400",      bg: "bg-teal-400/10   border-teal-400/30",      dot: "bg-teal-400" },
  "HOLD":        { color: "text-amber-400",     bg: "bg-amber-400/10  border-amber-400/30",     dot: "bg-amber-400" },
  "WEAK SELL":   { color: "text-orange-400",    bg: "bg-orange-400/10 border-orange-400/30",    dot: "bg-orange-400" },
  "SELL":        { color: "text-red-400",       bg: "bg-red-400/10    border-red-400/30",       dot: "bg-red-400" },
  "STRONG SELL": { color: "text-rose-500",      bg: "bg-rose-500/10   border-rose-500/30",      dot: "bg-rose-500" },
};

const STRATEGIES = [
  { id: "all",         label: "All Signals" },
  { id: "STRONG BUY", label: "Strong Buy" },
  { id: "BUY",        label: "Buy" },
  { id: "SELL",       label: "Sell" },
  { id: "STRONG SELL",label: "Strong Sell" },
  { id: "HOLD",       label: "Hold" },
];

const SECTORS = ["All Sectors", "Technology", "Financial", "Energy", "Healthcare", "Consumer Cyclical", "Consumer Defensive", "Industrials", "Basic Materials", "Utilities", "Communication"];

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";
const REFRESH_MS = 5 * 60 * 1000; // 5 min

function SignalBadge({ direction }) {
  const meta = SIGNAL_META[direction] || SIGNAL_META["HOLD"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-mono font-semibold ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {direction}
    </span>
  );
}

function ConfBar({ value }) {
  const bg = value >= 70 ? "bg-emerald-400" : value >= 55 ? "bg-amber-400" : "bg-slate-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-400">{value}%</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      {[40, 80, 60, 50, 40, 50, 50, 50].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-white/10 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function ScannerPage() {
  const [signals, setSignals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState("all");
  const [sector, setSector]       = useState("All Sectors");
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState({ col: "direction", dir: "asc" });
  const [lastFetch, setLastFetch] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [selected, setSelected]   = useState(null);   // detail panel

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/scanner/signals`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "API error");
      setSignals(json.data || []);
      setLastFetch(new Date());
      setCountdown(REFRESH_MS / 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastFetch]);

  // Filter + sort
  const filtered = signals
    .filter(s =>
      (filter === "all" || s.direction === filter) &&
      (sector === "All Sectors" || s.sector === sector) &&
      (search === "" || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const ORDER = { "STRONG BUY": 0, "BUY": 1, "WEAK BUY": 2, "HOLD": 3, "WEAK SELL": 4, "SELL": 5, "STRONG SELL": 6 };
      if (sort.col === "direction") {
        const diff = (ORDER[a.direction] ?? 3) - (ORDER[b.direction] ?? 3);
        return sort.dir === "asc" ? diff : -diff;
      }
      if (sort.col === "confidence") return sort.dir === "asc" ? a.confidence - b.confidence : b.confidence - a.confidence;
      if (sort.col === "rsi")       return sort.dir === "asc" ? (a.rsi || 0) - (b.rsi || 0) : (b.rsi || 0) - (a.rsi || 0);
      if (sort.col === "symbol")    return sort.dir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      return 0;
    });

  const toggleSort = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const buys  = signals.filter(s => s.direction.includes("BUY")).length;
  const sells = signals.filter(s => s.direction.includes("SELL")).length;
  const holds = signals.filter(s => s.direction === "HOLD").length;
  const sentiment = buys > sells ? "RISK-ON" : sells > buys ? "RISK-OFF" : "NEUTRAL";

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      {/* Header */}
      <p className="eyebrow mb-3">[ AHQ : SCANNER — LIVE SIGNALS ]</p>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Signal Scanner</h1>
          <p className="text-muted text-sm mt-1.5">
            5-strategy composite signals across 50 NSE stocks · refreshes every 5 min
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <p className="font-mono text-xs text-muted">
              Next refresh in <span className="text-amber">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
            </p>
          )}
          <button
            onClick={fetchSignals}
            disabled={loading}
            className="px-3 py-1.5 rounded border border-line text-sm text-muted hover:text-amber hover:border-amber/40 transition-colors font-mono disabled:opacity-40"
          >
            {loading ? "scanning..." : "↻ refresh"}
          </button>
        </div>
      </div>

      {/* Sentiment bar */}
      {!loading && signals.length > 0 && (
        <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-emerald-400">{buys}</p>
              <p className="text-xs text-muted mt-0.5">BUY signals</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-amber">{holds}</p>
              <p className="text-xs text-muted mt-0.5">HOLD</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-red-400">{sells}</p>
              <p className="text-xs text-muted mt-0.5">SELL signals</p>
            </div>
          </div>
          <div>
            <span className={`font-mono text-sm font-semibold px-3 py-1.5 rounded border ${
              sentiment === "RISK-ON"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                : sentiment === "RISK-OFF"
                ? "border-red-400/30 bg-red-400/10 text-red-400"
                : "border-amber/30 bg-amber/10 text-amber"
            }`}>
              MARKET SENTIMENT: {sentiment}
            </span>
          </div>
          {/* Breadth bar */}
          <div className="w-full">
            <div className="flex rounded-full overflow-hidden h-2">
              <div className="bg-emerald-400 transition-all" style={{ width: `${(buys  / signals.length) * 100}%` }} />
              <div className="bg-amber-400 transition-all"   style={{ width: `${(holds / signals.length) * 100}%` }} />
              <div className="bg-red-400 transition-all"     style={{ width: `${(sells / signals.length) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-emerald-400">{Math.round((buys / signals.length) * 100)}% bullish</span>
              <span className="font-mono text-[10px] text-red-400">{Math.round((sells / signals.length) * 100)}% bearish</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search symbol or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/[0.03] border border-line rounded px-3 py-1.5 text-sm text-body placeholder:text-muted font-mono focus:outline-none focus:border-amber/40 w-52"
        />
        <div className="flex gap-1 flex-wrap">
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors font-mono ${
                filter === s.id ? "border-amber text-amber" : "border-line text-muted hover:text-body"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="bg-white/[0.03] border border-line rounded px-3 py-1.5 text-sm text-muted font-mono focus:outline-none focus:border-amber/40"
        >
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Strategy legend */}
      <div className="mt-4 p-3 rounded border border-white/5 bg-white/[0.01]">
        <p className="font-mono text-[10px] text-muted tracking-wider mb-2">COMPOSITE SIGNAL — 5 STRATEGIES (majority vote)</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted font-mono">
          {["EMA Cross (9/21)", "RSI Extremes (<35 / >65)", "Z-Score Mean Rev (±1.8σ)", "Bollinger Band", "20-Day Momentum (±4%)"].map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">
          ⚠ {error} — Render may be waking up (cold start ~50s). Try refreshing.
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {[
                { col: "symbol",     label: "Symbol" },
                { col: null,         label: "Name" },
                { col: "direction",  label: "Signal" },
                { col: "confidence", label: "Confidence" },
                { col: null,         label: "Price" },
                { col: "rsi",        label: "RSI" },
                { col: null,         label: "Z-Score" },
                { col: null,         label: "Mom 20d" },
                { col: null,         label: "Entry / Stop / Target" },
              ].map(({ col, label }) => (
                <th
                  key={label}
                  onClick={() => col && toggleSort(col)}
                  className={`px-4 py-3 text-left font-mono text-[11px] text-muted tracking-wider ${col ? "cursor-pointer hover:text-amber" : ""}`}
                >
                  {label} {col && sort.col === col ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted font-mono text-sm">
                  No signals match filters
                </td>
              </tr>
            )}
            {!loading && filtered.map(s => (
              <tr
                key={s.symbol}
                onClick={() => setSelected(sel => sel?.symbol === s.symbol ? null : s)}
                className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                  selected?.symbol === s.symbol ? "bg-amber/5" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-sm font-semibold text-body">{s.symbol}</td>
                <td className="px-4 py-3 text-muted text-xs max-w-[160px] truncate">{s.name}</td>
                <td className="px-4 py-3"><SignalBadge direction={s.direction} /></td>
                <td className="px-4 py-3"><ConfBar value={s.confidence} /></td>
                <td className="px-4 py-3 font-mono text-sm">₹{s.price?.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs ${s.rsi < 35 ? "text-emerald-400" : s.rsi > 65 ? "text-red-400" : "text-muted"}`}>
                    {s.rsi ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs ${s.zscore < -1.5 ? "text-emerald-400" : s.zscore > 1.5 ? "text-red-400" : "text-muted"}`}>
                    {s.zscore ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs ${s.momentum20 > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.momentum20 != null ? `${s.momentum20 > 0 ? "+" : ""}${s.momentum20}%` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted">
                  <span className="text-body">₹{s.entry}</span>
                  <span className="mx-1">/</span>
                  <span className="text-red-400">₹{s.stop}</span>
                  <span className="mx-1">/</span>
                  <span className="text-emerald-400">₹{s.target}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 p-5 rounded-lg border border-amber/20 bg-amber/[0.03]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-display text-xl font-semibold">{selected.symbol} <span className="text-muted font-normal text-base">— {selected.name}</span></h3>
              <p className="text-muted text-xs mt-0.5">{selected.sector}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted hover:text-body text-lg">×</button>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Signal",      value: <SignalBadge direction={selected.direction} /> },
              { label: "Confidence",  value: `${selected.confidence}%` },
              { label: "RSI",         value: selected.rsi ?? "—" },
              { label: "Z-Score",     value: selected.zscore ?? "—" },
              { label: "20d Mom",     value: selected.momentum20 != null ? `${selected.momentum20 > 0 ? "+" : ""}${selected.momentum20}%` : "—" },
              { label: "EMA Trend",   value: selected.emaBullish ? "Bullish (9>21)" : "Bearish (9<21)" },
              { label: "Strategies",  value: `${selected.bullVotes}B / ${selected.bearVotes}S / ${selected.totalStrategies}T` },
              { label: "Risk:Reward", value: selected.riskReward ? `1:${selected.riskReward}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.02] rounded p-3">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1">{label}</p>
                <p className="text-sm font-semibold text-body">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Entry",  value: `₹${selected.entry}`,  color: "text-body" },
              { label: "Stop",   value: `₹${selected.stop}`,   color: "text-red-400" },
              { label: "Target", value: `₹${selected.target}`, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.02] rounded p-3 text-center">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1">{label}</p>
                <p className={`font-mono text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-muted">
            ⚠ Signals are algorithmic and educational only. Not SEBI-registered investment advice. Always apply your own risk management.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="mt-3 font-mono text-[11px] text-muted text-right">
          Showing {filtered.length} of {signals.length} stocks · Last updated: {lastFetch?.toLocaleTimeString("en-IN")}
        </p>
      )}
    </div>
  );
}
