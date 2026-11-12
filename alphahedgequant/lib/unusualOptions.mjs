// Pure, provider-unit-preserving comparison of two distinct option-chain observations.
// No changes = no alerts. Never infer real trades, trade direction or "institutional activity".
export const MONITOR_WINDOW_MS = 150_000;
const maxEvents = 8;
export const METRICS = {
  iv: {label:"IV", threshold:0.15, absolute:0.002, explanation:"Implied volatility changed sharply. Option demand or repricing may be changing; this does not establish price direction."},
  delta: {label:"Delta", threshold:null, absolute:0.08, explanation:"Directional sensitivity shifted. This can result from underlying price moves, expiry effects or a volatility change."},
  gamma: {label:"Gamma", threshold:0.40, absolute:0.000001, explanation:"Delta sensitivity to underlying price changed sharply. Near expiry, small spot moves can alter exposure quickly."},
  theta: {label:"Theta", threshold:0.40, absolute:0.01, explanation:"Modelled time decay changed sharply; verify expiry and volatility before attributing the move to time alone."},
  vega: {label:"Vega", threshold:0.40, absolute:0.01, explanation:"Option-premium sensitivity to implied volatility changed sharply."},
  ltp: {label:"Option LTP", threshold:0.20, absolute:1, explanation:"Last traded option price moved sharply. LTP is not an executable bid/ask quote and may be stale."},
  oi: {label:"Open interest", threshold:0.12, absolute:100, explanation:"Reported open interest changed; this alone does not identify buying, writing or directional conviction."},
};
const numeric = (v) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
export function toSnapshot(payload, symbol, at = Date.now()) {
  const data = payload?.data || payload;
  if (!data || !Array.isArray(data.strikes) || !data.strikes.length) return null;
  const expiry = data.expiry || data.expiry_date || "unknown";
  const spot = numeric(data.spot_price);
  if (spot === null || spot <= 0) return null;
  const rows = data.strikes.filter(x => numeric(x?.strike_price) !== null)
    .sort((a,b) => Math.abs(Number(a.strike_price)-spot) - Math.abs(Number(b.strike_price)-spot))
    .slice(0, 15);
  const options = new Map();
  for (const row of rows) {
    const strike = numeric(row.strike_price);
    if (strike === null) continue;
    for (const [kind, side] of [["CE","call"],["PE","put"]]) {
      const q = row[side];
      if (!q || typeof q !== "object") continue;
      const values = Object.fromEntries(Object.keys(METRICS).map(k=>[k,numeric(q[k])]));
      if (Object.values(values).every(v=>v===null)) continue;
      options.set(strike+":"+kind, {strike,kind,...values});
    }
  }
  if (!options.size) return null;
  const sourceTime = data.exchange_timestamp || data.quote_timestamp || data.market_timestamp || null;
  // received_at is a server retrieval timestamp, NOT an exchange tick timestamp.
  const receivedAt = data.received_at || null;
  return {symbol:String(symbol),expiry:String(expiry),spot,options,observedAt:at,
    receivedAt,sourceTime,
    timestampKind:sourceTime?"EXCHANGE_REPORTED":"BACKEND_SNAPSHOT"};
}
function metricEvent(k, before, after, context) {
  if (before === null || after === null) return null;
  const meta=METRICS[k], change=after-before, abs=Math.abs(change);
  const rel = Math.abs(before)>1e-12 ? abs/Math.abs(before) : null;
  if (meta.threshold === null) {
    if (abs<meta.absolute) return null;
  } else if (rel===null || rel<meta.threshold || abs<meta.absolute) return null;
  // A transition from zero OI or Greek must not masquerade as an infinite percent spike.
  return {
    ...context,metric:k,label:meta.label,previous:before,current:after,change,
    relative:rel,direction:change>0?"UP":"DOWN",
    score:k==="delta" ? Math.min(4,abs/meta.absolute) : Math.min(4,rel/meta.threshold),
    explanation:meta.explanation,
  };
}
export function compareSnapshots(previous, current, windowMs=MONITOR_WINDOW_MS) {
  if (!previous || !current || previous.symbol!==current.symbol ||
      previous.expiry!==current.expiry || current.observedAt<=previous.observedAt ||
      current.observedAt-previous.observedAt>windowMs) return [];
  // Provider-time checks: reject stale/out-of-order identical quote timestamps when available.
  if (current.sourceTime && previous.sourceTime) {
    const a=Date.parse(previous.sourceTime),b=Date.parse(current.sourceTime);
    if (Number.isFinite(a)&&Number.isFinite(b)&&b<=a) return [];
  }
  const events=[];
  for (const [key, option] of current.options) {
    const old=previous.options.get(key);
    if (!old) continue;
    for (const metric of Object.keys(METRICS)) {
      const event=metricEvent(metric,old[metric],option[metric],{
        id:current.symbol+"|"+current.expiry+"|"+key+"|"+metric+"|"+current.observedAt,
        symbol:current.symbol, expiry:current.expiry,
        strike:option.strike, kind:option.kind, observedAt:current.observedAt,
        timeBasis:current.timestampKind==="EXCHANGE_REPORTED"?"EXCHANGE_REPORTED":"BACKEND_SNAPSHOT",
      });
      if (event) events.push(event);
    }
  }
  return events.sort((a,b)=>b.score-a.score).slice(0,maxEvents);
}
// Plain-language interpretations are conditional on Greek sign, not just the arrow.
// Up/down indicates the *numeric* movement, not a buy/sell recommendation.
export function explainMovement(event) {
  if (!event) return "No confirmed option movement.";
  const {metric,previous,current} = event;
  const before=Number(previous),after=Number(current);
  if (!Number.isFinite(before)||!Number.isFinite(after)) return "Provider values unavailable; no interpretation.";
  switch(metric) {
    case "iv":
      return after>before
        ? "Implied volatility rose. The market is pricing more volatility; this usually supports option value if other inputs stay unchanged."
        : "Implied volatility fell. The market is pricing less volatility; this usually weighs on option value if other inputs stay unchanged.";
    case "delta": {
      const change=Math.abs(after)-Math.abs(before);
      if (Math.abs(change)<1e-6) return "Delta shifted sign without changing absolute sensitivity much. Check spot and strike before drawing conclusions.";
      return change>0
        ? "Absolute delta increased: this option is now more sensitive to moves in the underlying. Put deltas are normally negative."
        : "Absolute delta decreased: this option is now less sensitive to moves in the underlying. Put deltas are normally negative.";
    }
    case "gamma":
      return Math.abs(after)>Math.abs(before)
        ? "Gamma magnitude rose. Delta may change faster after a move in the underlying, especially near expiry."
        : "Gamma magnitude fell. Delta may change less rapidly when the underlying moves.";
    case "theta":
      if (before<0 && after<0) {
        return after<before
          ? "Theta became more negative: modelled time-value decay is stronger. A long option may lose value faster from time passing, all else equal."
          : "Theta became less negative: modelled time-value decay eased. A long option may lose value more slowly from time passing, all else equal.";
      }
      return "Theta changed, but it is not negative in both observations. Confirm the Greek's sign and provider time units before interpreting decay speed.";
    case "vega":
      return Math.abs(after)>Math.abs(before)
        ? "Vega magnitude rose: the option premium is more sensitive to a change in implied volatility."
        : "Vega magnitude fell: the option premium is less sensitive to a change in implied volatility.";
    case "oi":
      return after>before
        ? "Reported open contracts increased. This signals greater outstanding positioning, not whether traders are bullish or bearish."
        : "Reported open contracts decreased. Some positions may have been closed or netted; direction cannot be inferred from OI alone.";
    case "ltp":
      return after>before
        ? "The last traded premium increased. This is a traded-price observation, not a guaranteed executable quote."
        : "The last traded premium decreased. Check current bid/ask before judging whether the move is tradable.";
    default:
      return event.explanation || "A provider-reported option metric changed.";
  }
}

export function numericDisplay(n, digits=4) {
  return n===null||n===undefined||!Number.isFinite(n)?"—":Number(n).toLocaleString("en-IN",{maximumFractionDigits:digits});
}
export function readFeedError(status, payload) {
  const err=String(payload?.error||payload?.message||"");
  if (status===401||/token|unauthori[sz]ed|authentication/i.test(err)) return "Upstox authentication is unavailable or expired. Reconnect the backend.";
  if (status===503||status===504) return "Market-data backend unavailable or timed out; no alert is generated.";
  if (status===404) return "No supported option chain for this underlying.";
  return err?err.slice(0,220):"Option-chain data unavailable (HTTP "+status+").";
}
