// lib/quantEngine.js
// Deterministic, whitelisted backtest engine for the AI Quant Copilot.
//
// SAFETY MODEL: the LLM NEVER produces executable code. It produces a JSON
// spec which is validated here against a strict whitelist (indicators, rule
// types, parameter ranges). Anything outside the whitelist is rejected.
// The backtest itself is pure deterministic JS — same spec + same candles
// always produce the same result.
//
// Costs: 0.05% per side (0.1% round trip). Signals computed on bar close,
// executed at the NEXT bar's open (no lookahead). Optional ATR stop.

const INTERVALS = { "1d": 252, "1wk": 52 };
const IND_WHITELIST = ["sma", "ema", "rsi", "close", "value"];
const RULE_TYPES = ["cross_above", "cross_below", "above", "below"];
const COST_PER_SIDE = 0.0005; // 0.05%

// ── indicators (all return arrays aligned to candles; null until warm) ──

function smaSeries(vals, n) {
  const out = new Array(vals.length).fill(null);
  let sum = 0;
  for (let i = 0; i < vals.length; i++) {
    sum += vals[i];
    if (i >= n) sum -= vals[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

function emaSeries(vals, n) {
  const out = new Array(vals.length).fill(null);
  const k = 2 / (n + 1);
  let ema = null;
  for (let i = 0; i < vals.length; i++) {
    if (i === n - 1) {
      let s = 0;
      for (let j = 0; j < n; j++) s += vals[i - j];
      ema = s / n;
      out[i] = ema;
    } else if (i >= n) {
      ema = vals[i] * k + ema * (1 - k);
      out[i] = ema;
    }
  }
  return out;
}

function rsiSeries(closes, n) {
  const out = new Array(closes.length).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    if (i <= n) {
      avgGain += gain / n;
      avgLoss += loss / n;
      if (i === n) out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    } else {
      avgGain = (avgGain * (n - 1) + gain) / n;
      avgLoss = (avgLoss * (n - 1) + loss) / n;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
  }
  return out;
}

function atrSeries(candles, n) {
  const out = new Array(candles.length).fill(null);
  let atr = null;
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    if (i <= n) {
      atr = atr === null ? tr : atr + tr;
      if (i === n) { atr = atr / n; out[i] = atr; }
    } else {
      atr = (atr * (n - 1) + tr) / n;
      out[i] = atr;
    }
  }
  return out;
}

// ── spec validation ──

function fail(msg) { return { ok: false, error: msg }; }

function validateOperand(op, side) {
  if (!op || typeof op !== "object") return `${side} operand missing`;
  if (!IND_WHITELIST.includes(op.ind)) return `${side} indicator "${op.ind}" not allowed (use sma, ema, rsi, close, value)`;
  if (op.ind === "value") {
    if (typeof op.value !== "number" || !Number.isFinite(op.value)) return `${side} value must be a number`;
    if (op.value < 0 || op.value > 1000000) return `${side} value out of range`;
  } else if (op.ind !== "close") {
    const p = op.period;
    if (!Number.isInteger(p) || p < 2 || p > 200) return `${side} period must be an integer 2–200`;
  }
  return null;
}

function validateRule(rule, name) {
  if (!rule || typeof rule !== "object") return `${name} rule missing`;
  if (!RULE_TYPES.includes(rule.type)) return `${name} rule type "${rule.type}" not allowed (use cross_above, cross_below, above, below)`;
  return validateOperand(rule.left, `${name}.left`) || validateOperand(rule.right, `${name}.right`);
}

function validateSpec(spec) {
  if (!spec || typeof spec !== "object") return fail("spec is not an object");
  if (typeof spec.symbol !== "string" || !/^[A-Z0-9&.\-]{1,20}$/.test(spec.symbol)) {
    return fail("symbol must be an NSE/US ticker like RELIANCE or AAPL (uppercase)");
  }
  if (!INTERVALS[spec.interval]) return fail('interval must be "1d" or "1wk"');
  const e = validateRule(spec.entry, "entry");
  if (e) return fail(e);
  if (spec.exit != null) {
    const x = validateRule(spec.exit, "exit");
    if (x) return fail(x);
  }
  if (spec.stop != null) {
    const s = spec.stop;
    if (s.type !== "atr") return fail('stop.type must be "atr"');
    if (!Number.isInteger(s.period) || s.period < 2 || s.period > 100) return fail("stop.period must be an integer 2–100");
    if (typeof s.mult !== "number" || s.mult < 0.5 || s.mult > 10) return fail("stop.mult must be 0.5–10");
  }
  if (spec.exit == null && spec.stop == null) return fail("spec needs an exit rule, an ATR stop, or both");
  const cap = spec.capital ?? 100000;
  if (typeof cap !== "number" || cap < 1000 || cap > 1e9) return fail("capital must be 1,000–1,000,000,000");
  return { ok: true, spec: { ...spec, capital: cap, exit: spec.exit ?? null, stop: spec.stop ?? null } };
}

// ── rule evaluation ──

function operandSeries(op, candles, closes, cache) {
  if (op.ind === "value") return null; // constant
  if (op.ind === "close") return closes;
  const key = `${op.ind}:${op.period}`;
  if (!cache[key]) {
    if (op.ind === "sma") cache[key] = smaSeries(closes, op.period);
    if (op.ind === "ema") cache[key] = emaSeries(closes, op.period);
    if (op.ind === "rsi") cache[key] = rsiSeries(closes, op.period);
  }
  return cache[key];
}

function opVal(op, series, i) {
  return op.ind === "value" ? op.value : series[i];
}

function ruleFires(rule, ls, rs, i) {
  const l = opVal(rule.left, ls, i), r = opVal(rule.right, rs, i);
  if (l == null || r == null) return false;
  if (rule.type === "above") return l > r;
  if (rule.type === "below") return l < r;
  // crosses need previous bar
  const lp = opVal(rule.left, ls, i - 1), rp = opVal(rule.right, rs, i - 1);
  if (lp == null || rp == null) return false;
  if (rule.type === "cross_above") return lp <= rp && l > r;
  if (rule.type === "cross_below") return lp >= rp && l < r;
  return false;
}

// ── backtest ──

function runBacktest(spec, candles) {
  const closes = candles.map((c) => c.close);
  const cache = {};
  const entryL = operandSeries(spec.entry.left, candles, closes, cache);
  const entryR = operandSeries(spec.entry.right, candles, closes, cache);
  const exitL = spec.exit ? operandSeries(spec.exit.left, candles, closes, cache) : null;
  const exitR = spec.exit ? operandSeries(spec.exit.right, candles, closes, cache) : null;
  const atr = spec.stop ? atrSeries(candles, spec.stop.period) : null;

  const periodsPerYear = INTERVALS[spec.interval];
  let cash = spec.capital, shares = 0, stopPrice = null, entryPrice = null;
  const trades = [];
  const equity = [];
  let pendingSignal = null; // "buy" | "sell" executed at next open

  for (let i = 1; i < candles.length; i++) {
    const bar = candles[i];

    // 1) execute pending signal at this bar's open
    if (pendingSignal === "buy" && shares === 0) {
      const px = bar.open * (1 + COST_PER_SIDE);
      shares = cash / px;
      cash = 0;
      entryPrice = px;
      stopPrice = spec.stop && atr[i - 1] != null ? bar.open - spec.stop.mult * atr[i - 1] : null;
      trades.push({ side: "BUY", date: bar.date, price: +px.toFixed(2) });
    } else if (pendingSignal === "sell" && shares > 0) {
      const px = bar.open * (1 - COST_PER_SIDE);
      cash = shares * px;
      trades.push({ side: "SELL", date: bar.date, price: +px.toFixed(2), retPct: +(((px - entryPrice) / entryPrice) * 100).toFixed(2) });
      shares = 0; stopPrice = null; entryPrice = null;
    }
    pendingSignal = null;

    // 2) intrabar ATR stop
    if (shares > 0 && stopPrice != null && bar.low <= stopPrice) {
      const raw = Math.min(bar.open, stopPrice); // gap below stop fills at open
      const px = raw * (1 - COST_PER_SIDE);
      cash = shares * px;
      trades.push({ side: "STOP", date: bar.date, price: +px.toFixed(2), retPct: +(((px - entryPrice) / entryPrice) * 100).toFixed(2) });
      shares = 0; stopPrice = null; entryPrice = null;
    }

    // 3) trail the stop
    if (shares > 0 && spec.stop && atr[i] != null) {
      const cand = bar.close - spec.stop.mult * atr[i];
      if (stopPrice == null || cand > stopPrice) stopPrice = cand;
    }

    // 4) signals on close → execute next open
    if (shares === 0 && ruleFires(spec.entry, entryL, entryR, i)) pendingSignal = "buy";
    else if (shares > 0 && spec.exit && ruleFires(spec.exit, exitL, exitR, i)) pendingSignal = "sell";

    equity.push({ date: bar.date, equity: +(cash + shares * bar.close).toFixed(2) });
  }

  // metrics
  const eq = equity.map((e) => e.equity);
  const finalEq = eq[eq.length - 1] ?? spec.capital;
  const totalReturnPct = ((finalEq - spec.capital) / spec.capital) * 100;
  const years = eq.length / periodsPerYear;
  const cagrPct = years > 0.1 ? (Math.pow(finalEq / spec.capital, 1 / years) - 1) * 100 : totalReturnPct;

  const rets = [];
  for (let i = 1; i < eq.length; i++) rets.push(eq[i] / eq[i - 1] - 1);
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const sd = rets.length > 1 ? Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1)) : 0;
  const sharpe = sd > 0 ? (mean / sd) * Math.sqrt(periodsPerYear) : 0;

  let peak = -Infinity, maxDD = 0;
  for (const v of eq) { if (v > peak) peak = v; const dd = (peak - v) / peak; if (dd > maxDD) maxDD = dd; }

  const closed = trades.filter((t) => t.retPct != null);
  const wins = closed.filter((t) => t.retPct > 0).length;

  const bh = ((candles[candles.length - 1].close - candles[1].open) / candles[1].open) * 100;

  return {
    metrics: {
      totalReturnPct: +totalReturnPct.toFixed(2),
      cagrPct: +cagrPct.toFixed(2),
      sharpe: +sharpe.toFixed(2),
      maxDrawdownPct: +(maxDD * 100).toFixed(2),
      winRatePct: closed.length ? +((wins / closed.length) * 100).toFixed(1) : null,
      trades: closed.length,
      buyHoldReturnPct: +bh.toFixed(2),
      bars: candles.length,
      costModel: "0.05% per side",
    },
    trades: trades.slice(-40),
    equity: equity.filter((_, i) => i % Math.max(1, Math.floor(equity.length / 300)) === 0),
  };
}

module.exports = { validateSpec, runBacktest, smaSeries, emaSeries, rsiSeries, atrSeries };
