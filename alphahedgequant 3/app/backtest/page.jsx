"use client";

import Link from "next/link";
import { useState } from "react";

const EXAMPLES = [
  "Long SOXS / short SMCI when the cointegration z-score crosses +2",
  "Buy NIFTY pullbacks to the 21 EMA in an uptrend, exit at 1.5R",
  "Sell straddles on high-IV weeks and hedge with wings",
];

export default function Backtest() {
  const [prompt, setPrompt] = useState("");
  const [queued, setQueued] = useState(false);

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : AI — BACKTESTING AGENT ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Describe a strategy. Get a verdict.
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        The AHQ agent parses your strategy in plain English, routes it through
        the quant engine, and returns the equity curve, Sharpe ratio, max
        drawdown and a written analysis of where the edge holds — and where it
        breaks.
      </p>

      <div className="card p-6 mt-10 max-w-2xl">
        <label className="font-mono text-[11px] tracking-wider uppercase text-muted">
          Strategy prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder='e.g. "Pairs trade HDFC Bank vs ICICI Bank, enter at z-score 2, exit at 0, 2-year lookback"'
          className="mt-2 w-full bg-ink border border-line rounded-lg px-4 py-3 text-sm outline-none focus:border-amber/60 resize-none"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs text-muted border border-line rounded-full px-3 py-1.5 hover:border-amber/50 hover:text-amber transition-colors text-left"
            >
              {ex}
            </button>
          ))}
        </div>
        {queued ? (
          <p className="mt-5 text-gain text-sm font-medium">
            Noted — the agent is in private development. Join the waitlist and
            you&apos;ll run it first.
          </p>
        ) : (
          <button
            onClick={() => prompt.trim() && setQueued(true)}
            className="btn-primary mt-5"
          >
            Run backtest
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-12 max-w-3xl">
        {[
          ["Parse", "Plain English in, structured strategy parameters out — tickers, signals, sizing, lookback."],
          ["Execute", "Routed through the same engine behind the 10-strategy scanner. Real data, vectorized backtests."],
          ["Explain", "Equity curve, Sharpe, drawdown — plus a written verdict on regime sensitivity and overfitting risk."],
        ].map(([t, d], i) => (
          <div key={t} className="card p-5">
            <p className="font-mono text-amber text-xs">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="font-display font-medium mt-2">{t}</h2>
            <p className="text-sm text-muted leading-relaxed mt-1.5">{d}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted mt-10">
        Want in early?{" "}
        <Link href="/#waitlist" className="text-amber hover:underline">
          Join the waitlist →
        </Link>
      </p>
    </div>
  );
}
