"use client";
// AlphaHedgeQuant — Options Intelligence shell (inside /options and the Quant Terminal).
// Spec tabs come first; the existing Options Desk tools follow as "Other tools" tabs.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./optionsIntel.css";
import "./marketGate.css";
import { Orbit } from "./MarketGate";
import { StoryTab, RangeMap } from "./Story";
import { buildStory } from "@/lib/optionsSignals.mjs";
import { summarize, contractsFromSnapshot, tagExpiries, isSession, istParts, fmtCr, yearsToExpiry } from "@/lib/optionsIntel.mjs";
import { PRESETS } from "@/lib/optionsWorkspace.mjs";
import {
  INDEX_UNIVERSE, US_UNIVERSE, chainUrl, useChain, useMultiExpiry, useSnapshotRecorder, useRealizedVol, useIndexLevels, useWorkspaceStore,
  loadSeries, listSeriesDays, listExpiriesForDay, loadSymbolHistory,
} from "./useOptionsData";
import { View, ContractDetail, KeyLevels, GexByStrike, OiChange, IvSmile } from "./views";
import { WorkspaceTab, AppearancePanel, CommandPalette } from "./Workspace";
import { Panel, Empty, Metric, CatChart, n2, ist, istDT, tone } from "./ui";

export const INTEL_TABS = [
  { id: "story", label: "Today's Story", desc: <><b>Start here.</b> What the option chain is saying right now, in plain words — ranked by what deserves your attention, with the numbers behind every line.</> },
  { id: "levels", label: "Levels & Range", desc: <><b>Where is the market boxed in?</b> Support and resistance from open interest, gamma walls, the regime line, max pain and the range options are pricing.</> },
  { id: "positioning", label: "Who's Positioning", desc: <><b>Who is adding and who is leaving?</b> Fresh open interest, build-ups and unwinds, call-vs-put imbalances, quote pressure and day-trading churn.</> },
  { id: "decay", label: "Decay & Volatility", desc: <><b>Is premium melting faster than usual?</b> Straddle decay against time alone, implied vs realised volatility, skew and the volatility curve.</> },
  { id: "expiry", label: "Expiry & Gamma Blasts", desc: <><b>Can a small move explode premiums?</b> Gamma-blast watch, how hedging shifts when the index moves, and how gamma changes into expiry.</> },
  { id: "grid", label: "Full Chain", desc: <>Every strike across the loaded expiries — OI, change, IV, Greeks and exposure — for when you want the raw numbers.</> },
  { id: "replay", label: "Replay", desc: <>Rewind today's session minute by minute; every panel follows the same moment.</> },
  { id: "fno", label: "Stocks", desc: <>The same reading for individual stocks with options.</> },
  { id: "workspace", label: "My Workspace", desc: <>Build your own screen from any panel. Saved to your account; share the layout with a link.</> },
];
const LAYOUTS = {
  levels: { cols: 2, panes: [["range-map", 2], ["key-levels", 2], ["gex-strike", 2], ["pin-pressure", 1], ["gex-profile", 1], ["oi-leaders", 1], ["hhi", 1]] },
  positioning: { cols: 2, panes: [["oi-change", 2], ["builds-unwinds", 1], ["imbalance", 1], ["dex-flow", 2], ["oi-rotation", 1], ["unusual-volume", 1], ["aggressor", 1], ["futures-buildup", 1], ["oi-tape", 2]] },
  decay: { cols: 2, panes: [["decay-watch", 1], ["atm-iv-rv", 1], ["iv-smile", 1], ["term-structure", 1], ["iv-surface", 2]] },
  expiry: { cols: 2, panes: [["gamma-blast", 2], ["gamma-decay", 2], ["hedge-ladder", 1], ["charm", 1], ["dex-strike", 1], ["vanna", 1]] },
  grid: { cols: 1, panes: [["chain-grid", 1]] },
};

/** Builds the shared analytics context for one underlying (main view or a comparison pane). */
export function useIntelContext({ symbol, expiry, record = true, base = {}, replaySnap = null, replaySnaps = null, market = "IN" }) {
  const chain = useChain(symbol, expiry, { market });
  const effExpiry = expiry || chain.parsed?.expiry || "";
  const recorder = useSnapshotRecorder(record ? symbol : null, effExpiry, record ? chain.parsed : null, market);
  const [multiOn, setMultiOn] = useState(false);
  const expiries = chain.raw?.expiries || [];
  const multi = useMultiExpiry(symbol, expiries, { count: 6, enabled: multiOn && !replaySnap, market });
  const rv = useRealizedVol(symbol, market);
  const parsed = useMemo(() => (replaySnap ? contractsFromSnapshot(replaySnap) : chain.parsed), [replaySnap, chain.parsed]);
  const nowMs = replaySnap ? replaySnap.t : chain.fetchedAt || Date.now();
  const summary = useMemo(() => (parsed ? summarize(parsed, { nowMs }) : null), [parsed, nowMs]);
  return {
    ...base, market, symbol, expiry: parsed?.expiry || effExpiry, expiries, parsed, summary, nowMs,
    status: replaySnap ? "replay" : chain.status, error: chain.error, reload: chain.reload,
    snaps: replaySnaps || recorder.snaps, day: recorder.day, isReplay: !!replaySnap,
    multi: replaySnap ? { status: "error", chains: [], failed: [] } : multi, requestMulti: () => setMultiOn(true), rv,
  };
}

/** Market strip: front-expiry net GEX for every supported index. */
function useStrip(levels, current, market) {
  const universe = market === "US" ? US_UNIVERSE : INDEX_UNIVERSE;
  const [rows, setRows] = useState(universe.map(i => ({ ...i, status: "loading" })));
  useEffect(() => {
    let live = true;
    setRows(universe.map(i => ({ ...i, status: "loading" })));
    const load = async () => {
      const out = [];
      for (const ix of universe) {
        try {
          const r = await fetch(chainUrl(market, ix.id), { cache: "no-store" });
          const j = await r.json();
          if (!r.ok || !j.success) { out.push({ ...ix, status: "unavailable", note: j?.code === "US_OPTIONS_NOT_CONNECTED" ? "Options feed not connected" : r.status === 404 ? "Not in backend instrument master" : r.status === 401 ? "Upstox session expired" : "Provider error" }); continue; }
          const { contractsFromChain } = await import("@/lib/optionsIntel.mjs");
          const p = contractsFromChain(j);
          const s = summarize(p, { nowMs: Date.now() });
          out.push({ ...ix, status: "ok", spot: p.spot, netGex: s?.totals.netGex ?? null, flip: s?.flip ?? null, expiry: p.expiry, asOf: Date.parse(p.receivedAt) || Date.now() });
        } catch { out.push({ ...ix, status: "unavailable", note: "Request failed" }); }
      }
      if (live) setRows(out);
    };
    load();
    const t = setInterval(() => { if (!document.hidden && isSession(market)) load(); }, 120000);
    return () => { live = false; clearInterval(t); };
  }, [market]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => rows.map(r => {
    const lv = r.indexKey ? levels?.data?.[r.indexKey] : null;
    const cur = current?.symbol === r.id && current.summary && !current.isReplay ? current : null;
    return { ...r, change: lv && (lv.prevClose || market === "US") ? lv.change : null, changePct: lv?.changePct ?? null, level: lv?.value ?? null,
      netGex: cur && cur.expiry === r.expiry ? cur.summary.totals.netGex : r.netGex, spot: cur?.summary?.spot ?? r.spot ?? lv?.value ?? null };
  }), [rows, levels, current, market]);
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

function FnoStocks({ ctx, onSymbol, market = "IN" }) {
  const [list, setList] = useState({ status: "loading", items: [] });
  const [q, setQ] = useState("");
  const [scan, setScan] = useState({ status: "idle", rows: [] });
  useEffect(() => {
    fetch(market === "US" ? "/api/market/us-screener" : "/api/terminal?view=fno", { cache: "no-store" }).then(r => r.json())
      .then(j => setList(j?.success && Array.isArray(j.data) ? { status: "ready", items: j.data.map(x => ({ symbol: x.symbol, name: x.name })) } : { status: "error", items: [] }))
      .catch(() => setList({ status: "error", items: [] }));
  }, [market]);
  const filtered = useMemo(() => { const t = q.trim().toLowerCase(); return list.items.filter(x => !t || String(x.symbol).toLowerCase().includes(t) || String(x.name || "").toLowerCase().includes(t)).slice(0, 60); }, [q, list.items]);
  const runScan = async () => {
    const pick = filtered.slice(0, 10).map(x => x.symbol);
    setScan({ status: "loading", rows: [] });
    const { contractsFromChain } = await import("@/lib/optionsIntel.mjs");
    const rows = [];
    for (const sym of pick) {
      try {
        const r = await fetch(chainUrl(market, sym), { cache: "no-store" });
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
      <Panel title={market === "US" ? "US stock screener" : "F&O stock screener"} detail={list.status === "ready" ? `${list.items.length} ${market === "US" ? "US symbols (AHQ US screener)" : "F&O-eligible symbols (exchange/provider list)"}` : list.status === "loading" ? "Loading F&O universe…" : "F&O universe unavailable"}
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

export default function OptionsIntelligence({ symbol, onSymbol, otherTabs = [], renderOther, initialTab = "story", tab: controlledTab, onTab, market = "IN", onMarket }) {
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
  const levels = useIndexLevels(market);
  const universe = market === "US" ? US_UNIVERSE : INDEX_UNIVERSE;

  useEffect(() => { setExpiry(""); setSelectedStrike(null); setReplay({ active: false, day: "", expiry: "", idx: null }); }, [symbol, market]);
  useEffect(() => {
    if (!replay.day || !replay.expiry) { setSeries([]); return; }
    let live = true; setSeriesLoading(true);
    loadSeries(symbol, replay.expiry, replay.day).then(s => { if (!live) return; setSeries(s); setSeriesLoading(false); if (s.length) setReplay(r => ({ ...r, active: true, idx: s.length - 1 })); });
    return () => { live = false; };
  }, [symbol, replay.day, replay.expiry]);
  const replaySnap = replay.active && series.length ? series[Math.min(replay.idx ?? series.length - 1, series.length - 1)] : null;
  const replaySnaps = replaySnap ? series.filter(s => s.t <= replaySnap.t) : null;

  const baseRef = useRef({});
  const ctx = useIntelContext({ symbol, expiry: replaySnap ? replaySnap.expiry : expiry, base: baseRef.current, replaySnap, replaySnaps, market });
  const strip = useStrip(levels, ctx, market);

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

  const goTab = useCallback(id => setTab(id === "unusual" ? "desk-unusual" : id === "gamma" ? "levels" : id), [setTab]);
  const fullCtx = useMemo(() => ({ ...ctx, strip, plan: store.plan, selectedStrike, selectStrike: setSelectedStrike, goTab, setSymbol: onSymbol, lastVisitPrev, day: ctx.day }),
    [ctx, strip, store.plan, selectedStrike, goTab, onSymbol, lastVisitPrev]);
  baseRef.current = { plan: store.plan, strip, selectStrike: setSelectedStrike, goTab, setSymbol: onSymbol, lastVisitPrev, selectedStrike };

  useEffect(() => {
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(p => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tags = useMemo(() => tagExpiries(ctx.expiries, Date.now(), market), [ctx.expiries, market]);
  const shownTags = tags.filter(t => kind === "all" || (kind === "0dte" && t.zeroDte) || (kind === "weekly" && t.weekly) || (kind === "monthly" && t.monthly));
  const commands = useMemo(() => [
    ...[...INTEL_TABS, ...otherTabs].map(t => ({ id: "tab-" + t.id, label: t.label, group: "View", run: () => setTab(t.id) })),
    ...universe.map(i => ({ id: "ix-" + i.id, label: i.label, group: "Index", run: () => onSymbol(i.id) })),
    ...(onMarket ? [{ id: "mk-IN", label: "Switch to India", group: "Market", run: () => onMarket("IN") }, { id: "mk-US", label: "Switch to United States", group: "Market", run: () => onMarket("US") }] : []),
    ...tags.slice(0, 12).map(t => ({ id: "ex-" + t.expiry, label: `Expiry ${t.expiry}${t.zeroDte ? " · 0DTE" : t.monthly ? " · monthly" : " · weekly"}`, group: "Expiry", run: () => setExpiry(t.expiry) })),
    ...[...PRESETS, ...(store.workspaces || [])].map(w => ({ id: "ws-" + w.id, label: w.name, group: "Workspace", run: () => setTab("workspace") })),
    { id: "act-refresh", label: "Refresh chain now", group: "Action", run: () => ctx.reload?.() },
    { id: "act-live", label: "Exit replay (go live)", group: "Action", run: () => setReplay({ active: false, day: "", expiry: "", idx: null }) },
    { id: "act-0dte", label: "Show 0DTE expiries", group: "Action", run: () => setKind("0dte") },
  ], [otherTabs, tags, store.workspaces, onSymbol, ctx.reload, universe, onMarket]);

  const prefs = { theme: "terminal", palette: "classic", text: "m", heat: 0.75, pin: "#5ba6db", ...store.prefs };
  const rootCls = `oi-root theme-${prefs.theme} pal-${prefs.palette} text-${prefs.text}`;
  const sessionOpen = isSession(market);
  const intelTabs = INTEL_TABS.map(t => (t.id === "fno" && market === "US" ? { ...t, label: "US Stocks" } : t));
  const hotCount = useMemo(() => (ctx.parsed && ctx.summary ? buildStory({ parsed: ctx.parsed, summary: ctx.summary, snaps: ctx.snaps, nowMs: ctx.nowMs, market, symbol }).signals.filter(x => x.kind === "hot").length : 0),
    [ctx.parsed, ctx.summary, ctx.snaps, ctx.nowMs, market, symbol]);
  const activeDesc = intelTabs.find(t => t.id === tab)?.desc;
  const isIntel = intelTabs.some(t => t.id === tab);
  const front = tags[0];

  // Everything below depends on the browser clock and live data: render it after hydration only.
  if (!mounted) return <div className={rootCls} data-options-intel-loading><div className="oi-head"><div><div className="oi-kicker">ALPHAHEDGEQUANT / OPTIONS ANALYTICS</div><div className="oi-title">{symbol} · Options Intelligence</div></div></div><div className="oi-empty">Loading options analytics…</div></div>;
  return (
    <div className={rootCls} style={{ "--oi-heat": prefs.heat, "--oi-pin": prefs.pin }} data-options-intel>
      <div className="oi-hero">
        <Orbit size={300} />
        <div className="oi-row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 14 }}>
          <div>
            <div className="oi-kicker">ALPHAHEDGEQUANT / OPTIONS ANALYTICS / {market === "US" ? "UNITED STATES" : "INDIA"}</div>
            <div className="oi-title">{symbol} · <span>Options Intelligence</span></div>
          </div>
          <div className="oi-row" style={{ gap: 8 }}>
            {onMarket && <div className="oi-seg oi-country" role="group" aria-label="Market">
              {[["IN", "India"], ["US", "United States"]].map(([id, l]) => <button key={id} type="button" aria-pressed={market === id} onClick={() => market !== id && onMarket(id)}>{l}</button>)}
            </div>}
            <button className="oi-chip" onClick={() => setPalette(true)} title="Quick switcher">⌘/Ctrl K</button>
          </div>
        </div>
        <div className="oi-seg" role="group" aria-label="Underlying" style={{ marginTop: 14 }}>
          {universe.map(i => <button key={i.id} type="button" className={strip.find(s => s.id === i.id)?.status === "unavailable" && market === "IN" ? "is-off" : ""} aria-pressed={symbol === i.id} onClick={() => onSymbol(i.id)}
            title={strip.find(s => s.id === i.id)?.note || ""}>{i.label}</button>)}
        </div>
      </div>

      <div className="oi-strip" aria-label="Market strip">
        {strip.map(s => <div key={s.id} onClick={() => s.status !== "unavailable" && onSymbol(s.id)} style={{ cursor: s.status === "unavailable" ? "default" : "pointer" }}>
          <small>{s.label}</small><b>{s.spot ? n2(s.spot) : "—"}</b>
          <small className={tone(s.change)}>{s.change == null ? (s.status === "unavailable" ? s.note : "Move unavailable") : `${s.change > 0 ? "+" : ""}${n2(s.change)}`}</small>
          <small>Net GEX {s.netGex == null ? "—" : <span className={tone(s.netGex)}>₹ {fmtCr(s.netGex)}</span>} · {s.asOf ? ist(s.asOf) : "—"}</small>
        </div>)}
        {market === "US"
          ? ["DOW JONES", "VIX"].filter(k => levels.data?.[k]).map(k => { const v = levels.data[k]; return <div key={k}><small>{k}</small><b>{n2(v.value)}</b>
              <small className={tone(v.change)}>{v.change > 0 ? "+" : ""}{n2(v.change)} ({v.changePct > 0 ? "+" : ""}{Number(v.changePct).toFixed(2)}%)</small><small>Delayed · {v.priceAsOf ? istDT(Date.parse(v.priceAsOf)) + " IST" : ""}</small></div>; })
          : <div><small>INDIA VIX</small><b>—</b><small>Not available from current gateway</small></div>}
      </div>

      <div className="oi-status oi-mono">
        <span><i className={"dot " + (ctx.isReplay ? "replay" : ctx.status === "live" ? "live" : ctx.status === "loading" ? "" : "bad")} />
          {ctx.isReplay ? `REPLAY ${istDT(ctx.nowMs)} IST` : ctx.status === "live" ? (market === "US" ? "US chain received" : "Upstox chain received") : ctx.status === "loading" ? "Loading…" : ctx.status === "waking" ? "Waking the data service… retrying automatically" : ctx.status === "expired" ? "Upstox session expired" : ctx.status === "notListed" ? "Not in backend instrument master" : ctx.status === "notConnected" ? "US options feed not connected yet — index levels are live; chain analytics activate when a provider is added" : "No verified chain"}</span>
        {ctx.parsed?.receivedAt && <span>Source {ist(Date.parse(ctx.parsed.receivedAt))} IST</span>}
        <span>{market === "US" ? (sessionOpen ? "US session open (09:30–16:00 ET) · refresh 15 s" : "Outside US session · polling paused (exchange holidays not detected)") : (sessionOpen ? "NSE session open · refresh 15 s" : "Outside NSE session · polling paused (exchange holidays not detected)")}</span>
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
        {intelTabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}{t.id === "story" && hotCount > 0 && <span className="oi-badge" title="Readings that need attention">{hotCount}</span>}</button>)}
        {otherTabs.length > 0 && <><span className="oi-sep" /><span className="oi-group">OTHER TOOLS</span></>}
        {otherTabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </nav>

      {activeDesc && <div className="oi-tabdesc">{activeDesc}</div>}
      <div className="oi-body">
        {isIntel && <ContractDetail ctx={fullCtx} />}
        {tab === "story" && <StoryTab ctx={fullCtx} />}
        {LAYOUTS[tab] && <Layout id={tab} ctx={fullCtx} />}
        {tab === "replay" && <ReplayTab ctx={fullCtx} replay={replay} setReplay={setReplay} series={series} loading={seriesLoading} />}
        {tab === "fno" && <FnoStocks ctx={fullCtx} onSymbol={onSymbol} market={market} />}
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
