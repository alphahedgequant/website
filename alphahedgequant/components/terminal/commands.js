// AHQ Terminal command registry. Each command opens a pane. `ticker: true` panes follow the
// linked ticker unless pinned. Only commands backed by a real AHQ data source are listed.

export const COMMANDS = [
  // Start here
  { code: "DES", title: "Company overview", group: "Start here", ticker: true, desc: "Quote, ranges, returns, fundamentals, signal and profile" },
  { code: "GP", title: "Chart", group: "Start here", ticker: true, desc: "Candles with volume, 5m / 15m / 1h / 1D, moving averages" },
  { code: "MOST", title: "Market movers", group: "Start here", desc: "NSE gainers, losers and most traded by value" },
  { code: "WEI", title: "World indices", group: "Start here", desc: "India and US index levels available to AHQ" },
  { code: "OPX", title: "Options analytics", group: "Start here", ticker: true, desc: "Plain-language options story: levels, positioning, decay, gamma" },
  // Company
  { code: "FA", title: "Financials", group: "Company", ticker: true, desc: "Revenue and profit history, audited facts and research" },
  { code: "ANR", title: "Analysts", group: "Company", ticker: true, desc: "Brokerage calls tracked by AHQ and consensus target" },
  { code: "FCST", title: "Forecast & valuation", group: "Company", ticker: true, desc: "Driver-based valuation model" },
  { code: "PEER", title: "Peers", group: "Company", ticker: true, desc: "Peer comparison" },
  { code: "NET", title: "Company network", group: "Company", ticker: true, desc: "Disclosed customers, suppliers and related companies" },
  { code: "NOTE", title: "Notes", group: "Company", ticker: true, desc: "Your private notes for this ticker (this browser)" },
  // Trading
  { code: "L2", title: "Market depth", group: "Trading", ticker: true, desc: "Top-5 bid/ask ladder, spread and displayed imbalance" },
  { code: "VOL", title: "Volume vs normal", group: "Trading", ticker: true, desc: "Today's volume against the same time in past sessions (RVOL)" },
  { code: "RISK", title: "Risk & backtest", group: "Trading", ticker: true, desc: "Historical risk metrics and the strategy backtester" },
  { code: "FLOOR", title: "Trading floor", group: "Trading", ticker: true, desc: "The 12-window floor: watchlist, depth, RVOL, Greeks, chart, alerts, movers and flow" },
  { code: "SCAN", title: "Signal scanner", group: "Trading", desc: "Quant signal scan across the NSE universe" },
  // Derivatives
  { code: "OMON", title: "Option chain & builder", group: "Derivatives", ticker: true, desc: "Full option chain, strategy builder and unusual movements" },
  { code: "GEX", title: "Gamma & levels", group: "Derivatives", ticker: true, desc: "Gamma exposure, flip, walls and pin (opens Options analytics)" },
  { code: "FLOW", title: "Options flow", group: "Derivatives", desc: "Unusual option activity and the daily NSE F&O archive" },
  // Markets
  { code: "BI", title: "Sector performance", group: "Markets", desc: "Equal-weight sector moves (provider-classified stocks only)" },
  { code: "BRDT", title: "Market breadth", group: "Markets", desc: "Advancers, decliners and sector dispersion" },
  { code: "USMV", title: "US movers", group: "Markets", desc: "US gainers, losers and most active (delayed)" },
  { code: "IPO", title: "IPO calendar", group: "Markets", desc: "Indian IPOs: open, upcoming, listed and GMP" },
  // Help
  { code: "HELP", title: "Help & shortcuts", group: "Help", desc: "Every command and keyboard shortcut" },
];
export const BY_CODE = Object.fromEntries(COMMANDS.map(c => [c.code, c]));

/** Ticker sections shown inside the company pane (like a security's tabs). */
export const TICKER_SECTIONS = [
  ["DES", "Overview"], ["GP", "Chart"], ["FA", "Financials"], ["ANR", "Analysts"], ["OPX", "Options"],
  ["L2", "Depth"], ["VOL", "Volume"], ["FCST", "Forecast"], ["PEER", "Peers"], ["NET", "Network"], ["RISK", "Risk"], ["NOTE", "Notes"],
];

let seq = 0;
export const paneId = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;
const P = (code, extra = {}) => ({ id: paneId(), code, linked: true, ...extra });

export function defaultWorkspaces() {
  return [
    { id: "research", name: "Research", key: "1", tiles: [
      { panes: [P("DES", { section: "DES" })], active: 0, size: 3 },
      { panes: [P("GP"), P("ANR"), P("VOL")], active: 0, size: 2 },
    ] },
    { id: "monitor", name: "Monitor", key: "2", tiles: [
      { panes: [P("MOST"), P("SCAN")], active: 0, size: 3 },
      { panes: [P("WEI"), P("BI"), P("BRDT")], active: 0, size: 2 },
    ] },
    { id: "derivatives", name: "Derivatives", key: "3", tiles: [
      { panes: [P("OPX"), P("OMON")], active: 0, size: 3 },
      { panes: [P("FLOW")], active: 0, size: 2 },
    ] },
    { id: "markets", name: "Markets", key: "4", tiles: [
      { panes: [P("WEI"), P("USMV")], active: 0, size: 1 },
      { panes: [P("BI"), P("IPO")], active: 0, size: 1 },
    ] },
    { id: "floor", name: "Floor", key: "5", tiles: [
      { panes: [P("FLOOR")], active: 0, size: 1 },
    ] },
  ];
}

/** "RELIANCE GP", "gp reliance", "INFY" → { ticker, code } */
export function parseCommand(input) {
  const tokens = String(input || "").trim().toUpperCase().split(/\s+/).filter(Boolean);
  let code = null, ticker = null;
  for (const t of tokens) { if (BY_CODE[t] && !code) code = t; else if (/^[A-Z0-9&_.-]{1,40}$/.test(t) && !ticker) ticker = t; }
  return { code, ticker };
}

// Layout persistence: layout only (pane codes, order, sizes). Never data.
const KEY = "ahq-terminal-layout-v1";
export function loadLayout() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!j || !Array.isArray(j.workspaces)) return null;
    const ok = j.workspaces.every(w => Array.isArray(w.tiles) && w.tiles.every(t => Array.isArray(t.panes) && t.panes.every(p => BY_CODE[p.code])));
    return ok ? j : null;
  } catch { return null; }
}
export function saveLayout(state) {
  try { localStorage.setItem(KEY, JSON.stringify({ workspaces: state.workspaces, active: state.active })); } catch { /* ignore */ }
}
export function clearLayout() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
