// AlphaHedgeQuant — Options Intelligence calculation layer.
//
// One shared, pure (no React, no fetch) module used by every Options Analytics view and the
// six quick-question widgets, so no view runs its own private calculation pipeline.
//
// Conventions (also printed in the UI "Method" panels):
//  • Model: Black–Scholes on the spot index/stock, r = 6.5% p.a. (MODEL_RATE), no dividend yield.
//  • Time: calendar time to the contract's expiry at 15:30 IST, ACT/365, floored at 5 minutes.
//  • Volatility: each contract's own provider IV (percent → decimal). Contracts without a usable IV
//    are EXCLUDED and counted — never treated as zero.
//  • Greeks are recomputed from IV because provider gamma is rounded to 4 decimals (too coarse).
//  • OI and volume are in units of the underlying (Upstox reports quantity, not contracts).
//  • GEX sign convention ("classic"): dealers assumed LONG customer calls and SHORT customer puts,
//    so call GEX is +, put GEX is −. Exchange OI does not reveal who is long or short: this is a
//    MODEL of positioning, not an observation of dealer books.
//  • GEX unit: ₹ change in delta-notional for a 1% move in the underlying = Γ · OI · S² · 0.01.
//  • DEX unit: delta-notional of outstanding OI from the option-holder side = Δ · OI · S (₹).

export const MODEL_RATE = 0.065;
export const MIN_T_YEARS = 5 / (365 * 24 * 60);
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// ---------- normal distribution ----------
export function normPdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
export function normCdf(x) {
  // Abramowitz–Stegun 26.2.17, |error| < 7.5e-8
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

const num = v => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// ---------- calendar ----------
/** Expiry "YYYY-MM-DD" → epoch ms of 15:30 IST (10:00 UTC) that day. */
export function expiryCloseMs(expiry) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(expiry || ""));
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], 10, 0, 0);
}
export function yearsToExpiry(expiry, nowMs = Date.now()) {
  const close = expiryCloseMs(expiry);
  if (close == null) return null;
  return Math.max(MIN_T_YEARS, (close - nowMs) / YEAR_MS);
}
/** IST calendar parts. */
export function istParts(ms = Date.now()) {
  const d = new Date(ms + 330 * 60000);
  const iso = d.toISOString();
  return { day: iso.slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), weekday: d.getUTCDay() };
}
/** Regular NSE cash/F&O session 09:15–15:30 IST, Mon–Fri. Exchange holidays need the exchange calendar. */
export function isNseSession(ms = Date.now()) {
  const p = istParts(ms);
  return p.weekday >= 1 && p.weekday <= 5 && p.minutes >= 555 && p.minutes < 930;
}
/** Tag each listed expiry as 0DTE / weekly / monthly using the provider's contract list (no hardcoded weekday). */
export function tagExpiries(expiries, nowMs = Date.now()) {
  const today = istParts(nowMs).day;
  const list = [...new Set((expiries || []).filter(e => expiryCloseMs(e) != null))].sort();
  const lastInMonth = new Map();
  for (const e of list) lastInMonth.set(e.slice(0, 7), e);
  return list.map(e => ({
    expiry: e,
    zeroDte: e === today,
    monthly: lastInMonth.get(e.slice(0, 7)) === e,
    weekly: lastInMonth.get(e.slice(0, 7)) !== e,
    days: Math.max(0, Math.round((expiryCloseMs(e) - nowMs) / 864e5 * 10) / 10),
  }));
}

// ---------- Black–Scholes ----------
/** Greeks for one option. Returns null when inputs are unusable. vanna per 1 vol point. */
export function bsGreeks(S, K, T, sigma, type, r = MODEL_RATE) {
  if (!(S > 0 && K > 0 && T > 0 && sigma > 0)) return null;
  const sq = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sq);
  const d2 = d1 - sigma * sq;
  const pdf = normPdf(d1);
  const callDelta = normCdf(d1);
  const delta = type === "CE" ? callDelta : callDelta - 1;
  const gamma = pdf / (S * sigma * sq);
  const vanna = (-pdf * d2 / sigma) * 0.01;
  const disc = Math.exp(-r * T);
  const price = type === "CE"
    ? S * callDelta - K * disc * normCdf(d2)
    : K * disc * normCdf(-d2) - S * normCdf(-d1);
  return { delta, gamma, vanna, price, d1, d2 };
}
/** Change in delta as calendar time passes (finite difference, explicit horizon in years). */
export function charmOver(S, K, T, sigma, type, horizonYears, r = MODEL_RATE) {
  const a = bsGreeks(S, K, T, sigma, type, r);
  const b = bsGreeks(S, K, Math.max(MIN_T_YEARS, T - horizonYears), sigma, type, r);
  return a && b ? b.delta - a.delta : null;
}

// ---------- normalisation ----------
/** Chain payload (backend /api/option-chain) → flat contract list + data-quality report. */
export function contractsFromChain(payload) {
  const data = payload?.data ?? payload;
  const expiry = data?.expiry || null;
  const lotSize = num(data?.lot_size);
  const out = [];
  const quality = { contracts: 0, usable: 0, missingIv: 0, missingOi: 0, invalidIv: 0 };
  for (const row of data?.strikes || []) {
    const K = num(row.strike_price);
    if (!(K > 0)) continue;
    for (const [type, q] of [["CE", row.call], ["PE", row.put]]) {
      if (!q) continue;
      quality.contracts++;
      const ivPct = num(q.iv);
      const oi = num(q.oi);
      let iv = null;
      if (ivPct == null) quality.missingIv++;
      else if (ivPct <= 0.5 || ivPct > 300) quality.invalidIv++;
      else iv = ivPct / 100;
      if (oi == null) quality.missingOi++;
      if (iv != null && oi != null) quality.usable++;
      out.push({
        expiry: row.expiry || expiry, strike: K, type,
        oi, oiChg: num(q.oi_change), vol: num(q.volume), ltp: num(q.ltp),
        bid: num(q.bid_price) > 0 ? num(q.bid_price) : null,
        ask: num(q.ask_price) > 0 ? num(q.ask_price) : null,
        iv, lot: num(q.lot_size) ?? lotSize, key: q.instrument_key || `${expiry}:${K}:${type}`,
      });
    }
  }
  return { contracts: out, quality, spot: num(data?.spot_price), expiry, lotSize, receivedAt: data?.received_at || null };
}

// ---------- compact snapshots for replay (IndexedDB) ----------
const F = ["oi", "ltp", "iv", "vol", "bid", "ask", "oiChg"];
export function snapshotFromChain(parsed, observedAt = Date.now()) {
  const byStrike = new Map();
  for (const c of parsed.contracts) {
    if (!byStrike.has(c.strike)) byStrike.set(c.strike, [c.strike, null, null]);
    const vals = F.map(f => (f === "iv" ? (c.iv == null ? null : Math.round(c.iv * 1e4) / 100) : c[f]));
    byStrike.get(c.strike)[c.type === "CE" ? 1 : 2] = vals;
  }
  return {
    t: parsed.receivedAt ? Date.parse(parsed.receivedAt) : observedAt, obs: observedAt,
    S: parsed.spot, expiry: parsed.expiry, lot: parsed.lotSize, rows: [...byStrike.values()],
  };
}
export function contractsFromSnapshot(snap) {
  const out = [];
  for (const [K, c, p] of snap?.rows || []) {
    for (const [type, v] of [["CE", c], ["PE", p]]) {
      if (!v) continue;
      const o = Object.fromEntries(F.map((f, i) => [f, v[i]]));
      out.push({ expiry: snap.expiry, strike: K, type, oi: o.oi, oiChg: o.oiChg, vol: o.vol, ltp: o.ltp,
        bid: o.bid, ask: o.ask, iv: o.iv == null ? null : o.iv / 100, lot: snap.lot, key: `${snap.expiry}:${K}:${type}` });
    }
  }
  return { contracts: out, spot: snap?.S ?? null, expiry: snap?.expiry ?? null, lotSize: snap?.lot ?? null,
    receivedAt: snap?.t ? new Date(snap.t).toISOString() : null, quality: null };
}

// ---------- exposures ----------
/** Per-contract model values. opts: spot, nowMs, ivShift (decimal vol), r. */
export function contractExposure(c, opts) {
  const S = opts.spot;
  if (c.iv == null || c.oi == null || !(S > 0)) return null;
  const T = yearsToExpiry(c.expiry, opts.nowMs ?? Date.now());
  if (T == null) return null;
  const sigma = Math.max(0.005, c.iv + (opts.ivShift || 0));
  const g = bsGreeks(S, c.strike, T, sigma, c.type, opts.r ?? MODEL_RATE);
  if (!g) return null;
  const sign = c.type === "CE" ? 1 : -1;
  return {
    T, sigma, delta: g.delta, gamma: g.gamma, vanna: g.vanna,
    gex: sign * g.gamma * c.oi * S * S * 0.01,
    dex: g.delta * c.oi * S,
    vannaEx: g.vanna * c.oi * S,
  };
}

/** Strike-level aggregation (one or many expiries). */
export function exposuresByStrike(contracts, opts) {
  const map = new Map();
  let excluded = 0;
  for (const c of contracts) {
    const e = contractExposure(c, opts);
    if (!map.has(c.strike)) map.set(c.strike, { strike: c.strike, callGex: 0, putGex: 0, callDex: 0, putDex: 0,
      callOi: 0, putOi: 0, callOiChg: null, putOiChg: null, callVanna: 0, putVanna: 0, usable: 0 });
    const row = map.get(c.strike);
    const side = c.type === "CE" ? "call" : "put";
    if (c.oi != null) row[side + "Oi"] += c.oi;
    if (c.oiChg != null) row[side + "OiChg"] = (row[side + "OiChg"] || 0) + c.oiChg;
    if (!e) { excluded++; continue; }
    row.usable++;
    row[side + "Gex"] += e.gex;
    row[side + "Dex"] += e.dex;
    row[side + "Vanna"] += e.vannaEx;
  }
  const rows = [...map.values()].sort((a, b) => a.strike - b.strike);
  let cum = 0, absTotal = 0;
  for (const r of rows) {
    r.netGex = r.callGex + r.putGex;
    r.absGex = Math.abs(r.callGex) + Math.abs(r.putGex);
    r.netDex = r.callDex + r.putDex;
    r.netVanna = r.callVanna + r.putVanna;
    absTotal += r.absGex;
  }
  for (const r of rows) { cum += r.netGex; r.cumGex = cum; r.share = absTotal > 0 ? r.absGex / absTotal : null; }
  const totals = rows.reduce((t, r) => ({
    callGex: t.callGex + r.callGex, putGex: t.putGex + r.putGex, netGex: t.netGex + r.netGex,
    callDex: t.callDex + r.callDex, putDex: t.putDex + r.putDex, netDex: t.netDex + r.netDex,
    netVanna: t.netVanna + r.netVanna, absGex: t.absGex + r.absGex,
  }), { callGex: 0, putGex: 0, netGex: 0, callDex: 0, putDex: 0, netDex: 0, netVanna: 0, absGex: 0 });
  return { rows, totals, excluded };
}

/** Net GEX / net vanna evaluated at hypothetical spot levels, holding IV and time constant. */
export function spotProfile(contracts, opts, { rangePct = 0.06, points = 97 } = {}) {
  const S = opts.spot;
  if (!(S > 0)) return [];
  const out = [];
  for (let i = 0; i < points; i++) {
    const x = S * (1 - rangePct + (2 * rangePct * i) / (points - 1));
    let gex = 0, vanna = 0, n = 0;
    for (const c of contracts) {
      const e = contractExposure(c, { ...opts, spot: x });
      if (!e) continue;
      gex += e.gex; vanna += e.vannaEx; n++;
    }
    out.push({ spot: x, netGex: n ? gex : null, netVanna: n ? vanna : null });
  }
  return out;
}

/** All sign changes of key along a profile (linear interpolation). Safe for zero / many crossings. */
export function zeroCrossings(profile, key) {
  const xs = [];
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1], b = profile[i];
    if (a[key] == null || b[key] == null) continue;
    if (a[key] === 0) { xs.push(a.spot); continue; }
    if ((a[key] < 0 && b[key] > 0) || (a[key] > 0 && b[key] < 0)) {
      xs.push(a.spot + (b.spot - a.spot) * (0 - a[key]) / (b[key] - a[key]));
    }
  }
  return xs;
}
export function nearestTo(xs, S) {
  if (!xs.length) return null;
  return xs.reduce((best, x) => (Math.abs(x - S) < Math.abs(best - S) ? x : best), xs[0]);
}

export function walls(rows) {
  let call = null, put = null;
  for (const r of rows) {
    if (r.callGex > 0 && (!call || r.callGex > call.callGex)) call = r;
    if (r.putGex < 0 && (!put || r.putGex < put.putGex)) put = r;
  }
  return { callWall: call?.strike ?? null, putWall: put?.strike ?? null };
}

/** Herfindahl–Hirschman concentration of NON-NEGATIVE exposure weights (|GEX|). */
export function hhi(rows) {
  const calc = vals => {
    const pos = vals.map(Math.abs).filter(v => v > 0);
    const tot = pos.reduce((s, v) => s + v, 0);
    if (!(tot > 0)) return null;
    const h = pos.reduce((s, v) => s + (v / tot) ** 2, 0);
    return { hhi: h, hhi10k: Math.round(h * 10000), effectiveStrikes: 1 / h };
  };
  return {
    call: calc(rows.map(r => r.callGex)),
    put: calc(rows.map(r => r.putGex)),
    combined: calc(rows.map(r => r.absGex)),
    basis: "Shares of absolute (non-negative) strike GEX",
  };
}

/** Transparent 0–100 pin pressure / conviction score. NOT a probability of settlement. */
export function pinScores(rows, S, frontT, atmIv, { maxDistPct = 0.03 } = {}) {
  if (!(S > 0) || !rows.length) return [];
  const maxAbs = Math.max(...rows.map(r => r.absGex));
  if (!(maxAbs > 0)) return [];
  const expMove = S * (atmIv > 0 ? atmIv : 0.15) * Math.sqrt(Math.max(frontT || MIN_T_YEARS, MIN_T_YEARS));
  const days = (frontT || 0) * 365;
  const timeFactor = Math.max(0, Math.min(1, 1 - days / 7));
  const out = [];
  rows.forEach((r, i) => {
    if (Math.abs(r.strike - S) / S > maxDistPct || !(r.absGex > 0)) return;
    const nb = rows.slice(Math.max(0, i - 2), i + 3).filter(x => x !== r);
    const nbMean = nb.length ? nb.reduce((s, x) => s + x.absGex, 0) / nb.length : 0;
    const comp = {
      concentration: r.absGex / maxAbs,
      proximity: Math.exp(-0.5 * ((r.strike - S) / Math.max(expMove, 1e-9)) ** 2),
      relativeStrength: nbMean > 0 ? Math.min(1, (r.absGex / nbMean) / 3) : 1,
      timeToExpiry: timeFactor,
    };
    const score = 100 * (0.4 * comp.concentration + 0.3 * comp.proximity + 0.15 * comp.relativeStrength + 0.15 * comp.timeToExpiry);
    out.push({ strike: r.strike, distance: r.strike - S, distancePct: (r.strike - S) / S * 100, score: Math.round(score), components: comp });
  });
  return out.sort((a, b) => b.score - a.score);
}

/** Modelled dealer hedge for spot moves (full delta revaluation). Positive = dealers BUY underlying. */
export function hedgeLadder(contracts, opts, moves = [-2, -1, -0.5, 0.5, 1, 2]) {
  const S = opts.spot;
  const base = new Map();
  for (const c of contracts) { const e = contractExposure(c, opts); if (e) base.set(c, e.delta); }
  const scenarios = moves.map(m => {
    const S2 = S * (1 + m / 100);
    let units = 0;
    for (const [c, d0] of base) {
      const e = contractExposure(c, { ...opts, spot: S2 });
      if (!e) continue;
      const dealerPos = c.type === "CE" ? 1 : -1; // classic convention
      units -= dealerPos * (e.delta - d0) * c.oi;
    }
    return { movePct: m, spot: S2, hedgeUnits: units, hedgeRs: units * S2 };
  });
  const perStrike = new Map();
  for (const [c, d0] of base) {
    const e = contractExposure(c, { ...opts, spot: S * 1.01 });
    if (!e) continue;
    const u = -(c.type === "CE" ? 1 : -1) * (e.delta - d0) * c.oi;
    perStrike.set(c.strike, (perStrike.get(c.strike) || 0) + u);
  }
  return { scenarios, perStrikeUp1: [...perStrike.entries()].map(([strike, units]) => ({ strike, units, rs: units * S * 1.01 })).sort((a, b) => a.strike - b.strike) };
}

/** Gamma under time horizons and IV shocks, other inputs held constant. */
export function gammaDecay(contracts, opts) {
  const now = opts.nowMs ?? Date.now();
  const front = contracts.map(c => expiryCloseMs(c.expiry)).filter(Boolean).sort((a, b) => a - b)[0];
  const horizons = [
    ["Now", 0], ["+30 min", 30], ["+1 hour", 60], ["+2 hours", 120],
    ["Front expiry close", front ? Math.max(0, (front - now) / 60000 - 5) : null],
  ];
  const sum = o => exposuresByStrike(contracts, o).totals.netGex;
  const time = horizons.filter(([, m]) => m != null).map(([label, m]) => ({ label, minutes: m, netGex: sum({ ...opts, nowMs: now + m * 60000 }) }));
  const iv = [-5, -2, 0, 2, 5].map(pts => ({ label: (pts > 0 ? "+" : "") + pts + " vol pts", ivShift: pts / 100, netGex: sum({ ...opts, ivShift: pts / 100 }) }));
  return { time, iv, heldConstant: "Spot, OI and each contract's IV are held constant for time horizons; spot, OI and time are held constant for IV shocks." };
}

/** Charm by strike: delta change over 1 calendar day and to each contract's expiry, × OI × S. */
export function charmByStrike(contracts, opts) {
  const S = opts.spot, now = opts.nowMs ?? Date.now();
  const map = new Map();
  for (const c of contracts) {
    if (c.iv == null || c.oi == null) continue;
    const T = yearsToExpiry(c.expiry, now);
    if (T == null) continue;
    const oneDay = charmOver(S, c.strike, T, c.iv, c.type, 1 / 365);
    const toExp = charmOver(S, c.strike, T, c.iv, c.type, T);
    if (oneDay == null) continue;
    if (!map.has(c.strike)) map.set(c.strike, { strike: c.strike, callDay: 0, putDay: 0, callToExpiry: 0, putToExpiry: 0 });
    const r = map.get(c.strike), side = c.type === "CE" ? "call" : "put";
    r[side + "Day"] += oneDay * c.oi * S;
    r[side + "ToExpiry"] += (toExp ?? 0) * c.oi * S;
  }
  return [...map.values()].sort((a, b) => a.strike - b.strike).map(r => ({ ...r, netDay: r.callDay + r.putDay, netToExpiry: r.callToExpiry + r.putToExpiry }));
}

/** Today's DEX flow from OI change versus previous close (provider field). Added vs reduced kept apart. */
export function dexFlow(contracts, opts) {
  const byStrike = new Map();
  const tot = { added: 0, reduced: 0 };
  for (const c of contracts) {
    if (c.oiChg == null) continue;
    const e = contractExposure({ ...c, oi: 1 }, opts);
    if (!e) continue;
    const v = e.delta * c.oiChg * opts.spot;
    if (!byStrike.has(c.strike)) byStrike.set(c.strike, { strike: c.strike, callAdded: 0, callReduced: 0, putAdded: 0, putReduced: 0 });
    const r = byStrike.get(c.strike), side = c.type === "CE" ? "call" : "put";
    if (c.oiChg >= 0) { r[side + "Added"] += v; tot.added += v; } else { r[side + "Reduced"] += v; tot.reduced += v; }
  }
  return { rows: [...byStrike.values()].sort((a, b) => a.strike - b.strike), totals: { ...tot, net: tot.added + tot.reduced } };
}

// ---------- volatility ----------
export const midPrice = c => (c.bid != null && c.ask != null && c.ask >= c.bid ? (c.bid + c.ask) / 2 : c.ltp != null && c.ltp > 0 ? c.ltp : null);
export const priceBasis = c => (c.bid != null && c.ask != null && c.ask >= c.bid ? "mid" : c.ltp != null && c.ltp > 0 ? "LTP" : null);

export function atmStrike(contracts, S) {
  let best = null;
  for (const c of contracts) if (best == null || Math.abs(c.strike - S) < Math.abs(best - S)) best = c.strike;
  return best;
}

/** OTM smile for one expiry: puts below spot, calls at/above. Invalid quotes excluded and counted. */
export function ivSmile(contracts, S) {
  const pts = [], excluded = [];
  for (const c of contracts) {
    const otm = c.type === "CE" ? c.strike >= S : c.strike < S;
    if (!otm) continue;
    const quoted = c.bid != null || (c.ltp != null && c.ltp > 0);
    if (c.iv == null || !quoted) { excluded.push(c.strike + " " + c.type); continue; }
    pts.push({ strike: c.strike, iv: c.iv * 100, type: c.type, moneyness: Math.log(c.strike / S) });
  }
  return { points: pts.sort((a, b) => a.strike - b.strike), excluded };
}

export function straddle(contracts, S) {
  const K = atmStrike(contracts, S);
  if (K == null) return null;
  const ce = contracts.find(c => c.strike === K && c.type === "CE");
  const pe = contracts.find(c => c.strike === K && c.type === "PE");
  const cp = ce ? midPrice(ce) : null, pp = pe ? midPrice(pe) : null;
  const total = cp != null && pp != null ? cp + pp : null;
  return {
    strike: K, call: cp, put: pp, total, callBasis: ce ? priceBasis(ce) : null, putBasis: pe ? priceBasis(pe) : null,
    lower: total != null ? K - total : null, upper: total != null ? K + total : null,
    impliedMovePct: total != null && S > 0 ? (total / S) * 100 : null,
    atmIv: [ce?.iv, pe?.iv].filter(v => v != null).length ? [ce?.iv, pe?.iv].filter(v => v != null).reduce((s, v, _, a) => s + v / a.length, 0) * 100 : null,
  };
}

/** 25-delta risk reversal / butterfly using model delta from each contract's own IV. */
export function skew25(contracts, S, nowMs = Date.now()) {
  let c25 = null, p25 = null;
  for (const c of contracts) {
    if (c.iv == null) continue;
    const T = yearsToExpiry(c.expiry, nowMs);
    const g = bsGreeks(S, c.strike, T, c.iv, c.type);
    if (!g) continue;
    if (c.type === "CE" && (!c25 || Math.abs(g.delta - 0.25) < Math.abs(c25.d - 0.25))) c25 = { d: g.delta, iv: c.iv * 100, strike: c.strike };
    if (c.type === "PE" && (!p25 || Math.abs(g.delta + 0.25) < Math.abs(p25.d + 0.25))) p25 = { d: g.delta, iv: c.iv * 100, strike: c.strike };
  }
  const st = straddle(contracts, S);
  if (!c25 || !p25) return null;
  return { call25: c25, put25: p25, riskReversal: c25.iv - p25.iv,
    butterfly: st?.atmIv != null ? (c25.iv + p25.iv) / 2 - st.atmIv : null };
}

/** Annualised close-to-close realised volatility from intraday bars (UTC timestamps). */
export function realizedVolFromBars(bars, windows = [10, 20]) {
  const daily = new Map();
  for (const b of bars || []) {
    const t = Date.parse(String(b.date).replace(" ", "T") + "Z");
    const c = num(b.close);
    if (!Number.isFinite(t) || !(c > 0)) continue;
    daily.set(istParts(t).day, c); // last bar of each IST day
  }
  const closes = [...daily.entries()].sort().map(([, c]) => c);
  const rets = closes.slice(1).map((c, i) => Math.log(c / closes[i]));
  const out = {};
  for (const w of windows) {
    const r = rets.slice(-w);
    if (r.length < Math.min(w, 5)) { out["rv" + w] = null; continue; }
    const m = r.reduce((s, x) => s + x, 0) / r.length;
    const v = r.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, r.length - 1);
    out["rv" + w] = Math.sqrt(v * 252) * 100;
  }
  out.days = closes.length;
  return out;
}
/** Intraday realised vol from observed spot snapshots (≥ 10 one-minute-ish returns). */
export function realizedVolFromSnapshots(snaps) {
  const pts = (snaps || []).filter(s => s.S > 0).sort((a, b) => a.t - b.t);
  if (pts.length < 11) return null;
  const rets = [], dts = [];
  for (let i = 1; i < pts.length; i++) {
    const dt = (pts[i].t - pts[i - 1].t) / 60000;
    if (dt <= 0 || dt > 30) continue;
    rets.push(Math.log(pts[i].S / pts[i - 1].S)); dts.push(dt);
  }
  if (rets.length < 10) return null;
  const avgDt = dts.reduce((s, x) => s + x, 0) / dts.length;
  const v = rets.reduce((s, x) => s + x * x, 0) / rets.length;
  return Math.sqrt(v * (375 / avgDt) * 252) * 100;
}

// ---------- flow ----------
/** Price/OI buildup classification. Small moves are reported as ambiguous, never forced. */
export function classifyBuildup(dOi, dPx, { minOi = 0, minPx = 0.05 } = {}) {
  if (dOi == null || dPx == null) return "unavailable";
  if (Math.abs(dOi) <= minOi || Math.abs(dPx) < minPx) return "ambiguous";
  if (dOi > 0) return dPx > 0 ? "long buildup" : "short buildup";
  return dPx > 0 ? "short covering" : "long unwinding";
}

const contractMap = snap => {
  const m = new Map();
  for (const c of contractsFromSnapshot(snap).contracts) m.set(c.strike + c.type, c);
  return m;
};

/** OI / price / volume changes between two snapshots of the same expiry. */
export function diffSnapshots(prev, cur, { minOi = 0 } = {}) {
  if (!prev || !cur || prev.expiry !== cur.expiry) return [];
  const a = contractMap(prev), b = contractMap(cur);
  const out = [];
  for (const [k, c] of b) {
    const p = a.get(k);
    if (!p) continue;
    const dOi = c.oi != null && p.oi != null ? c.oi - p.oi : null;
    const dPx = c.ltp != null && p.ltp != null ? c.ltp - p.ltp : null;
    const dVol = c.vol != null && p.vol != null ? Math.max(0, c.vol - p.vol) : null;
    out.push({ strike: c.strike, type: c.type, dOi, dPx, dVol, ltp: c.ltp, turnover: dVol != null && c.ltp != null ? dVol * c.ltp : null,
      class: classifyBuildup(dOi, dPx, { minOi, minPx: Math.max(0.05, (c.ltp || 0) * 0.002) }) });
  }
  return out;
}

/** ESTIMATED aggressor balance: volume added between snapshots signed by the quote rule on the later snapshot.
 *  Snapshots are not trade prints — this is labelled "estimated" everywhere it is shown. */
export function aggressorEstimate(prev, cur) {
  if (!prev || !cur || prev.expiry !== cur.expiry) return null;
  const a = contractMap(prev), b = contractMap(cur);
  const rows = new Map();
  const tot = { buy: 0, sell: 0, unknown: 0 };
  for (const [k, c] of b) {
    const p = a.get(k);
    if (!p || c.vol == null || p.vol == null) continue;
    const dv = c.vol - p.vol;
    if (!(dv > 0)) continue;
    let side = "unknown";
    if (c.ltp != null && c.ask != null && c.ltp >= c.ask) side = "buy";
    else if (c.ltp != null && c.bid != null && c.ltp <= c.bid) side = "sell";
    tot[side] += dv;
    if (!rows.has(c.strike)) rows.set(c.strike, { strike: c.strike, buy: 0, sell: 0, unknown: 0 });
    rows.get(c.strike)[side] += dv;
  }
  return { rows: [...rows.values()].sort((x, y) => x.strike - y.strike), totals: tot };
}

/** OI change since the first observed snapshot of the IST day (kept separate from vs-previous-close). */
export function oiSinceFirst(snaps) {
  const sorted = [...(snaps || [])].sort((a, b) => a.t - b.t);
  if (sorted.length < 2) return null;
  return { from: sorted[0].t, to: sorted.at(-1).t, rows: diffSnapshots(sorted[0], sorted.at(-1)) };
}

/** Minute-by-minute aggregate call/put OI change between consecutive snapshots. */
export function oiRotation(snaps) {
  const sorted = [...(snaps || [])].sort((a, b) => a.t - b.t);
  const out = [];
  let cumC = 0, cumP = 0;
  for (let i = 1; i < sorted.length; i++) {
    const d = diffSnapshots(sorted[i - 1], sorted[i]);
    const c = d.filter(x => x.type === "CE" && x.dOi != null).reduce((s, x) => s + x.dOi, 0);
    const p = d.filter(x => x.type === "PE" && x.dOi != null).reduce((s, x) => s + x.dOi, 0);
    cumC += c; cumP += p;
    out.push({ t: sorted[i].t, callChg: c, putChg: p, cumCall: cumC, cumPut: cumP });
  }
  return out;
}

/** Chronological OI tape: every contract whose OI changed between consecutive snapshots. */
export function oiTape(snaps, limit = 200) {
  const sorted = [...(snaps || [])].sort((a, b) => a.t - b.t);
  const out = [];
  for (let i = 1; i < sorted.length; i++) {
    for (const d of diffSnapshots(sorted[i - 1], sorted[i])) {
      if (d.dOi) out.push({ sourceTs: sorted[i].t, ingestTs: sorted[i].obs, strike: d.strike, type: d.type, dOi: d.dOi, dPx: d.dPx });
    }
  }
  return out.sort((a, b) => b.sourceTs - a.sourceTs || Math.abs(b.dOi) - Math.abs(a.dOi)).slice(0, limit);
}

// ---------- one-call summary used by Overview, market strip and since-last-visit ----------
export function summarize(parsed, { nowMs = Date.now(), r = MODEL_RATE } = {}) {
  const S = parsed?.spot;
  if (!(S > 0) || !parsed.contracts?.length) return null;
  const opts = { spot: S, nowMs, r };
  const ex = exposuresByStrike(parsed.contracts, opts);
  const prof = spotProfile(parsed.contracts, opts, { rangePct: 0.05, points: 81 });
  const flips = zeroCrossings(prof, "netGex");
  const vannaFlips = zeroCrossings(prof, "netVanna");
  const w = walls(ex.rows);
  const st = straddle(parsed.contracts, S);
  const T = yearsToExpiry(parsed.expiry, nowMs);
  const pins = pinScores(ex.rows, S, T, st?.atmIv != null ? st.atmIv / 100 : null);
  const oiLeaders = {
    call: [...ex.rows].sort((a, b) => b.callOi - a.callOi).slice(0, 3).map(r => ({ strike: r.strike, oi: r.callOi })),
    put: [...ex.rows].sort((a, b) => b.putOi - a.putOi).slice(0, 3).map(r => ({ strike: r.strike, oi: r.putOi })),
  };
  return {
    spot: S, expiry: parsed.expiry, T, ...ex, profile: prof,
    flip: nearestTo(flips, S), flipCount: flips.length,
    vannaFlip: nearestTo(vannaFlips, S), vannaFlipCount: vannaFlips.length,
    ...w, pin: pins[0] || null, pins, straddle: st, hhi: hhi(ex.rows), oiLeaders,
    regime: ex.totals.netGex > 0 ? "positive" : ex.totals.netGex < 0 ? "negative" : "flat",
  };
}

// ---------- formatting ----------
export function fmtCr(v, dp = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e7) return (v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: dp }) + " Cr";
  if (a >= 1e5) return (v / 1e5).toLocaleString("en-IN", { maximumFractionDigits: dp }) + " L";
  return v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
export function fmtQty(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e7) return (v / 1e7).toFixed(2) + "Cr";
  if (a >= 1e5) return (v / 1e5).toFixed(2) + "L";
  if (a >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(Math.round(v));
}
