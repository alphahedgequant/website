"use client";
// "Today's Story": the first thing a visitor sees. One sentence, a map of the levels that matter, and the
// readings ranked by how much attention they deserve. Every reading shows its numbers and its rule.
import { useEffect, useMemo, useRef, useState } from "react";
import { buildStory, convexityTable, premiumBursts, decayVsTime, quoteImbalance, qtyText, moneyText } from "@/lib/optionsSignals.mjs";
import { yearsToExpiry, straddle as straddleOf, contractsFromSnapshot } from "@/lib/optionsIntel.mjs";
import { loadSymbolHistory } from "./useOptionsData";
import { Panel, Empty, Metric, CatChart, n2, pct, ist, tone } from "./ui";

const TOPICS = [
  ["all", "Everything"], ["gamma", "Gamma & blasts"], ["oi", "Open interest"], ["decay", "Decay"], ["vol", "Volatility"], ["imbalance", "Imbalances"], ["range", "Range"],
];
const GLYPH = { gamma: "Γ", oi: "OI", decay: "θ", vol: "σ", imbalance: "⇄", range: "↔" };
const KIND_LABEL = { hot: "Needs attention", watch: "Worth watching", info: "Context" };

/** Comparable stored sessions for decay (same underlying, similar days-to-expiry). */
function useDecayHistory(ctx) {
  const [hist, setHist] = useState([]);
  const dte = ctx.summary?.T != null ? ctx.summary.T * 365 : null;
  useEffect(() => {
    let live = true;
    if (dte == null || !ctx.symbol) return;
    loadSymbolHistory(ctx.symbol, ctx.day).then(days => {
      if (!live) return;
      const out = [];
      for (const d of days) for (const s of d.series) {
        const a = s.snaps[0], b = s.snaps.at(-1);
        const d0 = yearsToExpiry(s.expiry, a.t, ctx.market) * 365;
        if (Math.abs(d0 - dte) > 0.75) continue;
        const A = contractsFromSnapshot(a), B = contractsFromSnapshot(b);
        const sa = A.spot > 0 ? straddleOf(A.contracts, A.spot) : null, sb = B.spot > 0 ? straddleOf(B.contracts, B.spot) : null;
        if (sa?.total && sb?.total) out.push({ day: d.day, decayPct: (sb.total / sa.total - 1) * 100 });
      }
      setHist(out);
    });
    return () => { live = false; };
  }, [ctx.symbol, ctx.day, ctx.market, dte == null ? null : Math.round(dte * 2)]); // eslint-disable-line react-hooks/exhaustive-deps
  return hist;
}

export function useStory(ctx) {
  const history = useDecayHistory(ctx);
  return useMemo(() => buildStory({ parsed: ctx.parsed, summary: ctx.summary, snaps: ctx.snaps, nowMs: ctx.nowMs, market: ctx.market, symbol: ctx.symbol, rv: ctx.rv, history }),
    [ctx.parsed, ctx.summary, ctx.snaps, ctx.nowMs, ctx.market, ctx.symbol, ctx.rv, history]);
}

// ---------------------------------------------------------------- range map
export function RangeMap({ levels, market = "IN", onPick }) {
  const wrap = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(e => setW(Math.max(320, e[0].contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  if (!levels?.spot) return <Empty title="NO LEVELS YET">The map appears once a verified chain is received.</Empty>;
  const S = levels.spot;
  const marks = [
    { k: "putOiWall", x: levels.putOiWall, label: "Put OI wall", cls: "sup", desc: "Largest put open interest below spot — commonly read as support." },
    { k: "putWall", x: levels.putWall, label: "Put gamma wall", cls: "sup", desc: "Most negative put gamma exposure — where modelled hedging is heaviest below spot." },
    { k: "flip", x: levels.flip, label: "Gamma flip", cls: "flip", desc: "Above: modelled hedging cushions moves. Below: hedging can accelerate them." },
    { k: "maxPain", x: levels.maxPain, label: "Max pain", cls: "mp", desc: "Expiry price that would pay option holders the least." },
    { k: "pin", x: levels.pin, label: "Pin", cls: "pin", desc: "Strike with the highest pin-pressure score (not a probability)." },
    { k: "callWall", x: levels.callWall, label: "Call gamma wall", cls: "res", desc: "Largest positive call gamma exposure above spot." },
    { k: "callOiWall", x: levels.callOiWall, label: "Call OI wall", cls: "res", desc: "Largest call open interest above spot — commonly read as resistance." },
  ].filter(m => m.x != null && Number.isFinite(m.x));
  const xs = [S, levels.lower, levels.upper, ...marks.map(m => m.x)].filter(v => v != null && Number.isFinite(v));
  let lo = Math.min(...xs), hi = Math.max(...xs);
  const pad = (hi - lo) * 0.08 || S * 0.01; lo -= pad; hi += pad;
  const L = 18, R = 18, H = 200, axisY = 112;
  const X = v => L + (v - lo) / (hi - lo) * (w - L - R);
  // label lanes: alternate above/below and push further out when labels collide
  const placed = [];
  const lanesUp = [], lanesDn = [];
  [...marks].sort((a, b) => a.x - b.x).forEach((m, i) => {
    const px = X(m.x), lanes = i % 2 ? lanesDn : lanesUp;
    let lane = 0; while (lanes[lane] != null && px - lanes[lane] < 118) lane++;
    lanes[lane] = px;
    placed.push({ ...m, px, up: i % 2 === 0, lane });
  });
  const tick = (v => { const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / 4))); const s2 = [1, 2, 5, 10].map(k => k * step).find(k => (hi - lo) / k <= 6); const out = []; for (let t = Math.ceil(lo / s2) * s2; t <= hi; t += s2) out.push(t); return out; })();
  return (
    <div ref={wrap} className="st-map">
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Map of key option levels around spot">
        <defs>
          <linearGradient id="stBand" x1="0" x2="1"><stop offset="0" stopColor="#2dd482" stopOpacity="0" /><stop offset=".5" stopColor="#2dd482" stopOpacity=".18" /><stop offset="1" stopColor="#2dd482" stopOpacity="0" /></linearGradient>
          <radialGradient id="stSpot"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#7ef0b6" /><stop offset="1" stopColor="#2dd482" stopOpacity="0" /></radialGradient>
        </defs>
        {levels.lower != null && levels.upper != null && <g>
          <rect x={X(levels.lower)} y={axisY - 22} width={Math.max(2, X(levels.upper) - X(levels.lower))} height={44} fill="url(#stBand)" rx="10" />
          {[levels.lower, levels.upper].map(v => <line key={v} x1={X(v)} x2={X(v)} y1={axisY - 14} y2={axisY + 14} className="st-band-edge" />)}
        </g>}
        <line x1={L} x2={w - R} y1={axisY} y2={axisY} className="st-axis" />
        {tick.map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1={axisY - 4} y2={axisY + 4} className="st-axis" /><text x={X(t)} y={H - 6} textAnchor="middle" className="st-tick">{n2(t, 0)}</text></g>)}
        {placed.map(m => {
          const y = m.up ? axisY - 34 - m.lane * 26 : axisY + 40 + m.lane * 22;
          return <g key={m.k} className={"st-mark " + m.cls} onClick={() => onPick?.(m.x)} style={{ cursor: onPick ? "pointer" : "default" }}>
            <title>{m.label}: {n2(m.x, 0)} — {m.desc}</title>
            <line x1={m.px} x2={m.px} y1={axisY} y2={m.up ? y + 6 : y - 14} />
            <circle cx={m.px} cy={axisY} r="4" />
            <text x={m.px} y={y} textAnchor="middle">{m.label} · {n2(m.x, 0)}</text>
          </g>;
        })}
        <g className="st-spot">
          <circle cx={X(S)} cy={axisY} r="16" fill="url(#stSpot)" className="st-spot-glow" />
          <circle cx={X(S)} cy={axisY} r="5.5" fill="#fff" />
          <text x={X(S)} y={axisY - 12} textAnchor="middle" className="st-spot-t">SPOT {n2(S, 1)}</text>
        </g>
      </svg>
      <div className="st-legend"><span className="band">Shaded = range options are pricing by expiry{levels.lower != null ? ` (${n2(levels.lower, 0)} – ${n2(levels.upper, 0)})` : ""}</span><span className="sup">Support side</span><span className="res">Resistance side</span><span className="flip">Regime line</span><span className="mp">Max pain</span><span className="pin">Pin</span><span>Hover a marker for what it means · click to inspect the strike</span></div>
    </div>
  );
}

// ---------------------------------------------------------------- cards
function SignalCard({ s, ctx, i }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={"st-card k-" + s.kind} style={{ "--i": i }}>
      <header>
        <span className="st-glyph" aria-hidden="true">{GLYPH[s.topic] || "•"}</span>
        <span className="st-kind">{s.kind === "hot" && <i className="st-pulse" />}{KIND_LABEL[s.kind]}</span>
      </header>
      <h4>{s.title}</h4>
      <p>{s.detail}</p>
      <dl className="st-evidence">{s.evidence.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <footer>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? "Hide the rule" : "How we read this"}</button>
        {s.strike != null && <button type="button" onClick={() => ctx.selectStrike(s.strike)}>Inspect {n2(s.strike, 0)}</button>}
        {s.view && <button type="button" className="go" onClick={() => ctx.goTab?.(s.view)}>Explore →</button>}
      </footer>
      {open && <p className="st-how">{s.how}</p>}
    </article>
  );
}

const PRIMER = [
  ["Open interest + price", "OI ↑ & premium ↑ → new buyers (long build-up). OI ↑ & premium ↓ → new sellers (short build-up). OI ↓ & premium ↑ → sellers exiting (short covering). OI ↓ & premium ↓ → buyers exiting (long unwinding)."],
  ["Where writers sit", "Big call OI above spot and big put OI below are usually written positions that sellers defend — the market's informal ceiling and floor."],
  ["Gamma", "Gamma is how fast an option's delta changes. When dealers are long gamma their hedging calms the market; short gamma makes it jumpy. The flip is where that switches."],
  ["The straddle", "ATM call + put = what the market charges for movement until expiry. Its breakevens are the range options are pricing."],
  ["Decay", "Options lose value every day (theta). When the straddle melts faster than time alone explains, volatility is being sold; slower or rising means movement or fear is being bought."],
  ["Gamma blast", "Close to expiry, cheap out-of-the-money options can multiply in minutes on a small index move. It cuts both ways and reverses fast."],
];

export function StoryTab({ ctx }) {
  const story = useStory(ctx);
  const [topic, setTopic] = useState("all");
  const [primer, setPrimer] = useState(false);
  if (ctx.status === "notConnected") return <Empty title="US OPTIONS FEED NOT CONNECTED">Today's story for US markets appears as soon as a US options data provider is connected. US index levels and VIX above are live.</Empty>;
  if (!ctx.parsed?.contracts?.length || !story.headline) return <Empty title={ctx.status === "loading" ? "READING THE CHAIN…" : "NO VERIFIED OPTION CHAIN"}>{ctx.error || "The story is written only from a verified chain."}</Empty>;
  const shown = story.signals.filter(s => topic === "all" || s.topic === topic);
  const counts = Object.fromEntries(TOPICS.map(([k]) => [k, k === "all" ? story.signals.length : story.signals.filter(s => s.topic === k).length]));
  const hot = story.signals.filter(s => s.kind === "hot").length, watch = story.signals.filter(s => s.kind === "watch").length;
  const lv = story.levels;
  return (
    <div className="st-root">
      <section className="st-hero">
        <div className="st-hero-top">
          <span className="st-eyebrow">TODAY'S READ · {ctx.symbol} · expiry {ctx.expiry} · {ist(ctx.nowMs)} IST{ctx.isReplay ? " · REPLAY" : ""}</span>
          <span className="st-count">{hot ? <b className="hot">{hot} need attention</b> : null}{watch ? <b>{watch} worth watching</b> : null}{!hot && !watch ? <b>Quiet session — context only</b> : null}</span>
        </div>
        <p className="st-headline">{story.headline}</p>
        <div className="st-chips">
          <Metric label="SPOT" value={n2(lv.spot, 1)} />
          <Metric label="PRICED RANGE" value={lv.lower != null ? `${n2(lv.lower, 0)} – ${n2(lv.upper, 0)}` : "—"} />
          <Metric label="SUPPORT (PUT OI)" value={lv.putOiWall != null ? n2(lv.putOiWall, 0) : "—"} cls="oi-up" />
          <Metric label="RESISTANCE (CALL OI)" value={lv.callOiWall != null ? n2(lv.callOiWall, 0) : "—"} cls="oi-down" />
          <Metric label="REGIME LINE" value={lv.flip != null ? n2(lv.flip, 0) : "none ±5%"} detail={lv.flip != null ? (lv.spot > lv.flip ? "spot above → calmer" : "spot below → jumpier") : ""} />
        </div>
        <RangeMap levels={lv} market={ctx.market} onPick={ctx.selectStrike} />
      </section>

      <div className="st-filter" role="group" aria-label="Filter readings">
        {TOPICS.map(([k, l]) => counts[k] > 0 || k === "all" ? <button key={k} type="button" aria-pressed={topic === k} onClick={() => setTopic(k)}>{l}<span>{counts[k]}</span></button> : null)}
        <button type="button" className="st-primer-btn" aria-expanded={primer} onClick={() => setPrimer(p => !p)}>{primer ? "Hide the basics" : "New to options data? The basics →"}</button>
      </div>
      {primer && <div className="st-primer">{PRIMER.map(([h, t]) => <div key={h}><strong>{h}</strong><p>{t}</p></div>)}</div>}

      <div className="st-cards">{shown.map((s, i) => <SignalCard key={s.id} s={s} ctx={ctx} i={i} />)}</div>
      <p className="oi-note">Readings describe positioning and option pricing from the chain — not predictions or advice. Labels: dealer-gamma and probabilities are modelled; OI, prices and quotes are observed; "usually read as" marks a common market interpretation.</p>
    </div>
  );
}

// ---------------------------------------------------------------- focused views
export function GammaBlastView({ ctx, span }) {
  const conv = useMemo(() => ctx.parsed?.spot > 0 ? convexityTable(ctx.parsed.contracts, ctx.parsed.spot, ctx.nowMs).slice(0, 10) : [], [ctx.parsed, ctx.nowMs]);
  const bursts = useMemo(() => premiumBursts(ctx.snaps).slice(0, 8), [ctx.snaps]);
  if (!ctx.parsed?.contracts?.length) return <Panel title="Gamma blast watch" span={span}><Empty title={ctx.status === "notConnected" ? "US OPTIONS FEED NOT CONNECTED" : "NO VERIFIED OPTION CHAIN"} /></Panel>;
  const days = ctx.summary?.T != null ? ctx.summary.T * 365 : null;
  const live = days != null && days <= 1;
  return (
    <Panel title="Gamma blast watch" span={span} detail={live ? "EXPIRY WINDOW — small index moves can multiply cheap OTM premiums" : `${days?.toFixed(1)} days to expiry — blast risk builds as expiry nears`}
      badges={live ? <span className="oi-tag zero">LIVE WINDOW</span> : null}>
      <p className="oi-note" style={{ marginTop: 0 }}>Observed bursts (this browser's minute snapshots, last ~15 min):</p>
      {bursts.length ? <table className="oi-table"><thead><tr><th>Contract</th><th>Premium</th><th>Change</th><th>Window</th></tr></thead>
        <tbody>{bursts.map(b => <tr key={b.strike + b.type} onClick={() => ctx.selectStrike(b.strike)}><td>{n2(b.strike, 0)} {b.type}</td><td>{n2(b.ltp - b.dPx)} → {n2(b.ltp)}</td><td className="oi-up">{pct(b.gainPct, 0)}</td><td>{b.minutes} min</td></tr>)}</tbody></table>
        : <p className="oi-muted" style={{ fontSize: 12 }}>None right now. A burst is flagged when an option's premium rises ≥80% within ~15 minutes from ≥1.</p>}
      <p className="oi-note">Most explosive options near spot (model: premium change for a 0.5% move toward the strike):</p>
      <table className="oi-table"><thead><tr><th>Contract</th><th>From spot</th><th>LTP</th><th>+0.5% move</th></tr></thead>
        <tbody>{conv.map(c => <tr key={c.strike + c.type} onClick={() => ctx.selectStrike(c.strike)}><td className={c.type === "CE" ? "oi-up" : "oi-down"}>{n2(c.strike, 0)} {c.type}</td><td>{pct(c.distancePct)}</td><td>{n2(c.ltp)}</td><td><b>{pct(c.gainPct, 0)}</b></td></tr>)}</tbody></table>
    </Panel>
  );
}

export function DecayWatchView({ ctx, span }) {
  const dv = useMemo(() => decayVsTime(ctx.snaps), [ctx.snaps]);
  const path = useMemo(() => (ctx.snaps || []).map(s => { const p = contractsFromSnapshot(s); const st = p.spot > 0 ? straddleOf(p.contracts, p.spot) : null; return st?.total ? { time: ist(s.t).slice(0, 5), total: st.total } : null; }).filter(Boolean), [ctx.snaps]);
  const story = useStory(ctx);
  const d = story.signals.find(s => s.id === "decay");
  return (
    <Panel title="Decay vs normal" span={span} detail="Is the straddle melting faster or slower than time alone explains?">
      {d ? <div className={"st-inline k-" + d.kind}><strong>{d.title}</strong><p>{d.detail}</p></div> : <Empty title="NO STRADDLE QUOTE" />}
      {dv && <div className="oi-metrics" style={{ marginTop: 10 }}>
        <Metric label="ACTUAL CHANGE" value={pct(dv.actualPct, 1)} cls={tone(dv.actualPct)} detail={`${n2(dv.startPx)} → ${n2(dv.endPx)}`} />
        <Metric label="TIME ALONE (MODEL)" value={pct(dv.timePct, 1)} />
        <Metric label="PACE" value={dv.ratio == null ? "—" : dv.ratio.toFixed(2) + "×"} detail="1.0× = normal" />
        <Metric label="SPOT MOVE" value={pct(dv.spotMovePct)} />
      </div>}
      {path.length > 1 && <CatChart rows={path} xKey="time" yFmt={v => n2(v, 1)} series={[{ key: "total", name: "ATM straddle", color: "var(--oi-text)" }]} height={170} />}
    </Panel>
  );
}

export function ImbalanceView({ ctx, span }) {
  const q = useMemo(() => ctx.parsed?.spot > 0 ? quoteImbalance(ctx.parsed.contracts, ctx.parsed.spot) : null, [ctx.parsed]);
  if (!ctx.parsed?.contracts?.length) return <Panel title="Imbalances" span={span}><Empty title={ctx.status === "notConnected" ? "US OPTIONS FEED NOT CONNECTED" : "NO VERIFIED OPTION CHAIN"} /></Panel>;
  const sum = (t, k) => ctx.parsed.contracts.filter(c => c.type === t && c[k] != null).reduce((a, c) => a + c[k], 0);
  const cOI = sum("CE", "oi"), pOI = sum("PE", "oi"), cV = sum("CE", "vol"), pV = sum("PE", "vol"), cChg = sum("CE", "oiChg"), pChg = sum("PE", "oiChg");
  const bar = (a, b, la, lb) => { const t = Math.abs(a) + Math.abs(b) || 1; return <div className="st-bal"><span style={{ width: (Math.abs(a) / t * 100) + "%" }} className="a">{la}</span><span style={{ width: (Math.abs(b) / t * 100) + "%" }} className="b">{lb}</span></div>; };
  const lot = ctx.parsed.lotSize;
  return (
    <Panel title="Imbalances" span={span} detail="Where one side clearly outweighs the other">
      <div className="st-bals">
        <div><small>Open interest (calls vs puts) · PCR {cOI ? (pOI / cOI).toFixed(2) : "—"}</small>{bar(cOI, pOI, qtyText(cOI, lot, ctx.market), qtyText(pOI, lot, ctx.market))}</div>
        <div><small>Today's fresh OI vs previous close</small>{bar(cChg, pChg, qtyText(cChg, lot, ctx.market, true), qtyText(pChg, lot, ctx.market, true))}</div>
        <div><small>Volume traded · volume PCR {cV ? (pV / cV).toFixed(2) : "—"}</small>{bar(cV, pV, qtyText(cV, lot, ctx.market), qtyText(pV, lot, ctx.market))}</div>
        {["calls", "puts"].map(k => q?.[k] ? <div key={k}><small>Best-quote size near the money ({k}) · {pct(q[k].imbalance * 100, 0)}</small>{bar(q[k].bid, q[k].ask, "Bid " + qtyText(q[k].bid, null, ctx.market), "Ask " + qtyText(q[k].ask, null, ctx.market))}</div> : null)}
      </div>
      <p className="oi-note">Green = calls / bids, red = puts / asks. Quote sizes are a snapshot of displayed orders (closing book outside market hours), not executed trades.</p>
    </Panel>
  );
}
