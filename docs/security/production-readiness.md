# AlphaHedgeQuant — Production security release runbook

**Reviewed:** 2026-11-06. **Audience:** authorized owner / release engineer.
This document is a checklist, **not** a certificate of complete security testing.
Never paste actual keys, account IDs, user emails, private data, or database URLs into issues, pull requests or chat transcripts.

## Deployed and verified in automated checks

- Vercel custom domains `alphahedgequant.com` and `www.alphahedgequant.com` are verified. Apex redirects permanently to `www`.
- Next.js and Clerk dependency upgrades, transitive patches, response headers, input validation, read-only market-proxy restrictions, and admin authorization checks have automated regression coverage.
- Waitlist and Copilot share PostgreSQL-backed request quotas. These still need authenticated, real-world load and failure-mode testing.
- Static dangerous-code-sink checks and a limited historic credential-pattern scan are in GitHub Actions.
- The arXiv research cron was bounded and batch-optimized after a 60-second timeout. Monitor the next several live scheduled runs.

## Release blocker 1 — Clerk is currently using a development instance

A read-only production response on 2026-11-06 contained a `pk_test_` publishable key and `*.clerk.accounts.dev` handshake. Clerk documents these as **development** credentials/flows. Their development users/sessions are **not the same** as production identities, and migrating keys can affect users' saved progress.

**Owner-only preparation**
1. In the Clerk Dashboard, create or activate the **Production** instance for `www.alphahedgequant.com`. Configure required DNS and OAuth provider credentials, if used.
2. Confirm the production instance works on a staging/custom-domain setup. Document migration or re-enrollment of existing development users. Learning progress records are keyed by Clerk user IDs and should not be copied between identities without authorized identity verification.
3. On Vercel, update **both** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for production with the matched keys from the same instance. Never put the secret in Git, logs or chat.
4. Redeploy; test signup, login, signout, session expiry, the admin allowlist and learning progress persistence using two authorized test accounts. Confirm the public HTML uses `pk_live_`, not `pk_test_`.
5. Verify the daily production smoke workflow passes. Do not deploy mismatched keys.

Clerk guide: https://clerk.com/docs/guides/development/deployment/production

## Release blocker 2 — Upstox OAuth account binding

Prepared branch: https://github.com/zerohedgequant/zerohedgequant-backend/pull/10

**Before merging:**
1. In the approved Render workspace for the existing backend, privately set `UPSTOX_ALLOWED_USER_ID` to the precise account identity returned by the authorized Upstox token response.
2. Confirm the account owner and the private environment setting. Never log or embed the account identity, API key, secret or access token in frontend or Git.
3. In a safe staging environment test: owner login accepted, mismatched user rejected (no token replacement), stale/missing OAuth state rejected, repeated login throttled, market quotes preserved.
4. Merge only after those checks and confirm the backend deploy and next legitimate daily reconnection. A missing environment setting intentionally refuses OAuth to avoid account takeover.
5. Monitor token refresh without logging access-token values.

Render owner and workspace selection must be confirmed explicitly when an administrative tool requires it.

## Release blocker 3 — PostgreSQL and backups

The web app's database URL is in Vercel's server-side environment. The read-only role-audit Action was **blocked** on 2026-11-06 because the `NEON_DATABASE_URL` repository secret is not available to GitHub Actions.

1. Configure the GitHub Actions secret privately if GitHub Actions is to audit PostgreSQL.
2. Run **Read-only Neon PostgreSQL Security Review** in Actions; it reports booleans and table counts only.
3. Review runtime role capabilities, especially superuser, create-role, schema creation and RLS-bypass. App user filtering is implemented but must be checked with real identities. Do not enable RLS or revoke privileges blindly: application routes still execute DDL.
4. In Neon, verify backup/restore capability and test recovery using a separate isolated database/branch. Confirm the app cannot read a different user's progress.
5. Plan separately for a migration role and a lower-privilege runtime role after ensuring tables and migrations exist.

## Required security checks before signing off

- [ ] Real sign-in/sign-out and expired-session behavior on production Clerk
- [ ] Admin route rejects verified non-admin and anonymous identities
- [ ] User A cannot read or mutate User B's learning progress
- [ ] Public signup form rejects malformed/oversized bodies and displays 429 on quota exhaustion
- [ ] Copilot blocks anonymous requests, applies per-user/global quotas and fails safely without exposing provider errors
- [ ] Market proxy denies unapproved backend paths, and backend read operations apply legitimate access/rate limits
- [ ] Verify actual security headers and CORS with browser developer tools and authorized testing accounts
- [ ] Review GitHub Secret Scanning and third-party logs for leaked credentials, not just regex indicators
- [ ] Check Neon privilege/restore reports
- [ ] Verify Upstox correct-account authorization and full quote flow after backend release
- [ ] Review Vercel runtime errors and Render logs after each release
- [ ] Obtain an authorized professional penetration test if a formal full-security certification is needed

## Monitoring and rollback

- GitHub Actions: **AHQ Production Security Smoke** performs read-only anonymous checks daily. It will **fail intentionally** while a Clerk development key or unsafe public response persists.
- GitHub Actions: **XSS and Dependency Security Audit** runs weekly.
- GitHub Actions: **Historical Secret Indicator Audit** checks common patterns in history; it is not a substitute for full GitHub Secret Scanning.
- Vercel: check project **Deployments** and **Runtime Errors** for auth, API, latency and database failures.
- Render: check the backend's **Events/Deploys** and logs for rejected OAuth logins, connection issues, and healthy quotes.

**Rollback:** If a new Vercel release harms availability, promote the last independently verified READY deployment through the Vercel dashboard, then check auth and APIs again. For Render, redeploy the last working backend commit **with appropriate secure environment configuration** and test OAuth and quotes. Never revert secrets by placing them in Git. Restoration of database state must use the database provider's isolated recovery procedure, not a code rollback.

**No claim of completion** is warranted until the production Clerk keys are corrected, Render's account binding is configured and tested, authenticated cross-user testing passes, and actual DB role/restore checks are complete.
