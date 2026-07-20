"use client";

import { useState } from "react";

const EXAMPLES = [
  "Golden cross on RELIANCE with a 2 ATR trailing stop",
  "Buy TCS when RSI(14) drops below 30, sell above 70",
  "Buy INFY when price crosses above the 20-day EMA, exit below it, 1.5 ATR stop",
  "Weekly momentum on HDFCBANK: close above 10-week SMA",
];

function Metric({ label, value, accent }) {
  return (
    <div className="card p-4">
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">{label}</p>
      <p className={`font-display text-lg font-medium mt-1.5 ${accent || "text-body"}`}>{value}</p>
    </div>
  );
}

function EquityChart({ equity, capital }) {
  if (!equity?.length) return null;
  const w = 720, h = 200, pad = 8;
  const vals = equity.map((e) => e.equity);
  const min = Math.min(...vals, capital), max = Math.max(...vals, capital);
  const x = (i) => pad + (i / (equity.length - 1)) * (w - 2 * pad);
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const base = y(capital);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-4" role="img" aria-label="Equity curve">
      <line x1={pad} x2={w - pad} y1={base} y2={base} stroke="#4a5568" strokeDasharray="4 4" strokeWidth="1" />
      <path d={path} fill="none" stroke="#F0A93B" strokeWidth="1.8" />
    </svg>
  );
}

function ruleText(r) {
  if (!r) return "—";
  const side = (o) => (o.ind === "value" ? o.value : o.ind === "close" ? "close" : `${o.ind.toUpperCase()}(${o.period})`);
  const verb = { cross_above: "crosses above", cross_below: "crosses below", above: "is above", below: "is below" }[r.type];
  return `${side(r.left)} ${verb} ${side(r.right)}`;
}

export default function Copilot() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [data, setData] = useState(null);

  async function run(p) {
    const text = (p ?? prompt).trim();
    if (!text || loading) return;
    setLoading(true); setError(null); setData(null); setNotConfigured(false);
    try {
      const r = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const j = await r.json();
      if (!j.ok) {
        if (j.code === "not-configured") setNotConfigured(true);
        else setError(j.error || "Something went wrong.");
      } else setData(j);
    } catch (e) {
      setError("Network error — the backend may be waking from cold start (~50s). Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  const m = data?.results?.metrics;

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : AI QUANT COPILOT ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Describe a strategy. Get a backtest.
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        Plain English in, deterministic backtest out. The AI only translates your
        idea into a whitelisted JSON spec (SMA / EMA / RSI / ATR rules) — it never
        writes or runs code. Costs modelled at 0.05% per side. Long-only.
      </p>

      <div className="card p-6 mt-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder='e.g. "Buy RELIANCE when the 50-day SMA crosses above the 200-day, exit on the reverse cross, 2 ATR stop"'
          className="w-full bg-raised/40 border border-line rounded-lg px-4 py-3 font-mono text-sm text-body placeholder:text-muted focus:outline-none focus:border-amber/40 resize-none"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => run()} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Running…" : "Run backtest"}
          </button>
          <span className="font-mono text-[11px] text-muted">5 runs/hour · educational only</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setPrompt(ex); run(ex); }}
              className="font-mono text-[11px] px-3 py-1.5 rounded border border-line text-muted hover:text-amber hover:border-amber/40 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {notConfigured && (
        <div className="card p-6 mt-6 border-amber/30">
          <p className="font-display font-medium">Copilot is almost live</p>
          <p className="text-sm text-muted mt-1.5">
            The engine is deployed but the AI key isn&apos;t connected yet. Check back soon.
          </p>
        </div>
      )}

      {error && (
        <div className="card p-4 mt-6 border-[#f0564f]/30">
          <p className="font-mono text-sm text-[#f0564f]">⚠ {error}</p>
        </div>
      )}

      {data && (
        <div className="mt-8">
          <div className="card p-5">
            <p className="font-mono text-[11px] tracking-[0.2em] text-amber">PARSED STRATEGY — {data.spec.symbol} · {data.spec.interval}</p>
            <div className="grid gap-1.5 mt-3 text-sm text-body/85">
              <p><span className="text-muted font-mono text-xs">ENTRY</span>  {ruleText(data.spec.entry)}</p>
              <p><span className="text-muted font-mono text-xs">EXIT </span>  {data.spec.exit ? ruleText(data.spec.exit) : "— (stop only)"}</p>
              <p><span className="text-muted font-mono text-xs">STOP </span>  {data.spec.stop ? `${data.spec.stop.mult}× ATR(${data.spec.stop.period}) trailing` : "none"}</p>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-4">
            <Metric label="Total return" value={`${m.totalReturnPct}%`} accent={m.totalReturnPct >= 0 ? "tick-up" : "tick-down"} />
            <Metric label="Sharpe" value={m.sharpe} accent={m.sharpe >= 1 ? "tick-up" : undefined} />
            <Metric label="Max drawdown" value={`−${m.maxDrawdownPct}%`} accent="tick-down" />
            <Metric label="Win rate" value={m.winRatePct != null ? `${m.winRatePct}%` : "—"} />
            <Metric label="CAGR" value={`${m.cagrPct}%`} />
            <Metric label="Trades" value={m.trades} />
            <Metric label="Buy & hold" value={`${m.buyHoldReturnPct}%`} />
            <Metric label="Bars tested" value={m.bars} />
          </div>

          <div className="card p-5 mt-4">
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted">EQUITY CURVE (dashed = starting capital)</p>
            <EquityChart equity={data.results.equity} capital={data.spec.capital} />
          </div>

          {data.results.trades?.length > 0 && (
            <div className="card p-5 mt-4 overflow-x-auto">
              <p className="font-mono text-[11px] tracking-[0.2em] text-muted mb-3">LAST {data.results.trades.length} FILLS</p>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="text-muted text-[11px] text-left">
                    <th className="py-1 pr-6">DATE</th><th className="pr-6">SIDE</th><th className="pr-6">PRICE</th><th>RET</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.trades.map((t, i) => (
                    <tr key={i} className="border-t border-line/50">
                      <td className="py-1.5 pr-6 text-muted">{t.date}</td>
                      <td className={`pr-6 ${t.side === "BUY" ? "tick-up" : t.side === "STOP" ? "tick-down" : "text-body"}`}>{t.side}</td>
                      <td className="pr-6">{t.price}</td>
                      <td className={t.retPct == null ? "text-muted" : t.retPct >= 0 ? "tick-up" : "tick-down"}>
                        {t.retPct == null ? "—" : `${t.retPct}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="font-mono text-[11px] text-muted mt-10 leading-relaxed">
        RESEARCH &amp; EDUCATION ONLY — NOT INVESTMENT ADVICE. Backtests are hypothetical,
        use Yahoo Finance adjusted closes, and ignore slippage beyond the 0.05%/side cost model.
      </p>
    </div>
  );
}
