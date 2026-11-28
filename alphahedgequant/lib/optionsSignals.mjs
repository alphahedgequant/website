// AlphaHedgeQuant — Options "story" engine.
//
// Everyone can see the same option chain. This module turns it into a short list of plain-language
// readings, each carrying the numbers behind it and the exact rule used — so a first-time visitor
// learns what to look at, and an experienced trader can check the working.
//
// Rules for every reading:
//  • Uses only values present in the chain (or this browser's own snapshots). Missing data → no reading.
//  • Says what is OBSERVED (provider), what is MODELLED (Black–Scholes / dealer convention) and what is
//    a COMMON INTERPRETATION (e.g. "fresh call OI above spot is usually read as writing").
//  • Never states a direction as fact. Readings describe positioning, not predictions.

import {
  bsGreeks, greeksFor, yearsToExpiry, normCdf, straddle, skew25, contractsFromSnapshot, diffSnapshots, midPrice, atmStrike,
} from "./optionsIntel.mjs";

export const KIND_WEIGHT = { hot: 3, watch: 2, info: 1 };

const nf = (v, dp = 0) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: dp, minimumFractionDigits: dp }));
const pctS = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : "") + v.toFixed(dp) + "%");
/** Quantity in lakh units and lots (India) — or plain thousands/millions elsewhere. */
export function qtyText(units, lot, market = "IN", signed = false) {
  if (units == null || !Number.isFinite(units)) return "—";
  const sign = signed ? (units > 0 ? "+" : units < 0 ? "−" : "") : units < 0 ? "−" : "";
  const a = Math.abs(units);
  const base = market === "IN"
    ? (a >= 1e7 ? (a / 1e7).toFixed(2) + " Cr" : a >= 1e5 ? (a / 1e5).toFixed(2) + " L" : nf(a))
    : (a >= 1e6 ? (a / 1e6).toFixed(2) + "M" : a >= 1e3 ? (a / 1e3).toFixed(1) + "K" : nf(a));
  const lots = lot > 0 ? ` (${nf(a / lot)} lots)` : "";
  return sign + base + " units" + lots;
}
export function moneyText(v, market = "IN") {
  if (v == null || !Number.isFinite(v)) return "—";
  if (market === "US") { const a = Math.abs(v); return (v < 0 ? "−$" : "$") + (a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(1) + "M" : nf(a)); }
  const a = Math.abs(v); return (v < 0 ? "−₹" : "₹") + (a >= 1e7 ? nf(a / 1e7, 0) + " Cr" : a >= 1e5 ? nf(a / 1e5, 1) + " L" : nf(a));
}
const dayName = expiry => { try { return new Date(expiry + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }); } catch { return expiry; } };

// ---------------------------------------------------------------- calculations
/** Max pain: the expiry price at which the total intrinsic value owed to option holders is smallest. */
export function maxPain(contracts) {
  const strikes = [...new Set(contracts.filter(c => c.oi > 0).map(c => c.strike))].sort((a, b) => a - b);
  if (strikes.length < 3) return null;
  let best = null;
  for (const X of strikes) {
    let pain = 0;
    for (const c of contracts) {
      if (!(c.oi > 0)) continue;
      pain += c.oi * (c.type === "CE" ? Math.max(0, X - c.strike) : Math.max(0, c.strike - X));
    }
    if (!best || pain < best.pain) best = { strike: X, pain };
  }
  return best;
}

/** Model probability that expiry lands inside the ATM straddle breakevens (lognormal-free approx, ATM IV). */
export function probInsideStraddle(st, S, T) {
  if (!st?.total || !(st.atmIv > 0) || !(T > 0) || !(S > 0)) return null;
  const k = st.total / (S * (st.atmIv / 100) * Math.sqrt(T));
  return 2 * normCdf(k) - 1;
}

/** Convexity: % premium change for a 0.5% move toward the strike (model, IV and time held). */
export function convexityTable(contracts, S, nowMs, { band = 0.015, move = 0.005 } = {}) {
  const out = [];
  for (const c of contracts) {
    if (c.iv == null) continue;
    const otm = c.type === "CE" ? c.strike > S : c.strike < S;
    if (!otm || Math.abs(c.strike - S) / S > band) continue;
    const now = greeksFor(c, S, nowMs);
    const moved = greeksFor(c, S * (c.type === "CE" ? 1 + move : 1 - move), nowMs);
    if (!now || !moved || !(now.price > 0.05)) continue;
    out.push({ strike: c.strike, type: c.type, ltp: c.ltp, modelPrice: now.price, gainPct: (moved.price / now.price - 1) * 100,
      distancePct: (c.strike - S) / S * 100, gamma: now.gamma });
  }
  return out.sort((a, b) => b.gainPct - a.gainPct);
}

/** Order-book imbalance from displayed best bid/ask quantities near the money. (B − A) / (B + A). */
export function quoteImbalance(contracts, S, band = 0.01) {
  const side = type => {
    let B = 0, A = 0, n = 0;
    for (const c of contracts) {
      if (c.type !== type || Math.abs(c.strike - S) / S > band || c.bidQty == null || c.askQty == null) continue;
      B += c.bidQty; A += c.askQty; n++;
    }
    return n && B + A > 0 ? { bid: B, ask: A, imbalance: (B - A) / (B + A), strikes: n } : null;
  };
  return { calls: side("CE"), puts: side("PE"), band };
}

/** Straddle decay since the first snapshot vs what time alone (model) would have taken. */
export function decayVsTime(snaps) {
  const s = [...(snaps || [])].sort((a, b) => a.t - b.t);
  if (s.length < 2) return null;
  const first = s[0], last = s.at(-1);
  if ((last.t - first.t) < 20 * 60000) return null;
  const a = contractsFromSnapshot(first), b = contractsFromSnapshot(last);
  const K = atmStrike(a.contracts, a.spot);
  if (K == null) return null;
  const leg = (p, t) => p.contracts.find(c => c.strike === K && c.type === t);
  const actual0 = ["CE", "PE"].map(t => leg(a, t) && midPrice(leg(a, t)));
  const actual1 = ["CE", "PE"].map(t => leg(b, t) && midPrice(leg(b, t)));
  if (actual0.some(v => v == null) || actual1.some(v => v == null)) return null;
  const T0 = yearsToExpiry(a.expiry, first.t, a.market), T1 = yearsToExpiry(a.expiry, last.t, a.market);
  const model = T => ["CE", "PE"].reduce((sum, t) => { const c = leg(a, t); const g = c?.iv ? greeksFor(c, a.spot, 0, { T }) : null; return g ? sum + g.price : NaN; }, 0);
  const m0 = model(T0), m1 = model(T1);
  if (!Number.isFinite(m0) || !Number.isFinite(m1) || m0 <= 0) return null;
  const startPx = actual0[0] + actual0[1], endPx = actual1[0] + actual1[1];
  const actualPct = (endPx / startPx - 1) * 100, timePct = (m1 / m0 - 1) * 100;
  return { strike: K, from: first.t, to: last.t, startPx, endPx, actualPct, timePct,
    ratio: timePct < 0 ? actualPct / timePct : null, spotMovePct: (b.spot / a.spot - 1) * 100 };
}

/** Option premiums that exploded between snapshots (observed). */
export function premiumBursts(snaps, { lookbackMin = 15, minLtp = 1, minGainPct = 80 } = {}) {
  const s = [...(snaps || [])].sort((a, b) => a.t - b.t);
  if (s.length < 2) return [];
  const cur = s.at(-1);
  const prev = [...s].reverse().find(x => x.t <= cur.t - lookbackMin * 60000) || s[0];
  if (prev === cur) return [];
  return diffSnapshots(prev, cur)
    .filter(d => d.dPx != null && d.ltp != null && d.ltp - d.dPx >= minLtp && (d.dPx / (d.ltp - d.dPx)) * 100 >= minGainPct)
    .map(d => ({ ...d, gainPct: d.dPx / (d.ltp - d.dPx) * 100, minutes: Math.round((cur.t - prev.t) / 60000) }))
    .sort((a, b) => b.gainPct - a.gainPct);
}

// ---------------------------------------------------------------- readings
function sig(o) { return { kind: "info", score: 0, evidence: [], ...o }; }

export function buildStory({ parsed, summary, snaps = [], nowMs = Date.now(), market = "IN", symbol = "", rv = null, history = [] }) {
  if (!parsed?.contracts?.length || !summary) return { headline: null, signals: [], levels: null };
  const S = summary.spot, T = summary.T, days = T * 365, expiry = summary.expiry, lot = parsed.lotSize;
  const st = summary.straddle;
  const out = [];

  // 1. Regime
  const flip = summary.flip, dFlip = flip ? (S - flip) / S * 100 : null;
  if (flip != null && Math.abs(dFlip) < 0.3) {
    out.push(sig({ id: "regime", topic: "gamma", kind: "hot", score: 100,
      title: `Spot is sitting on the gamma flip (${nf(flip)})`,
      detail: `Spot is only ${Math.abs(dFlip).toFixed(2)}% from the level where modelled dealer gamma changes sign. A break ${dFlip >= 0 ? "below" : "above"} it can switch the market from range-bound to fast-moving.`,
      evidence: [["Spot", nf(S, 1)], ["Gamma flip", nf(flip)], ["Net gamma", moneyText(summary.totals.netGex, market) + " per 1%"]],
      how: "Gamma flip = spot level where modelled net GEX (dealers long calls, short puts) changes sign, found by re-pricing every contract across ±5%.", view: "levels" }));
  } else if (summary.totals.netGex > 0) {
    out.push(sig({ id: "regime", topic: "gamma", kind: "info", score: 40,
      title: "Hedging flows likely cushion moves",
      detail: `Modelled net gamma is positive. If dealers are positioned this way, they sell into rallies and buy dips, which tends to keep ${symbol || "the index"} in a range${flip ? `. ${flip < S ? "Below" : "Above"} ${nf(flip)} (${Math.abs(dFlip).toFixed(2)}% away) that cushion disappears` : ""}.`,
      evidence: [["Net gamma", moneyText(summary.totals.netGex, market) + " per 1%"], ["Gamma flip", flip ? nf(flip) : "none within ±5%"]],
      how: "Positive net GEX → modelled dealer hedging dampens moves. This is a model of positioning: exchange OI does not reveal who is long or short.", view: "levels" }));
  } else {
    out.push(sig({ id: "regime", topic: "gamma", kind: "watch", score: 80,
      title: "Moves can accelerate here",
      detail: `Modelled net gamma is negative: dealer hedging would chase price — buying as it rises, selling as it falls — so moves can extend further than usual${flip ? ` until spot gets back ${flip > S ? "above" : "below"} ${nf(flip)}` : ""}.`,
      evidence: [["Net gamma", moneyText(summary.totals.netGex, market) + " per 1%"], ["Gamma flip", flip ? nf(flip) : "none within ±5%"]],
      how: "Negative net GEX → modelled dealer hedging amplifies moves.", view: "levels" }));
  }

  // 2. Range priced by options
  const pIn = probInsideStraddle(st, S, T);
  if (st?.total) {
    out.push(sig({ id: "range", topic: "range", kind: "info", score: 35,
      title: `Options price a ±${st.impliedMovePct.toFixed(2)}% move by ${dayName(expiry)}`,
      detail: `The at-the-money straddle costs ${nf(st.total, 1)} points, so the market is paying for a move to roughly ${nf(st.lower)} – ${nf(st.upper)}${pIn != null ? `. Under the model, about ${Math.round(pIn * 100)}% of outcomes finish inside that band` : ""}.`,
      evidence: [["ATM straddle", `${nf(st.strike)} · ${nf(st.total, 2)}`], ["Breakevens", `${nf(st.lower)} – ${nf(st.upper)}`], ["ATM IV", st.atmIv != null ? st.atmIv.toFixed(2) + "%" : "—"], ["Days to expiry", days.toFixed(1)]],
      how: "Straddle = ATM call + put at bid/ask mid. Probability uses a normal approximation with ATM IV: P = 2·N(straddle ÷ (S·σ·√T)) − 1.", view: "decay" }));
  }

  // 3. Walls (OI-based support/resistance read)
  const upCalls = parsed.contracts.filter(c => c.type === "CE" && c.strike > S && c.oi > 0);
  const dnPuts = parsed.contracts.filter(c => c.type === "PE" && c.strike < S && c.oi > 0);
  const maxBy = (arr, k) => arr.reduce((b, c) => (b == null || c[k] > b[k] ? c : b), null);
  const callOiWall = maxBy(upCalls, "oi"), putOiWall = maxBy(dnPuts, "oi");
  if (callOiWall && putOiWall) {
    out.push(sig({ id: "walls", topic: "oi", kind: "info", score: 34,
      title: `Biggest open interest: ${nf(putOiWall.strike)} put below, ${nf(callOiWall.strike)} call above`,
      detail: `Most traders read the largest put OI below spot as support and the largest call OI above as resistance, because option writers defend those strikes. Gamma-weighted walls (what matters for hedging now) sit at ${summary.putWall ? nf(summary.putWall) : "—"} and ${summary.callWall ? nf(summary.callWall) : "—"}.`,
      evidence: [["Put OI wall", `${nf(putOiWall.strike)} · ${qtyText(putOiWall.oi, lot, market)}`], ["Call OI wall", `${nf(callOiWall.strike)} · ${qtyText(callOiWall.oi, lot, market)}`],
        ["GEX walls", `${summary.putWall ? nf(summary.putWall) : "—"} / ${summary.callWall ? nf(summary.callWall) : "—"}`]],
      how: "OI walls = largest open interest strike on each side of spot. GEX walls weight OI by gamma, so far strikes with little gamma count less.", view: "levels" }));
  }

  // 4. Fresh OI vs previous close (observed) with the common writing interpretation
  const withChg = parsed.contracts.filter(c => c.oiChg != null);
  if (withChg.length) {
    const callAdd = maxBy(withChg.filter(c => c.type === "CE" && c.strike >= S && c.oiChg > 0), "oiChg");
    const putAdd = maxBy(withChg.filter(c => c.type === "PE" && c.strike <= S && c.oiChg > 0), "oiChg");
    const totC = withChg.filter(c => c.type === "CE").reduce((a, c) => a + c.oiChg, 0);
    const totP = withChg.filter(c => c.type === "PE").reduce((a, c) => a + c.oiChg, 0);
    if (callAdd) out.push(sig({ id: "oi-call-add", topic: "oi", kind: callAdd.oiChg > 0.25 * Math.max(1, callAdd.oi) ? "watch" : "info", score: 60,
      title: `Call positions piling up at ${nf(callAdd.strike)}`,
      detail: `${qtyText(callAdd.oiChg, lot, market)} of new call open interest since yesterday's close, ${callAdd.strike === S ? "at the money" : ((callAdd.strike - S) / S * 100).toFixed(2) + "% above spot"}. Fresh call OI above spot is usually read as call writing — sellers betting the index stays below ${nf(callAdd.strike)}.`,
      evidence: [["OI change vs prev close", qtyText(callAdd.oiChg, lot, market, true)], ["Total OI now", qtyText(callAdd.oi, lot, market)], ["LTP", nf(callAdd.ltp, 2)]],
      how: "OI change is the provider's change versus the previous close. OI alone does not show who bought or sold; the 'writing' reading is a convention — confirm it with falling premium.", strike: callAdd.strike, view: "positioning" }));
    if (putAdd) out.push(sig({ id: "oi-put-add", topic: "oi", kind: putAdd.oiChg > 0.25 * Math.max(1, putAdd.oi) ? "watch" : "info", score: 58,
      title: `Put positions piling up at ${nf(putAdd.strike)}`,
      detail: `${qtyText(putAdd.oiChg, lot, market)} of new put open interest since yesterday's close, ${putAdd.strike === S ? "at the money" : ((S - putAdd.strike) / S * 100).toFixed(2) + "% below spot"}. Fresh put OI at or below spot is usually read as put writing — sellers expecting ${nf(putAdd.strike)} to hold.`,
      evidence: [["OI change vs prev close", qtyText(putAdd.oiChg, lot, market, true)], ["Total OI now", qtyText(putAdd.oi, lot, market)], ["LTP", nf(putAdd.ltp, 2)]],
      how: "Same convention as calls; OI does not identify the side.", strike: putAdd.strike, view: "positioning" }));
    if (totC !== 0 || totP !== 0) {
      const ratio = totC > 0 && totP > 0 ? totC / totP : null;
      const lean = totC > 0 && totP <= 0 ? "Only calls added fresh OI today; put OI fell overall."
        : totP > 0 && totC <= 0 ? "Only puts added fresh OI today; call OI fell overall."
        : ratio != null ? (ratio > 10 ? `Call OI grew by ${qtyText(totC, lot, market)} while put OI was almost flat (${qtyText(totP, lot, market, true)}).`
          : ratio < 0.1 ? `Put OI grew by ${qtyText(totP, lot, market)} while call OI was almost flat (${qtyText(totC, lot, market, true)}).`
          : ratio >= 1 ? `For every 1 put contract added, ${ratio.toFixed(1)} calls were added.` : `For every 1 call contract added, ${(1 / ratio).toFixed(1)} puts were added.`) : "Open interest fell on both sides — positions are being closed.";
      out.push(sig({ id: "oi-balance", topic: "imbalance", kind: ratio != null && (ratio > 2 || ratio < 0.5) || (totC > 0) !== (totP > 0) ? "watch" : "info", score: 50,
        title: totC <= 0 && totP <= 0 ? "Positions are being closed on both sides" : totC > totP ? "Today's fresh positioning leans to calls" : "Today's fresh positioning leans to puts",
        detail: `${lean} Heavy one-sided additions show where traders are committing new money for this expiry.`,
        evidence: [["Call OI change", qtyText(totC, lot, market, true)], ["Put OI change", qtyText(totP, lot, market, true)]],
        how: "Sum of OI change versus previous close across all strikes of the selected expiry.", view: "positioning" }));
    }
  }

  // 5. PCR (stock of positions)
  const cOI = parsed.contracts.filter(c => c.type === "CE" && c.oi > 0).reduce((a, c) => a + c.oi, 0);
  const pOI = parsed.contracts.filter(c => c.type === "PE" && c.oi > 0).reduce((a, c) => a + c.oi, 0);
  if (cOI > 0 && pOI > 0) {
    const pcr = pOI / cOI;
    const extreme = pcr < 0.6 || pcr > 1.5;
    out.push(sig({ id: "pcr", topic: "imbalance", kind: extreme ? "watch" : "info", score: extreme ? 55 : 20,
      title: `Put-call ratio ${pcr.toFixed(2)}: ${pcr < 1 ? "more calls than puts open" : "more puts than calls open"}`,
      detail: pcr < 0.7 ? `There are ${(1 / pcr).toFixed(1)} call contracts open for every put. Many traders read a low PCR as heavy call writing overhead; contrarians read it as complacency. Use it with the levels, not alone.`
        : pcr > 1.3 ? `There are ${pcr.toFixed(1)} put contracts open for every call — heavy put writing or hedging below. Many traders read a high PCR as support underneath; contrarians read it as crowded.`
        : "Calls and puts are fairly balanced — no strong lean from positioning alone.",
      evidence: [["Put OI", qtyText(pOI, lot, market)], ["Call OI", qtyText(cOI, lot, market)]],
      how: "PCR = total put OI ÷ total call OI for the selected expiry. Interpretations differ; it is shown as context, not a signal.", view: "positioning" }));
  }

  // 6. Max pain
  const mp = maxPain(parsed.contracts);
  if (mp) out.push(sig({ id: "maxpain", topic: "range", kind: days < 1.5 && Math.abs(mp.strike - S) / S > 0.004 ? "watch" : "info", score: days < 1.5 ? 45 : 15,
    title: `Max pain at ${nf(mp.strike)} (${pctS((mp.strike - S) / S * 100)} from spot)`,
    detail: `If expiry printed at ${nf(mp.strike)}, option holders would collectively lose the most. Some traders watch it as a magnet in the last day before expiry; earlier in the series it carries little weight.`,
    evidence: [["Max pain", nf(mp.strike)], ["Spot", nf(S, 1)], ["Days to expiry", days.toFixed(1)]],
    how: "Strike that minimises Σ OI × intrinsic value across all calls and puts of the expiry.", view: "levels" }));

  // 7. Gamma blast — observed bursts first, then model convexity
  const bursts = premiumBursts(snaps);
  const otmBurst = bursts.find(b => (b.type === "CE" ? b.strike > S : b.strike < S));
  if (otmBurst) out.push(sig({ id: "blast-live", topic: "gamma", kind: "hot", score: 120,
    title: `Gamma blast in progress: ${nf(otmBurst.strike)} ${otmBurst.type} ${pctS(otmBurst.gainPct, 0)} in ${otmBurst.minutes} min`,
    detail: `This out-of-the-money option's premium jumped from ${nf(otmBurst.ltp - otmBurst.dPx, 2)} to ${nf(otmBurst.ltp, 2)} as spot moved toward it. Near expiry, small index moves can multiply cheap option premiums — and reverse just as fast.`,
    evidence: [["Premium", `${nf(otmBurst.ltp - otmBurst.dPx, 2)} → ${nf(otmBurst.ltp, 2)}`], ["OI change", otmBurst.dOi == null ? "—" : qtyText(otmBurst.dOi, lot, market, true)]],
    how: "Observed in this browser's minute snapshots: OTM option LTP up ≥80% within ~15 minutes, starting premium ≥1.", strike: otmBurst.strike, view: "expiry" }));
  const conv = convexityTable(parsed.contracts, S, nowMs);
  if (conv.length) {
    const top = conv[0];
    const blastDay = days <= 1;
    const kind = blastDay && (summary.totals.netGex < 0 || (flip && Math.abs(dFlip) < 0.5)) ? "hot" : blastDay || top.gainPct >= 150 ? "watch" : "info";
    out.push(sig({ id: "blast-watch", topic: "gamma", kind, score: kind === "hot" ? 110 : kind === "watch" ? 70 : 25,
      title: blastDay ? `Expiry-day gamma watch: a 0.5% move could lift ${nf(top.strike)} ${top.type} by ${pctS(top.gainPct, 0)}` : `Gamma blast potential today: ${top.gainPct >= 150 ? "high" : top.gainPct >= 60 ? "moderate" : "low"} (${pctS(top.gainPct, 0)} on a 0.5% move)`,
      detail: blastDay
        ? `With under a day left, cheap out-of-the-money options near spot are extremely sensitive. ${summary.totals.netGex < 0 ? "Negative modelled gamma adds fuel: hedging would chase the move." : "Positive modelled gamma may still cushion small moves."}`
        : `${days.toFixed(1)} days to expiry. The most sensitive option near spot (${nf(top.strike)} ${top.type}) would move about ${pctS(top.gainPct, 0)} on a 0.5% index move — blasts usually need expiry-day convexity.`,
      evidence: conv.slice(0, 3).map(c => [`${nf(c.strike)} ${c.type}`, `${pctS(c.gainPct, 0)} on 0.5% · LTP ${nf(c.ltp, 2)}`]),
      how: "Model re-prices each OTM option within ±1.5% of spot after a 0.5% move toward it (IV and time held). Shows sensitivity, not a forecast.", strike: top.strike, view: "expiry" }));
  }

  // 8. Decay vs time
  const dv = decayVsTime(snaps);
  if (dv) {
    let kind = "info", title, detail;
    if (dv.actualPct < 0 && dv.ratio != null && dv.ratio >= 1.5) {
      kind = "hot"; title = `Straddle decaying ${dv.ratio.toFixed(1)}× faster than time alone`;
      detail = `The ${nf(dv.strike)} straddle lost ${Math.abs(dv.actualPct).toFixed(1)}% since ${new Date(dv.from).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false })}, while time decay alone explains ${Math.abs(dv.timePct).toFixed(1)}%. Extra decay usually means implied volatility is being sold down — option sellers in control.`;
    } else if (dv.actualPct > 0) {
      kind = "watch"; title = "Straddle gaining value despite time decay";
      detail = `The ${nf(dv.strike)} straddle rose ${dv.actualPct.toFixed(1)}% even though time alone would have taken ${Math.abs(dv.timePct).toFixed(1)}% out. Either spot is moving (${pctS(dv.spotMovePct)}) or implied volatility is rising — buyers are being paid.`;
    } else {
      title = "Decay is running at a normal pace";
      detail = `The ${nf(dv.strike)} straddle is down ${Math.abs(dv.actualPct).toFixed(1)}%, close to the ${Math.abs(dv.timePct).toFixed(1)}% that time alone explains.`;
    }
    const comp = (history || []).filter(h => Number.isFinite(h.decayPct));
    if (comp.length) detail += ` Comparable stored sessions averaged ${pctS(comp.reduce((a, h) => a + h.decayPct, 0) / comp.length, 1)}.`;
    out.push(sig({ id: "decay", topic: "decay", kind, score: kind === "hot" ? 105 : kind === "watch" ? 65 : 30, title, detail,
      evidence: [["Straddle", `${nf(dv.startPx, 2)} → ${nf(dv.endPx, 2)}`], ["Actual", pctS(dv.actualPct, 1)], ["Time-only (model)", pctS(dv.timePct, 1)], ["Spot move", pctS(dv.spotMovePct)]],
      how: "Actual = ATM straddle mid change between this browser's first and latest snapshot today. Time-only = Black–Scholes re-price of the same straddle with spot and IV frozen.", view: "decay" }));
  } else if (st?.total && T > 0) {
    const K = st.strike;
    const leg = t => parsed.contracts.find(c => c.strike === K && c.type === t);
    const price = TT => ["CE", "PE"].reduce((s2, t) => { const c = leg(t); const g = c?.iv ? greeksFor(c, S, 0, { T: TT }) : null; return g ? s2 + g.price : NaN; }, 0);
    const p0 = price(T), p1 = price(Math.max(T - 1 / 365, 1e-6));
    if (Number.isFinite(p0) && Number.isFinite(p1) && p0 > 0) out.push(sig({ id: "decay", topic: "decay", kind: "info", score: 28,
      title: `Time decay takes about ${nf(p0 - p1, 1)} points a day out of the straddle`,
      detail: `With ${days.toFixed(1)} days left, the ${nf(K)} straddle loses roughly ${((1 - p1 / p0) * 100).toFixed(1)}% per calendar day from time alone. During market hours this panel compares the actual decay with that pace and flags when it runs faster or slower.`,
      evidence: [["Straddle now (model)", nf(p0, 2)], ["After one day (model)", nf(p1, 2)]],
      how: "Black–Scholes re-price of the ATM straddle one calendar day later, spot and IV held.", view: "decay" }));
  }

  // 9. Quote imbalance near the money
  const qi = quoteImbalance(parsed.contracts, S);
  for (const [side, label] of [["calls", "Call"], ["puts", "Put"]]) {
    const q = qi[side];
    if (!q || Math.abs(q.imbalance) < 0.3) continue;
    out.push(sig({ id: "quotes-" + side, topic: "imbalance", kind: "watch", score: 45,
      title: `${label} quotes near the money are ${q.imbalance > 0 ? "bid-heavy" : "offer-heavy"} (${pctS(q.imbalance * 100, 0)})`,
      detail: `${q.imbalance > 0 ? "More size is waiting to buy than to sell" : "More size is waiting to sell than to buy"} in the best ${label.toLowerCase()} quotes within ±1% of spot. Displayed quotes change fast and are not executed trades.`,
      evidence: [["Best-bid quantity", qtyText(q.bid, null, market)], ["Best-ask quantity", qtyText(q.ask, null, market)], ["Strikes", String(q.strikes)]],
      how: "Imbalance = (Σ best-bid qty − Σ best-ask qty) ÷ (sum), across strikes within ±1% of spot. Snapshot of displayed quotes; outside market hours it is the closing book.", view: "positioning" }));
  }

  // 10. Churn
  const churn = parsed.contracts.filter(c => c.vol > 0 && c.oi > 0).map(c => ({ ...c, r: c.vol / c.oi })).sort((a, b) => b.r - a.r)[0];
  if (churn && churn.r >= 20) out.push(sig({ id: "churn", topic: "oi", kind: "info", score: 22,
    title: `Heavy day-trading at ${nf(churn.strike)} ${churn.type}`,
    detail: `It traded ${Math.round(churn.r)}× its open interest — most of that volume opened and closed the same day rather than building lasting positions.`,
    evidence: [["Volume", qtyText(churn.vol, lot, market)], ["Open interest", qtyText(churn.oi, lot, market)]],
    how: "Volume ÷ OI for the session. High ratios mean churn; fresh positioning shows up as OI change instead.", strike: churn.strike, view: "positioning" }));

  // 11. Skew
  const sk = skew25(parsed.contracts, S, nowMs);
  if (sk) {
    const rr = sk.riskReversal;
    out.push(sig({ id: "skew", topic: "vol", kind: rr <= -2 || rr >= 1 ? "watch" : "info", score: rr <= -2 || rr >= 1 ? 40 : 12,
      title: rr <= -2 ? "Downside protection is expensive" : rr >= 1 ? "Upside calls are in demand" : "Volatility skew is mild",
      detail: rr <= -2 ? `25-delta puts cost ${Math.abs(rr).toFixed(2)} vol points more than equivalent calls — traders are paying up to hedge a fall.`
        : rr >= 1 ? `25-delta calls cost ${rr.toFixed(2)} vol points more than equivalent puts — unusual, and points to demand for upside.`
        : `25-delta puts and calls are priced within ${Math.abs(rr).toFixed(2)} vol points — no strong fear or greed in the options.`,
      evidence: [["25Δ put IV", sk.put25.iv.toFixed(2) + "% @ " + nf(sk.put25.strike)], ["25Δ call IV", sk.call25.iv.toFixed(2) + "% @ " + nf(sk.call25.strike)], ["Risk reversal", rr.toFixed(2) + " pts"]],
      how: "Risk reversal = IV(25Δ call) − IV(25Δ put), deltas from the model using each contract's IV.", view: "decay" }));
  }

  // 12. IV vs realised
  const rvRef = rv?.status === "ready" ? rv.rv20 ?? rv.rv10 : null;
  if (st?.atmIv != null && rvRef != null) {
    const spread = st.atmIv - rvRef;
    out.push(sig({ id: "ivrv", topic: "vol", kind: Math.abs(spread) >= 5 ? "watch" : "info", score: Math.abs(spread) >= 5 ? 42 : 18,
      title: spread > 0 ? `Options are pricing more movement than recent history (${spread.toFixed(1)} pts)` : `Options are cheaper than recent realised movement (${Math.abs(spread).toFixed(1)} pts)`,
      detail: spread > 0 ? "Implied volatility is above 20-day realised volatility — buyers pay a premium; sellers are paid for it." : "Implied volatility is below 20-day realised volatility — options look cheap relative to how much the underlying has actually moved.",
      evidence: [["ATM IV", st.atmIv.toFixed(2) + "%"], ["20-day RV", rvRef.toFixed(2) + "%"]],
      how: "RV = annualised close-to-close volatility of daily closes.", view: "decay" }));
  }

  // 13. Concentration
  const eff = summary.hhi?.combined?.effectiveStrikes;
  if (eff != null && eff < 8) out.push(sig({ id: "hhi", topic: "gamma", kind: "watch", score: 38,
    title: `Gamma is concentrated in about ${eff.toFixed(0)} strikes`,
    detail: "When exposure sits in a handful of strikes, those levels tend to matter more for intraday behaviour.",
    evidence: [["HHI", summary.hhi.combined.hhi10k.toLocaleString("en-IN")]], how: "Effective strikes = 1 ÷ Herfindahl index of absolute strike GEX shares.", view: "levels" }));

  const signals = out.sort((a, b) => KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] || b.score - a.score);

  // Headline: one sentence a first-time visitor can act on.
  const regimeWord = flip != null && Math.abs(dFlip) < 0.3 ? "at a tipping point" : summary.totals.netGex > 0 ? "set up for a range" : "set up for bigger moves";
  const headline = `${symbol || "The index"} looks ${regimeWord}: options price ${st?.total ? `±${st.impliedMovePct.toFixed(2)}% (${nf(st.lower)} – ${nf(st.upper)})` : "an unknown range"} by ${dayName(expiry)}, with the heaviest put OI at ${putOiWall ? nf(putOiWall.strike) : "—"} below and call OI at ${callOiWall ? nf(callOiWall.strike) : "—"} above.`;

  return {
    headline, signals,
    levels: { spot: S, flip, callWall: summary.callWall, putWall: summary.putWall, callOiWall: callOiWall?.strike ?? null, putOiWall: putOiWall?.strike ?? null,
      maxPain: mp?.strike ?? null, pin: summary.pin?.strike ?? null, lower: st?.lower ?? null, upper: st?.upper ?? null, expiry, days },
  };
}
