"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchStock } from "@/lib/config";

// ── formatting ───────────────────────────────────────────────
const num = (v, d = 2) => (v == null || isNaN(v) ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d > 0 ? Math.min(d, 2) : 0 }));
const pct = (v) => (v == null || isNaN(v) ? "—" : `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(2)}%`);
const cls = (v) => ((v ?? 0) > 0 ? "tick-up" : (v ?? 0) < 0 ? "tick-down" : "text-muted");
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
    const wake = setTimeout(() => alive && setStatus((s) => (s === "loading" ? "waking" : s)), 4000);
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

  if (status === "notfound")
    return <Shell><Empty sym={sym} market={market} /></Shell>;

  if (status !== "live" || !data)
    return <Shell><div className="card p-10 text-center text-muted">{status === "waking" ? "Waking the data engine — first load can take up to a minute on the free tier." : status === "error" ? "Data engine unreachable — the token may need a refresh." : `Loading ${sym}…`}</div></Shell>;

  const f = data.fundamentals || {};
  const c = cur(market);
  const hi = f.high52w, lo = f.low52w, px = data.price;
  const rangePos = hi && lo && px && hi > lo ? Math.min(1, Math.max(0, (px - lo) / (hi - lo))) : null;
  const rec = f.analystRec ? REC_MAP[f.analystRec] : null;
  const upside = f.targetPrice && px ? ((f.targetPrice - px) / px) * 100 : null;

  return (
    <Shell>
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted mb-5">
        <Link href="/screener" className="hover:text-amber">SCREENER</Link>
        <span>/</span>
        <span className="text-body">{data.symbol}</span>
        <span className="ml-2 px-2 py-0.5 rounded border border-line text-[10px]">{market === "US" ? "US · NYSE/NASDAQ" : "NSE · INDIA"}</span>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
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
            <div className="font-mono text-3xl md:text-4xl text-body tabular-nums">{c}{num(px)}</div>
            <div className={`font-mono text-sm mt-1 ${cls(data.changePct)}`}>
              {data.change != null ? `${data.change > 0 ? "+" : ""}${c}${num(data.change)} · ` : ""}{pct(data.changePct)}
            </div>
          </div>
        </div>

        {/* intraday OHLC strip */}
        <hr className="rule-grad my-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
          <Mini label="Open" v={data.open != null ? c + num(data.open) : "—"} />
          <Mini label="High" v={data.high != null ? c + num(data.high) : "—"} />
          <Mini label="Low" v={data.low != null ? c + num(data.low) : "—"} />
          <Mini label="Prev Close" v={data.prevClose != null ? c + num(data.prevClose) : "—"} />
          <Mini label="Volume" v={data.volume != null ? Number(data.volume).toLocaleString("en-IN") : "—"} />
          <Mini label="Market Cap" v={capFmt(f.marketCap, market)} />
        </div>
      </div>

      {/* ── 52-WEEK RANGE ────────────────────────────────── */}
      {rangePos != null && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted mb-3">
            <span>52-WEEK RANGE</span>
            <span className="text-body/70">{rangePos <= 0.15 ? "near low" : rangePos >= 0.85 ? "near high" : "mid-range"}</span>
          </div>
          <div className="relative range-track">
            <div className="absolute -top-[3px] range-knob" style={{ left: `calc(${rangePos * 100}% - 6px)` }} />
          </div>
          <div className="flex items-center justify-between font-mono text-sm mt-3">
            <span className="text-loss">{c}{num(lo)}</span>
            <span className="text-muted text-xs">current {c}{num(px)}</span>
            <span className="text-gain">{c}{num(hi)}</span>
          </div>
        </div>
      )}

      {/* ── FUNDAMENTALS GRID ────────────────────────────── */}
      <Group title="Valuation" hint="What you pay for each rupee of value">
        <Stat label="P/E (TTM)" v={num(f.pe)} />
        <Stat label="Forward P/E" v={num(f.fwdPe)} />
        <Stat label="P/B" v={num(f.pb)} />
        <Stat label="PEG" v={num(f.peg)} />
        <Stat label="P/S" v={num(f.ps)} />
        <Stat label="EV / EBITDA" v={num(f.evEbitda)} />
        <Stat label="EPS (TTM)" v={f.eps != null ? c + num(f.eps) : "—"} />
        <Stat label="Book Value" v={f.bookValue != null ? c + num(f.bookValue) : "—"} />
      </Group>

      <Group title="Profitability" hint="How efficiently the business turns capital into profit">
        <Stat label="ROE" v={pctv(f.roe)} tone={f.roe} />
        <Stat label="ROA" v={pctv(f.roa)} tone={f.roa} />
        <Stat label="Gross Margin" v={pctv(f.grossMargin)} tone={f.grossMargin} />
        <Stat label="Operating Margin" v={pctv(f.operatingMargin)} tone={f.operatingMargin} />
        <Stat label="Net Margin" v={pctv(f.netMargin)} tone={f.netMargin} />
      </Group>

      <Group title="Growth" hint="Year-on-year momentum (TTM)">
        <Stat label="Revenue Growth" v={pctv(f.revenueGrowth)} tone={f.revenueGrowth} />
        <Stat label="Earnings Growth" v={pctv(f.earningsGrowth)} tone={f.earningsGrowth} />
      </Group>

      <Group title="Financial Health & Risk" hint="Balance-sheet strength and volatility">
        <Stat label="Debt / Equity" v={num(f.debtEquity)} />
        <Stat label="Current Ratio" v={num(f.currentRatio)} />
        <Stat label="Beta" v={num(f.beta)} />
        <Stat label="Dividend Yield" v={pctv(f.dividend)} tone={f.dividend} />
        <Stat label="50-Day SMA" v={f.sma50 != null ? c + num(f.sma50) : "—"} />
        <Stat label="200-Day SMA" v={f.sma200 != null ? c + num(f.sma200) : "—"} />
      </Group>

      {/* ── ANALYST VIEW ─────────────────────────────────── */}
      {(rec || f.targetPrice) && (
        <div className="card p-6 mt-4">
          <p className="eyebrow mb-4">Analyst View</p>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              {rec && (
                <>
                  <div className="flex items-center justify-between text-xs font-mono text-muted mb-2">
                    <span>SELL</span><span>HOLD</span><span>BUY</span>
                  </div>
                  <div className="relative h-1.5 rounded-full" style={{ background: "linear-gradient(90deg,#F0564F,#F0A93B,#2DD482)" }}>
                    <div className="absolute -top-1.5 w-4 h-4 rounded-full bg-body" style={{ left: `calc(${rec.pos * 100}% - 8px)`, boxShadow: "0 0 0 3px rgba(10,15,30,.9)" }} />
                  </div>
                  <div className="mt-3 text-lg font-display font-semibold" style={{ color: rec.color }}>{rec.label}</div>
                  {f.numAnalysts != null && <div className="text-xs text-muted mt-0.5">{f.numAnalysts} analysts covering</div>}
                </>
              )}
            </div>
            <div className="flex gap-8">
              <Mini label="Mean Target" v={f.targetPrice != null ? c + num(f.targetPrice) : "—"} />
              {upside != null && <Mini label="Implied Upside" v={pct(upside)} tone={upside} />}
            </div>
          </div>
        </div>
      )}

      {/* ── ABOUT ────────────────────────────────────────── */}
      <div className="card p-6 mt-4">
        <p className="eyebrow mb-3">About</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Mini label="Sector" v={data.sector || "—"} />
          <Mini label="Industry" v={data.industry || "—"} />
          <Mini label="Listed On" v={market === "US" ? "NYSE / NASDAQ" : "NSE"} />
        </div>
      </div>

      <p className="font-mono text-[11px] text-muted mt-6">
        DATA: {data.dataSource?.price || "—"} (PRICE) · {data.dataSource?.fundamentals || "—"} (FUNDAMENTALS){market === "US" ? " · ~15 MIN DELAYED" : ""} · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </Shell>
  );
}

const pctv = (v) => (v == null ? "—" : `${v > 0 ? "" : ""}${Number(v).toFixed(2)}%`);

function Shell({ children }) {
  return <div className="max-w-shell mx-auto px-5 py-10">{children}</div>;
}

function Mini({ label, v, tone }) {
  return (
    <div>
      <div className="text-[11px] font-mono tracking-wider uppercase text-muted">{label}</div>
      <div className={`font-mono text-sm mt-1 ${tone != null ? cls(tone) : "text-body"}`}>{v}</div>
    </div>
  );
}

function Stat({ label, v, tone }) {
  return (
    <div className="stat card !rounded-lg px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider uppercase text-muted">{label}</div>
      <div className={`font-mono text-base mt-1 ${tone != null ? cls(tone) : "text-body"}`}>{v}</div>
    </div>
  );
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
      <p className="text-muted text-sm mb-5">
        This ticker isn't in the {market === "US" ? "US" : "NSE"} universe yet. Detailed fundamentals are available for screener-listed names.
      </p>
      <Link href="/screener" className="btn-primary">Back to screener</Link>
    </div>
  );
}
