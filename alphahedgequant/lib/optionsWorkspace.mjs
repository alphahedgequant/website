// Layout-only workspace schema shared by the browser (import/share) and the server (cloud save).
// A workspace NEVER contains market data, credentials, account details or private saved data.

export const VIEW_IDS = [
  "story", "range-map", "gamma-blast", "decay-watch", "imbalance",
  "overview-cards", "market-strip", "gex-strike", "gex-profile", "key-levels", "pin-pressure", "hhi", "hedge-ladder",
  "gamma-decay", "dex-strike", "dex-flow", "charm", "vanna", "oi-change", "oi-rotation", "builds-unwinds",
  "aggressor", "unusual-volume", "futures-buildup", "iv-smile", "term-structure", "iv-surface", "straddle-decay",
  "atm-iv-rv", "chain-grid", "oi-tape", "since-last-visit",
];
export const PLAN_PRO_VIEWS = new Set(["gamma-blast", "pin-pressure", "hhi", "hedge-ladder", "gamma-decay", "dex-strike", "dex-flow",
  "charm", "vanna", "aggressor", "unusual-volume", "straddle-decay", "iv-surface"]);

const SYMBOL = /^[A-Z0-9&._-]{1,40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (s, n) => String(s ?? "").replace(/[<>]/g, "").slice(0, n);

export function sanitizePane(p) {
  if (!p || !VIEW_IDS.includes(p.view)) return null;
  const out = { view: p.view, span: p.span === 2 ? 2 : 1 };
  if (p.symbol && SYMBOL.test(String(p.symbol))) out.symbol = String(p.symbol);
  if (p.expiry && DATE.test(String(p.expiry))) out.expiry = String(p.expiry);
  return out;
}
export function sanitizeWorkspace(w) {
  if (!w || typeof w !== "object") return null;
  const panes = (Array.isArray(w.panes) ? w.panes : []).slice(0, 12).map(sanitizePane).filter(Boolean);
  if (!panes.length) return null;
  return {
    id: clean(w.id || "ws-" + Date.now().toString(36), 40),
    name: clean(w.name || "Workspace", 60) || "Workspace",
    cols: [1, 2, 3, 4].includes(Number(w.cols)) ? Number(w.cols) : 2,
    panes,
  };
}
const PREF_KEYS = { theme: ["terminal", "contrast"], palette: ["classic", "colorblind", "mono"], text: ["s", "m", "l"] };
export function sanitizePrefs(p) {
  const out = {};
  for (const [k, allowed] of Object.entries(PREF_KEYS)) if (allowed.includes(p?.[k])) out[k] = p[k];
  const h = Number(p?.heat);
  if (Number.isFinite(h)) out.heat = Math.max(0.2, Math.min(1, h));
  if (/^#[0-9a-fA-F]{6}$/.test(String(p?.pin || ""))) out.pin = p.pin;
  return out;
}
export function sanitizeLastVisit(v) {
  const out = {};
  for (const [sym, rec] of Object.entries(v || {}).slice(0, 20)) {
    if (!SYMBOL.test(sym)) continue;
    const t = Number(rec?.t), g = Number(rec?.netGex);
    if (Number.isFinite(t) && Number.isFinite(g)) out[sym] = { t, netGex: g, expiry: DATE.test(String(rec?.expiry)) ? rec.expiry : null };
  }
  return out;
}

/** Layout share code (URL-safe base64 of the sanitised layout). */
export function encodeLayout(w) {
  const s = sanitizeWorkspace(w);
  if (!s) return null;
  const json = JSON.stringify({ name: s.name, cols: s.cols, panes: s.panes });
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeLayout(code) {
  try {
    const b64 = String(code).replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, "base64").toString("utf8");
    return sanitizeWorkspace({ ...JSON.parse(json), id: "shared-" + Date.now().toString(36) });
  } catch { return null; }
}

export const PRESETS = [
  { id: "preset-expiry", name: "Expiry day", cols: 3, panes: [
    { view: "range-map", span: 2 }, { view: "gamma-blast" }, { view: "decay-watch" }, { view: "pin-pressure" }, { view: "builds-unwinds" },
    { view: "gex-strike", span: 2 }, { view: "imbalance" }] },
  { id: "preset-scalp", name: "Intraday scalping", cols: 3, panes: [
    { view: "range-map", span: 3 }, { view: "builds-unwinds" }, { view: "imbalance" }, { view: "aggressor" }, { view: "oi-rotation", span: 2 }, { view: "oi-tape" }] },
  { id: "preset-swing", name: "Swing positioning", cols: 2, panes: [
    { view: "range-map", span: 2 }, { view: "oi-change", span: 2 }, { view: "term-structure" }, { view: "iv-smile" }, { view: "dex-strike" }, { view: "gex-profile" }] },
  { id: "preset-review", name: "Post-market review", cols: 2, panes: [
    { view: "story", span: 2 }, { view: "since-last-visit" }, { view: "oi-rotation" }, { view: "decay-watch" }, { view: "hhi" }] },
  { id: "preset-compare", name: "Compare NIFTY vs BANKNIFTY", cols: 2, panes: [
    { view: "range-map", symbol: "NIFTY" }, { view: "range-map", symbol: "BANKNIFTY" },
    { view: "key-levels", symbol: "NIFTY" }, { view: "key-levels", symbol: "BANKNIFTY" },
    { view: "gex-strike", symbol: "NIFTY" }, { view: "gex-strike", symbol: "BANKNIFTY" }] },
];
