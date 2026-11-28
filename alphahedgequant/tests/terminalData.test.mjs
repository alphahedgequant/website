import test from "node:test";
import assert from "node:assert/strict";
import {
  barTimeMs, ist, normaliseBars, aggregateBars, dailyCloses, sessionReturns, volumeVsNormal, sma,
  rowChangePct, movers, sectorPerformance, breadth, nseStatus, compactIN, slotLabel,
} from "../lib/terminalData.mjs";

// Real bar layout from /api/terminal?view=history (RELIANCE, 27 Nov 2026): UTC strings,
// 09:15–15:15 IST every 5 min (73 bars), no 15:20 bar, sometimes a 15:25 closing bar.
function session(day, { close = 100, vol = 1000, withClose = true } = {}) {
  const out = [];
  for (let m = 3 * 60 + 45; m <= 9 * 60 + 45; m += 5) {
    out.push({ date: `${day} ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, open: close, high: close + 1, low: close - 1, close, volume: vol });
  }
  if (withClose) out.push({ date: `${day} 09:55`, open: close, high: close, low: close, close, volume: vol * 10 });
  return out;
}

test("history timestamps are UTC: 03:45 → 09:15 IST, 09:55 → 15:25 IST", () => {
  const a = ist(barTimeMs("2026-11-27 03:45"));
  assert.deepEqual([a.day, slotLabel(a.minute)], ["2026-11-27", "09:15"]);
  const b = ist(barTimeMs("2026-11-27 09:55"));
  assert.equal(slotLabel(b.minute), "15:25");
  assert.equal(barTimeMs("bad"), null);
});

test("normalise keeps missing volume as null and sorts", () => {
  const bars = normaliseBars([{ date: "2026-11-27 03:50", close: 2, volume: null }, { date: "2026-11-27 03:45", close: 1, volume: 5 }, { date: "x", close: 1 }]);
  assert.equal(bars.length, 2);
  assert.equal(bars[0].close, 1);
  assert.equal(bars[1].volume, null);
});

test("aggregation aligns 1h buckets to the 09:15 IST open and sums volume", () => {
  const bars = normaliseBars(session("2026-11-27"));
  const h = aggregateBars(bars, "1h");
  assert.equal(slotLabel(h[0].minute), "09:15");
  assert.equal(h[0].volume, 12 * 1000);
  const d = aggregateBars(bars, "1d");
  assert.equal(d.length, 1);
  assert.equal(d[0].volume, 73 * 1000 + 10000);
});

test("RVOL baseline: past sessions count up to their first gap; today excluded from its own baseline", () => {
  const raw = [];
  const days = ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-16"];
  days.forEach((d, i) => raw.push(...session(d, { vol: 1000, withClose: i % 2 === 0 })));
  raw.push(...session("2026-11-17", { vol: 2000, withClose: false }).slice(0, 10)); // today: 10 bars so far, double volume
  const v = volumeVsNormal(normaliseBars(raw), { lookback: 15 });
  assert.equal(v.session, "2026-11-17");
  assert.equal(v.baselineSessions, 5);
  assert.equal(v.points.length, 10);
  const last = v.points.at(-1);
  assert.equal(last.time, "10:00");
  assert.equal(last.today, 20000);
  assert.equal(last.mean, 10000);
  assert.equal(last.sessions, 5);
  assert.equal(last.rvol, 2);
  assert.equal(v.band, "elevated");
  // A slot after a gap (15:20 missing) is never filled from later bars.
  const full = volumeVsNormal(normaliseBars([...session("2026-11-10"), ...session("2026-11-11")]));
  assert.ok(full.points.every(p => p.minute <= 15 * 60 + 15), "stops at the 15:20 gap");
});

test("returns need enough sessions; SMA waits for its window", () => {
  const raw = [];
  for (let i = 0; i < 8; i++) raw.push(...session(`2026-11-${String(10 + i).padStart(2, "0")}`, { close: 100 + i }).slice(0, 2));
  const r = sessionReturns(normaliseBars(raw));
  assert.equal(r.find(x => x.label === "1D").pct.toFixed(4), ((107 / 106 - 1) * 100).toFixed(4));
  assert.equal(r.find(x => x.label === "1M").pct, null);
  assert.equal(dailyCloses(normaliseBars(raw)).length, 8);
  assert.deepEqual(sma([1, 2, 3, 4], 3), [null, null, 2, 3]);
});

test("screener % fix: changePct 0 with a real change is recomputed from change and price", () => {
  // Live row EIEL 28 Nov: price 163.2, change 0.89, changePct 0, prevClose 163.2 (overwritten)
  const x = rowChangePct({ price: 163.2, change: 0.89, changePct: 0, prevClose: 163.2 });
  assert.equal(x.derived, true);
  assert.equal(x.pct.toFixed(4), (0.89 / (163.2 - 0.89) * 100).toFixed(4));
  assert.deepEqual(rowChangePct({ price: 10, change: 0, changePct: 0 }), { pct: 0, derived: false });
  assert.deepEqual(rowChangePct({ price: 10, change: 1, changePct: 11.1 }), { pct: 11.1, derived: false });
});

test("movers, sectors and breadth use the same % rule and skip unclassified sectors", () => {
  const rows = [
    { symbol: "A", price: 110, change: 10, changePct: 0, volume: 100, sector: "Energy", classificationStatus: "provider_verified" },
    { symbol: "B", price: 90, change: -10, changePct: 0, volume: 1000, sector: "Energy", classificationStatus: "provider_verified" },
    { symbol: "C", price: 50, change: 0, changePct: 0, volume: 10, sector: "Unclassified" },
  ];
  const m = movers(rows);
  assert.equal(m.gainers[0].symbol, "A");
  assert.equal(m.losers[0].symbol, "B");
  assert.equal(m.active[0].symbol, "B");
  assert.equal(m.derivedCount, 2);
  const s = sectorPerformance(rows);
  assert.equal(s.sectors.length, 1);
  assert.equal(s.unclassified, 1);
  assert.deepEqual(breadth(rows), { up: 1, down: 1, flat: 1, total: 3 });
});

test("NSE status and Indian compact units", () => {
  assert.equal(nseStatus(Date.UTC(2026, 10, 28, 15, 0)).open, false, "Saturday");
  assert.match(nseStatus(Date.UTC(2026, 10, 28, 15, 0)).next, /Mon 09:15/);
  assert.equal(nseStatus(Date.UTC(2026, 10, 27, 5, 0)).open, true, "Friday 10:30 IST");
  assert.equal(compactIN(18370332196864), "18.37L Cr");
  assert.equal(compactIN(12173225), "1.22 Cr");
  assert.equal(compactIN(169418), "1.69 L");
});
