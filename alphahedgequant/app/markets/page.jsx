"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/config";

// ── formatting ──────────────────────────────────────────
const fmt = (v, d = 2) => (v == null || isNaN(v) ? "-" : Number(v).toFixed(d));
const fmtCap = (v) => {
  if (v == null) return "-";
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
    ["marketCap", "Market Cap.", ["Any", "Mega (>₹5L Cr)", "Large (₹1L-5L Cr)", "Mid (₹20k-1L Cr)", "Small (<₹20k Cr)"], (r, v) => {
      const cr = (r.marketCap ?? 0) / 1e7;
      if (v[0] === "M" && v[1] === "e") return cr > 500000;
      if (v[0] === "L") return cr >= 100000 && cr <= 500000;
      if (v[0] === "M") return cr >= 20000 && cr < 100000;
      if (v[0] === "S") return cr > 0 && cr < 20000;
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
    ["price", "Price ₹", ["Any", "Under ₹100", "₹100 to ₹500", "₹500 to ₹1000", "Over ₹1000"], (r, v) => {
      const p = r.price ?? 0;
      if (v === "Under ₹100") return p > 0 && p < 100;
      if (v === "₹100 to ₹500") return p >= 100 && p < 500;
      if (v === "₹500 to ₹1000") return p >= 500 && p < 1000;
      if (v === "Over ₹1000") return p >= 1000;
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
  Valuation: [["symbol","Ticker"],["marketCap","Market Cap"],["pe","P/E"],["fwdPe","Fwd P/E"],["peg","PEG"],["ps","P/S"],["pb","P/B"],["evEbitda","EV/EBITDA"],["price","Price"],["changePct","Change"]],
  Financial: [["symbol","Ticker"],["marketCap","Market Cap"],["roe","ROE"],["roa","ROA"],["debtEquity","LT D/E"],["grossMargin","Gross M"],["operatingMargin","Oper M"],["netMargin","Profit M"],["dividend","Dividend"],["price","Price"],["changePct","Change"]],
  Performance: [["symbol","Ticker"],["changePct","Change"],["volume","Volume"],["revenueGrowth","Sales TTM"],["earningsGrowth","EPS TTM"],["beta","Beta"],["targetPrice","Target"],["price","Price"]],
  Technical: [["symbol","Ticker"],["beta","Beta"],["sma50","SMA50"],["sma200","SMA200"],["high52w","52W High"],["low52w","52W Low"],["changePct","Change"],["price","Price"]],
};
const DISABLED_VIEWS = ["Ownership", "ETF", "Charts", "Tickers", "Basic", "TA", "News", "Snapshot", "Maps", "Stats"];
const ORDER_FIELDS = [["symbol","Ticker"],["name","Company"],["sector","Sector"],["marketCap","Market Cap"],["pe","P/E"],["price","Price"],["changePct","Change"],["volume","Volume"],["roe","ROE"],["dividend","Dividend"]];
const PAGE_SIZE = 20;
const PCT_COLS = ["roe","roa","grossMargin","operatingMargin","netMargin","revenueGrowth","earningsGrowth","dividend"];

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

  useEffect(() => {
    try { setPresets(JSON.parse(localStorage.getItem("ahq_presets") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    const wake = setTimeout(() => alive && setStatus((s) => (s === "loading" ? "waking" : s)), 4000);
    async function load() {
      try {
        const [idx, scr] = await Promise.all([api("/api/indices"), api("/api/screener")]);
        if (!alive) return;
        setIndices(idx?.data || null);
        setRows(Array.isArray(scr?.data) ? scr.data : []);
        setStatus("live");
      } catch { if (alive) setStatus("error"); }
    }
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearTimeout(wake); clearInterval(t); };
  }, []);

  const filterDefs = useMemo(() => {
    const d = { descriptive: F.descriptive.map((x) => [...x]), fundamental: F.fundamental.map((x) => [...x]), technical: F.technical.map((x) => [...x]) };
    d.descriptive[0][2] = ["Any", ...new Set(rows.map((r) => r.sector).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    d.descriptive[1][2] = ["Any", ...new Set(rows.map((r) => r.industry).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    return d;
  }, [rows]);

  const allDefs = useMemo(() => [...filterDefs.descriptive, ...filterDefs.fundamental, ...filterDefs.technical], [filterDefs]);
  const tabsToRender = filterTab === "all"
    ? allDefs
    : filterDefs[filterTab];

  const filtered = useMemo(() => {
    let out = rows.map((r) => ({ ...r, country: "India" }));
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
    const cols = VIEWS[view];
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
      case "symbol": return <span className="font-mono text-[#5aa9f5] hover:underline cursor-pointer">{v}</span>;
      case "name": return <span className="text-body/90">{v || "-"}</span>;
      case "sector": case "industry": case "country": return <span className="text-body/80">{v || "-"}</span>;
      case "marketCap": return <span className="font-mono">{fmtCap(v)}</span>;
      case "changePct": return <span className={`font-mono ${pctCls(v)}`}>{v == null ? "-" : fmt(v) + "%"}</span>;
      case "volume": return <span className="font-mono">{fmtVol(v)}</span>;
      case "price": return <span className="font-mono text-gain">{fmt(v)}</span>;
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

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <p className="eyebrow mb-3">[ AHQ : MKT — NSE SCREENER ]</p>

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
        {Object.keys(VIEWS).map((vw) => (
          <button key={vw} onClick={() => setView(vw)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${view === vw ? "border-amber text-amber bg-raised/60" : "border-transparent text-muted hover:text-body"}`}>
            {vw}
          </button>
        ))}
        {DISABLED_VIEWS.map((vw) => (
          <span key={vw} className="px-4 py-2 text-sm whitespace-nowrap text-muted/40 cursor-not-allowed" title="Coming in v2">{vw}</span>
        ))}
      </div>

      {/* ── COUNT + PAGE ─────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 text-sm flex-wrap gap-2">
        <p className="font-mono text-xs text-muted">
          #{filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1} / <span className="text-body">{filtered.length}</span> Total
        </p>
        <p className="text-xs text-muted/50 select-none" title="Coming in v2">
          Open in Compare | Save as Portfolio | Create Alert
        </p>
        <p className="font-mono text-xs text-muted">Refresh: 30s | Page {safePage + 1} / {pages}</p>
      </div>

      {/* ── TABLE ────────────────────────────────────── */}
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

      {/* ── PAGINATION + EXPORT ──────────────────────── */}
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

      <p className="font-mono text-[11px] text-muted mt-6">
        DATA: UPSTOX + YAHOO FINANCE · NSE UNIVERSE · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </div>
  );
}
