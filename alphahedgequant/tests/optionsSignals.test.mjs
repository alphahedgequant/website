import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contractsFromChain, summarize, snapshotFromChain } from "../lib/optionsIntel.mjs";
import { buildStory, maxPain, quoteImbalance, convexityTable, premiumBursts, decayVsTime, probInsideStraddle, qtyText } from "../lib/optionsSignals.mjs";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/nifty-chain-2026-11-28.json", import.meta.url), "utf8"));
const NOW = Date.parse(fixture.data.received_at);

test("max pain is the strike with the smallest payout to holders", () => {
  const c = [
    { strike: 90, type: "PE", oi: 100 }, { strike: 100, type: "CE", oi: 100 }, { strike: 100, type: "PE", oi: 100 }, { strike: 110, type: "CE", oi: 100 },
  ];
  assert.equal(maxPain(c).strike, 100);
  assert.equal(maxPain([{ strike: 1, type: "CE", oi: 1 }]), null);
});

test("quote imbalance uses displayed best-bid/ask quantities only", () => {
  const c = [{ type: "CE", strike: 100, bidQty: 300, askQty: 100 }, { type: "PE", strike: 100, bidQty: null, askQty: 50 }];
  const q = quoteImbalance(c, 100);
  assert.equal(q.calls.imbalance, 0.5);
  assert.equal(q.puts, null, "missing quantities → no reading");
});

test("probability inside the straddle grows with the straddle and is bounded", () => {
  const p1 = probInsideStraddle({ total: 1, atmIv: 20 }, 100, 0.01), p2 = probInsideStraddle({ total: 3, atmIv: 20 }, 100, 0.01);
  assert.ok(p1 > 0 && p2 > p1 && p2 < 1);
  assert.equal(probInsideStraddle({ total: null, atmIv: 20 }, 100, 0.01), null);
});

test("qtyText: changes are signed, stocks are not", () => {
  assert.equal(qtyText(9546000, 65), "95.46 L units (1,46,862 lots)");
  assert.equal(qtyText(9546000, 65, "IN", true), "+95.46 L units (1,46,862 lots)");
  assert.equal(qtyText(-500, null, "IN", true), "−500 units");
});

test("live NIFTY story: grounded readings with evidence and no invented values", () => {
  const p = contractsFromChain(fixture), s = summarize(p, { nowMs: NOW });
  const story = buildStory({ parsed: p, summary: s, nowMs: NOW, symbol: "NIFTY" });
  assert.match(story.headline, /^NIFTY looks set up for a range: options price ±1\.18% \(25,298 – 25,902\) by 1 Dec/);
  const ids = story.signals.map(x => x.id);
  for (const id of ["regime", "range", "walls", "oi-call-add", "oi-put-add", "oi-balance", "pcr", "maxpain", "blast-watch", "decay", "skew"]) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes("blast-live"), "no snapshots → no 'blast in progress' claim");
  assert.ok(!ids.includes("ivrv"), "no RV history for NIFTY → no IV-vs-RV claim");
  for (const x of story.signals) {
    assert.ok(["hot", "watch", "info"].includes(x.kind));
    assert.ok(x.title && x.detail && x.how, x.id);
    assert.ok(!/NaN|undefined|Infinity/.test(x.title + x.detail + JSON.stringify(x.evidence)), x.id + ": " + x.title + " " + x.detail);
  }
  const callAdd = story.signals.find(x => x.id === "oi-call-add");
  assert.match(callAdd.title, /27,000/);
  assert.match(callAdd.detail, /above spot/);
  const putAdd = story.signals.find(x => x.id === "oi-put-add");
  assert.match(putAdd.detail, /below spot/);
  assert.equal(story.levels.maxPain, 25700);
  assert.equal(story.levels.callOiWall, 27000);
  assert.equal(story.levels.putOiWall, 25000);
  // ranked: hot > watch > info
  const w = { hot: 3, watch: 2, info: 1 };
  for (let i = 1; i < story.signals.length; i++) assert.ok(w[story.signals[i - 1].kind] >= w[story.signals[i].kind]);
  // decay reading off-hours is the model pace, clearly worded
  assert.match(story.signals.find(x => x.id === "decay").title, /Time decay takes about/);
});

test("gamma blast: convexity is model sensitivity; 'in progress' needs an observed premium burst", () => {
  const p = contractsFromChain(fixture);
  const conv = convexityTable(p.contracts, p.spot, NOW);
  assert.ok(conv.length > 3 && conv.every(c => Number.isFinite(c.gainPct)));
  assert.ok(conv.every(c => (c.type === "CE" ? c.strike > p.spot : c.strike < p.spot)), "only OTM options");
  const mk = (t, ltp) => {
    const j = structuredClone(fixture);
    const row = j.data.strikes.find(r => r.strike_price === 25900);
    row.call.ltp = ltp; row.call.bid_price = ltp - 0.05; row.call.ask_price = ltp + 0.05;
    j.data.received_at = new Date(t).toISOString();
    return snapshotFromChain(contractsFromChain(j), t);
  };
  const bursts = premiumBursts([mk(NOW, 20), mk(NOW + 15 * 60000, 52)]);
  assert.equal(bursts[0].strike, 25900);
  assert.equal(Math.round(bursts[0].gainPct), 160);
  assert.deepEqual(premiumBursts([mk(NOW, 20), mk(NOW + 15 * 60000, 25)]), [], "25% is not a blast");
});

test("decay vs time compares actual straddle change with the model's time-only change", () => {
  const mk = (t, f) => {
    const j = structuredClone(fixture);
    for (const r of j.data.strikes) if (r.strike_price === 25600) for (const leg of [r.call, r.put]) {
      leg.bid_price = +(leg.bid_price * f).toFixed(2); leg.ask_price = +(leg.ask_price * f).toFixed(2); leg.ltp = +(leg.ltp * f).toFixed(2);
    }
    j.data.received_at = new Date(t).toISOString();
    return snapshotFromChain(contractsFromChain(j), t);
  };
  const d = decayVsTime([mk(NOW, 1), mk(NOW + 3 * 3600000, 0.8)]);
  assert.ok(d.actualPct < -19 && d.actualPct > -21);
  assert.ok(d.timePct < 0, "time alone reduces value");
  assert.ok(d.ratio > 1.5, "20% in 3h is far faster than time alone");
  assert.equal(decayVsTime([mk(NOW, 1), mk(NOW + 5 * 60000, 0.8)]), null, "needs ≥ 20 minutes");
});
