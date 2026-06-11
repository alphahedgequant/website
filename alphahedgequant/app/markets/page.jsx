"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/config";

// ── formatting helpers ──────────────────────────────────
const fmt = (v, d = 2) => (v == null || isNaN(v) ? "--" : Number(v).toFixed(d));
const fmtCr = (v) => (v == null ? "--" : `₹${(v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`);
const fmtVol = (v) => (v ? Number(v).toLocaleString("en-IN") : "--");
const pctCls = (v) => ((v ?? 0) > 0 ? "tick-up" : (v ?? 0) < 0 ? "tick-down" : "text-muted");

// ── filter definitions (Finviz-style) ───────────────────
const FILTERS = {
  descriptive: [
    { id: "sector", label: "Sector", options: ["Any"], dynamic: true,
      test: (r, v) => r.sector === v },
    { id: "industry", label: "Industry", options: ["Any"], dynamic: true,
      test: (r, v) => r.industry === v },
    { id: "marketCap", label: "Market Cap", options: ["Any", "Mega (>₹5L Cr)", "Large (₹1L-5L Cr)", "Mid (₹20k-1L Cr)", "Small (<₹20k Cr)"],
      test: (r, v) => {
        const cr = (r.marketCap ?? 0) / 1e7;
        if (v.startsWith("Mega")) return cr > 500000;
        if (v.startsWith("Large")) return cr >= 100000 && cr <= 500000;
        if (v.startsWith("Mid")) return cr >= 20000 && cr < 100000;
        if (v.startsWith("Small")) return cr > 0 && cr < 20000;
        return true;
      } },
    { id: "dividend", label: "Dividend Yield", options: ["Any", "None (0%)", "Positive (>0%)", "High (>2%)", "Very High (>4%)"],
      test: (r, v) => {
        const d = r.dividend ?? 0;
        if (v.startsWith("None")) return !d;
        if (v.startsWith("Positive")) return d > 0;
        if (v.startsWith("High")) return d > 2;
        if (v.startsWith("Very")) return d > 4;
        return true;
      } },
    { id: "volume", label: "Volume", options: ["Any", "Over 1M", "Over 5M", "Over 10M", "Over 50M"],
      test: (r, v) => {
        const m = { "Over 1M": 1e6, "Over 5M": 5e6, "Over 10M": 1e7, "Over 50M": 5e7 };
        return (r.volume ?? 0) > m[v];
      } },
  ],
  fundamental: [
    { id: "pe", label: "P/E", options: ["Any", "Low (<15)", "Profitable (<25)", "High (>50)", "Negative/NA"],
      test: (r, v) => {
        if (v.startsWith("Low")) return r.pe != null && r.pe > 0 && r.pe < 15;
        if (v.startsWith("Profitable")) return r.pe != null && r.pe > 0 && r.pe < 25;
        if (v.startsWith("High")) return r.pe != null && r.pe > 50;
        if (v.startsWith("Negative")) return r.pe == null || r.pe <= 0;
        return true;
      } },
    { id: "fwdPe", label: "Forward P/E", options: ["Any", "Low (<15)", "Under 25", "High (>40)"],
      test: (r, v) => {
        if (v.startsWith("Low")) return r.fwdPe != null && r.fwdPe > 0 && r.fwdPe < 15;
        if (v.startsWith("Under")) return r.fwdPe != null && r.fwdPe > 0 && r.fwdPe < 25;
        if (v.startsWith("High")) return r.fwdPe != null && r.fwdPe > 40;
        return true;
      } },
    { id: "peg", label: "PEG", options: ["Any", "Under 1", "Under 2", "Over 2"],
      test: (r, v) => {
        if (v === "Under 1") return r.peg != null && r.peg > 0 && r.peg < 1;
        if (v === "Under 2") return r.peg != null && r.peg > 0 && r.peg < 2;
        if (v === "Over 2") return r.peg != null && r.peg > 2;
        return true;
      } },
    { id: "pb", label: "P/B", options: ["Any", "Under 1", "Under 3", "Over 5"],
      test: (r, v) => {
        if (v === "Under 1") return r.pb != null && r.pb > 0 && r.pb < 1;
        if (v === "Under 3") return r.pb != null && r.pb > 0 && r.pb < 3;
        if (v === "Over 5") return r.pb != null && r.pb > 5;
        return true;
      } },
    { id: "roe", label: "ROE", options: ["Any", "Positive (>0%)", "Over 10%", "Over 20%", "Negative"],
      test: (r, v) => {
        if (v.startsWith("Positive")) return (r.roe ?? -1) > 0;
        if (v === "Over 10%") return (r.roe ?? -1) > 10;
        if (v === "Over 20%") return (r.roe ?? -1) > 20;
        if (v === "Negative") return r.roe != null && r.roe < 0;
        return true;
      } },
    { id: "debtEquity", label: "Debt/Equity", options: ["Any", "Under 0.5", "Under 1", "Over 2"],
      test: (r, v) => {
        if (v === "Under 0.5") return r.debtEquity != null && r.debtEquity < 0.5;
        if (v === "Under 1") return r.debtEquity != null && r.debtEquity < 1;
        if (v === "Over 2") return (r.debtEquity ?? 0) > 2;
        return true;
      } },
    { id: "netMargin", label: "Net Margin", options: ["Any", "Positive", "Over 10%", "Over 20%", "Negative"],
      test: (r, v) => {
        if (v === "Positive") return (r.netMargin ?? -1) > 0;
        if (v === "Over 10%") return (r.netMargin ?? -1) > 10;
        if (v === "Over 20%") return (r.netMargin ?? -1) > 20;
        if (v === "Negative") return r.netMargin != null && r.netMargin < 0;
        return true;
      } },
    { id: "revenueGrowth", label: "Revenue Growth", options: ["Any", "Positive", "Over 10%", "Over 25%", "Negative"],
      test: (r, v) => {
        if (v === "Positive") return (r.revenueGrowth ?? -1) > 0;
        if (v === "Over 10%") return (r.revenueGrowth ?? -1) > 10;
        if (v === "Over 25%") return (r.revenueGrowth ?? -1) > 25;
        if (v === "Negative") return r.revenueGrowth != null && r.revenueGrowth < 0;
        return true;
      } },
  ],
  technical: [
    { id: "change", label: "Change", options: ["Any", "Up", "Up >2%", "Down", "Down >2%"],
      test: (r, v) => {
        const c = r.changePct ?? 0;
        if (v === "Up") return c > 0;
        if (v === "Up >2%") return c > 2;
        if (v === "Down") return c < 0;
        if (v === "Down >2%") return c < -2;
        return true;
      } },
    { id: "sma50", label: "vs SMA50", options: ["Any", "Price above SMA50", "Price below SMA50"],
      test: (r, v) => {
        if (!r.sma50 || !r.price) return false;
        return v.includes("above") ? r.price > r.sma50 : r.price < r.sma50;
      } },
    { id: "sma200", label: "vs SMA200", options: ["Any", "Price above SMA200", "Price below SMA200"],
      test: (r, v) => {
        if (!r.sma200 || !r.price) return false;
        return v.includes("above") ? r.price > r.sma200 : r.price < r.sma200;
      } },
    { id: "high52", label: "52W High", options: ["Any", "Within 5% of high", "Within 10% of high", "Down >30% from high"],
      test: (r, v) => {
        if (!r.high52w || !r.price) return false;
        const off = ((r.high52w - r.price) / r.high52w) * 100;
        if (v.includes("5%")) return off <= 5;
        if (v.includes("10%")) return off <= 10;
        if (v.includes("30%")) return off > 30;
        return true;
      } },
    { id: "beta", label: "Beta", options: ["Any", "Under 1 (defensive)", "Over 1", "Over 1.5 (volatile)"],
      test: (r, v) => {
        if (v.startsWith("Under 1")) return r.beta != null && r.beta < 1;
        if (v === "Over 1") return (r.beta ?? 0) > 1;
        if (v.startsWith("Over 1.5")) return (r.beta ?? 0) > 1.5;
        return true;
      } },
  ],
};

// ── view definitions (Finviz column sets) ───────────────
const VIEWS = {
  Overview: [
    ["symbol", "Ticker"], ["name", "Company"], ["sector", "Sector"], ["industry", "Industry"],
    ["marketCap", "Market Cap"], ["pe", "P/E"], ["price", "Price ₹"], ["changePct", "Change %"], ["volume", "Volume"],
  ],
  Valuation: [
    ["symbol", "Ticker"], ["marketCap", "Market Cap"], ["pe", "P/E"], ["fwdPe", "Fwd P/E"], ["peg", "PEG"],
    ["ps", "P/S"], ["pb", "P/B"], ["evEbitda", "EV/EBITDA"], ["price", "Price ₹"], ["changePct", "Change %"],
  ],
  Financial: [
    ["symbol", "Ticker"], ["marketCap", "Market Cap"], ["roe", "ROE %"], ["roa", "ROA %"], ["debtEquity", "D/E"],
    ["grossMargin", "Gross M%"], ["operatingMargin", "Oper M%"], ["netMargin", "Net M%"], ["dividend", "Div %"], ["price", "Price ₹"],
  ],
  Performance: [
    ["symbol", "Ticker"], ["changePct", "Change %"], ["volume", "Volume"], ["revenueGrowth", "Rev Gr%"],
    ["earningsGrowth", "EPS Gr%"], ["beta", "Beta"], ["targetPrice", "Target ₹"], ["price", "Price ₹"],
  ],
  Technical: [
    ["symbol", "Ticker"], ["beta", "Beta"], ["sma50", "SMA50"], ["sma200", "SMA200"],
    ["high52w", "52W High"], ["low52w", "52W Low"], ["changePct", "Change %"], ["price", "Price ₹"],
  ],
};

const PAGE_SIZE = 20;

export default function Markets() {
  const [indices, setIndices] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [q, setQ] = useState("");
  const [filterTab, setFilterTab] = useState("descriptive");
  const [view, setView] = useState("Overview");
  const [active, setActive] = useState({});           // { filterId: value }
  const [sort, setSort] = useState({ col: "changePct", dir: -1 });
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    const wakeTimer = setTimeout(() => {
      if (alive) setStatus((s) => (s === "loading" ? "waking" : s));
    }, 4000);
    async function load() {
      try {
        const [idx, scr] = await Promise.all([api("/api/indices"), api("/api/screener")]);
        if (!alive) return;
        setIndices(idx?.data || null);
        setRows(Array.isArray(scr?.data) ? scr.data : []);
        setStatus("live");
      } catch {
        if (alive) setStatus("error");
      }
    }
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearTimeout(wakeTimer); clearInterval(t); };
  }, []);

  // dynamic sector/industry options from data
  const filterDefs = useMemo(() => {
    const defs = JSON.parse(JSON.stringify(FILTERS));
    defs.descriptive[0].options = ["Any", ...new Set(rows.map((r) => r.sector).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    defs.descriptive[1].options = ["Any", ...new Set(rows.map((r) => r.industry).filter(Boolean))].sort((a, b) => (a === "Any" ? -1 : b === "Any" ? 1 : a.localeCompare(b)));
    // reattach test fns lost in JSON clone
    for (const tab of Object.keys(FILTERS)) defs[tab].forEach((f, i) => (f.test = FILTERS[tab][i].test));
    return defs;
  }, [rows]);

  const allFilters = useMemo(
    () => [...filterDefs.descriptive, ...filterDefs.fundamental, ...filterDefs.technical],
    [filterDefs]
  );

  const filtered = useMemo(() => {
    let out = rows;
    if (q) out = out.filter((r) => r.symbol?.toLowerCase().includes(q.toLowerCase()) || r.name?.toLowerCase().includes(q.toLowerCase()));
    for (const [id, val] of Object.entries(active)) {
      if (!val || val === "Any") continue;
      const def = allFilters.find((f) => f.id === id);
      if (def) out = out.filter((r) => def.test(r, val));
    }
    const textCols = ["symbol", "name", "sector", "industry"];
    return [...out].sort((a, b) =>
      textCols.includes(sort.col)
        ? sort.dir * String(b[sort.col] ?? "").localeCompare(String(a[sort.col] ?? ""))
        : sort.dir * ((b[sort.col] ?? -Infinity) - (a[sort.col] ?? -Infinity))
    );
  }, [rows, q, active, sort, allFilters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeCount = Object.values(active).filter((v) => v && v !== "Any").length;

  const cell = (col, r) => {
    const v = r[col];
    switch (col) {
      case "symbol": return <span className="font-mono text-amber">{v}</span>;
      case "name": case "sector": case "industry": return <span className="text-muted">{v || "--"}</span>;
      case "marketCap": return <span className="font-mono">{fmtCr(v)}</span>;
      case "changePct": return <span className={`font-mono ${pctCls(v)}`}>{fmt(v)}%</span>;
      case "volume": return <span className="font-mono text-muted">{fmtVol(v)}</span>;
      case "roe": case "roa": case "grossMargin": case "operatingMargin": case "netMargin":
      case "revenueGrowth": case "earningsGrowth": case "dividend":
        return <span className={`font-mono ${pctCls(v)}`}>{v == null ? "--" : fmt(v) + "%"}</span>;
      default: return <span className="font-mono">{fmt(v)}</span>;
    }
  };

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : MKT — NSE LIVE ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Markets</h1>
      <p className="text-muted text-sm mt-2 max-w-xl">
        Live NSE indices and a FINVIZ-grade screener powered by the AlphaHedgeQuant
        data engine. Auto-refreshes every 30 seconds during market hours.
      </p>

      {status === "waking" && (
        <div className="card mt-8 p-5 text-sm text-muted border-amber/30">
          Waking the data engine — free-tier servers sleep when idle. First load
          can take up to a minute, then it&apos;s instant.
        </div>
      )}
      {status === "error" && (
        <div className="card mt-8 p-5 text-sm text-loss/90">
          Data engine unreachable. The market-data token may need a refresh. Try again in a minute.
        </div>
      )}

      {/* INDICES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {(indices ? Object.entries(indices) : []).map(([name, v]) => (
          <div key={name} className="card p-4">
            <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{name}</p>
            <p className="font-display text-xl mt-1">{fmt(v?.value ?? v?.price)}</p>
            <p className={`text-sm font-mono mt-0.5 ${pctCls(v?.changePct)}`}>{fmt(v?.changePct)}%</p>
          </div>
        ))}
        {!indices && status !== "error" && (
          <div className="card p-4 col-span-2 md:col-span-4 text-sm text-muted">Loading indices…</div>
        )}
      </div>

      {/* ── SCREENER ─────────────────────────────────── */}
      <div className="mt-12 flex items-end justify-between gap-4 flex-wrap">
        <h2 className="font-display text-xl font-medium">Screener</h2>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Search symbol or name…"
          className="bg-surface border border-line rounded-lg px-4 py-2 text-sm w-64 outline-none focus:border-amber/60"
        />
      </div>

      {/* Filter category tabs */}
      <div className="card mt-4">
        <div className="flex border-b border-line">
          {["descriptive", "fundamental", "technical"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              className={`px-5 py-2.5 text-sm capitalize border-b-2 -mb-px transition-colors ${
                filterTab === t ? "border-amber text-amber" : "border-transparent text-muted hover:text-body"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-4 gap-3">
            {activeCount > 0 && (
              <button onClick={() => { setActive({}); setPage(0); }} className="text-xs text-muted hover:text-amber">
                Reset filters ({activeCount})
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 p-4">
          {filterDefs[filterTab].map((f) => (
            <label key={f.id} className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted">{f.label}</span>
              <select
                value={active[f.id] || "Any"}
                onChange={(e) => { setActive((a) => ({ ...a, [f.id]: e.target.value })); setPage(0); }}
                className={`bg-ink border rounded-md px-2 py-1.5 text-sm outline-none focus:border-amber/60 ${
                  active[f.id] && active[f.id] !== "Any" ? "border-amber/60 text-amber" : "border-line"
                }`}
              >
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>

      {/* View tabs + result count */}
      <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {Object.keys(VIEWS).map((vw) => (
            <button
              key={vw}
              onClick={() => setView(vw)}
              className={`px-3.5 py-1.5 text-sm rounded-md border transition-colors ${
                view === vw ? "border-amber text-amber" : "border-line text-muted hover:text-body"
              }`}
            >
              {vw}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs text-muted">
          TOTAL: <span className="text-body">{filtered.length}</span> / {rows.length}
        </p>
      </div>

      {/* Table */}
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="border-b border-line">
            <tr>
              <th className="px-3 py-2.5 font-mono text-[11px] text-muted text-left">No.</th>
              {VIEWS[view].map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => setSort((s) => ({ col, dir: s.col === col ? -s.dir : -1 }))}
                  className="px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted text-left cursor-pointer hover:text-amber select-none whitespace-nowrap"
                >
                  {label}{sort.col === col && (sort.dir === -1 ? " ↓" : " ↑")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.symbol} className="border-b border-line/60 hover:bg-raised/60">
                <td className="px-3 py-2.5 font-mono text-muted text-xs">{page * PAGE_SIZE + i + 1}</td>
                {VIEWS[view].map(([col]) => (
                  <td key={col} className="px-3 py-2.5 whitespace-nowrap">{cell(col, r)}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && status === "live" && (
              <tr><td colSpan={VIEWS[view].length + 1} className="px-3 py-10 text-center text-muted">
                No stocks match the current filters.
              </td></tr>
            )}
            {status !== "live" && status !== "error" && (
              <tr><td colSpan={VIEWS[view].length + 1} className="px-3 py-10 text-center text-muted">
                Loading screener…
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost !py-1.5 !px-3 disabled:opacity-30"
          >
            ← Prev
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-md text-sm font-mono border ${
                i === page ? "border-amber text-amber" : "border-line text-muted hover:text-body"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            className="btn-ghost !py-1.5 !px-3 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      <p className="font-mono text-[11px] text-muted mt-6">
        DATA: UPSTOX + YAHOO FINANCE · FUNDAMENTALS REFRESH EVERY 4H · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </div>
  );
}
