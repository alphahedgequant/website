"use client";
import { useState } from "react";
import Link from "next/link";

// ════════════════════════════════════════════════════════════════════
//  MODEL LIBRARY — grouped into 4 categories.
//  Each model: { id, name, cat, tag, summary, intuition, math[], params[], when, code? }
//  math = array of { label, lines } rendered as formula blocks
// ════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  {
    key: "general",
    label: "General Models",
    eyebrow: "TREND · REGIME · PORTFOLIO",
    blurb: "Directional and allocation models that form the backbone of a systematic book — trend capture, regime gating, volatility harvesting and portfolio construction.",
  },
  {
    key: "statarb",
    label: "Statistical Arbitrage",
    eyebrow: "THE CORE ENGINE — MARKET-NEUTRAL",
    blurb: "The heart of AHQ. Market-neutral strategies that trade the relationship between assets rather than direction. Cointegration, dynamic hedging, and mean-reversion of spreads — built from first principles.",
    headline: true,
  },
  {
    key: "vol",
    label: "Volatility Models",
    eyebrow: "ARCH · GARCH · CONDITIONAL VARIANCE",
    blurb: "Volatility clusters — calm begets calm, turbulence begets turbulence. The ARCH/GARCH family models this time-varying conditional variance, feeding option pricing, VaR and position sizing with forward-looking volatility forecasts.",
  },
  {
    key: "risk",
    label: "Risk Models — VaR Family",
    eyebrow: "LOSS QUANTIFICATION · TAIL RISK",
    blurb: "How much can you lose, and how often? Value-at-Risk, Expected Shortfall, stress testing and the statistical tests that validate them. The language risk desks and regulators speak.",
  },
  {
    key: "ml",
    label: "Machine Learning Models",
    eyebrow: "SUPERVISED · DEEP · UNSUPERVISED · RL",
    blurb: "Where modern quant is heading — learning patterns from data rather than specifying them by hand. From gradient-boosted return prediction to LSTMs, regime clustering and reinforcement-learned execution. Powerful, but prone to overfitting noise — discipline matters more here than anywhere.",
  },
  {
    key: "banking",
    label: "Banking & Regulatory Models",
    eyebrow: "BASEL III · RBI · CREDIT RISK",
    blurb: "The capital and liquidity framework banks live under — Basel III ratios, RBI reserve requirements (SLR/CRR), and the credit-risk parameters behind every loan-loss provision.",
  },
];

const MODELS = [
  // ─────────────────────────── GENERAL ───────────────────────────
  {
    id: "G1", cat: "general", name: "Momentum (TS + XS)", tag: "Trend",
    summary: "Time-series and cross-sectional momentum with volatility-scaled sizing.",
    intuition: "Assets that have gone up tend to keep going up over 3–12 month horizons — one of the most robust anomalies in all of finance. Time-series momentum looks at an asset vs its own past; cross-sectional ranks assets against each other and goes long winners / short losers.",
    math: [
      { label: "TIME-SERIES MOMENTUM SIGNAL", lines: "signal_t = sign( r_{t-k → t} )\n\nwhere r_{t-k → t} = (P_t / P_{t-k}) - 1   (k = lookback, e.g. 252 days)\n\nPosition = signal_t × (target_vol / realised_vol_t)" },
      { label: "VOLATILITY SCALING", lines: "w_i = (σ_target / σ_i) × signal_i\n\nσ_i = trailing volatility of asset i\nσ_target = desired per-position vol (e.g. 10% annualised)\n→ each position contributes equal risk" },
    ],
    params: ["Lookback: 3–12 months (skip most recent month to avoid reversal)", "Vol target: 10–15% annualised", "Rebalance: monthly"],
    when: "Works in trending, low-mean-reversion regimes. Suffers sharp 'momentum crashes' at market turning points (e.g. March 2009).",
    refs: ["Jegadeesh & Titman (1993), \"Returns to Buying Winners and Selling Losers\" — Journal of Finance", "Moskowitz, Ooi & Pedersen (2012), \"Time Series Momentum\" — Journal of Financial Economics"],
  },
  {
    id: "G2", cat: "general", name: "HMM Regime Detection", tag: "Regime",
    summary: "Hidden Markov states classify trending vs mean-reverting markets to gate other strategies.",
    intuition: "Markets switch between regimes — calm trending, choppy mean-reverting, high-volatility crisis. You can't observe the regime directly, but you can infer it from observable returns/volatility. An HMM models the hidden state and the probability of switching between states, letting you turn strategies on/off based on the current regime.",
    math: [
      { label: "HMM COMPONENTS", lines: "States:        S = {1, 2, ..., N}   (hidden regimes)\nTransitions:   A_ij = P(state_t = j | state_{t-1} = i)\nEmissions:     B_j(o) = P(observation o | state j)\nInitial:       π_i = P(state_1 = i)" },
      { label: "FORWARD ALGORITHM (state probability)", lines: "α_t(j) = [ Σ_i α_{t-1}(i) · A_ij ] · B_j(o_t)\n\nMost likely regime today = argmax_j α_t(j)\nParameters fit via Baum-Welch (EM algorithm)" },
    ],
    params: ["States: typically 2–3 (bull / bear / neutral)", "Observations: returns, realised vol, or both", "Fit window: 2–5 years rolling"],
    when: "Use as a meta-layer: enable momentum in trending regimes, mean-reversion in choppy ones. Lags at regime transitions — it confirms, it doesn't predict.",
    refs: ["Hamilton (1989), \"A New Approach to the Economic Analysis of Nonstationary Time Series\" — Econometrica", "Rabiner (1989), \"A Tutorial on Hidden Markov Models\" — Proc. IEEE"],
  },
  {
    id: "G3", cat: "general", name: "VRP Harvesting", tag: "Volatility",
    summary: "Variance Risk Premium capture — systematically selling overpriced implied volatility.",
    intuition: "Implied volatility (what options cost) is, on average, higher than the volatility that actually materialises. That gap is the Variance Risk Premium — compensation sellers earn for bearing the risk of a volatility spike. Harvesting it means systematically selling options/variance and collecting the premium, while managing the tail.",
    math: [
      { label: "VARIANCE RISK PREMIUM", lines: "VRP = E[ σ²_implied ] − E[ σ²_realised ]\n\nTypically positive (implied > realised ~80% of the time)\n→ short variance earns the premium on average" },
      { label: "DELTA-HEDGED OPTION P&L", lines: "P&L ≈ ½ × Γ × ( σ²_realised − σ²_implied ) × S² × dt\n\nIf realised < implied → short gamma profits\nThe edge is the spread; the risk is a vol spike (short gamma)" },
    ],
    params: ["Instruments: straddles, variance swaps, VIX futures", "Hedge frequency: daily delta-hedge", "Tail hedge: hold cheap far-OTM puts"],
    when: "Profitable in calm/normalising vol. Catastrophic in vol spikes (Feb 2018 'Volmageddon'). Position sizing and tail hedges are non-negotiable.",
    refs: ["Carr & Wu (2009), \"Variance Risk Premiums\" — Review of Financial Studies", "Bollerslev, Tauchen & Zhou (2009), \"Expected Stock Returns and Variance Risk Premia\" — RFS"],
  },
  {
    id: "G4", cat: "general", name: "Ledoit-Wolf Optimization", tag: "Portfolio",
    summary: "Markowitz allocation with shrinkage covariance — stable weights from noisy estimates.",
    intuition: "Classic Markowitz optimization is mathematically elegant but practically unstable: the sample covariance matrix is noisy, and the optimizer amplifies that noise into extreme, flip-flopping weights. Ledoit-Wolf 'shrinks' the noisy sample covariance toward a structured target, producing far more stable, out-of-sample-robust portfolios.",
    math: [
      { label: "MARKOWITZ OBJECTIVE", lines: "max_w   w'μ − (λ/2) · w'Σw\n\nμ = expected returns,  Σ = covariance,  λ = risk aversion\nClosed form (no constraints):  w* ∝ Σ⁻¹ μ" },
      { label: "LEDOIT-WOLF SHRINKAGE", lines: "Σ_shrunk = δ · F + (1 − δ) · S\n\nS = sample covariance (noisy)\nF = structured target (e.g. constant-correlation)\nδ* = optimal shrinkage intensity (analytically derived)" },
    ],
    params: ["Target F: constant correlation or single-index", "δ estimated analytically (no tuning)", "Rebalance: monthly/quarterly"],
    when: "Whenever you optimize over many assets with limited history (N assets ≈ T observations). The fix for 'my optimizer keeps giving crazy weights'.",
    refs: ["Ledoit & Wolf (2004), \"A Well-Conditioned Estimator for Large-Dimensional Covariance Matrices\" — J. Multivariate Analysis", "Markowitz (1952), \"Portfolio Selection\" — Journal of Finance"],
  },

  // ─────────────────────────── STAT ARB (headline) ───────────────────────────
  {
    id: "S1", cat: "statarb", name: "Engle-Granger Pairs", tag: "Cointegration",
    summary: "Two-asset cointegration with rolling z-score entries at ±2σ and mean-reversion exits.",
    intuition: "Two related stocks (say HDFCBANK & ICICIBANK) wander individually but their spread is tethered — when it stretches too far, it snaps back. Engle-Granger tests whether a linear combination of two price series is stationary (mean-reverting). If yes, you trade the spread: short it when high, long it when low. You're betting on the relationship, not direction — so you're market-neutral.",
    math: [
      { label: "STEP 1 — HEDGE RATIO (OLS)", lines: "Y_t = α + β·X_t + e_t\n\nβ = hedge ratio (shares of X per share of Y)\ne_t = the spread (residuals)" },
      { label: "STEP 2 — STATIONARITY TEST (ADF on e_t)", lines: "H₀: spread has a unit root → NOT cointegrated\nReject H₀ (p < 0.05) → cointegrated → tradeable\n\nADF: Δe_t = γ·e_{t-1} + Σφ_i·Δe_{t-i} + ε_t" },
      { label: "STEP 3 — Z-SCORE SIGNAL", lines: "z_t = (e_t − μ_rolling) / σ_rolling\n\nz < −2  → long spread  (long Y, short β·X)\nz > +2  → short spread\n|z| < 0.5 → exit;   |z| > 3.5 → stop loss" },
    ],
    params: ["Lookback for z-score: 20–60 days", "Entry: ±2σ · Exit: ±0.5σ · Stop: ±3.5σ", "Re-test cointegration monthly (β drifts)"],
    when: "Within-sector pairs (bank vs bank). Breaks on structural change — re-test regularly and respect the hard stop.",
    refs: ["Engle & Granger (1987), \"Co-integration and Error Correction\" — Econometrica", "Gatev, Goetzmann & Rouwenhorst (2006), \"Pairs Trading: Performance of a Relative-Value Arbitrage Rule\" — RFS"],
  },
  {
    id: "S2", cat: "statarb", name: "Johansen Basket", tag: "Cointegration",
    summary: "Multi-asset cointegrated baskets — trades the stationary linear combination of N assets.",
    intuition: "Engle-Granger handles 2 assets and 1 direction. Johansen generalises to N assets and finds ALL the cointegrating relationships simultaneously via eigenvalue decomposition. This lets you build baskets — e.g. long RELIANCE vs a weighted basket of ONGC + BPCL + GAIL — capturing richer mean-reverting structure than simple pairs.",
    math: [
      { label: "VECM REPRESENTATION", lines: "ΔX_t = Π·X_{t-1} + Σ Γ_i·ΔX_{t-i} + ε_t\n\nrank(Π) = r = number of cointegrating vectors\nΠ = α·β'   where β = cointegrating vectors" },
      { label: "TRACE STATISTIC TEST", lines: "λ_trace(r) = −T · Σ_{i=r+1}^{n} ln(1 − λ̂_i)\n\nλ̂_i = estimated eigenvalues\nCompare to critical values → how many cointegrations exist\nFirst eigenvector = the basket hedge weights" },
    ],
    params: ["Universe: 3–6 related assets", "Need ≥ 2 years daily data (5× params rule)", "det_order & lag selection via AIC/BIC"],
    when: "Sector baskets, index-vs-constituents. Over-fits on small samples — keep baskets small and data deep.",
    refs: ["Johansen (1991), \"Estimation and Hypothesis Testing of Cointegration Vectors in Gaussian VAR\" — Econometrica", "Krauss (2017), \"Statistical Arbitrage Pairs Trading Strategies: Review and Outlook\" — J. Economic Surveys"],
  },
  {
    id: "S3", cat: "statarb", name: "PCA Stat-Arb", tag: "Factor",
    summary: "Principal-component residuals as mean-reverting signals across a correlated universe.",
    intuition: "Decompose a universe of stocks into principal components: the first few PCs capture the 'market' and 'sector' moves everyone shares. What's left over — the residual after removing common factors — is stock-specific noise that tends to mean-revert. Trade the residuals: a stock whose residual is unusually negative is 'cheap vs its factor exposure'.",
    math: [
      { label: "FACTOR DECOMPOSITION (PCA)", lines: "R = F·Bᵀ + ε\n\nR = returns matrix,  F = principal components (factors)\nB = factor loadings,  ε = idiosyncratic residual\nKeep top k PCs (e.g. explaining 70–80% variance)" },
      { label: "RESIDUAL MEAN-REVERSION SIGNAL", lines: "s_i = cumulative residual return of stock i\nFit OU process to s_i → z-score\n\nz_i < −threshold → long stock i (residual too low)\nz_i > +threshold → short stock i" },
    ],
    params: ["Components: 5–15 (or by variance explained)", "Estimation window: 60–252 days", "Trade only liquid names (residuals noisy in illiquid)"],
    when: "Large liquid universes (Nifty 50/100, S&P 500). The institutional 'Avellaneda-Lee' approach to stat-arb.",
    refs: ["Avellaneda & Lee (2010), \"Statistical Arbitrage in the US Equities Market\" — Quantitative Finance (SSRN 1153505)", "d'Aspremont (2011), \"Identifying Small Mean-Reverting Portfolios\" — Quantitative Finance"],
  },
  {
    id: "S4", cat: "statarb", name: "Kalman Filter Hedge", tag: "Adaptive",
    summary: "Dynamic hedge ratios estimated online — the pair relationship adapts instead of staying fixed.",
    intuition: "The OLS hedge ratio β in Engle-Granger is fixed — but real relationships drift over time. A Kalman filter treats β as a hidden state that evolves, updating it bar-by-bar as new prices arrive. You get a hedge ratio that adapts smoothly to regime changes without re-running a full regression each day.",
    math: [
      { label: "STATE-SPACE MODEL", lines: "State (hidden):   β_t = β_{t-1} + w_t      (random walk)\nObservation:      y_t = β_t · x_t + v_t\n\nw_t ~ N(0, Q),  v_t ~ N(0, R)" },
      { label: "KALMAN UPDATE (per bar)", lines: "Predict:   β̂_t|t-1 = β̂_{t-1},   P_t|t-1 = P_{t-1} + Q\nGain:      K_t = P_t|t-1·x_t / (x_t²·P_t|t-1 + R)\nUpdate:    β̂_t = β̂_t|t-1 + K_t·(y_t − β̂_t|t-1·x_t)\n           P_t = (1 − K_t·x_t)·P_t|t-1" },
    ],
    params: ["Q (state noise): controls adaptivity — higher = faster drift", "R (obs noise): measurement uncertainty", "Initialise β from a short OLS warm-up"],
    when: "Pairs whose relationship is known to drift (different growth rates, evolving fundamentals). Replaces fixed-β Engle-Granger.",
    refs: ["Kalman (1960), \"A New Approach to Linear Filtering and Prediction Problems\" — J. Basic Engineering", "Chan, E. (2013), \"Algorithmic Trading: Winning Strategies and Their Rationale\" — Wiley (Kalman pairs ch.)"],
  },
  {
    id: "S5", cat: "statarb", name: "OU Mean Reversion", tag: "Stochastic",
    summary: "Ornstein-Uhlenbeck parameters fitted by MLE: reversion speed, half-life, optimal bands.",
    intuition: "A mean-reverting spread can be modelled as an Ornstein-Uhlenbeck process — a random walk with a 'pull' back toward its mean. Fitting it tells you three trade-critical things: how fast it reverts (κ), the long-run mean (θ), and the half-life (how many days to close half the gap). Half-life decides whether a spread is even tradeable.",
    math: [
      { label: "OU PROCESS (continuous)", lines: "dS_t = κ(θ − S_t)dt + σ dW_t\n\nκ = speed of mean reversion\nθ = long-run mean\nσ = volatility,  W_t = Brownian motion" },
      { label: "HALF-LIFE & ESTIMATION", lines: "Discretise:  ΔS_t = a + b·S_{t-1} + ε_t   (OLS)\nκ = −b      θ = a / κ\n\nHalf-life = ln(2) / κ\n5–30 days = tradeable sweet spot" },
    ],
    params: ["Fit window: 60–252 days", "Half-life filter: trade only 5–30 day reverters", "Bands: enter at ±1.5–2σ from θ"],
    when: "The rigorous foundation under every pairs/spread trade — quantifies whether mean reversion is fast enough to be worth the capital.",
    refs: ["Uhlenbeck & Ornstein (1930), \"On the Theory of the Brownian Motion\" — Physical Review", "Bertram (2010), \"Analytic Solutions for Optimal Statistical Arbitrage Trading\" — Physica A"],
  },
  {
    id: "S6", cat: "statarb", name: "Multi-Pair Scanner", tag: "Discovery",
    summary: "Universe-wide pair scan ranked by cointegration strength, half-life and current z-score.",
    intuition: "Rather than trade one pair, scan the entire universe for every cointegrated pair, then rank them by quality: strongest cointegration (lowest ADF p-value), best half-life (5–30 days), and most stretched current z-score. This surfaces the best opportunities at any moment and diversifies across many uncorrelated spread trades.",
    math: [
      { label: "PAIRWISE SCAN", lines: "For each pair (i, j) in universe:\n  1. OLS hedge ratio β_ij\n  2. ADF test on spread → p_ij\n  3. OU fit → half-life h_ij\n  4. current z-score z_ij\nKeep pairs where p_ij < 0.05 AND 5 < h_ij < 30" },
      { label: "COMPOSITE RANK SCORE", lines: "score = w₁·(1 − p_ij)        # cointegration strength\n      + w₂·f(half-life)       # closer to ideal = better\n      + w₃·|z_ij|             # how stretched right now\nTrade top-N by score, capital split across pairs" },
    ],
    params: ["Universe: sector-grouped to reduce spurious pairs", "Filters: p < 0.05, half-life 5–30d, |z| > 2", "Cap concurrent pairs (correlation risk)"],
    when: "Production stat-arb deployment — continuous discovery + diversification across many spreads rather than betting on one.",
    refs: ["Krauss (2017), \"Statistical Arbitrage Pairs Trading: Review and Outlook\" — J. Economic Surveys", "Avellaneda & Lee (2010), \"Statistical Arbitrage in the US Equities Market\" — Quantitative Finance"],
  },

  // ─────────────────────────── VOLATILITY (ARCH/GARCH) ───────────────────────────
  {
    id: "V1", cat: "vol", name: "ARCH(q)", tag: "Foundational",
    summary: "Engle's original model — today's variance depends on recent squared shocks.",
    intuition: "Engle's 1982 insight (Nobel 2003): volatility isn't constant, it clusters. Big moves follow big moves. ARCH models today's conditional variance as a function of recent squared returns (shocks) — a large return yesterday raises expected variance today. It's the foundation the entire GARCH family builds on.",
    math: [
      { label: "ARCH(q) CONDITIONAL VARIANCE", lines: "r_t = μ + ε_t,   ε_t = σ_t · z_t,   z_t ~ N(0,1)\n\nσ²_t = ω + Σ_{i=1}^{q} α_i · ε²_{t-i}\n\nω > 0,  α_i ≥ 0  (variance must stay positive)" },
      { label: "INTUITION OF TERMS", lines: "ω      = baseline (long-run) variance floor\nα_i    = how strongly shock i days ago feeds today's vol\nLarge ε²_{t-i}  →  larger σ²_t  →  volatility clustering\nNeeds large q to capture persistence (→ GARCH fixes this)" },
    ],
    params: ["q: number of lagged squared shocks", "Fit by Maximum Likelihood", "Test for ARCH effects: Engle's LM test"],
    when: "Conceptual foundation. Rarely used directly — needs too many lags for real persistence. GARCH is the practical version.",
    refs: ["Engle (1982), \"Autoregressive Conditional Heteroscedasticity with Estimates of UK Inflation\" — Econometrica (Nobel 2003)"],
  },
  {
    id: "V2", cat: "vol", name: "GARCH(1,1)", tag: "Workhorse",
    summary: "The industry-standard volatility model — variance driven by last shock + last variance.",
    intuition: "Bollerslev's GARCH adds a term: today's variance depends not just on the last shock, but on yesterday's variance too. This one addition captures volatility persistence with just two parameters — which is why GARCH(1,1) is the single most-used volatility model in finance. α+β measures persistence; close to 1 means shocks decay slowly.",
    math: [
      { label: "GARCH(1,1)", lines: "σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}\n\nα = reaction to last shock (ARCH term)\nβ = persistence of past variance (GARCH term)\nα + β < 1  required for stationarity" },
      { label: "KEY QUANTITIES", lines: "Long-run variance:   σ̄² = ω / (1 − α − β)\nPersistence:         α + β   (→1 = very persistent)\nForecast (h-step):   σ²_{t+h} = σ̄² + (α+β)^h·(σ²_t − σ̄²)\nVol mean-reverts to σ̄ at rate (α+β)" },
    ],
    params: ["Typical equities: α≈0.05–0.10, β≈0.85–0.92", "Fit by MLE (Gaussian or Student-t)", "Forecast feeds VaR & option pricing"],
    when: "The default volatility forecaster everywhere — risk, option pricing, vol targeting. If you use one vol model, it's this.",
    refs: ["Bollerslev (1986), \"Generalized Autoregressive Conditional Heteroskedasticity\" — Journal of Econometrics"],
  },
  {
    id: "V3", cat: "vol", name: "EGARCH", tag: "Asymmetry",
    summary: "Exponential GARCH — captures the leverage effect (down moves raise vol more than up).",
    intuition: "Plain GARCH treats +5% and −5% identically — but markets don't. A crash spikes volatility far more than an equal-sized rally (the 'leverage effect'). EGARCH models log-variance, which guarantees positivity without parameter constraints, and includes an asymmetry term so negative shocks can hit volatility harder than positive ones.",
    math: [
      { label: "EGARCH(1,1)", lines: "ln(σ²_t) = ω + β·ln(σ²_{t-1})\n         + α·[ |z_{t-1}| − E|z_{t-1}| ]\n         + γ·z_{t-1}\n\nz_{t-1} = ε_{t-1}/σ_{t-1}  (standardised shock)" },
      { label: "THE ASYMMETRY TERM γ", lines: "γ < 0  →  negative shocks raise vol more (leverage effect)\nlog form → σ²_t always positive, no constraints on ω,α,β,γ\n|z| term captures magnitude, γ·z captures sign" },
    ],
    params: ["γ: asymmetry (typically negative for equities)", "No non-negativity constraints (log variance)", "Student-t errors for fat tails"],
    when: "Equity indices and anything with a pronounced leverage effect. Better tail/vol-spike capture than symmetric GARCH.",
    refs: ["Nelson (1991), \"Conditional Heteroskedasticity in Asset Returns: A New Approach\" — Econometrica"],
  },
  {
    id: "V4", cat: "vol", name: "GJR-GARCH", tag: "Threshold",
    summary: "Glosten-Jagannathan-Runkle — adds a threshold term for negative-shock asymmetry.",
    intuition: "Another fix for the leverage effect, but simpler than EGARCH: GJR keeps the standard GARCH form and adds one extra term that only switches on when the last shock was negative. So bad news gets an additional volatility kick (α+γ) versus good news (α alone). Easy to interpret, easy to fit.",
    math: [
      { label: "GJR-GARCH(1,1)", lines: "σ²_t = ω + α·ε²_{t-1} + γ·I_{t-1}·ε²_{t-1} + β·σ²_{t-1}\n\nI_{t-1} = 1 if ε_{t-1} < 0  (bad news),  else 0" },
      { label: "ASYMMETRIC IMPACT", lines: "Positive shock impact:  α\nNegative shock impact:  α + γ\nγ > 0  →  downside moves raise vol more\nStationarity:  α + β + γ/2 < 1" },
    ],
    params: ["γ > 0 confirms leverage effect", "Indicator on negative shocks only", "Fit by MLE"],
    when: "When you want asymmetry but prefer GJR's interpretability over EGARCH's log form. Common in academic & risk work.",
    refs: ["Glosten, Jagannathan & Runkle (1993), \"On the Relation between Expected Value and Volatility of Nominal Excess Return\" — J. Finance"],
  },
  {
    id: "V5", cat: "vol", name: "EWMA Volatility", tag: "Baseline",
    summary: "RiskMetrics exponentially-weighted moving average — GARCH's simpler cousin.",
    intuition: "Before fitting a full GARCH, EWMA gives a fast, parameter-light volatility estimate: an exponentially-weighted average of past squared returns, where recent observations matter more. It's actually a GARCH(1,1) with ω=0 and α+β=1 (no mean reversion). JP Morgan's RiskMetrics made it the industry baseline for VaR.",
    math: [
      { label: "EWMA VARIANCE", lines: "σ²_t = λ·σ²_{t-1} + (1−λ)·r²_{t-1}\n\nλ = decay factor (RiskMetrics: 0.94 daily, 0.97 monthly)\nHigher λ → smoother, slower to react" },
      { label: "RELATION TO GARCH", lines: "EWMA = GARCH(1,1) with:\n  ω = 0,   α = (1−λ),   β = λ\n→ no long-run mean (α+β = 1, non-stationary)\nSimpler but won't mean-revert vol forecasts" },
    ],
    params: ["λ: 0.94 (daily), 0.97 (monthly) — RiskMetrics", "No estimation needed (λ fixed)", "Single-parameter, very fast"],
    when: "Quick vol estimates and the RiskMetrics VaR baseline. Use when you need speed/simplicity over GARCH's mean-reversion.",
    refs: ["J.P. Morgan / Reuters (1996), \"RiskMetrics — Technical Document, 4th ed.\""],
  },

  // ─────────────────────────── RISK (VaR) ───────────────────────────
  {
    id: "R1", cat: "risk", name: "Historical VaR", tag: "VaR",
    summary: "Empirical loss quantile from the actual historical return distribution — no assumptions.",
    intuition: "The simplest VaR: look at your portfolio's actual returns over the past N days, sort them worst to best, and read off the loss at your confidence level. If 95% VaR is ₹2L, then on 95% of days you won't lose more than ₹2L. It makes no distributional assumption — it just trusts history. Weakness: it's blind to anything that hasn't happened yet.",
    math: [
      { label: "HISTORICAL VaR", lines: "VaR_α = − Percentile( {r_1, ..., r_N}, (1−α)×100 )\n\nα = confidence (e.g. 0.95)\nFor 95% VaR: the 5th-percentile (worst) return\nVaR in ₹ = |that return| × portfolio value" },
      { label: "EXAMPLE", lines: "500 days of returns, sort ascending.\n95% VaR = 25th worst day (5% of 500).\nIf that return = −3.1% and portfolio = ₹10L:\n→ 1-day 95% VaR = ₹31,000" },
    ],
    params: ["Window: 250–500 trading days", "Confidence: 95% or 99%", "Horizon: scale by √t for multi-day"],
    when: "Quick, intuitive, assumption-free. Use when returns are non-normal (fat tails). Reacts slowly and can't see beyond the sample.",
    refs: ["Jorion (2006), \"Value at Risk: The New Benchmark for Managing Financial Risk\" — McGraw-Hill (3rd ed.)"],
  },
  {
    id: "R2", cat: "risk", name: "Parametric VaR", tag: "VaR",
    summary: "Variance-covariance VaR assuming normally-distributed returns — fast and analytical.",
    intuition: "Assume returns are normally distributed, estimate the mean and standard deviation, and VaR becomes a simple formula — no need to sort data. For a portfolio, use the covariance matrix to capture how positions move together. Fast and clean, but the normality assumption understates tail risk (real markets have fatter tails than the bell curve).",
    math: [
      { label: "PARAMETRIC VaR (single asset)", lines: "VaR_α = (μ − z_α · σ) × V\n\nz_α = normal quantile (1.645 @95%, 2.326 @99%)\nμ = mean return, σ = volatility, V = position value\nOften μ set to 0 for short horizons" },
      { label: "PORTFOLIO VaR (covariance)", lines: "σ_p = √( wᵀ Σ w )\n\nw = position weights vector\nΣ = covariance matrix of asset returns\nVaR_p = z_α · σ_p · V" },
    ],
    params: ["z: 1.645 (95%), 2.326 (99%)", "Σ from EWMA or sample covariance", "Best for linear portfolios (no options)"],
    when: "Large linear portfolios needing fast computation. Breaks for option-heavy books (non-linear payoffs) and underestimates tail events.",
    refs: ["J.P. Morgan (1996), \"RiskMetrics Technical Document\" — variance-covariance VaR"],
  },
  {
    id: "R3", cat: "risk", name: "Monte Carlo VaR", tag: "VaR",
    summary: "Simulate thousands of price paths, revalue the portfolio, read the loss quantile.",
    intuition: "Instead of assuming a formula or trusting raw history, generate thousands of possible future scenarios by simulating correlated random price paths. Revalue the full portfolio (including non-linear options) under each scenario, build the loss distribution, and read off VaR. The most flexible method — handles any instrument — but computationally heavy.",
    math: [
      { label: "GEOMETRIC BROWNIAN MOTION PATH", lines: "S_T = S_0 · exp[ (μ − σ²/2)·T + σ·√T·Z ]\n\nZ ~ N(0,1),  one draw per simulation\nFor portfolios: draw correlated Z via Cholesky of Σ" },
      { label: "VaR FROM SIMULATION", lines: "1. Simulate M paths (e.g. 10,000)\n2. Revalue portfolio at horizon for each → P&L_m\n3. Sort P&L, take (1−α) percentile\nVaR_α = − Percentile({P&L_m}, (1−α)×100)" },
    ],
    params: ["Simulations: 10,000+ for stable tails", "Correlation via Cholesky decomposition", "Process: GBM, jump-diffusion, or historical bootstrap"],
    when: "Option portfolios, path-dependent payoffs, complex correlations. The gold standard when accuracy matters more than speed.",
    refs: ["Glasserman (2003), \"Monte Carlo Methods in Financial Engineering\" — Springer"],
  },
  {
    id: "R4", cat: "risk", name: "Expected Shortfall (CVaR)", tag: "Tail",
    summary: "The average loss in the tail beyond VaR — what you actually lose on a bad day.",
    intuition: "VaR tells you the threshold ('you won't lose more than ₹2L 95% of the time') but says nothing about how bad the other 5% gets. Expected Shortfall answers that: it's the average loss given that you've breached VaR. It's 'coherent' (rewards diversification, unlike VaR) and is now the Basel-mandated risk measure for trading books.",
    math: [
      { label: "EXPECTED SHORTFALL", lines: "ES_α = E[ L | L > VaR_α ]\n\n= average of all losses worse than VaR\n= (1/(1−α)) ∫_α¹ VaR_u du" },
      { label: "HISTORICAL ESTIMATE", lines: "ES_α = mean( losses beyond the VaR cutoff )\n\nIf 95% VaR = 25th worst of 500 days,\nES = average of the worst 25 days\nAlways ≥ VaR (captures the tail depth)" },
    ],
    params: ["Same confidence as VaR (97.5% under Basel FRTB)", "Needs enough tail observations", "More stable than VaR for optimization"],
    when: "Regulatory capital (Basel FRTB), tail-risk-aware optimization, anywhere the shape of the tail matters — which is everywhere that blows up.",
    refs: ["Artzner, Delbaen, Eber & Heath (1999), \"Coherent Measures of Risk\" — Mathematical Finance", "Rockafellar & Uryasev (2000), \"Optimization of Conditional Value-at-Risk\" — J. Risk"],
  },
  {
    id: "R5", cat: "risk", name: "Stress Testing", tag: "Scenario",
    summary: "Revalue the portfolio under specific extreme scenarios — historical and hypothetical.",
    intuition: "VaR describes normal-times risk. Stress testing asks: what happens in a 2008, a COVID crash, a rate shock? You apply specific large moves — either replaying historical crises or constructing hypothetical ones — and see the damage. It catches the tail risks that statistical VaR smooths over, and it's what regulators and boards actually care about.",
    math: [
      { label: "SCENARIO REVALUATION", lines: "ΔV_scenario = V(market + shock) − V(market_now)\n\nShock = vector of factor moves, e.g.\n  equities −30%, credit spreads +200bps,\n  vol +15pts, INR −10%" },
      { label: "SENSITIVITY (factor approach)", lines: "ΔV ≈ Σ_k  (∂V/∂f_k) · Δf_k   +  ½ Σ (∂²V/∂f_k²)·Δf_k²\n\nFirst-order (delta) + second-order (gamma) for options\nReverse stress test: find the shock that breaks you" },
    ],
    params: ["Historical: 2008, 2020, 2013 taper, etc.", "Hypothetical: regulator-defined or internal", "Reverse: solve for the scenario causing X% loss"],
    when: "Board reporting, regulatory submissions, and sanity-checking any VaR number. The 'what could actually kill us' question.",
    refs: ["BCBS (2009), \"Principles for Sound Stress Testing Practices and Supervision\" — Basel Committee"],
  },
  {
    id: "R6", cat: "risk", name: "VaR Backtesting (Kupiec)", tag: "Validation",
    summary: "Statistically test whether your VaR model's breach rate matches its confidence level.",
    intuition: "A 95% VaR should be breached ~5% of the time. If your model is breached 15% of the time, it's underestimating risk; if 1%, it's too conservative (wasting capital). The Kupiec POF (Proportion of Failures) test checks whether the observed breach count is statistically consistent with the model's claimed confidence — it's how you validate (and how regulators audit) a VaR model.",
    math: [
      { label: "KUPIEC POF TEST", lines: "LR_POF = −2 ln[ (1−p)^(N−x)·p^x / ((1−x/N)^(N−x)·(x/N)^x) ]\n\nN = total days,  x = number of breaches\np = expected breach rate (e.g. 0.05)\nLR_POF ~ χ²(1) under H₀ (model is correct)" },
      { label: "DECISION", lines: "Reject model if LR_POF > 3.84  (χ²₁ at 95%)\n\nBasel 'traffic light' on 250 days @99% VaR:\n  0–4 breaches = green,  5–9 = yellow,  10+ = red\nRed → capital multiplier penalty" },
    ],
    params: ["Test window: 250 days (Basel standard)", "Also test independence (breaches shouldn't cluster)", "Christoffersen test = POF + independence"],
    when: "Mandatory model validation. Every VaR model in a regulated entity must pass backtesting — it determines your capital multiplier.",
    refs: ["Kupiec (1995), \"Techniques for Verifying the Accuracy of Risk Measurement Models\" — J. Derivatives", "Christoffersen (1998), \"Evaluating Interval Forecasts\" — International Economic Review"],
  },

  // ─────────────────────────── BANKING / REGULATORY ───────────────────────────
  {
    id: "B1", cat: "banking", name: "Capital Adequacy (CAR)", tag: "Basel III",
    summary: "The core Basel III solvency ratio — capital held against risk-weighted assets.",
    intuition: "A bank must hold enough capital to absorb losses without failing. CAR measures regulatory capital as a percentage of risk-weighted assets (RWA) — riskier assets demand more capital backing. Basel III sets a minimum total CAR of 8%, plus buffers. CET1 (the highest-quality equity capital) carries the strictest sub-requirement.",
    math: [
      { label: "CAPITAL ADEQUACY RATIO", lines: "CAR = (Tier 1 + Tier 2 Capital) / RWA\n\nTier 1 = CET1 + Additional Tier 1 (going-concern)\nTier 2 = subordinated debt etc. (gone-concern)\nRWA = Σ (asset_i × risk_weight_i)" },
      { label: "BASEL III MINIMUMS", lines: "CET1            ≥ 4.5%\nTier 1          ≥ 6.0%\nTotal CAR       ≥ 8.0%\n+ Capital Conservation Buffer  +2.5% (CET1)\n+ Countercyclical Buffer       0–2.5%\n(India/RBI: total CAR min 9% + buffers)" },
    ],
    params: ["Risk weights: 0% sovereign, 20% banks, 100% corporate, etc.", "RWA covers credit + market + operational risk", "India: RBI sets CAR min at 9% (above Basel 8%)"],
    when: "The headline solvency metric for any bank. Every lending decision consumes RWA and therefore capital.",
    refs: ["BCBS (2011), \"Basel III: A Global Regulatory Framework for More Resilient Banks\" — Basel Committee", "RBI Master Circular on Basel III Capital Regulations"],
  },
  {
    id: "B2", cat: "banking", name: "Liquidity Coverage Ratio", tag: "Basel III",
    summary: "High-quality liquid assets vs 30-day stressed net cash outflows — short-term survival.",
    intuition: "2008 showed banks can be solvent but still collapse from a liquidity run. LCR ensures a bank holds enough High-Quality Liquid Assets (HQLA — cash, govt bonds) to survive a 30-day severe stress scenario where deposits flee and funding dries up. Minimum 100%: you can cover a full month of stressed outflows from liquid assets alone.",
    math: [
      { label: "LIQUIDITY COVERAGE RATIO", lines: "LCR = HQLA / Total Net Cash Outflows (30 days)\n     ≥ 100%\n\nHQLA: Level 1 (cash, central bank reserves, govt bonds @100%)\n      Level 2 (corporate/covered bonds, haircut 15–50%)" },
      { label: "NET CASH OUTFLOWS", lines: "= Outflows − min(Inflows, 75% of Outflows)\n\nOutflows = Σ (liability × run-off rate)\n  retail deposits 5–10%, wholesale 25–100%\nStressed assumptions baked into run-off rates" },
    ],
    params: ["Minimum: 100%", "HQLA haircuts by asset quality", "Inflow cap: 75% of outflows"],
    when: "Short-term (30-day) liquidity resilience. Paired with NSFR for the long-term view.",
    refs: ["BCBS (2013), \"Basel III: The Liquidity Coverage Ratio and Liquidity Risk Monitoring Tools\""],
  },
  {
    id: "B3", cat: "banking", name: "Net Stable Funding Ratio", tag: "Basel III",
    summary: "Stable funding available vs required over a 1-year horizon — structural liquidity.",
    intuition: "LCR covers 30 days; NSFR covers a full year. It checks that long-term, illiquid assets (loans) are funded by stable, long-term funding (equity, term deposits) rather than flighty overnight money. This prevents the maturity-mismatch that caused funding crises. Minimum 100%: stable funding must at least cover the funding your assets require.",
    math: [
      { label: "NET STABLE FUNDING RATIO", lines: "NSFR = Available Stable Funding (ASF) / Required Stable Funding (RSF)\n     ≥ 100%" },
      { label: "ASF & RSF FACTORS", lines: "ASF (sources, by stability):\n  capital 100%, stable retail deposits 90–95%,\n  wholesale <1yr 50%, short-term 0%\nRSF (uses, by illiquidity):\n  cash 0%, govt bonds 5%, loans >1yr 65–85%,\n  illiquid assets 100%" },
    ],
    params: ["Minimum: 100%", "Horizon: 1 year", "Factors set by asset/liability type"],
    when: "Structural funding stability. Stops banks funding 5-year mortgages with overnight repo.",
    refs: ["BCBS (2014), \"Basel III: The Net Stable Funding Ratio\""],
  },
  {
    id: "B4", cat: "banking", name: "SLR & CRR (RBI)", tag: "RBI",
    summary: "India's mandated reserve ratios — Statutory Liquidity Ratio and Cash Reserve Ratio.",
    intuition: "RBI requires every Indian bank to park a portion of its deposits in safe/liquid form. CRR is cash held with the RBI (earns no interest) — a monetary-policy lever to control money supply. SLR is the share kept in liquid assets (govt securities, cash, gold) — ensuring solvency and creating captive demand for govt bonds. Both are computed on Net Demand & Time Liabilities (NDTL).",
    math: [
      { label: "CASH RESERVE RATIO (CRR)", lines: "Required CRR balance = CRR% × NDTL\n\nHeld as cash with RBI (no interest)\nTypical CRR: ~4–4.5%  (RBI-set, varies)\nNDTL = demand deposits + time deposits − inter-bank net" },
      { label: "STATUTORY LIQUIDITY RATIO (SLR)", lines: "Required SLR holding = SLR% × NDTL\n\nHeld in: govt securities, cash, gold\nTypical SLR: ~18%  (RBI-set)\nFails SLR → penal interest to RBI" },
    ],
    params: ["CRR: ~4–4.5% of NDTL (cash with RBI)", "SLR: ~18% of NDTL (G-secs/cash/gold)", "Computed fortnightly on NDTL"],
    when: "Core of Indian bank balance-sheet management and RBI monetary policy transmission. Directly constrains lendable funds.",
    refs: ["RBI, \"Master Direction — Reserve Bank of India (Cash Reserve Ratio and Statutory Liquidity Ratio)\""],
  },
  {
    id: "B5", cat: "banking", name: "Leverage Ratio", tag: "Basel III",
    summary: "Tier 1 capital vs total (non-risk-weighted) exposure — a backstop to CAR.",
    intuition: "RWA-based CAR can be gamed by piling into 'low-risk-weight' assets. The leverage ratio is a simple, risk-insensitive backstop: Tier 1 capital divided by total exposure (on + off balance sheet), ignoring risk weights entirely. It caps how big a bank can grow relative to its capital, regardless of how 'safe' the assets claim to be.",
    math: [
      { label: "LEVERAGE RATIO", lines: "Leverage Ratio = Tier 1 Capital / Total Exposure\n               ≥ 3%   (Basel III minimum)\n\nTotal Exposure = on-balance-sheet assets\n               + derivative exposure\n               + SFT exposure + off-balance-sheet items" },
      { label: "WHY IT EXISTS", lines: "CAR uses risk weights → can be optimised down.\nLeverage ratio uses NO risk weights → un-gameable floor.\nIndia/RBI: 4% for large banks, 3.5% others." },
    ],
    params: ["Minimum: 3% (Basel), 3.5–4% (RBI)", "No risk weighting — raw exposure", "Includes off-balance-sheet items"],
    when: "The backstop that catches what RWA optimization hides. Binds for low-risk-weight, high-volume banks.",
    refs: ["BCBS (2014/2017), \"Basel III Leverage Ratio Framework and Disclosure Requirements\""],
  },
  {
    id: "B6", cat: "banking", name: "Credit Risk: PD · LGD · EAD", tag: "Credit Risk",
    summary: "The three parameters behind expected loss and IFRS 9 / ECL provisioning.",
    intuition: "Every loan carries expected loss, decomposed into three drivers: how likely the borrower defaults (PD), how much you lose if they do (LGD, after recovery/collateral), and how much is outstanding at that moment (EAD). Multiply them for Expected Loss — the basis for loan-loss provisions under IFRS 9 / Ind AS 109 (ECL) and Basel IRB capital.",
    math: [
      { label: "EXPECTED LOSS", lines: "EL = PD × LGD × EAD\n\nPD  = Probability of Default (over 1yr or lifetime)\nLGD = Loss Given Default = 1 − recovery rate\nEAD = Exposure at Default (₹ outstanding)" },
      { label: "ECL (IFRS 9 / Ind AS 109)", lines: "ECL = Σ_t  PD_t × LGD_t × EAD_t × Discount_t\n\nStage 1: 12-month ECL (performing)\nStage 2: lifetime ECL (significant ↑ in risk)\nStage 3: lifetime ECL + credit-impaired\nUnexpected Loss → Basel capital (not provisions)" },
    ],
    params: ["PD: from rating models / logistic regression", "LGD: collateral & seniority dependent", "Stages: 1 / 2 / 3 by credit deterioration"],
    when: "Loan pricing, provisioning, and IRB capital. The quantitative core of every bank's credit function.",
    refs: ["Basel II/III IRB Framework — PD/LGD/EAD; IFRS 9 / Ind AS 109 Expected Credit Loss", "Merton (1974), \"On the Pricing of Corporate Debt\" — J. Finance (structural PD)"],
  },

  // ─────────────────────────── MACHINE LEARNING ───────────────────────────
  {
    id: "M1", cat: "ml", name: "Gradient Boosting / Random Forest", tag: "Supervised",
    summary: "Tree ensembles predicting returns/direction from engineered features.",
    intuition: "The workhorse of practical ML in finance. You engineer features (momentum, value, volatility, volume signals) and train an ensemble of decision trees to predict next-period return or direction. Random Forest averages many independent trees (reduces variance); Gradient Boosting builds trees sequentially, each correcting the last's errors (reduces bias). XGBoost/LightGBM dominate quant ML competitions.",
    math: [
      { label: "GRADIENT BOOSTING", lines: "F_m(x) = F_{m-1}(x) + ν · h_m(x)\n\nh_m fit to negative gradient (residuals) of loss L:\n  r_im = −[ ∂L(y_i, F(x_i)) / ∂F(x_i) ]_{F=F_{m-1}}\nν = learning rate (shrinkage, e.g. 0.01–0.1)" },
      { label: "RANDOM FOREST", lines: "ŷ = (1/B) Σ_{b=1}^{B} T_b(x)\n\nEach tree T_b trained on a bootstrap sample,\nrandom feature subset per split (decorrelates trees)\nVariance ↓ via averaging; no sequential dependence" },
    ],
    params: ["Features: cross-sectional + time-series signals", "Regularise hard: depth, learning rate, early stopping", "Walk-forward CV — never random split (leakage)"],
    when: "Tabular feature-based prediction — the realistic entry point for ML alpha. Beware overfitting; financial signal-to-noise is brutal.",
    refs: ["Krauss, Do & Huck (2017), \"Deep Neural Networks, Gradient-Boosted Trees, Random Forests: Statistical Arbitrage on the S&P 500\" — EJOR 259", "Breiman (2001), \"Random Forests\" — Machine Learning; Friedman (2001), \"Greedy Function Approximation: A Gradient Boosting Machine\""],
  },
  {
    id: "M2", cat: "ml", name: "Logistic Regression", tag: "Supervised",
    summary: "Linear classifier for directional (up/down) prediction and default probability.",
    intuition: "The simplest, most interpretable ML classifier — and a serious baseline. It models the probability of a binary outcome (price up vs down, default vs no-default) as a logistic function of a weighted feature sum. Coefficients are directly readable. In banking it's the standard PD (probability of default) model; in trading it's a transparent direction predictor.",
    math: [
      { label: "LOGISTIC MODEL", lines: "P(y=1 | x) = 1 / (1 + e^{−(β₀ + βᵀx)})\n\nLog-odds:  ln[ p/(1−p) ] = β₀ + βᵀx   (linear)\nDecision:  predict up if p > threshold" },
      { label: "FITTING (Maximum Likelihood)", lines: "max_β  Σ_i [ y_i·ln(p_i) + (1−y_i)·ln(1−p_i) ]\n\nAdd L1 (Lasso) / L2 (Ridge) penalty to regularise:\n  − λ·‖β‖₁   or   − λ·‖β‖₂²\nL1 → feature selection (sparse β)" },
    ],
    params: ["Regularisation: L1/L2 with λ via CV", "Calibrate probabilities (Platt/isotonic)", "Standardise features first"],
    when: "Default-probability models (PD), transparent direction signals, and a must-have baseline before reaching for anything fancier.",
    refs: ["Cox (1958), \"The Regression Analysis of Binary Sequences\" — JRSS B", "Hosmer & Lemeshow (2000), \"Applied Logistic Regression\" — Wiley"],
  },
  {
    id: "M3", cat: "ml", name: "LSTM / GRU / Transformer", tag: "Deep Learning",
    summary: "Sequence models that learn temporal patterns from raw price/feature time series.",
    intuition: "Financial data is sequential — order matters. LSTMs and GRUs are recurrent networks with gating that remember long-range dependencies while avoiding vanishing gradients. Transformers replace recurrence with self-attention, letting the model weigh any past timestep directly (and parallelise training). Powerful for multivariate sequences, but data-hungry and dangerously easy to overfit on noisy markets.",
    math: [
      { label: "LSTM CELL (gates)", lines: "f_t = σ(W_f·[h_{t-1}, x_t] + b_f)     forget gate\ni_t = σ(W_i·[h_{t-1}, x_t] + b_i)     input gate\nc_t = f_t⊙c_{t-1} + i_t⊙tanh(W_c·[h_{t-1},x_t])\no_t = σ(W_o·[h_{t-1}, x_t] + b_o)     output gate\nh_t = o_t ⊙ tanh(c_t)" },
      { label: "TRANSFORMER SELF-ATTENTION", lines: "Attention(Q,K,V) = softmax( QKᵀ / √d_k ) · V\n\nQ,K,V = learned projections of the sequence\nEach position attends to all others directly\nGRU = simplified LSTM (2 gates, fewer params)" },
    ],
    params: ["Sequence length, hidden units, layers, dropout", "Huge regularisation + early stopping", "Walk-forward; expanding window; no shuffling"],
    when: "Rich multivariate sequences with lots of data (intraday/HFT, alt-data). Overkill and overfit-prone for small daily datasets.",
    refs: ["Hochreiter & Schmidhuber (1997), \"Long Short-Term Memory\" — Neural Computation", "Vaswani et al. (2017), \"Attention Is All You Need\" — NeurIPS (arXiv:1706.03762)"],
  },
  {
    id: "M4", cat: "ml", name: "K-Means / GMM Clustering", tag: "Unsupervised",
    summary: "Unsupervised grouping for regime detection and stock-universe segmentation.",
    intuition: "No labels needed — just find structure. K-Means partitions data into k clusters by proximity to centroids; useful for grouping stocks by behaviour or labelling market days into regimes. Gaussian Mixture Models (GMM) are the soft, probabilistic version: each point gets a membership probability across clusters, and clusters can be elliptical (different covariances) rather than spherical.",
    math: [
      { label: "K-MEANS OBJECTIVE", lines: "min  Σ_{k=1}^{K} Σ_{x∈C_k} ‖x − μ_k‖²\n\nLloyd's algorithm: alternate\n  assign:  each x → nearest centroid μ_k\n  update:  μ_k = mean of points in C_k" },
      { label: "GAUSSIAN MIXTURE MODEL (GMM)", lines: "p(x) = Σ_{k=1}^{K} π_k · N(x | μ_k, Σ_k)\n\nπ_k = mixing weights (Σπ_k = 1)\nFit by EM:  E-step (responsibilities), M-step (update)\nSoft assignment: P(cluster k | x) = responsibility" },
    ],
    params: ["k: via elbow / silhouette / BIC (GMM)", "Features: returns, vol, correlation profile", "Standardise; beware regime instability"],
    when: "Regime labelling, pairs candidate grouping, portfolio diversification by behavioural cluster. The unsupervised companion to HMM.",
    refs: ["MacQueen (1967), \"Some Methods for Classification and Analysis of Multivariate Observations\"", "Dempster, Laird & Rubin (1977), \"Maximum Likelihood from Incomplete Data via the EM Algorithm\" — JRSS B"],
  },
  {
    id: "M5", cat: "ml", name: "Reinforcement Learning", tag: "RL",
    summary: "Agents that learn execution and position-sizing policies by maximising reward.",
    intuition: "Instead of predicting prices, RL learns a policy — what action to take in each state to maximise cumulative reward. An agent observes market state (price, inventory, time), takes actions (buy/sell/hold, order size), and learns from the resulting P&L. Most credible in execution (minimising market impact) and dynamic sizing, where the problem is genuinely sequential decision-making, not prediction.",
    math: [
      { label: "Q-LEARNING (value-based)", lines: "Q(s,a) ← Q(s,a) + η·[ r + γ·max_{a'} Q(s',a') − Q(s,a) ]\n\ns,a = state, action;  r = reward;  γ = discount\nDeep Q-Network (DQN): approximate Q with a neural net\nPolicy: a* = argmax_a Q(s,a)" },
      { label: "POLICY GRADIENT (direct policy)", lines: "∇_θ J(θ) = E[ ∇_θ ln π_θ(a|s) · A(s,a) ]\n\nπ_θ = parameterised policy,  A = advantage\nMaximise expected reward J directly\nReward design is everything (P&L − risk penalty − costs)" },
    ],
    params: ["State/action/reward design (hardest part)", "Reward: risk- & cost-adjusted P&L", "Backtest realism: slippage, impact, latency"],
    when: "Optimal execution, market making, dynamic hedging/sizing. Fragile and reward-hacking-prone — strongest where the task is truly sequential.",
    refs: ["Sutton & Barto (2018), \"Reinforcement Learning: An Introduction\" — MIT Press (2nd ed.)", "Nevmyvaka, Feng & Kearns (2006), \"Reinforcement Learning for Optimized Trade Execution\" — ICML"],
  },
];

// ════════════════════════════════════════════════════════════════════
//  UI
// ════════════════════════════════════════════════════════════════════

function Formula({ label, lines }) {
  return (
    <div className="my-3 p-3.5 rounded-lg border border-amber/20 bg-amber/[0.03] overflow-x-auto">
      {label && <p className="font-mono text-[10px] text-muted tracking-wider mb-2">{label}</p>}
      <pre className="font-mono text-[12.5px] text-amber leading-relaxed whitespace-pre">{lines}</pre>
    </div>
  );
}

function ModelCard({ m, open, onToggle }) {
  return (
    <div className={`card transition-colors ${open ? "border-amber/50" : "hover:border-amber/40"}`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-amber text-xs">{m.id}</span>
            <h3 className="font-display text-lg font-medium">{m.name}</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed mt-1.5">{m.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-mono text-[10px] tracking-wider uppercase text-muted border border-line rounded px-2 py-0.5 whitespace-nowrap">
            {m.tag}
          </span>
          <span className={`text-amber transition-transform text-lg leading-none ${open ? "rotate-45" : ""}`}>+</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 -mt-1">
          <div className="h-px bg-line mb-4" />

          <p className="font-mono text-[10px] text-muted tracking-wider mb-1.5">INTUITION</p>
          <p className="text-sm text-body/85 leading-relaxed mb-4">{m.intuition}</p>

          <p className="font-mono text-[10px] text-muted tracking-wider mb-1">THE MATH</p>
          {m.math.map((f, i) => <Formula key={i} label={f.label} lines={f.lines} />)}

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="font-mono text-[10px] text-muted tracking-wider mb-2">PARAMETERS</p>
              <ul className="space-y-1.5">
                {m.params.map((p, i) => (
                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-2">
                    <span className="text-amber shrink-0">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted tracking-wider mb-2">WHEN IT WORKS</p>
              <p className="text-xs text-muted leading-relaxed">{m.when}</p>
            </div>
          </div>

          {m.refs && m.refs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="font-mono text-[10px] text-amber tracking-wider mb-2">KEY RESEARCH</p>
              <ul className="space-y-1.5">
                {m.refs.map((r, i) => (
                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-2">
                    <span className="text-amber shrink-0">§</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Models() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : QUANT — MODELS LIBRARY ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Quant models, by category
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        The models behind AHQ — from market-neutral statistical arbitrage to risk
        quantification and the regulatory frameworks banks operate under. Click any
        model to expand the math, intuition, parameters and where it works.
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        {CATEGORIES.map((c) => (
          <a
            key={c.key}
            href={`#${c.key}`}
            className="font-mono text-[11px] tracking-wider px-3 py-1.5 rounded border border-line text-muted hover:text-amber hover:border-amber/40 transition-colors"
          >
            {c.label}
          </a>
        ))}
      </div>

      {CATEGORIES.map((cat) => {
        const models = MODELS.filter((m) => m.cat === cat.key);
        return (
          <section key={cat.key} id={cat.key} className="mt-12 scroll-mt-24">
            <div className={`pb-3 mb-5 border-b ${cat.headline ? "border-amber/40" : "border-line"}`}>
              <p className={`font-mono text-[11px] tracking-[0.22em] uppercase ${cat.headline ? "text-amber" : "text-muted"}`}>
                {cat.eyebrow}
              </p>
              <h2 className={`font-display tracking-tight mt-1.5 ${cat.headline ? "text-3xl font-semibold" : "text-2xl font-medium"}`}>
                {cat.label}
                {cat.headline && <span className="text-amber"> ◆</span>}
              </h2>
              <p className="text-sm text-muted leading-relaxed mt-2 max-w-2xl">{cat.blurb}</p>
            </div>

            <div className={`grid gap-3 ${cat.headline ? "" : "md:grid-cols-2"}`}>
              {models.map((m) => (
                <ModelCard
                  key={m.id}
                  m={m}
                  open={openId === m.id}
                  onToggle={() => setOpenId(openId === m.id ? null : m.id)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="card p-6 mt-12 flex flex-wrap items-center justify-between gap-4 border-amber/30">
        <div>
          <p className="font-display font-medium">See these models run live</p>
          <p className="text-sm text-muted mt-1">
            The Scanner runs the stat-arb and trend models across 50 NSE stocks in real time.
          </p>
        </div>
        <Link href="/scanner" className="btn-primary">Open Scanner →</Link>
      </div>

      <p className="font-mono text-[11px] text-muted mt-6">
        RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE · MODELS SIMPLIFIED FOR CLARITY
      </p>
    </div>
  );
}
