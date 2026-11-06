# AlphaHedgeQuant Insights — owner-only first-party analytics

No extra analytics provider is required. This uses the existing Next.js website,
Clerk sessions for owner authentication, and Neon PostgreSQL for aggregate events.

## Owner access: mandatory configuration

The dashboard URL is **/admin/analytics**. It is intentionally unlinked from
public navigation. An unapproved visitor receives HTTP 404 **before** the
dashboard component loads; the JSON endpoint separately repeats authorization.

Configure at least one of these **server-only** Vercel environment variables:

- `AHQ_INSIGHTS_OWNER_EMAIL` — the exact **verified email** on the intended
  owner's Clerk account, for example your own existing account email.
- `AHQ_INSIGHTS_OWNER_USER_ID` — alternatively the exact trusted Clerk
  account user ID (may be used *together* with the email for stricter binding).

Do **not** use `NEXT_PUBLIC_` for either owner variable. No fallback grants
access to other administrators, the first registered user, or all logged-in
Clerk users. With neither variable set, the page/API deny access to **everyone**.
Never commit or publish your private owner value. Configure Vercel Production,
redeploy, and verify a second signed-in user sees HTTP 404.

**Keep Clerk** for authentication. Replacing authentication would require
session security, recovery flows, user migration and progress identity mapping.
The platform's previously discovered development-instance production
configuration is a **separate issue** to resolve safely before migrating keys.

## Collection

- Browser: `components/AnalyticsTracker.jsx` sends small same-origin JSON
  bodies as `text/plain` to `/api/insights/event`.
- Database: `ahq_insights_events` is created on first use. The public ingest
  endpoint checks Origin and browser fetch-site metadata, validates UUIDs,
  constrains allowed event names and source labels, and applies shared
  PostgreSQL rate limits.
- No raw IPs, emails, searches, portfolio data, strategy parameters, full
  referrer URLs, Clerk user IDs, or user agents enter the event table.
- Browser identifiers are hashed with a secret before insertion. Optionally
  configure `AHQ_INSIGHTS_HASH_KEY` (server-only), else the existing private
  Neon URL is used as HMAC key. Keep it stable; rotation breaks cross-period
  visitor continuity.
- UTM labels are constrained to a short safe format. Attribution is a
  client-reported estimate, not a causal assignment.
- DNT, GPC and manual opt-out disable tracking. The privacy page provides a
  same-origin browser-history deletion control.
- Events older than 180 days are removed during subsequent ingest activity.
  Without traffic, the next ingest will perform the cleanup.
- Database write failures do not break page rendering or successful waitlist
  submissions.

## Metrics available

Visitor DAU/WAU/MAU (pseudonymous browsers), daily visitor trend, total
pageviews, sessions, average focused active seconds per session, most viewed
pages and estimated reading time, product feature-use totals, coarse traffic
sources, confirmed *new waitlist* signups and aggregate signup/visitor ratio.

Metrics are not registered Clerk account DAU. A visitor using multiple
devices or private browsers can appear as multiple visitors, while DNT/GPC
users are excluded from pageview tracking. Conversion is an aggregate ratio
and does not prove a particular campaign caused an individual signup.

Data starts on deployment and cannot recreate missing historic PostHog events.
The old PostHog client and query path have been replaced. Do not delete
historic provider data without a deliberate retention/deletion decision.

## Verification after deploy

1. Confirm ordinary pages remain available and load without PostHog network
   calls. Open DevTools Network and see first-party `/api/insights/event`
   POST requests return 204. A healthy collector should not log visitor data.
2. Check `/admin/analytics` as an anonymous visitor and as a non-owner Clerk
   account: the page must return 404; the API must return 404 as well.
3. As the *exact authorized owner*, open the dashboard and view zero/actual
   figures (never fake data). Test 1/7/30/90-day filters and CSV export.
4. Generate a page visit and navigate to a new page; check pageviews and
   active-time totals. Use another browser session to assess repeat visits.
5. Submit one **new** test waitlist email with permission, then retry the
   same address: only the first successful DB insertion should count as a
   signup in owner analytics. Avoid unnecessary production test signups.
6. Confirm browser GPC/DNT and manual privacy opt-out suppress events. Test
   the browser-linked deletion action and verify dashboard counts adjust.
7. Inspect Vercel function errors, quota responses and Neon table growth.
   Run baseline auth/permission tests after any Clerk instance migration.

## Privacy and limits

The code is privacy-minimizing, not a legal assessment that consent can be
omitted in every jurisdiction. Review local notice/consent obligations before
broad public rollout. The exact owner account must be configured privately
before owner visibility can be claimed as operational.

No analytics implementation is fully resistant to client event spoofing or
ad blockers; use server-confirmed waitlist conversion records for signup
metrics and treat visitor traffic as estimates.
