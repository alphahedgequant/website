// Original AHQ foundation examples for every listed model. Educational, hypothetical cases.
export const allModelFoundations = {
  "G1": {
    "term": "Momentum",
    "analogy": "A moving train may continue for a while, but it can brake abruptly.",
    "example": "A price rises from ₹100 to ₹112 in six months. Its backward-looking return is (112/100−1)×100 = 12%.",
    "steps": "Compare lookback windows, rank eligible assets, and account for volatility, costs and sudden reversals.",
    "limitation": "A positive past return is not a forecast."
  },
  "G2": {
    "term": "Hidden Markov models",
    "analogy": "You cannot see the weather system directly, but clouds and wind provide clues.",
    "example": "Suppose a fitted model assigns 70% probability to calm conditions and 30% to turbulent conditions; these are conditional estimates, not observed facts.",
    "steps": "Define states and observable features; estimate transition probabilities; examine how the probabilities change with each new observation.",
    "limitation": "Regimes are model labels and can be wrong or lag reality."
  },
  "G3": {
    "term": "Variance risk premium",
    "analogy": "Insurance sellers collect premiums but must pay in rare disasters.",
    "example": "IV 30% implies annualised variance 0.09; a future realised volatility of 20% would imply variance 0.04, giving a variance difference of 0.05.",
    "steps": "Separate implied variance from future realised variance; include realised hedge gains/losses, jumps, costs and margin.",
    "limitation": "Historical realised volatility is not the future outcome."
  },
  "G4": {
    "term": "Portfolio covariance and shrinkage",
    "analogy": "Mixing two ingredients changes the overall blend because their effects interact.",
    "example": "Two assets each have 20% volatility and equal weights. At zero correlation, portfolio volatility = √(0.25×0.04+0.25×0.04) = 14.14%.",
    "steps": "Calculate variances, correlation and the covariance term; then explain how shrinking noisy covariance estimates may improve stability.",
    "limitation": "Shrinkage improves estimation; it does not eliminate investment risk."
  },
  "G5": {
    "term": "Intraday relative volume",
    "analogy": "Compare a shop's visitors by noon with typical visitors by noon, not all day.",
    "example": "Current 10:30 AM volume 300,000, historical median at 10:30 AM 150,000. Relative volume = 2.0×.",
    "steps": "Align times across sessions, compute a robust median and identify unusual participation.",
    "limitation": "Higher volume alone does not determine price direction."
  },
  "S1": {
    "term": "Pairs cointegration",
    "analogy": "Two walkers may wander separately while a leash tends to bring them back together—unless it breaks.",
    "example": "A fitted spread is ₹12 and historical spread mean ₹2 with standard deviation ₹5. z = (12−2)/5 = +2.",
    "steps": "Estimate hedge ratio, test spread stationarity, define entry/exit rules and include transaction costs.",
    "limitation": "Correlation alone is not cointegration."
  },
  "S2": {
    "term": "Johansen baskets",
    "analogy": "Several instruments can play different notes but maintain a stable chord.",
    "example": "A hypothetical basket is A−0.5B−0.5C; if A=₹150, B=₹120, C=₹160, its spread = ₹10.",
    "steps": "Choose related assets, estimate cointegration rank and vectors, then test out-of-sample stability.",
    "limitation": "A mathematically stationary combination can break economically."
  },
  "S3": {
    "term": "PCA statistical arbitrage",
    "analogy": "Separate a choir's shared melody from one singer's deviation.",
    "example": "A stock returns +3% while its factor-model contribution is +1%; the one-period residual is +2 percentage points.",
    "steps": "Estimate common factors without future data, compute residual histories and test whether deviations reverse.",
    "limitation": "A one-day positive residual is not necessarily an arbitrage opportunity."
  },
  "S4": {
    "term": "Kalman hedge ratios",
    "analogy": "A seesaw balanced yesterday may need adjustment as one side's weight changes.",
    "example": "Old β=1.50 and B=₹102 implies predicted A=₹153; actual A=₹157 gives +₹4 innovation. A hypothetical updated β=1.52 predicts ₹155.04.",
    "steps": "Understand hedge ratios, observation error, state uncertainty and sequential updates; validate on unseen observations.",
    "limitation": "A changing beta is not proof of a profitable pair trade."
  },
  "S5": {
    "term": "Ornstein–Uhlenbeck mean reversion",
    "analogy": "A stretched spring may return toward its resting point, unless the spring changes.",
    "example": "For dx/dt≈κ(μ−x), let μ=100, x=110, κ=0.2 per day. Expected drift over one short day ≈−2 units, before random shocks.",
    "steps": "Distinguish mean level, reversion speed and random noise; fit half-life and compare observed reversions.",
    "limitation": "Real prices are not guaranteed to behave like springs."
  },
  "S6": {
    "term": "Multi-pair scanning",
    "analogy": "A fishing net finds candidates, but every catch still requires inspection.",
    "example": "Screen 100 possible stock pairs; suppose 8 pass an in-sample threshold and only 3 survive holdout testing.",
    "steps": "Control multiple-testing bias, rank liquidity, verify economics and include realistic costs and borrowing.",
    "limitation": "Scanning more pairs increases the chance of spurious findings."
  },
  "V1": {
    "term": "ARCH volatility",
    "analogy": "Yesterday's large surprise can signal tomorrow may be more turbulent.",
    "example": "A toy ARCH(1) has variance ω+αε²; if ω=0.0001, α=0.4, and yesterday's return shock ε=0.02, variance = 0.00026, daily vol ≈1.61%.",
    "steps": "Explain return shocks, conditional variance and model fitting; convert variance to volatility.",
    "limitation": "This is a forecast conditional on a fitted statistical model."
  },
  "V2": {
    "term": "GARCH volatility",
    "analogy": "Today's turbulence depends on both yesterday's shock and yesterday's risk estimate.",
    "example": "Toy GARCH: ω=0.00001, α=0.10, β=0.85, ε²=0.0004, prior variance=0.0003. New variance=0.000305; vol≈1.75%.",
    "steps": "Walk through shock term, persistence term and positivity/stationarity constraints.",
    "limitation": "Volatility models can underestimate sudden regime changes."
  },
  "V3": {
    "term": "EGARCH volatility",
    "analogy": "A bad-news shock may shake markets more than equally large good news.",
    "example": "Suppose a fitted asymmetric model forecasts 2.5% daily volatility after a negative shock and 2.0% after equal positive shock.",
    "steps": "Explain log variance, standardized shocks, asymmetric response and parameter estimation.",
    "limitation": "The numerical difference is hypothetical and requires fitted coefficients."
  },
  "V4": {
    "term": "GJR-GARCH volatility",
    "analogy": "The same-sized fall may increase fear more than a rise.",
    "example": "Toy daily conditional variance adds γ×shock² only for negative shocks; if γ=0.2 and shock=−2%, the extra variance is 0.2×0.0004=0.00008.",
    "steps": "Compare positive and negative shocks in the threshold variance recursion.",
    "limitation": "Asymmetry is estimated from data, not guaranteed for every asset."
  },
  "V5": {
    "term": "EWMA volatility",
    "analogy": "A moving average reacts to recent surprises while remembering earlier conditions.",
    "example": "λ=0.94, prior variance=0.0004, latest shock=3%. Updated variance=0.94×0.0004+0.06×0.0009=0.00043; vol≈2.07%.",
    "steps": "Define squared return, smoothing weight and the difference between variance and standard deviation.",
    "limitation": "EWMA cannot predict structural breaks or fat tails."
  },
  "R1": {
    "term": "Historical Value at Risk",
    "analogy": "Sort bad historical days and locate a loss threshold.",
    "example": "For 100 simulated loss outcomes, a 95% VaR near the fifth-worst outcome is ₹24,000 under a chosen ranking convention.",
    "steps": "Define horizon, confidence and sample; rank loss scenarios and explain tail losses.",
    "limitation": "VaR is not the maximum loss."
  },
  "R2": {
    "term": "Parametric Value at Risk",
    "analogy": "Use a bell-curve assumption to turn ordinary fluctuations into a tail threshold.",
    "example": "₹1,00,000 portfolio, daily volatility 2%, standard-normal one-sided 95% z=1.645. VaR≈₹3,290.",
    "steps": "Define standard deviation, quantile, assumptions and potential heavy-tail failures.",
    "limitation": "VaR is a modeled quantile, not an insurance policy."
  },
  "R3": {
    "term": "Monte Carlo Value at Risk",
    "analogy": "Run many hypothetical future paths like repeated practice drills.",
    "example": "If 10,000 modeled next-day portfolio losses have 95th-percentile loss ₹18,000, modeled 95% VaR is ₹18,000.",
    "steps": "Choose stochastic processes, correlations, path count and revaluation; check convergence.",
    "limitation": "Computer-generated scenarios cannot repair poor assumptions."
  },
  "R4": {
    "term": "Expected Shortfall",
    "analogy": "Instead of asking where extreme losses begin, ask how severe they tend to be.",
    "example": "If the worst five out of 100 losses are ₹20k, ₹25k, ₹30k, ₹40k, ₹60k, the illustrative average of this tail is ₹35k.",
    "steps": "Identify tail scenarios beyond a threshold and calculate their mean loss.",
    "limitation": "Small tail samples create very uncertain ES estimates."
  },
  "R5": {
    "term": "Stress testing",
    "analogy": "Test a bridge against a storm rather than an average day.",
    "example": "A ₹10 lakh equity book falls 20% under a hypothetical crash. Before hedges and costs, loss is ₹2 lakh.",
    "steps": "Specify shocks, correlations, liquidity effects, nonlinear options risk and recovery actions.",
    "limitation": "Scenarios are assumptions; actual crises can be worse or different."
  },
  "R6": {
    "term": "VaR backtesting",
    "analogy": "Check how often the safety line was crossed in past predictions.",
    "example": "A one-day 99% VaR model expects roughly 2.5 breaches over 250 trading days. Observing 15 breaches is a warning.",
    "steps": "Define an exception, compare observed counts to coverage targets and discuss independence.",
    "limitation": "Passing one statistical test does not prove the model safe."
  },
  "R9": {
    "term": "Drawdown and recovery",
    "analogy": "A loss changes the base from which you recover.",
    "example": "₹100 falls to ₹75: drawdown −25%. To return from ₹75 to ₹100 requires 25/75=33.33% recovery.",
    "steps": "Track rolling equity highs, troughs, duration and recovery asymmetry.",
    "limitation": "Historical maximum drawdown is not a future loss cap."
  },
  "B1": {
    "term": "Capital adequacy",
    "analogy": "A bank needs a cushion to absorb losses.",
    "example": "Eligible regulatory capital ₹120 crore and risk-weighted assets ₹1,000 crore ⇒ capital adequacy ratio =12%.",
    "steps": "Distinguish regulatory capital from deposits and risk-weighted assets from gross assets.",
    "limitation": "Regulatory minimums and definitions depend on jurisdiction and date."
  },
  "B2": {
    "term": "Liquidity coverage ratio",
    "analogy": "A bank keeps enough quickly usable cash-like assets for a short emergency.",
    "example": "High-quality liquid assets ₹150 crore divided by 30-day net cash outflows ₹100 crore =150% LCR.",
    "steps": "Explain stress outflows, inflows, eligible liquid assets and haircuts.",
    "limitation": "The LCR does not remove all funding or market liquidity risk."
  },
  "B3": {
    "term": "Net stable funding ratio",
    "analogy": "Long-lived loans should not rely entirely on money that may disappear tomorrow.",
    "example": "Available stable funding ₹110 crore / required stable funding ₹100 crore =110% NSFR.",
    "steps": "Distinguish funding reliability and asset liquidity over a one-year horizon.",
    "limitation": "A healthy NSFR does not guarantee solvency."
  },
  "B4": {
    "term": "SLR and CRR",
    "analogy": "A banking system requires some resources in prescribed reserve forms.",
    "example": "Illustrative 4% CRR on ₹1,000 crore eligible liabilities implies ₹40 crore required cash reserve.",
    "steps": "Define eligible liabilities, cash reserve, statutory liquidity holdings and prevailing RBI rules.",
    "limitation": "Actual prescribed percentages may change; use current RBI notifications."
  },
  "B5": {
    "term": "Leverage ratio",
    "analogy": "Even assets considered low-risk can become dangerous when a bank is excessively leveraged.",
    "example": "Tier 1 capital ₹50 crore / exposure measure ₹1,000 crore =5% leverage ratio.",
    "steps": "Compare unweighted leverage with risk-weighted capital ratios.",
    "limitation": "Regulatory exposure measures include adjustments and off-balance-sheet items."
  },
  "B6": {
    "term": "PD, LGD and EAD",
    "analogy": "Credit risk combines chance of failure, severity and outstanding exposure.",
    "example": "PD 3%, LGD 45%, EAD ₹1,00,000 ⇒ expected loss = 0.03×0.45×100,000 = ₹1,350.",
    "steps": "Define each input, default horizon, recovery and portfolio segmentation.",
    "limitation": "Expected loss is not a prediction that exactly ₹1,350 will be lost."
  },
  "M1": {
    "term": "Tree ensembles",
    "analogy": "Ask many imperfect decision trees and combine their answers.",
    "example": "Three toy trees estimate outcomes +2%, −1%, +1%; their simple average is +0.67%, though actual forests use many trees and boosting operates differently.",
    "steps": "Separate random forests from gradient boosting, validate walk-forward and avoid leakage.",
    "limitation": "An average of guesses does not make a reliable forecast."
  },
  "M2": {
    "term": "Logistic regression",
    "analogy": "Use a scorecard to estimate a probability, not certainty.",
    "example": "A toy score z=0 gives probability 1/(1+e^0)=50%; score z≈1.10 gives ≈75%.",
    "steps": "Explain features, weights, log-odds, calibration and decision thresholds.",
    "limitation": "Poorly calibrated probabilities can mislead risk decisions."
  },
  "M3": {
    "term": "Sequence neural networks",
    "analogy": "Read a story in order instead of treating words as an unordered bag.",
    "example": "Using 20 past observations to predict the 21st gives a 20-step input sequence; predicting from data after step 21 would leak the answer.",
    "steps": "Contrast recurrent memory with attention, discuss overfitting, training splits and computation.",
    "limitation": "Complexity is not evidence of predictive edge."
  },
  "M4": {
    "term": "Clustering",
    "analogy": "Group people by similar habits without first assigning labels.",
    "example": "Four stocks with volatility values 10%,12%,30%,32% might form two toy clusters around 11% and 31%.",
    "steps": "Explain distance, scaling, number of clusters and the difference between hard and probabilistic groups.",
    "limitation": "Clusters are descriptions, not inherently buy/sell signals."
  },
  "M5": {
    "term": "Reinforcement learning",
    "analogy": "A trainee learns actions from feedback, but can exploit a badly designed scoring rule.",
    "example": "Toy reward = trading P&L ₹100 − transaction costs ₹30 − risk penalty ₹20 = ₹50.",
    "steps": "Define state, action, reward, policy, exploration and evaluation under realistic execution.",
    "limitation": "Reward hacking and market regime changes can make simulated policies fail."
  },
  "O1": {
    "term": "IV versus realised volatility",
    "analogy": "Compare the insurance premium with observed storms, remembering future storms may differ.",
    "example": "IV 30% versus historical RV 20% is a 10 percentage-point volatility difference, not 10% strategy profit.",
    "steps": "Match time horizons and compare pricing uncertainty with estimated future outcomes.",
    "limitation": "High IV alone does not establish an option-selling edge."
  },
  "O2": {
    "term": "Gamma exposure and gamma flip",
    "analogy": "Hedges require steering adjustments when the underlying price changes.",
    "example": "Delta 0.50 with gamma 0.02 per ₹1 move becomes approximately 0.52 after a ₹1 rise, all else equal.",
    "steps": "Aggregate with strikes, lot sizes, signed positions and scenario spot values.",
    "limitation": "Dealer position signs are not disclosed by OI alone."
  },
  "O3": {
    "term": "Volatility skew",
    "analogy": "Insurance against a crash can cost more than insurance against a rally.",
    "example": "25-delta put IV 28% and call IV 22% at same expiry gives call-minus-put risk reversal = −6 volatility points.",
    "steps": "Explain delta matching, downside demand, skew and expiration choices.",
    "limitation": "Skew cannot be converted directly into a crash probability."
  },
  "O4": {
    "term": "Delta-neutral straddles",
    "analogy": "Standing balanced at one instant does not prevent falling after a shove.",
    "example": "A straddle initially has near-zero net delta, but a sudden spot move changes delta because gamma is nonzero.",
    "steps": "Introduce calls, puts, premium, delta, gamma, theta, vega and rehedging costs.",
    "limitation": "Delta neutral does not mean risk free."
  }
};
