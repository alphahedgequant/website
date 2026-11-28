"use client";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, Legend,
} from "recharts";
import { fmtCr } from "@/lib/optionsIntel.mjs";

export const UP = "var(--oi-up)", DOWN = "var(--oi-down)", TEXT = "var(--oi-text)", INFO = "var(--oi-info)", ACCENT = "var(--oi-accent)", PIN = "var(--oi-pin)";
export const n2 = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: dp, minimumFractionDigits: 0 }));
export const pct = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : "") + v.toFixed(dp) + "%");
export const ist = ms => (ms ? new Date(ms).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) : "—");
export const istDT = ms => (ms ? new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : "—");
export const tone = v => (v > 0 ? "oi-up" : v < 0 ? "oi-down" : "");

export function Tag({ kind = "model", children }) { return <span className={"oi-tag " + kind}>{children}</span>; }
export const MODEL = <Tag kind="model">MODELLED</Tag>;
export const OBSERVED = <Tag kind="obs">PROVIDER</Tag>;
export const ESTIMATED = <Tag kind="est">ESTIMATED</Tag>;
export const BROWSER = <Tag kind="est">BROWSER-OBSERVED</Tag>;

export function Panel({ title, detail, badges, footer, children, span, tools }) {
  return (
    <section className="oi-panel" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <header><div><h3>{title}{badges}</h3>{detail && <p>{detail}</p>}</div>{tools}</header>
      <div className="oi-pbody">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
export function Metric({ label, value, detail, cls = "" }) {
  return <div className="oi-metric"><small>{label}</small><strong className={cls}>{value}</strong>{detail && <span>{detail}</span>}</div>;
}
export function Empty({ title, children }) { return <div className="oi-empty"><strong>{title}</strong>{children}</div>; }
export function Method({ items }) {
  return <details className="oi-method"><summary>METHOD &amp; ASSUMPTIONS</summary><ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul></details>;
}
export function Locked({ what }) {
  return <div className="oi-lock"><Tag kind="pro">PRO</Tag><p>{what} is part of the PRO tier. Access is checked by the server for your account.</p></div>;
}

const axisTick = { fill: "#8e96a3", fontSize: 10, fontFamily: "JetBrains Mono, monospace" };
const tooltipStyle = { background: "#0b0b0d", border: "1px solid #33333a", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#eef1f5" };

/** Strike-axis chart. series: [{key,name,type:'bar'|'line',color,signColor?}] refs: [{x,label,color}] */
export function StrikeChart({ rows, series, refs = [], height = 260, onPick, yFmt = v => fmtCr(v, 1), xKey = "strike", unit = "₹" }) {
  if (!rows?.length) return <Empty title="NO DATA">No usable rows for this view.</Empty>;
  const step = rows.length > 1 ? Math.abs(rows[1][xKey] - rows[0][xKey]) : 1;
  const xs = rows.map(r => r[xKey]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const width = Math.max(2, Math.min(18, 600 / rows.length));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 14, right: 8, left: 4, bottom: 0 }} barGap={0}
          onClick={e => { const v = e?.activePayload?.[0]?.payload?.[xKey]; if (onPick && v != null) onPick(v); }}>
          <CartesianGrid stroke="#1c1c21" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} type="number" domain={[minX - step / 2, maxX + step / 2]} tick={axisTick} tickFormatter={v => n2(v, 0)} allowDecimals={false} />
          <YAxis tick={axisTick} tickFormatter={yFmt} width={64} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={v => `${xKey === "strike" ? "Strike" : "Spot"} ${n2(v, 0)}`}
            formatter={(v, name) => [v == null ? "—" : (unit === "₹" ? "₹ " : "") + yFmt(v), name]} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
          <ReferenceLine y={0} stroke="#3a3a42" />
          {refs.filter(r => r.x != null).map((r, i) => (
            <ReferenceLine key={i} x={r.x} stroke={r.color || TEXT} strokeDasharray="4 3"
              label={{ value: r.label, fill: "#c9ced6", fontSize: 10, position: ["insideTopLeft", "insideTopRight", "insideBottomLeft", "insideBottomRight"][i % 4] }} />
          ))}
          {series.map(s => s.type === "line"
            ? <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color || TEXT} dot={false} strokeWidth={1.8} isAnimationActive={false} connectNulls={false} />
            : <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || TEXT} barSize={width} stackId={s.stack} isAnimationActive={false}>
                {s.signColor && rows.map((r, i) => <Cell key={i} fill={r[s.key] >= 0 ? UP : DOWN} />)}
              </Bar>)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Generic category chart (time, expiry, horizon labels). */
export function CatChart({ rows, xKey, series, height = 220, yFmt = v => fmtCr(v, 1), refY }) {
  if (!rows?.length) return <Empty title="NO DATA">Nothing to plot yet.</Empty>;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="#1c1c21" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={axisTick} />
          <YAxis tick={axisTick} tickFormatter={yFmt} width={64} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [v == null ? "—" : yFmt(v), name]} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
          {refY != null && <ReferenceLine y={refY} stroke="#3a3a42" />}
          {series.map(s => s.type === "bar"
            ? <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || TEXT} isAnimationActive={false}>
                {s.signColor && rows.map((r, i) => <Cell key={i} fill={r[s.key] >= 0 ? UP : DOWN} />)}
              </Bar>
            : <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color || TEXT} dot={rows.length < 30} strokeWidth={1.8} isAnimationActive={false} connectNulls />)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Keep charts legible: strikes within ±pct of spot (falls back to all rows). */
export function nearSpot(rows, spot, p = 0.05) {
  if (!(spot > 0)) return rows;
  const out = rows.filter(r => Math.abs(r.strike - spot) / spot <= p);
  return out.length >= 5 ? out : rows;
}
