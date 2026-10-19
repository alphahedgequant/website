# AlphaHedgeQuant Quality MCP — read-only starter

This is a **real, minimal Python MCP server**, not a continuously running AI agent.
It exposes three tools: `audit_public_site`, `audit_backend_reachability`, and `audit_summary`.

## Run locally
```bash
cd ops/mcp_server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```
The server runs using MCP **stdio**. You need to register this command in an MCP-compatible host to invoke its tools. Do not run it as a public unauthenticated web service.

## Safety and limitations
- Fixed allowlisted website and backend URLs; no arbitrary URL fetching.
- No credentials, environment-secret inspection, user PII, code writes, trade orders or deployment tools.
- HTTP checks do not validate Clerk, Vercel, Upstox, market-data freshness or the quant algorithms.
- The server cannot operate unattended until a compatible host schedules tool calls.
- ChatGPT does not automatically connect to newly created MCP servers. A supported connection/configuration is required.
- No changes to production or UI; this is a review-only branch.

## Suggested next phase
Add scoped, authenticated **read-only** providers for Render deployments and sanitized logs, Vercel deployment status, Clerk configuration (no user exports), GitHub PR status, and Upstox health via your backend. Each tool must enforce timeouts, redaction, audit logs, rate limits and allowlists. Only after passing tests should a separate repair agent open draft PRs. Never permit auto-merge or automatic production deploy.
