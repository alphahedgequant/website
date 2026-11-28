"use client";
// AHQ Terminal panes. Each pane reads real AHQ endpoints only and prints its source/as-of time.
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  aggregateBars, sessionReturns, volumeVsNormal, sma, movers, sectorPerformance, breadth, rowChangePct,
  inr, n2, pctTxt, compactIN, slotLabel, nseStatus,
} from "@/lib/terminalData.mjs";
import {
  useQuote, useHistory, useCompany, useScreener, useUsScreener, useIndices, useUsIndices, useSignals, useFno, useIpo,
  useTrackerCalls, useChain,
} from "./useTerminalData";
import { COMMANDS, BY_CODE } from "./commands";
import MarketBreadthPanel from "@/components/MarketBreadthPanel";
import UnusualOptionsMonitor from "@/components/UnusualOptionsMonitor";
import DailyOptionsFlowArchive from "@/components/DailyOptionsFlowArchive";
import TerminalIntelligence from "@/components/TerminalIntelligence";

const OptionsDesk = dynamic(() => import("@/app/options/page"), { ssr: false, loading: () => <Loading what="option chain" /> });
const OptionsIntel = dynamic(() => import("@/components/options-intel/TerminalOptionsIntel"), { ssr: false, loading: () => <Loading what="options analytics" /> });
const SignalScanner = dynamic(() => import("@/app/scanner/page"), { ssr: false, loading: () => <Loading what="signal scanner" /> });
const Backtester = dynamic(() => import("@/app/backtest/page"), { ssr: false, loading: () => <Loading what="backtester" /> });
const TradingFloor = dynamic(() => import("@/app/terminal/TerminalTradingFloor"), { ssr: false, loading: () => <Loading what="trading floor" /> });
const RiskMonitor = dynamic(() => import("@/components/TerminalOperationalTabs").then(x => x.TerminalRiskWorkspace), { ssr: false });

const tone = v => (v > 0 ? "up" : v < 0 ? "dn" : "");
const timeIST = ms => (ms ? new Date(ms).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "—");
const dateIST = s => { const d = new Date(s); return Number.isNaN(+d) ? "—" : d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }); };

export function Loading({ what = "data" }) { return <div className="tm-empty">Loading {what}…</div>; }
export function Unavailable({ title = "Unavailable", children }) { return <div className="tm-empty"><b>{title}</b>{children && <span>{children}</span>}</div>; }
const Src = ({ children }) => <div className="tm-src">{children}</div>;
const Sec = ({ title, right, children }) => <section className="tm-sec"><header><h4>{title}</h4>{right && <span>{right}</span>}</header>{children}</section>;

function RangeBar({ low, high, value, label }) {
  if (!(low > 0) || !(high > low) || !(value > 0)) return <div className="tm-range"><span>{label}</span><span className="tm-muted">—</span></div>;
  const p = Math.max(0, Math.min(100, (value - low) / (high - low) * 100));
  return <div className="tm-range"><span>{label}</span><b>{n2(low)}</b><div className="tm-range-track"><i style={{ left: p + "%" }} /></div><b>{n2(high)}</b></div>;
}

// ---------------------------------------------------------------- Overview (DES)
export function OverviewPane({ ticker, onTicker, onOpen }) {
  const q = useQuote(ticker);
  const h = useHistory(ticker);
  const c = useCompany(ticker);
  const sig = useSignals();
  const quote = q.data;
  const co = c.data?.data;
  const f = co?.fundamentals || {};
  const price = Number(quote?.price) > 0 ? Number(quote.price) : null;
  const chg = Number.isFinite(Number(quote?.change)) ? Number(quote.change) : null;
  const pct = price != null && chg != null && price - chg > 0 ? chg / (price - chg) * 100 : null;
  const bestBid = quote?.bids?.[0], bestAsk = quote?.asks?.[0];
  const spread = bestBid?.price && bestAsk?.price ? bestAsk.price - bestBid.price : null;
  const returns = useMemo(() => sessionReturns(h.bars), [h.bars]);
  const signal = (sig.data?.data || []).find(s => s.symbol === ticker);
  const closes = useMemo(() => aggregateBars(h.bars, "1d").map(b => b.close), [h.bars]);
  const status = nseStatus();
  return (
    <div className="tm-pane-body">
      <div className="tm-quote-head">
        <div>
          <div className="tm-name">{co?.name || quote?.name || ticker} <span className="tm-muted">(NSE)</span> <span className={"tm-pill " + (status.open ? "on" : "")}>{status.open ? "OPEN" : "CLOSED"}</span></div>
          <div className="tm-price"><b>{price != null ? inr(price) : "—"}</b> <span className={tone(chg)}>{chg != null ? `${chg > 0 ? "+" : ""}${n2(chg)} (${pctTxt(pct)})` : ""}</span></div>
          <div className="tm-muted">{q.error ? q.error : quote ? `${quote.source || "Upstox"} · exchange time ${timeIST(Number(quote.timestamp))} IST` : "Loading quote…"}{!status.open && ` · ${status.next}`}</div>
        </div>
        <div className="tm-bidask">
          <div><span>Bid</span><b>{bestBid ? `${n2(bestBid.quantity, 0)} × ${n2(bestBid.price)}` : "—"}</b></div>
          <div><span>Ask</span><b>{bestAsk ? `${n2(bestAsk.quantity, 0)} × ${n2(bestAsk.price)}` : "—"}</b></div>
          <div><span>Spread</span><b>{spread != null ? `${n2(spread)} (${(spread / price * 100).toFixed(3)}%)` : "—"}</b></div>
          <div><span>Volume</span><b>{quote ? compactIN(Number(quote.volume)) : "—"}</b></div>
        </div>
      </div>
      <div className="tm-ranges">
        <RangeBar label="Day range" low={Number(quote?.dayLow)} high={Number(quote?.dayHigh)} value={price} />
        <RangeBar label="52W range" low={Number(f.low52w)} high={Number(f.high52w)} value={price} />
      </div>
      <Spark values={closes} onClick={() => onOpen?.("GP")} />
      <Sec title="Price return" right={h.bars.length ? `${aggregateBars(h.bars, "1d").length} sessions of 5-minute history` : null}>
        <div className="tm-chips">{returns.map(r => <span key={r.label}><i>{r.label}</i> <b className={tone(r.pct)}>{pctTxt(r.pct)}</b>{r.from && <em> from {r.from}</em>}</span>)}</div>
        {h.error && <Src>History: {h.error}</Src>}
      </Sec>
      <Sec title="Fundamentals" right={<button className="tm-link" onClick={() => onOpen?.("FA")}>Open financials →</button>}>
        {c.status === "loading" ? <Loading what="fundamentals" /> : !co ? <Unavailable title="No company summary">{c.error}</Unavailable> :
          <div className="tm-kv">
            {[
              ["Market cap", f.marketCap ? "₹" + compactIN(f.marketCap) : "—"], ["P/E (TTM)", n2(f.pe, 1)], ["Fwd P/E", n2(f.fwdPe, 1)], ["EPS", n2(f.eps)],
              ["P/B", n2(f.pb, 2)], ["EV/EBITDA", n2(f.evEbitda, 1)], ["ROE", f.roe != null ? f.roe.toFixed(2) + "%" : "—"], ["ROA", f.roa != null ? f.roa.toFixed(2) + "%" : "—"],
              ["Debt/Equity", n2(f.debtEquity, 1)], ["Gross margin", f.grossMargin != null ? f.grossMargin + "%" : "—"], ["Op margin", f.operatingMargin != null ? f.operatingMargin + "%" : "—"], ["Net margin", f.netMargin != null ? f.netMargin + "%" : "—"],
              ["Revenue growth", f.revenueGrowth != null ? f.revenueGrowth + "%" : "—"], ["Earnings growth", f.earningsGrowth != null ? f.earningsGrowth + "%" : "—"], ["Dividend", f.dividend != null ? f.dividend + "%" : "—"], ["Beta", n2(f.beta, 2)],
              ["SMA 50", n2(f.sma50)], ["SMA 200", n2(f.sma200)], ["Book value", n2(f.bookValue)], ["Current ratio", n2(f.currentRatio, 2)],
            ].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>}
        {co && <Src>{c.data.provider} · retrieved {timeIST(Date.parse(c.data.retrievedAt))} IST. Summary price {n2(co.price)} may lag the live quote above.</Src>}
      </Sec>
      {signal && <Sec title="Quant signal" right={<button className="tm-link" onClick={() => onOpen?.("SCAN")}>Open scanner →</button>}>
        <div className="tm-kv">
          {[["Reading", signal.direction], ["Confidence", signal.confidence + "/100"], ["RSI", n2(signal.rsi, 0)], ["Z-score", n2(signal.zscore, 2)], ["Momentum 20", pctTxt(signal.momentum20, 1)], ["EMA trend", signal.emaBullish ? "Bullish" : "Bearish"],
            ["Model stop", n2(signal.stop)], ["Model target", n2(signal.target)]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
        </div>
        <Src>AHQ signal scanner — a rules-based reading, not a recommendation.</Src>
      </Sec>}
      {co && <Sec title="Profile">
        <div className="tm-kv">{[["Sector", co.sector || "Unclassified"], ["Industry", co.industry || "—"], ["Analysts", f.numAnalysts ? `${f.numAnalysts} · ${String(f.analystRec || "").replace(/_/g, " ")}` : "—"], ["Consensus target", f.targetPrice ? `${n2(f.targetPrice)} (${pctTxt(price ? (f.targetPrice / price - 1) * 100 : null, 1)})` : "—"]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        {co.about && <p className="tm-desc">{co.about}</p>}
      </Sec>}
    </div>
  );
}

function Spark({ values, onClick }) {
  if (!values || values.length < 2) return null;
  const W = 800, H = 90, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - 4 - ((v - min) / span) * (H - 8)}`).join(" ");
  const up = values.at(-1) >= values[0];
  return <button type="button" className="tm-spark" onClick={onClick} title="Open chart">
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={up ? "var(--tm-up)" : "var(--tm-dn)"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
  </button>;
}

// ---------------------------------------------------------------- Chart (GP)
export function ChartPane({ ticker }) {
  const h = useHistory(ticker);
  const [tf, setTf] = useState("15m");
  const [ma, setMa] = useState({ 20: true, 50: false });
  const [hover, setHover] = useState(null);
  const bars = useMemo(() => { const a = aggregateBars(h.bars, tf); return a.slice(-(tf === "1d" ? 120 : 160)); }, [h.bars, tf]);
  const closes = bars.map(b => b.close);
  const m20 = useMemo(() => sma(closes, 20), [bars]); // eslint-disable-line
  const m50 = useMemo(() => sma(closes, 50), [bars]); // eslint-disable-line
  if (h.status === "loading") return <Loading what="price history" />;
  if (!bars.length) return <Unavailable title="No verified price history">{h.error}</Unavailable>;
  const W = 900, H = 360, VOLH = 70, pad = { l: 8, r: 64, t: 10, b: 22 };
  const lo = Math.min(...bars.map(b => b.low)), hi = Math.max(...bars.map(b => b.high)), span = hi - lo || 1;
  const vmax = Math.max(1, ...bars.map(b => b.volume || 0));
  const cw = (W - pad.l - pad.r) / bars.length;
  const x = i => pad.l + i * cw + cw / 2;
  const y = v => pad.t + (hi - v) / span * (H - pad.t - pad.b - VOLH);
  const vy = v => H - pad.b - (v / vmax) * (VOLH - 8);
  const line = arr => arr.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
  const last = bars.at(-1), cur = hover != null ? bars[hover] : last;
  const label = b => (tf === "1d" ? b.day : `${b.day.slice(5)} ${slotLabel(b.minute)}`);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => lo + span * p);
  return (
    <div className="tm-pane-body">
      <div className="tm-toolbar">
        {["5m", "15m", "1h", "1d"].map(t => <button key={t} aria-pressed={tf === t} onClick={() => setTf(t)}>{t.toUpperCase()}</button>)}
        <span className="tm-sep" />
        {[20, 50].map(n => <button key={n} aria-pressed={ma[n]} onClick={() => setMa(m => ({ ...m, [n]: !m[n] }))}>SMA {n}</button>)}
        <span className="tm-ohlc">{label(cur)} · O {n2(cur.open)} H {n2(cur.high)} L {n2(cur.low)} C <b className={tone(cur.close - cur.open)}>{n2(cur.close)}</b> · V {compactIN(cur.volume)}</span>
      </div>
      <svg className="tm-chart" viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(null)}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; const i = Math.floor((px - pad.l) / cw); setHover(i >= 0 && i < bars.length ? i : null); }}>
        {ticks.map((v, i) => <g key={i}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="tm-grid" /><text x={W - pad.r + 6} y={y(v) + 4} className="tm-axis">{n2(v)}</text></g>)}
        {bars.map((b, i) => {
          const upc = b.close >= b.open;
          return <g key={b.t} className={upc ? "c-up" : "c-dn"}>
            <line x1={x(i)} x2={x(i)} y1={y(b.high)} y2={y(b.low)} />
            <rect x={x(i) - Math.max(1, cw * 0.35)} width={Math.max(1, cw * 0.7)} y={y(Math.max(b.open, b.close))} height={Math.max(1, Math.abs(y(b.open) - y(b.close)))} />
            {b.volume != null && <rect className="vol" x={x(i) - Math.max(1, cw * 0.35)} width={Math.max(1, cw * 0.7)} y={vy(b.volume)} height={H - pad.b - vy(b.volume)} />}
          </g>;
        })}
        {ma[20] && <polyline points={line(m20)} className="tm-ma20" />}
        {ma[50] && <polyline points={line(m50)} className="tm-ma50" />}
        <line x1={pad.l} x2={W - pad.r} y1={y(last.close)} y2={y(last.close)} className="tm-last" />
        <rect x={W - pad.r + 2} y={y(last.close) - 8} width={pad.r - 4} height={16} className="tm-last-tag" />
        <text x={W - pad.r + 6} y={y(last.close) + 4} className="tm-last-txt">{n2(last.close)}</text>
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="tm-cross" />}
        {[0, Math.floor(bars.length / 3), Math.floor(bars.length * 2 / 3), bars.length - 1].map((i, k) => <text key={k} x={x(i)} y={H - 6} className="tm-axis" textAnchor={k === 0 ? "start" : k === 3 ? "end" : "middle"}>{label(bars[i])}</text>)}
      </svg>
      <Src>Upstox 5-minute candles via AHQ ({h.bars.length} bars, {aggregateBars(h.bars, "1d").length} sessions; times IST). Larger timeframes are aggregated from 5-minute bars.</Src>
    </div>
  );
}

// ---------------------------------------------------------------- Financials (FA)
export function FinancialsPane({ ticker, onTicker, onOpen }) {
  const c = useCompany(ticker);
  const co = c.data?.data;
  const rows = (arr, kind) => (arr || []).map((r, i) => ({ label: r.label || `${kind} ${i + 1} (unlabeled)`, revenue: r.revenue, profit: r.profit, margin: r.revenue ? r.profit / r.revenue * 100 : null }));
  const Tbl = ({ title, data }) => <Sec title={title}>{!data.length ? <Unavailable title="Not provided" /> :
    <table className="tm-table"><thead><tr><th>Period</th><th>Revenue</th><th>Net profit</th><th>Net margin</th></tr></thead>
      <tbody>{data.map(r => <tr key={r.label}><td>{r.label}</td><td>₹{compactIN(r.revenue)}</td><td className={tone(r.profit)}>₹{compactIN(r.profit)}</td><td>{r.margin == null ? "—" : r.margin.toFixed(1) + "%"}</td></tr>)}</tbody></table>}</Sec>;
  return (
    <div className="tm-pane-body">
      {c.status === "loading" ? <Loading what="financials" /> : !co ? <Unavailable title="No company summary">{c.error}</Unavailable> : <>
        <Tbl title="Quarterly" data={rows(co.quarterly, "Quarter")} />
        <Tbl title="Annual" data={rows(co.annual, "Year")} />
        <Src>{c.data.provider}. Rows are shown in the provider's order with its period labels. The provider sends annual periods without labels, so they are numbered, not dated.</Src>
      </>}
      <Sec title="Audited statements, filings & research">
        <div className="tm-embed qt-integrated-app"><TerminalIntelligence key={ticker} symbol={ticker} tab="COMPANY" onChoose={s => onTicker?.(s)} onForecast={() => onOpen?.("FCST")} /></div>
      </Sec>
    </div>
  );
}

export function IntelPane({ ticker, onTicker, onOpen, tab }) {
  return <div className="tm-pane-body tm-embed qt-integrated-app"><TerminalIntelligence key={ticker + tab} symbol={ticker} tab={tab} onChoose={s => onTicker?.(s)} onForecast={() => onOpen?.("FCST")} /></div>;
}

// ---------------------------------------------------------------- Analysts (ANR)
export function AnalystsPane({ ticker }) {
  const calls = useTrackerCalls();
  const c = useCompany(ticker);
  const q = useQuote(ticker);
  const f = c.data?.data?.fundamentals || {};
  const price = Number(q.data?.price) > 0 ? Number(q.data.price) : null;
  const list = (calls.data?.calls || []).filter(x => String(x.symbol).toUpperCase() === ticker).sort((a, b) => String(b.call_date).localeCompare(String(a.call_date)));
  return (
    <div className="tm-pane-body">
      <Sec title="Consensus">
        <div className="tm-kv">
          {[["Target", f.targetPrice ? n2(f.targetPrice) : "—"], ["Upside vs live", price && f.targetPrice ? pctTxt((f.targetPrice / price - 1) * 100, 1) : "—"], ["Rating", f.analystRec ? String(f.analystRec).replace(/_/g, " ") : "—"], ["Analysts", f.numAnalysts ?? "—"]]
            .map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
        </div>
        <Src>{c.data?.provider || "Company summary"} — consensus fields as provided.</Src>
      </Sec>
      <Sec title="Tracked brokerage calls" right={<a className="tm-link" href="/tracker">Analyst Trust Tracker →</a>}>
        {calls.status === "loading" ? <Loading what="calls" /> : !list.length ? <Unavailable title={`No tracked calls for ${ticker}`}>Calls appear here when added to the AHQ tracker with a source.</Unavailable> :
          <table className="tm-table"><thead><tr><th>Date</th><th>House</th><th>Rating</th><th>Target</th><th>Price at call</th><th>Upside now</th><th>Source</th></tr></thead>
            <tbody>{list.slice(0, 40).map(x => { const t = Number(x.target_price); return <tr key={x.id}><td>{dateIST(x.call_date)}</td><td>{x.house}</td><td>{x.rating}</td><td>{n2(t)}</td><td>{n2(Number(x.price_at_call))}</td>
              <td className={tone(price && t ? t - price : null)}>{price && t ? pctTxt((t / price - 1) * 100, 1) : "—"}</td><td className="tm-muted">{x.verification_status === "verified" ? "verified" : "unverified"}{x.source_url ? <> · <a href={x.source_url} target="_blank" rel="noreferrer">link</a></> : ""}</td></tr>; })}</tbody></table>}
      </Sec>
    </div>
  );
}

// ---------------------------------------------------------------- Options
export function OpxPane({ ticker, onTicker }) {
  const ch = useChain(ticker);
  return <div className="tm-pane-body tm-embed qt-integrated-app"><OptionsIntel symbol={ticker} setSymbol={s => onTicker?.(s)} chain={ch.data?.data || null} chainError={ch.error} onRefresh={ch.reload} /></div>;
}
export function OmonPane({ ticker }) {
  return <div className="tm-pane-body tm-embed qt-integrated-app"><OptionsDesk key={ticker} initialUnderlying={ticker} embedded /></div>;
}
export function FlowPane({ ticker, onTicker, onOpen }) {
  const fno = useFno();
  const list = (fno.data?.data || []).map(x => x.symbol);
  const open = t => { onTicker?.(t); onOpen?.("OMON"); };
  return <div className="tm-pane-body tm-embed qt-integrated-app">
    <UnusualOptionsMonitor selectedTicker={ticker || "NIFTY"} stockOptions={list} onOpenChain={open} />
    <DailyOptionsFlowArchive selectedTicker={ticker || ""} stockOptions={list} onOpenChain={open} />
  </div>;
}

// ---------------------------------------------------------------- Depth (L2)
export function DepthPane({ ticker }) {
  const q = useQuote(ticker);
  const bids = q.data?.bids || [], asks = q.data?.asks || [];
  const n = Math.min(bids.length, asks.length);
  const bq = bids.slice(0, n).reduce((s, x) => s + Number(x.quantity || 0), 0), aq = asks.slice(0, n).reduce((s, x) => s + Number(x.quantity || 0), 0);
  const imb = bq + aq > 0 && n > 0 ? (bq - aq) / (bq + aq) * 100 : null;
  const max = Math.max(1, ...[...bids, ...asks].map(x => Number(x.quantity || 0)));
  const rows = Array.from({ length: 5 }, (_, i) => [bids[i], asks[i]]);
  const bb = bids[0]?.price, ba = asks[0]?.price, spr = bb && ba ? ba - bb : null;
  return (
    <div className="tm-pane-body">
      {q.status === "loading" ? <Loading what="depth" /> : q.error && !q.data ? <Unavailable title="Depth unavailable">{q.error}</Unavailable> : <>
        <div className="tm-kv tm-kv4">
          {[["Best bid", bb ? n2(bb) : "—"], ["Best ask", ba ? n2(ba) : "—"], ["Spread", spr != null ? `${n2(spr)} · ${(spr / ((bb + ba) / 2) * 100).toFixed(3)}%` : "—"],
            ["Imbalance", imb == null ? (n ? "—" : "One side empty") : `${imb > 0 ? "+" : ""}${imb.toFixed(1)}% (${n} level${n > 1 ? "s" : ""})`]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
        </div>
        <table className="tm-table tm-depth"><thead><tr><th>Orders</th><th>Bid qty</th><th>Bid</th><th>Ask</th><th>Ask qty</th><th>Orders</th></tr></thead>
          <tbody>{rows.map(([b, a], i) => <tr key={i}>
            <td className="tm-muted">{b?.orders ?? "—"}</td>
            <td className="tm-bar-cell"><i className="bid" style={{ width: (Number(b?.quantity || 0) / max * 100) + "%" }} />{b ? n2(Number(b.quantity), 0) : "—"}</td>
            <td className="up">{b ? n2(b.price) : "—"}</td><td className="dn">{a ? n2(a.price) : "—"}</td>
            <td className="tm-bar-cell"><i className="ask" style={{ width: (Number(a?.quantity || 0) / max * 100) + "%" }} />{a ? n2(Number(a.quantity), 0) : "—"}</td>
            <td className="tm-muted">{a?.orders ?? "—"}</td></tr>)}</tbody></table>
        <Src>Top-5 displayed depth from {q.data?.source || "Upstox"} · {timeIST(Number(q.data?.timestamp))} IST. Imbalance = (bid qty − ask qty) ÷ total over the same number of levels on both sides. Resting orders are not executed trades; this is not full depth.{!nseStatus().open && " Outside market hours the book is usually empty or stale."}</Src>
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- Volume vs normal (VOL)
export function VolumePane({ ticker }) {
  const h = useHistory(ticker);
  const [lookback, setLookback] = useState(15);
  const [cum, setCum] = useState(true);
  const v = useMemo(() => volumeVsNormal(h.bars, { lookback, cumulative: cum }), [h.bars, lookback, cum]);
  if (h.status === "loading") return <Loading what="volume history" />;
  if (!v.points.length) return <Unavailable title="No intraday volume">{h.error}</Unavailable>;
  const W = 900, H = 240, pad = { l: 8, r: 70, t: 10, b: 22 };
  const max = Math.max(1, ...v.points.flatMap(p => [p.today, p.p75 || 0, p.mean || 0]));
  const x = i => pad.l + (i / Math.max(1, v.points.length - 1)) * (W - pad.l - pad.r);
  const y = val => pad.t + (1 - val / max) * (H - pad.t - pad.b);
  const path = k => v.points.map((p, i) => (p[k] == null ? null : `${x(i)},${y(p[k])}`)).filter(Boolean).join(" ");
  const band = v.points.filter(p => p.p25 != null).map((p, i) => [x(i), y(p.p75), y(p.p25)]);
  const last = v.last;
  return (
    <div className="tm-pane-body">
      <div className="tm-toolbar">
        <span className="tm-muted">Baseline</span>{[5, 10, 15, 20, 30].map(n => <button key={n} aria-pressed={lookback === n} onClick={() => setLookback(n)}>{n}</button>)}
        <span className="tm-sep" /><button aria-pressed={cum} onClick={() => setCum(true)}>Cumulative</button><button aria-pressed={!cum} onClick={() => setCum(false)}>Per bar</button>
      </div>
      <div className="tm-kv tm-kv4">
        {[["Session", v.session], [`Today by ${last.time}`, compactIN(last.today)], ["Normal (mean)", compactIN(last.mean)], ["RVOL", last.rvol == null ? "—" : `${last.rvol.toFixed(2)}× · ${v.band}`]].map(([k, val]) => <div key={k}><span>{k}</span><b>{val}</b></div>)}
      </div>
      <svg className="tm-chart" viewBox={`0 0 ${W} ${H}`}>
        {band.length > 1 && <polygon className="tm-band" points={[...band.map(([bx, t]) => `${bx},${t}`), ...[...band].reverse().map(([bx, , b]) => `${bx},${b}`)].join(" ")} />}
        <polyline points={path("median")} className="tm-l-median" />
        <polyline points={path("mean")} className="tm-l-mean" />
        <polyline points={path("today")} className="tm-l-today" />
        {[0.5, 1].map(p => <text key={p} x={W - pad.r + 6} y={y(max * p) + 4} className="tm-axis">{compactIN(max * p)}</text>)}
        {[0, Math.floor(v.points.length / 2), v.points.length - 1].map((i, k) => <text key={k} x={x(i)} y={H - 6} className="tm-axis" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>{v.points[i].time}</text>)}
      </svg>
      <div className="tm-legend"><span className="l-today">Today</span><span className="l-mean">Mean</span><span className="l-median">Median</span><span className="l-band">25th–75th percentile</span></div>
      <Src>Baseline: previous {v.baselineSessions} session(s) from the last {lookback}, matched to the same IST time; a past session counts for a time slot only if it has every bar up to that slot (missing bars are not zeros). The latest bar may still be forming. Bands: &lt;0.75× below normal · 0.75–1.25× typical · 1.25–2× elevated · 2–3× unusual · &gt;3× extreme. Not trading advice.</Src>
    </div>
  );
}

// ---------------------------------------------------------------- Risk & backtest
export function RiskPane({ ticker }) {
  const h = useHistory(ticker);
  return <div className="tm-pane-body tm-embed qt-integrated-app"><RiskMonitor symbol={ticker} candles={h.data?.data || []} historyError={h.error} /><Backtester key={ticker} initialSymbol={ticker} embedded /></div>;
}
export function ScanPane({ onTicker, onOpen }) {
  return <div className="tm-pane-body tm-embed qt-integrated-app"><SignalScanner embedded onOpenTicker={t => { onTicker?.(t); onOpen?.("DES"); }} /></div>;
}

// ---------------------------------------------------------------- Notes
export function NotesPane({ ticker }) {
  const key = `ahq-terminal-note:${ticker}`;
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(null);
  useEffect(() => { try { setText(localStorage.getItem(key) || ""); setSaved(null); } catch { setText(""); } }, [key]);
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(key, text); setSaved(Date.now()); } catch { /* ignore */ } }, 600);
    return () => clearTimeout(t);
  }, [text, key]);
  return <div className="tm-pane-body">
    <textarea className="tm-notes" value={text} onChange={e => setText(e.target.value.slice(0, 20000))} placeholder={`Private notes for ${ticker}…`} aria-label={`Notes for ${ticker}`} />
    <Src>Saved in this browser only{saved ? ` · ${timeIST(saved)} IST` : ""}. Not shared or uploaded.</Src>
  </div>;
}

// ---------------------------------------------------------------- Markets
function MoverTable({ rows, onTicker, cur = "₹" }) {
  return <table className="tm-table"><thead><tr><th>#</th><th>Ticker</th><th className="tm-left">Name</th><th>Last</th><th>Chg%</th><th>Volume</th><th>Value</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.symbol} onClick={() => onTicker?.(r.symbol)}><td className="tm-muted">{i + 1}</td><td><b>{r.symbol}</b></td><td className="tm-trunc">{r.name}</td><td>{cur}{n2(Number(r.price))}</td>
      <td className={tone(r.dayPct)}>{pctTxt(r.dayPct)}{r.pctDerived ? "*" : ""}</td><td>{compactIN(Number(r.volume))}</td><td>{r.value != null ? cur + compactIN(r.value) : "—"}</td></tr>)}</tbody></table>;
}
export function MoversPane(props) { return props.us ? <UsMovers {...props} /> : <InMovers {...props} />; }
function InMovers(props) { const s = useScreener(); return <MoversView {...props} s={s} us={false} />; }
function UsMovers(props) { const s = useUsScreener(); return <MoversView {...props} s={s} us />; }
function MoversView({ onTicker, us, s }) {
  const [tab, setTab] = useState("gainers");
  const [minPrice, setMinPrice] = useState(us ? 1 : 10);
  const m = useMemo(() => movers(s.data?.data || [], { minPrice, limit: 40 }), [s.data, minPrice]);
  return <div className="tm-pane-body">
    <div className="tm-toolbar">
      {[["gainers", "Gainers"], ["losers", "Losers"], ["active", "Most traded (value)"]].map(([k, l]) => <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      <span className="tm-sep" /><span className="tm-muted">Min price</span>
      <select value={minPrice} onChange={e => setMinPrice(Number(e.target.value))}>{[0, 1, 10, 50, 100].map(v => <option key={v} value={v}>{us ? "$" : "₹"}{v}</option>)}</select>
    </div>
    {s.status === "loading" ? <Loading what="movers" /> : !m.total ? <Unavailable title="No screener data">{s.error}</Unavailable> : <MoverTable rows={m[tab]} onTicker={us ? null : onTicker} cur={us ? "$" : "₹"} />}
    <Src>{us ? "AHQ US screener (Yahoo, delayed)" : "AHQ NSE screener (Upstox prices)"} · {m.total} symbols · fetched {s.at ? timeIST(s.at) : "—"} IST.{m.derivedCount ? ` * ${m.derivedCount} % changes recomputed from the provider's change ÷ (price − change) because its % field read 0.` : ""}</Src>
  </div>;
}
export function WeiPane({ onTicker }) {
  const a = useIndices(), b = useUsIndices();
  const rows = [
    ...Object.entries(a.data?.data || {}).map(([k, v]) => ({ region: "India", k, ...v, pct: v.prevClose ? (v.change / v.prevClose) * 100 : (v.value && v.change && v.value - v.change > 0 ? v.change / (v.value - v.change) * 100 : null), src: "Upstox" })),
    ...Object.entries(b.data?.data || {}).map(([k, v]) => ({ region: "United States", k, ...v, pct: v.changePct, src: v.priceSource || "Yahoo (delayed)" })),
  ];
  return <div className="tm-pane-body">
    {!rows.length ? <Loading what="indices" /> :
      <table className="tm-table"><thead><tr><th>Region</th><th>Index</th><th>Last</th><th>Chg</th><th>Chg%</th><th>As of (IST)</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.region + r.k} onClick={() => r.region === "India" && onTicker?.(r.k === "NIFTY50" ? "NIFTY" : r.k)}><td className="tm-muted">{r.region}</td><td><b>{r.k === "NIFTY50" ? "NIFTY 50" : r.k}</b></td><td>{n2(r.value)}</td>
          <td className={tone(r.change)}>{r.change ? n2(r.change) : "—"}</td><td className={tone(r.pct)}>{r.pct ? pctTxt(r.pct) : "—"}</td><td className="tm-muted">{r.priceAsOf ? timeIST(Date.parse(r.priceAsOf)) : a.data?.fetchedAt && r.region === "India" ? timeIST(Date.parse(a.data.fetchedAt)) : "—"}</td></tr>)}</tbody></table>}
    <Src>India: NIFTY 50, BANK NIFTY, NIFTY IT via Upstox (a move shows only when the provider sends a previous close). US: S&amp;P 500, Nasdaq, Dow, VIX via Yahoo, delayed. Other world indices are not connected.</Src>
  </div>;
}
export function SectorsPane({ onTicker }) {
  const s = useScreener();
  const p = useMemo(() => sectorPerformance(s.data?.data || []), [s.data]);
  const b = useMemo(() => breadth(s.data?.data || []), [s.data]);
  const max = Math.max(0.01, ...p.sectors.map(x => Math.abs(x.avg)));
  return <div className="tm-pane-body">
    {s.status === "loading" ? <Loading what="sectors" /> : <>
      <div className="tm-kv tm-kv4">{[["Advancers", b.up], ["Decliners", b.down], ["Unchanged", b.flat], ["A/D ratio", b.down ? (b.up / b.down).toFixed(2) : "—"]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
      {!p.sectors.length ? <Unavailable title="No classified sectors yet" /> :
        <table className="tm-table"><thead><tr><th>Sector</th><th>Stocks</th><th>Avg move</th><th></th><th>Up / Down</th><th>Best</th><th>Worst</th></tr></thead>
          <tbody>{p.sectors.map(x => <tr key={x.sector}><td><b>{x.sector}</b></td><td>{x.n}</td><td className={tone(x.avg)}>{pctTxt(x.avg)}</td>
            <td className="tm-bar-cell wide"><i className={x.avg >= 0 ? "bid" : "ask"} style={{ width: Math.abs(x.avg) / max * 100 + "%" }} /></td><td>{x.up} / {x.down}</td>
            <td onClick={() => onTicker?.(x.best.symbol)} className="tm-click">{x.best.symbol} <span className="up">{pctTxt(x.best.pct, 1)}</span></td>
            <td onClick={() => onTicker?.(x.worst.symbol)} className="tm-click">{x.worst.symbol} <span className="dn">{pctTxt(x.worst.pct, 1)}</span></td></tr>)}</tbody></table>}
      <Src>Equal-weight average of provider-classified NSE stocks only. {p.unclassified} of {p.total} stocks have no verified sector yet and are excluded — coverage is incomplete, so this is not an index-weighted sector return.</Src>
    </>}
  </div>;
}
export function BreadthPane({ onTicker }) { return <div className="tm-pane-body tm-embed qt-integrated-app"><MarketBreadthPanel onChoose={s => onTicker?.(s)} /></div>; }
export function IpoPane() {
  const r = useIpo();
  const b = r.data?.buckets || {};
  const sections = [["open", "Open now"], ["upcoming", "Upcoming"], ["pipeline", "Awaiting dates"], ["listed", "Recently listed"], ["closed", "Closed"]];
  return <div className="tm-pane-body">
    {r.status === "loading" ? <Loading what="IPOs" /> : !r.data ? <Unavailable title="IPO feed unavailable">{r.error}</Unavailable> :
      sections.map(([k, l]) => (b[k] || []).length ? <Sec key={k} title={`${l} · ${(b[k] || []).length}`}>
        <table className="tm-table"><thead><tr><th>Company</th><th>Board</th><th>Price band</th><th>Open</th><th>Close</th><th>Listing</th><th>GMP (unofficial)</th><th>Listing gain</th></tr></thead>
          <tbody>{(b[k] || []).slice(0, 15).map(x => <tr key={x.id} onClick={() => window.open(`/ipo/${x.id}`, "_self")}><td><b>{x.name}</b></td><td>{x.segment || "—"}</td><td>{x.priceBand || "—"}</td>
            <td>{x.open || "—"}</td><td>{x.close || "—"}</td><td>{x.listingDate || "—"}</td>
            <td>{x.gmp != null && !x.gmpDisputed ? `₹${n2(x.gmp)}${x.gmpPct != null ? ` (${pctTxt(x.gmpPct, 1)})` : ""}` : x.gmpDisputed ? "disputed" : "—"}</td>
            <td className={tone(x.listingGain)}>{x.listingGain != null ? pctTxt(x.listingGain) : "—"}</td></tr>)}</tbody></table></Sec> : null)}
    <Src>AHQ IPO Intelligence · source {r.data?.source || "—"}{r.data?.fetchedAt ? ` · fetched ${timeIST(Date.parse(r.data.fetchedAt))} IST` : ""}. GMP is unofficial and not exchange-verified. <a className="tm-link" href="/ipo">Open IPO Intelligence →</a></Src>
  </div>;
}
export function HelpPane({ onRun }) {
  const groups = [...new Set(COMMANDS.map(c => c.group))];
  return <div className="tm-pane-body">
    <Sec title="How it works">
      <p className="tm-desc">Type a ticker (e.g. <kbd>RELIANCE</kbd>), a command (e.g. <kbd>GP</kbd>) or both (<kbd>INFY ANR</kbd>) in the command bar. Panes marked ⧉ follow the linked ticker; click ⧉ to pin a pane to its own ticker. Workspaces keep their own layout in this browser.</p>
      <div className="tm-kv tm-kv4">{[["⌘K / Ctrl K", "Command bar"], ["/", "Focus command bar"], ["?", "This help"], ["Alt 1–9", "Switch workspace"], ["Alt [ / Alt ]", "Previous / next tab in the focused tile"], ["Alt W", "Close the active pane"], ["Esc", "Close command bar"], ["↑ ↓ Enter", "Move and run in the command bar"]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
    </Sec>
    {groups.map(g => <Sec key={g} title={g}><table className="tm-table"><tbody>{COMMANDS.filter(c => c.group === g).map(c => <tr key={c.code} onClick={() => onRun?.(c.code)}><td><kbd>{c.code}</kbd></td><td><b>{c.title}</b></td><td className="tm-muted">{c.desc}</td></tr>)}</tbody></table></Sec>)}
    <Src>Data: Upstox (NSE quotes, depth, 5-minute candles, option chains), Yahoo via AHQ backend (company summaries, US indices and screener), AHQ datasets (signals, IPO, tracker, options archive). Markets data may be delayed; nothing here is investment advice.</Src>
  </div>;
}

// ---------------------------------------------------------------- Trading floor (FLOOR)
const FLOOR_WATCH = ["RELIANCE", "HDFCBANK", "ICICIBANK", "TCS", "INFY", "SBIN", "ITC", "LT"];
function FloorLineChart({ points, keys = [["today", "#fff"], ["median", "#c5c5c5"], ["mean", "#888"]], height = 230 }) {
  if (!points?.length) return <div className="qt-empty">No verified intraday candles for this instrument.</div>;
  const W = 900, H = height, l = 56, r = 14, t = 17, b = 30;
  const max = Math.max(1, ...points.flatMap(p => keys.map(([k]) => Number(p[k]) || 0)));
  const x = i => l + (W - l - r) * i / Math.max(1, points.length - 1), y = v => H - b - (Number(v || 0) / max) * (H - t - b);
  return <svg viewBox={`0 0 ${W} ${H}`} className="qt-svg" role="img" aria-label="Intraday volume against the same-time baseline">
    {[0, .5, 1].map(v => <g key={v}><line x1={l} x2={W - r} y1={y(max * v)} y2={y(max * v)} stroke="#222" /><text x={l - 8} y={y(max * v) + 4} fill="#888" fontSize="11" textAnchor="end">{compactIN(max * v)}</text></g>)}
    {keys.map(([key, color]) => { const d = points.map((p, i) => (p[key] == null ? null : `${x(i)},${y(p[key])}`)).filter(Boolean); return d.length > 1 ? <polyline key={key} points={d.join(" ")} stroke={color} fill="none" strokeWidth={key === "today" ? 3 : 2} strokeDasharray={key === "today" ? "none" : "6 5"} /> : null; })}
    {[0, Math.floor(points.length / 2), points.length - 1].map(i => <text key={i} x={x(i)} y={H - 8} fill="#888" fontSize="11" textAnchor="middle">{points[i].time}</text>)}
  </svg>;
}
export function FloorPane({ ticker, onTicker, onOpen }) {
  const q = useQuote(ticker);
  const h = useHistory(ticker);
  const [optionSymbol, setOptionSymbol] = useState(ticker);
  useEffect(() => { setOptionSymbol(ticker); }, [ticker]);
  const ch = useChain(optionSymbol);
  const [lookback, setLookback] = useState(15);
  const [isCumulative, setIsCumulative] = useState(true);
  // Same-time baseline from the corrected IST-aware calculation, in the shape the floor reads.
  const v = useMemo(() => volumeVsNormal(h.bars, { lookback, cumulative: isCumulative }), [h.bars, lookback, isCumulative]);
  const vol = useMemo(() => ({
    points: v.points.map(p => ({ time: p.time, today: p.today, mean: p.mean, median: p.median })),
    count: v.baselineSessions, ready: v.baselineSessions > 0 && v.last?.mean != null, session: v.session,
  }), [v]);
  const rvol = vol.ready ? v.last?.rvol ?? null : null;
  const bars = useMemo(() => h.bars.filter(b => b.day === v.session).slice(-110)
    .map(b => ({ time: slotLabel(b.minute), close: b.close, volume: b.volume ?? 0, open: b.open, high: b.high, low: b.low })), [h.bars, v.session]);
  const chain = ch.data?.data?.strikes?.length ? ch.data.data : null;
  return <div className="tm-pane-body tm-embed qt-integrated-app">
    <TradingFloor symbol={ticker} onChoose={s => onTicker?.(s)} quote={q.data || null} quoteError={q.error || ""} seen={q.at ? new Date(q.at) : null}
      bars={bars} chain={chain} optionSymbol={optionSymbol} setOptionSymbol={setOptionSymbol} chainLoad={ch.reload} watch={FLOOR_WATCH} refresh={5000}
      historyError={h.error || ""} vol={vol} rvol={rvol} lookback={lookback} setLookback={setLookback} isCumulative={isCumulative} setIsCumulative={setIsCumulative}
      VolumeLineChart={FloorLineChart} onOpenFlow={() => onOpen?.("FLOW")} onOpenOptions={() => onOpen?.("OMON")} />
  </div>;
}

/** Map a command to its component. */
export function renderPane(code, props) {
  switch (code) {
    case "DES": return <OverviewPane {...props} />;
    case "GP": return <ChartPane {...props} />;
    case "FA": return <FinancialsPane {...props} />;
    case "ANR": return <AnalystsPane {...props} />;
    case "FCST": return <IntelPane {...props} tab="FORECAST" />;
    case "PEER": return <IntelPane {...props} tab="PEERS" />;
    case "NET": return <IntelPane {...props} tab="NETWORK" />;
    case "NOTE": return <NotesPane {...props} />;
    case "L2": return <DepthPane {...props} />;
    case "VOL": return <VolumePane {...props} />;
    case "RISK": return <RiskPane {...props} />;
    case "SCAN": return <ScanPane {...props} />;
    case "FLOOR": return <FloorPane {...props} />;
    case "OPX": case "GEX": return <OpxPane {...props} />;
    case "OMON": return <OmonPane {...props} />;
    case "FLOW": return <FlowPane {...props} />;
    case "MOST": return <MoversPane {...props} />;
    case "USMV": return <MoversPane {...props} us />;
    case "WEI": return <WeiPane {...props} />;
    case "BI": return <SectorsPane {...props} />;
    case "BRDT": return <BreadthPane {...props} />;
    case "IPO": return <IpoPane {...props} />;
    case "HELP": return <HelpPane onRun={props.onRun} />;
    default: return <Unavailable title={`Unknown command ${code}`} />;
  }
}
export { BY_CODE };
