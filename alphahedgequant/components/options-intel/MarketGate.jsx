"use client";
// Options Analytics entry: choose a country, then open that market's analytics.
// Motion: AHQ alpha-orbit, live market pulses and a chosen-card
// expansion. All motion is skipped when the visitor prefers reduced motion.
import { useEffect, useRef, useState } from "react";
import "./marketGate.css";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** AHQ α orbit: the homepage sphere, with orbits carrying live-signal "satellites". Pure SVG + CSS. */
export function Orbit({ size = 360, className = "" }) {
  return (
    <div className={"ahq-orbit " + className} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 400 400" width="100%" height="100%">
        <defs>
          <radialGradient id="orbSphere" cx="38%" cy="32%" r="70%">
            <stop offset="0" stopColor="#4a4636" /><stop offset=".35" stopColor="#1c1d1f" /><stop offset=".8" stopColor="#0a0b0d" /><stop offset="1" stopColor="#050608" />
          </radialGradient>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%"><stop offset=".55" stopColor="#2dd482" stopOpacity="0" /><stop offset=".72" stopColor="#2dd482" stopOpacity=".16" /><stop offset="1" stopColor="#2dd482" stopOpacity="0" /></radialGradient>
          <linearGradient id="orbAlpha" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#eacd78" /><stop offset="1" stopColor="#a8873a" /></linearGradient>
        </defs>
        <circle cx="200" cy="200" r="196" fill="url(#orbGlow)" className="orb-breathe" />
        <circle cx="200" cy="200" r="132" fill="url(#orbSphere)" stroke="rgba(227,190,79,.18)" />
        <text x="200" y="236" textAnchor="middle" className="orb-alpha" fill="url(#orbAlpha)">α</text>
        {[["o1", -18, 182, 60, 22], ["o2", 28, 176, 74, 34], ["o3", -62, 168, 50, 48]].map(([id, tilt, rx, ry, dur]) => (
          <g key={id} transform={`rotate(${tilt} 200 200)`}>
            <ellipse cx="200" cy="200" rx={rx} ry={ry} className="orb-path" />
            <g className="orb-spin" style={{ animationDuration: dur + "s" }}>
              <g transform={`translate(200 200) scale(${rx / 100} ${ry / 100})`}>
                <circle cx="100" cy="0" r={3.2 / (rx / 100)} className="orb-sat" />
              </g>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

function useLevels() {
  const [lv, setLv] = useState({ in: null, us: null });
  useEffect(() => {
    let live = true;
    fetch("/api/market/indices", { cache: "no-store" }).then(r => r.json()).then(j => live && j?.success && setLv(v => ({ ...v, in: j.data }))).catch(() => {});
    fetch("/api/market/us-indices", { cache: "no-store" }).then(r => r.json()).then(j => live && j?.success && setLv(v => ({ ...v, us: j.data }))).catch(() => {});
    return () => { live = false; };
  }, []);
  return lv;
}
const f = (v, dp = 2) => (v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: dp }));
const chg = (c, p) => (c == null || !Number(p) && !Number(c) ? null : `${c > 0 ? "+" : ""}${f(c)}${p ? ` (${p > 0 ? "+" : ""}${Number(p).toFixed(2)}%)` : ""}`);

const MARKETS = [
  { id: "IN", code: "IN", name: "India", venues: "NSE · BSE", chips: ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX", "F&O stocks"],
    status: { live: true, text: "Live chain via Upstox" } },
  { id: "US", code: "US", name: "United States", venues: "NYSE · Nasdaq · Cboe", chips: ["SPX", "NDX", "SPY", "QQQ", "IWM", "US stocks"],
    status: { live: false, text: "Options feed connecting soon · index levels live" } },
];

export default function MarketGate({ onPick }) {
  const lv = useLevels();
  const [chosen, setChosen] = useState(null);
  const pick = id => {
    if (chosen) return;
    setChosen(id);
    setTimeout(() => onPick(id), reducedMotion() ? 0 : 720);
  };
  const quote = id => {
    if (id === "IN") { const n = lv.in?.NIFTY50, b = lv.in?.BANKNIFTY; return [["NIFTY 50", f(n?.value), chg(n?.change, n?.changePct)], ["BANK NIFTY", f(b?.value), chg(b?.change, b?.changePct)]]; }
    const s = lv.us?.["S&P 500"], v = lv.us?.VIX; return [["S&P 500", f(s?.value), chg(s?.change, s?.changePct)], ["VIX", f(v?.value), chg(v?.change, v?.changePct)]];
  };
  return (
    <section className={"mg-root" + (chosen ? " is-leaving" : "")} aria-labelledby="mg-title">
      <div className="mg-grid-bg" aria-hidden="true" />
      <div className="mg-inner">
        <div className="mg-hero">
          <div className="mg-copy">
            <div className="mg-kicker"><span className="mg-alpha">α</span> AlphaHedgeQuant <i /> Options Analytics</div>
            <h1 id="mg-title" className="mg-title">Everyone sees the chain.<br /><span>We tell you what it means.</span></h1>
            <p className="mg-sub">Plain-language readings of open interest, gamma, decay and imbalances — what changed, why it matters, and the numbers behind it. Pick a market to begin.</p>
          </div>
          <Orbit size={340} className="mg-orbit" />
        </div>
        <div className="mg-cards" role="list">
          {MARKETS.map((m, i) => (
            <button key={m.id} type="button" role="listitem" className={"mg-card" + (chosen === m.id ? " is-chosen" : chosen ? " is-dim" : "")}
              style={{ "--i": i }} onClick={() => pick(m.id)} aria-label={`Open ${m.name} options analytics`}>
              <span className="mg-ring" aria-hidden="true" />
              <div className="mg-card-head">
                <span className="mg-code">{m.code}<em aria-hidden="true" /></span>
                <div><strong>{m.name}</strong><small>{m.venues}</small></div>
                <span className="mg-go" aria-hidden="true">→</span>
              </div>
              <div className="mg-quotes">{quote(m.id).map(([l, v, c]) => <div key={l}><small>{l}</small><b>{v}</b>{c && <span className={c.startsWith("+") ? "up" : "down"}>{c}</span>}</div>)}</div>
              <div className="mg-chips">{m.chips.map(c => <span key={c}>{c}</span>)}</div>
              <div className={"mg-status" + (m.status.live ? " is-live" : "")}><i />{m.status.text}</div>
            </button>
          ))}
        </div>
        <p className="mg-foot">Index levels may be delayed. Analytics are modelled from the option chain for research and education — not investment advice.</p>
      </div>
    </section>
  );
}
