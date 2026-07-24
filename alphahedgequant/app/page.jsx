"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";

// Shiny antique-gold foil gradient for the single italic accent words
// (light champagne at the top → deep antique gold at the bottom).
const GOLD_GRAD = "linear-gradient(170deg, #FBEBB8 0%, #EACB72 34%, #D3A64A 60%, #B07C24 100%)";

// Rotating consensus-scan terminal demo — real symbols, illustrative output.
const SCANS = [
  ["$ ahq scan --consensus RELIANCE", "resolving NSE:RELIANCE · 14 brokerages · window 90d", "CONSENSUS        BUY 9 · HOLD 4 · SELL 1", "MEDIAN TARGET    ₹ 3,120 (+9.6%)", "TRUST SCORE      78 / 100 ▲ reliable", "REGIME (HMM)     low-vol · mean-revert", "✓ scan complete in 0.42s — not investment advice"],
  ["$ ahq scan --consensus HDFCBANK", "resolving NSE:HDFCBANK · 12 brokerages · window 90d", "CONSENSUS        BUY 8 · HOLD 5 · SELL 0", "MEDIAN TARGET    ₹ 1,048 (+31.6%)", "TRUST SCORE      74 / 100 ▲ reliable", "REGIME (HMM)     low-vol · trending", "✓ scan complete in 0.39s — not investment advice"],
  ["$ ahq scan --consensus IRFC", "resolving NSE:IRFC · 6 brokerages · window 90d", "CONSENSUS        BUY 1 · HOLD 2 · SELL 4", "MEDIAN TARGET    ₹ 60 (−34.6%)", "TRUST SCORE      41 / 100 ▽ caution", "REGIME (HMM)     high-vol · momentum", "✓ scan complete in 0.44s — not investment advice"],
];

const TAPE = [
  "STAT-ARB", "REGIME DETECTION", "OPTIONS GREEKS", "PORTFOLIO OPTIMIZATION",
  "KALMAN FILTER", "VRP HARVESTING", "COINTEGRATION",
];

const ENGINES = [
  {
    tag: "AHQ:TRUST", title: "Analyst calls, scored", href: "/tracker", cta: "Open the Trust Tracker",
    color: "#F0A93B", tint: "rgba(240,169,59,0.13)",
    icon: "M12 2l7 3v6c0 4.5-3 8-7 11-4-3-7-6.5-7-11V5l7-3z",
    desc: "Every brokerage target is logged with the price on the day it was made — then graded against what the market actually did. A credit score for the sell side, fed daily by street consensus.",
  },
  {
    tag: "AHQ:AI", title: "AI Quant Copilot", href: "/copilot", cta: "Try the copilot",
    color: "#2DD482", tint: "rgba(45,212,130,0.13)",
    icon: "M9 3h6v2h3a2 2 0 012 2v3h2v4h-2v3a2 2 0 01-2 2h-3v2H9v-2H6a2 2 0 01-2-2v-3H2v-4h2V7a2 2 0 012-2h3V3zm-.5 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
    desc: "Describe a strategy in a sentence. The copilot converts it to a whitelisted rule spec — never code — and runs a deterministic backtest with real costs, ATR stops and honest next-bar fills.",
  },
  {
    tag: "AHQ:MACRO", title: "Primary-source reports", href: "/reports", cta: "Read the reports",
    color: "#B79BFF", tint: "rgba(183,155,255,0.13)",
    icon: "M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.5H8V12zm0 3h8v1.5H8V15z",
    desc: "Macro research where every figure is verified against the primary release — MoSPI, GSTN, RBI, the Fed, BLS — before publication. No hot takes, no unverified numbers.",
  },
];

const STRATEGIES = [
  ["01", "Engle-Granger pairs", "COINTEGRATION"],
  ["02", "Johansen basket", "MULTIVARIATE"],
  ["03", "PCA stat-arb", "FACTOR"],
  ["04", "Kalman filter", "DYNAMIC HEDGE"],
  ["05", "OU mean reversion", "ORNSTEIN-UHLENBECK"],
  ["06", "Momentum", "CROSS-SECTIONAL"],
  ["07", "HMM regimes", "REGIME DETECTION"],
  ["08", "VRP harvesting", "OPTIONS"],
  ["09", "Multi-pair scan", "BREADTH"],
  ["10", "Ledoit-Wolf optimization", "PORTFOLIO"],
];

function Terminal() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const line = setInterval(() => setShown((s) => (s < SCANS[idx].length ? s + 1 : s)), 420);
    const scan = setInterval(() => { setIdx((i) => (i + 1) % SCANS.length); setShown(1); }, 5200);
    return () => { clearInterval(line); clearInterval(scan); };
  }, [idx]);
  return (
    <div className="card p-0 overflow-hidden font-mono text-[13px] max-w-xl w-full" aria-label="Live scan demo">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <span className="w-3 h-3 rounded-full bg-[#f0564f]" />
        <span className="w-3 h-3 rounded-full bg-amber" />
        <span className="w-3 h-3 rounded-full bg-[#2dd482]" />
        <span className="ml-3 text-muted text-xs">ahq — consensus scanner</span>
      </div>
      <div className="p-5 min-h-[210px] leading-relaxed">
        {SCANS[idx].slice(0, shown).map((l, i) => (
          <p key={i} className={i === 0 ? "text-amber" : i === SCANS[idx].length - 1 ? "text-[#2dd482]" : "text-body/75"}>{l}</p>
        ))}
        <span className="inline-block w-2.5 h-4 bg-amber/80 animate-pulse align-middle" aria-hidden="true" />
      </div>
    </div>
  );
}

// Italic accent word rendered as a shiny gold-foil gradient (background-clipped text).
function Accent({ children }) {
  return (
    <span
      className="italic"
      style={{
        backgroundImage: GOLD_GRAD,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-shell mx-auto px-5 pt-20 pb-16 relative fade-up">
          <p className="eyebrow mb-6">[ AHQ : QUANT RESEARCH PLATFORM ]</p>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="font-display text-5xl md:text-[5.2rem] font-medium tracking-tight leading-[1.02]">
                Trade the<br />numbers,<br />not the <Accent>tips</Accent>.
              </h1>
              <p className="mt-7 text-muted text-lg max-w-md leading-relaxed">
                Live NSE &amp; US screeners, a 10-strategy quant scanner, analyst
                calls scored against what actually happened, and an AI copilot
                that turns plain English into honest backtests.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/screener" className="btn-primary !rounded-full !px-6 !py-3">
                  Open the screener
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
                <Link href="/tracker" className="btn-ghost !rounded-full !px-6 !py-3">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" /></svg>
                  See who to trust
                </Link>
              </div>
            </div>
            <div className="flex lg:justify-end">
              <Terminal />
            </div>
          </div>
        </div>
        {/* strategy tape */}
        <div className="border-y border-line py-4 overflow-hidden mt-6">
          <div className="flex gap-8 whitespace-nowrap font-mono text-xs text-muted px-5 justify-center flex-wrap">
            {TAPE.map((s, i) => (
              <span key={s}>{s}{i < TAPE.length - 1 && <span className="text-amber/50 ml-8">·</span>}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE ENGINES ── */}
      <section className="max-w-shell mx-auto px-5 pt-24 pb-6">
        <p className="eyebrow mb-4">[ AHQ : WHAT YOU GET ]</p>
        <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
          Three engines, one <Accent>honest</Accent> answer.
        </h2>
        <hr className="rule-grad mt-6 max-w-xs" />
        <div className="grid gap-5 md:grid-cols-3 mt-12">
          {ENGINES.map((e) => (
            <Link
              key={e.tag}
              href={e.href}
              className="card feature-card p-6 group"
              style={{ "--glow": e.color, background: `radial-gradient(130% 110% at 0% 0%, ${e.tint}, transparent 55%)` }}
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center border"
                  style={{ background: e.tint, borderColor: e.color + "40" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={e.color}><path d={e.icon} /></svg>
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: e.color }}>[ {e.tag} ]</span>
              </div>
              <h3 className="font-display text-xl font-medium mb-2.5">{e.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{e.desc}</p>
              <p className="mt-5 font-mono text-[13px] flex items-center gap-1.5" style={{ color: e.color }}>
                {e.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TEN STRATEGIES ── */}
      <section className="max-w-shell mx-auto px-5 pt-24 pb-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="eyebrow mb-4">[ AHQ : THE SCANNER ]</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]">
              Ten strategies,<br />run <Accent>every bar</Accent>.
            </h2>
            <hr className="rule-grad mt-6 max-w-[220px]" />
            <p className="mt-7 text-muted text-base max-w-md leading-relaxed">
              A single scan sweeps the whole book through the classical stat-arb
              and regime toolkit — deterministic, cost-aware, and logged. No black
              boxes, no curve-fitting.
            </p>
            <div className="flex gap-10 mt-10">
              {[["4,200", "SCANS / DAY"], ["10", "STRATEGIES"], ["99.9%", "DATA UPTIME"]].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-3xl font-medium">{n}</p>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-muted mt-1.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden">
            {STRATEGIES.map(([n, name, cat], i) => (
              <div key={n} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-line" : ""} hover:bg-amber/[0.03] transition-colors`}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted">{n}</span>
                  <span className="text-body">{name}</span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted uppercase">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS ── */}
      <section id="waitlist" className="max-w-shell mx-auto px-5 py-24">
        <div className="relative overflow-hidden card px-6 py-16 md:py-20 text-center">
          <p className="eyebrow mb-5">[ AHQ : EARLY ACCESS ]</p>
          <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]">
            Be first when the<br />platform <Accent>ships</Accent>.
          </h2>
          <p className="text-muted mt-5 text-base max-w-lg mx-auto leading-relaxed">
            Pro scanner signals, the AI copilot and the full education library
            roll out in phases. Join the list — no spam, only launches.
          </p>
          <div className="mt-8 flex justify-center">
            <WaitlistForm source="landing" />
          </div>
          <p className="mt-6 font-mono text-[11px] tracking-[0.2em] text-muted">NSE · NYSE · NASDAQ</p>
        </div>
      </section>
    </>
  );
}
