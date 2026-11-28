"use client";
// AHQ Quant Terminal shell: command bar, tiled pane stacks with tabs, linked tickers,
// workspaces and a status bar. Layout (never data) is saved in this browser.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import "./terminal2.css";
import { COMMANDS, BY_CODE, TICKER_SECTIONS, defaultWorkspaces, paneId, parseCommand, loadLayout, saveLayout, clearLayout } from "./commands";
import { renderPane } from "./panes";
import { useSearch, useIndices, useUsIndices, useQuote } from "./useTerminalData";
import { nseStatus, n2, pctTxt } from "@/lib/terminalData.mjs";

const SYM = /^[A-Z0-9&_.-]{1,40}$/;
const LEGACY_TAB = { market: ["research", "DES"], options: ["derivatives", "OMON"], analytics: ["derivatives", "OPX"], flow: ["derivatives", "FLOW"],
  scanners: ["monitor", "SCAN"], risk: ["research", "RISK"], company: ["research", "FA"], forecast: ["research", "FCST"], network: ["research", "NET"], peers: ["research", "PEER"] };

function reducer(st, a) {
  const wsIdx = st.workspaces.findIndex(w => w.id === st.active);
  const ws = st.workspaces[wsIdx];
  const setWs = w => ({ ...st, workspaces: st.workspaces.map((x, i) => (i === wsIdx ? w : x)) });
  const setTile = (ti, t) => setWs({ ...ws, tiles: ws.tiles.map((x, i) => (i === ti ? t : x)) });
  switch (a.type) {
    case "init": return { ...st, ...a.state, ready: true };
    case "ticker": return { ...st, ticker: a.ticker };
    case "workspace": return st.workspaces.some(w => w.id === a.id) ? { ...st, active: a.id, focus: 0 } : st;
    case "focus": return { ...st, focus: a.tile };
    case "open": {
      const { code, ticker, tile } = a;
      // Reuse an existing linked pane with the same command, else add to the target tile.
      for (let ti = 0; ti < ws.tiles.length; ti++) {
        const pi = ws.tiles[ti].panes.findIndex(p => p.code === code && (p.linked || p.ticker === ticker));
        if (pi >= 0 && tile == null) return { ...setTile(ti, { ...ws.tiles[ti], active: pi }), focus: ti };
        const di = ws.tiles[ti].panes.findIndex(p => p.code === "DES" && p.linked);
        if (di >= 0 && tile == null && TICKER_SECTIONS.some(([c]) => c === code) && code !== "DES" && ws.tiles[ti].active === di) {
          const panes = ws.tiles[ti].panes.map((p, k) => (k === di ? { ...p, section: code } : p));
          return { ...setTile(ti, { ...ws.tiles[ti], panes }), focus: ti };
        }
      }
      const ti = Math.min(tile ?? st.focus ?? 0, ws.tiles.length - 1);
      const t = ws.tiles[ti];
      const pane = { id: paneId(), code, linked: true, ...(code === "DES" ? { section: "DES" } : {}) };
      return { ...setTile(ti, { ...t, panes: [...t.panes, pane], active: t.panes.length }), focus: ti };
    }
    case "activate": return { ...setTile(a.tile, { ...ws.tiles[a.tile], active: a.pane }), focus: a.tile };
    case "section": return setTile(a.tile, { ...ws.tiles[a.tile], panes: ws.tiles[a.tile].panes.map((p, i) => (i === a.pane ? { ...p, section: a.section } : p)) });
    case "close": {
      const t = ws.tiles[a.tile];
      const panes = t.panes.filter((_, i) => i !== a.pane);
      if (!panes.length) {
        if (ws.tiles.length === 1) return setTile(a.tile, { ...t, panes: [{ id: paneId(), code: "HELP", linked: true }], active: 0 });
        return { ...setWs({ ...ws, tiles: ws.tiles.filter((_, i) => i !== a.tile) }), focus: 0 };
      }
      return setTile(a.tile, { ...t, panes, active: Math.min(t.active, panes.length - 1) });
    }
    case "pin": {
      const t = ws.tiles[a.tile];
      return setTile(a.tile, { ...t, panes: t.panes.map((p, i) => (i === a.pane ? (p.linked ? { ...p, linked: false, ticker: st.ticker } : { ...p, linked: true, ticker: undefined }) : p)) });
    }
    case "split": {
      if (ws.tiles.length >= 3) return st;
      const tiles = [...ws.tiles];
      tiles.splice(a.tile + 1, 0, { panes: [{ id: paneId(), code: a.code || "HELP", linked: true }], active: 0, size: 2 });
      return { ...setWs({ ...ws, tiles }), focus: a.tile + 1 };
    }
    case "resize": return setWs({ ...ws, tiles: ws.tiles.map((t, i) => (i === a.tile ? { ...t, size: a.size } : i === a.tile + 1 ? { ...t, size: a.next } : t)) });
    case "cycle": {
      const t = ws.tiles[st.focus] || ws.tiles[0];
      const ti = ws.tiles.indexOf(t);
      return setTile(ti, { ...t, active: (t.active + a.dir + t.panes.length) % t.panes.length });
    }
    case "addWorkspace": {
      const n = st.workspaces.filter(w => w.custom).length + 1;
      const w = { id: "custom-" + Date.now().toString(36), name: `Desk ${n}`, key: String(4 + n), custom: true, tiles: [{ panes: [{ id: paneId(), code: "DES", linked: true, section: "DES" }], active: 0, size: 1 }] };
      return { ...st, workspaces: [...st.workspaces, w], active: w.id, focus: 0 };
    }
    case "renameWorkspace": return { ...st, workspaces: st.workspaces.map(w => (w.id === a.id ? { ...w, name: a.name.slice(0, 24) || w.name } : w)) };
    case "removeWorkspace": {
      const list = st.workspaces.filter(w => w.id !== a.id);
      return { ...st, workspaces: list, active: st.active === a.id ? list[0].id : st.active, focus: 0 };
    }
    case "reset": return { ...st, workspaces: defaultWorkspaces(), active: "research", focus: 0 };
    default: return st;
  }
}

function CommandBar({ open, setOpen, onRun, ticker, inputRef }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const results = useSearch(q.split(/\s+/).find(t => !BY_CODE[t.toUpperCase()]) || "");
  const parsed = parseCommand(q);
  const items = useMemo(() => {
    const t = q.trim().toUpperCase();
    const out = [];
    if (parsed.code && parsed.ticker) out.push({ k: "both", label: `${parsed.ticker} ${parsed.code}`, desc: `${BY_CODE[parsed.code].title} for ${parsed.ticker}`, run: () => onRun(parsed.code, parsed.ticker) });
    for (const r of results) out.push({ k: "t" + r.symbol, label: r.symbol, desc: r.name, tag: "NSE", run: () => onRun(parsed.code || null, r.symbol) });
    if (t && SYM.test(t) && !BY_CODE[t] && !results.some(r => r.symbol === t)) out.push({ k: "raw", label: t, desc: "Open ticker", tag: "NSE", run: () => onRun(null, t) });
    const cmds = COMMANDS.filter(c => !t || c.code.startsWith(t) || c.title.toUpperCase().includes(t) || (parsed.code === c.code));
    for (const c of cmds) out.push({ k: "c" + c.code, code: c.code, label: c.title, desc: c.desc + (c.ticker ? ` · ${parsed.ticker || ticker}` : ""), group: c.group, run: () => onRun(c.code, parsed.ticker || null) });
    return out.slice(0, 40);
  }, [q, results, parsed.code, parsed.ticker, ticker, onRun]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); else setQ(""); }, [open, inputRef]);
  return (
    <div className={"tm-cmd" + (open ? " is-open" : "")}>
      <span className="tm-prompt">&gt;</span>
      <input ref={inputRef} value={q} placeholder="Search a ticker or run a command  (RELIANCE · GP · INFY ANR)" aria-label="Command bar"
        onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
          else if (e.key === "Enter") { e.preventDefault(); items[sel]?.run(); setOpen(false); inputRef.current?.blur(); }
          else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }} />
      <kbd className="tm-kbd">⌘K</kbd>
      {open && <div className="tm-cmd-list" role="listbox" onMouseDown={e => e.preventDefault()}>
        {items.map((it, i) => <div key={it.k} role="option" aria-selected={i === sel} className="tm-cmd-item" onMouseEnter={() => setSel(i)} onClick={() => { it.run(); setOpen(false); inputRef.current?.blur(); }}>
          <span className="code">{it.code || it.tag || "↵"}</span><b>{it.label}</b><span className="desc">{it.desc}</span>{it.group && <span className="grp">{it.group}</span>}
        </div>)}
        {!items.length && <div className="tm-cmd-item"><span className="desc">No match</span></div>}
      </div>}
    </div>
  );
}

function Tile({ tile, ti, st, dispatch, ticker, setTicker, run, focused, onAdd }) {
  const active = tile.panes[tile.active] || tile.panes[0];
  const paneTicker = active?.linked ? ticker : active?.ticker || ticker;
  const isSecurity = active?.code === "DES";
  const code = isSecurity ? active.section || "DES" : active?.code;
  const props = { ticker: paneTicker, onTicker: s => setTicker(s), onOpen: c => run(c, null), onRun: c => run(c, null) };
  return (
    <section className={"tm-tile" + (focused ? " is-focus" : "")} style={{ flex: tile.size || 1 }} onMouseDown={() => !focused && dispatch({ type: "focus", tile: ti })}>
      <div className="tm-tabs" role="tablist">
        {tile.panes.map((p, pi) => {
          const cmd = BY_CODE[p.code];
          const t = p.linked ? ticker : p.ticker;
          const label = p.code === "DES" ? `${t}` : cmd?.ticker ? `${cmd.title}: ${t}` : cmd?.title;
          return <div key={p.id} role="tab" aria-selected={pi === tile.active} className={"tm-tab" + (pi === tile.active ? " is-active" : "")} onClick={() => dispatch({ type: "activate", tile: ti, pane: pi })} title={cmd?.desc}>
            <span className="tm-tab-code">{p.code}</span><span className="tm-tab-label">{label}</span>
            {cmd?.ticker && <button className={"tm-link-btn" + (p.linked ? " on" : "")} title={p.linked ? "Linked to the active ticker — click to pin" : `Pinned to ${p.ticker} — click to link`} onClick={e => { e.stopPropagation(); dispatch({ type: "pin", tile: ti, pane: pi }); }}>⧉</button>}
            <button className="tm-x" title="Close pane" aria-label={`Close ${cmd?.title}`} onClick={e => { e.stopPropagation(); dispatch({ type: "close", tile: ti, pane: pi }); }}>×</button>
          </div>;
        })}
        <button className="tm-tab-add" title="Add a pane to this tile" onClick={() => onAdd(ti)}>+</button>
        {st.workspaces.find(w => w.id === st.active).tiles.length < 3 && <button className="tm-tab-add" title="Split: new tile to the right" onClick={() => dispatch({ type: "split", tile: ti })}>⊞</button>}
      </div>
      {isSecurity && <div className="tm-sections" role="tablist" aria-label={`${paneTicker} sections`}>
        {TICKER_SECTIONS.map(([c, l]) => <button key={c} role="tab" aria-selected={code === c} data-ahq-event={code === c ? undefined : "terminal_tab_selected"} onClick={() => dispatch({ type: "section", tile: ti, pane: tile.active, section: c })}>{l}</button>)}
      </div>}
      <div className="tm-pane" key={active?.id + code + paneTicker}>{active && renderPane(code, props)}</div>
    </section>
  );
}

function Splitter({ ti, tiles, dispatch, rowRef }) {
  const onDown = e => {
    e.preventDefault();
    const row = rowRef.current; if (!row) return;
    const total = tiles.reduce((s, t) => s + (t.size || 1), 0);
    const startX = e.clientX, a = tiles[ti].size || 1, b = tiles[ti + 1].size || 1, width = row.getBoundingClientRect().width;
    const move = ev => {
      const d = (ev.clientX - startX) / width * total;
      const na = Math.max(0.5, a + d), nb = Math.max(0.5, b - d);
      if (na + nb === a + b) dispatch({ type: "resize", tile: ti, size: na, next: nb });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  return <div className="tm-split" role="separator" aria-orientation="vertical" onPointerDown={onDown} title="Drag to resize" />;
}

// Shown only when the live quote request itself fails — never on a healthy feed.
function ProviderAlert({ ticker }) {
  const q = useQuote(ticker, { refreshMs: 0 });
  const quoteError = q.error && !q.data ? q.error : "";
  if (!quoteError) return null;
  const auth = /Upstox|expired|reconnect|401/i.test(quoteError);
  return quoteError&&<div className="qt-provider-alert tm-alert" role="alert">
    <strong>{auth ? "NSE quote connection needs attention." : "Live quote unavailable."}</strong>
    <span>{quoteError} Quotes and options analytics are not confirmed live.{auth ? " An active Upstox broker session may be required." : ""}</span>
    {auth && <a href="https://zerohedgequant-backend.onrender.com/auth/login" target="_blank" rel="noopener noreferrer">Reconnect Upstox ↗</a>}
  </div>;
}

function StatusBar({ ticker }) {
  const ix = useIndices(), us = useUsIndices(), q = useQuote(ticker, { refreshMs: 0 });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const s = nseStatus(now);
  const nifty = ix.data?.data?.NIFTY50, bank = ix.data?.data?.BANKNIFTY, spx = us.data?.data?.["S&P 500"], vix = us.data?.data?.VIX;
  const chip = (l, v, ch, pct) => v ? <span key={l}>{l} <b>{n2(v.value ?? v)}</b> {ch != null && <i className={ch > 0 ? "up" : ch < 0 ? "dn" : ""}>{pct != null ? pctTxt(pct) : n2(ch)}</i>}</span> : null;
  const upstox = q.error && /Upstox/i.test(q.error) ? "Upstox session expired" : q.data ? "Upstox connected" : q.status === "loading" ? "Checking Upstox…" : "Quote feed unavailable";
  return <footer className="tm-status">
    <span className={s.open ? "up" : ""}>{s.label}{s.open ? "" : ` · ${s.next}`}</span>
    <span className={upstox === "Upstox connected" ? "" : "dn"}>{upstox}{upstox === "Upstox session expired" && <> · <a href="https://zerohedgequant-backend.onrender.com/auth/login" target="_blank" rel="noreferrer">reconnect</a></>}</span>
    {chip("NIFTY", nifty, nifty?.prevClose ? nifty.change : null, nifty?.prevClose ? nifty.change / nifty.prevClose * 100 : null)}
    {chip("BANKNIFTY", bank, bank?.prevClose ? bank.change : null, bank?.prevClose ? bank.change / bank.prevClose * 100 : null)}
    {chip("S&P 500", spx, spx?.change, spx?.changePct)}
    {chip("VIX", vix, vix?.change, vix?.changePct)}
    <span className="tm-muted">US levels delayed · {new Date(now).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false })} IST</span>
  </footer>;
}

export default function TerminalShell() {
  const [st, dispatch] = useReducer(reducer, { workspaces: defaultWorkspaces(), active: "research", ticker: "RELIANCE", focus: 0, ready: false });
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const inputRef = useRef(null);
  const rowRef = useRef(null);

  // init from saved layout + URL (?symbol=, ?ws=, legacy ?tab=)
  useEffect(() => {
    const saved = loadLayout();
    const p = new URLSearchParams(window.location.search);
    const sym = String(p.get("symbol") || p.get("ticker") || "").toUpperCase();
    let state = { workspaces: saved?.workspaces || defaultWorkspaces(), active: saved?.active || "research" };
    if (!state.workspaces.some(w => w.id === state.active)) state.active = state.workspaces[0].id;
    if (SYM.test(sym)) state.ticker = sym;
    const legacy = LEGACY_TAB[String(p.get("tab") || "").toLowerCase()];
    const wsParam = String(p.get("ws") || "").toLowerCase();
    if (state.workspaces.some(w => w.id === wsParam)) state.active = wsParam;
    dispatch({ type: "init", state });
    if (legacy) { dispatch({ type: "workspace", id: legacy[0] }); dispatch({ type: "open", code: legacy[1] }); }
  }, []);
  useEffect(() => { if (st.ready) { const t = setTimeout(() => saveLayout(st), 300); return () => clearTimeout(t); } }, [st.workspaces, st.active, st.ready]); // eslint-disable-line
  useEffect(() => {
    if (!st.ready) return;
    const u = new URL(window.location.href);
    u.searchParams.set("symbol", st.ticker); u.searchParams.set("ws", st.active); u.searchParams.delete("tab");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, [st.ticker, st.active, st.ready]);

  const setTicker = useCallback(s => { const v = String(s || "").toUpperCase(); if (SYM.test(v)) dispatch({ type: "ticker", ticker: v }); }, []);
  const run = useCallback((code, ticker, tile = null) => {
    if (ticker && SYM.test(ticker)) dispatch({ type: "ticker", ticker });
    if (code) dispatch({ type: "open", code, tile });
    // Only fixed, server-approved event names are emitted — never the ticker or command text.
    if (ticker) window.dispatchEvent(new CustomEvent("ahq:analytics", { detail: { name: "terminal_stock_selected" } }));
    if (code) window.dispatchEvent(new CustomEvent("ahq:analytics", { detail: { name: "terminal_tab_selected" } }));
  }, []);
  const runFromBar = useCallback((code, ticker) => { run(code, ticker, addTarget); setAddTarget(null); }, [run, addTarget]);

  useEffect(() => {
    const onKey = e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(o => !o); if (!cmdOpen) inputRef.current?.focus(); return; }
      if (e.key === "/" && !typing) { e.preventDefault(); setCmdOpen(true); inputRef.current?.focus(); return; }
      if (e.key === "?" && !typing) { e.preventDefault(); run("HELP", null); return; }
      if (e.altKey && /^[1-9]$/.test(e.key)) { const w = st.workspaces[Number(e.key) - 1]; if (w) { e.preventDefault(); dispatch({ type: "workspace", id: w.id }); } return; }
      if (e.altKey && (e.key === "]" || e.key === "[")) { e.preventDefault(); dispatch({ type: "cycle", dir: e.key === "]" ? 1 : -1 }); return; }
      if (e.altKey && e.key.toLowerCase() === "w" && !typing) {
        e.preventDefault();
        const ws = st.workspaces.find(w => w.id === st.active); const t = ws.tiles[st.focus] || ws.tiles[0];
        dispatch({ type: "close", tile: ws.tiles.indexOf(t), pane: t.active });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [st.workspaces, st.active, st.focus, cmdOpen, run]);

  const ws = st.workspaces.find(w => w.id === st.active) || st.workspaces[0];
  const s = nseStatus();
  if (!st.ready) return <main className="tm-root qt-shell"><div className="tm-empty">Opening terminal…</div></main>;
  return (
    <main className="tm-root qt-shell" data-terminal="ahq">
      <header className="tm-top">
        <span className="tm-brand"><i>α</i> AHQ TERMINAL</span>
        <CommandBar open={cmdOpen} setOpen={setCmdOpen} onRun={runFromBar} ticker={st.ticker} inputRef={inputRef} />
        <button className="tm-help" onClick={() => run("HELP", null)} title="Help & shortcuts">Help <kbd>?</kbd></button>
        <span className={"tm-mkt" + (s.open ? " on" : "")}>{s.label}<em>{s.open ? "" : ` · ${s.next}`}</em></span>
      </header>
      <ProviderAlert ticker={st.ticker} />
      {cmdOpen && <div className="tm-cmd-backdrop" onMouseDown={() => setCmdOpen(false)} />}
      <div className="tm-row" ref={rowRef}>
        {ws.tiles.map((t, ti) => <Frag key={ti}>
          {ti > 0 && <Splitter ti={ti - 1} tiles={ws.tiles} dispatch={dispatch} rowRef={rowRef} />}
          <Tile tile={t} ti={ti} st={st} dispatch={dispatch} ticker={st.ticker} setTicker={setTicker} run={run} focused={st.focus === ti}
            onAdd={tile => { setAddTarget(tile); setCmdOpen(true); inputRef.current?.focus(); }} />
        </Frag>)}
      </div>
      <nav className="tm-ws" aria-label="Workspaces">
        {st.workspaces.map((w, i) => <button key={w.id} aria-pressed={w.id === st.active} data-ahq-event={w.id === st.active ? undefined : "terminal_tab_selected"} onClick={() => dispatch({ type: "workspace", id: w.id })}
          onDoubleClick={() => { if (w.custom) { const n = prompt("Rename workspace", w.name); if (n) dispatch({ type: "renameWorkspace", id: w.id, name: n }); } }}
          title={`Alt ${i + 1}${w.custom ? " · double-click to rename" : ""}`}><kbd>{i + 1}</kbd>{w.name}{w.custom && <span className="tm-x" onClick={e => { e.stopPropagation(); dispatch({ type: "removeWorkspace", id: w.id }); }}>×</span>}</button>)}
        <button onClick={() => dispatch({ type: "addWorkspace" })} title="New workspace">+</button>
        <span className="tm-spacer" />
        <button className="tm-muted" onClick={() => { clearLayout(); dispatch({ type: "reset" }); }} title="Restore the default layouts">Reset layout</button>
        <a className="tm-muted" href="/options">Options Analytics ↗</a>
      </nav>
      <StatusBar ticker={st.ticker} />
    </main>
  );
}

function Frag({ children }) { return <>{children}</>; }
