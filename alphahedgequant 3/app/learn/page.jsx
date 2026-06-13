"use client";

import { useState } from "react";

const ARTICLES = [
  { title: "What is quantitative trading?", desc: "Systematic vs discretionary, where edges come from, and why process beats prediction.", level: "beginner", time: "8 min", cat: "Foundations" },
  { title: "Reading an option chain", desc: "Strikes, premiums, OI and IV — what each column actually tells you about positioning.", level: "beginner", time: "10 min", cat: "Derivatives" },
  { title: "Candlesticks without the mythology", desc: "What price action genuinely encodes — and which patterns are statistical noise.", level: "beginner", time: "9 min", cat: "Technical" },
  { title: "Position sizing before everything", desc: "Why sizing decides survival: fixed fractional, volatility targeting and the Kelly criterion.", level: "intermediate", time: "14 min", cat: "Risk" },
  { title: "Mean reversion vs momentum", desc: "The two families of edge, the regimes where each works, and how to detect which one you're in.", level: "intermediate", time: "15 min", cat: "Quant" },
  { title: "Options Greeks in practice", desc: "Delta, Gamma, Theta, Vega — managed as a portfolio, not memorized as definitions.", level: "intermediate", time: "18 min", cat: "Derivatives" },
  { title: "DCF valuation that holds up", desc: "Building a discounted cash flow model with real company numbers and honest assumptions.", level: "intermediate", time: "20 min", cat: "Valuation" },
  { title: "Risk management frameworks", desc: "Stop losses, drawdown circuit breakers and exposure limits as a coherent system.", level: "intermediate", time: "14 min", cat: "Risk" },
  { title: "Cointegration & pairs trading", desc: "Engle-Granger and Johansen tests, half-life of mean reversion, and z-score execution.", level: "advanced", time: "24 min", cat: "Quant" },
  { title: "The Black-Scholes model", desc: "The mathematics behind option pricing, its assumptions, and where they break in practice.", level: "advanced", time: "25 min", cat: "Quant" },
  { title: "Monte Carlo simulations", desc: "Random sampling for portfolio returns, VaR and stress testing — with code-level intuition.", level: "advanced", time: "22 min", cat: "Quant" },
  { title: "Factor investing & smart beta", desc: "Momentum, value, quality and low-volatility factors — building systematic exposure that works.", level: "advanced", time: "20 min", cat: "Quant" },
  { title: "Regime detection with HMMs", desc: "Hidden Markov models for classifying market states and gating strategies accordingly.", level: "advanced", time: "26 min", cat: "Quant" },
  { title: "Stochastic calculus for finance", desc: "Brownian motion, Ito's lemma, and the mathematical foundations of modern quant finance.", level: "advanced", time: "30 min", cat: "Quant" },
];

const LEVELS = ["all", "beginner", "intermediate", "advanced"];

const levelColor = {
  beginner: "text-gain border-gain/40",
  intermediate: "text-amber border-amber/40",
  advanced: "text-loss border-loss/40",
};

export default function Learn() {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? ARTICLES : ARTICLES.filter((a) => a.level === filter);

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : EDU — LEARNING HUB ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Learn quantitative finance properly
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        From first principles to stochastic calculus — written by a practitioner
        who trades these models, not a content farm. Full articles publishing in
        phases.
      </p>

      <div className="flex gap-2 mt-8 flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors capitalize ${
              filter === l
                ? "border-amber text-amber"
                : "border-line text-muted hover:text-body"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {list.map((a) => (
          <article key={a.title} className="card p-5 hover:border-amber/40 transition-colors">
            <span className={`font-mono text-[10px] tracking-wider uppercase border rounded px-2 py-0.5 ${levelColor[a.level]}`}>
              {a.level}
            </span>
            <h2 className="font-display text-lg font-medium mt-3">{a.title}</h2>
            <p className="text-sm text-muted leading-relaxed mt-1.5">{a.desc}</p>
            <p className="font-mono text-[11px] text-muted mt-4">
              {a.time} · {a.cat}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
