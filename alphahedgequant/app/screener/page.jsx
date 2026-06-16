"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/config";

// ── markets ─────────────────────────────────────────────
const MARKETS = {
  NSE: { scr: "/api/screener", idx: "/api/indices", cur: "₹", label: "NSE · India", delay: "live (Upstox) + Yahoo for extended names" },
  US: { scr: "/api/us-screener", idx: "/api/us-indices", cur: "$", label: "US · NYSE/NASDAQ", delay: "~15 min delayed (Yahoo)" },
};

// ── formatting ──────────────────────────────────────────
const fmt = (v, d = 2) => (v == null || isNaN(v) ? "-" : Number(v).toFixed(d));
const fmtCap = (v, market) => {A
  if (v == null) return "-";
  if (market === "US") {
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    return "$" + (v / 1e6).toFixed(0) + "M";
  }
  const cr = v / 1e7;
  if (cr >= 100000) return (cr / 100000).toFixed(2) + "L Cr";
  if (cr >= 1000) return (cr / 1000).toFixed(2) + "k Cr";
  return cr.toFixed(0) + " Cr";
};
const fmtVol = (v) => (v ? Number(v).toLocaleString("en-IN") : "-");
const pctCls = (v) => ((v ?? 0) > 0 ? "tick-up" : (v ?? 0) < 0 ? "tick-down" : "text-muted");

// ── filters (Finviz layout: label left, dropdown right) ─
const F = {
  descriptive: [
    ["sector", "Sector", ["Any"], (r, v) => r.sector === v],
    ["industry", "Industry", ["Any"], (r, v) => r.industry === v],
    ["marketCap", "Market Cap.", "__MC__", (r, v) => {
      if (v.includes("$")) {
        const b = (r.marketCap ?? 0) / 1e9;
        if (v.startsWith("Mega")) return b > 200;
        if (v.startsWith("Large")) return b >= 10 && b <= 200;
        if (v.startsWith("Mid")) return b >= 2 && b < 10;
        if (v.startsWith("Small")) return b > 0 && b < 2;
        return true;
      }
      const cr = (r.marketCap ?? 0) / 1e7;
      if (v.startsWith("Mega")) return cr > 500000;
      if (v.startsWith("Large")) return cr >= 100000 && cr <= 500000;
      if (v.startsWith("Mid")) return cr >= 20000 && cr < 100000;
      if (v.startsWith("Small")) return cr > 0 && cr < 20000;
      return true;
    }],
    ["dividend", "Dividend Yield", ["Any", "None (0%)", "Positive (>0%)", "Over 2%", "Over 4%"], (r, v) => {
      const d = r.dividend ?? 0;
      if (v.startsWith("None")) return !d;
      if (v.startsWith("Positive")) return d > 0;
      if (v === "Over 2%") return d > 2;
      if (v === "Over 4%") return d > 4;
      return true;
    }],
    ["price", "Price", "__PRICE__", (r, v) => {
      const p = r.price ?? 0;
      const n = v.match(/[\d.]+/g)?.map(Number) || [];
      if (v.startsWith("Under")) return p > 0 && p < n[0];
      if (v.startsWith("Over")) return p >= n[0];
      if (n.length === 2) return p >= n[0] && p < n[1];
      return true;
    }],
    ["volume", "Current Volume", ["Any", "Over 1M", "Over 5M", "Over 10M", "Over 50M"], (r, v) => {
      const m = { "Over 1M": 1e6, "Over 5M": 5e6, "Over 10M": 1e7, "Over 50M": 5e7 };
      return (r.volume ?? 0) > m[v];
    }],
    ["target", "Analyst Target", ["Any", "Above Price (upside)", "10%+ Upside", "Below Price"], (r, v) => {
      if (!r.targetPrice || !r.price) return false;
      const up = ((r.targetPrice - r.price) / r.price) * 100;
      if (v.startsWith("Above")) return up > 0;
      if (v.startsWith("10%")) return up > 10;
      if (v.startsWith("Below")) return up < 0;
      return true;
    }],
  ],
  fundamental: [
    ["pe", "P/E", ["Any", "Low (<15)", "Profitable (<25)", "High (>50)", "Negative/NA"], (r, v) => {
      if (v.startsWith("Low")) return r.pe > 0 && r.pe < 15;
      if (v.startsWith("Profitable")) return r.pe > 0 && r.pe < 25;
      if (v.startsWith("High")) return r.pe > 50;
      if (v.startsWith("Negative")) return r.pe == null || r.pe <= 0;
      return true;
    }],
    ["fwdPe", "Forward P/E", ["Any", "Low (<15)", "Under 25", "High (>40)"], (r, v) => {
      if (v.startsWith("Low")) return r.fwdPe > 0 && r.fwdPe < 15;
      if (v.startsWith("Under")) return r.fwdPe > 0 && r.fwdPe < 25;
      if (v.startsWith("High")) return r.fwdPe > 40;
      return true;
    }],
    ["peg", "PEG", ["Any", "Under 1", "Under 2", "Over 2"], (r, v) => {
      if (v === "Under 1") return r.peg > 0 && r.peg < 1;
      if (v === "Under 2") return r.peg > 0 && r.peg < 2;
      if (v === "Over 2") return r.peg > 2;
      return true;
    }],
    ["ps", "P/S", ["Any", "Under 2", "Under 5", "Over 10"], (r, v) => {
      if (v === "Under 2") return r.ps > 0 && r.ps < 2;
      if (v === "Under 5") return r.ps > 0 && r.ps < 5;
      if (v === "Over 10") return r.ps > 10;
      return true;
    }],
    ["pb", "P/B", ["Any", "Under 1", "Under 3", "Over 5"], (r, v) => {
      if (v === "Under 1") return r.pb > 0 && r.pb < 1;
      if (v === "Under 3") return r.pb > 0 && r.pb < 3;
      if (v === "Over 5") return r.pb > 5;
      return true;
    }],
    ["evEbitda", "EV/EBITDA", ["Any", "Under 10", "Under 15", "Over 20"], (r, v) => {
      if (v === "Under 10") return r.evEbitda > 0 && r.evEbitda < 10;
      if (v === "Under 15") return r.evEbitda > 0 && r.evEbitda < 15;
      if (v === "Over 20") return r.evEbitda > 20;
      return true;
    }],
    ["roe", "Return on Equity", ["Any", "Positive (>0%)", "Over 10%", "Over 20%", "Negative"], (r, v) => {
      if (v.startsWith("Positive")) return (r.roe ?? -1) > 0;
      if (v === "Over 10%") return (r.roe ?? -1) > 10;
      if (v === "Over 20%") return (r.roe ?? -1) > 20;
      if (v === "Negative") return r.roe != null && r.roe < 0;
      return true;
    }],
    ["roa", "Return on Assets", ["Any", "Positive (>0%)", "Over 5%", "Over 10%"], (r, v) => {
      if (v.startsWith("Positive")) return (r.roa ?? -1) > 0;
      if (v === "Over 5%") return (r.roa ?? -1) > 5;
      if (v === "Over 10%") return (r.roa ?? -1) > 10;
      return true;
    }],
    ["debtEquity", "LT Debt/Equity", ["Any", "Under 0.5", "Under 1", "Over 2"], (r, v) => {
      if (v === "Under 0.5") return r.debtEquity != null && r.debtEquity < 0.5;
      if (v === "Under 1") return r.debtEquity != null && r.debtEquity < 1;
      if (v === "Over 2") return (r.debtEquity ?? 0) > 2;
      return true;
    }],
    ["grossMargin", "Gross Margin", ["Any", "Positive", "Over 30%", "Over 50%"], (r, v) => {
      if (v === "Positive") return (r.grossMargin ?? -1) > 0;
      if (v === "Over 30%") return (r.grossMargin ?? -1) > 30;
      if (v === "Over 50%") return (r.grossMargin ?? -1) > 50;
      return true;
    }],
    ["operatingMargin", "Operating Margin", ["Any", "Positive", "Over 15%", "Over 25%", "Negative"], (r, v) => {
      if (v === "Positive") return (r.operatingMargin ?? -1) > 0;
      if (v === "Over 15%") return (r.operatingMargin ?? -1) > 15;
      if (v === "Over 25%") return (r.operatingMargin ?? -1) > 25;
      if (v === "Negative") return r.operatingMargin != null && r.operatingMargin < 0;
      return true;
    }],
    ["netMargin", "Net Profit Margin", ["Any", "Positive", "Over 10%", "Over 20%", "Negative"], (r, v) => {
      if (v === "Positive") return (r.netMargin ?? -1) > 0;
      if (v === "Over 10%") return (r.netMargin ?? -1) > 10;
      if (v === "Over 20%") return (r.netMargin ?? -1) > 20;
      if (v === "Negative") return r.netMargin != null && r.netMargin < 0;
      return true;
    }],
    ["revenueGrowth", "Sales Growth TTM", ["Any", "Positive", "Over 10%", "Over 25%", "Negative"], (r, v) => {
      if (v === "Positive") return (r.revenueGrowth ?? -1) > 0;
      if (v === "Over 10%") return (r.revenueGrowth ?? -1) > 10;
      if (v === "Over 25%") return (r.revenueGrowth ?? -1) > 25;
      if (v === "Negative") return r.revenueGrowth != null && r.revenueGrowth < 0;
      return true;
    }],
    ["earningsGrowth", "EPS Growth TTM", ["Any", "Positive", "Over 10%", "Over 25%", "Negative"], (r, v) => {
      if (v === "Positive") return (r.earningsGrowth ?? -1) > 0;
      if (v === "Over 10%") return (r.earningsGrowth ?? -1) > 10;
      if (v === "Over 25%") return (r.earningsGrowth ?? -1) > 25;
      if (v === "Negative") return r.earningsGrowth != null && r.earningsGrowth < 0;
      return true;
    }],
  ],
  technical: [
    ["change", "Change", ["Any", "Up", "Up >2%", "Up >5%", "Down", "Down >2%", "Down >5%"], (r, v) => {
      const c = r.changePct ?? 0;
      if (v === "Up") return c > 0;
      if (v === "Up >2%") return c > 2;
      if (v === "Up >5%") return c > 5;
      if (v === "Down") return c < 0;
      if (v === "Down >2%") return c < -2;
      if (v === "Down >5%") return c < -5;
      return true;
    }],
    ["sma50", "50-Day SMA", ["Any", "Price above SMA50", "Price below SMA50"], (r, v) => {
      if (!r.sma50 || !r.price) return false;
      return v.includes("above") ? r.price > r.sma50 : r.price < r.sma50;
    }],
    ["sma200", "200-Day SMA", ["Any", "Price above SMA200", "Price below SMA200"], (r, v) => {
      if (!r.sma200 || !r.price) return false;
      return v.includes("above") ? r.price > r.sma200 : r.price < r.sma200;
    }],
    ["high52", "52-Week High/Low", ["Any", "Within 5% of High", "Within 10% of High", "Within 10% of Low", "Down >30% from High"], (r, v) => {
      if (!r.high52w || !r.low52w || !r.price) return false;
      const offH = ((r.high52w - r.price) / r.high52w) * 100;
      const offL = ((r.price - r.low52w) / r.low52w) * 100;
      if (v === "Within 5% of High") return offH <= 5;
      if (v === "Within 10% of High") return offH <= 10;
      if (v === "Within 10% of Low") return offL <= 10;
      if (v === "Down >30% from High") return offH > 30;
      return true;
    }],
    ["beta", "Beta", ["Any", "Under 1", "Over 1", "Over 1.5"], (r, v) => {
      if (v === "Under 1") return r.beta != null && r.beta < 1;
      if (v === "Over 1") return (r.beta ?? 0) > 1;
      if (v === "Over 1.5") return (r.beta ?? 0) > 1.5;
      return true;
    }],
    ["gapOpen", "Open vs Prev Close", ["Any", "Gapped Up", "Gapped Down"], (r, v) => {
      if (!r.open || !r.prevClose) return false;
      return v === "Gapped Up" ? r.open > r.prevClose : r.open < r.prevClose;
    }],
  ],
};

// ── signals (Finviz Signal dropdown) ────────────────────
const SIGNALS = {
  "None (all stocks)": null,
  "Top Gainers": { sort: ["changePct", -1], pred: (r) => (r.changePct ?? 0) > 0 },
  "Top Losers": { sort: ["changePct", 1], pred: (r) => (r.changePct ?? 0) < 0 },
  "Most Active": { sort: ["volume", -1], pred: (r) => (r.volume ?? 0) > 0 },
  "New 52W High (within 2%)": { sort: ["changePct", -1], pred: (r) => r.high52w && r.price && (r.high52w - r.price) / r.high52w <= 0.02 },
  "Near 52W Low (within 5%)": { sort: ["changePct", 1], pred: (r) => r.low52w && r.price && (r.price - r.low52w) / r.low52w <= 0.05 },
  "Above SMA200": { sort: ["changePct", -1], pred: (r) => r.sma200 && r.price > r.sma200 },
  "Below SMA200": { sort: ["changePct", 1], pred: (r) => r.sma200 && r.price < r.sma200 },
  "Low P/E (<15)": { sort: ["pe", 1], pred: (r) => r.pe > 0 && r.pe < 15 },
  "High Dividend (>2%)": { sort: ["dividend", -1], pred: (r) => (r.dividend ?? 0) > 2 },
};

// ── view column sets ────────────────────────────────────
const VIEWS = {
  Overview: [["symbol","Ticker"],["name","Company"],["sector","Sector"],["industry","Industry"],["country","Country"],["marketCap","Market Cap"],["pe","P/E"],["price","Price"],["changePct","Change"],["volume","Volume"]],
  Snapshot: [["symbol","Ticker"],["name","Company"],["sector","Sector"],["marketCap","Market Cap"],["pe","P/E"],["pb","P/B"],["dividend","Dividend"],["roe","ROE"],["beta","Beta"],["price","Price"],["changePct","Change"]],
  Valuation: [["symbol","Ticker"],["marketCap","Market Cap"],["pe","P/E"],["fwdPe","Fwd P/E"],["peg","PEG"],["ps","P/S"],["pb","P/B"],["evEbitda","EV/EBITDA"],["price","Price"],["changePct","Change"]],
  Financial: [["symbol","Ticker"],["marketCap","Market Cap"],["roe","ROE"],["roa","ROA"],["debtEquity","LT D/E"],["grossMargin","Gross M"],["operatingMargin","Oper M"],["netMargin","Profit M"],["dividend","Dividend"],["price","Price"],["changePct","Change"]],
  Performance: [["symbol","Ticker"],["changePct","Change"],["volume","Volume"],["revenueGrowth","Sales TTM"],["earningsGrowth","EPS TTM"],["beta","Beta"],["targetPrice","Target"],["price","Price"]],
  Technical: [["symbol","Ticker"],["beta","Beta"],["sma50","SMA50"],["sma200","SMA200"],["high52w","52W High"],["low52w","52W Low"],["changePct","Change"],["price","Price"]],
  TA: [["symbol","Ticker"],["price","Price"],["sma50","SMA50"],["sma200","SMA200"],["distSma50","vs SMA50"],["distSma200","vs SMA200"],["beta","Beta"],["changePct","Change"]],
  Basic: [["symbol","Ticker"],["name","Company"],["sector","Sector"],["marketCap","Market Cap"],["pe","P/E"],["price","Price"],["changePct","Change"],["volume","Volume"]],
  Stats: [["symbol","Ticker"],["marketCap","Market Cap"],["eps","EPS"],["roe","ROE"],["roa","ROA"],["netMargin","Profit M"],["revenueGrowth","Sales TTM"],["earningsGrowth","EPS TTM"],["beta","Beta"],["changePct","Change"]],
};
const VISUAL_VIEWS = ["Charts", "Tickers", "Maps"];
const SOON_VIEWS = ["Ownership", "News", "ETF"];
const SOON_COPY = {
  Ownership: { line: "Insider & institutional holdings, float and shareholding pattern.", note: "Connects to a holdings feed in the next data release." },
  News: { line: "Headlines, filings and corporate actions per ticker.", note: "Connects to a news feed in the next data release." },
  ETF: { line: "ETF holdings, expense ratios and exposure breakdowns.", note: "Activates once ETF instruments join the universe." },
};
const ORDER_FIELDS = [["symbol","Ticker"],["name","Company"],["sector","Sector"],["marketCap","Market Cap"],["pe","P/E"],["price","Price"],["changePct","Change"],["volume","Volume"],["roe","ROE"],["dividend","Dividend"]];
const PAGE_SIZE = 20;
const PCT_COLS = ["roe","roa","grossMargin","operatingMargin","netMargin","revenueGrowth","earningsGrowth","dividend"];

// ── visual views (all driven by real row data) ───────────
const heatColor = (p) => {
  if (p == null) return "rgba(148,163,184,0.08)";
  const x = Math.max(-6, Math.min(6, p)) / 6; // clamp ±6%
  if (x >= 0) return `rgba(45,212,130,${0.10 + x * 0.42})`;
  return `rgba(240,86,79,${0.10 + Math.abs(x) * 0.42})`;
};

function ChartsView({ rows, market, onPick }) {
  const c = MARKETS[market].cur;
  return (
    <div className="card mt-2 p-4 grid sm:grid-cols-2 gap-x-8 gap-y-4">
      {rows.map((r) => {
        const pos = r.high52w && r.low52w && r.price && r.high52w > r.low52w
          ? Math.min(1, Math.max(0, (r.price - r.low52w) / (r.high52w - r.low52w))) : null;
        return (
          <button key={r.symbol} onClick={() => onPick(r.symbol)} className="text-left group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-sm text-[#5aa9f5] group-hover:underline">{r.symbol}</span>
              <span className={`font-mono text-xs ${pctCls(r.changePct)}`}>{r.changePct == null ? "—" : (r.changePct > 0 ? "+" : "") + r.changePct.toFixed(2) + "%"}</span>
            </div>
            {pos != null ? (
              <>
                <div className="relative range-track"><div className="absolute -top-[3px] range-knob" style={{ left: `calc(${pos * 100}% - 6px)` }} /></div>
                <div className="flex justify-between font-mono text-[10px] text-muted mt-1.5">
                  <span>{c}{fmt(r.low52w)}</span><span className="text-body/70">{c}{fmt(r.price)}</span><span>{c}{fmt(r.high52w)}</span>
                </div>
              </>
            ) : <div className="text-[11px] text-muted py-2">52-week range unavailable</div>}
          </button>
        );
      })}
    </div>
  );
}

function TickersView({ rows, onPick }) {
  return (
    <div className="card mt-2 p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {rows.map((r) => (
        <button key={r.symbol} onClick={() => onPick(r.symbol)}
          className="rounded-lg border border-line px-2.5 py-2 text-left hover:border-amber/40 transition-colors"
          style={{ background: heatColor(r.changePct) }}>
          <div className="font-mono text-xs text-body truncate">{r.symbol}</div>
          <div className={`font-mono text-[11px] ${pctCls(r.changePct)}`}>{r.changePct == null ? "—" : (r.changePct > 0 ? "+" : "") + r.changePct.toFixed(2) + "%"}</div>
        </button>
      ))}
    </div>
  );
}

function SectorMap({ rows, market }) {
  const groups = {};
  for (const r of rows) {
    const s = r.sector || "Other";
    if (!groups[s]) groups[s] = { cap: 0, wsum: 0, n: 0 };
    const cap = r.marketCap || 0;
    groups[s].cap += cap;
    groups[s].wsum += (r.changePct ?? 0) * (cap || 1);
    groups[s].n += 1;
  }
  const tiles = Object.entries(groups)
    .map(([name, g]) => ({ name, cap: g.cap, n: g.n, avg: g.cap ? g.wsum / g.cap : 0 }))
    .sort((a, b) => b.cap - a.cap);
  const maxCap = Math.max(...tiles.map((t) => t.cap), 1);
  return (
    <div className="card mt-2 p-3">
      <div className="flex flex-wrap gap-2">
        {tiles.map((t) => {
          const w = 26 + Math.sqrt(t.cap / maxCap) * 74; // % basis, sqrt for area feel
          return (
            <div key={t.name} className="rounded-lg border border-line p-3 flex flex-col justify-between min-h-[88px]"
              style={{ background: heatColor(t.avg), flex: `1 1 ${w}%`, minWidth: 150 }}>
              <div className="text-[13px] text-body font-medium leading-tight">{t.name}</div>
              <div className="flex items-end justify-between mt-2">
                <span className="font-mono text-[10px] text-muted">{t.n} stk · {fmtCap(t.cap, market)}</span>
                <span className={`font-mono text-sm ${pctCls(t.avg)}`}>{t.avg > 0 ? "+" : ""}{t.avg.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[10px] text-muted mt-3">Tile size ∝ aggregate market cap · color ∝ cap-weighted average change · {tiles.length} sectors</p>
    </div>
  );
}

function SoonPanel({ view }) {
  const copy = SOON_COPY[view] || {};
  return (
    <div className="card mt-2 p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl border border-line flex items-center justify-center mb-4" style={{ background: "linear-gradient(160deg,rgba(240,169,59,0.14),rgba(124,92,250,0.12))" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-amber"><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
      </div>
      <h3 className="font-display text-lg text-body">{view}</h3>
      <p className="text-sm text-muted max-w-md mt-1.5">{copy.line}</p>
      <p className="font-mono text-[11px] text-amber/80 mt-4">{copy.note}</p>
    </div>
  );
}

export default function Markets() {
  const [indices, setIndices] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [filterTab, setFilterTab] = useState("descriptive");
  const [showFilters, setShowFilters] = useState(true);
  const [view, setView] = useState("Overview");
  const [active, setActive] = useState({});
  const [signal, setSignal] = useState("None (all stocks)");
  const [tickerQ, setTickerQ] = useState("");
  const [sort, setSort] = useState({ col: "symbol", dir: 1 });
  const [page, setPage] = useState(0);
  const [presets, setPresets] = useState([]);
  const [market, setMarket] = useState("NSE");
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIdx, setSearchIdx] = useState(0);
  const searchRef = useRef(null);
  const router = useRouter();

  // close search dropdown on outside click
  useEffect(() => {
    const onClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchMarket = (m) => {
    if (m === market) return;
    setMarket(m); setActive({}); setSignal("None (all stocks)");
    setTickerQ(""); setPage(0); setRows([]); setIndices(null); setStatus("loading");
  };

  useEffect(() => {
    try { setPresets(JSON.parse(localStorage.getItem("ahq_presets") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    const wake = setTimeout(() => alive && setStatus((s) => (s === "loading" ? "waking" : s)), 4000);
    async function load() {
      try {
        const [idx, scr] = await Promise.all([api(MARKETS[market].idx), api(MARKETS[market].scr)]);
        if (!alive) return;
        setIndices(idx?.data || null);
        setRows(Array.isArray(scr?.data) ? scr.data : []);
        setStatus("live");
      } catch { if (alive) setStatus("error"); }
    }
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearTimeout(wake); clearInterval(t); };
  }, [market]);

  const filterDefs = useMemo(() => {
    const d = { descriptive: F.descriptive.map((x) => [...x]), fundamental: F.fundamental.map((x) => [...x]), technical: F.technical.map((x) => [...x]) };
    d.descriptive[0][2] = ["Any", ...new Set(rows.map((r) => r.sector).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    d.descriptive[1][2] = ["Any", ...new Set(rows.map((r) => r.industry).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    const mc = d.descriptive.find((x) => x[0] === "marketCap");
    const pf = d.descriptive.find((x) => x[0] === "price");
    if (market === "US") {
      mc[2] = ["Any", "Mega (>$200B)", "Large ($10B-$200B)", "Mid ($2B-$10B)", "Small (<$2B)"];
      pf[2] = ["Any", "Under $20", "$20 to $100", "$100 to $500", "Over $500"];
    } else {
      mc[2] = ["Any", "Mega (>₹5L Cr)", "Large (₹1L-5L Cr)", "Mid (₹20k-1L Cr)", "Small (<₹20k Cr)"];
      pf[2] = ["Any", "Under ₹100", "₹100 to ₹500", "₹500 to ₹1000", "Over ₹1000"];
    }
    return d;
  }, [rows, market]);

  const allDefs = useMemo(() => [...filterDefs.descriptive, ...filterDefs.fundamental, ...filterDefs.technical], [filterDefs]);
  const tabsToRender = filterTab === "all"
    ? allDefs
    : filterDefs[filterTab];

  const filtered = useMemo(() => {
    let out = rows.map((r) => ({ ...r, country: r.country || (market === "US" ? "USA" : "India") }));
    if (tickerQ) out = out.filter((r) => r.symbol?.toLowerCase().includes(tickerQ.toLowerCase()) || r.name?.toLowerCase().includes(tickerQ.toLowerCase()));
    for (const [id, val] of Object.entries(active)) {
      if (!val || val === "Any") continue;
      const def = allDefs.find((d) => d[0] === id);
      if (def) out = out.filter((r) => def[3](r, val));
    }
    const sig = SIGNALS[signal];
    if (sig) out = out.filter(sig.pred);
    const col = sig ? sig.sort[0] : sort.col;
    const dir = sig ? sig.sort[1] : sort.dir;
    const textCols = ["symbol", "name", "sector", "industry", "country"];
    return [...out].sort((a, b) =>
      textCols.includes(col)
        ? dir * String(a[col] ?? "").localeCompare(String(b[col] ?? ""))
        : dir * ((a[col] ?? -Infinity) - (b[col] ?? -Infinity))
    );
  }, [rows, tickerQ, active, signal, sort, allDefs]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const activeCount = Object.values(active).filter((v) => v && v !== "Any").length;

  const savePreset = () => {
    const name = window.prompt("Preset name:");
    if (!name) return;
    const next = [...presets.filter((p) => p.name !== name), { name, active, signal }];
    setPresets(next);
    try { localStorage.setItem("ahq_presets", JSON.stringify(next)); } catch {}
  };
  const loadPreset = (name) => {
    if (name === "__save") return savePreset();
    const p = presets.find((x) => x.name === name);
    if (p) { setActive(p.active); setSignal(p.signal); setPage(0); }
  };

  const exportCSV = () => {
    const cols = VIEWS[view] || VIEWS.Overview;
    const head = ["No.", ...cols.map(([, l]) => l)].join(",");
    const body = filtered.map((r, i) =>
      [i + 1, ...cols.map(([c]) => {
        const v = r[c];
        return typeof v === "string" ? `"${v.replaceAll('"', '""')}"` : v ?? "";
      })].join(",")
    ).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ahq-screener-${view.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cell = (col, r) => {
    const v = r[col];
    switch (col) {
      case "symbol": return <Link href={`/stock/${encodeURIComponent(v)}?market=${market}`} className="font-mono text-[#5aa9f5] hover:underline cursor-pointer">{v}</Link>;
      case "name": return <span className="text-body/90">{v || "-"}</span>;
      case "sector": case "industry": case "country": return <span className="text-body/80">{v || "-"}</span>;
      case "marketCap": return <span className="font-mono">{fmtCap(v, market)}</span>;
      case "changePct": return <span className={`font-mono ${pctCls(v)}`}>{v == null ? "-" : fmt(v) + "%"}</span>;
      case "volume": return <span className="font-mono">{fmtVol(v)}</span>;
      case "price": return <span className="font-mono text-gain">{MARKETS[market].cur}{fmt(v)}</span>;
      case "distSma50": case "distSma200": {
        const sma = col === "distSma50" ? r.sma50 : r.sma200;
        if (!sma || !r.price) return <span className="font-mono text-muted">-</span>;
        const d = ((r.price - sma) / sma) * 100;
        return <span className={`font-mono ${pctCls(d)}`}>{d > 0 ? "+" : ""}{d.toFixed(2)}%</span>;
      }
      default:
        if (PCT_COLS.includes(col)) return <span className={`font-mono ${pctCls(v)}`}>{v == null ? "-" : fmt(v) + "%"}</span>;
        return <span className="font-mono">{fmt(v)}</span>;
    }
  };

  const pageNumbers = useMemo(() => {
    if (pages <= 8) return Array.from({ length: pages }, (_, i) => i);
    const set = new Set([0, 1, 2, safePage - 1, safePage, safePage + 1, pages - 2, pages - 1]);
    return [...set].filter((i) => i >= 0 && i < pages).sort((a, b) => a - b);
  }, [pages, safePage]);

  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    return rows
      .filter((r) => r.symbol?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.sector?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQ, rows]);

  const goToStock = (sym) => {
    if (!sym) return;
    setSearchOpen(false); setSearchQ("");
    router.push(`/stock/${encodeURIComponent(sym)}?market=${market}`);
  };

  const onSearchKey = (e) => {
    if (!searchOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSearchIdx((i) => Math.min(searchResults.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSearchIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); goToStock(searchResults[searchIdx]?.symbol); }
    else if (e.key === "Escape") setSearchOpen(false);
  };

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <p className="eyebrow !mb-0">[ AHQ : SCREENER — {market === "US" ? "US EQUITIES" : "NSE INDIA"} ]</p>
        <div className="flex rounded-lg border border-line overflow-hidden">
          {Object.keys(MARKETS).map((m) => (
            <button key={m} onClick={() => switchMarket(m)}
              className={`px-5 py-1.5 text-sm font-mono transition-colors ${market === m ? "bg-amber text-ink font-medium" : "text-muted hover:text-body"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH ─────────────────────────────────────── */}
      <div ref={searchRef} className="relative mb-6">
        <div className="glass flex items-center gap-3 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={searchQ}
            onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); setSearchIdx(0); }}
            onFocus={() => searchQ && setSearchOpen(true)}
            onKeyDown={onSearchKey}
            placeholder={`Search ${market === "US" ? "US" : "NSE"} stocks — name, ticker or sector…`}
            className="bg-transparent outline-none w-full text-body placeholder:text-muted text-[15px] font-body"
          />
          {searchQ && <button onClick={() => { setSearchQ(""); setSearchOpen(false); }} className="text-muted hover:text-body text-sm shrink-0">clear</button>}
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="search-pop absolute z-30 left-0 right-0 mt-2 py-1.5 overflow-hidden">
            {searchResults.map((r, i) => (
              <button key={r.symbol} data-active={i === searchIdx}
                onMouseEnter={() => setSearchIdx(i)} onClick={() => goToStock(r.symbol)}
                className="search-row w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[#5aa9f5] text-sm shrink-0">{r.symbol}</span>
                  <span className="text-body/80 text-sm truncate">{r.name}</span>
                </span>
                <span className="text-muted text-xs font-mono shrink-0 hidden sm:block">{r.sector}</span>
              </button>
            ))}
          </div>
        )}
        {searchOpen && searchQ && searchResults.length === 0 && status === "live" && (
          <div className="search-pop absolute z-30 left-0 right-0 mt-2 px-4 py-3 text-sm text-muted">
            No {market === "US" ? "US" : "NSE"} stocks match “{searchQ}”.
          </div>
        )}
      </div>

      {/* INDICES STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(indices ? Object.entries(indices) : []).map(([name, v]) => (
          <div key={name} className="card px-4 py-2.5 flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] tracking-wider text-muted uppercase">{name}</span>
            <span className="font-mono text-sm">{fmt(v?.value ?? v?.price)}</span>
            <span className={`font-mono text-xs ${pctCls(v?.changePct)}`}>{fmt(v?.changePct)}%</span>
          </div>
        ))}
        {!indices && status !== "error" && (
          <div className="card px-4 py-2.5 col-span-2 md:col-span-4 text-sm text-muted">Loading indices…</div>
        )}
      </div>

      {status === "waking" && (
        <div className="card mb-4 p-4 text-sm text-muted border-amber/30">
          Waking the data engine — first load can take up to a minute on the free tier.
        </div>
      )}
      {status === "error" && (
        <div className="card mb-4 p-4 text-sm text-loss/90">Data engine unreachable — token may need a refresh.</div>
      )}

      {/* ── TOP CONTROL BAR (Finviz) ─────────────────── */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">My Presets</span>
          <select onChange={(e) => loadPreset(e.target.value)} value="" className="bg-ink border border-line rounded px-2 py-1.5 outline-none focus:border-amber/60 min-w-[140px]">
            <option value="" disabled>Select…</option>
            {presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="__save">+ Save current…</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted">Order by</span>
          <select value={sort.col} onChange={(e) => setSort((s) => ({ ...s, col: e.target.value }))} className="bg-ink border border-line rounded px-2 py-1.5 outline-none focus:border-amber/60">
            {ORDER_FIELDS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          <select value={sort.dir} onChange={(e) => setSort((s) => ({ ...s, dir: Number(e.target.value) }))} className="bg-ink border border-line rounded px-2 py-1.5 outline-none focus:border-amber/60">
            <option value={1}>Asc</option>
            <option value={-1}>Desc</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted">Signal</span>
          <select value={signal} onChange={(e) => { setSignal(e.target.value); setPage(0); }} className={`bg-ink border rounded px-2 py-1.5 outline-none focus:border-amber/60 ${signal !== "None (all stocks)" ? "border-amber/60 text-amber" : "border-line"}`}>
            {Object.keys(SIGNALS).map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-muted">Tickers</span>
          <input value={tickerQ} onChange={(e) => { setTickerQ(e.target.value); setPage(0); }} className="bg-ink border border-line rounded px-2 py-1.5 outline-none focus:border-amber/60 w-full" />
        </label>
        <button onClick={() => setShowFilters((s) => !s)} className="btn-primary !py-1.5 !px-4">
          Filters {activeCount > 0 && `(${activeCount})`} {showFilters ? "▴" : "▾"}
        </button>
      </div>

      {/* ── FILTER PANEL ─────────────────────────────── */}
      {showFilters && (
        <div className="card mt-2">
          <div className="flex justify-center border-b border-line">
            {[["descriptive", "Descriptive"], ["fundamental", "Fundamental"], ["technical", "Technical"], ["all", "All"]].map(([id, label]) => (
              <button key={id} onClick={() => setFilterTab(id)}
                className={`px-5 py-2 text-sm border-b-2 -mb-px transition-colors ${filterTab === id ? "border-amber text-amber bg-raised/60" : "border-transparent text-muted hover:text-body"}`}>
                {label}
              </button>
            ))}
            {["News", "ETF"].map((t) => (
              <span key={t} className="px-5 py-2 text-sm text-muted/40 cursor-not-allowed" title="Coming in v2">{t}</span>
            ))}
            {activeCount > 0 && (
              <button onClick={() => { setActive({}); setPage(0); }} className="ml-auto px-4 text-xs text-muted hover:text-amber">
                Reset ({activeCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-2.5 p-4">
            {tabsToRender.map(([id, label, options]) => (
              <div key={id} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted text-right whitespace-nowrap">{label}</span>
                <select
                  value={active[id] || "Any"}
                  onChange={(e) => { setActive((a) => ({ ...a, [id]: e.target.value })); setPage(0); }}
                  className={`bg-ink border rounded px-2 py-1.5 text-[13px] outline-none focus:border-amber/60 w-[170px] ${active[id] && active[id] !== "Any" ? "border-amber/60 text-amber" : "border-line"}`}
                >
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW TAB STRIP ───────────────────────────── */}
      <div className="card mt-2 flex overflow-x-auto">
        {[...Object.keys(VIEWS), ...VISUAL_VIEWS, ...SOON_VIEWS].map((vw) => (
          <button key={vw} onClick={() => { setView(vw); setPage(0); }}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${view === vw ? "border-amber text-amber bg-raised/60" : "border-transparent text-muted hover:text-body"}`}>
            {vw}
          </button>
        ))}
      </div>

      {/* ── TABLE VIEWS ──────────────────────────────── */}
      {VIEWS[view] ? (
        <>
          {/* COUNT + PAGE */}
          <div className="flex items-center justify-between mt-3 text-sm flex-wrap gap-2">
            <p className="font-mono text-xs text-muted">
              #{filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1} / <span className="text-body">{filtered.length}</span> Total
            </p>
            <p className="text-xs text-muted/50 select-none" title="Coming in v2">
              Open in Compare | Save as Portfolio | Create Alert
            </p>
            <p className="font-mono text-xs text-muted">Refresh: 30s | Page {safePage + 1} / {pages}</p>
          </div>

          <div className="card mt-2 overflow-x-auto">
            <table className="w-full text-[13px] min-w-[860px]">
              <thead className="border-b border-line bg-raised/40">
                <tr>
                  <th className="px-2.5 py-2 font-mono text-[11px] text-muted text-left">No.</th>
                  {VIEWS[view].map(([col, label]) => (
                    <th key={col}
                      onClick={() => setSort((s) => ({ col, dir: s.col === col ? -s.dir : 1 }))}
                      className="px-2.5 py-2 font-mono text-[11px] tracking-wider uppercase text-muted text-left cursor-pointer hover:text-amber select-none whitespace-nowrap">
                      {label}{sort.col === col && (sort.dir === 1 ? " ▲" : " ▼")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={r.symbol} className={`border-b border-line/40 hover:bg-raised/70 ${i % 2 ? "bg-raised/20" : ""}`}>
                    <td className="px-2.5 py-1.5 font-mono text-muted text-xs">{safePage * PAGE_SIZE + i + 1}</td>
                    {VIEWS[view].map(([col]) => (
                      <td key={col} className="px-2.5 py-1.5 whitespace-nowrap">{cell(col, r)}</td>
                    ))}
                  </tr>
                ))}
                {pageRows.length === 0 && status === "live" && (
                  <tr><td colSpan={VIEWS[view].length + 1} className="px-3 py-10 text-center text-muted">No stocks match the current filters.</td></tr>
                )}
                {status !== "live" && status !== "error" && (
                  <tr><td colSpan={VIEWS[view].length + 1} className="px-3 py-10 text-center text-muted">Loading screener…</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION + EXPORT */}
          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {pageNumbers.map((i, idx) => (
                <span key={i} className="flex items-center gap-1.5">
                  {idx > 0 && pageNumbers[idx - 1] !== i - 1 && <span className="text-muted text-xs">···</span>}
                  <button onClick={() => setPage(i)}
                    className={`min-w-[30px] h-[30px] px-1.5 rounded text-sm font-mono border ${i === safePage ? "border-amber text-amber bg-raised/60" : "border-line text-muted hover:text-body"}`}>
                    {i + 1}
                  </button>
                </span>
              ))}
              {pages > 1 && (
                <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={safePage === pages - 1}
                  className="h-[30px] px-2.5 rounded border border-line text-muted hover:text-body disabled:opacity-30 text-sm">→</button>
              )}
            </div>
            <button onClick={exportCSV} className="text-sm text-[#5aa9f5] hover:underline">Export</button>
          </div>
        </>
      ) : VISUAL_VIEWS.includes(view) ? (
        <>
          <div className="flex items-center justify-between mt-3 text-sm flex-wrap gap-2">
            <p className="font-mono text-xs text-muted"><span className="text-body">{filtered.length}</span> stocks · {view} view</p>
            {view !== "Maps" && <button onClick={exportCSV} className="text-sm text-[#5aa9f5] hover:underline">Export</button>}
          </div>
          {status !== "live" ? (
            <div className="card mt-2 p-10 text-center text-muted">Loading {view.toLowerCase()}…</div>
          ) : view === "Charts" ? <ChartsView rows={filtered} market={market} onPick={goToStock} />
            : view === "Tickers" ? <TickersView rows={filtered} onPick={goToStock} />
            : <SectorMap rows={filtered} market={market} />}
        </>
      ) : (
        <SoonPanel view={view} />
      )}

      <p className="font-mono text-[11px] text-muted mt-6">
        DATA: {market === "US" ? "YAHOO FINANCE · ~15 MIN DELAYED" : "UPSTOX (LIVE) + YAHOO FINANCE"} · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </div>
  );
}
