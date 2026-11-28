"use client";
// AlphaHedgeQuant — Options Intelligence shell (inside /options and the Quant Terminal).
// Spec tabs come first; the existing Options Desk tools follow as "Other tools" tabs.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./optionsIntel.css";
import { summarize, contractsFromSnapshot, tagExpiries, isNseSession, istParts, fmtCr, yearsToExpiry } from "@/lib/optionsIntel.mjs";
import { PRESETS } from "@/lib/optionsWorkspace.mjs";
import {
  INDEX_UNIVERSE, useChain, useMultiExpiry, useSnapshotRecorder, useRealizedVol, useIndexLevels, useWorkspaceStore,
  loadSeries, listSeriesDays, listExpiriesForDay, loadSymbolHistory,
} from "./useOptionsData";
import { View, ContractDetail, KeyLevels, GexByStrike, OiChange, IvSmile } from "./views";
import { WorkspaceTab, AppearancePanel, CommandPalette } from "./Workspace";
import { Panel, Empty, Metric, CatChart, n2, ist, istDT, tone } from "./ui";

export const INTEL_TABS = [
  { id: "overview", label: "OVERVIEW" }, { id: "gamma", label: "GAMMA LAB" }, { id: "delta", label: "DELTA LAB" },
  { id: "flow", label: "OPTIONS FLOW" }, { id: "vol", label: "VOLATILITY LAB" }, { id: "grid", label: "STRIKE GRID" },
  { id: "replay", label: "HISTORICAL REPLAY" }, { id: "fno", label: "F&O STOCKS" }, { id: "widgets", label: "QUICK WIDGETS" },
  { id: "workspace", label: "MY WORKSPACE" },
];
const LAYOUTS = {
  overview: { cols: 2, panes: [["market-strip", 2], ["key-levels", 2], ["gex-strike", 1], ["pin-pressure", 1], ["oi-leaders", 1], ["unusual-volume", 1], ["atm-iv-rv", 1], ["since-last-visit", 1]] },
  gamma: { cols: 2, panes: [["gex-strike", 2], ["gex-profile", 1], ["pin-pressure", 1], ["hhi", 1], ["hedge-ladder", 1], ["gamma-decay", 2]] },
  delta: { cols: 2, panes: [["dex-strike", 2], ["dex-flow", 2], ["charm", 1], ["vanna", 1], ["hedge-ladder", 2]] },
  flow: { cols: 2, panes: [["oi-change", 2], ["oi-rotation", 1], ["builds-unwinds", 1], ["aggressor", 1], ["unusual-volume", 1], ["futures-buildup", 1], ["oi-tape", 1]] },
  vol: { cols: 2, panes: [["iv-smile", 1], ["term-structure", 1], ["iv-surface", 2], ["straddle-decay", 1], ["atm-iv-rv", 1]] },
  grid: { cols: 1, panes: [["chain-grid", 1]] },
  widgets: { cols: 3, panes: [["builds-unwinds", 1], ["unusual-volume", 1], ["straddle-decay", 1], ["futures-buildup", 1], ["pin-pressure", 1], ["atm-iv-rv", 1]] },
};

/** Builds the shared analytics context for one underlying (main view or a comparison pane). */
export function useIntelContext({ symbol, expiry, record = true, base = {}, replaySnap = null, replaySnaps = null }) {
  const chain = useChain(symbol, expiry);
  const effExpiry = expiry || chain.parsed?.expiry || "";
  const recorder = useSnapshotRecorder(record ? symbol : null, effExpiry, record ? chain.parsed : null);
  const [multiOn, setMultiOn] = useState(false);
  const expiries = chain.raw?.expiries || [];
  const multi = useMultiExpiry(symbol, expiries, { count: 6, enabled: multiOn && !replaySnap });
  const rv = useRealizedVol(symbol);
  const parsed = useMemo(() => (replaySnap ? contractsFromSnapshot(replaySnap) : chain.parsed), [replaySnap, chain.parsed]);
  const nowMs = replaySnap ? replaySnap.t : chain.fetchedAt || Date.now();
  const summary = useMemo(() => (parsed ? summarize(parsed, { nowMs }) : null), [parsed, nowMs]);
  return {
    ...base, symbol, expiry: parsed?.expiry || effExpiry, expiries, parsed, summary, nowMs,
    status: replaySnap ? "replay" : chain.status, error: chain.error, reload: chain.reload,
    snaps: replaySnaps || recorder.snaps, day: recorder.day, isReplay: !!replaySnap,
    multi: replaySnap ? { status: "error", chains: [], failed: [] } : multi, requestMulti: () => setMultiOn(true), rv,
  };
}

/** Market strip: front-expiry net GEX for every supported index. */
function useStrip(levels, current) {
  const [rows, setRows] = useState(INDEX_UNIVERSE.map(i => ({ ...i, status: "loading" })));
  useEffect(() => {
    let live = true;
    const load = async () => {
      const out = [];
      for (const ix of INDEX_UNIVERSE) {
        try {
          const r = await fetch(`/api/market/option-chain/${ix.id}`, { cache: "no-store" });
          const j = await r.json();
          if (!r.ok || !j.success) { out.push({ ...ix, status: "unavailable", note: r.status === 404 ? "Not in backend instrument master" : r.status === 401 ? "Upstox session expired" : "Provider error" }); continue; }
          const { contractsFromChain } = await import("@/lib/optionsIntel.mjs");
          const p = contractsFromChain(j);
          const s = summarize(p, { nowMs: Date.now() });
          out.push({ ...ix, status: "ok", spot: p.spot, netGex: s?.totals.netGex ?? null, flip: s?.flip ?? null, expiry: p.expiry, asOf: Date.parse(p.receivedAt) || Date.now() });
        } catch { out.push({ ...ix, status: "unavailable", note: "Request failed" }); }
      }
      if (live) setRows(out);
    };
    load();
    const t = setInterval(() => { if (!document.hidden && isNseSession()) load(); }, 120000);
    return () => { live = false; clearInterval(t); };
  }, []);
  return useMemo(() => rows.map(r => {
    const lv = r.indexKey ? levels?.data?.[r.indexKey] : null;
    const cur = current?.symbol === r.id && current.summary && !current.isReplay ? current : null;
    return { ...r, change: lv && lv.prevClose ? lv.change : null, changePct: lv?.changePct ?? null,
      netGex: cur && cur.expiry === r.expiry ? cur.summary.totals.netGex : r.netGex, spot: cur?.summary?.spot ?? r.spot };
  }), [rows, levels, current]);
}

function OiLeaders({ ctx }) {
  const s = ctx.summary;
  if (!s) return <Panel title="OI leaders"><Empty title="NO CHAIN" /></Panel>;
  return (
    <Panel title="OI leaders" detail={`Largest open interest by strike · ${ctx.expiry}`}>
      <div className="oi-grid" style={{ "--cols": 2 }}>
        {[["CALL OI", s.oiLeaders.call, "oi-up"], ["PUT OI", s.oiLeaders.put, "oi-down"]].map(([l, list, cls]) => (
          <table key={l} className="oi-table"><thead><tr><th>{l}</th><th>OI</th></tr></thead>
            <tbody>{list.map(x => <tr key={x.strike} onClick={() => ctx.selectStrike(x.strike)}><td className={cls}>{n2(x.strike, 0)}</td><td>{(x.oi / 1e5).toFixed(2)} L</td></tr>)}</tbody></table>))}
      </div>
    </Panel>
  );
}

function Layout({ id, ctx }) {
  const L = LAYOUTS[id];
  return (
    <div className="oi-grid" style={{ "--cols": L.cols }}>
      {L.panes.map(([v, span], i) => <div key={v + i} style={{ gridColumn: `span ${Math.min(span, L.cols)}`, minWidth: 0 }}>
        {v === "oi-leaders" ? <OiLeaders ctx={ctx} /> : <View id={v} ctx={ctx} />}</div>)}
    </div>
  );
}

function ReplayTab({ ctx, replay, setReplay, series, loading }) {
  const [days, setDays] = useState([]);
  const [expiries, setExpiries] = useState([]);
  useEffect(() => { listSeriesDays(ctx.symbol).then(setDays); }, [ctx.symbol, series.length]);
  useEffect(() => { if (replay.day) listExpiriesForDay(ctx.symbol, replay.day).then(setExpiries); }, [ctx.symbol, replay.day]);
  return (
    <div>
      <Panel title="Historical replay" badges={<span className="oi-tag est">BROWSER SNAPSHOTS</span>}
        detail="Every pane follows the selected timestamp. Snapshots are stored once a minute while this page is open in market hours (kept 10 sessions in this browser)."
        footer="Server-side session capture from 09:15 IST (fo_session_snapshots) is not connected yet, so replay covers only the minutes this browser recorded. Nothing is reconstructed or interpolated.">
        <div className="oi-row">
          <label className="oi-muted">Session <select value={replay.day || ""} onChange={e => setReplay(r => ({ ...r, day: e.target.value, expiry: "", idx: null }))}>
            <option value="">Choose…</option>{days.map(d => <option key={d} value={d}>{d}{d === istParts().day ? " (today)" : ""}</option>)}</select></label>
          <label className="oi-muted">Expiry <select value={replay.expiry || ""} onChange={e => setReplay(r => ({ ...r, expiry: e.target.value, idx: null }))}>
            <option value="">Choose…</option>{expiries.map(x => <option key={x}>{x}</option>)}</select></label>
          {replay.active && <button className="oi-btn" onClick={() => setReplay({ active: false, day: "", expiry: "", idx: null })}>Exit replay → live</button>}
          {!days.length && <span className="oi-muted" style={{ fontSize: 11 }}>No stored sessions for {ctx.symbol} yet.</span>}
        </div>
        {loading && <p className="oi-note">Loading snapshots…</p>}
        {replay.day && replay.expiry && !loading && <p className="oi-note">{series.length} snapshots · {series.length ? `${ist(series[0].t)} → ${ist(series.at(-1).t)} IST` : "none"}. Use the scrubber above.</p>}
      </Panel>
      {replay.active && <div className="oi-grid" style={{ "--cols": 2, marginTop: 10 }}>
        <div style={{ gridColumn: "span 2" }}><KeyLevels ctx={ctx} /></div><GexByStrike ctx={ctx} /><IvSmile ctx={ctx} /><div style={{ gridColumn: "span 2" }}><OiChange ctx={ctx} /></div></div>}
      <DayWiseGamma ctx={ctx} />
    </div>
  );
}

function DayWiseGamma({ ctx }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    loadSymbolHistory(ctx.symbol, null).then(days => {
      if (!live) return;
      const out = [];
      for (const d of days) {
        const front = [...d.series].sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
        const last = front?.snaps.at(-1);
        if (!last) continue;
        const s = summarize(contractsFromSnapshot(last), { nowMs: last.t });
        if (s) out.push({ day: d.day, netGex: s.totals.netGex, expiry: front.expiry, at: last.t });
      }
      setRows(out.sort((a, b) => a.day.localeCompare(b.day)));
    });
    return () => { live = false; };
  }, [ctx.symbol]);
  return (
    <div style={{ marginTop: 10 }}><Panel title={`Day-wise net gamma · ${ctx.symbol}`} detail="Last stored snapshot of each session, front stored expiry">
      {!rows?.length ? <Empty title={rows ? "NO STORED SESSIONS" : "LOADING"}>Sessions appear here after this page has recorded them.</Empty> :
        <CatChart rows={rows} xKey="day" series={[{ key: "netGex", name: "Net GEX at last snapshot", type: "bar", signColor: true }]} refY={0} />}
    </Panel></div>
  );
}

function FnoStocks({ ctx, onSymbol }) {
  const [list, setList] = useState({ status: "loading", items: [] });
  const [q, setQ] = useState("");
  const [scan, setScan] = useState({ status: "idle", rows: [] });
  useEffect(() => {
    fetch("/api/terminal?view=fno", { cache: "no-store" }).then(r => r.json())
      .then(j => setList(j?.success && Array.isArray(j.data) ? { status: "ready", items: j.data } : { status: "error", items: [] }))
      .catch(() => setList({ status: "error", items: [] }));
  }, []);
  const filtered = useMemo(() => { const t = q.trim().toLowerCase(); return list.items.filter(x => !t || String(x.symbol).toLowerCase().includes(t) || String(x.name || "").toLowerCase().includes(t)).slice(0, 60); }, [q, list.items]);
  const runScan = async () => {
    const pick = filtered.slice(0, 10).map(x => x.symbol);
    setScan({ status: "loading", rows: [] });
    const { contractsFromChain } = await import("@/lib/optionsIntel.mjs");
    const rows = [];
    for (const sym of pick) {
      try {
        const r = await fetch(`/api/market/option-chain/${encodeURIComponent(sym)}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok || !j.success) { rows.push({ symbol: sym, error: j?.error || "No chain" }); continue; }
        const p = contractsFromChain(j), s = summarize(p, { nowMs: Date.now() });
        const co = s?.rows.reduce((a, x) => a + x.callOi, 0) || 0, po = s?.rows.reduce((a, x) => a + x.putOi, 0) || 0;
        rows.push({ symbol: sym, spot: p.spot, expiry: p.expiry, netGex: s?.totals.netGex, flip: s?.flip, callWall: s?.callWall, putWall: s?.putWall, pcr: co ? po / co : null, atmIv: s?.straddle?.atmIv });
      } catch { rows.push({ symbol: sym, error: "Request failed" }); }
      setScan({ status: "loading", rows: [...rows] });
    }
    setScan({ status: "done", rows });
  };
  return (
    <div className="oi-grid" style={{ "--cols": 2 }}>
      <Panel title="F&O stock screener" detail={list.status === "ready" ? `${list.items.length} F&O-eligible symbols (exchange/provider list)` : list.status === "loading" ? "Loading F&O universe…" : "F&O universe unavailable"}
        tools={<button className="oi-btn" disabled={!filtered.length || scan.status === "loading"} onClick={runScan}>Scan top 10 shown</button>}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search symbol or company" style={{ width: "100%", marginBottom: 8 }} />
        <div className="oi-scroll" style={{ maxHeight: 360 }}><table className="oi-table"><thead><tr><th>Symbol</th><th>Name</th><th></th></tr></thead>
          <tbody>{filtered.map(x => <tr key={x.symbol}><td>{x.symbol}</td><td className="oi-muted" style={{ textAlign: "left" }}>{x.name || ""}</td><td><button className="oi-chip" onClick={() => onSymbol(x.symbol)}>Open analytics</button></td></tr>)}</tbody></table></div>
      </Panel>
      <Panel title="Scan results" detail="Front expiry, modelled levels" footer="Scans are sequential to respect provider rate limits. Coverage depends on the backend's licensed F&O instrument master.">
        {!scan.rows.length ? <Empty title={scan.status === "loading" ? "SCANNING…" : "NO SCAN YET"}>Filter the list, then scan up to 10 symbols.</Empty> :
          <div className="oi-scroll"><table className="oi-table"><thead><tr><th>Symbol</th><th>Spot</th><th>Net GEX</th><th>Flip</th><th>Call / Put wall</th><th>PCR</th><th>ATM IV</th></tr></thead>
            <tbody>{scan.rows.map(r => <tr key={r.symbol} onClick={() => !r.error && onSymbol(r.symbol)}><td>{r.symbol}</td>
              {r.error ? <td colSpan={6} className="oi-muted">{r.error}</td> : <>
                <td>{n2(r.spot)}</td><td className={tone(r.netGex)}>{fmtCr(r.netGex)}</td><td>{r.flip ? n2(r.flip, 0) : "—"}</td><td>{n2(r.callWall, 0)} / {n2(r.putWall, 0)}</td><td>{r.pcr?.toFixed(2) ?? "—"}</td><td>{r.atmIv?.toFixed(1) ?? "—"}</td></>}</tr>)}</tbody></table></div>}
      </Panel>
      <div style={{ gridColumn: "span 2" }}><GexByStrike ctx={ctx} /></div>
      <div style={{ gridColumn: "span 2" }}><DayWiseGamma ctx={ctx} /></div>
    </div>
  );
}

export default function OptionsIntelligence({ symbol, onSymbol, otherTabs = [], renderOther, initialTab = "overview", tab: controlledTab, onTab }) {
  const [tabState, setTabState] = useState(initialTab);
  const tab = controlledTab ?? tabState;
  const setTab = onTab ?? setTabState;
  const [expiry, setExpiry] = useState("");
  const [kind, setKind] = useState("all");
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [palette, setPalette] = useState(false);
  const [replay, setReplay] = useState({ active: false, day: "", expiry: "", idx: null });
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [store, saveStore] = useWorkspaceStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const levels = useIndexLevels();

  useEffect(() => { setExpiry(""); setSelectedStrike(null); setReplay({ active: false, day: "", expiry: "", idx: null }); }, [symbol]);
  useEffect(() => {
    if (!replay.day || !replay.expiry) { setSeries([]); return; }
    let live = true; setSeriesLoading(true);
    loadSeries(symbol, replay.expiry, replay.day).then(s => { if (!live) return; setSeries(s); setSeriesLoading(false); if (s.length) setReplay(r => ({ ...r, active: true, idx: s.length - 1 })); });
    return () => { live = false; };
  }, [symbol, replay.day, replay.expiry]);
  const replaySnap = replay.active && series.length ? series[Math.min(replay.idx ?? series.length - 1, series.length - 1)] : null;
  const replaySnaps = replaySnap ? series.filter(s => s.t <= replaySnap.t) : null;

  const baseRef = useRef({});
  const ctx = useIntelContext({ symbol, expiry: replaySnap ? replaySnap.expiry : expiry, base: baseRef.current, replaySnap, replaySnaps });
  const strip = useStrip(levels, ctx);

  // since-last-visit: freeze the stored marker on first load, then write the new one.
  const [lastVisitPrev, setLastVisitPrev] = useState(null);
  useEffect(() => { if (store.cloud !== "loading" && lastVisitPrev === null) setLastVisitPrev(store.lastVisit || {}); }, [store.cloud, store.lastVisit, lastVisitPrev]);
  const wroteAt = useRef(0);
  useEffect(() => {
    if (lastVisitPrev === null || Date.now() - wroteAt.current < 10 * 60000) return;
    const lv = { ...(store.lastVisit || {}) }; let any = false;
    for (const s of strip) if (s.netGex != null) { lv[s.id] = { t: s.asOf || Date.now(), netGex: s.netGex, expiry: s.expiry || null }; any = true; }
    if (!any) return;
    const t = setTimeout(() => { wroteAt.current = Date.now(); saveStore({ lastVisit: lv }); }, 20000);
    return () => clearTimeout(t);
  }, [strip, lastVisitPrev]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTab = useCallback(id => setTab(id === "unusual" ? "desk-unusual" : id), [setTab]);
  const fullCtx = useMemo(() => ({ ...ctx, strip, plan: store.plan, selectedStrike, selectStrike: setSelectedStrike, goTab, setSymbol: onSymbol, lastVisitPrev, day: ctx.day }),
    [ctx, strip, store.plan, selectedStrike, goTab, onSymbol, lastVisitPrev]);
  baseRef.current = { plan: store.plan, strip, selectStrike: setSelectedStrike, goTab, setSymbol: onSymbol, lastVisitPrev, selectedStrike };

  useEffect(() => {
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(p => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tags = useMemo(() => tagExpiries(ctx.expiries, Date.now()), [ctx.expiries]);
  const shownTags = tags.filter(t => kind === "all" || (kind === "0dte" && t.zeroDte) || (kind === "weekly" && t.weekly) || (kind === "monthly" && t.monthly));
  const commands = useMemo(() => [
    ...[...INTEL_TABS, ...otherTabs].map(t => ({ id: "tab-" + t.id, label: t.label, group: "View", run: () => setTab(t.id) })),
    ...INDEX_UNIVERSE.map(i => ({ id: "ix-" + i.id, label: i.label, group: "Index", run: () => onSymbol(i.id) })),
    ...tags.slice(0, 12).map(t => ({ id: "ex-" + t.expiry, label: `Expiry ${t.expiry}${t.zeroDte ? " · 0DTE" : t.monthly ? " · monthly" : " · weekly"}`, group: "Expiry", run: () => setExpiry(t.expiry) })),
    ...[...PRESETS, ...(store.workspaces || [])].map(w => ({ id: "ws-" + w.id, label: w.name, group: "Workspace", run: () => setTab("workspace") })),
    { id: "act-refresh", label: "Refresh chain now", group: "Action", run: () => ctx.reload?.() },
    { id: "act-live", label: "Exit replay (go live)", group: "Action", run: () => setReplay({ active: false, day: "", expiry: "", idx: null }) },
    { id: "act-0dte", label: "Show 0DTE expiries", group: "Action", run: () => setKind("0dte") },
  ], [otherTabs, tags, store.workspaces, onSymbol, ctx.reload]);

  const prefs = { theme: "terminal", palette: "classic", text: "m", heat: 0.75, pin: "#5ba6db", ...store.prefs };
  const rootCls = `oi-root theme-${prefs.theme} pal-${prefs.palette} text-${prefs.text}`;
  const sessionOpen = isNseSession();
  const isIntel = INTEL_TABS.some(t => t.id === tab);
  const front = tags[0];

  // Everything below depends on the browser clock and live data: render it after hydration only.
  if (!mounted) return <div className={rootCls} data-options-intel-loading><div className="oi-head"><div><div className="oi-kicker">ALPHAHEDGEQUANT / OPTIONS ANALYTICS</div><div className="oi-title">{symbol} · Options Intelligence</div></div></div><div className="oi-empty">Loading options analytics…</div></div>;
  return (
    <div className={rootCls} style={{ "--oi-heat": prefs.heat, "--oi-pin": prefs.pin }} data-options-intel>
      <div className="oi-head">
        <div>
          <div className="oi-kicker">ALPHAHEDGEQUANT / OPTIONS ANALYTICS</div>
          <div className="oi-title">{symbol} · Options Intelligence</div>
        </div>
        <div className="oi-controls">
          {INDEX_UNIVERSE.map(i => <button key={i.id} className={"oi-chip" + (strip.find(s => s.id === i.id)?.status === "unavailable" ? " is-off" : "")} aria-pressed={symbol === i.id} onClick={() => onSymbol(i.id)}
            title={strip.find(s => s.id === i.id)?.note || ""}>{i.label}</button>)}
          <button className="oi-chip" onClick={() => setPalette(true)} title="Quick switcher">⌘/Ctrl K</button>
        </div>
      </div>

      <div className="oi-strip" aria-label="Market strip">
        {strip.map(s => <div key={s.id} onClick={() => s.status !== "unavailable" && onSymbol(s.id)} style={{ cursor: s.status === "unavailable" ? "default" : "pointer" }}>
          <small>{s.label}</small><b>{s.spot ? n2(s.spot) : "—"}</b>
          <small className={tone(s.change)}>{s.change == null ? (s.status === "unavailable" ? s.note : "Move unavailable") : `${s.change > 0 ? "+" : ""}${n2(s.change)}`}</small>
          <small>Net GEX {s.netGex == null ? "—" : <span className={tone(s.netGex)}>₹ {fmtCr(s.netGex)}</span>} · {s.asOf ? ist(s.asOf) : "—"}</small>
        </div>)}
        <div><small>INDIA VIX</small><b>—</b><small>Not available from current gateway</small></div>
      </div>

      <div className="oi-status oi-mono">
        <span><i className={"dot " + (ctx.isReplay ? "replay" : ctx.status === "live" ? "live" : ctx.status === "loading" ? "" : "bad")} />
          {ctx.isReplay ? `REPLAY ${istDT(ctx.nowMs)} IST` : ctx.status === "live" ? "Upstox chain received" : ctx.status === "loading" ? "Loading…" : ctx.status === "expired" ? "Upstox session expired" : ctx.status === "notListed" ? "Not in backend instrument master" : "No verified chain"}</span>
        {ctx.parsed?.receivedAt && <span>Source {ist(Date.parse(ctx.parsed.receivedAt))} IST</span>}
        <span>{sessionOpen ? "NSE session open · refresh 15 s" : "Outside NSE session · polling paused (exchange holidays not detected)"}</span>
        {ctx.status === "expired" && <a className="oi-accent" href="https://zerohedgequant-backend.onrender.com/auth/login" target="_blank" rel="noreferrer">Reconnect Upstox ↗</a>}
        <span>Plan {String(store.plan).toUpperCase()} · workspace {store.cloud}</span>
        {!ctx.isReplay && <button className="oi-accent" onClick={() => ctx.reload?.()}>Refresh</button>}
      </div>

      {ctx.expiries.length > 0 && !ctx.isReplay && (
        <div className="oi-status" style={{ alignItems: "center" }}>
          <span className="oi-kicker">EXPIRY</span>
          {[["all", "All"], ["0dte", "0DTE"], ["weekly", "Weekly"], ["monthly", "Monthly"]].map(([k, l]) => <button key={k} className="oi-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
          <span className="oi-muted">|</span>
          {shownTags.slice(0, 10).map(t => <button key={t.expiry} className="oi-chip" aria-pressed={ctx.expiry === t.expiry} onClick={() => setExpiry(t.expiry)}>
            {t.expiry}{t.zeroDte ? <span className="oi-tag zero">0DTE</span> : <span className="oi-tag">{t.monthly ? "M" : "W"}</span>}</button>)}
          {!shownTags.length && <span className="oi-muted">{kind === "0dte" ? "No contract expires today" : "None"}</span>}
          {front && <span className="oi-muted">· {yearsToExpiry(ctx.expiry, Date.now()) ? (yearsToExpiry(ctx.expiry, Date.now()) * 365).toFixed(1) + " days to selected expiry" : ""}</span>}
        </div>
      )}

      {replay.active && series.length > 0 && (
        <div className="oi-scrubber">
          <span className="oi-kicker">REPLAY {replay.day}</span>
          <input type="range" min={0} max={series.length - 1} value={replay.idx ?? series.length - 1} onChange={e => setReplay(r => ({ ...r, idx: Number(e.target.value) }))} aria-label="Replay timestamp" />
          <span className="oi-mono">{ist(replaySnap?.t)} IST</span>
          <button className="oi-btn" onClick={() => setReplay({ active: false, day: "", expiry: "", idx: null })}>Live</button>
        </div>
      )}

      <nav className="oi-tabs" role="tablist" aria-label="Options analytics">
        {INTEL_TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
        {otherTabs.length > 0 && <><span className="oi-sep" /><span className="oi-group">OTHER TOOLS</span></>}
        {otherTabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </nav>

      <div className="oi-body">
        {isIntel && <ContractDetail ctx={fullCtx} />}
        {LAYOUTS[tab] && <Layout id={tab} ctx={fullCtx} />}
        {tab === "replay" && <ReplayTab ctx={fullCtx} replay={replay} setReplay={setReplay} series={series} loading={seriesLoading} />}
        {tab === "fno" && <FnoStocks ctx={fullCtx} onSymbol={onSymbol} />}
        {tab === "workspace" && <>
          <WorkspaceTab ctx={fullCtx} store={store} saveStore={saveStore} useIntelContext={useIntelContext} />
          <div style={{ marginTop: 10 }}><AppearancePanel prefs={store.prefs} onChange={p => saveStore({ prefs: p })} /></div>
        </>}
        {!isIntel && renderOther?.(tab)}
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={commands} />
    </div>
  );
}
