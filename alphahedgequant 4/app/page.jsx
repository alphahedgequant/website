"use client";

import Link from "next/link";
import { useState } from "react";

const STRATS = [
  "Engle-Granger pairs", "Johansen basket", "PCA stat-arb", "Kalman filter",
  "OU mean reversion", "Momentum", "HMM regimes", "VRP harvesting",
  "Multi-pair scan", "Ledoit-Wolf optimization",
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <svg
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-64 opacity-60 pointer-events-none"
          viewBox="0 0 1200 240"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,170 L60,158 L110,176 L170,142 L230,150 L290,118 L350,131 L420,96 L480,108 L540,79 L610,92 L670,60 L740,71 L800,48 L870,62 L930,38 L1000,52 L1060,26 L1130,40 L1200,14"
            fill="none"
            stroke="#F0A93B"
            strokeWidth="1.5"
            strokeOpacity="0.9"
          />
          <path
            d="M0,170 L60,158 L110,176 L170,142 L230,150 L290,118 L350,131 L420,96 L480,108 L540,79 L610,92 L670,60 L740,71 L800,48 L870,62 L930,38 L1000,52 L1060,26 L1130,40 L1200,14 L1200,240 L0,240 Z"
            fill="#F0A93B"
            fillOpacity="0.05"
          />
        </svg>

        <div className="max-w-shell mx-auto px-5 pt-24 pb-28 relative fade-up">
          <p className="eyebrow mb-5">[ AHQ : QUANT RESEARCH PLATFORM ]</p>
          <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight leading-[1.08] max-w-3xl">
            Find the edge.
            <br />
            Hedge the rest.
          </h1>
          <p className="mt-6 text-muted text-lg max-w-xl leading-relaxed">
            AlphaHedgeQuant combines live NSE &amp; US market intelligence, a
            10-strategy quantitative scanner and an AI backtesting agent — with
            an education hub that teaches you the math behind every signal.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/screener" className="btn-primary">
              Open the screener
            </Link>
            <Link href="/learn" className="btn-ghost">
              Start learning quant
            </Link>
          </div>
          <p className="mt-10 font-mono text-xs text-muted tracking-wide">
            COINTEGRATION · STAT-ARB · REGIME DETECTION · OPTIONS GREEKS · PORTFOLIO OPTIMIZATION
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-shell mx-auto px-5 py-6 grid gap-5 md:grid-cols-3">
        {[
          {
            tag: "AHQ:MKT",
            title: "FINVIZ-grade screener",
            desc: "Live NSE + US equity screener: 26 stackable filters, 5 view modes, signals, presets and CSV export across 200+ names — FINVIZ-grade, two markets.",
            href: "/screener",
            cta: "Open the screener",
          },
          {
            tag: "AHQ:SCAN",
            title: "10-strategy quant scanner",
            desc: "Cointegration pairs, Kalman filters, OU processes, HMM regime detection and Ledoit-Wolf optimization producing live BUY / SELL / HOLD signals with position sizing.",
            href: "/models",
            cta: "See the strategies",
          },
          {
            tag: "AHQ:AI",
            title: "AI backtesting agent",
            desc: "Describe a strategy in plain English. The agent parses it, routes it through the scanner engine, and returns equity curve, Sharpe, drawdown and a written verdict.",
            href: "/backtest",
            cta: "Preview the agent",
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
            Pro scanner signals, the AI backtesting agent and the full
            education library are rolling out in phases. Join the list — no
            spam, only launches.
          </p>
          {sent ? (
            <p className="mt-7 text-gain font-medium">
              You&apos;re on the list. Talk soon.
            </p>
          ) : (
            <form
              className="mt-7 flex flex-col sm:flex-row gap-3 justify-center"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email.includes("@")) return;
                const id = process.env.NEXT_PUBLIC_FORMSPREE_ID;
                if (!id) {
                  window.location.href = `mailto:hello@alphahedgequant.com?subject=Waitlist%20signup&body=${encodeURIComponent(email)}`;
                  return;
                }
                try {
                  const res = await fetch(`https://formspree.io/f/${id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  if (res.ok) setSent(true);
                  else alert("Something went wrong — please email hello@alphahedgequant.com");
                } catch {
                  alert("Something went wrong — please email hello@alphahedgequant.com");
                }
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-ink border border-line rounded-lg px-4 py-2.5 text-sm w-full sm:w-72 outline-none focus:border-amber/60"
              />
              <button type="submit" className="btn-primary justify-center">
                Join waitlist
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
