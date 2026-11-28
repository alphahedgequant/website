// US options data adapter. No provider is connected yet (owner decision, 28 Nov 2026).
//
// To connect one later, implement fetchUsChain() for the chosen provider and set
// US_OPTIONS_PROVIDER (plus its API key) in Vercel — server-side only, never NEXT_PUBLIC_.
// The function must return the SAME normalised shape the Upstox gateway returns, so every
// Options Intelligence view works unchanged:
//
// { success: true, data: {
//     market: "US", underlying, spot_price, expiry: "YYYY-MM-DD", expiries: [...],
//     lot_size: 100,                       // contract multiplier
//     received_at: ISO timestamp,
//     strikes: [{ strike_price, call: Leg, put: Leg }] } }
// Leg = { oi, oi_change, volume, ltp, bid_price, ask_price, iv /* percent */, delta, instrument_key }
// IMPORTANT: oi / oi_change / volume must be in UNITS of the underlying (contracts × 100),
// matching Upstox quantities, so GEX = Γ × OI × S² × 1% stays correct. Missing values → null, never 0.
// Confirm the provider's licence allows public display on alphahedgequant.com before enabling.

export const US_UNIVERSE = [
  { id: "SPX", label: "S&P 500 (SPX)", indexKey: "S&P 500" },
  { id: "NDX", label: "NASDAQ-100 (NDX)", indexKey: "NASDAQ" },
  { id: "SPY", label: "SPY" },
  { id: "QQQ", label: "QQQ" },
  { id: "IWM", label: "IWM" },
];

export function usProviderStatus() {
  const name = process.env.US_OPTIONS_PROVIDER || "";
  return name ? { connected: false, provider: name, reason: `Adapter for "${name}" is not implemented yet.` }
    : { connected: false, provider: null, reason: "No US options data provider is connected yet." };
}

export async function fetchUsChain(/* symbol, expiry */) {
  const s = usProviderStatus();
  const e = new Error(s.reason);
  e.code = "US_OPTIONS_NOT_CONNECTED";
  throw e;
}
