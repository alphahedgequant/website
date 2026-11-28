// AlphaHedgeQuant Terminal — shared, pure data helpers (no React, no fetch).
//
// Facts this module is built on (verified against the live gateway, 28 Nov 2026):
//  • /api/terminal?view=history returns 5-minute bars whose `date` is "YYYY-MM-DD HH:MM" in UTC
//    (03:45 = 09:15 IST open, 09:55 = 15:25 IST closing bar). It must be parsed as UTC.
//  • Sessions have 73–74 bars: the 15:20 IST bar is absent, the 15:25 closing bar is sometimes absent.
//    Missing bars are missing — never zero volume.
//  • /api/market/screener `changePct` can be 0 while `change` holds the real move (prevClose was
//    overwritten with the latest price outside market hours). The percentage is then recomputed
//    from `change` and `price`, and labelled as such.

export const IST_OFFSET_MIN = 330;
export const NSE_OPEN_MIN = 9 * 60 + 15;
export const NSE_CLOSE_MIN = 15 * 60 + 30;

const num = v => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

/** Bar `date` ("YYYY-MM-DD HH:MM", UTC) → epoch ms. Accepts ISO strings too. */
export function barTimeMs(date) {
  if (date == null) return null;
  const s = String(date).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}
/** IST calendar day and minute-of-day for an instant. */
export function ist(ms) {
  const d = new Date(ms + IST_OFFSET_MIN * 60000);
  return { day: d.toISOString().slice(0, 10), minute: d.getUTCHours() * 60 + d.getUTCMinutes(), weekday: d.getUTCDay() };
}
export const slotLabel = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Normalise raw bars: parsed time, numbers, drop invalid. Sorted ascending. */
export function normaliseBars(rows) {
  const out = [];
  for (const b of rows || []) {
    const t = barTimeMs(b.date ?? b.time ?? b.t);
    const o = num(b.open), h = num(b.high), l = num(b.low), c = num(b.close), v = num(b.volume);
    if (t == null || c == null || !(c > 0)) continue;
    const p = ist(t);
    out.push({ t, day: p.day, minute: p.minute, open: o ?? c, high: h ?? c, low: l ?? c, close: c, volume: v != null && v >= 0 ? v : null });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Aggregate 5-minute bars into larger IST-aligned buckets (15m, 60m, day). */
export function aggregateBars(bars, tf = "5m") {
  if (tf === "5m") return bars;
  const size = tf === "15m" ? 15 : tf === "1h" ? 60 : null;
  const map = new Map();
  for (const b of bars) {
    const key = size ? `${b.day}|${Math.floor((b.minute - NSE_OPEN_MIN) / size)}` : b.day;
    const cur = map.get(key);
    if (!cur) map.set(key, { ...b });
    else {
      cur.high = Math.max(cur.high, b.high); cur.low = Math.min(cur.low, b.low); cur.close = b.close;
      cur.volume = cur.volume == null || b.volume == null ? (cur.volume ?? b.volume) : cur.volume + b.volume;
    }
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

/** Daily closes (last bar of each IST day). */
export function dailyCloses(bars) {
  const m = new Map();
  for (const b of bars) m.set(b.day, { day: b.day, close: b.close, t: b.t });
  return [...m.values()].sort((a, b) => a.t - b.t);
}

/** Price return over N sessions back, computed only when enough history exists. */
export function sessionReturns(bars, windows = [[1, "1D"], [5, "1W"], [10, "2W"], [21, "1M"]]) {
  const d = dailyCloses(bars);
  const last = d.at(-1);
  return windows.map(([n, label]) => {
    const base = d.length > n ? d[d.length - 1 - n] : null;
    return { label, sessions: n, from: base?.day ?? null, pct: base && last ? (last.close / base.close - 1) * 100 : null };
  });
}

/**
 * Today's cumulative (or per-bar) volume against the same IST time slot in the previous
 * `lookback` sessions. A past session contributes to slot t only if it has EVERY bar from the
 * open through t (so a missing bar never becomes a zero). The current session is excluded
 * from its own baseline. RVOL = today ÷ mean at the same slot, only when the mean is positive.
 */
export function volumeVsNormal(bars, { lookback = 15, cumulative = true, step = 5 } = {}) {
  const byDay = new Map();
  for (const b of bars) {
    if (b.volume == null || b.minute < NSE_OPEN_MIN || b.minute >= NSE_CLOSE_MIN) continue;
    if (!byDay.has(b.day)) byDay.set(b.day, new Map());
    byDay.get(b.day).set(b.minute, b.volume);
  }
  const days = [...byDay.keys()].sort();
  const today = days.at(-1);
  if (!today) return { points: [], session: null, baselineSessions: 0, lookback };
  const slots = [];
  for (let m = NSE_OPEN_MIN; m < NSE_CLOSE_MIN; m += step) slots.push(m);
  const series = day => {
    const vols = byDay.get(day); const out = new Map(); let run = 0;
    for (const m of slots) {
      if (!vols.has(m)) break;               // stop at the first gap: nothing after it is "complete"
      run += vols.get(m);
      out.set(m, cumulative ? run : vols.get(m));
    }
    return out;
  };
  const past = days.slice(0, -1).slice(-lookback).map(series);
  const now = series(today);
  // Today can legitimately have a gap too; show today's bars up to its own first gap.
  const points = [];
  for (const m of slots) {
    if (!now.has(m)) break;
    const vals = past.map(s => s.get(m)).filter(v => v != null).sort((a, b) => a - b);
    const n = vals.length;
    const mean = n ? vals.reduce((s, v) => s + v, 0) / n : null;
    const median = n ? (n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2) : null;
    const q = p => (n ? vals[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))] : null);
    points.push({ minute: m, time: slotLabel(m), today: now.get(m), mean, median, p25: q(0.25), p75: q(0.75), sessions: n,
      rvol: mean > 0 ? now.get(m) / mean : null });
  }
  const last = points.at(-1) || null;
  return { points, session: today, baselineSessions: past.length, lookback, last,
    band: last?.rvol == null ? null : last.rvol < 0.75 ? "below normal" : last.rvol <= 1.25 ? "typical" : last.rvol <= 2 ? "elevated" : last.rvol <= 3 ? "unusual" : "extreme" };
}

/** Simple moving average over closes (null until enough points). */
export function sma(values, n) {
  const out = []; let s = 0;
  for (let i = 0; i < values.length; i++) {
    s += values[i]; if (i >= n) s -= values[i - n];
    out.push(i >= n - 1 ? s / n : null);
  }
  return out;
}

// ---------------- screener rows ----------------
/** Day % change for a screener row. Uses changePct unless it is 0 while `change` is not. */
export function rowChangePct(r) {
  const pct = num(r?.changePct), ch = num(r?.change), px = num(r?.price);
  if (pct != null && (pct !== 0 || !ch)) return { pct, derived: false };
  if (ch != null && px != null && px - ch > 0) return { pct: (ch / (px - ch)) * 100, derived: true };
  return { pct: pct ?? null, derived: false };
}
/** Gainers / losers / most active (by traded value) from screener rows. */
export function movers(rows, { limit = 25, minPrice = 0 } = {}) {
  const clean = (rows || []).map(r => ({ ...r, ...(() => { const x = rowChangePct(r); return { dayPct: x.pct, pctDerived: x.derived }; })(),
    value: num(r.price) != null && num(r.volume) != null ? r.price * r.volume : null }))
    .filter(r => r.dayPct != null && num(r.price) > minPrice);
  return {
    gainers: [...clean].sort((a, b) => b.dayPct - a.dayPct).slice(0, limit),
    losers: [...clean].sort((a, b) => a.dayPct - b.dayPct).slice(0, limit),
    active: [...clean].filter(r => r.value != null).sort((a, b) => b.value - a.value).slice(0, limit),
    derivedCount: clean.filter(r => r.pctDerived).length,
    total: clean.length,
  };
}
/** Equal-weight sector performance — only provider-classified rows; coverage reported. */
export function sectorPerformance(rows) {
  const by = new Map(); let unclassified = 0, total = 0;
  for (const r of rows || []) {
    const x = rowChangePct(r); if (x.pct == null) continue; total++;
    if (!r.sector || r.sector === "Unclassified" || (r.classificationStatus && r.classificationStatus !== "provider_verified")) { unclassified++; continue; }
    if (!by.has(r.sector)) by.set(r.sector, { sector: r.sector, n: 0, sum: 0, up: 0, down: 0, best: null, worst: null });
    const s = by.get(r.sector); s.n++; s.sum += x.pct; if (x.pct > 0) s.up++; if (x.pct < 0) s.down++;
    if (!s.best || x.pct > s.best.pct) s.best = { symbol: r.symbol, pct: x.pct };
    if (!s.worst || x.pct < s.worst.pct) s.worst = { symbol: r.symbol, pct: x.pct };
  }
  return { sectors: [...by.values()].map(s => ({ ...s, avg: s.sum / s.n })).sort((a, b) => b.avg - a.avg), unclassified, total };
}
/** Advance/decline breadth with the same % rule. */
export function breadth(rows) {
  let up = 0, down = 0, flat = 0;
  for (const r of rows || []) { const x = rowChangePct(r).pct; if (x == null) continue; if (x > 0) up++; else if (x < 0) down++; else flat++; }
  return { up, down, flat, total: up + down + flat };
}

// ---------------- market clocks ----------------
export function nseStatus(ms = Date.now()) {
  const p = ist(ms);
  const weekend = p.weekday === 0 || p.weekday === 6;
  const open = !weekend && p.minute >= NSE_OPEN_MIN && p.minute < NSE_CLOSE_MIN;
  let next = "";
  if (!open) {
    const pre = !weekend && p.minute < NSE_OPEN_MIN;
    const daysAhead = pre ? 0 : p.weekday === 5 ? 3 : p.weekday === 6 ? 2 : 1;
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(p.weekday + daysAhead) % 7];
    next = `opens ${daysAhead === 0 ? "today" : dayName} 09:15 IST`;
  }
  return { open, label: open ? "NSE open" : "NSE closed", next, note: "Exchange holidays are not detected" };
}

// ---------------- formatting ----------------
export const inr = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: dp, minimumFractionDigits: dp }));
export const n2 = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: dp, minimumFractionDigits: dp }));
export const pctTxt = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : "") + v.toFixed(dp) + "%");
export function compactIN(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  if (a >= 1e12) return s + (a / 1e12).toFixed(2) + "L Cr";
  if (a >= 1e7) return s + (a / 1e7).toLocaleString("en-IN", { maximumFractionDigits: a >= 1e9 ? 0 : 2 }) + " Cr";
  if (a >= 1e5) return s + (a / 1e5).toFixed(2) + " L";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "K";
  return s + a.toFixed(0);
}
