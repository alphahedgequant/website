"use client";
// Data hooks for the AHQ Terminal. Every request goes to existing same-origin AHQ routes.
// Responses are cached per URL for a short time so several linked panes share one request.
import { useCallback, useEffect, useRef, useState } from "react";
import { normaliseBars, nseStatus } from "@/lib/terminalData.mjs";

const cache = new Map(); // url -> { at, data, promise } — `promise` is the one inflight request per URL

async function getJson(url, { maxAgeMs = 30000, force = false } = {}) {
  const hit = cache.get(url);
  if (!force && hit?.data && Date.now() - hit.at < maxAgeMs) return hit.data;
  if (!force && hit?.promise) return hit.promise;
  const promise = (async () => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        let j = null;
        try { j = await r.json(); } catch { j = null; }
        if ([502, 503, 504].includes(r.status) && attempt < 2) { await new Promise(res => setTimeout(res, [4000, 9000][attempt])); continue; }
        if (!r.ok || j == null || j.success === false || j.ok === false) {
          const e = new Error(j?.error || `HTTP ${r.status}`); e.status = r.status; e.code = j?.code; throw e;
        }
        cache.set(url, { at: Date.now(), data: j });
        return j;
      } catch (e) {
        lastErr = e;
        if (e.status && ![502, 503, 504].includes(e.status)) break;
        if (attempt < 2) await new Promise(res => setTimeout(res, [4000, 9000][attempt]));
      }
    }
    cache.delete(url);
    throw lastErr;
  })();
  cache.set(url, { ...(hit || {}), promise });
  return promise;
}

/** Generic JSON resource with optional refresh while the NSE session is open. */
export function useResource(url, { maxAgeMs = 30000, refreshMs = 0, sessionOnly = true, enabled = true } = {}) {
  const [state, setState] = useState({ status: url && enabled ? "loading" : "idle", data: null, error: "", at: null });
  // `current` holds the URL this hook shows now. A late response for an older URL (e.g. the
  // previous ticker) is dropped, so it can never overwrite the newer ticker's data.
  const current = useRef(url);
  current.current = enabled ? url : null;
  const load = useCallback(async (force = false) => {
    if (!url || !enabled) return;
    const live = () => current.current === url;
    try {
      const data = await getJson(url, { maxAgeMs, force });
      if (live()) setState({ status: "ready", data, error: "", at: cache.get(url)?.at || Date.now() });
    } catch (e) {
      if (live()) setState(s => ({ ...s, status: s.data ? "ready" : "error", error: e.code === "UPSTOX_AUTH_EXPIRED" || e.status === 401 ? "Upstox session expired — reconnect the data provider." : e.message || "Unavailable" }));
    }
  }, [url, maxAgeMs, enabled]);
  useEffect(() => {
    setState({ status: url && enabled ? "loading" : "idle", data: null, error: "", at: null });
    load();
    return () => { if (current.current === url) current.current = null; };
  }, [url, enabled]); // eslint-disable-line
  useEffect(() => {
    if (!refreshMs || !enabled) return;
    const t = setInterval(() => { if (!document.hidden && (!sessionOnly || nseStatus().open)) load(true); }, refreshMs);
    return () => clearInterval(t);
  }, [refreshMs, sessionOnly, enabled, load]);
  return { ...state, reload: () => load(true) };
}

export const useQuote = (symbol, opts = {}) =>
  useResource(symbol ? `/api/terminal?view=quote&symbol=${encodeURIComponent(symbol)}` : null, { maxAgeMs: 5000, refreshMs: 5000, ...opts });

export function useHistory(symbol) {
  const r = useResource(symbol ? `/api/terminal?view=history&symbol=${encodeURIComponent(symbol)}` : null, { maxAgeMs: 120000, refreshMs: 60000 });
  const [bars, setBars] = useState([]);
  useEffect(() => { setBars(Array.isArray(r.data?.data) ? normaliseBars(r.data.data) : []); }, [r.data]);
  return { ...r, bars, interval: r.data?.interval || null };
}

export const useCompany = symbol =>
  useResource(symbol ? `/api/terminal/company?symbol=${encodeURIComponent(symbol)}` : null, { maxAgeMs: 900000 });
export const useScreener = () => useResource("/api/market/screener", { maxAgeMs: 60000, refreshMs: 60000 });
export const useUsScreener = () => useResource("/api/market/us-screener", { maxAgeMs: 120000, refreshMs: 120000, sessionOnly: false });
export const useIndices = () => useResource("/api/market/indices", { maxAgeMs: 30000, refreshMs: 30000 });
export const useUsIndices = () => useResource("/api/market/us-indices", { maxAgeMs: 120000, refreshMs: 120000, sessionOnly: false });
export const useSignals = () => useResource("/api/market/scanner/signals", { maxAgeMs: 300000 });
export const useFno = () => useResource("/api/terminal?view=fno", { maxAgeMs: 3600000 });
export const useIpo = () => useResource("/api/ipo", { maxAgeMs: 300000 });
export const useTrackerCalls = () => useResource("/api/tracker/calls", { maxAgeMs: 600000 });
export const useChain = (symbol, enabled = true) =>
  useResource(symbol && enabled ? `/api/market/option-chain/${encodeURIComponent(symbol)}` : null, { maxAgeMs: 15000, refreshMs: 15000 });

/** Debounced instrument search for the command bar. */
export function useSearch(q) {
  const [res, setRes] = useState([]);
  useEffect(() => {
    const term = String(q || "").trim();
    if (term.length < 2) { setRes([]); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/terminal?view=search&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const j = await r.json();
        if (j.success && Array.isArray(j.data)) setRes(j.data.slice(0, 8));
      } catch { /* ignore */ }
    }, 220);
    return () => { ctrl.abort(); clearTimeout(id); };
  }, [q]);
  return res;
}
