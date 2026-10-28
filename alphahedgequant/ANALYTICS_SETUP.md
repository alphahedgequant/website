# AlphaHedgeQuant — Product Analytics Setup

The dashboard is at `/admin/analytics`. It is **deny-by-default**: if the admin email allowlist is empty or an email is not verified in Clerk, API requests are denied (HTTP 403). The page does not expose any PostHog secret to the browser.

## 1. Connect PostHog
Create a PostHog project and configure the following **Vercel environment variables** for the `website` project, for Production and Preview if desired:

| Key | Scope | Example / description |
| --- | --- | --- |
| NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN | Public browser value | PostHog project token (project key, not personal key) |
| NEXT_PUBLIC_POSTHOG_HOST | Public browser value | https://us.i.posthog.com or https://eu.i.posthog.com |
| POSTHOG_PROJECT_ID | Server only | Numeric project ID |
| POSTHOG_PERSONAL_API_KEY | Server only / secret | Limited-scope Personal API key permitting HogQL queries |
| POSTHOG_QUERY_HOST | Server only | https://us.posthog.com (or eu.posthog.com) |
| AHQ_ANALYTICS_ADMIN_EMAILS | Server only | Comma-separated **verified** Clerk admin emails |

**Never** put a personal API key in NEXT_PUBLIC variables, source code, or screenshots. After setting Next.js build-time public variables, redeploy for the tracking component to receive them.

## 2. Privacy and tracking
Pageviews and pseudonymous browser visitor ID; focused tab engagement (not background time); feature events for option-chain opens, strategy builder, screener and model pages. No trade parameters or search terms are captured. Analytics does not run if the project token is missing. Do Not Track and Global Privacy Control signals suppress collection.

## 3. Test
Sign in as an allowlisted verified Clerk admin, open `/admin/analytics`, and confirm data appears after some real traffic. Test anonymous visits in a private browser session and open `/options`. PostHog reports are not retroactive. Check provider API permissions if dashboard returns a 502 error.

## 4. Known limitations
Authenticated DAU and sign-up conversions require separate consent-aware Clerk identity mapping or server-side aggregation; current dashboard shows pseudonymous **visitor DAU**, not account-user DAU. PostHog can be blocked by browser privacy tools. 'Average active time' is based on client focused/visible intervals; abrupt tab closure may omit the final segment. The dashboard shows no fabricated traffic.
