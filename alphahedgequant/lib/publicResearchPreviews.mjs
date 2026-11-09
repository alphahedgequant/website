// Public, original research previews of EXISTING protected AHQ collections.
// No full report text, signed-in model instructions, or private data is exported here.
// Publisher access remains governed by the original publisher.
export const PREVIEW_RELEASE_DATE="2026-11-09";
export const PUBLIC_RESEARCH_SERIES=[
  {
    "id": "research-papers",
    "eyebrow": "01 / SCIENTIFIC RESEARCH",
    "title": "Research Papers",
    "summary": "Discover methods behind quantitative research: market manipulation detection, cointegration, statistical arbitrage and coherent portfolio risk.",
    "intro": "A searchable introduction to influential academic and original quantitative research. Read our public interpretation of a paper’s question, method and limitations. Sign in to access the full AlphaHedgeQuant research workspace and its research-paper catalogue.",
    "subject": "Financial engineering · econometrics · market microstructure",
    "fullRoute": "/research",
    "fullLabel": "Open full research-paper workspace",
    "notice": "Publisher articles and original papers have their own access rights. AlphaHedgeQuant account access unlocks our research workspace, not paywalled rights to a third-party publication."
  },
  {
    "id": "quant-models",
    "eyebrow": "02 / MATHEMATICAL MODELS",
    "title": "Quant Models",
    "summary": "Explore mathematical ideas behind VaR, GARCH, gamma exposure, cointegration, covariance shrinkage and regime models before entering the interactive model library.",
    "intro": "A preview of the mathematical framework and intuition for six models already available in the AlphaHedgeQuant Quant Models section. The public notes explain what a model estimates and where its assumptions break. Sign in to open detailed lessons, formulas and model interfaces.",
    "subject": "Risk · volatility · systematic research · portfolio design",
    "fullRoute": "/models",
    "fullLabel": "Open full Quant Models",
    "notice": "Model examples are educational and do not provide trading signals. The complete interactive model lessons are available to signed-in visitors."
  },
  {
    "id": "macro-outlook",
    "eyebrow": "03 / MACROECONOMIC RESEARCH",
    "title": "Macro Outlook",
    "summary": "Understand the transmission from inflation, central-bank policy, liquidity, trade and currency to Indian sectors and company valuation.",
    "intro": "Read the key questions behind AlphaHedgeQuant's India and global macro reports. Public previews focus on the economic reasoning rather than republishing unverified or stale market figures. Sign in to read the complete archived reports and their detailed narrative.",
    "subject": "India macro · monetary policy · sector earnings · valuation",
    "fullRoute": "/reports",
    "fullLabel": "Open full Macro Outlook reports",
    "notice": "Archived reports reflect the publication date shown. Historical figures, forecasts and policy statements are not automatically updated; check primary releases before relying on them."
  }
];
export const RESEARCH_PREVIEWS=[
  {
    "series": "research-papers",
    "slug": "market-manipulation-detection-framework",
    "title": "Market Manipulation Detection in Limit Order Books",
    "subtitle": "An AlphaHedgeQuant research-paper preview on modelling unusual order-flow patterns and surveillance evidence.",
    "published": "2026-04-01",
    "label": "ORIGINAL RESEARCH / MARKET MICROSTRUCTURE",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/research",
    "paper": {
      "label": "AlphaHedgeQuant research catalogue entry (SSRN link)",
      "url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6519201"
    },
    "intro": [
      "Market manipulation surveillance asks a difficult question: how can one separate an intentional attempt to mislead other market participants from aggressive yet legitimate trading? A rapidly cancelled order may be suspicious in context, but cancellation alone is not evidence of intent.",
      "Order-book research starts with event-level messages—placements, modifications, executions and cancellations. To evaluate a pattern, analysts need the sequence, not just a chart of the closing price. Queue position, distance from the best quote, short-lived size imbalances and subsequent price or execution effects can all change the interpretation.",
      "AlphaHedgeQuant's existing research catalogue describes a framework combining self-exciting order-flow ideas, distance-weighted features and economic profitability analysis. Such features may help prioritize surveillance reviews, but they are neither a legal finding nor proof of a particular trader’s motive. Investigators would still need appropriate records, controls, competing explanations and independent corroboration."
    ],
    "takeaways": [
      "A message stream is more informative than an aggregate candle for studying order-book behavior.",
      "A statistical anomaly is a screening signal, not a conclusion about intent.",
      "Detection quality depends on false positives, economic materiality and auditable evidence."
    ],
    "question": "How can a surveillance model identify unusual order-flow sequences without treating every rapid cancellation as wrongdoing?",
    "formula": "Illustrative intensity: λ(t) = μ + Σ α exp[−β(t − tᵢ)]  for prior events tᵢ < t",
    "locked": [
      "Detailed feature construction and model-fitting choices",
      "Empirical evaluation and false-positive analysis",
      "Interpretation of order-sequence examples and robustness"
    ]
  },
  {
    "series": "research-papers",
    "slug": "cointegration-error-correction-engle-granger",
    "title": "Cointegration and Error Correction — Engle & Granger",
    "subtitle": "Why correlated asset prices are not automatically cointegrated and what an error-correction representation means.",
    "published": "2026-11-09",
    "label": "FOUNDATIONAL PAPER / ECONOMETRICS",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/research",
    "paper": {
      "label": "Engle & Granger (1987), Econometrica DOI",
      "url": "https://doi.org/10.2307/1913236"
    },
    "intro": [
      "A pair of asset prices can exhibit strong co-movement without maintaining a stable equilibrium relationship. Correlation is typically measured on returns or variations over a chosen window; cointegration is a separate statement about the long-run combination of individually nonstationary series.",
      "Engle and Granger’s work formalized how a long-run relationship among integrated processes can coexist with short-run adjustments. In practical pairs research, this suggests first studying the statistical properties of the series, estimating a hedge relationship and then testing whether the fitted residual behaves in a stationary manner.",
      "The test is only a starting point. Residual-based critical values, structural breaks, dividend adjustments, data selection, changing hedge ratios, transaction costs and out-of-sample persistence determine whether the theoretical relationship becomes meaningful for a market strategy. A spread can stop behaving like its historical estimate when the underlying companies or economic regimes change."
    ],
    "takeaways": [
      "Correlation and cointegration answer different statistical questions.",
      "A fitted residual requires appropriate stationarity testing, not merely a small ordinary-regression p-value.",
      "Stable in-sample estimates do not guarantee implementable mean-reversion trades."
    ],
    "question": "When does a nonstationary pair admit a stable combination, and what does that say about its adjustment dynamics?",
    "formula": "Spreadₜ = log(Pₐ,ₜ) − α − β log(Pᵦ,ₜ)",
    "locked": [
      "Hypothesis tests and model selection decisions",
      "Walk-forward pairs trading implementation",
      "Structural-break diagnostics and error-correction examples"
    ]
  },
  {
    "series": "research-papers",
    "slug": "statistical-arbitrage-avellaneda-lee",
    "title": "Statistical Arbitrage in US Equities — Avellaneda & Lee",
    "subtitle": "Factor-neutral residual trading, systematic portfolio construction and the difference between a signal and an executable strategy.",
    "published": "2026-11-09",
    "label": "FOUNDATIONAL PAPER / STATISTICAL ARBITRAGE",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/research",
    "paper": {
      "label": "Avellaneda & Lee — SSRN research entry",
      "url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1153505"
    },
    "intro": [
      "Statistical arbitrage studies opportunities arising from relative-value dislocations rather than simple predictions that an index will rise. One common idea is to remove broad factor movement from stock returns and investigate whether the residual process contains temporary departures from a learned baseline.",
      "Factor decomposition is not a magic risk remover. An estimated market-neutral portfolio can still carry exposure to sector shocks, liquidity constraints, short borrow costs, dividends, market impact and changes in the factor model. A residual that looks mean-reverting in history may be responding to new information instead.",
      "The research framework invites careful separation of signal generation, portfolio construction and execution. The strategy should be evaluated with point-in-time constituents, realistically available borrow, timing assumptions and net rather than gross returns. Even attractive factor-neutral statistics can conceal path-dependent losses."
    ],
    "takeaways": [
      "A factor-neutral residual is a model output, not a guaranteed mispricing.",
      "Portfolio exposure, leverage, borrow and transaction frictions drive implementability.",
      "Out-of-sample and crisis-regime performance matter as much as the fitted signal."
    ],
    "question": "Can relative-value signals remain economically attractive after factor hedging and the costs of implementation?",
    "formula": "Residual return rᵢ,t − βᵢᵀ fₜ = εᵢ,t  (schematic factor model)",
    "locked": [
      "Residual construction and filtering methods",
      "Portfolio hedge sizing and turnover constraints",
      "Performance attribution and out-of-sample review"
    ]
  },
  {
    "series": "research-papers",
    "slug": "coherent-risk-measures-artzner",
    "title": "Coherent Measures of Risk — Artzner et al.",
    "subtitle": "An introduction to axioms for financial risk measures and why expected shortfall is studied alongside VaR.",
    "published": "2026-11-09",
    "label": "FOUNDATIONAL PAPER / RISK THEORY",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/research",
    "paper": {
      "label": "Artzner et al. (1999), Mathematical Finance DOI",
      "url": "https://doi.org/10.1111/1467-9965.00068"
    },
    "intro": [
      "Risk measurement is more than attaching a number to a portfolio. A coherent risk framework asks whether the number behaves sensibly when positions are added, scaled or compared. The axiomatic approach makes the assumptions of a risk measure explicit.",
      "Properties commonly discussed include monotonicity, translation invariance, positive homogeneity and subadditivity. The last property motivates important questions about diversification: adding two risk positions should not, under the coherent framework, create a larger capital requirement than the sum of the stand-alone requirements.",
      "Value at Risk is a familiar quantile statistic, but some portfolio distributions can make it fail subadditivity. Expected shortfall offers a different tail-focused perspective when defined and estimated appropriately. Neither metric replaces scenario analysis, liquidity stress, model validation or judgment about the underlying loss distribution."
    ],
    "takeaways": [
      "Risk axioms help expose what a reported risk number does and does not mean.",
      "VaR and expected shortfall summarize different parts of a loss distribution.",
      "A mathematically coherent measure can still be badly estimated using inadequate data."
    ],
    "question": "Which properties should a portfolio risk measure satisfy, and what changes when losses are combined?",
    "formula": "Subadditivity: ρ(X + Y) ≤ ρ(X) + ρ(Y)",
    "locked": [
      "Formal axioms and counterexamples",
      "Tail-risk estimation and stress testing",
      "Portfolio aggregation and model-risk comparisons"
    ]
  },
  {
    "series": "quant-models",
    "slug": "historical-value-at-risk",
    "title": "Historical Value at Risk (VaR) — Model Preview",
    "subtitle": "Understand empirical loss quantiles, horizon selection, and why historical VaR is not a worst-case loss bound.",
    "published": "2026-11-09",
    "label": "RISK MODEL / HISTORICAL VAR",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Historical Value at Risk constructs a distribution of hypothetical portfolio losses by repricing the current holdings using past returns or shocks. A reported 99% one-day VaR is a chosen empirical loss quantile under the method’s assumptions, not an upper limit on what can be lost.",
      "The lookback window determines which market environments influence the distribution. A quiet period can underrepresent current stress, while a crisis-dominated window may overstate the risk under more typical conditions. Portfolio weights, corporate actions, currencies and instrument nonlinearity all need consistent treatment.",
      "VaR also does not directly report the average severity of losses beyond its threshold. Expected shortfall, liquidity scenarios and stress testing are complementary; a useful risk dashboard explains how much data went into the estimate and how often actual losses exceeded it."
    ],
    "takeaways": [
      "Choose holding horizon, confidence level and return convention explicitly.",
      "Historical sampling assumes that selected past shocks remain relevant.",
      "Tail losses can exceed the chosen VaR quantile by a large amount."
    ],
    "question": "What loss quantile does the current portfolio imply under the selected historical shocks?",
    "formula": "VaR₉₉% = empirical 99th percentile of modeled losses",
    "locked": [
      "Portfolio repricing implementation",
      "Backtesting violations and sample limits",
      "Scenario comparisons and risk visualization"
    ]
  },
  {
    "series": "quant-models",
    "slug": "garch-conditional-volatility",
    "title": "GARCH(1,1): Conditional Volatility Modelling",
    "subtitle": "Why conditional variance evolves over time and how GARCH responds to clustered market shocks.",
    "published": "2026-11-09",
    "label": "VOLATILITY MODEL / GARCH",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Returns in many markets show periods of relatively calm movement followed by periods of heightened variability. A constant-variance model does not capture this time variation. GARCH introduces an evolving estimate of conditional variance.",
      "A common GARCH(1,1) model links tomorrow's conditional variance to a long-run intercept, the latest squared return innovation and yesterday's conditional variance. Fitting the parameters is a statistical estimation problem; the magnitude of the forecast depends on the data series, return frequency and error-distribution assumptions.",
      "A fitted model can respond slowly to sudden regime breaks, and symmetric GARCH does not capture all asymmetries in volatility response. Comparing it to EWMA, realized volatility, event calendars and out-of-sample forecasts is more informative than relying on one fitted curve."
    ],
    "takeaways": [
      "Volatility clustering motivates conditional rather than fixed variance estimates.",
      "GARCH parameters need stability and distribution checks.",
      "A forecast variance is an estimate, not the future realized path."
    ],
    "question": "How much of the next period's variance estimate comes from the latest shock versus persistent volatility?",
    "formula": "σ²ₜ = ω + α ε²ₜ₋₁ + β σ²ₜ₋₁",
    "locked": [
      "Parameter fitting and residual diagnostics",
      "Volatility forecasts under alternative distributions",
      "Comparison with EWMA and stress episodes"
    ]
  },
  {
    "series": "quant-models",
    "slug": "gamma-exposure-model",
    "title": "Gamma Exposure and the Gamma-Flip Model",
    "subtitle": "A transparent introduction to option-chain gamma aggregation and the key uncertainty in dealer-position assumptions.",
    "published": "2026-11-09",
    "label": "OPTIONS MODEL / GEX",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Gamma exposure models combine option sensitivities with contract positions to estimate how the delta of an option book might change when the underlying price moves. This becomes interesting when market participants hedge their books using the underlying asset or related futures.",
      "Public option open interest generally provides the number of outstanding contracts but not the true signed position of every dealer. Assigning position signs from call-versus-put type alone is a model assumption, not an observation. A robust analysis makes those assumptions explicit and calculates alternative scenarios.",
      "A proposed gamma-flip level is the hypothetical spot value at which signed aggregate gamma crosses zero after repricing contracts. It is not a universal support/resistance level. Changing implied volatility, expiry, open interest or positioning assumptions can move or remove a calculated crossing."
    ],
    "takeaways": [
      "Aggregating Greeks requires correct contract multipliers and units.",
      "Dealer-position sign cannot be reliably inferred from public OI alone.",
      "Gamma flip is conditional on a positioning model and may have no stable solution."
    ],
    "question": "What could delta-hedging demand look like under alternative assumptions about who holds which options?",
    "formula": "GEX proxy ≈ Σ(signᵢ · gammaᵢ · OIᵢ · multiplierᵢ · S² · 0.01)",
    "locked": [
      "Option-chain processing and data-quality filters",
      "GEX scenarios and spot repricing",
      "Gamma-flip computation and sensitivity diagnostics"
    ]
  },
  {
    "series": "quant-models",
    "slug": "ledoit-wolf-covariance",
    "title": "Ledoit–Wolf Covariance Shrinkage for Portfolio Models",
    "subtitle": "A primer on why sample covariance is unstable and how structured shrinkage can improve estimation.",
    "published": "2026-11-09",
    "label": "PORTFOLIO MODEL / COVARIANCE",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Portfolio optimization depends heavily on how risks move together. A sample covariance matrix estimated from a short or noisy return history can be unstable, especially when the number of assets is large relative to available observations.",
      "Shrinkage blends the empirical covariance estimate with a structured target. The aim is not to eliminate risk or force asset weights to be equal; it is to reduce estimation noise while retaining useful signal about diversification.",
      "The approach should be evaluated out of sample and in the context of constraints, transaction costs and the uncertainty of expected returns. A cleaner covariance matrix does not fix poorly specified risk forecasts, data leakage or portfolio concentration caused by an aggressive optimizer."
    ],
    "takeaways": [
      "Covariance estimation error can be amplified by portfolio optimizers.",
      "Shrinkage trades some bias for lower estimation variance.",
      "Out-of-sample risk and turnover should validate the estimator."
    ],
    "question": "Can a regularized covariance estimate reduce unstable portfolio weights without discarding genuine diversification structure?",
    "formula": "Σ̂shrunk = δF + (1 − δ)Σ̂sample, where 0 ≤ δ ≤ 1",
    "locked": [
      "Choice of shrinkage target and coefficient",
      "Portfolio optimization under constraints",
      "Out-of-sample covariance validation"
    ]
  },
  {
    "series": "quant-models",
    "slug": "engle-granger-pairs-model",
    "title": "Engle–Granger Pairs Trading Model",
    "subtitle": "Study spread estimation, residual stationarity and the gap between a z-score and a tradable signal.",
    "published": "2026-11-09",
    "label": "STATISTICAL ARBITRAGE / PAIRS",
    "reading": "5 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Pairs trading often begins with a plausible economic relationship between two securities. A spread is formed using a hedge ratio, then examined for evidence of mean reversion. Choosing the pair solely because its past chart looks tidy invites selection bias.",
      "The Engle–Granger two-step approach estimates a long-run relationship and tests whether the fitted residual is stationary, using appropriate critical values. A rolling z-score can describe how unusual the current spread is compared with its past, but a large z-score does not prove that prices must converge.",
      "Model validation needs walk-forward tests, corporate-action treatment, borrow and execution assumptions, and monitoring for structural change. Even when two assets were cointegrated historically, their business drivers can diverge after a new event or regime shift."
    ],
    "takeaways": [
      "Hedge ratio estimation and residual testing serve different purposes.",
      "In-sample cointegration is not a guarantee of future convergence.",
      "Execution frictions and structural breaks can overwhelm a small statistical edge."
    ],
    "question": "Under which assumptions does the fitted spread behave like a stationary process that might be investigated for relative-value trading?",
    "formula": "Zₜ = (spreadₜ − rolling mean) / rolling standard deviation",
    "locked": [
      "Engle–Granger implementation and critical values",
      "Walk-forward threshold evaluation",
      "Cost, borrow and regime-break analysis"
    ]
  },
  {
    "series": "quant-models",
    "slug": "hidden-markov-market-regimes",
    "title": "Hidden Markov Models for Market Regime Detection",
    "subtitle": "Learn how hidden-state probabilities describe market environments and why a regime model is not a crystal ball.",
    "published": "2026-11-09",
    "label": "MACHINE LEARNING / HMM",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/models",
    "intro": [
      "Markets do not always behave according to one fixed volatility or return process. Regime models attempt to describe changes in the statistical behavior of observed returns and other measurements. A hidden Markov model represents the regime as a latent state with probabilistic transitions.",
      "The model has assumptions about the number of regimes, transition persistence and the distribution of measurements within each state. Historical labels such as 'calm', 'trending' or 'stress' are interpretations of fitted states, not objective ground truth.",
      "Filtered probabilities update with new information and may lag abrupt transitions. Too many states, unstable parameters or future-data leakage can create misleading narratives. Regime probabilities are most responsibly used as uncertain contextual inputs within a larger decision and risk-management process."
    ],
    "takeaways": [
      "Hidden states are inferred, not directly observable market facts.",
      "Results depend strongly on state count, emission model and training window.",
      "A filtered regime label is not a guaranteed prediction of the next market move."
    ],
    "question": "Can a probabilistic state model explain differences in observed return and volatility behavior without assuming a known regime?",
    "formula": "P(zₜ=j | data₁:ₜ) ∝ P(yₜ | zₜ=j) Σᵢ P(zₜ=j | zₜ₋₁=i)P(zₜ₋₁=i | data₁:ₜ₋₁)",
    "locked": [
      "Forward filtering and estimation",
      "Regime persistence and transition matrices",
      "Backtesting of gated strategies with no look-ahead"
    ]
  },
  {
    "series": "macro-outlook",
    "slug": "india-macro-monthly-july-2026",
    "title": "India Macro Monthly — July 2026",
    "subtitle": "Preview the research questions behind an archived India macro outlook on inflation, activity, trade and external risks.",
    "published": "2026-07-16",
    "label": "INDIA MACRO / ARCHIVED REPORT",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/reports/india-macro-monthly-july-2026",
    "intro": [
      "This archived monthly note examines why a calm-looking inflation headline can conceal important differences between sectors, regions and production stages. A macro interpretation requires looking below the aggregate series and tracking how food, energy, goods and services costs affect households and corporate margins differently.",
      "Fiscal collections, industrial output, import demand and trade balances provide complementary—but imperfect—signals about domestic activity. Large nominal tax receipts need to be interpreted alongside base effects and composition; imports can reflect investment, consumption or price changes. None of these readings is a clean stand-alone measure of growth.",
      "The transmission to equities depends on the durability of demand, cost pass-through, interest rates, currency effects and the capital required for expansion. The full archived AlphaHedgeQuant report contains its period-specific numerical discussion. This public preview deliberately avoids presenting historical figures as if they were current."
    ],
    "takeaways": [
      "Disaggregate inflation and credit conditions before forming a view on margins.",
      "Separate nominal growth, base effects and real activity when comparing macro releases.",
      "Link macro narratives to revenues, operating margins, reinvestment and valuation assumptions."
    ],
    "question": "How can a stable headline coexist with divergent sector and regional economic conditions?",
    "formula": "Nominal revenue growth ≈ (1 + real volume growth) × (1 + price growth) − 1",
    "locked": [
      "Complete archived data tables and narrative",
      "Sector-by-sector inflation and trade interpretation",
      "Alternative macro scenarios and valuation transmission"
    ]
  },
  {
    "series": "macro-outlook",
    "slug": "the-twin-pause",
    "title": "The Twin Pause: Federal Reserve and RBI Policy",
    "subtitle": "A preview of the archived macro report comparing the meaning of central-bank pauses across different economic environments.",
    "published": "2026-07-15",
    "label": "GLOBAL MACRO / ARCHIVED REPORT",
    "reading": "6 MIN PREVIEW",
    "fullRoute": "/reports/the-twin-pause",
    "intro": [
      "Two central banks may leave policy rates unchanged for very different reasons. A policy pause can reflect confidence that inflation is stabilizing, caution around weaker growth, uncertainty about exchange-rate pressure, or a decision to collect more evidence before moving again.",
      "To compare central-bank decisions, examine the communication rather than just the unchanged rate: the inflation forecast, growth projection, policy statement, liquidity operations and risk language. Market participants also care about the difference between what was announced and what had already been priced into rate curves.",
      "Monetary-policy transmission varies across countries. Banking structure, household balance sheets, inflation composition, fiscal dynamics, international capital flows and currency regimes all influence how policy rates reach borrowing costs and company cash flows. The complete archived report discusses its period-specific numbers and arguments; this summary should not be read as a current policy-rate update."
    ],
    "takeaways": [
      "An unchanged policy rate does not imply identical central-bank outlooks.",
      "Exchange-rate and global risk channels can make domestic policy less independent.",
      "Valuation effects depend on discount rates, expected growth and sector cash-flow sensitivity."
    ],
    "question": "When two central banks pause, what evidence distinguishes a cautious hold from a turning point in the policy cycle?",
    "formula": "Equity value ≈ Σ expected future cash flowₜ / (1 + discount rate)ᵗ",
    "locked": [
      "Complete archived policy commentary and data notes",
      "Relative inflation, growth and external-balance interpretation",
      "Cross-market scenario implications for interest rates and equities"
    ]
  }
];
export function findResearchSeries(id){return PUBLIC_RESEARCH_SERIES.find(x=>x.id===id)||null;}
export function findResearchPreview(series,slug){return RESEARCH_PREVIEWS.find(x=>x.series===series&&x.slug===slug)||null;}
