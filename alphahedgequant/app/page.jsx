"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";

// Rotating consensus-scan terminal demo — real symbols, illustrative output.
const SCANS = [
  ["$ ahq scan --consensus RELIANCE", "├─ street mean target   ₹1,695", "├─ vs last close        +28.6% upside", "└─ verdict              BUY · logged to Trust Tracker"],
  ["$ ahq scan --consensus HDFCBANK", "├─ street mean target   ₹1,048", "├─ vs last close        +31.6% upside", "└─ verdict              BUY · logged to Trust Tracker"],
  ["$ ahq backtest \"golden cross on TCS, 2 ATR stop\"", "├─ parsed               SMA(50) ⤯ SMA(200) · ATR stop", "├─ sharpe / max DD      1.12 / −14.3%", "└─ verdict              beats buy-and-hold after costs"],
  ["$ ahq scan --consensus IRFC", "├─ street mean target   ₹60", "├─ vs last close        −34.6% downside", "└─ verdict              SELL · logged to Trust Tracker"],
  ["$ ahq report --latest", "├─ The Twin Pause       Fed 3.50–3.75% vs RBI 5.25%", "├─ India Macro Monthly  CPI 4.38% · record trade deficit", "└─ every figure         verified vs primary source"],
];

const STRATS = [
  "Engle-Granger pairs", "Johansen basket", "PCA stat-arb", "Kalman filter",
  "OU mean reversion", "Momentum", "HMM regimes", "VRP harvesting",
  "Multi-pair scan", "Ledoit-Wolf optimization",
];

function Terminal() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setShown((s) => {
        if (s < SCANS[idx].length) return s + 1;
        return s;
      });
    }, 450);
    const scanTimer = setInterval(() => {
      setIdx((i) => (i + 1) % SCANS.length);
      setShown(1);
    }, 4200);
    return () => { clearInterval(lineTimer); clearInterval(scanTimer); };
  }, [idx]);

  return (
    <div className="card p-5 font-mono text-[13px] leading-relaxed max-w-xl w-full" aria-label="Live scan demo">
      <div className="flex gap-1.5 mb-3" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-[#f0564f]/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2dd482]/70" />
      </div>
      <div className="min-h-[104px]">
        {SCANS[idx].slice(0, shown).map((line, i) => (
          <p key={i} className={i === 0 ? "text-amber" : "text-body/80"}>{line}</p>
        ))}
        <span className="inline-block w-2 h-4 bg-amber/80 animate-pulse align-middle" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-shell mx-auto px-5 pt-20 pb-24 relative fade-up">
          <p className="eyebrow mb-5">[ AHQ : QUANT RESEARCH PLATFORM ]</p>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight leading-[1.08]">
                Trade the numbers,
                <br />
                <span className="grad-text">not the tips.</span>
              </h1>
              <p className="mt-6 text-muted text-lg max-w-xl leading-relaxed">
                Live NSE &amp; US screeners, a 10-strategy quant scanner, analyst
                calls scored against what actually happened, and an AI copilot
                that turns plain English into honest backtests.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/screener" className="btn-primary">Open the screener</Link>
                <Link href="/tracker" className="btn-ghost">See who to trust</Link>
              </div>
              <p className="mt-10 font-mono text-xs text-muted tracking-wide">
                COINTEGRATION · STAT-ARB · REGIME DETECTION · OPTIONS GREEKS · PORTFOLIO OPTIMIZATION
              </p>
            </div>
            <div className="flex lg:justify-end">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-shell mx-auto px-5 py-6 grid gap-5 md:grid-cols-3">
        {[
          {
            tag: "AHQ:TRUST",
            title: "Analyst calls, scored",
            desc: "Every brokerage target is logged with the price on the day it was made — then graded against what the market actually did. A credit score for the sell side, fed daily by street consensus.",
            href: "/tracker",
            cta: "Open the Trust Tracker",
          },
          {
            tag: "AHQ:AI",
            title: "AI Quant Copilot",
            desc: "Describe a strategy in a sentence. The copilot converts it to a whitelisted rule spec — never code — and runs a deterministic backtest with real costs, ATR stops and honest next-bar fills.",
            href: "/copilot",
            cta: "Try the copilot",
          },
          {
            tag: "AHQ:MACRO",
            title: "Primary-source reports",
            desc: "Macro research where every figure is verified against the primary release — MoSPI, GSTN, RBI, the Fed, BLS — before publication. No hot takes, no unverified numbers.",
            href: "/reports",
            cta: "Read the reports",
          },
        ].map((p) => (
          <Link key={p.tag} href={p.href} className="card p-6 hover:border-amber/40 transition-colors group">
            <p className="eyebrow mb-4">[ {p.tag} ]</p>
            <h2 className="font-display text-xl font-medium mb-3">{p.title}</h2>
            <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
            <p className="mt-5 text-sm text-amber opacity-0 group-hover:opacity-100 transition-opacity">
              {p.cta} →
            </p>
          </Link>
        ))}
      </section>

      {/* STRATEGY TAPE */}
      <section className="border-y border-line mt-16 py-4 overflow-hidden">
        <div className="flex gap-8 whitespace-nowrap font-mono text-xs text-muted px-5">
          {STRATS.map((s, i) => (
            <span key={s}>
              <span className="text-amber mr-2">{String(i + 1).padStart(2, "0")}</span>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="max-w-shell mx-auto px-5 py-24">
        <div className="card p-8 md:p-12 max-w-2xl mx-auto text-center">
          <p className="eyebrow mb-4">[ AHQ : EARLY ACCESS ]</p>
          <h2 className="font-display text-2xl md:text-3xl font-medium">
            Be first when the full platform ships
          </h2>
          <p className="text-muted mt-3 text-sm leading-relaxed">
            Pro scanner signals, the AI copilot and the full education library
            are rolling out in phases. Join the list — no spam, only launches.
          </p>
          <div className="mt-7 flex justify-center">
            <WaitlistForm source="landing" />
          </div>
        </div>
      </section>
    </>
  );
}
