"use client";
// Data hooks for Options Intelligence. All market data comes from the existing same-origin
// gateway (/api/market/option-chain/:symbol → Render → Upstox). Nothing here fabricates values.
import { useCallback, useEffect, useRef, useState } from "react";
import { contractsFromChain, snapshotFromChain, isSession, istParts, realizedVolFromBars } from "@/lib/optionsIntel.mjs";
import { US_UNIVERSE } from "@/lib/usOptionsProvider.mjs";
export { US_UNIVERSE };

export const INDEX_UNIVERSE = [
  { id: "NIFTY", label: "NIFTY 50", indexKey: "NIFTY50" },
  { id: "BANKNIFTY", label: "BANK NIFTY", indexKey: "BANKNIFTY" },
  { id: "FINNIFTY", label: "FIN NIFTY" },
  { id: "MIDCPNIFTY", label: "MIDCAP NIFTY" },
  { id: "SENSEX", label: "SENSEX (BSE)" },
];

export const chainUrl = (market, symbol, expiry) =>
  `${market === "US" ? "/api/options/us-chain/" : "/api/market/option-chain/"}${encodeURIComponent(symbol)}${expiry ? `?expiry=${encodeURIComponent(expiry)}` : ""}`;

async function fetchChain(symbol, expiry, signal, market = "IN") {
  const url = chainUrl(market, symbol, expiry);
  const r = await fetch(url, { cache: "no-store", signal });
  let j = null;
  try { j = await r.json(); } catch { throw new Error(`Market-data gateway returned a non-JSON response (HTTP ${r.status}).`); }
  if (r.status === 401 || /token|unauthori[sz]ed/i.test(String(j?.error || ""))) {
    const e = new Error("Upstox session expired at the backend. Reconnect Upstox to restore option data."); e.code = "AUTH"; throw e;
  }
  if (!r.ok || !j?.success || !j?.data?.strikes?.length) {
    const e = new Error(j?.error || `No verified option chain (HTTP ${r.status}).`);
    e.code = j?.code === "US_OPTIONS_NOT_CONNECTED" ? "NOT_CONNECTED" : r.status === 404 ? "NOT_LISTED" : "UNAVAILABLE"; throw e;
  }
  if (market === "US") j.data.market = "US";
  return j;
}

/** Live chain for one symbol/expiry. Polls only during the regular NSE session. */
export function useChain(symbol, expiry, { pollMs = 15000, enabled = true, market = "IN" } = {}) {
  const [state, setState] = useState({ status: "loading", parsed: null, raw: null, error: "", fetchedAt: null });
  const reqRef = useRef(0);
  const load = useCallback(async (soft = false) => {
    if (!symbol || !enabled) return;
    const id = ++reqRef.current;
    if (!soft) setState(s => ({ ...s, status: "loading", error: "" }));
    try {
      const j = await fetchChain(symbol, expiry, undefined, market);
      if (id !== reqRef.current) return;
      setState({ status: "live", parsed: contractsFromChain(j), raw: j.data, error: "", fetchedAt: Date.now() });
    } catch (e) {
      if (id !== reqRef.current) return;
      setState(s => ({ ...s, status: e.code === "AUTH" ? "expired" : e.code === "NOT_LISTED" ? "notListed" : e.code === "NOT_CONNECTED" ? "notConnected" : "error",
        error: e.message, parsed: soft ? s.parsed : null, raw: soft ? s.raw : null }));
    }
  }, [symbol, expiry, enabled, market]);
  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => { if (!document.hidden && isSession(market)) load(true); }, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs, enabled, market]);
  return { ...state, reload: () => load(true) };
}

/** Several expiries for the surface / term structure / every-strike grid. Loaded on demand. */
export function useMultiExpiry(symbol, expiries, { count = 6, enabled = false, market = "IN" } = {}) {
  const [state, setState] = useState({ status: "idle", chains: [], failed: [], fetchedAt: null });
  const key = (expiries || []).slice(0, count).join(",");
  const load = useCallback(async () => {
    const list = key ? key.split(",") : [];
    if (!enabled || !symbol || !list.length) return;
    setState(s => ({ ...s, status: "loading" }));
    const chains = [], failed = [];
    // Sequential in pairs to respect upstream rate limits.
    for (let i = 0; i < list.length; i += 2) {
      const part = await Promise.allSettled(list.slice(i, i + 2).map(e => fetchChain(symbol, e, undefined, market)));
      part.forEach((p, k) => p.status === "fulfilled" ? chains.push(contractsFromChain(p.value)) : failed.push(list[i + k]));
    }
    setState({ status: chains.length ? "ready" : "error", chains, failed, fetchedAt: Date.now() });
  }, [symbol, key, enabled, market]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => { if (!document.hidden && isSession(market)) load(); }, 60000);
    return () => clearInterval(t);
  }, [load, enabled]);
  return { ...state, reload: load };
}

// ---------- browser snapshot store (IndexedDB) ----------
const DB = "ahq-options-intel", STORE = "snapshots";
function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: "id" });
      s.createIndex("series", "series");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const out = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(out?.result ?? out);
    tx.onerror = () => reject(tx.error);
  });
}
export const seriesKey = (symbol, expiry, day) => `${symbol}|${expiry}|${day}`;

export async function listSeriesDays(symbol) {
  try {
    const keys = await idb("readonly", s => s.getAllKeys());
    const days = new Set();
    for (const k of keys || []) { const [sym, , day] = String(k).split("|"); if (sym === symbol) days.add(day); }
    return [...days].sort().reverse();
  } catch { return []; }
}
export async function loadSeries(symbol, expiry, day) {
  try {
    const rows = await idb("readonly", s => s.index("series").getAll(seriesKey(symbol, expiry, day)));
    return (rows || []).map(r => r.snap).sort((a, b) => a.t - b.t);
  } catch { return []; }
}
/** All stored sessions for a symbol (excluding one day), grouped by day and expiry. */
export async function loadSymbolHistory(symbol, excludeDay) {
  try {
    const all = await idb("readonly", s => s.getAll());
    const days = new Map();
    for (const r of all || []) {
      const [sym, expiry, day] = String(r.series).split("|");
      if (sym !== symbol || day === excludeDay) continue;
      if (!days.has(day)) days.set(day, new Map());
      const m = days.get(day);
      if (!m.has(expiry)) m.set(expiry, []);
      m.get(expiry).push(r.snap);
    }
    return [...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, m]) => ({
      day, series: [...m.entries()].map(([expiry, snaps]) => ({ expiry, snaps: snaps.sort((a, b) => a.t - b.t) })).filter(s => s.snaps.length > 1),
    }));
  } catch { return []; }
}
/** Stored expiries for a symbol on a day (for replaying earlier sessions). */
export async function listExpiriesForDay(symbol, day) {
  try {
    const keys = await idb("readonly", s => s.getAllKeys());
    return [...new Set((keys || []).map(String).filter(k => k.startsWith(symbol + "|") && k.split("|")[2] === day).map(k => k.split("|")[1]))].sort();
  } catch { return []; }
}

async function pruneOld(keepDays = 10) {
  try {
    const keys = await idb("readonly", s => s.getAllKeys());
    const days = [...new Set((keys || []).map(k => String(k).split("|")[2]))].sort().reverse();
    const drop = new Set(days.slice(keepDays));
    if (!drop.size) return;
    await idb("readwrite", s => { for (const k of keys) if (drop.has(String(k).split("|")[2])) s.delete(k); });
  } catch { /* best effort */ }
}

/** Records at most one snapshot per minute per symbol/expiry while the page is open in-session. */
export function useSnapshotRecorder(symbol, expiry, parsed, market = "IN") {
  const [snaps, setSnaps] = useState([]);
  const [day, setDay] = useState(() => istParts().day);
  const lastMinute = useRef(null);
  useEffect(() => {
    let live = true;
    const d = istParts().day; setDay(d);
    if (!symbol || !expiry) { setSnaps([]); return; }
    loadSeries(symbol, expiry, d).then(rows => { if (live) setSnaps(rows); });
    pruneOld();
    return () => { live = false; };
  }, [symbol, expiry]);
  useEffect(() => {
    if (!parsed?.contracts?.length || parsed.expiry !== expiry || !isSession(market)) return;
    const snap = snapshotFromChain(parsed, Date.now());
    const minute = Math.floor(snap.t / 60000);
    if (lastMinute.current === `${symbol}|${expiry}|${minute}`) return;
    lastMinute.current = `${symbol}|${expiry}|${minute}`;
    const d = istParts(snap.t).day;
    const series = seriesKey(symbol, expiry, d);
    idb("readwrite", s => s.put({ id: `${series}|${minute}`, series, snap })).catch(() => {});
    setSnaps(prev => [...prev.filter(p => Math.floor(p.t / 60000) !== minute), snap].sort((a, b) => a.t - b.t));
  }, [parsed, symbol, expiry]);
  return { snaps, day };
}

/** Realised volatility from the existing 5-minute history endpoint (stocks; indices may be unavailable). */
export function useRealizedVol(symbol, market = "IN") {
  const [rv, setRv] = useState({ status: "loading" });
  useEffect(() => {
    let live = true;
    if (market === "US") { setRv({ status: "unavailable", error: "US daily history not connected" }); return; }
    setRv({ status: "loading" });
    fetch(`/api/terminal?view=history&symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!live) return;
        if (!ok || !j.success || !Array.isArray(j.data)) return setRv({ status: "unavailable", error: j?.error || "No history" });
        setRv({ status: "ready", ...realizedVolFromBars(j.data), source: "AHQ 5-minute history (" + j.data.length + " bars)" });
      })
      .catch(() => live && setRv({ status: "unavailable", error: "History request failed" }));
    return () => { live = false; };
  }, [symbol, market]);
  return rv;
}

/** Index levels and moves from the existing indices endpoints (India: /indices, US: /us-indices). */
export function useIndexLevels(market = "IN") {
  const [state, setState] = useState({ data: null, fetchedAt: null, stale: null });
  useEffect(() => {
    let live = true;
    setState({ data: null, fetchedAt: null, stale: null });
    const load = () => fetch(market === "US" ? "/api/market/us-indices" : "/api/market/indices", { cache: "no-store" }).then(r => r.json())
      .then(j => live && j?.success && setState({ data: j.data, fetchedAt: j.fetchedAt || new Date().toISOString(), stale: !!j.stale }))
      .catch(() => {});
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { live = false; clearInterval(t); };
  }, [market]);
  return state;
}

/** Cloud workspace / preferences with a local fallback when signed-out storage is unavailable. */
const LOCAL = "ahq-options-intel-v1";
export function useWorkspaceStore() {
  const [store, setStore] = useState({ workspaces: [], prefs: {}, lastVisit: {}, plan: "pro", cloud: "loading" });
  useEffect(() => {
    let local = {};
    try { local = JSON.parse(localStorage.getItem(LOCAL) || "{}"); } catch {}
    setStore(s => ({ ...s, ...local, cloud: "loading" }));
    fetch("/api/options/workspace", { cache: "no-store" }).then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok || !j.ok) return setStore(s => ({ ...s, cloud: "unavailable" }));
        setStore(s => ({ ...s, workspaces: j.workspaces?.length ? j.workspaces : s.workspaces,
          prefs: { ...s.prefs, ...(j.prefs || {}) }, lastVisit: { ...s.lastVisit, ...(j.lastVisit || {}) }, plan: j.plan || "pro", cloud: "synced" }));
      }).catch(() => setStore(s => ({ ...s, cloud: "unavailable" })));
  }, []);
  const ref = useRef(store);
  ref.current = store;
  const save = useCallback(async patch => {
    const next = { ...ref.current, ...patch };
    ref.current = next;
    setStore(next);
    try { localStorage.setItem(LOCAL, JSON.stringify({ workspaces: next.workspaces, prefs: next.prefs, lastVisit: next.lastVisit })); } catch {}
    try {
      const r = await fetch("/api/options/workspace", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaces: next.workspaces, prefs: next.prefs, lastVisit: next.lastVisit }) });
      setStore(s => ({ ...s, cloud: r.ok ? "synced" : "unavailable" }));
    } catch { setStore(s => ({ ...s, cloud: "unavailable" })); }
  }, []);
  return [store, save];
}
