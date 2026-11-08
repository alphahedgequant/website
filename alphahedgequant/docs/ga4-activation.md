# AlphaHedgeQuant — GA4 activation

## Status
The GA4 integration is intentionally **off** until both conditions are met:
1. Production has a valid `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (e.g. `G-XXXXXXXX`).
2. The visitor explicitly opts in via Privacy Policy > Optional Google Analytics 4.

Existing first-party Insights remains independent and active subject to visitor browser privacy preferences.

## Owner-only setup
1. In Google Analytics, create/select the AlphaHedgeQuant GA4 property and Web data stream for `www.alphahedgequant.com`.
2. Copy the public **Measurement ID** (not a Google API secret, OAuth token or service-account key).
3. In Vercel > website > Settings > Environment Variables, set `NEXT_PUBLIC_GA4_MEASUREMENT_ID` for production (and preview if desired); redeploy.
4. Use browser consent control on the Privacy Policy page, then verify GA4 DebugView/Realtime with a non-sensitive route (e.g. /learn).
5. Verify no Google tag loads before opt-in, and after opt-out it no longer sends events.
6. Do not paste credentials into logs, commits or ChatGPT messages. Do not collect emails, searched tickers, portfolio contents or strategy inputs as GA4 properties.

## Event contract
- Coarse page views for allowlisted public sections; article slugs are grouped under `/reading`.
- Allowlisted custom feature events (terminal, options, screener, reports, etc.).
- No client-side `waitlist_signup` event: conversions are server-confirmed in first-party Insights.
- Google Signals and ad personalization disabled by code. Cookie/retention policy is governed by the GA4 account settings.

## Remaining ownership step
The GA4 property itself must be created or authorized in the owner's Google account. This repository cannot create it or know a valid ID autonomously.
