# Options Intelligence — methodology, coverage and status

Implements the *AlphaHedgeQuant Quant Terminal — Options Intelligence & Derivatives Analytics* specification
inside the existing product. There is no new standalone app:

* `/options` opens on the specification's analytics tabs; the existing desk tools (Option Chain, Strategy
  Builder, Unusual Movements) follow under **Other tools**, unchanged.
* Quant Terminal → **ANALYTICS** renders the same component; the earlier PR #144 summary is kept as the
  **Classic summary** tab. Terminal → **OPTIONS** embeds `/options`, so it opens the same way.

Status words follow the handover: **verified complete**, **implemented but unverified** (not yet tested
in production against live data), **blocked**, **planned**.

## Architecture

| Layer | File | Notes |
|---|---|---|
| Calculations (single shared service) | `lib/optionsIntel.mjs` | Pure JS; used by every tab, widget and workspace pane. |
| Workspace schema (layout-only) | `lib/optionsWorkspace.mjs` | Sanitiser shared by browser and server. |
| Data hooks | `components/options-intel/useOptionsData.js` | Existing gateway `/api/market/option-chain/:symbol` only. |
| UI | `components/options-intel/*` | Terminal styling: true black, charcoal panels, green/red. |
| Cloud workspaces | `app/api/options/workspace/route.js` | Clerk user + Neon table `ahq_options_workspace` (auto-created). |
| Tests | `tests/optionsIntel.test.mjs`, `tests/optionsWorkspace.test.mjs`, `tests/fixtures/` | CI: `.github/workflows/options-intelligence.yml`. |

## Story-first page (Nov 2026 revision)

The page opens on **Today's Story** (`lib/optionsSignals.mjs`): a one-sentence read, a range map
(spot, priced range, OI walls, gamma walls, regime line, max pain, pin) and ranked plain-language readings.
Each reading carries its evidence numbers and its rule ("How we read this"), and is labelled observed /
modelled / common interpretation. Readings only appear when their inputs exist — e.g. "gamma blast in
progress" needs an observed premium burst in this browser's snapshots; "decay vs normal" needs ≥20 minutes
of snapshots; IV-vs-RV needs realised-volatility history.

Tabs are questions: Today's Story · Levels & Range · Who's Positioning · Decay & Volatility ·
Expiry & Gamma Blasts · Full Chain · Replay · Stocks · My Workspace (then the original desk tools).

### Implied volatility and the parity spot (revised)

Provider IVs on 28 Nov implied ≈3.9 days to expiry versus 3.0 calendar days, so re-pricing with them did not
reproduce market prices (ATM straddle 260 vs 302). AHQ now:
1. estimates the spot level the option market prices off from ATM put–call parity
   (S* = C − P + K·e^(−rT), median over strikes within ±1% with two-sided quotes) — on 28 Nov 25,570.7 vs the
   published close 25,607.2 (NSE's close is a 30-minute average; options quote the 15:30 market);
2. solves each contract's IV from its bid/ask mid (LTP fallback) against S* with AHQ's time convention;
3. computes every Greek at S* (each contract stores `basis` = S* − quoted spot); exposures stay scaled by the
   quoted spot. Provider IV remains visible as an observed field and is used only when a quote can't be inverted.
Result on the fixture: call and put IV agree within 0.3 vol pts at every strike near the money, and the model
reproduces the market straddle (302.05) exactly. Net GEX +₹18,562 Cr, flip ≈ 25,481, walls 25,800 / 25,500.

## Calculation rules (also shown in each panel's "Method & assumptions")

* **Greeks:** Black–Scholes on spot, r = 6.5%, q = 0, calendar time (ACT/365) to 15:30 IST on expiry,
  floored at 5 minutes, using each contract's own provider IV. Provider gamma is rounded to 4 d.p.
  (e.g. 0.0002), so it is not used for exposure. The validation check was against SciPy on 108
  cases: maximum error 7e-8 for delta, 7e-18 for gamma and 4e-18 for vanna (all below double-precision
  noise), and 1.4e-5 for price.
  On the live NIFTY chain of 28 Nov 2026 the recomputed delta differs from the provider's by 0.022 on
  average (99 contracts); the gap is the provider's time convention (its deep-ITM delta implies ≈3.9 days
  vs AHQ's 3.0 calendar days).
* **Units:** OI and volume are Upstox quantities (units of the underlying, multiples of lot size).
* **GEX** = Γ × OI × S² × 1% (₹ per 1% move). **Sign convention (classic):** dealers long customer calls (+),
  short customer puts (−). Exchange OI does not reveal who is long or short; GEX is a model.
* **Gamma flip:** spot where modelled net GEX changes sign when every contract is re-priced across ±5% of
  spot (IV, OI, time fixed). No crossing → "No crossing"; several → nearest to spot + count shown.
* **Walls:** largest positive call GEX / most negative put GEX (gamma-weighted, not raw OI).
* **Pin score (0–100, not a probability):** 0.40 concentration + 0.30 proximity (Gaussian in distance ÷
  spot·ATM IV·√T) + 0.15 relative strength vs ±2 neighbours + 0.15 time-to-expiry; candidates within ±3%.
* **HHI:** Σ share² of absolute strike GEX (non-negative weights); effective strikes = 1/HHI.
* **Hedge ladder:** full delta revaluation at ±0.5/1/2%; hedge = −(dealer position × ΔΔ × OI).
* **Charm:** finite difference Δ(T − 1 day) − Δ(T) and Δ(expiry) − Δ(T). **Vanna:** ∂Δ/∂σ per vol point.
* **OI change:** "vs previous close" (provider `oi_change`) and "since first observation today" (browser
  snapshots) are separate and never added.
* **Buildup readings:** long buildup / short buildup / short covering / long unwinding from ΔOI and ΔLTP
  between snapshots of the same expiry; small price moves are reported as *ambiguous*.
* **Aggressor balance:** ESTIMATED only — volume added between snapshots signed by the quote rule
  (LTP ≥ ask buy, ≤ bid sell). Snapshots are not trade prints.
* **IV surface:** linear interpolation of OTM provider IV between quoted strikes; no extrapolation.
* **Missing data:** missing/invalid IV (e.g. IV = 0 on deep-ITM quotes) or OI → excluded and counted,
  never zero.

## Capability status

| # | Capability | Status | Notes |
|---|---|---|---|
| 01 | Live net gamma | Implemented but unverified | NIFTY, BANKNIFTY return chains. FINNIFTY returned HTTP 503 from Upstox on 28 Nov. **MIDCPNIFTY and SENSEX blocked**: backend instrument master has no contracts (SENSEX is BSE_FO). |
| 02 | Pin, flip, call/put wall | Implemented but unverified | Recomputed on every 15 s refresh in session. |
| 03 | GEX by strike & net profile | Implemented but unverified | Call/put, net, cumulative, share views. |
| 04 | Every strike × expiry grid | Implemented but unverified | Front 6 expiries loaded on demand (rate limits); expiry always shown. |
| 05 | Pin pressure score | Implemented but unverified | Components shown. |
| 06 | HHI | Implemented but unverified | Call / put / combined. |
| 07 | 0DTE & weekly views | Implemented but unverified | Tags derived from the provider's contract list, not weekdays. |
| 08 | DEX standing & today's flow | Implemented but unverified | Added vs reduced separated; no opening/closing inference. |
| 09 | Aggressor balance | Blocked (observed) / estimate implemented | Needs trade prints + contemporaneous quotes. |
| 10 | Hedge ladder | Implemented but unverified | |
| 11 | Charm | Implemented but unverified | |
| 12 | Vanna & vanna flip | Implemented but unverified | |
| 13 | Gamma decay & IV sensitivity | Implemented but unverified | |
| 14 | OI change, two comparisons | Implemented but unverified | "Since today's open" uses first browser observation; exact 09:15 baseline needs server snapshots (planned). |
| 15 | OI rotation by minute | Implemented (browser) / server store planned | |
| 16 | Full chain & OI tape | Implemented but unverified | Tape shows source and ingestion timestamps. |
| 17 | IV surface, term, skew, straddle, RV | Implemented but unverified | Index RV **blocked**: `/api/terminal?view=history` has no index bars. Stocks use 5-minute history. |
| 18 | Session scrubber | Implemented (browser snapshots) | Every pane follows one timestamp. Server capture from 09:15 planned. |
| 19 | Historical snapshots | Implemented (browser, 10 sessions) | `fo_session_snapshots` server store planned. |
| 20 | Since your last visit | Implemented but unverified | Stored per user (cloud) with local fallback. |
| 21 | Custom workspace builder | Implemented but unverified | Add, move, widen, remove panes. |
| 22 | Preset workspaces | Implemented but unverified | Expiry day, scalping, swing, post-market review, compare. |
| 23 | Compare two indices | Implemented but unverified | Per-pane underlying override. |
| 24 | F&O stock analytics | Implemented but unverified | F&O list, 10-symbol scan, stock analytics, day-wise net gamma from stored sessions. |
| 25 | Cloud-saved workspaces | Implemented but unverified | Needs `NEON_DATABASE_URL` (already used by Learn progress). |
| 26 | Share layout | Implemented but unverified | Link (`#layout=`) or JSON file; sanitised layout only. |
| 27 | Market strip | Implemented but unverified | **India VIX blocked**: not exposed by the gateway. |
| 28 | Quick switcher (⌘/Ctrl K) | Implemented but unverified | |
| 29 | Personal appearance | Implemented but unverified | Theme, palette, heatmap strength, text size, pin colour. |

### Six quick widgets

| Widget | Tier | Status |
|---|---|---|
| OI — Top builds & unwinds | BASIC | Implemented (browser snapshots, 5–60 min lookback) |
| Unusual volume | PRO | Turnover/vol-OI ranking implemented; **time-of-day RVOL blocked** (no intraday baseline store). Links to the existing daily archive. |
| Straddle — decay clock | PRO | Implemented; comparable-session comparison uses stored sessions |
| OI — Index futures buildup | BASIC | **Blocked**: gateway has no futures quote/OI endpoint |
| Pin — pressure | PRO | Implemented |
| IV — ATM IV, straddle & RV | BASIC | Implemented; index RV blocked (see #17) |

## BASIC / PRO

`/api/options/workspace` returns the plan. Packaging is undecided, so everyone is PRO unless
`OPTIONS_ENTITLEMENT_MODE=enforce`, in which case Clerk `publicMetadata.optionsPlan === "pro"` is required.
**Limitation:** analytics are computed in the browser from the chain endpoint, which any signed-in user can
call, so enforce mode hides PRO panels but is not yet a hard server-side gate. Hard enforcement needs a
server analytics endpoint that omits PRO fields (planned with the snapshot worker).

## Backend work still required (planned)

1. Snapshot worker writing `fo_session_snapshots` / `fo_oi_snapshots` every minute from 09:15 IST
   (exact since-open OI, server replay, RVOL baselines, comparable-session straddle decay).
2. Instrument-master mapping for MIDCPNIFTY (NSE_FO) and SENSEX (BSE_FO); investigate FINNIFTY 503.
3. Front-month futures quote + OI endpoint (futures buildup widget).
4. India VIX and index daily history endpoints.
5. Trade prints with quotes, if licensed (observed aggressor balance).

## QA evidence (28 Nov 2026)

* `node --test tests/optionsIntel.test.mjs tests/optionsWorkspace.test.mjs` — 20 passing, including a
  fixture of the live NIFTY chain (call wall 25,800, put wall 25,500, one flip ≈ 25,461, ATM straddle 302.05).
* `next build` passes.
* Headless browser run of a local production build with that fixture served as the API: all 13 tabs render,
  quick switcher, strike sync, replay scrubber and workspace verified; no React errors; no horizontal overflow
  at 390 px. Not yet verified against the production deployment.
