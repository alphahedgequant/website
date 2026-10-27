// Original AHQ lessons. Examples are hypothetical and not copied from exam textbooks.
export const modelLessons = {
 O1:{
  level:"Beginner → Intermediate",prerequisites:"Percentages, annualised volatility and the difference between past and future.",
  objective:"Explain IV, realised volatility, option premium and why the spread is not automatic profit.",
  glossary:[["Implied volatility (IV)","The volatility input that makes a pricing model match the traded option price."],["Realised volatility","The statistical variation of observed underlying returns over a specified lookback."],["Annualisation","Expressing volatility on a yearly scale; compare measures with consistent conventions."],["Vega","Approximate option-price sensitivity to a change in implied volatility."]],
  steps:[
   {title:"Start with the question",body:"An investor considers selling an option because its implied volatility is high. Before deciding whether it is expensive, they need a comparable estimate of how much the underlying might actually move over the option's remaining life."},
   {title:"Choose comparable measures",body:"Suppose a 30-day option has implied volatility of 30% annualised. Historical returns over a comparable window exhibit 20% annualised realised volatility. The difference is 10 percentage points—not 10% return."},
   {title:"Calculate the variance spread",body:"Annualised IV variance is 0.30² = 0.09. Annualised historical variance is 0.20² = 0.04. Their difference is 0.05, or five percentage points of annual variance. This mixes forward-looking option pricing and backward-looking realised history."},
   {title:"Ask what happens next",body:"If realised volatility over the next month jumps to 45%, short options could suffer losses despite the historical 20% observation. Entry premium, Greeks, hedging frequency, jumps and costs determine trade P&L."}
  ],
  worked:"IV = 30%; historical RV = 20%; IV−RV = +10 percentage points. No investment profit is calculated from these figures.",
  misconception:"High IV relative to historical RV does not prove that options are overpriced or safe to sell.",
  check:{question:"If IV is 30% and historical RV is 20%, what is the difference?",choices:["10% guaranteed profit","10 percentage points of volatility","50% probability of loss"],correct:1,why:"The subtraction compares two volatility percentages; it does not measure a return or a future probability."}
 },
 R1:{
  level:"Beginner → Intermediate",prerequisites:"Probability, losses and percentiles.",
  objective:"Calculate historical Value-at-Risk using a sample of losses and understand its limitation.",
  glossary:[["Loss distribution","A list or distribution of portfolio losses across observations or scenarios."],["Confidence level","The fraction of observations expected to be no worse than the VaR threshold under the model."],["Tail","The most adverse observations beyond a chosen threshold."]],
  steps:[
   {title:"What risk question are we asking?",body:"A ₹10 lakh portfolio manager asks: what loss level has historically been exceeded on about 5% of days? That is a 95% one-day VaR question, not the worst possible loss."},
   {title:"Construct historical hypothetical P&L",body:"Revalue today's holdings using a historical set of market moves. Suppose 100 equally weighted historical day scenarios produce 100 simulated daily losses or gains."},
   {title:"Sort worst losses first",body:"Suppose the 95th percentile loss in the set is ₹24,000. Historical one-day 95% VaR is ₹24,000 under this sample and percentile convention."},
   {title:"Interpret correctly",body:"About five out of 100 historical scenarios exceed that loss threshold. They might lose ₹25,000 or ₹2 lakh; VaR alone does not say how severe the beyond-threshold losses are."}
  ],
  worked:"₹10,00,000 portfolio, 100 historical scenarios, 95th-percentile loss ₹24,000 ⇒ one-day historical 95% VaR ₹24,000. Figures are invented for teaching.",
  misconception:"95% VaR is not a maximum loss, nor a 95% guarantee about tomorrow.",
  check:{question:"What does a one-day 95% VaR of ₹24,000 mean?",choices:["The portfolio cannot lose more than ₹24,000","Under the model, roughly 5% of cases exceed ₹24,000 loss","The portfolio will earn ₹24,000"],correct:1,why:"VaR marks a loss quantile. It does not cap the tail of the loss distribution."}
 },
 O2:{
  level:"Intermediate",prerequisites:"Options delta, gamma, open interest and basic option hedging.",
  objective:"Describe gamma, aggregate exposure assumptions and what a gamma-flip estimate can and cannot tell you.",
  glossary:[["Delta","Approximate option-price change per unit underlying move."],["Gamma","Rate at which delta changes as the underlying moves."],["Open interest","Count of outstanding contracts, without disclosing which dealer owns what side."],["Gamma flip","A modeled spot level where assumed aggregate gamma exposure changes sign."]],
  steps:[
   {title:"Start with a single option",body:"Suppose an option delta is +0.50 and gamma is 0.02 per ₹1 move. For a small ₹1 rise in the underlying, a first-order delta estimate becomes about +0.52, holding other inputs constant."},
   {title:"Scale to positions",body:"To aggregate across strikes and expiries, calculate gamma sensitivity per contract and multiply by contract size, estimated signed position and an agreed scaling convention."},
   {title:"Understand the critical unknown",body:"Open interest gives total outstanding contracts, not whether a dealer is net long or short. Public-chain GEX normally requires assumptions about dealer inventory and positioning."},
   {title:"Calculate across potential spot prices",body:"Recompute each option's gamma under a range of hypothetical underlying prices. An aggregate zero crossing may be described as a model gamma flip, but it is sensitive to positioning and volatility assumptions."}
  ],
  worked:"Single-contract thought experiment: delta +0.50, gamma +0.02/₹. Approximate delta after a ₹1 rise = +0.52. No actual exchange or dealer positions are implied.",
  misconception:"An estimated gamma flip is not a guaranteed support/resistance level, and OI does not identify dealer trade direction.",
  check:{question:"What essential dealer-position detail is missing from public open interest?",choices:["The number of contracts","The signed ownership and hedging exposure","The strike price"],correct:1,why:"Open interest counts contracts but does not disclose the dealer's net signed position."}
 },
 G4:{
  level:"Intermediate",prerequisites:"Portfolio weights, volatility and correlation.",
  objective:"Explain why correlation matters and why shrinkage may stabilize estimated portfolio risk.",
  glossary:[["Correlation","Standardised co-movement between two asset returns, from −1 to +1."],["Covariance matrix","Array containing the variances and pairwise covariances of assets."],["Shrinkage","Combining a noisy sample estimate with a structured target estimate."]],
  steps:[
   {title:"Portfolio basics",body:"A portfolio's volatility depends on both the risk of its individual assets and their co-movements. Putting two risky assets together can reduce or amplify total risk."},
   {title:"Compute a two-asset case",body:"Take equal 50% weights, 20% annual volatility for each asset and correlation zero. Portfolio variance is 0.5²×0.2² + 0.5²×0.2² = 0.02; volatility is √0.02 = 14.14%."},
   {title:"Explore correlation",body:"If correlation becomes +1, the same equally weighted portfolio has 20% volatility. Lower co-movement helped diversification in the earlier example."},
   {title:"Why Ledoit-Wolf?",body:"When many assets have limited histories, estimated pairwise covariances are noisy. Ledoit-Wolf mixes the noisy estimate with a structured target to produce a more stable covariance estimate."}
  ],
  worked:"Two 20%-volatility assets at equal weights and zero correlation: portfolio volatility ≈ 14.14%, versus 20% at correlation +1.",
  misconception:"Diversification does not eliminate risk, and an optimizer cannot make unreliable expected-return forecasts precise.",
  check:{question:"Two 20%-volatility assets with 50/50 weights and correlation zero have volatility closest to:",choices:["40%","14.1%","0%"],correct:1,why:"Portfolio variance sums weighted individual variances and covariance; √0.02 ≈ 14.14%."}
 },
 G5:{
  level:"Beginner",prerequisites:"Volume, median and ratios.",
  objective:"Compare intraday volume with the correct time-of-day reference.",
  glossary:[["Cumulative volume","Total shares traded since the session opened up to a time."],["Median","Middle historical observation, resistant to extreme outliers."],["RVOL","Current cumulative volume divided by normal cumulative volume at the same session time."]],
  steps:[
   {title:"Why daily comparisons mislead",body:"At 10:30 AM, today's trading day is incomplete. Comparing volume so far against a typical FULL day's volume systematically understates relative activity."},
   {title:"Build the baseline",body:"Take the last 15 comparable trading days. For each, record cumulative volume at 10:30 AM and find its median."},
   {title:"Calculate the ratio",body:"Suppose current volume at 10:30 AM is 3 lakh shares and historical 10:30 AM median is 1.5 lakh shares. RVOL = 3/1.5 = 2.0."},
   {title:"Interpret carefully",body:"2× RVOL means twice the normal participation for that point in the session. It says nothing about whether buyers or sellers will dominate subsequent price moves."}
  ],
  worked:"Today's 10:30 AM cumulative volume = 300,000 shares; historical time-matched median = 150,000 ⇒ RVOL = 2.0×.",
  misconception:"High volume is not necessarily bullish; direction and quality of price moves require separate investigation.",
  check:{question:"Why compare volume at the same time of day?",choices:["Because the current trading session is incomplete","Because prices never change after noon","Because it guarantees direction"],correct:0,why:"Time matching adjusts for the characteristic intraday volume curve."}
 }
};
