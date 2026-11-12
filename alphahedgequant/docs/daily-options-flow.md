# Daily NSE Options Activity Archive

## What is collected
The upstream source is Upstox NSE option-chain snapshots, through the existing AlphaHedgeQuant backend. Equity eligibility comes from the daily F&O instrument master, alongside the supported NSE indexes NIFTY, BANKNIFTY and FINNIFTY. Cash-market stocks without active NSE options are explicitly **not** presented as if options existed.

For each eligible underlying (equity or supported index) and its nearest available expiry, the collector aggregates volume and OI across all returned strikes and stores 28 high-activity contract details: volume, OI, OI change, LTP, IV and available bid/ask, along with source receipt times. These are **not** individually signed orders, blocks, sweeps, or institutional buying/selling.

Heuristic flags:
- Volume/OI >= 1.5 and absolute contract volume >= 500.
- OI absolute change >= 500 and change magnitude >= 20% of positive previous OI.
- Historical volume against a same-expiry median is computed only if at least 10 genuine previously recorded trading days exist. No missing data is backfilled.

## Storage and APIs
Existing Neon Postgres via environment variable NEON_DATABASE_URL, no new paid database:
- ahq_options_flow_observations — unique trading date, NSE symbol and collection slot. Idempotent writes.
- ahq_options_flow_runs — expected count, eligible count, captured count, failures and completion status by collection window.

Public read-only endpoints:
- GET /api/options-flow — latest stored daily leaderboard and collection coverage.
- GET /api/options-flow?day=YYYY-MM-DD — specific day.
- GET /api/options-flow?symbol=RELIANCE — recorded ticker history.
- /terminal?tab=flow — actual archive in the Quant Terminal above the browser-session monitor.

## Daily schedule
Eight Vercel weekday crons at 04:00/04:30/05:00/05:30 and 07:00/07:30/08:00/08:30 UTC, mapped to separate slots 0–7. Each scheduled route runs once per weekday, compatible with Hobby's once-per-day minimum per job. Each F&O underlying is assigned to two separate daily slots. Vercel scheduling may be late and exchange holidays differ from weekdays.

The collector requires both production CRON_SECRET and NEON_DATABASE_URL, plus an authenticated market-data backend with valid Upstox OAuth. Missing/expired credentials produce unavailable statuses, not fake quotes. The archived time is a backend or collection receipt time, **not** a certified exchange trade timestamp.

## Operational acceptance
1. Confirm the /api/options-flow endpoint responds using Neon, not a configuration error.
2. After the first regular NSE trading session following deployment, confirm 8 slot status rows and compare the actual captured ticker count with the F&O universe count.
3. Verify contract volume and OI against primary Upstox option-chain responses.
4. If the Upstox token has expired after a Render restart, reconnect at the existing broker OAuth screen.
5. Track Neon usage as data accumulates. Historical rows are not automatically deleted without a retention decision.

An empty archive means no verified records have been stored; it is not evidence of an inactive options market.
