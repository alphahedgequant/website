"use client";
// Options Analytics entry: choose a country, then open that market's analytics.
// Motion: twinkling starfield, a green horizon arc with a travelling light, and a chosen-card
// expansion. All motion is skipped when the visitor prefers reduced motion.
import { useEffect, useRef, useState } from "react";
import "./marketGate.css";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Starfield({ density = 0.00018, className = "mg-stars" }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0, stars = [], w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.max(40, Math.round(w * h * density)) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.6 + 0.2, s: Math.random() * 0.8 + 0.2, p: Math.random() * Math.PI * 2,
        g: Math.random() < 0.12,
      }));
    };
    const draw = t => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reducedMotion() ? 1 : 0.65 + 0.35 * Math.sin(t / 1000 * s.s + s.p);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.g ? "#7ef0b6" : "#e9eef6";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reducedMotion() && !document.hidden) raf = requestAnimationFrame(draw);
    };
    resize(); raf = requestAnimationFrame(draw);
    const onVis = () => { if (!document.hidden) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } };
    window.addEventListener("resize", resize); document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, [density]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export function Horizon({ compact = false }) {
  return <div className={"mg-horizon" + (compact ? " is-compact" : "")} aria-hidden="true"><span className="mg-arc" /><span className="mg-comet" /></div>;
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
      <Starfield />
      <Horizon />
      <div className="mg-inner">
        <div className="mg-kicker"><span className="mg-alpha">α</span> AlphaHedgeQuant <i /> Options Analytics</div>
        <h1 id="mg-title" className="mg-title">Read every option chain.<br /><span>Start with a market.</span></h1>
        <p className="mg-sub">Gamma, delta, open interest and volatility — strike by strike, expiry by expiry, for the market you choose.</p>
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
