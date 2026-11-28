import test from "node:test";
import assert from "node:assert/strict";
import {
  normCdf, bsGreeks, yearsToExpiry, expiryCloseMs, tagExpiries, isNseSession, contractsFromChain,
  exposuresByStrike, spotProfile, zeroCrossings, nearestTo, walls, hhi, pinScores, hedgeLadder,
  gammaDecay, charmByStrike, dexFlow, ivSmile, straddle, skew25, realizedVolFromBars, classifyBuildup,
  snapshotFromChain, contractsFromSnapshot, diffSnapshots, aggressorEstimate, oiRotation, oiTape,
  oiSinceFirst, summarize, MIN_T_YEARS,
} from "../lib/optionsIntel.mjs";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} expected ${b}, got ${a}`);
const NOW = Date.UTC(2026, 10, 28, 10, 10); // Sat 28 Nov 2026 15:40 IST

function chain({ spot = 100, expiry = "2026-12-01", rows }) {
  return { success: true, data: { spot_price: spot, expiry, lot_size: 65, received_at: new Date(NOW).toISOString(), strikes: rows } };
}
const leg = (o = {}) => ({ oi: 1000, oi_change: 0, volume: 100, ltp: 1, bid_price: 0.9, ask_price: 1.1, iv: 20, ...o });

test("normal CDF and Black–Scholes match textbook values", () => {
  close(normCdf(0), 0.5, 1e-7);
  close(normCdf(1.96), 0.975, 1e-4);
  const g = bsGreeks(100, 100, 1, 0.2, "CE", 0.05);
  close(g.delta, 0.6368, 1e-4, "call delta");
  close(g.gamma, 0.018762, 1e-5, "gamma");
  close(g.price, 10.4506, 1e-3, "call price");
  const p = bsGreeks(100, 100, 1, 0.2, "PE", 0.05);
  close(p.delta, g.delta - 1, 1e-12, "put delta = call delta − 1");
  close(g.price - p.price, 100 - 100 * Math.exp(-0.05), 1e-6, "put–call parity");
  assert.equal(bsGreeks(100, 100, 0, 0.2, "CE"), null);
  assert.equal(bsGreeks(100, 100, 1, 0, "CE"), null);
});

test("recomputed delta is close to the provider's NIFTY delta (live sample, deep ITM)", () => {
  // Provider: NIFTY 24550 CE, spot 25607.2, IV 33.89, delta 0.8888, expiry 2026-12-01 (read 28 Nov 15:40 IST).
  // Deep-ITM delta is very sensitive to the time convention: the provider's value implies ~3.9 days,
  // AHQ uses calendar time to 15:30 IST (~3.0 days). Agreement within 0.04 is the documented tolerance;
  // the remaining gap is the provider's time convention, recorded in the Method panel.
  const T = yearsToExpiry("2026-12-01", NOW);
  const g = bsGreeks(25607.2, 24550, T, 0.3389, "CE");
  close(g.delta, 0.8888, 0.04, "provider delta");
  const g4 = bsGreeks(25607.2, 24550, 3.9 / 365, 0.3389, "CE");
  close(g4.delta, 0.8888, 0.01, "same delta once the provider's ~3.9-day horizon is used");
});

test("time to expiry uses 15:30 IST and is floored, never negative", () => {
  assert.equal(new Date(expiryCloseMs("2026-12-01")).toISOString(), "2026-12-01T10:00:00.000Z");
  assert.equal(yearsToExpiry("2020-01-01", NOW), MIN_T_YEARS);
  assert.equal(yearsToExpiry("bad", NOW), null);
});

test("NSE session and expiry tagging come from the clock and contract list, not hardcoded weekdays", () => {
  assert.equal(isNseSession(NOW), false, "Saturday");
  assert.equal(isNseSession(Date.UTC(2026, 10, 27, 5, 0)), true, "Friday 10:30 IST");
  const tags = tagExpiries(["2026-12-01", "2026-12-08", "2026-12-29", "2027-01-25", "2026-11-28"], NOW);
  assert.equal(tags.find(t => t.expiry === "2026-11-28").zeroDte, true);
  assert.equal(tags.find(t => t.expiry === "2026-12-29").monthly, true);
  assert.equal(tags.find(t => t.expiry === "2026-12-08").weekly, true);
});

test("missing or invalid IV / OI are excluded and counted — never treated as zero", () => {
  const p = contractsFromChain(chain({ rows: [
    { strike_price: 100, call: leg({ iv: null }), put: leg({ oi: null }) },
    { strike_price: 105, call: leg({ iv: 0 }), put: leg() },
  ] }));
  assert.equal(p.quality.contracts, 4);
  assert.equal(p.quality.missingIv, 1);
  assert.equal(p.quality.invalidIv, 1);
  assert.equal(p.quality.missingOi, 1);
  const ex = exposuresByStrike(p.contracts, { spot: 100, nowMs: NOW });
  assert.equal(ex.excluded, 3);
  assert.equal(ex.rows.find(r => r.strike === 100).callGex, 0);
  assert.ok(ex.rows.find(r => r.strike === 105).putGex < 0);
});

test("GEX sign convention: calls positive, puts negative; units are ₹ per 1% move", () => {
  const p = contractsFromChain(chain({ rows: [{ strike_price: 100, call: leg(), put: leg() }] }));
  const ex = exposuresByStrike(p.contracts, { spot: 100, nowMs: NOW });
  const row = ex.rows[0];
  assert.ok(row.callGex > 0 && row.putGex < 0);
  close(row.netGex, 0, 1e-9, "identical call/put cancel");
  const T = yearsToExpiry("2026-12-01", NOW);
  const g = bsGreeks(100, 100, T, 0.2, "CE").gamma;
  close(row.callGex, g * 1000 * 100 * 100 * 0.01, 1e-6);
  close(row.share, 1, 1e-12);
});

test("gamma flip: one crossing in a put-heavy-below / call-heavy-above book; none when one-sided", () => {
  const rows = [90, 95, 100, 105, 110].map(k => ({ strike_price: k,
    call: leg({ oi: k >= 100 ? 5000 : 10 }), put: leg({ oi: k < 100 ? 5000 : 10 }) }));
  const p = contractsFromChain(chain({ rows }));
  const prof = spotProfile(p.contracts, { spot: 100, nowMs: NOW }, { rangePct: 0.12, points: 121 });
  const xs = zeroCrossings(prof, "netGex");
  assert.ok(xs.length >= 1);
  const f = nearestTo(xs, 100);
  assert.ok(f > 92 && f < 108, "flip between the put and call clusters: " + f);
  const callsOnly = contractsFromChain(chain({ rows: rows.map(r => ({ ...r, put: undefined })) }));
  assert.deepEqual(zeroCrossings(spotProfile(callsOnly.contracts, { spot: 100, nowMs: NOW }), "netGex"), []);
  assert.equal(nearestTo([], 100), null);
  // multiple crossings handled safely
  assert.deepEqual(zeroCrossings([{ spot: 1, netGex: -1 }, { spot: 2, netGex: 1 }, { spot: 3, netGex: -1 }], "netGex"), [1.5, 2.5]);
});

test("walls, HHI and pin score are bounded and transparent", () => {
  const rows = [
    { strike: 95, callGex: 1, putGex: -50, absGex: 51 },
    { strike: 100, callGex: 30, putGex: -30, absGex: 60 },
    { strike: 105, callGex: 80, putGex: -1, absGex: 81 },
  ];
  assert.deepEqual(walls(rows), { callWall: 105, putWall: 95 });
  const equal = hhi([{ callGex: 1, putGex: -1, absGex: 2 }, { callGex: 1, putGex: -1, absGex: 2 }]);
  close(equal.combined.hhi, 0.5, 1e-12);
  close(equal.combined.effectiveStrikes, 2, 1e-12);
  assert.equal(hhi([{ callGex: 0, putGex: 0, absGex: 0 }]).combined, null);
  const pins = pinScores(rows, 100, 2 / 365, 0.15);
  assert.ok(pins.length > 0);
  for (const p of pins) {
    assert.ok(p.score >= 0 && p.score <= 100);
    for (const v of Object.values(p.components)) assert.ok(v >= 0 && v <= 1);
  }
});

test("hedge ladder: dealer long-gamma book sells rallies and buys dips", () => {
  const p = contractsFromChain(chain({ rows: [{ strike_price: 100, call: leg({ oi: 10000 }) }] }));
  const h = hedgeLadder(p.contracts, { spot: 100, nowMs: NOW });
  assert.ok(h.scenarios.find(s => s.movePct === 1).hedgeUnits < 0);
  assert.ok(h.scenarios.find(s => s.movePct === -1).hedgeUnits > 0);
  assert.equal(h.perStrikeUp1.length, 1);
});

test("gamma decay, charm, vanna and DEX flow produce finite, labelled outputs", () => {
  const rows = [95, 100, 105].map(k => ({ strike_price: k, call: leg({ oi_change: 200 }), put: leg({ oi_change: -100 }) }));
  const p = contractsFromChain(chain({ rows }));
  const opts = { spot: 100, nowMs: NOW };
  const d = gammaDecay(p.contracts, opts);
  assert.equal(d.time[0].label, "Now");
  assert.ok(d.time.every(x => Number.isFinite(x.netGex)));
  assert.equal(d.iv.length, 5);
  const ch = charmByStrike(p.contracts, opts);
  assert.ok(ch.every(r => Number.isFinite(r.netDay) && Number.isFinite(r.netToExpiry)));
  const f = dexFlow(p.contracts, opts);
  assert.ok(f.totals.added > 0, "calls added → positive delta added");
  assert.ok(f.totals.reduced > 0, "puts reduced (negative delta × negative OI change)");
});

test("volatility: OTM smile, straddle breakevens and 25Δ skew", () => {
  const rows = [90, 95, 100, 105, 110].map(k => ({ strike_price: k,
    call: leg({ iv: 18 + (k - 100) * 0.1, bid_price: 2, ask_price: 2.2 }),
    put: leg({ iv: 22 - (k - 100) * 0.2, bid_price: 2.9, ask_price: 3.1 }) }));
  const p = contractsFromChain(chain({ rows }));
  const sm = ivSmile(p.contracts, 100);
  assert.ok(sm.points.every(x => (x.type === "PE" ? x.strike < 100 : x.strike >= 100)));
  const st = straddle(p.contracts, 100);
  close(st.total, 2.1 + 3.0, 1e-9);
  close(st.upper, 105.1, 1e-9);
  assert.equal(st.callBasis, "mid");
  const sk = skew25(p.contracts, 100, NOW);
  assert.ok(sk && Number.isFinite(sk.riskReversal));
});

test("realised volatility: zero for a flat series, positive for a moving one", () => {
  const bars = Array.from({ length: 25 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")} 09:55`, close: 100 }));
  assert.equal(realizedVolFromBars(bars).rv10, 0);
  const moving = bars.map((b, i) => ({ ...b, close: 100 * (1 + (i % 2 ? 0.01 : -0.01)) }));
  assert.ok(realizedVolFromBars(moving).rv20 > 10);
});

test("buildup classification never forces small moves into a label", () => {
  assert.equal(classifyBuildup(100, 2), "long buildup");
  assert.equal(classifyBuildup(100, -2), "short buildup");
  assert.equal(classifyBuildup(-100, 2), "short covering");
  assert.equal(classifyBuildup(-100, -2), "long unwinding");
  assert.equal(classifyBuildup(100, 0.01), "ambiguous");
  assert.equal(classifyBuildup(null, 1), "unavailable");
});

test("snapshots round-trip and drive flow, tape, rotation and estimated aggressor balance", () => {
  const mk = (t, oi, ltp, vol, bid, ask) => {
    const parsed = contractsFromChain(chain({ rows: [{ strike_price: 100, call: leg({ oi, ltp, volume: vol, bid_price: bid, ask_price: ask }), put: leg() }] }));
    parsed.receivedAt = new Date(t).toISOString();
    return snapshotFromChain(parsed, t + 500);
  };
  const a = mk(NOW, 1000, 10, 100, 9.9, 10.1), b = mk(NOW + 60000, 1500, 10.5, 400, 10.3, 10.5);
  const back = contractsFromSnapshot(b).contracts.find(c => c.type === "CE");
  assert.equal(back.oi, 1500); close(back.iv, 0.2, 1e-9);
  const d = diffSnapshots(a, b).find(x => x.type === "CE");
  assert.equal(d.dOi, 500); assert.equal(d.class, "long buildup");
  assert.deepEqual(diffSnapshots(a, { ...b, expiry: "2026-12-08" }), [], "never mixes expiries");
  const ag = aggressorEstimate(a, b);
  assert.equal(ag.totals.buy, 300, "LTP at ask → buyer-initiated (estimated)");
  assert.equal(oiRotation([a, b])[0].callChg, 500);
  const tape = oiTape([a, b]);
  assert.equal(tape[0].dOi, 500); assert.ok(tape[0].ingestTs > tape[0].sourceTs);
  assert.equal(oiSinceFirst([b, a]).rows.find(x => x.type === "CE").dOi, 500);
});

test("summarize returns key levels for a realistic chain", () => {
  const rows = [];
  for (let k = 24000; k <= 27000; k += 100) rows.push({ strike_price: k,
    call: leg({ oi: k > 25600 ? 200000 + (k === 25800 ? 2000000 : 0) : 20000, iv: 13 }),
    put: leg({ oi: k < 25600 ? 200000 + (k === 25400 ? 2000000 : 0) : 20000, iv: 15 }) });
  const s = summarize(contractsFromChain(chain({ spot: 25607.2, rows })), { nowMs: NOW });
  // Walls are GEX-based (gamma × OI), not raw OI: a far-OTM OI pile with tiny gamma is not a wall.
  assert.equal(s.callWall, 25800);
  assert.equal(s.putWall, 25400);
  assert.ok(s.flip == null || (s.flip > 24300 && s.flip < 26900));
  assert.ok(["positive", "negative", "flat"].includes(s.regime));
  assert.ok(s.straddle.total > 0);
});

test("live NIFTY fixture (28 Nov 2026): levels are finite, IV=0 quotes excluded, deltas near provider", async () => {
  const { readFileSync } = await import("node:fs");
  const j = JSON.parse(readFileSync(new URL("./fixtures/nifty-chain-2026-11-28.json", import.meta.url), "utf8"));
  const now = Date.parse(j.data.received_at);
  const p = contractsFromChain(j);
  assert.equal(p.quality.invalidIv, 21, "deep-ITM quotes with IV 0 are excluded and counted");
  const s = summarize(p, { nowMs: now });
  assert.equal(s.callWall, 25800);
  assert.equal(s.putWall, 25500);
  assert.equal(s.flipCount, 1);
  assert.ok(s.flip > 25300 && s.flip < 25607, "flip just below spot: " + s.flip);
  assert.equal(s.regime, "positive");
  close(s.straddle.total, 302.05, 1e-9);
  let sum = 0, n = 0;
  for (const r of j.data.strikes) for (const [t, q] of [["CE", r.call], ["PE", r.put]]) {
    if (!(q?.iv > 0.5)) continue;
    const g = bsGreeks(p.spot, r.strike_price, yearsToExpiry(j.data.expiry, now), q.iv / 100, t);
    sum += Math.abs(g.delta - q.delta); n++;
  }
  assert.ok(sum / n < 0.03, "mean |Δ − provider Δ| = " + (sum / n).toFixed(4));
});
