"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchStock } from "@/lib/config";

// ── formatting ───────────────────────────────────────────────
const n2 = (v) => (v == null || isNaN(v) ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 }));
const pct = (v) => (v == null || isNaN(v) ? "—" : `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(2)}%`);
const clsOf = (v) => ((v ?? 0) > 0 ? "tick-up" : (v ?? 0) < 0 ? "tick-down" : "text-muted");
const cur = (m) => (m === "US" ? "$" : "₹");

function capFmt(v, m) {
  if (v == null) return "—";
  if (m === "US") {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    return `$${(v / 1e6).toFixed(0)}M`;
  }
  const cr = v / 1e7;
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
  if (cr >= 1e3) return `₹${(cr / 1e3).toFixed(2)}k Cr`;
  return `₹${cr.toFixed(0)} Cr`;
}
function moneyShort(v, m) {
  if (v == null) return "—";
  if (m === "US") return v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(0)}M`;
  const cr = v / 1e7;
  return cr >= 1e3 ? `${(cr / 1e3).toFixed(1)}k Cr` : `${cr.toFixed(0)} Cr`;
}

const REC_MAP = {
  strong_buy: { label: "Strong Buy", pos: 0.92, color: "#2DD482" },
  buy: { label: "Buy", pos: 0.72, color: "#2DD482" },
  hold: { label: "Hold", pos: 0.5, color: "#F0A93B" },
  underperform: { label: "Underperform", pos: 0.28, color: "#F0564F" },
  sell: { label: "Sell", pos: 0.1, color: "#F0564F" },
};

export default function StockDetail() {
  const { symbol } = useParams();
  const sp = useSearchParams();
  const market = sp.get("market") === "US" ? "US" : "NSE";
  const sym = decodeURIComponent(symbol || "").toUpperCase();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    const wake = setTimeout(() => alive && setStatus((s) => (s === "loading" ? "waking" : s)), 4500);
    (async () => {
      try {
        const d = await fetchStock(sym, market);
        if (!alive) return;
        if (!d) { setStatus("notfound"); return; }
        setData(d); setStatus("live");
      } catch { if (alive) setStatus("error"); }
    })();
    return () => { alive = false; clearTimeout(wake); };
  }, [sym, market]);

  if (status === "notfound") return <Shell><Empty sym={sym} market={market} /></Shell>;
  if (status !== "live" || !data)
    return <Shell><div className="card p-10 text-center text-muted">{status === "waking" ? "Waking the data engine — first load can take up to a minute on the free tier." : status === "error" ? "Data engine unreachable — try again in a moment." : `Loading ${sym}…`}</div></Shell>;

  const f = data.fundamentals || {};
  const c = cur(market);
  const hi = f.high52w, lo = f.low52w, px = data.price;
  const rangePos = hi && lo && px && hi > lo ? Math.min(1, Math.max(0, (px - lo) / (hi - lo))) : null;
  const rec = f.analystRec ? REC_MAP[f.analystRec] : null;
  const upside = f.targetPrice && px ? ((f.targetPrice - px) / px) * 100 : null;
  const annual = (data.annual || []).filter((x) => x.revenue != null);
  const quarterly = (data.quarterly || []).filter((x) => x.revenue != null);
  const history = (data.history || []).filter((p) => p.c != null);

  let cagr = null;
  if (annual.length >= 2) {
    const a = annual[0].revenue, b = annual[annual.length - 1].revenue, yrs = annual.length - 1;
    if (a > 0 && b > 0) cagr = (Math.pow(b / a, 1 / yrs) - 1) * 100;
  }

  const pros = buildPros(f, cagr);
  const cons = buildCons(f, rangePos);

  return (
    <Shell>
      <div className="flex items-center gap-2 text-xs font-mono text-muted mb-5">
        <Link href="/screener" className="hover:text-amber">SCREENER</Link><span>/</span>
        <span className="text-body">{data.symbol}</span>
        <span className="ml-2 px-2 py-0.5 rounded border border-line text-[10px]">{market === "US" ? "US · NYSE/NASDAQ" : "NSE · INDIA"}</span>
      </div>

      {/* HERO */}
      <div className="glass p-6 md:p-8 fade-up">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-semibold grad-text leading-tight">{data.name || data.symbol}</h1>
            <div className="flex items-center gap-2.5 mt-1.5 text-sm text-muted font-mono">
              <span className="text-body">{data.symbol}</span>
              {data.sector && <><span>·</span><span>{data.sector}</span></>}
              {data.industry && <><span className="hidden sm:inline">·</span><span className="hidden sm:inline">{data.industry}</span></>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl md:text-4xl text-body tabular-nums">{c}{n2(px)}</div>
            <div className={`font-mono text-sm mt-1 ${clsOf(data.changePct)}`}>{pct(data.changePct)}</div>
          </div>
        </div>

        {history.length > 4 && <PriceChart data={history} cur={c} up={(data.changePct ?? 0) >= 0} />}

        <hr className="rule-grad my-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
          <Mini label="Market Cap" v={capFmt(f.marketCap, market)} />
          <Mini label="Stock P/E" v={n2(f.pe)} />
          <Mini label="Book Value" v={f.bookValue != null ? c + n2(f.bookValue) : "—"} />
          <Mini label="Dividend" v={f.dividend != null ? f.dividend + "%" : "—"} tone={f.dividend} />
          <Mini label="ROE" v={f.roe != null ? f.roe + "%" : "—"} tone={f.roe} />
          <Mini label="ROA" v={f.roa != null ? f.roa + "%" : "—"} tone={f.roa} />
          <Mini label="Open" v={data.open != null ? c + n2(data.open) : "—"} />
          <Mini label="High" v={data.high != null ? c + n2(data.high) : "—"} />
          <Mini label="Low" v={data.low != null ? c + n2(data.low) : "—"} />
          <Mini label="52W High" v={hi != null ? c + n2(hi) : "—"} />
          <Mini label="52W Low" v={lo != null ? c + n2(lo) : "—"} />
          <Mini label="Volume" v={data.volume != null ? Number(data.volume).toLocaleString("en-IN") : "—"} />
        </div>
      </div>

      {rangePos != null && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted mb-3">
            <span>52-WEEK RANGE</span>
            <span className="text-body/70">{rangePos <= 0.15 ? "near low" : rangePos >= 0.85 ? "near high" : "mid-range"}</span>
          </div>
          <div className="relative range-track"><div className="absolute -top-[3px] range-knob" style={{ left: `calc(${rangePos * 100}% - 6px)` }} /></div>
          <div className="flex items-center justify-between font-mono text-sm mt-3">
            <span className="text-loss">{c}{n2(lo)}</span><span className="text-muted text-xs">current {c}{n2(px)}</span><span className="text-gain">{c}{n2(hi)}</span>
          </div>
        </div>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="card p-5">
            <p className="eyebrow mb-3" style={{ color: "#2DD482" }}>Pros</p>
            {pros.length ? <ul className="space-y-2">{pros.map((p, i) => <li key={i} className="flex gap-2 text-sm text-body/85"><span className="text-gain mt-0.5">▲</span><span>{p}</span></li>)}</ul> : <p className="text-sm text-muted">No standout strengths in the available metrics.</p>}
          </div>
          <div className="card p-5">
            <p className="eyebrow mb-3" style={{ color: "#F0564F" }}>Cons</p>
            {cons.length ? <ul className="space-y-2">{cons.map((p, i) => <li key={i} className="flex gap-2 text-sm text-body/85"><span className="text-loss mt-0.5">▼</span><span>{p}</span></li>)}</ul> : <p className="text-sm text-muted">No notable red flags in the available metrics.</p>}
          </div>
        </div>
      )}

      {annual.length > 1 && (
        <div className="card p-5 mt-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-semibold">Revenue &amp; Profit</h2>
            <span className="text-xs text-muted">Annual{cagr != null ? ` · revenue CAGR ${cagr > 0 ? "+" : ""}${cagr.toFixed(1)}%` : ""}</span>
          </div>
          <BarChart series={annual} market={market} /><Legend />
        </div>
      )}

      {quarterly.length > 1 && (
        <div className="card p-5 mt-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-semibold">Quarterly Results</h2>
            <span className="text-xs text-muted">Revenue vs net profit</span>
          </div>
          <BarChart series={quarterly} market={market} /><Legend />
        </div>
      )}

      <Group title="Valuation" hint="What you pay for each rupee of value">
        <Stat label="P/E (TTM)" v={n2(f.pe)} /><Stat label="Forward P/E" v={n2(f.fwdPe)} />
        <Stat label="P/B" v={n2(f.pb)} /><Stat label="PEG" v={n2(f.peg)} />
        <Stat label="P/S" v={n2(f.ps)} /><Stat label="EV / EBITDA" v={n2(f.evEbitda)} />
        <Stat label="EPS (TTM)" v={f.eps != null ? c + n2(f.eps) : "—"} /><Stat label="Book Value" v={f.bookValue != null ? c + n2(f.bookValue) : "—"} />
      </Group>
      <Group title="Profitability" hint="How efficiently capital becomes profit">
        <Stat label="ROE" v={pv(f.roe)} tone={f.roe} /><Stat label="ROA" v={pv(f.roa)} tone={f.roa} />
        <Stat label="Gross Margin" v={pv(f.grossMargin)} tone={f.grossMargin} /><Stat label="Operating Margin" v={pv(f.operatingMargin)} tone={f.operatingMargin} />
        <Stat label="Net Margin" v={pv(f.netMargin)} tone={f.netMargin} />
      </Group>
      <Group title="Growth" hint="Year-on-year momentum (TTM)">
        <Stat label="Revenue Growth" v={pv(f.revenueGrowth)} tone={f.revenueGrowth} /><Stat label="Earnings Growth" v={pv(f.earningsGrowth)} tone={f.earningsGrowth} />
      </Group>
      <Group title="Financial Health & Risk" hint="Balance-sheet strength and volatility">
        <Stat label="Debt / Equity" v={n2(f.debtEquity)} /><Stat label="Current Ratio" v={n2(f.currentRatio)} />
        <Stat label="Beta" v={n2(f.beta)} /><Stat label="Dividend Yield" v={pv(f.dividend)} tone={f.dividend} />
        <Stat label="50-Day SMA" v={f.sma50 != null ? c + n2(f.sma50) : "—"} /><Stat label="200-Day SMA" v={f.sma200 != null ? c + n2(f.sma200) : "—"} />
      </Group>

      {(rec || f.targetPrice) && (
        <div className="card p-6 mt-4">
          <p className="eyebrow mb-4">Analyst View</p>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              {rec && (<>
                <div className="flex items-center justify-between text-xs font-mono text-muted mb-2"><span>SELL</span><span>HOLD</span><span>BUY</span></div>
                <div className="relative h-1.5 rounded-full" style={{ background: "linear-gradient(90deg,#F0564F,#F0A93B,#2DD482)" }}>
                  <div className="absolute -top-1.5 w-4 h-4 rounded-full bg-body" style={{ left: `calc(${rec.pos * 100}% - 8px)`, boxShadow: "0 0 0 3px rgba(5,5,6,.9)" }} />
                </div>
                <div className="mt-3 text-lg font-display font-semibold" style={{ color: rec.color }}>{rec.label}</div>
                {f.numAnalysts != null && <div className="text-xs text-muted mt-0.5">{f.numAnalysts} analysts covering</div>}
              </>)}
            </div>
            <div className="flex gap-8">
              <Mini label="Mean Target" v={f.targetPrice != null ? c + n2(f.targetPrice) : "—"} />
              {upside != null && <Mini label="Implied Upside" v={pct(upside)} tone={upside} />}
            </div>
          </div>
        </div>
      )}

      {data.about && (
        <div className="card p-6 mt-4">
          <p className="eyebrow mb-3">About</p>
          <p className="text-sm text-body/80 leading-relaxed">{data.about.length > 600 ? data.about.slice(0, 600) + "…" : data.about}</p>
        </div>
      )}

      <p className="font-mono text-[11px] text-muted mt-6">
        DATA: YAHOO FINANCE{market === "US" ? " · ~15 MIN DELAYED" : ""} · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </Shell>
  );
}

function buildPros(f, cagr) {
  const p = [];
  if (f.roe > 15) p.push(`Strong return on equity at ${f.roe}%.`);
  if (f.debtEquity != null && f.debtEquity < 30) p.push("Low debt — conservative balance sheet.");
  if (f.revenueGrowth > 10) p.push(`Revenue growing ${f.revenueGrowth}% year-on-year.`);
  if (cagr != null && cagr > 12) p.push(`Healthy ${cagr.toFixed(0)}% revenue CAGR over the period.`);
  if (f.netMargin > 15) p.push(`High net margin of ${f.netMargin}%.`);
  if (f.dividend > 2) p.push(`Pays a ${f.dividend}% dividend yield.`);
  if (f.pe != null && f.pe > 0 && f.pe < 15) p.push("Trading at a modest earnings multiple.");
  return p.slice(0, 5);
}
function buildCons(f, rangePos) {
  const c = [];
  if (f.debtEquity > 150) c.push(`Elevated debt-to-equity of ${f.debtEquity}.`);
  if (f.earningsGrowth != null && f.earningsGrowth < 0) c.push(`Earnings declined ${Math.abs(f.earningsGrowth)}% year-on-year.`);
  if (f.roe != null && f.roe < 8) c.push(`Low return on equity at ${f.roe}%.`);
  if (f.pe != null && f.pe > 60) c.push(`Rich valuation — P/E of ${f.pe.toFixed(0)}.`);
  if (rangePos != null && rangePos > 0.9) c.push("Trading near its 52-week high.");
  if (f.netMargin != null && f.netMargin < 5 && f.netMargin >= 0) c.push("Thin net margins.");
  if (f.currentRatio != null && f.currentRatio < 1) c.push("Current ratio below 1 — tight liquidity.");
  return c.slice(0, 5);
}

function PriceChart({ data, cur, up }) {
  const W = 760, H = 150, pad = 4;
  const ys = data.map((d) => d.c);
  const min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
  const x = (i) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.c).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const col = up ? "#2DD482" : "#F0564F";
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs font-mono text-muted mb-2">
        <span>1Y PRICE</span><span>{cur}{n2(min)} – {cur}{n2(max)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} preserveAspectRatio="none">
        <defs><linearGradient id="pcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.28" /><stop offset="100%" stopColor={col} stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill="url(#pcg)" />
        <path d={line} fill="none" stroke={col} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function BarChart({ series, market }) {
  const W = 760, H = 200, padL = 4, padB = 26, padT = 8;
  const vals = series.flatMap((s) => [s.revenue ?? 0, s.profit ?? 0]);
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0), span = max - min || 1;
  const groupW = (W - padL * 2) / series.length;
  const barW = Math.min(26, groupW * 0.32);
  const y = (v) => padT + (1 - (v - min) / span) * (H - padT - padB);
  const zero = y(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" style={{ height: 200 }}>
      <line x1="0" y1={zero} x2={W} y2={zero} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
      {series.map((s, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const ry = y(s.revenue ?? 0), py = y(s.profit ?? 0);
        return (
          <g key={i}>
            <rect x={cx - barW - 2} y={Math.min(ry, zero)} width={barW} height={Math.abs(zero - ry)} rx="2" fill="#F0A93B" opacity="0.9" />
            <rect x={cx + 2} y={Math.min(py, zero)} width={barW} height={Math.abs(zero - py)} rx="2" fill={(s.profit ?? 0) >= 0 ? "#7c5cfa" : "#F0564F"} opacity="0.95" />
            <text x={cx} y={H - 9} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#8A94A8">{s.label}</text>
          </g>
        );
      })}
      <text x={padL} y={padT + 8} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#8A94A8">{moneyShort(max, market)}</text>
    </svg>
  );
}
function Legend() {
  return (
    <div className="flex items-center gap-5 mt-2 text-xs text-muted font-mono">
      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: "#F0A93B" }} />Revenue</span>
      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: "#7c5cfa" }} />Net Profit</span>
    </div>
  );
}

const pv = (v) => (v == null ? "—" : `${Number(v).toFixed(2)}%`);
function Shell({ children }) { return <div className="max-w-shell mx-auto px-5 py-10">{children}</div>; }
function Mini({ label, v, tone }) {
  return (<div><div className="text-[11px] font-mono tracking-wider uppercase text-muted">{label}</div><div className={`font-mono text-sm mt-1 ${tone != null ? clsOf(tone) : "text-body"}`}>{v}</div></div>);
}
function Stat({ label, v, tone }) {
  return (<div className="stat card !rounded-lg px-4 py-3"><div className="text-[11px] font-mono tracking-wider uppercase text-muted">{label}</div><div className={`font-mono text-base mt-1 ${tone != null ? clsOf(tone) : "text-body"}`}>{v}</div></div>);
}
function Group({ title, hint, children }) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(135deg,#F0A93B,#7c5cfa)" }} />
        <h2 className="font-display text-lg font-semibold text-body">{title}</h2>
        <span className="text-xs text-muted">{hint}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}
function Empty({ sym, market }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-xl text-body mb-2">No data for {sym}</p>
      <p className="text-muted text-sm mb-5">This ticker isn't in the {market === "US" ? "US" : "NSE"} universe yet.</p>
      <Link href="/screener" className="btn-primary">Back to screener</Link>
    </div>
  );
}
