# AlphaHedgeQuant launch-quality agent (starter)

**Safety:** Does not modify production, place trades, change the UI, use credentials, or deploy. Do not merge until reviewed.

## What is implemented
- A read-only Node.js smoke checker at `tools/launch-audit.mjs`.
- A **manual-only** GitHub Actions workflow under `.github/workflows/launch-audit.yml`.
- Checks public homepage HTTP status and backend URL reachability, with latencies and structured JSON output.
- The backend root check is NOT proof that a health endpoint or Upstox feed works.

## How to use
From `alphahedgequant`, run `node tools/launch-audit.mjs`.
After merging, manually trigger **AHQ Launch Audit (manual)** in GitHub Actions.
To override targets use `AHQ_SITE_URL`, `AHQ_API_URL` and optionally `AHQ_TIMEOUT_MS`.

## Before public launch: tests still required
1. Verify production Vercel build and all page routes.
2. Human-driven Clerk sign-up / login / logout flow.
3. Verify Upstox option-chain authentication, timestamps, expiry completeness, Greeks and market-data freshness through authenticated integration tests; do not log tokens.
4. Validate scanner and backtest math against fixtures and real datasets.
5. Audit cron route authorization, API rate limiting, access controls, and env var exposure.
6. Confirm Neon waitlist submission using a controlled test address.
7. Inspect Render Yahoo failures (401, 404, 429), add provider fallback/caching and stale indicators.
8. Confirm rollback plan and obtain explicit approval before deploying.

## Next phase: full AI remediation agent
Use an isolated sandbox/CI runner, GitHub PR-only write permissions, least-privilege read-only Render/Vercel access, masked logs, deterministic checks and review gates. An LLM model/credential integration is **not configured in this starter**. Never auto-merge or auto-deploy.
