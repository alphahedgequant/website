"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { VIEW_IDS, PRESETS, sanitizeWorkspace, encodeLayout, decodeLayout, PLAN_PRO_VIEWS } from "@/lib/optionsWorkspace.mjs";
import { VIEWS, View } from "./views";
import { Panel } from "./ui";

/** Pane with its own underlying (used for index comparison). */
function OverridePane({ pane, ctx, useIntelContext }) {
  const sub = useIntelContext({ symbol: pane.symbol, expiry: pane.expiry || "", record: false, base: ctx });
  return <View id={pane.view} ctx={sub} span={pane.span} />;
}

export function WorkspaceTab({ ctx, store, saveStore, useIntelContext }) {
  const saved = store.workspaces || [];
  const [active, setActive] = useState(() => {
    if (typeof window !== "undefined") {
      const m = /[#&]layout=([A-Za-z0-9_-]+)/.exec(window.location.hash);
      const w = m && decodeLayout(m[1]);
      if (w) return w;
    }
    return saved[0] || PRESETS[0];
  });
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);
  const ws = active;
  const update = patch => setActive(w => sanitizeWorkspace({ ...w, ...patch }) || w);
  const movePane = (i, d) => { const p = [...ws.panes]; const j = i + d; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; update({ panes: p }); };
  const setPane = (i, patch) => update({ panes: ws.panes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const isPreset = PRESETS.some(p => p.id === ws.id);

  const saveCurrent = () => {
    const w = sanitizeWorkspace({ ...ws, id: isPreset || ws.id.startsWith("shared-") ? "ws-" + Date.now().toString(36) : ws.id, name: ws.name.replace(/ \(copy\)$/, "") + (isPreset ? " (copy)" : "") });
    if (!w) return;
    const list = [w, ...saved.filter(x => x.id !== w.id)].slice(0, 20);
    saveStore({ workspaces: list });
    setActive(w);
    setMsg(store.cloud === "unavailable" ? "Saved in this browser (cloud storage unavailable)." : "Saved to your account.");
  };
  const remove = id => { saveStore({ workspaces: saved.filter(x => x.id !== id) }); if (ws.id === id) setActive(PRESETS[0]); };
  const share = async () => {
    const code = encodeLayout(ws);
    if (!code) return;
    const url = `${window.location.origin}${window.location.pathname}#layout=${code}`;
    try { await navigator.clipboard.writeText(url); setMsg("Layout link copied. It contains layout configuration only — no data, account or credentials."); }
    catch { setMsg(url); }
  };
  const exportFile = () => {
    const w = sanitizeWorkspace(ws);
    const blob = new Blob([JSON.stringify({ format: "ahq-options-layout/1", name: w.name, cols: w.cols, panes: w.panes }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (w.name || "workspace").replace(/[^a-z0-9-]+/gi, "-") + ".ahq-layout.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importFile = async e => {
    const f = e.target.files?.[0]; if (!f || f.size > 64 * 1024) return setMsg("File too large or missing.");
    try { const w = sanitizeWorkspace({ ...JSON.parse(await f.text()), id: "shared-" + Date.now().toString(36) }); if (w) { setActive(w); setMsg("Layout imported. Save it to keep it."); } else setMsg("Not a valid layout file."); }
    catch { setMsg("Not a valid layout file."); }
  };

  return (
    <div>
      <div className="oi-panel" style={{ marginBottom: 10 }}><div className="oi-pbody">
        <div className="oi-row" style={{ justifyContent: "space-between" }}>
          <div className="oi-row">
            <span className="oi-kicker">PRESETS</span>
            {PRESETS.map(p => <button key={p.id} className="oi-chip" aria-pressed={ws.id === p.id} onClick={() => setActive(p)}>{p.name}</button>)}
          </div>
          <div className="oi-row">
            <span className="oi-kicker">SAVED · {store.cloud === "synced" ? "CLOUD" : store.cloud === "loading" ? "…" : "THIS BROWSER"}</span>
            {!saved.length && <span className="oi-muted" style={{ fontSize: 11 }}>None yet</span>}
            {saved.map(w => <span key={w.id} className="oi-row" style={{ gap: 2 }}><button className="oi-chip" aria-pressed={ws.id === w.id} onClick={() => setActive(w)}>{w.name}</button><button className="oi-chip" title="Delete saved layout" onClick={() => remove(w.id)}>×</button></span>)}
          </div>
        </div>
        <div className="oi-row" style={{ marginTop: 10 }}>
          <input value={ws.name} onChange={e => update({ name: e.target.value })} aria-label="Workspace name" style={{ width: 220 }} />
          <label className="oi-muted" style={{ fontSize: 11 }}>Columns <select value={ws.cols} onChange={e => update({ cols: Number(e.target.value) })}>{[1, 2, 3, 4].map(c => <option key={c}>{c}</option>)}</select></label>
          <select value="" onChange={e => e.target.value && update({ panes: [...ws.panes, { view: e.target.value }] })} aria-label="Add pane">
            <option value="">+ Add pane…</option>{VIEW_IDS.map(id => <option key={id} value={id}>{VIEWS[id]?.title || id}{PLAN_PRO_VIEWS.has(id) ? " (PRO)" : ""}</option>)}
          </select>
          <button className="oi-btn" onClick={saveCurrent}>Save to my workspaces</button>
          <button className="oi-btn" onClick={share}>Copy share link</button>
          <button className="oi-btn" onClick={exportFile}>Export file</button>
          <button className="oi-btn" onClick={() => fileRef.current?.click()}>Import file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importFile} />
        </div>
        {msg && <p className="oi-note" role="status">{msg}</p>}
      </div></div>
      <div className="oi-grid" style={{ "--cols": ws.cols }}>
        {ws.panes.map((p, i) => (
          <div key={i} style={{ gridColumn: `span ${Math.min(p.span || 1, ws.cols)}`, minWidth: 0 }}>
            <div className="oi-pane-tools" style={{ marginBottom: 4 }}>
              <button onClick={() => movePane(i, -1)} title="Move left/up">←</button>
              <button onClick={() => movePane(i, 1)} title="Move right/down">→</button>
              <button onClick={() => setPane(i, { span: p.span === 2 ? 1 : 2 })} title="Resize">{p.span === 2 ? "Narrow" : "Wide"}</button>
              <select value={p.view} onChange={e => setPane(i, { view: e.target.value })} aria-label="Pane view" style={{ fontSize: 10, padding: "1px 4px" }}>{VIEW_IDS.map(id => <option key={id} value={id}>{VIEWS[id]?.title || id}</option>)}</select>
              <select value={p.symbol || ""} onChange={e => setPane(i, { symbol: e.target.value || undefined })} aria-label="Pane underlying" style={{ fontSize: 10, padding: "1px 4px" }}>
                <option value="">Follow {ctx.symbol}</option>{["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => update({ panes: ws.panes.filter((_, k) => k !== i) })} title="Remove pane">Remove</button>
            </div>
            {p.symbol && p.symbol !== ctx.symbol ? <OverridePane pane={p} ctx={ctx} useIntelContext={useIntelContext} /> : <View id={p.view} ctx={ctx} />}
          </div>
        ))}
        {!ws.panes.length && <Panel title="Empty workspace"><p className="oi-note">Add a pane to begin.</p></Panel>}
      </div>
    </div>
  );
}

export function AppearancePanel({ prefs, onChange }) {
  const p = { theme: "terminal", palette: "classic", text: "m", heat: 0.75, pin: "#5ba6db", ...prefs };
  return (
    <Panel title="Personal appearance" detail="Saved with your account">
      <div className="oi-row">
        <label className="oi-muted">Theme <select value={p.theme} onChange={e => onChange({ ...p, theme: e.target.value })}><option value="terminal">Terminal black</option><option value="contrast">High contrast</option></select></label>
        <label className="oi-muted">Chart palette <select value={p.palette} onChange={e => onChange({ ...p, palette: e.target.value })}><option value="classic">Green / red</option><option value="colorblind">Colour-blind safe</option><option value="mono">Monochrome</option></select></label>
        <label className="oi-muted">Text <select value={p.text} onChange={e => onChange({ ...p, text: e.target.value })}><option value="s">Small</option><option value="m">Medium</option><option value="l">Large</option></select></label>
        <label className="oi-muted">Heatmap <input type="range" min="0.2" max="1" step="0.05" value={p.heat} onChange={e => onChange({ ...p, heat: Number(e.target.value) })} /></label>
        <label className="oi-muted">Pin colour <input type="color" value={p.pin} onChange={e => onChange({ ...p, pin: e.target.value })} style={{ width: 40, padding: 0 }} /></label>
      </div>
    </Panel>
  );
}

export function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return commands.filter(c => !t || (c.label + " " + (c.group || "")).toLowerCase().includes(t)).slice(0, 40);
  }, [q, commands]);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
  useEffect(() => { setSel(0); }, [q]);
  if (!open) return null;
  const run = c => { c?.run(); onClose(); };
  return (
    <div className="oi-palette-backdrop" onMouseDown={onClose}>
      <div className="oi-palette" role="dialog" aria-label="Quick switcher" onMouseDown={e => e.stopPropagation()}>
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a view, index, expiry, workspace or action…"
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(list.length - 1, s + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
            else if (e.key === "Enter") { e.preventDefault(); run(list[sel]); }
            else if (e.key === "Escape") onClose();
          }} />
        <ul role="listbox">{list.map((c, i) => <li key={c.id} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => run(c)}><span>{c.label}</span><small>{c.group}</small></li>)}
          {!list.length && <li><span>No match</span></li>}</ul>
      </div>
    </div>
  );
}
