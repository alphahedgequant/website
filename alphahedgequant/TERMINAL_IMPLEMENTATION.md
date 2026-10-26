# AHQ Trading Terminal — P0 implementation

Development branch for the user-approved 3-page Trading Terminal Development Specification. **Existing UI/components/layout are unchanged**. Adds a separate authenticated route at `/terminal` and a server-only Upstox proxy.

## Included
- `/terminal`: dark-theme workspace with instrument selector, Upstox option-chain snapshot, cumulative volume vs historical mean/median, and a clearly disabled Level 2 placeholder.
- `/api/terminal?mode=chain&instrument=NSE_INDEX%7CNifty%2050&expiry=YYYY-MM-DD`: secured Upstox option-chain API proxy.
- `/api/terminal?mode=volume&instrument=NSE_EQ%7CINE002A01018&lookback=15`: Upstox V3 minute candles, aggregated across previous completed sessions.
- No synthetic price/volume/depth output.
- No trade execution.
- Existing site not linked or redirected; intentional review-first rollout.

## Configuration
Set `UPSTOX_ACCESS_TOKEN` **only** in the server-side Vercel environment (or your chosen server-side execution environment). Never prefix it with `NEXT_PUBLIC_` and never paste it into GitHub/chat. Tokens may expire and require a secure refresh process; this version has no token-refresh automation. The API requires a Clerk login. Review exchange redistribution entitlements before public rollout.

## Known limits — do not merge for production until addressed
- This is a functioning integration scaffold, **not a complete live terminal**.
- Option chain is a REST snapshot requested on refresh, not a Market Data Feed V3 WebSocket.
- Level 2 panel intentionally shows unavailable until Upstox depth feed mode/permissions, Protobuf decoder, server-side gateway, and timestamp validation are implemented.
- Volume is based on Upstox intraday minute candles; it is **not** tick-by-tick. A session is eligible only when at least 360 of 375 minute bars are present, to avoid fabricating absent bars as zero. For sparse stocks this may exclude legitimate sessions; refine data-quality rules.
- History request windows are partitioned to stay under Upstox V3 1-month minute-data limit. Calendar/half-day handling and corporate action normalization require further tests.
- Uses a single server-side Upstox access token; design per-user authorization and quote licensing before wide deployment.
- No automatic refresh, WS reconnect, option-chain depth stream, Time & Sales, GEX or gamma flip yet.
- Requires CI build and integration tests on preview. Not tested against an authenticated real Upstox account.

## Validation before release
1. `npm ci && npm run build` in `alphahedgequant`.
2. Clerk-authenticated preview: verify signed-out 401, invalid symbols 400, token missing 503.
3. Test historical minute sessions incl. missing bars, NSE session time, half days, adjusted data and RVOL.
4. Cross-check returned chain Greeks, IV units and contracts against Upstox.
5. Confirm no tokens in browser/network response and verify applicable Upstox/NSE feed entitlements.
6. Verify existing pages unchanged.

References: Upstox official docs /v2/option/chain, /v3/historical-candle, /v3/historical-candle/intraday.
