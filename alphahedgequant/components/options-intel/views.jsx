"use client";
// Every analytical view used by the Options Intelligence tabs, the six quick widgets and the
// workspace panes. Views only read the shared context; all maths lives in lib/optionsIntel.mjs.
import { useEffect, useMemo, useState } from "react";
import {
  exposuresByStrike, hedgeLadder, gammaDecay, charmByStrike, dexFlow, ivSmile, straddle, skew25, diffSnapshots,
  aggressorEstimate, oiRotation, oiTape, oiSinceFirst, contractsFromSnapshot, realizedVolFromSnapshots, midPrice,
  bsGreeks, yearsToExpiry, atmStrike, summarize, fmtCr, fmtQty, tagExpiries, MODEL_RATE,
} from "@/lib/optionsIntel.mjs";
import { PLAN_PRO_VIEWS } from "@/lib/optionsWorkspace.mjs";
import {
  Panel, Metric, Empty, Method, Locked, StrikeChart, CatChart, nearSpot, n2, pct, ist, istDT, tone,
  MODEL, OBSERVED, ESTIMATED, BROWSER, UP, DOWN, TEXT, INFO, ACCENT, PIN,
} from "./ui";
import { loadSymbolHistory } from "./useOptionsData";

const GEX_METHOD = [
  "GEX = Γ × OI × S² × 1% (₹ change in delta-notional for a 1% underlying move). OI is in units (Upstox quantity).",
  "Γ is recomputed with Black–Scholes from each contract's own IV, r = 6.5%, no dividend yield, calendar time to 15:30 IST on expiry. Provider gamma is rounded to 4 decimals, so it is not used.",
  "Sign convention (classic): dealers assumed long customer calls (+) and short customer puts (−). Exchange OI does not show who is long or short — this is a model of positioning, not observed dealer books.",
  "Contracts with missing/invalid IV or OI are excluded and counted, never set to zero.",
];
const LEVEL_METHOD = [
  "Gamma flip: spot level where modelled net GEX changes sign, found by re-pricing every contract across ±5% of spot (IV, OI and time held constant). If there is no crossing it says so; with several, the one nearest spot is shown and the count is reported.",
  "Call wall / put wall: strike with the largest positive call GEX / most negative put GEX (gamma-weighted, so a far-OTM OI pile with little gamma is not a wall).",
  "Pin: highest pin-pressure score (see Pin Pressure). Not a settlement prediction.",
];

export function useExposure(ctx, opts = {}) {
  return useMemo(() => {
    if (!ctx.parsed?.contracts?.length || !(ctx.parsed.spot > 0)) return null;
    return exposuresByStrike(ctx.parsed.contracts, { spot: ctx.parsed.spot, nowMs: ctx.nowMs, ...opts });
  }, [ctx.parsed, ctx.nowMs]); // eslint-disable-line react-hooks/exhaustive-deps
}
function noChain(ctx) {
  if (ctx.parsed?.contracts?.length) return null;
  return <Empty title={ctx.status === "loading" ? "LOADING CHAIN…" : "NO VERIFIED OPTION CHAIN"}>{ctx.error || "Analytics are withheld until the provider returns a chain."}</Empty>;
}
const qualityLine = ctx => {
  const q = ctx.parsed?.quality;
  if (!q) return ctx.isReplay ? "Replayed browser snapshot" : null;
  return `${q.usable}/${q.contracts} contracts usable · ${q.missingIv + q.invalidIv} without valid IV · ${q.missingOi} without OI · source ${ist(Date.parse(ctx.parsed.receivedAt))} IST`;
};

// ---------------- Gamma & levels ----------------
export function KeyLevels({ ctx }) {
  const s = ctx.summary;
  if (noChain(ctx)) return <Panel title="Key levels">{noChain(ctx)}</Panel>;
  if (!s) return <Panel title="Key levels"><Empty title="INSUFFICIENT INPUTS">Spot or usable contracts missing.</Empty></Panel>;
  const dist = x => (x == null ? "" : pct((x - s.spot) / s.spot * 100) + " from spot");
  const pcr = s.rows.reduce((a, r) => a + r.callOi, 0) > 0 ? s.rows.reduce((a, r) => a + r.putOi, 0) / s.rows.reduce((a, r) => a + r.callOi, 0) : null;
  return (
    <Panel title={`${ctx.symbol} · key levels`} badges={MODEL} detail={`Expiry ${s.expiry} · computed ${ist(ctx.nowMs)} IST`} footer={qualityLine(ctx)}>
      <div className="oi-metrics">
        <Metric label="SPOT" value={n2(s.spot)} detail={OBSERVED} />
        <Metric label="NET GEX / 1%" value={"₹ " + fmtCr(s.totals.netGex)} cls={tone(s.totals.netGex)} detail={s.regime === "positive" ? "Positive regime (modelled dampening)" : s.regime === "negative" ? "Negative regime (modelled amplification)" : "Flat"} />
        <Metric label="GAMMA FLIP" value={s.flip == null ? "No crossing ±5%" : n2(s.flip, 0)} detail={s.flip == null ? "Net GEX keeps one sign in range" : `${pct((s.flip - s.spot) / s.spot * 100)} from spot · ${s.flipCount} crossing(s)`} />
        <Metric label="CALL WALL" value={s.callWall == null ? "—" : n2(s.callWall, 0)} detail={dist(s.callWall)} />
        <Metric label="PUT WALL" value={s.putWall == null ? "—" : n2(s.putWall, 0)} detail={dist(s.putWall)} />
        <Metric label="PIN (TOP SCORE)" value={s.pin ? n2(s.pin.strike, 0) : "—"} detail={s.pin ? `Score ${s.pin.score}/100 · not a probability` : "No candidate within ±3%"} />
        <Metric label="ATM IV" value={s.straddle?.atmIv != null ? s.straddle.atmIv.toFixed(2) + "%" : "—"} detail="Provider IV, ATM call/put average" />
        <Metric label="ATM STRADDLE" value={s.straddle?.total != null ? n2(s.straddle.total) : "—"} detail={s.straddle?.total != null ? `BE ${n2(s.straddle.lower, 0)} – ${n2(s.straddle.upper, 0)} · ±${s.straddle.impliedMovePct.toFixed(2)}%` : "Quote missing"} />
        <Metric label="PCR (OI)" value={pcr == null ? "—" : pcr.toFixed(3)} detail="Put OI ÷ call OI, this expiry" />
      </div>
      <Method items={[...GEX_METHOD.slice(0, 3), ...LEVEL_METHOD]} />
    </Panel>
  );
}

export function GexByStrike({ ctx, span }) {
  const ex = useExposure(ctx);
  const [mode, setMode] = useState("split");
  const [range, setRange] = useState(0.05);
  if (noChain(ctx) || !ex) return <Panel title="GEX by strike" span={span}>{noChain(ctx) || <Empty title="NO USABLE CONTRACTS" />}</Panel>;
  const rows = nearSpot(ex.rows, ctx.parsed.spot, range).map(r => ({ ...r, sharePct: r.share == null ? null : r.share * 100 }));
  const s = ctx.summary;
  const refs = [{ x: ctx.parsed.spot, label: "Spot", color: TEXT }, { x: s?.flip, label: "Flip", color: INFO }, { x: s?.callWall, label: "Call wall", color: UP }, { x: s?.putWall, label: "Put wall", color: DOWN }];
  const series = mode === "split" ? [{ key: "callGex", name: "Call GEX", color: UP, stack: "g" }, { key: "putGex", name: "Put GEX", color: DOWN, stack: "g" }]
    : mode === "net" ? [{ key: "netGex", name: "Net GEX", signColor: true }]
    : mode === "cum" ? [{ key: "netGex", name: "Net GEX", signColor: true }, { key: "cumGex", name: "Cumulative", type: "line", color: INFO }]
    : [{ key: "sharePct", name: "Share of |GEX| %", color: TEXT }];
  return (
    <Panel title="GEX by strike & net profile" badges={MODEL} span={span} detail={`₹ per 1% move · ${ctx.expiry} · click a bar to inspect the strike`}
      tools={<div className="oi-row">{[["split", "Call/Put"], ["net", "Net"], ["cum", "Cumulative"], ["share", "Share"]].map(([k, l]) =>
        <button key={k} className="oi-chip" aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        <select value={range} onChange={e => setRange(Number(e.target.value))} aria-label="Strike range">{[0.02, 0.05, 0.1, 1].map(v => <option key={v} value={v}>{v === 1 ? "All strikes" : "±" + v * 100 + "%"}</option>)}</select></div>}
      footer={`${ex.excluded} contracts excluded (missing IV/OI). Total |GEX| ₹ ${fmtCr(ex.totals.absGex)}.`}>
      <StrikeChart rows={rows} series={series} refs={refs} onPick={ctx.selectStrike} yFmt={mode === "share" ? v => v.toFixed(1) : undefined} unit={mode === "share" ? "%" : "₹"} />
      <Method items={GEX_METHOD} />
    </Panel>
  );
}

export function GexProfile({ ctx, span }) {
  const s = ctx.summary;
  if (noChain(ctx) || !s) return <Panel title="Net GEX vs spot" span={span}>{noChain(ctx) || <Empty title="NO PROFILE" />}</Panel>;
  return (
    <Panel title="Net GEX profile across spot" badges={MODEL} span={span} detail="Re-priced at hypothetical spot levels; IV, OI and time held constant">
      <StrikeChart rows={s.profile.map(p => ({ ...p, strike: Math.round(p.spot) }))} series={[{ key: "netGex", name: "Net GEX at that spot", type: "line", color: TEXT }]}
        refs={[{ x: s.spot, label: "Spot" }, { x: s.flip, label: "Flip", color: INFO }]} />
      <p className="oi-note">{s.flip == null ? "No sign change within ±5% of spot." : `Flip ≈ ${n2(s.flip, 0)} (${pct((s.flip - s.spot) / s.spot * 100)}). ${s.flipCount > 1 ? s.flipCount + " crossings found; nearest to spot shown." : ""}`}</p>
      <Method items={LEVEL_METHOD.slice(0, 1)} />
    </Panel>
  );
}

export function PinPressure({ ctx, span }) {
  const s = ctx.summary;
  if (noChain(ctx) || !s) return <Panel title="Pin pressure" span={span}>{noChain(ctx) || <Empty title="NO CANDIDATES" />}</Panel>;
  return (
    <Panel title="Pin pressure & conviction" badges={MODEL} span={span} detail="Which strike holds the pressure? 0–100 score, not a probability">
      {!s.pins.length ? <Empty title="NO CANDIDATE STRIKE">No strike with exposure within ±3% of spot.</Empty> :
        s.pins.slice(0, 6).map(p => (
          <div key={p.strike} className="oi-score" onClick={() => { ctx.selectStrike(p.strike); ctx.goTab?.("gamma"); }} style={{ cursor: "pointer" }}
            title={`Concentration ${(p.components.concentration * 100).toFixed(0)} · proximity ${(p.components.proximity * 100).toFixed(0)} · relative ${(p.components.relativeStrength * 100).toFixed(0)} · time ${(p.components.timeToExpiry * 100).toFixed(0)}`}>
            <span>{n2(p.strike, 0)}</span>
            <div className="oi-bar"><i style={{ width: p.score + "%", background: "var(--oi-pin)" }} /></div>
            <b>{p.score}</b>
            <small className="oi-muted" style={{ gridColumn: "1 / -1" }}>{pct(p.distancePct)} from spot · conc {(p.components.concentration * 100).toFixed(0)} · prox {(p.components.proximity * 100).toFixed(0)} · rel {(p.components.relativeStrength * 100).toFixed(0)} · time {(p.components.timeToExpiry * 100).toFixed(0)}</small>
          </div>))}
      <Method items={["Score = 100 × (0.40·concentration + 0.30·proximity + 0.15·relative strength + 0.15·time-to-expiry).",
        "Concentration = strike |GEX| ÷ largest strike |GEX|. Proximity = Gaussian in distance ÷ (spot × ATM IV × √T).",
        "Relative strength = |GEX| vs the mean of ±2 neighbouring strikes (capped). Time factor rises from 0 at 7 days to 1 at expiry.",
        "Candidates within ±3% of spot only. Clicking a row opens the strike in Gamma Lab."]} />
    </Panel>
  );
}

export function HhiView({ ctx, span }) {
  const s = ctx.summary;
  if (noChain(ctx) || !s) return <Panel title="HHI concentration" span={span}>{noChain(ctx)}</Panel>;
  const top = [...s.rows].filter(r => r.share).sort((a, b) => b.share - a.share).slice(0, 8);
  const h = s.hhi;
  return (
    <Panel title="HHI concentration" badges={MODEL} span={span} detail={`Session ${ist(ctx.nowMs)} · expiry ${ctx.expiry}`}>
      <div className="oi-metrics">
        {[["CALL", h.call], ["PUT", h.put], ["COMBINED", h.combined]].map(([l, v]) =>
          <Metric key={l} label={l + " HHI"} value={v ? v.hhi10k.toLocaleString("en-IN") : "—"} detail={v ? `≈ ${v.effectiveStrikes.toFixed(1)} effective strikes` : "No exposure"} />)}
      </div>
      <table className="oi-table" style={{ marginTop: 10 }}><thead><tr><th>Strike</th><th>Share of |GEX|</th><th>Call GEX</th><th>Put GEX</th></tr></thead>
        <tbody>{top.map(r => <tr key={r.strike} onClick={() => ctx.selectStrike(r.strike)}><td>{n2(r.strike, 0)}</td><td>{(r.share * 100).toFixed(2)}%</td><td className="oi-up">{fmtCr(r.callGex)}</td><td className="oi-down">{fmtCr(r.putGex)}</td></tr>)}</tbody></table>
      <Method items={["HHI = Σ sᵢ² × 10,000 where sᵢ is each strike's share of total ABSOLUTE GEX (non-negative weights).", "Effective strikes = 1 ÷ HHI. 10,000 = all exposure on one strike."]} />
    </Panel>
  );
}

export function HedgeLadderView({ ctx, span }) {
  const data = useMemo(() => ctx.parsed?.contracts?.length && ctx.parsed.spot > 0 ? hedgeLadder(ctx.parsed.contracts, { spot: ctx.parsed.spot, nowMs: ctx.nowMs }) : null, [ctx.parsed, ctx.nowMs]);
  if (noChain(ctx) || !data) return <Panel title="Hedge ladder" span={span}>{noChain(ctx)}</Panel>;
  const per = nearSpot(data.perStrikeUp1, ctx.parsed.spot, 0.04);
  return (
    <Panel title="Hedge ladder" badges={MODEL} span={span} detail="Modelled dealer hedge for spot moves (positive = buy underlying)">
      <table className="oi-table"><thead><tr><th>Move</th><th>Spot</th><th>Hedge units</th><th>Hedge ₹</th></tr></thead>
        <tbody>{data.scenarios.map(r => <tr key={r.movePct}><td>{pct(r.movePct, 1)}</td><td>{n2(r.spot, 0)}</td><td className={tone(r.hedgeUnits)}>{fmtQty(r.hedgeUnits)}</td><td className={tone(r.hedgeRs)}>{fmtCr(r.hedgeRs)}</td></tr>)}</tbody></table>
      <p className="oi-note">Per strike, +1% move:</p>
      <StrikeChart rows={per.map(r => ({ ...r, rs: r.rs }))} series={[{ key: "rs", name: "Hedge ₹ (+1%)", signColor: true }]} refs={[{ x: ctx.parsed.spot, label: "Spot" }]} height={180} onPick={ctx.selectStrike} />
      <Method items={["Full delta revaluation at each scenario spot; hedge = −(dealer position × Δ change × OI). Dealer position uses the classic convention (long calls, short puts).",
        "IV, OI and time held constant. This is a sensitivity of a modelled book — AHQ does not observe actual dealer hedging."]} />
    </Panel>
  );
}

export function GammaDecayView({ ctx, span }) {
  const d = useMemo(() => ctx.parsed?.contracts?.length && ctx.parsed.spot > 0 ? gammaDecay(ctx.parsed.contracts, { spot: ctx.parsed.spot, nowMs: ctx.nowMs }) : null, [ctx.parsed, ctx.nowMs]);
  if (noChain(ctx) || !d) return <Panel title="Gamma decay" span={span}>{noChain(ctx)}</Panel>;
  return (
    <Panel title="Gamma decay & IV sensitivity" badges={MODEL} span={span} detail="Net GEX projected under time horizons and IV shocks">
      <div className="oi-grid" style={{ "--cols": 2 }}>
        <CatChart rows={d.time} xKey="label" series={[{ key: "netGex", name: "Net GEX (time)", type: "bar", signColor: true }]} height={190} refY={0} />
        <CatChart rows={d.iv} xKey="label" series={[{ key: "netGex", name: "Net GEX (IV shock)", type: "bar", signColor: true }]} height={190} refY={0} />
      </div>
      <p className="oi-note">{d.heldConstant}</p>
    </Panel>
  );
}

// ---------------- Delta ----------------
export function DexByStrike({ ctx, span }) {
  const ex = useExposure(ctx);
  if (noChain(ctx) || !ex) return <Panel title="Delta exposure" span={span}>{noChain(ctx)}</Panel>;
  return (
    <Panel title="Delta exposure — standing book" badges={MODEL} span={span} detail={`Net DEX ₹ ${fmtCr(ex.totals.netDex)} · calls ₹ ${fmtCr(ex.totals.callDex)} · puts ₹ ${fmtCr(ex.totals.putDex)}`}>
      <StrikeChart rows={nearSpot(ex.rows, ctx.parsed.spot)} series={[{ key: "callDex", name: "Call DEX", color: UP, stack: "d" }, { key: "putDex", name: "Put DEX", color: DOWN, stack: "d" }, { key: "netDex", name: "Net", type: "line", color: TEXT }]}
        refs={[{ x: ctx.parsed.spot, label: "Spot" }]} onPick={ctx.selectStrike} />
      <Method items={["DEX = Δ × OI × S (₹ delta-notional of outstanding OI, option-holder side). Δ from Black–Scholes with each contract's IV.", "Who holds the other side is not observable from OI."]} />
    </Panel>
  );
}

export function DexFlowView({ ctx, span }) {
  const f = useMemo(() => ctx.parsed?.contracts?.length && ctx.parsed.spot > 0 ? dexFlow(ctx.parsed.contracts, { spot: ctx.parsed.spot, nowMs: ctx.nowMs }) : null, [ctx.parsed, ctx.nowMs]);
  const since = useMemo(() => {
    const o = oiSinceFirst(ctx.snaps);
    if (!o || !(ctx.parsed?.spot > 0)) return null;
    let added = 0, reduced = 0;
    for (const r of o.rows) {
      if (r.dOi == null) continue;
      const c = ctx.parsed.contracts.find(x => x.strike === r.strike && x.type === r.type);
      if (!c?.iv) continue;
      const g = bsGreeks(ctx.parsed.spot, c.strike, yearsToExpiry(c.expiry, ctx.nowMs), c.iv, c.type);
      if (!g) continue;
      const v = g.delta * r.dOi * ctx.parsed.spot;
      if (r.dOi >= 0) added += v; else reduced += v;
    }
    return { added, reduced, from: o.from, to: o.to };
  }, [ctx.snaps, ctx.parsed, ctx.nowMs]);
  if (noChain(ctx) || !f) return <Panel title="Today's delta flow" span={span}>{noChain(ctx)}</Panel>;
  return (
    <Panel title="Delta exposure — today's flow" badges={MODEL} span={span} detail="Exposure added vs reduced. Opening/closing side is NOT inferred.">
      <div className="oi-metrics">
        <Metric label="ADDED vs PREV CLOSE" value={"₹ " + fmtCr(f.totals.added)} cls={tone(f.totals.added)} detail={OBSERVED} />
        <Metric label="REDUCED vs PREV CLOSE" value={"₹ " + fmtCr(f.totals.reduced)} cls={tone(f.totals.reduced)} />
        <Metric label="SINCE FIRST OBSERVATION" value={since ? "₹ " + fmtCr(since.added + since.reduced) : "—"} detail={since ? `${ist(since.from)}→${ist(since.to)} · separate comparison` : "Needs ≥2 browser snapshots"} />
      </div>
      <StrikeChart rows={nearSpot(f.rows, ctx.parsed.spot)} series={[
        { key: "callAdded", name: "Call added", color: UP, stack: "a" }, { key: "putAdded", name: "Put added", color: DOWN, stack: "a" },
        { key: "callReduced", name: "Call reduced", color: "#1f7a52", stack: "r" }, { key: "putReduced", name: "Put reduced", color: "#8a2f2b", stack: "r" }]}
        refs={[{ x: ctx.parsed.spot, label: "Spot" }]} height={220} onPick={ctx.selectStrike} />
      <Method items={["Flow DEX = Δ × OI change × S. 'vs previous close' uses the provider's oi_change field; 'since first observation' compares this browser's first and latest snapshots today. The two are never added together."]} />
    </Panel>
  );
}

export function CharmView({ ctx, span }) {
  const [h, setH] = useState("day");
  const rows = useMemo(() => ctx.parsed?.contracts?.length && ctx.parsed.spot > 0 ? charmByStrike(ctx.parsed.contracts, { spot: ctx.parsed.spot, nowMs: ctx.nowMs }) : [], [ctx.parsed, ctx.nowMs]);
  if (noChain(ctx)) return <Panel title="Charm" span={span}>{noChain(ctx)}</Panel>;
  const k = h === "day" ? "Day" : "ToExpiry";
  return (
    <Panel title="Charm — delta drift with time" badges={MODEL} span={span} detail="Δ change × OI × S as calendar time passes, spot and IV fixed"
      tools={<div className="oi-row"><button className="oi-chip" aria-pressed={h === "day"} onClick={() => setH("day")}>1 calendar day</button><button className="oi-chip" aria-pressed={h === "exp"} onClick={() => setH("exp")}>To expiry</button></div>}>
      <StrikeChart rows={nearSpot(rows, ctx.parsed.spot)} series={[{ key: "call" + k, name: "Call", color: UP, stack: "c" }, { key: "put" + k, name: "Put", color: DOWN, stack: "c" }, { key: "net" + k, name: "Net", type: "line", color: TEXT }]}
        refs={[{ x: ctx.parsed.spot, label: "Spot" }]} onPick={ctx.selectStrike} />
      <Method items={["Finite difference: Δ(T − horizon) − Δ(T) with T floored at 5 minutes. 'To expiry' moves each contract to its own expiry.", "Calendar-time convention (ACT/365); weekends count."]} />
    </Panel>
  );
}

export function VannaView({ ctx, span }) {
  const ex = useExposure(ctx);
  const s = ctx.summary;
  if (noChain(ctx) || !ex) return <Panel title="Vanna" span={span}>{noChain(ctx)}</Panel>;
  return (
    <Panel title="Vanna & vanna flip" badges={MODEL} span={span} detail={`Δ change for +1 vol point × OI × S · net ₹ ${fmtCr(ex.totals.netVanna)} · flip ${s?.vannaFlip == null ? "none in ±5%" : n2(s.vannaFlip, 0)}`}>
      <StrikeChart rows={nearSpot(ex.rows, ctx.parsed.spot)} series={[{ key: "callVanna", name: "Call", color: UP, stack: "v" }, { key: "putVanna", name: "Put", color: DOWN, stack: "v" }, { key: "netVanna", name: "Net", type: "line", color: TEXT }]}
        refs={[{ x: ctx.parsed.spot, label: "Spot" }, { x: s?.vannaFlip, label: "Vanna flip", color: INFO }]} onPick={ctx.selectStrike} />
      <Method items={["Vanna = ∂Δ/∂σ = −φ(d₁)·d₂/σ, scaled to one vol point.", "Vanna flip = spot where aggregate modelled vanna changes sign across ±5%; reported only when a crossing exists (count shown when several)."]} />
    </Panel>
  );
}

// ---------------- Flow ----------------
export function OiChange({ ctx, span }) {
  const ex = useExposure(ctx);
  const since = useMemo(() => oiSinceFirst(ctx.snaps), [ctx.snaps]);
  if (noChain(ctx) || !ex) return <Panel title="OI change" span={span}>{noChain(ctx)}</Panel>;
  const sinceByStrike = new Map();
  for (const r of since?.rows || []) if (r.dOi != null) { const o = sinceByStrike.get(r.strike) || { c: 0, p: 0 }; o[r.type === "CE" ? "c" : "p"] += r.dOi; sinceByStrike.set(r.strike, o); }
  const rows = nearSpot(ex.rows, ctx.parsed.spot).map(r => ({ strike: r.strike, callPrev: r.callOiChg, putPrev: r.putOiChg, callSince: sinceByStrike.get(r.strike)?.c ?? null, putSince: sinceByStrike.get(r.strike)?.p ?? null }));
  return (
    <Panel title="OI change — two independent comparisons" span={span} detail="Never added together">
      <div className="oi-grid" style={{ "--cols": 2 }}>
        <div><p className="oi-note">vs previous close {OBSERVED}</p>
          <StrikeChart rows={rows} series={[{ key: "callPrev", name: "Call", color: UP }, { key: "putPrev", name: "Put", color: DOWN }]} refs={[{ x: ctx.parsed.spot, label: "Spot" }]} yFmt={fmtQty} unit="" height={220} onPick={ctx.selectStrike} /></div>
        <div><p className="oi-note">since first observation today {BROWSER} {since ? `${ist(since.from)} → ${ist(since.to)}` : ""}</p>
          {since ? <StrikeChart rows={rows} series={[{ key: "callSince", name: "Call", color: UP }, { key: "putSince", name: "Put", color: DOWN }]} refs={[{ x: ctx.parsed.spot, label: "Spot" }]} yFmt={fmtQty} unit="" height={220} onPick={ctx.selectStrike} />
            : <Empty title="NEEDS SNAPSHOTS">Recorded once a minute while this page is open during market hours. Exchange session-open OI needs the server snapshot worker.</Empty>}</div>
      </div>
    </Panel>
  );
}

export function OiRotationView({ ctx, span }) {
  const rows = useMemo(() => oiRotation(ctx.snaps).map(r => ({ ...r, time: ist(r.t).slice(0, 5) })), [ctx.snaps]);
  return (
    <Panel title="OI rotation by minute" badges={BROWSER} span={span} detail="Aggregate call vs put OI change between consecutive snapshots">
      {rows.length < 1 ? <Empty title="NO ROTATION YET">At least two snapshots of this expiry are needed. Snapshots are stored per strike and expiry in this browser.</Empty>
        : <CatChart rows={rows} xKey="time" yFmt={fmtQty} series={[{ key: "callChg", name: "Call Δ OI", type: "bar", color: UP }, { key: "putChg", name: "Put Δ OI", type: "bar", color: DOWN }, { key: "cumCall", name: "Cum call", color: "#7fe0b0" }, { key: "cumPut", name: "Cum put", color: "#f59b96" }]} refY={0} />}
    </Panel>
  );
}

function lookbackPair(snaps, minutes) {
  const s = [...(snaps || [])].sort((a, b) => a.t - b.t);
  if (s.length < 2) return null;
  const cur = s.at(-1);
  const target = cur.t - minutes * 60000;
  const prev = [...s].reverse().find(x => x.t <= target) || s[0];
  return prev === cur ? null : { prev, cur };
}
export function BuildsUnwinds({ ctx, span }) {
  const [lb, setLb] = useState(15);
  const pair = lookbackPair(ctx.snaps, lb);
  const d = useMemo(() => (pair ? diffSnapshots(pair.prev, pair.cur).filter(x => x.dOi) : []), [pair?.prev, pair?.cur]); // eslint-disable-line
  const adds = [...d].sort((a, b) => b.dOi - a.dOi).filter(x => x.dOi > 0).slice(0, 6);
  const cuts = [...d].sort((a, b) => a.dOi - b.dOi).filter(x => x.dOi < 0).slice(0, 6);
  const T = (list, title) => <div><p className="oi-note">{title}</p><table className="oi-table"><thead><tr><th>Contract</th><th>Δ OI</th><th>Δ LTP</th><th>Reading</th></tr></thead>
    <tbody>{list.map(x => <tr key={x.strike + x.type} onClick={() => ctx.selectStrike(x.strike)}><td>{n2(x.strike, 0)} {x.type}</td><td className={tone(x.dOi)}>{fmtQty(x.dOi)}</td><td className={tone(x.dPx)}>{n2(x.dPx)}</td><td>{x.class}</td></tr>)}</tbody></table></div>;
  return (
    <Panel title="OI — top builds & unwinds" badges={BROWSER} span={span} detail="What built in the lookback window? Price + OI reading, ambiguous when moves are small"
      tools={<select value={lb} onChange={e => setLb(Number(e.target.value))} aria-label="Lookback">{[5, 10, 15, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}</select>}>
      {!pair ? <Empty title="NEEDS TWO SNAPSHOTS">Keep this page open during market hours; a snapshot is stored each minute.</Empty>
        : <><p className="oi-note">{ist(pair.prev.t)} → {ist(pair.cur.t)} IST</p><div className="oi-grid" style={{ "--cols": 2 }}>{T(adds, "Largest additions")}{T(cuts, "Largest reductions")}</div></>}
      <Method items={["Long buildup: OI↑ price↑ · Short buildup: OI↑ price↓ · Short covering: OI↓ price↑ · Long unwinding: OI↓ price↓.", "Common interpretations only — not proof of participant intent. Price moves under max(0.05, 0.2% of LTP) are 'ambiguous'."]} />
    </Panel>
  );
}

export function AggressorView({ ctx, span }) {
  const [lb, setLb] = useState(15);
  const res = useMemo(() => {
    const s = [...(ctx.snaps || [])].sort((a, b) => a.t - b.t);
    if (s.length < 2) return null;
    const cut = s.at(-1).t - lb * 60000;
    const tot = { buy: 0, sell: 0, unknown: 0 }; const by = new Map();
    for (let i = 1; i < s.length; i++) {
      if (s[i].t < cut) continue;
      const a = aggressorEstimate(s[i - 1], s[i]); if (!a) continue;
      for (const k of Object.keys(tot)) tot[k] += a.totals[k];
      for (const r of a.rows) { const o = by.get(r.strike) || { strike: r.strike, buy: 0, sell: 0 }; o.buy += r.buy; o.sell -= r.sell; by.set(r.strike, o); }
    }
    return { tot, rows: [...by.values()].sort((a, b) => a.strike - b.strike) };
  }, [ctx.snaps, lb]);
  const total = res ? res.tot.buy + res.tot.sell + res.tot.unknown : 0;
  return (
    <Panel title="Aggressor balance" badges={ESTIMATED} span={span} detail="Buyer- vs seller-initiated volume — ESTIMATED, not observed trade-level flow"
      tools={<select value={lb} onChange={e => setLb(Number(e.target.value))}>{[5, 15, 30, 60, 375].map(m => <option key={m} value={m}>{m === 375 ? "Session" : m + " min"}</option>)}</select>}>
      {!res ? <Empty title="ESTIMATE UNAVAILABLE">Needs consecutive snapshots. True aggressor flow requires trade prints with contemporaneous quotes, which the current feed does not provide.</Empty> : <>
        <div className="oi-metrics">
          <Metric label="EST. BUYER-INITIATED" value={fmtQty(res.tot.buy)} cls="oi-up" detail={total ? (res.tot.buy / total * 100).toFixed(1) + "% of added volume" : ""} />
          <Metric label="EST. SELLER-INITIATED" value={fmtQty(res.tot.sell)} cls="oi-down" detail={total ? (res.tot.sell / total * 100).toFixed(1) + "%" : ""} />
          <Metric label="UNCLASSIFIED" value={fmtQty(res.tot.unknown)} detail="LTP inside the spread" />
        </div>
        <StrikeChart rows={nearSpot(res.rows, ctx.parsed?.spot)} series={[{ key: "buy", name: "Est. buy", color: UP }, { key: "sell", name: "Est. sell", color: DOWN }]} yFmt={fmtQty} unit="" height={200} refs={[{ x: ctx.parsed?.spot, label: "Spot" }]} />
      </>}
      <Method items={["Volume added between two snapshots is signed by the quote rule on the later snapshot: LTP ≥ ask → buyer-initiated, LTP ≤ bid → seller-initiated, otherwise unclassified.", "Snapshots are ~1 minute apart and are not trade prints, so this is an estimate and is labelled as such."]} />
    </Panel>
  );
}

export function UnusualVolume({ ctx, span }) {
  const rows = useMemo(() => (ctx.parsed?.contracts || []).filter(c => c.vol > 0).map(c => ({ ...c, turnover: c.ltp != null ? c.vol * c.ltp : null, volOi: c.oi > 0 ? c.vol / c.oi : null }))
    .sort((a, b) => (b.turnover || 0) - (a.turnover || 0)).slice(0, 12), [ctx.parsed]);
  if (noChain(ctx)) return <Panel title="Unusual volume" span={span}>{noChain(ctx)}</Panel>;
  return (
    <Panel title="Unusual volume" span={span} detail="Where is volume running hot? Ranked by rupee turnover"
      footer={<>Time-of-day RVOL needs a stored intraday baseline for each contract, which is not connected yet, so no RVOL is shown. The scheduled daily archive in <button className="oi-accent" onClick={() => ctx.goTab?.("unusual")}>Unusual Movements</button> compares against the previous 10–15 sessions.</>}>
      <div className="oi-scroll" style={{ maxHeight: 300 }}><table className="oi-table"><thead><tr><th>Contract</th><th>Volume</th><th>₹ Turnover</th><th>Vol/OI</th><th>LTP</th></tr></thead>
        <tbody>{rows.map(c => <tr key={c.key} onClick={() => ctx.selectStrike(c.strike)}><td>{n2(c.strike, 0)} {c.type} <small className="oi-muted">{c.expiry}</small></td><td>{fmtQty(c.vol)}</td><td>{fmtCr(c.turnover)}</td><td>{c.volOi == null ? "—" : c.volOi.toFixed(2)}</td><td>{n2(c.ltp)}</td></tr>)}</tbody></table></div>
    </Panel>
  );
}

export function FuturesBuildup({ ctx, span }) {
  return (
    <Panel title="Index futures buildup" span={span} detail="Are index futures being added or cut?">
      <Empty title="FUTURES FEED NOT CONNECTED">The market-data gateway exposes option chains but no front-month futures quote (price, OI, volume). This widget shows real data as soon as a futures endpoint is added to the backend allow-list. Nothing is estimated in the meantime.</Empty>
      <Method items={["Planned readings: price↑ OI↑ long buildup · price↓ OI↑ short buildup · price↑ OI↓ short covering · price↓ OI↓ long unwinding — common interpretations, not proof of intent."]} />
    </Panel>
  );
}

export function OiTapeView({ ctx, span }) {
  const tape = useMemo(() => oiTape(ctx.snaps, 300), [ctx.snaps]);
  return (
    <Panel title="OI tick tape" badges={BROWSER} span={span} detail="Chronological OI changes between snapshots, with source and ingestion timestamps">
      {!tape.length ? <Empty title="TAPE EMPTY">No OI change has been observed between stored snapshots yet.</Empty> :
        <div className="oi-scroll" style={{ maxHeight: 320 }}><table className="oi-table"><thead><tr><th>Source time</th><th>Ingested</th><th>Contract</th><th>Δ OI</th><th>Δ LTP</th></tr></thead>
          <tbody>{tape.map((r, i) => <tr key={i} onClick={() => ctx.selectStrike(r.strike)}><td>{ist(r.sourceTs)}</td><td className="oi-muted">{ist(r.ingestTs)}</td><td>{n2(r.strike, 0)} {r.type}</td><td className={tone(r.dOi)}>{fmtQty(r.dOi)}</td><td className={tone(r.dPx)}>{n2(r.dPx)}</td></tr>)}</tbody></table></div>}
    </Panel>
  );
}

// ---------------- Volatility ----------------
export function IvSmile({ ctx, span }) {
  const sm = useMemo(() => ctx.parsed?.spot > 0 ? ivSmile(ctx.parsed.contracts, ctx.parsed.spot) : null, [ctx.parsed]);
  const sk = useMemo(() => ctx.parsed?.spot > 0 ? skew25(ctx.parsed.contracts, ctx.parsed.spot, ctx.nowMs) : null, [ctx.parsed, ctx.nowMs]);
  if (noChain(ctx) || !sm) return <Panel title="IV smile" span={span}>{noChain(ctx)}</Panel>;
  const rows = nearSpot(sm.points.map(p => ({ strike: p.strike, putIv: p.type === "PE" ? p.iv : null, callIv: p.type === "CE" ? p.iv : null })), ctx.parsed.spot, 0.08);
  return (
    <Panel title="IV smile & skew" badges={OBSERVED} span={span} detail={`OTM convention · ${ctx.expiry} · 25Δ RR ${sk ? sk.riskReversal.toFixed(2) + " vol pts" : "—"} · 25Δ fly ${sk?.butterfly != null ? sk.butterfly.toFixed(2) : "—"}`}
      footer={`${sm.excluded.length} quotes excluded (no IV or no bid/LTP).`}>
      <StrikeChart rows={rows} series={[{ key: "putIv", name: "Put IV %", type: "line", color: DOWN }, { key: "callIv", name: "Call IV %", type: "line", color: UP }]} refs={[{ x: ctx.parsed.spot, label: "Spot" }]} yFmt={v => v.toFixed(1)} unit="%" />
      <Method items={["Points: puts below spot, calls at/above spot (out-of-the-money). Provider IV, unchanged.", "25Δ risk reversal = IV(25Δ call) − IV(25Δ put), using model deltas. No interpolation on this chart."]} />
    </Panel>
  );
}

function useMulti(ctx) { useEffect(() => { ctx.requestMulti?.(); }, []); return ctx.multi; } // eslint-disable-line react-hooks/exhaustive-deps

export function TermStructure({ ctx, span }) {
  const m = useMulti(ctx);
  const rows = useMemo(() => (m?.chains || []).map(c => { const st = straddle(c.contracts, c.spot); const sk = skew25(c.contracts, c.spot, ctx.nowMs);
    return { expiry: c.expiry, atmIv: st?.atmIv ?? null, straddle: st?.total ?? null, move: st?.impliedMovePct ?? null, rr: sk?.riskReversal ?? null }; })
    .sort((a, b) => a.expiry.localeCompare(b.expiry)), [m?.chains, ctx.nowMs]);
  return (
    <Panel title="Term structure" badges={OBSERVED} span={span} detail={m?.status === "loading" ? "Loading expiries…" : `${rows.length} expiries loaded${m?.failed?.length ? " · " + m.failed.length + " failed" : ""}`}>
      {!rows.length ? <Empty title={m?.status === "loading" ? "LOADING" : "NO EXPIRIES"}>{m?.status === "error" ? "The provider returned no chain for the requested expiries." : ""}</Empty> : <>
        <CatChart rows={rows} xKey="expiry" yFmt={v => v.toFixed(2)} series={[{ key: "atmIv", name: "ATM IV %", color: TEXT }, { key: "rr", name: "25Δ RR (vol pts)", color: INFO }]} />
        <table className="oi-table"><thead><tr><th>Expiry</th><th>ATM IV</th><th>Straddle</th><th>Implied move</th><th>25Δ RR</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.expiry}><td>{r.expiry}</td><td>{r.atmIv?.toFixed(2) ?? "—"}</td><td>{n2(r.straddle)}</td><td>{r.move == null ? "—" : "±" + r.move.toFixed(2) + "%"}</td><td>{r.rr?.toFixed(2) ?? "—"}</td></tr>)}</tbody></table></>}
    </Panel>
  );
}

export function IvSurface({ ctx, span }) {
  const m = useMulti(ctx);
  const buckets = [-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10];
  const rows = useMemo(() => (m?.chains || []).map(c => {
    const pts = ivSmile(c.contracts, c.spot).points.map(p => ({ x: (p.strike / c.spot - 1) * 100, iv: p.iv })).sort((a, b) => a.x - b.x);
    const at = b => { for (let i = 1; i < pts.length; i++) if (pts[i - 1].x <= b && pts[i].x >= b) { const a = pts[i - 1], z = pts[i]; return z.x === a.x ? a.iv : a.iv + (z.iv - a.iv) * (b - a.x) / (z.x - a.x); } return null; };
    return { expiry: c.expiry, vals: buckets.map(at) };
  }).sort((a, b) => a.expiry.localeCompare(b.expiry)), [m?.chains]);
  const all = rows.flatMap(r => r.vals).filter(v => v != null);
  const lo = Math.min(...all), hi = Math.max(...all);
  return (
    <Panel title="IV surface" badges={OBSERVED} span={span} detail="Expiry × moneyness (strike ÷ spot − 1). Blank = no bracketing quotes (no extrapolation)">
      {!rows.length ? <Empty title={m?.status === "loading" ? "LOADING EXPIRIES" : "NO SURFACE"} /> :
        <div className="oi-scroll"><table className="oi-table"><thead><tr><th>Expiry</th>{buckets.map(b => <th key={b}>{b > 0 ? "+" : ""}{b}%</th>)}</tr></thead>
          <tbody>{rows.map(r => <tr key={r.expiry}><td>{r.expiry}</td>{r.vals.map((v, i) => <td key={i} className="oi-heat" style={{ "--v": v == null || hi === lo ? 0 : (v - lo) / (hi - lo) * 0.6 }}>{v == null ? "" : v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>}
      <Method items={["Each cell linearly interpolates OTM provider IV between the two nearest quoted strikes of that expiry. Cells outside the quoted range stay blank — no extrapolation.", "Invalid quotes (no IV, no bid and no LTP) are excluded before interpolation."]} />
    </Panel>
  );
}

function straddleAt(snap) {
  const p = contractsFromSnapshot(snap);
  return p.spot > 0 ? straddle(p.contracts, p.spot) : null;
}
export function StraddleDecay({ ctx, span }) {
  const [hist, setHist] = useState(null);
  const path = useMemo(() => (ctx.snaps || []).map(s => { const st = straddleAt(s); return st?.total != null ? { time: ist(s.t).slice(0, 5), t: s.t, total: st.total, strike: st.strike, iv: st.atmIv } : null; }).filter(Boolean), [ctx.snaps]);
  const now = ctx.summary?.straddle;
  const dte = ctx.summary?.T != null ? ctx.summary.T * 365 : null;
  useEffect(() => {
    let live = true;
    if (dte == null) return;
    loadSymbolHistory(ctx.symbol, ctx.day).then(days => {
      if (!live) return;
      const comps = [];
      for (const d of days) for (const s of d.series) {
        const first = s.snaps[0], last = s.snaps.at(-1);
        const d0 = yearsToExpiry(s.expiry, first.t) * 365;
        if (Math.abs(d0 - dte) > 0.75) continue;
        const a = straddleAt(first), b = straddleAt(last);
        if (a?.total && b?.total) comps.push({ day: d.day, expiry: s.expiry, dte: d0, decayPct: (b.total / a.total - 1) * 100 });
      }
      setHist(comps);
    });
    return () => { live = false; };
  }, [ctx.symbol, ctx.day, dte == null ? null : Math.round(dte * 2)]); // eslint-disable-line
  const attrib = useMemo(() => {
    const s = ctx.snaps || []; if (s.length < 2) return null;
    const a = contractsFromSnapshot(s[0]), b = contractsFromSnapshot(s.at(-1));
    const K = atmStrike(a.contracts, a.spot); if (K == null) return null;
    const leg = (p, type) => p.contracts.find(c => c.strike === K && c.type === type);
    const price = (S, T, iv) => ["CE", "PE"].reduce((sum, ty) => { const c = leg(a, ty); const v = iv[ty]; const g = c && v ? bsGreeks(S, K, T, v, ty) : null; return g ? sum + g.price : NaN; }, 0);
    const T0 = yearsToExpiry(a.expiry, s[0].t), T1 = yearsToExpiry(a.expiry, s.at(-1).t);
    const iv0 = { CE: leg(a, "CE")?.iv, PE: leg(a, "PE")?.iv }, iv1 = { CE: leg(b, "CE")?.iv, PE: leg(b, "PE")?.iv };
    const p0 = price(a.spot, T0, iv0), pT = price(a.spot, T1, iv0), pV = price(a.spot, T1, iv1), pS = price(b.spot, T1, iv1);
    if (![p0, pT, pV, pS].every(Number.isFinite)) return null;
    return { strike: K, time: pT - p0, iv: pV - pT, spot: pS - pV, total: pS - p0 };
  }, [ctx.snaps]);
  const decayPct = path.length > 1 ? (path.at(-1).total / path[0].total - 1) * 100 : null;
  const avgHist = hist?.length ? hist.reduce((s, h) => s + h.decayPct, 0) / hist.length : null;
  return (
    <Panel title="Straddle — decay clock" span={span} badges={BROWSER} detail="Is the ATM straddle melting faster than usual?">
      <div className="oi-metrics">
        <Metric label="ATM STRADDLE NOW" value={now?.total != null ? n2(now.total) : "—"} detail={now ? `${n2(now.strike, 0)} · call ${now.callBasis || "—"} / put ${now.putBasis || "—"}` : ""} />
        <Metric label="CHANGE THIS SESSION" value={decayPct == null ? "—" : pct(decayPct)} cls={tone(decayPct)} detail={path.length ? `${path[0].time} → ${path.at(-1).time}` : "Needs snapshots"} />
        <Metric label="COMPARABLE SESSIONS" value={avgHist == null ? "—" : pct(avgHist)} detail={hist == null ? "Loading" : hist.length ? `${hist.length} stored sessions at ±0.75 d DTE` : "No stored session with similar DTE"} />
      </div>
      {path.length > 1 && <CatChart rows={path} xKey="time" yFmt={v => n2(v, 1)} series={[{ key: "total", name: "ATM straddle", color: TEXT }]} height={180} />}
      {attrib && <p className="oi-note">Model attribution at {n2(attrib.strike, 0)} {MODEL}: time {n2(attrib.time)} · IV {n2(attrib.iv)} · spot {n2(attrib.spot)} = {n2(attrib.total)} (BS re-pricing; residual vs market reflects quote noise).</p>}
      <Method items={["Straddle = ATM call + put at bid/ask mid, LTP fallback (basis shown).", "Attribution re-prices the first snapshot's ATM pair stepwise: time only → then IV → then spot.", "Comparable sessions come from snapshots stored in this browser for the same underlying with days-to-expiry within ±0.75 days."]} />
    </Panel>
  );
}

export function AtmIvRv({ ctx, span }) {
  const path = useMemo(() => (ctx.snaps || []).map(s => { const st = straddleAt(s); return st?.atmIv != null ? { time: ist(s.t).slice(0, 5), iv: st.atmIv } : null; }).filter(Boolean), [ctx.snaps]);
  const intraRv = useMemo(() => realizedVolFromSnapshots(ctx.snaps), [ctx.snaps]);
  const st = ctx.summary?.straddle;
  const rv = ctx.rv;
  const rvRef = rv?.status === "ready" ? rv.rv20 ?? rv.rv10 : null;
  return (
    <Panel title="ATM IV, straddle & realised vol" span={span} detail="How is implied volatility moving?">
      <div className="oi-metrics">
        <Metric label="ATM IV" value={st?.atmIv != null ? st.atmIv.toFixed(2) + "%" : "—"} detail={OBSERVED} />
        <Metric label="STRADDLE / BREAKEVENS" value={st?.total != null ? n2(st.total) : "—"} detail={st?.total != null ? `${n2(st.lower, 0)} – ${n2(st.upper, 0)}` : ""} />
        <Metric label="RV 10D / 20D" value={rv?.status === "ready" ? `${rv.rv10?.toFixed(1) ?? "—"} / ${rv.rv20?.toFixed(1) ?? "—"}` : "—"} detail={rv?.status === "ready" ? rv.source : "Daily history unavailable for " + ctx.symbol} />
        <Metric label="INTRADAY RV (SNAPSHOTS)" value={intraRv == null ? "—" : intraRv.toFixed(1) + "%"} detail="Annualised from browser spot snapshots" />
        <Metric label="IV − RV" value={st?.atmIv != null && rvRef != null ? (st.atmIv - rvRef).toFixed(2) + " pts" : "—"} cls={tone(st?.atmIv - rvRef)} detail="vs 20-day RV" />
      </div>
      {path.length > 1 ? <CatChart rows={path} xKey="time" yFmt={v => v.toFixed(2)} series={[{ key: "iv", name: "ATM IV %", color: TEXT }]} height={170} />
        : <p className="oi-note">ATM IV path appears once snapshots are recorded this session.</p>}
      <Method items={["RV = close-to-close log returns of daily closes (last 5-minute bar each IST day), annualised with √252.", "Intraday RV uses observed spot snapshots, annualised with 375 minutes/day; shown only with ≥10 returns."]} />
    </Panel>
  );
}

// ---------------- Chain grid ----------------
export function ChainGrid({ ctx, span }) {
  const m = useMulti(ctx);
  const [filter, setFilter] = useState({ expiry: "all", band: 0.05, minOi: 0, kind: "all" });
  const [sort, setSort] = useState({ k: "strike", dir: 1 });
  const tags = useMemo(() => Object.fromEntries(tagExpiries(ctx.expiries || [], ctx.nowMs).map(t => [t.expiry, t])), [ctx.expiries, ctx.nowMs]);
  const chains = m?.chains?.length ? m.chains : ctx.parsed ? [ctx.parsed] : [];
  const rows = useMemo(() => {
    const out = [];
    for (const ch of chains) {
      if (filter.expiry !== "all" && ch.expiry !== filter.expiry) continue;
      const t = tags[ch.expiry];
      if (filter.kind === "0dte" && !t?.zeroDte) continue;
      if (filter.kind === "weekly" && !t?.weekly) continue;
      if (filter.kind === "monthly" && !t?.monthly) continue;
      const ex = exposuresByStrike(ch.contracts, { spot: ch.spot, nowMs: ctx.nowMs });
      for (const c of ch.contracts) {
        if (Math.abs(c.strike - ch.spot) / ch.spot > filter.band) continue;
        if ((c.oi || 0) < filter.minOi) continue;
        const g = c.iv ? bsGreeks(ch.spot, c.strike, yearsToExpiry(c.expiry, ctx.nowMs), c.iv, c.type) : null;
        const r = ex.rows.find(x => x.strike === c.strike);
        out.push({ ...c, spot: ch.spot, delta: g?.delta ?? null, gamma: g?.gamma ?? null, gex: r ? (c.type === "CE" ? r.callGex : r.putGex) : null, mid: midPrice(c) });
      }
    }
    return out.sort((a, b) => ((a[sort.k] ?? -Infinity) > (b[sort.k] ?? -Infinity) ? 1 : -1) * sort.dir);
  }, [chains, filter, sort, tags, ctx.nowMs]);
  const H = (k, l) => <th className="sortable" onClick={() => setSort(s => ({ k, dir: s.k === k ? -s.dir : 1 }))}>{l}{sort.k === k ? (sort.dir > 0 ? " ▲" : " ▼") : ""}</th>;
  return (
    <Panel title="Every strike × every loaded expiry" span={span} detail={`${rows.length} contracts · ${chains.length} expiries · contract identity always includes expiry`}
      tools={<div className="oi-row">
        <select value={filter.expiry} onChange={e => setFilter(f => ({ ...f, expiry: e.target.value }))}><option value="all">All loaded expiries</option>{chains.map(c => <option key={c.expiry} value={c.expiry}>{c.expiry}</option>)}</select>
        <select value={filter.kind} onChange={e => setFilter(f => ({ ...f, kind: e.target.value }))}><option value="all">All types</option><option value="0dte">0DTE only</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
        <select value={filter.band} onChange={e => setFilter(f => ({ ...f, band: Number(e.target.value) }))}>{[0.02, 0.05, 0.1, 1].map(v => <option key={v} value={v}>{v === 1 ? "All strikes" : "±" + v * 100 + "%"}</option>)}</select>
        <input type="number" min="0" step="1000" value={filter.minOi} onChange={e => setFilter(f => ({ ...f, minOi: Number(e.target.value) || 0 }))} style={{ width: 96 }} aria-label="Minimum OI" placeholder="Min OI" />
      </div>}
      footer="Provider: OI, OI change (vs previous close), volume, LTP, bid/ask, IV. AHQ model: Δ, Γ, GEX. Missing values show —.">
      <div className="oi-scroll" style={{ maxHeight: 480 }}><table className="oi-table"><thead><tr>{H("expiry", "Expiry")}{H("strike", "Strike")}{H("type", "Type")}{H("oi", "OI")}{H("oiChg", "ΔOI prev")}{H("vol", "Vol")}{H("iv", "IV")}{H("ltp", "LTP")}<th>Bid / Ask</th>{H("delta", "Δ")}{H("gamma", "Γ")}{H("gex", "GEX ₹")}</tr></thead>
        <tbody>{rows.slice(0, 600).map(r => <tr key={r.key} className={Math.abs(r.strike - r.spot) / r.spot < 0.002 ? "is-atm" : ""} onClick={() => ctx.selectStrike(r.strike)}>
          <td>{r.expiry}{tags[r.expiry]?.zeroDte && <span className="oi-tag zero">0DTE</span>}</td><td>{n2(r.strike, 0)}</td><td className={r.type === "CE" ? "oi-up" : "oi-down"}>{r.type}</td><td>{fmtQty(r.oi)}</td><td className={tone(r.oiChg)}>{fmtQty(r.oiChg)}</td><td>{fmtQty(r.vol)}</td>
          <td>{r.iv == null ? "—" : (r.iv * 100).toFixed(2)}</td><td>{n2(r.ltp)}</td><td className="oi-muted">{r.bid == null ? "—" : n2(r.bid)} / {r.ask == null ? "—" : n2(r.ask)}</td><td>{r.delta == null ? "—" : r.delta.toFixed(3)}</td><td>{r.gamma == null ? "—" : r.gamma.toExponential(2)}</td><td className={tone(r.gex)}>{fmtCr(r.gex)}</td></tr>)}</tbody></table></div>
    </Panel>
  );
}

// ---------------- Market & visits ----------------
export function MarketStripView({ ctx, span }) {
  return (
    <Panel title="Market strip" span={span} detail="Index level, move and front-expiry net GEX">
      <table className="oi-table"><thead><tr><th>Index</th><th>Level</th><th>Move</th><th>Net GEX (front)</th><th>Flip</th><th>As of</th></tr></thead>
        <tbody>{(ctx.strip || []).map(s => <tr key={s.id} onClick={() => ctx.setSymbol?.(s.id)}><td>{s.label}</td><td>{s.spot ? n2(s.spot) : "—"}</td><td className={tone(s.change)}>{s.change == null ? "—" : n2(s.change)}</td>
          <td className={tone(s.netGex)}>{s.netGex == null ? s.note || "—" : "₹ " + fmtCr(s.netGex)}</td><td>{s.flip ? n2(s.flip, 0) : "—"}</td><td className="oi-muted">{s.asOf ? ist(s.asOf) : "—"}</td></tr>)}</tbody></table>
      <p className="oi-note">India VIX is not available from the current gateway and is not shown.</p>
    </Panel>
  );
}

export function SinceLastVisit({ ctx, span }) {
  const prev = ctx.lastVisitPrev || {};
  const rows = (ctx.strip || []).map(s => ({ ...s, prev: prev[s.id] })).filter(s => s.netGex != null || s.prev);
  return (
    <Panel title="Since your last visit" span={span} badges={MODEL} detail="Net gamma then vs now, per index">
      {!rows.length ? <Empty title="NO PRIOR VISIT STORED">The next visit will compare against this one.</Empty> :
        <table className="oi-table"><thead><tr><th>Index</th><th>Then</th><th>Now</th><th>Δ</th><th>Δ %</th></tr></thead>
          <tbody>{rows.map(r => { const d = r.prev && r.netGex != null ? r.netGex - r.prev.netGex : null; return <tr key={r.id}><td>{r.label}</td>
            <td>{r.prev ? "₹ " + fmtCr(r.prev.netGex) + " · " + istDT(r.prev.t) : "No prior snapshot"}</td><td>{r.netGex == null ? "—" : "₹ " + fmtCr(r.netGex)}</td>
            <td className={tone(d)}>{d == null ? "—" : fmtCr(d)}</td><td>{d == null || !r.prev.netGex ? "—" : pct(d / Math.abs(r.prev.netGex) * 100)}</td></tr>; })}</tbody></table>}
      <p className="oi-note">Front-expiry comparisons; if the front expiry rolled between visits, the contracts differ.</p>
    </Panel>
  );
}

export function ContractDetail({ ctx }) {
  const K = ctx.selectedStrike;
  if (K == null || !ctx.parsed?.contracts?.length) return null;
  const legs = ctx.parsed.contracts.filter(c => c.strike === K);
  const S = ctx.parsed.spot;
  const ex = ctx.summary?.rows.find(r => r.strike === K);
  return (
    <div className="oi-drawer"><Panel title={`${ctx.symbol} ${n2(K, 0)} · ${ctx.expiry}`} detail={`${pct((K - S) / S * 100)} from spot · synced across all views`}
      tools={<button className="oi-btn" onClick={() => ctx.selectStrike(null)}>Close</button>}>
      <table className="oi-table"><thead><tr><th>Leg</th><th>LTP</th><th>Bid/Ask</th><th>IV</th><th>Δ</th><th>Γ</th><th>Vanna/pt</th><th>OI</th><th>ΔOI prev</th><th>Vol</th></tr></thead>
        <tbody>{legs.map(c => { const g = c.iv ? bsGreeks(S, K, yearsToExpiry(c.expiry, ctx.nowMs), c.iv, c.type) : null; return <tr key={c.type}>
          <td className={c.type === "CE" ? "oi-up" : "oi-down"}>{c.type}</td><td>{n2(c.ltp)}</td><td>{n2(c.bid)} / {n2(c.ask)}</td><td>{c.iv ? (c.iv * 100).toFixed(2) : "—"}</td><td>{g ? g.delta.toFixed(3) : "—"}</td><td>{g ? g.gamma.toExponential(2) : "—"}</td><td>{g ? g.vanna.toFixed(4) : "—"}</td><td>{fmtQty(c.oi)}</td><td className={tone(c.oiChg)}>{fmtQty(c.oiChg)}</td><td>{fmtQty(c.vol)}</td></tr>; })}</tbody></table>
      {ex && <p className="oi-note">Strike GEX: call ₹ {fmtCr(ex.callGex)} · put ₹ {fmtCr(ex.putGex)} · share {ex.share == null ? "—" : (ex.share * 100).toFixed(2) + "%"} · DEX ₹ {fmtCr(ex.netDex)} {MODEL}</p>}
    </Panel></div>
  );
}

// ---------------- registry for tabs, widgets and workspace panes ----------------
export const VIEWS = {
  "overview-cards": { title: "Key levels", C: KeyLevels },
  "key-levels": { title: "Key levels", C: KeyLevels },
  "market-strip": { title: "Market strip", C: MarketStripView },
  "gex-strike": { title: "GEX by strike", C: GexByStrike },
  "gex-profile": { title: "Net GEX profile", C: GexProfile },
  "pin-pressure": { title: "Pin pressure", C: PinPressure },
  hhi: { title: "HHI concentration", C: HhiView },
  "hedge-ladder": { title: "Hedge ladder", C: HedgeLadderView },
  "gamma-decay": { title: "Gamma decay", C: GammaDecayView },
  "dex-strike": { title: "Delta exposure", C: DexByStrike },
  "dex-flow": { title: "Delta flow", C: DexFlowView },
  charm: { title: "Charm", C: CharmView },
  vanna: { title: "Vanna", C: VannaView },
  "oi-change": { title: "OI change", C: OiChange },
  "oi-rotation": { title: "OI rotation", C: OiRotationView },
  "builds-unwinds": { title: "OI builds & unwinds", C: BuildsUnwinds },
  aggressor: { title: "Aggressor balance", C: AggressorView },
  "unusual-volume": { title: "Unusual volume", C: UnusualVolume },
  "futures-buildup": { title: "Futures buildup", C: FuturesBuildup },
  "iv-smile": { title: "IV smile", C: IvSmile },
  "term-structure": { title: "Term structure", C: TermStructure },
  "iv-surface": { title: "IV surface", C: IvSurface },
  "straddle-decay": { title: "Straddle decay clock", C: StraddleDecay },
  "atm-iv-rv": { title: "ATM IV & RV", C: AtmIvRv },
  "chain-grid": { title: "Every-strike grid", C: ChainGrid },
  "oi-tape": { title: "OI tape", C: OiTapeView },
  "since-last-visit": { title: "Since last visit", C: SinceLastVisit },
};

export function View({ id, ctx, span }) {
  const v = VIEWS[id];
  if (!v) return null;
  if (ctx.plan === "basic" && PLAN_PRO_VIEWS.has(id)) return <Panel title={v.title} span={span}><Locked what={v.title} /></Panel>;
  const C = v.C;
  return <C ctx={ctx} span={span} />;
}

export { summarize, MODEL_RATE };
