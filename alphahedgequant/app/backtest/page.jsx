"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

const STRATEGIES = [
  {
    id:    "mean_reversion",
    label: "Mean Reversion (Z-Score)",
    desc:  "Buy when price is 2σ below its 20-day MA; sell when 2σ above. Classic stat-arb edge.",
    params: [
      { key: "lookback", label: "Lookback (days)", type: "number", default: 20,  min: 10,  max: 60  },
      { key: "entryZ",   label: "Entry Z-Score",   type: "number", default: 2.0, min: 1.0, max: 3.0, step: 0.1 },
      { key: "exitZ",    label: "Exit Z-Score",    type: "number", default: 0.5, min: 0.1, max: 1.5, step: 0.1 },
    ],
  },
  {
    id:    "momentum",
    label: "Momentum (EMA + RSI)",
    desc:  "Go long when fast EMA crosses above slow EMA with RSI < 70; flip short on reversal.",
    params: [
      { key: "fast", label: "Fast EMA (days)", type: "number", default: 10, min: 5,  max: 50 },
      { key: "slow", label: "Slow EMA (days)", type: "number", default: 30, min: 10, max: 100 },
    ],
  },
  {
    id:    "bollinger",
    label: "Bollinger Band Breakout",
    desc:  "Enter long on lower-band touch, enter short on upper-band breach. Rides the squeeze.",
    params: [
      { key: "lookback", label: "Lookback (days)", type: "number", default: 20,  min: 10, max: 60 },
      { key: "numStd",   label: "Std Multiplier",  type: "number", default: 2.0, min: 1.0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id:    "vwap",
    label: "VWAP Mean Reversion",
    desc:  "Buy when price falls more than threshold below the 5-day VWAP; sell on upper deviation.",
    params: [
      { key: "period",    label: "VWAP Period (days)", type: "number", default: 5,    min: 3, max: 20 },
      { key: "threshold", label: "Threshold (ratio)",  type: "number", default: 0.015, min: 0.005, max: 0.05, step: 0.005 },
    ],
  },
];

const NSE_EXAMPLES = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "BHARTIARTL", "SBIN", "ITC", "KOTAKBANK", "LT",
  "HINDUNILVR", "AXISBANK", "BAJFINANCE", "TATAMOTORS", "SUNPHARMA",
];

const METRIC_CARDS = [
  { key: "totalReturn",      label: "Total Return",     suffix: "%", color: (v) => v >= 0 ? "text-gain" : "text-loss" },
  { key: "benchmarkReturn",  label: "Buy & Hold",       suffix: "%", color: (v) => v >= 0 ? "text-gain" : "text-loss" },
  { key: "sharpe",           label: "Sharpe Ratio",     suffix: "",  color: (v) => v >= 1 ? "text-gain" : v >= 0 ? "text-amber" : "text-loss" },
  { key: "sortino",          label: "Sortino Ratio",    suffix: "",  color: (v) => v >= 1 ? "text-gain" : v >= 0 ? "text-amber" : "text-loss" },
  { key: "maxDrawdown",      label: "Max Drawdown",     suffix: "%", color: (_) => "text-loss" },
  { key: "winRate",          label: "Win Rate",         suffix: "%", color: (v) => v >= 55 ? "text-gain" : v >= 45 ? "text-amber" : "text-loss" },
  { key: "trades",           label: "Trades",           suffix: "",  color: (_) => "text-body" },
  { key: "annualizedReturn", label: "Ann. Return",      suffix: "%", color: (v) => v >= 0 ? "text-gain" : "text-loss" },
];


const INTERVALS = [
  { id: "1m",  label: "1m"  },
  { id: "5m",  label: "5m"  },
  { id: "15m", label: "15m" },
  { id: "30m", label: "30m" },
  { id: "60m", label: "1h"  },
  { id: "1d",  label: "1D"  },
  { id: "1wk", label: "1W"  },
];
const INTRADAY = new Set(["1m", "5m", "15m", "30m", "60m"]);
const INTERVAL_NOTE = {
  "1m":  "1-minute data: last ~7 days only (Yahoo limit).",
  "5m":  "5-minute data: last ~60 days (Yahoo limit).",
  "15m": "15-minute data: last ~60 days (Yahoo limit).",
  "30m": "30-minute data: last ~60 days (Yahoo limit).",
  "60m": "1-hour data: last ~730 days (Yahoo limit).",
  "1d":  "",
  "1wk": "",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink border border-line rounded p-3 font-mono text-xs">
      <p className="text-muted mb-1">{label}</p>
      {payload.map(({ name, value, color }) => (
        <p key={name} style={{ color }}>
          {name}: ₹{value?.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

export default function BacktestPage() {
  const [symbol,    setSymbol]    = useState("RELIANCE");
  const [strategy,  setStrategy]  = useState(STRATEGIES[0]);
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate,   setEndDate]   = useState(new Date().toISOString().split("T")[0]);
  const [capital,   setCapital]   = useState(100000);
  const [interval,  setInterval2]  = useState("1d");
  const [params,    setParams]    = useState({});
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const handleStrategyChange = (id) => {
    const s = STRATEGIES.find(s => s.id === id);
    if (s) { setStrategy(s); setParams({}); }
  };

  const getParam = (key, def) => params[key] !== undefined ? params[key] : def;
  const setParam = (key, val) => setParams(p => ({ ...p, [key]: parseFloat(val) }));

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        symbol: symbol.toUpperCase().trim(),
        strategy: strategy.id,
        startDate,
        endDate,
        initialCapital: Number(capital),
        interval,
        params: Object.fromEntries(
          strategy.params.map(p => [p.key, getParam(p.key, p.default)])
        ),
      };
      const r = await fetch(`${API}/api/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "Backtest failed");
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const alpha = result
    ? (parseFloat(result.metrics.totalReturn) - parseFloat(result.metrics.benchmarkReturn)).toFixed(2)
    : null;

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      {/* Header */}
      <p className="eyebrow mb-3">[ AHQ : AI BACKTEST — STRATEGY ENGINE ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Strategy Backtester</h1>
      <p className="text-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
        Test 4 quantitative strategies on any NSE or US stock using 1-year+ of Yahoo Finance adjusted close data.
        Metrics include Sharpe, Sortino, max drawdown, win rate, and alpha vs buy-and-hold.
      </p>
      <Link href="/backtest/custom" className="inline-flex items-center gap-2 mt-3 font-mono text-xs text-amber hover:underline">
        🐍 Or write your own Python strategy →
      </Link>

      <div className="mt-8 grid lg:grid-cols-[340px_1fr] gap-6">
        {/* ── CONTROL PANEL ── */}
        <div className="space-y-5">
          {/* Symbol */}
          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">SYMBOL</label>
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="RELIANCE, TCS, AAPL..."
              className="w-full bg-raised/40 border border-line rounded px-3 py-2.5 font-mono text-sm text-body focus:outline-none focus:border-amber/40"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NSE_EXAMPLES.slice(0, 8).map(s => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    symbol === s ? "border-amber text-amber" : "border-line text-muted hover:text-body"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">STRATEGY</label>
            {STRATEGIES.map(s => (
              <button
                key={s.id}
                onClick={() => handleStrategyChange(s.id)}
                className={`w-full text-left p-3 rounded border mb-2 transition-colors text-sm ${
                  strategy.id === s.id
                    ? "border-amber/40 bg-amber/[0.04] text-body"
                    : "border-line bg-surface/60 text-muted hover:border-white/20 hover:text-body"
                }`}
              >
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Strategy params */}
          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">PARAMETERS</label>
            <div className="space-y-3">
              {strategy.params.map(p => (
                <div key={p.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-muted">{p.label}</label>
                    <span className="font-mono text-xs text-amber">{getParam(p.key, p.default)}</span>
                  </div>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step || 1}
                    value={getParam(p.key, p.default)}
                    onChange={e => setParam(p.key, e.target.value)}
                    className="w-full accent-amber"
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="font-mono text-[10px] text-muted">{p.min}</span>
                    <span className="font-mono text-[10px] text-muted">{p.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">TIMEFRAME</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERVALS.map(iv => (
                <button
                  key={iv.id}
                  onClick={() => setInterval2(iv.id)}
                  className={`font-mono text-xs px-2.5 py-1 rounded border transition-colors ${
                    interval === iv.id ? "border-amber text-amber" : "border-line text-muted hover:text-body"
                  }`}
                >
                  {iv.label}
                </button>
              ))}
            </div>
            {INTERVAL_NOTE[interval] && (
              <p className="font-mono text-[10px] text-muted/70 mt-2 leading-relaxed">{INTERVAL_NOTE[interval]}</p>
            )}
            {INTRADAY.has(interval) && (
              <p className="font-mono text-[10px] text-amber/70 mt-1 leading-relaxed">Date range ignored for intraday — uses Yahoo's available window.</p>
            )}
          </div>

          {/* Dates + Capital */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs text-muted tracking-wider mb-1.5">START DATE</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={INTRADAY.has(interval)}
                className="w-full bg-raised/40 border border-line rounded px-3 py-2 font-mono text-xs text-body focus:outline-none focus:border-amber/40 disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted tracking-wider mb-1.5">END DATE</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={INTRADAY.has(interval)}
                className="w-full bg-raised/40 border border-line rounded px-3 py-2 font-mono text-xs text-body focus:outline-none focus:border-amber/40 disabled:opacity-40"
              />
            </div>
          </div>
          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-1.5">INITIAL CAPITAL (₹)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              className="w-full bg-raised/40 border border-line rounded px-3 py-2.5 font-mono text-sm text-body focus:outline-none focus:border-amber/40"
            />
          </div>

          {/* Run button */}
          <button
            onClick={run}
            disabled={loading}
            className="w-full py-3 rounded bg-amber text-ink font-display font-semibold text-sm hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Running backtest..." : "▶ Run Backtest"}
          </button>
        </div>

        {/* ── RESULTS PANEL ── */}
        <div>
          {/* Idle state */}
          {!result && !loading && !error && (
            <div className="h-full min-h-[400px] rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted">
              <div className="text-4xl mb-4 opacity-30">📈</div>
              <p className="font-display text-lg opacity-40">Configure and run a backtest</p>
              <p className="text-xs mt-1 opacity-30 font-mono">Results appear here</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="h-full min-h-[400px] rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted">
              <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-sm text-muted">Fetching data & running strategy...</p>
              <p className="font-mono text-xs text-muted/60 mt-1">Render may need ~50s on first call (cold start)</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-5 rounded-lg border border-loss/30 bg-loss/10">
              <p className="text-loss font-mono text-sm font-semibold mb-1">Backtest failed</p>
              <p className="text-loss/70 font-mono text-xs">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {result.symbol} · {strategy.label}
                  </h2>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    {result.period.from} → {result.period.to} ({result.period.bars ?? result.period.days} bars · {result.interval || "1d"})
                  </p>
                </div>
                {alpha !== null && (
                  <div className={`text-center px-4 py-2 rounded border ${
                    parseFloat(alpha) >= 0
                      ? "border-gain/30 bg-gain/10"
                      : "border-loss/30 bg-loss/10"
                  }`}>
                    <p className="font-mono text-[10px] text-muted tracking-wider">ALPHA vs B&H</p>
                    <p className={`font-mono text-xl font-bold mt-0.5 ${parseFloat(alpha) >= 0 ? "text-gain" : "text-loss"}`}>
                      {alpha > 0 ? "+" : ""}{alpha}%
                    </p>
                  </div>
                )}
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {METRIC_CARDS.map(({ key, label, suffix, color }) => {
                  const val = result.metrics[key];
                  return (
                    <div key={key} className="p-3 rounded-lg border border-line bg-surface">
                      <p className="font-mono text-[10px] text-muted tracking-wider mb-1">{label}</p>
                      <p className={`font-mono text-xl font-bold ${color(parseFloat(val))}`}>
                        {typeof val === "number"
                          ? val.toLocaleString("en-IN")
                          : key === "finalValue"
                          ? `₹${Number(val).toLocaleString("en-IN")}`
                          : val}
                        {suffix}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Equity Curve */}
              <div className="p-4 rounded-lg border border-line bg-surface">
                <p className="font-mono text-xs text-muted tracking-wider mb-4">EQUITY CURVE</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={result.equityCurve} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }}
                      tickFormatter={d => d.slice(2, 10)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontFamily: "monospace", fontSize: 11, color: "#8a94a8" }}
                    />
                    <ReferenceLine y={Number(capital)} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="strategy"
                      name="Strategy"
                      stroke="#F0A93B"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      name="Buy & Hold"
                      stroke="#4f5b7a"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Interpretation */}
              <div className="p-4 rounded-lg border border-line bg-surface/60">
                <p className="font-mono text-xs text-muted tracking-wider mb-2">INTERPRETATION</p>
                <div className="space-y-1.5 text-xs text-muted leading-relaxed font-mono">
                  <p>
                    {parseFloat(result.metrics.sharpe) >= 1
                      ? `✓ Sharpe of ${result.metrics.sharpe} is solid — strategy is generating more return per unit of risk than a simple index exposure.`
                      : `⚠ Sharpe of ${result.metrics.sharpe} is below 1.0 — risk-adjusted returns need improvement. Consider tighter param tuning.`}
                  </p>
                  <p>
                    {parseFloat(result.metrics.maxDrawdown) > -20
                      ? `✓ Max drawdown of ${result.metrics.maxDrawdown}% is manageable — position sizing can be applied normally.`
                      : `⚠ Drawdown of ${result.metrics.maxDrawdown}% is large — reduce position size or add a drawdown circuit breaker.`}
                  </p>
                  <p>
                    {parseFloat(alpha) > 0
                      ? `✓ Generated ${alpha}% alpha over buy-and-hold — the strategy is adding value beyond passive exposure.`
                      : `✗ Strategy underperformed buy-and-hold by ${Math.abs(alpha)}% — passive index was better over this period.`}
                  </p>
                </div>
              </div>

              <p className="font-mono text-[10px] text-muted">
                ⚠ Past performance ≠ future results. Backtest does not account for transaction costs, slippage, or impact. Data: Yahoo Finance adjusted close.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
