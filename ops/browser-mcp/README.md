# AlphaHedgeQuant — browser testing and MCP connectors

## What's already configured

The GitHub Actions workflow `.github/workflows/browser-ux-audit.yml` runs a **read-only, signed-out Chromium** website audit. It checks public routes at desktop/mobile widths, scroll-triggered editorial elements, mobile navigation, JavaScript exceptions, 5xx requests, horizontal overflow and auth-gate redirects. It saves screenshots plus `results.json` as GitHub Actions artifacts.

- PRs that change the audit infrastructure: UI audit only.
- Weekdays 10:30 AM IST and manual workflow dispatch: UI audit + separate Render backend readiness check.
- Backend-health failures flag unavailable market data; they are not silently marked healthy.
- No logins, order placement, writes to production APIs or credential collection.

## Option A: Local Playwright MCP (recommended for Chrome or independent browser)

Requires Node.js 20+ and a trusted MCP client (VS Code, Cursor, Codex, Claude Desktop, etc.). In that client's MCP settings:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

Then ask the MCP client to inspect `https://www.alphahedgequant.com` and run a click-through of menus, research pages, screener tables and responsive views. The tool runs **on the machine with the MCP client** and does *not* automatically connect to this ChatGPT conversation.

Official documentation: https://playwright.dev/docs/getting-started-mcp

## Option B: Chrome DevTools MCP for network, console and performance debugging

Install Chrome, then register the following MCP server in your compatible client:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless", "--no-performance-crux"]
    }
  }
}
```

Headless Chrome starts separately, avoiding access to your personal signed-in Chrome profile by default. The server can inspect network failures, screenshots and performance traces.

To connect to a *currently open and authenticated Chrome session*, enable `chrome://inspect/#remote-debugging` in Chrome 144+ and choose the documented `--autoConnect` option. **This grants the connected MCP client the ability to view and interact with that Chrome session, including private pages and cookies. Never enable it for untrusted agents, ordinary browsing profiles or exposed network ports.**

Official documentation: https://github.com/ChromeDevTools/chrome-devtools-mcp

## Existing AHQ quality MCP

The current Render-hosted `alphahedgequant-quality-mcp` service is a separate, bearer-token protected read-only HTTP/MCP server. It checks availability; it is **not** a Chrome control server. Do not expose its bearer token or use an unauthenticated public endpoint.

## Authenticated tests

The public GitHub workflow intentionally does **not** enter real user credentials or bypass Clerk. For post-sign-in checks, use a dedicated non-admin test account and a trusted local/Work browser session with explicit user permission. Verify Quant Terminal, Interview, IPO and the scanner as authenticated user journeys. Never commit credentials or screenshot real financial-account data to CI artifacts.

## Operational boundaries

- This is an audit, not proof of exchange-price accuracy. Check timestamps, data provenance, official source reconciliation, math invariants and expired credentials separately.
- No paid SaaS or new domain required for these tools; GitHub Actions and hosting still have usage limits.
- Safari uses different browser debugging infrastructure; Chrome DevTools MCP is for Chrome/Chromium, not the Safari UI.
