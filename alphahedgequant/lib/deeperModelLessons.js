// Original AHQ supplementary explanations: conceptual intuition, worked reasoning, interpretation.
export const deeperLessons={
 O1:{
  intuition:"An option is a contract whose price depends partly on uncertainty. Implied volatility is found by reversing a pricing model: take the market option price and solve for the volatility input. Historical realised volatility instead calculates variation from observed underlying returns. The two quantities look similar but answer different questions.",
  reasoning:[
   ["What does annualised 30% IV mean?","It is an annualised standard-deviation input, not a 30% forecasted return or a guaranteed trading range. Under a simplified square-root-of-time scaling, a 30-day one-standard-deviation move is roughly 30% × √(30/365) ≈ 8.6% of spot. Returns need not be normally distributed."],
   ["Why not sell when IV is higher than historical RV?","The comparison is between future-priced risk and a backward-looking sample. Earnings, jumps, expiry and skew can explain the premium. Selling exposes the trader to convex losses, margin needs and transaction costs."],
   ["What would a real comparison need?","Compare same underlying, matching horizons and annualisation; account for expected events, option liquidity, IV smile, realised-vol forecast and downside stress scenarios."]
  ],
  takeaway:"IV minus historical RV is a useful descriptive statistic, not a predicted option-strategy return."
 },
 R1:{
  intuition:"VaR is a quantile of a loss distribution. It selects a threshold so that losses worse than that threshold occur with a chosen frequency under the historical sample or model. It does not describe how enormous the worst outcomes can be.",
  reasoning:[
   ["Build scenarios","Imagine today you hold ₹10 lakh of assets. Reprice today's positions using each of 100 historical daily market moves. This gives 100 hypothetical daily profit/loss values under the assumption that today's positions experienced those historical moves."],
   ["Find the tail threshold","Sort losses from smallest to largest. The 95th percentile is near the fifth-worst scenario among 100 observations; exact ranking depends on the quantile convention. Suppose that loss is ₹24,000."],
   ["Translate the confidence level","A one-day 95% VaR of ₹24,000 means around 5% of the chosen modeled days are beyond that loss level. A loss of ₹80,000 remains possible. Expected Shortfall asks how large losses are on average beyond the VaR threshold."],
   ["Know the limits","Changing portfolio holdings, missing crisis periods, stale prices, liquidity costs and returns changing over time can make historical VaR underestimate future losses."]
  ],
  takeaway:"Always report VaR with portfolio, holding period, confidence level, methodology and data window."
 },
 O2:{
  intuition:"Delta measures how much the price of an option responds to a small underlying move. Gamma measures how quickly that delta changes. Dealers who hedge options may need to rebalance their underlying holdings, but public open-interest figures do not identify their net positions.",
  reasoning:[
   ["Calculate a delta change","Assume delta = +0.50 and gamma = +0.02 per ₹1. For a small ₹1 rise in the underlying, approximate new delta = 0.50 + 0.02 × 1 = 0.52. For larger moves gamma itself changes, so this linear update is less reliable."],
   ["Why contracts and ownership matter","Aggregate exposure requires gamma per contract, contract multiplier, number of contracts and whether each position is long or short. Two portfolios with the same open interest can produce opposite signed exposure."],
   ["What is a gamma-flip chart?","The model recalculates estimated aggregate signed gamma for several hypothetical spot prices. The spot where it changes sign is called a flip level. A different dealer-position assumption can move or eliminate that level."],
   ["What it cannot predict","The model cannot confirm support/resistance, guarantee dealer hedging flows or isolate changes from implied volatility, expiry, intraday position changes and futures hedging."]
  ],
  takeaway:"Treat gamma flip as an assumption-sensitive scenario map, never an exchange-observed level."
 },
 G4:{
  intuition:"Risk does not simply add across holdings. Two assets may move together, independently or in opposite directions. Their correlation changes portfolio risk. Ledoit–Wolf addresses uncertainty in the estimated covariance matrix; it cannot forecast returns on its own.",
  reasoning:[
   ["State the portfolio","Invest 50% in Asset A and 50% in Asset B. Both have 20% annualised volatility. First assume their correlation is zero."],
   ["Calculate each variance term","(0.5² × 0.2²) + (0.5² × 0.2²) = 0.01 + 0.01 = 0.02. Cross-covariance is zero because correlation is zero."],
   ["Translate variance to volatility","Portfolio standard deviation = √0.02 ≈ 14.14%, lower than either asset's 20% volatility because they do not move perfectly together."],
   ["Compare +1 correlation","Now the cross term is 2×0.5×0.5×0.2×0.2×1 = 0.02. Total variance = 0.04 and volatility = 20%: no diversification benefit in this symmetric example."],
   ["Explain shrinkage","With hundreds of stocks, historical correlations are estimated with noise. Shrinkage combines the sample covariance with a stable target, reducing overreaction to sampling error. It is a statistical estimator, not a trading recommendation."]
  ],
  takeaway:"Correlation, weights and covariance estimates determine measured portfolio risk; a small sample creates estimation uncertainty."
 },
 G5:{
  intuition:"Trading volume changes naturally throughout the day. Volume tends to be different near opening, lunchtime and closing. Time-adjusted relative volume asks whether today's trading activity is unusual at the same time of the session.",
  reasoning:[
   ["Why a full-day average is unfair","At 10:30 AM only part of today's session has passed. Comparing that partial total with yesterday's full-day total mismatches the time windows."],
   ["Build a like-for-like history","Collect cumulative volume at exactly 10:30 AM for the previous 15 comparable trading sessions. Sort these values and choose the median, which is less sensitive to a one-off extraordinary day than a mean."],
   ["Compute RVOL","Suppose today's 10:30 AM cumulative volume is 300,000 shares and the historical 10:30 AM median is 150,000. Divide 300,000 by 150,000 = 2.0× RVOL."],
   ["Interpret with price and liquidity","2× RVOL signals unusually active participation, not buying pressure by itself. A high-volume falling stock and a high-volume rising stock have the same RVOL if volume matches."],
   ["Check comparability","Adjust or flag corporate actions, market holidays, special sessions, data outages and material news that may distort the reference distribution."]
  ],
  takeaway:"RVOL describes relative participation; it does not predict the next price move."
 }
};
