# AlphaHedgeQuant (AHQ)

Quant research, live market intelligence and AI backtesting — alphahedgequant.com

## Stack

- Next.js 14 (App Router) + Tailwind CSS — deployed on Vercel
- Data engine: existing Node/Express backend on Render (Upstox + Yahoo Finance)

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a new GitHub repo (e.g. `alphahedgequant`)
2. vercel.com → New Project → import the repo → Framework auto-detects Next.js → Deploy
3. Project → Settings → Environment Variables → add
   `NEXT_PUBLIC_API_URL = https://zerohedgequant-backend.onrender.com`
   (update when the backend service is renamed)
4. Project → Settings → Domains → add `alphahedgequant.com` and `www.alphahedgequant.com`,
   then add the DNS records Vercel shows into Cloudflare

## Backend rename checklist (Render)

The old backend keeps working as-is. To finish the rebrand:

- [ ] GitHub repo `zerohedgequant-backend` → Settings → rename to `alphahedgequant-backend`
- [ ] In `server.js`: replace every `ZerohedgeQuant` string with `AlphaHedgeQuant`
- [ ] In `package.json`: `"name": "alphahedgequant-backend"`
- [ ] Render → service Settings → rename service to `alphahedgequant-backend`
      (new URL becomes `alphahedgequant-backend.onrender.com`)
- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel to the new URL
- [ ] Keep `UPSTOX_ACCESS_TOKEN` env var on Render (token still expires ~24h — OAuth2
      auto-refresh is the next backend task)

## Pages

- `/` — landing, pillars, waitlist
- `/markets` — live NSE indices + screener (calls the backend)
- `/scanner` — 10-strategy US quant scanner
- `/backtest` — AI backtesting agent preview
- `/research` — AHQ Lab: spoofing-detection paper (SSRN) + pipeline
- `/learn` — quant education hub

## GitHub org migration (one-time, ~15 min)

1. github.com → top-right "+" → **New organization** → Free plan → name: `alphahedgequant`
2. Push this folder to a new repo in the org: `alphahedgequant/website`
3. Transfer keeper repos (each: repo → Settings → Danger Zone → Transfer ownership → `alphahedgequant`):
   - `zerohedgequant-backend` → rename to `data-engine`
   - `signal_engine` (will power /scanner later)
   - `QUANT-DESK` → rename to `backtest-engine` (will power /backtest)
   - `spoofing_detection` → rename to `manipulation-detection` (featured on /research)
   - `global-conflict-monitor` (future /macro page)
   - `zetheta-hft-platform` (optional showcase)
4. Old URLs auto-redirect after transfer — Render keeps deploying without changes.
5. Leave behind: `vix-quant-model` (empty), `1c-Market-making-game` (separate project).
