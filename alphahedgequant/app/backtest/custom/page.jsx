"use client";
import { useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

const INTERVALS = [
  { id: "5m", label: "5m" }, { id: "15m", label: "15m" }, { id: "30m", label: "30m" },
  { id: "1h", label: "1h" }, { id: "1d", label: "1D" }, { id: "1wk", label: "1W" },
];
const NSE_EXAMPLES = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"];

const STARTER_CODE = `# Write a function generate_signals(df) that returns one signal per bar.
#   df  -> list of dicts: {date, open, high, low, close, volume}
#   return a list the SAME length as df, each value:
#       1  = long (hold the stock)
#       0  = flat (in cash)
#      -1  = short
#
# Example below: 10/30 SMA crossover. Edit freely — only Python stdlib + the
# helpers below are available. This runs entirely in YOUR browser (sandboxed).

def generate_signals(df):
    closes = [bar["close"] for bar in df]
    n = len(closes)
    signals = [0] * n

    def sma(values, i, window):
        if i + 1 < window:
            return None
        return sum(values[i - window + 1 : i + 1]) / window

    for i in range(n):
        fast = sma(closes, i, 10)
        slow = sma(closes, i, 30)
        if fast is None or slow is None:
            signals[i] = 0
        elif fast > slow:
            signals[i] = 1     # uptrend -> long
        else:
            signals[i] = 0     # else flat
    return signals
`;

// ── Equity-curve math (mirrors the backend runBacktest, signal-driven) ──
function computeEquity(prices, signals, initialCapital) {
  const n = prices.length;
  let cash = initialCapital;
  let shares = 0;
  let position = 0; // -1, 0, 1
  const equity = [];
  const benchmark = [];
  const startPrice = prices[0].close;
  let trades = 0;
  let wins = 0;
  let entryValue = 0;

  for (let i = 0; i < n; i++) {
    const px = prices[i].close;
    const sig = signals[i] || 0;

    if (sig !== position) {
      // close existing
      if (position !== 0) {
        const exitValue = shares * px;
        if (position === 1 && exitValue > entryValue) wins++;
        if (position === -1 && exitValue < entryValue) wins++;
        cash += shares * px;
        shares = 0;
        trades++;
      }
      // open new
      if (sig === 1) {
        shares = cash / px;
        entryValue = shares * px;
        cash = 0;
        position = 1;
      } else if (sig === -1) {
        shares = -(cash / px);
        entryValue = shares * px;
        position = -1;
      } else {
        position = 0;
      }
    }

    const portfolio = cash + shares * px;
    equity.push({ date: prices[i].date, strategy: Math.round(portfolio), benchmark: Math.round(initialCapital * (px / startPrice)) });
    benchmark.push(initialCapital * (px / startPrice));
  }

  // metrics
  const finalStrat = equity[n - 1].strategy;
  const finalBench = equity[n - 1].benchmark;
  const totalReturn = ((finalStrat - initialCapital) / initialCapital) * 100;
  const benchReturn = ((finalBench - initialCapital) / initialCapital) * 100;

  // daily returns for sharpe
  const rets = [];
  for (let i = 1; i < n; i++) {
    rets.push((equity[i].strategy - equity[i - 1].strategy) / (equity[i - 1].strategy || 1));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length || 1);
  const std = Math.sqrt(variance);
  const sharpe = std ? (mean / std) * Math.sqrt(252) : 0;

  // max drawdown
  let peak = equity[0].strategy;
  let maxDD = 0;
  for (const e of equity) {
    if (e.strategy > peak) peak = e.strategy;
    const dd = (e.strategy - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  return {
    equityCurve: equity,
    metrics: {
      totalReturn: +totalReturn.toFixed(2),
      benchmarkReturn: +benchReturn.toFixed(2),
      sharpe: +sharpe.toFixed(2),
      maxDrawdown: +(maxDD * 100).toFixed(2),
      trades,
      winRate: trades ? +((wins / trades) * 100).toFixed(1) : 0,
      finalValue: Math.round(finalStrat),
    },
  };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-ink border border-line rounded p-2 font-mono text-xs">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ₹{Number(p.value).toLocaleString("en-IN")}</p>
      ))}
    </div>
  );
}

export default function CustomBacktest() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [interval, setIntervalV] = useState("1d");
  const [capital, setCapital] = useState(100000);
  const [code, setCode] = useState(STARTER_CODE);
  const [pyLoading, setPyLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const pyodideRef = useRef(null);

  // Load Pyodide lazily on first run
  const ensurePyodide = async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setPyLoading(true);
    setStatusMsg("Loading Python runtime (~10MB, one-time)...");
    // Inject the Pyodide script
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Pyodide CDN"));
        document.head.appendChild(s);
      });
    }
    const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" });
    pyodideRef.current = py;
    setPyLoading(false);
    setStatusMsg("");
    return py;
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      // 1. Load Pyodide
      const py = await ensurePyodide();

      // 2. Fetch price data from backend
      setStatusMsg("Fetching price data...");
      const r = await fetch(`${API}/api/prices?symbol=${encodeURIComponent(symbol.toUpperCase().trim())}&interval=${interval}`);
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "Could not fetch prices");
      const prices = json.data;
      if (!prices || prices.length < 20) throw new Error("Not enough price data returned.");

      // 3. Run user's Python in the sandbox
      setStatusMsg("Running your strategy in the sandbox...");
      py.globals.set("price_data", py.toPy(prices));
      const userProgram = `
import json as _json
${code}

_df = price_data.to_py() if hasattr(price_data, 'to_py') else price_data
_sigs = generate_signals(_df)
_sigs = [int(s) for s in _sigs]
if len(_sigs) != len(_df):
    raise ValueError(f"generate_signals returned {len(_sigs)} signals but there are {len(_df)} bars. They must match.")
_json.dumps(_sigs)
`;
      // timeout guard (15s)
      const exec = py.runPythonAsync(userProgram);
      const signalsJson = await Promise.race([
        exec,
        new Promise((_, rej) => setTimeout(() => rej(new Error("Strategy timed out (15s). Simplify your code.")), 15000)),
      ]);
      const signals = JSON.parse(signalsJson);

      // 4. Compute equity curve in JS
      setStatusMsg("Computing equity curve...");
      const res = computeEquity(prices, signals, Number(capital));
      setResult({ symbol: symbol.toUpperCase(), interval, period: { from: prices[0].date, to: prices[prices.length - 1].date, bars: prices.length }, ...res });
      setStatusMsg("");
    } catch (e) {
      // Surface Python errors cleanly
      let msg = e.message || String(e);
      if (msg.includes("Traceback")) {
        const lines = msg.trim().split("\n");
        msg = lines[lines.length - 1];
      }
      setError(msg);
      setStatusMsg("");
    } finally {
      setRunning(false);
    }
  };

  const alpha = result ? (result.metrics.totalReturn - result.metrics.benchmarkReturn).toFixed(2) : null;

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <p className="eyebrow mb-3">[ AHQ : AI BACKTEST — CUSTOM PYTHON STRATEGY ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Bring Your Own Strategy</h1>
      <p className="text-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
        Write a Python <code className="text-amber font-mono">generate_signals(df)</code> function and backtest it on live
        market data. Your code runs <span className="text-body">entirely in your browser</span> via WebAssembly —
        it never touches our servers, so it's fully sandboxed and private.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* ── LEFT: editor + controls ── */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block font-mono text-xs text-muted tracking-wider mb-2">SYMBOL</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-raised/40 border border-line rounded px-3 py-2 font-mono text-sm text-body focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted tracking-wider mb-2">CAPITAL (₹)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="w-32 bg-raised/40 border border-line rounded px-3 py-2 font-mono text-sm text-body focus:outline-none focus:border-amber/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {NSE_EXAMPLES.map((s) => (
              <button key={s} onClick={() => setSymbol(s)}
                className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${symbol === s ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>
                {s}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">TIMEFRAME</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERVALS.map((iv) => (
                <button key={iv.id} onClick={() => setIntervalV(iv.id)}
                  className={`font-mono text-xs px-2.5 py-1 rounded border transition-colors ${interval === iv.id ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>
                  {iv.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-wider mb-2">YOUR STRATEGY (PYTHON)</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={20}
              className="w-full bg-ink border border-line rounded p-3 font-mono text-xs text-body leading-relaxed focus:outline-none focus:border-amber/40 resize-y"
              style={{ tabSize: 4 }}
            />
          </div>

          <button
            onClick={run}
            disabled={running || pyLoading}
            className="w-full py-3 rounded bg-amber text-ink font-display font-semibold text-sm hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pyLoading ? "Loading Python..." : running ? "Running..." : "▶ Run My Strategy"}
          </button>
          {statusMsg && <p className="font-mono text-xs text-muted text-center">{statusMsg}</p>}
        </div>

        {/* ── RIGHT: results ── */}
        <div>
          {!result && !running && !error && (
            <div className="h-full min-h-[400px] rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted px-6 text-center">
              <div className="text-4xl mb-4 opacity-30">🐍</div>
              <p className="font-display text-lg opacity-40">Write a strategy & run it</p>
              <p className="text-xs mt-2 opacity-40 font-mono leading-relaxed">
                Your Python executes in a WebAssembly sandbox in your browser.<br />Nothing is sent to our servers except the symbol & timeframe.
              </p>
            </div>
          )}

          {(running || pyLoading) && (
            <div className="h-full min-h-[400px] rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted">
              <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-sm text-muted">{statusMsg || "Working..."}</p>
            </div>
          )}

          {error && (
            <div className="p-5 rounded-lg border border-loss/30 bg-loss/10">
              <p className="text-loss font-mono text-sm font-semibold mb-1">Error</p>
              <p className="text-loss/80 font-mono text-xs whitespace-pre-wrap break-words">{error}</p>
              <p className="text-muted font-mono text-[10px] mt-3">Check your generate_signals function. It must return a list of 1/0/-1, one per bar.</p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">{result.symbol} · Custom Strategy</h2>
                  <p className="font-mono text-xs text-muted mt-0.5">{result.period.from} → {result.period.to} ({result.period.bars} bars · {result.interval})</p>
                </div>
                {alpha !== null && (
                  <div className={`text-center px-4 py-2 rounded border ${parseFloat(alpha) >= 0 ? "border-gain/30 bg-gain/10" : "border-loss/30 bg-loss/10"}`}>
                    <p className="font-mono text-[10px] text-muted tracking-wider">ALPHA vs B&H</p>
                    <p className={`font-mono text-xl font-bold mt-0.5 ${parseFloat(alpha) >= 0 ? "text-gain" : "text-loss"}`}>{alpha > 0 ? "+" : ""}{alpha}%</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { k: "totalReturn", label: "TOTAL RETURN", suffix: "%" },
                  { k: "benchmarkReturn", label: "BUY & HOLD", suffix: "%" },
                  { k: "sharpe", label: "SHARPE", suffix: "" },
                  { k: "maxDrawdown", label: "MAX DRAWDOWN", suffix: "%" },
                  { k: "winRate", label: "WIN RATE", suffix: "%" },
                  { k: "trades", label: "TRADES", suffix: "" },
                ].map(({ k, label, suffix }) => {
                  const val = result.metrics[k];
                  const pos = typeof val === "number" && (k === "totalReturn" || k === "benchmarkReturn") ? val >= 0 : null;
                  return (
                    <div key={k} className="p-3 rounded-lg border border-line bg-surface">
                      <p className="font-mono text-[10px] text-muted tracking-wider mb-1">{label}</p>
                      <p className={`font-mono text-lg font-bold ${pos === null ? "text-body" : pos ? "text-gain" : "text-loss"}`}>{val}{suffix}</p>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-lg border border-line bg-surface">
                <p className="font-mono text-xs text-muted tracking-wider mb-4">EQUITY CURVE</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={result.equityCurve} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(d) => String(d).slice(2, 10)} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#8a94a8", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 11, color: "#8a94a8" }} />
                    <ReferenceLine y={Number(capital)} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="strategy" name="Strategy" stroke="#F0A93B" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                    <Line type="monotone" dataKey="benchmark" name="Buy & Hold" stroke="#4f5b7a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="font-mono text-[10px] text-muted">
                ⚠ Your code ran client-side in a sandbox. Past performance ≠ future results. No transaction costs/slippage modelled. Data: Yahoo Finance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
