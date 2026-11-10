// 60 additional original beginner-friendly Learn chapters for modules 1–3. All examples are educational, not real market quotes.
export const MORE_TOPICS_1=[
  {
    "id": "quant-topic-1-11",
    "module": 0,
    "index": 11,
    "title": "Simple return series",
    "concept": "Returns measure percentage changes so differently priced assets can be compared. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "₹100 to ₹103 and ₹1,000 to ₹1,030 both mean a 3% gain.",
    "caution": "Check that all observations cover the same holding period.",
    "connection": "Put simple return series alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-12",
    "module": 0,
    "index": 12,
    "title": "Arithmetic versus geometric averages",
    "concept": "The ordinary average of returns differs from the rate that actually compounds your money. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A 20% rise followed by a 20% fall turns ₹100 into ₹96.",
    "caution": "Do not call the arithmetic average your realized investment growth.",
    "connection": "Put arithmetic versus geometric averages alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-13",
    "module": 0,
    "index": 13,
    "title": "Vectors and asset weights",
    "concept": "A vector is an ordered list used to hold portfolio weights and asset returns. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Weights of 60% and 40% applied to 10% and 0% returns give 6%.",
    "caution": "Changing the order of the assets can silently change a calculation.",
    "connection": "Put vectors and asset weights alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-14",
    "module": 0,
    "index": 14,
    "title": "Covariance matrices",
    "concept": "A matrix can show how every pair of investments tends to move together. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Two airline stocks may share more risk than an airline and a utility.",
    "caution": "Past co-movement can break down when the economy changes.",
    "connection": "Put covariance matrices alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-15",
    "module": 0,
    "index": 15,
    "title": "Permutations and combinations",
    "concept": "Counting methods tell us how many arrangements or groups are possible. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Choosing two of four stocks gives six distinct unordered pairs.",
    "caution": "The number of portfolios does not tell you which will perform best.",
    "connection": "Put permutations and combinations alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-16",
    "module": 0,
    "index": 16,
    "title": "Bayesian probability updates",
    "concept": "Bayes' idea changes a prior probability when new evidence appears. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A warning that fires for many healthy companies may create false alarms.",
    "caution": "A poor prior or unreliable signal makes the new estimate unreliable.",
    "connection": "Put bayesian probability updates alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-17",
    "module": 0,
    "index": 17,
    "title": "Discrete and continuous variables",
    "concept": "Some outcomes are counted, while others are measured on a continuous scale. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Trades in a minute come in whole numbers; modeled volatility can be 12.35%.",
    "caution": "Market prices are often constrained to ticks despite continuous models.",
    "connection": "Put discrete and continuous variables alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-18",
    "module": 0,
    "index": 18,
    "title": "Normal curves and fat tails",
    "concept": "A bell-shaped model is convenient, but financial returns can contain more crashes than it expects. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A model fitted to quiet days may assign extremely low chances to market gaps.",
    "caution": "Never equate a fitted normal curve with guaranteed loss limits.",
    "connection": "Put normal curves and fat tails alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-19",
    "module": 0,
    "index": 19,
    "title": "Confidence intervals",
    "concept": "An interval reflects uncertainty around a statistical estimate under a chosen method. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "An estimated mean return of 0.1% can still be consistent with zero after uncertainty.",
    "caution": "Repeated observations and changing regimes can make simple intervals misleading.",
    "connection": "Put confidence intervals alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-20",
    "module": 0,
    "index": 20,
    "title": "Bootstrap resampling",
    "concept": "Resampling past observations helps show how uncertain a statistic might be. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Recalculate average returns on many resampled blocks of historical weeks.",
    "caution": "Randomly scrambling days destroys time dependence in market series.",
    "connection": "Put bootstrap resampling alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-21",
    "module": 0,
    "index": 21,
    "title": "Autocorrelation",
    "concept": "Autocorrelation compares a variable with its earlier values at a specified lag. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Large absolute returns sometimes follow large absolute returns even when directions look random.",
    "caution": "A visible pattern may disappear after fees or in another period.",
    "connection": "Put autocorrelation alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-22",
    "module": 0,
    "index": 22,
    "title": "Stationarity and regimes",
    "concept": "Stationarity assumes certain features of a process stay stable through time. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A spread centered near ₹2 may shift permanently after regulation changes.",
    "caution": "A stationary historical sample does not prove the future is stationary.",
    "connection": "Put stationarity and regimes alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-23",
    "module": 0,
    "index": 23,
    "title": "Law of large numbers",
    "concept": "With suitable assumptions, a sample average becomes more stable as observations accumulate. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A fair coin may show seven heads in ten tosses but tends toward half over many tosses.",
    "caution": "More samples cannot fix biased collection or invalid independence assumptions.",
    "connection": "Put law of large numbers alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-24",
    "module": 0,
    "index": 24,
    "title": "Central limit theorem",
    "concept": "Under conditions, averages can behave more normally than individual observations. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Many independent small errors can make an average stable.",
    "caution": "Heavy tails, dependence and regime changes weaken simple approximations.",
    "connection": "Put central limit theorem alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-25",
    "module": 0,
    "index": 25,
    "title": "Drift and random walks",
    "concept": "A random walk combines uncertain steps with an optional assumed direction. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "From 100, a step of +2 and then −3 leaves 99.",
    "caution": "A simulated drift is not evidence of a predictable real market trend.",
    "connection": "Put drift and random walks alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-26",
    "module": 0,
    "index": 26,
    "title": "Markov states",
    "concept": "A Markov model makes the next modeled state depend on today's state. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A calm market state might have an 80% modeled chance of remaining calm.",
    "caution": "Real events can depend on longer history and hidden information.",
    "connection": "Put markov states alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-27",
    "module": 0,
    "index": 27,
    "title": "Brownian bridges",
    "concept": "A Brownian bridge models uncertain paths when the end point is fixed for the exercise. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Draw several possible intraday paths connecting two already-known closing prices.",
    "caution": "Knowing the ending price in a real trading simulation creates look-ahead bias.",
    "connection": "Put brownian bridges alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-28",
    "module": 0,
    "index": 28,
    "title": "Floating-point rounding",
    "concept": "Computers approximate many decimal values, so small numerical errors can accumulate. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "The internal binary value for 0.1 + 0.2 may not equal exactly 0.3.",
    "caution": "Round carefully and use tolerances for model checks, not hidden mistakes.",
    "connection": "Put floating-point rounding alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-29",
    "module": 0,
    "index": 29,
    "title": "Calibration and unseen testing",
    "concept": "Calibration fits parameters to existing observations; validation tests them elsewhere. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A model fitted to October quotes needs a separate period to assess reliability.",
    "caution": "Perfect in-sample fit can be overfitting rather than genuine insight.",
    "connection": "Put calibration and unseen testing alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-1-30",
    "module": 0,
    "index": 30,
    "title": "Units and dimensional checks",
    "concept": "Keeping units attached is a simple way to catch errors in mathematics. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "₹ per share multiplied by shares gives rupees, not a percentage.",
    "caution": "Annual rates and daily returns must use consistent time conventions.",
    "connection": "Put units and dimensional checks alongside the earlier building blocks of quant finance lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-11",
    "module": 1,
    "index": 11,
    "title": "Downside deviation",
    "concept": "Downside deviation measures movement below a target rather than every up and down move. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "For a zero target, −2% and −6% count as downside observations.",
    "caution": "The result depends on the chosen target and sample.",
    "connection": "Put downside deviation alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-12",
    "module": 1,
    "index": 12,
    "title": "Sortino ratio",
    "concept": "Sortino compares returns above a target with harmful downside variability. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "An 8% excess return divided by 16% downside deviation gives 0.5.",
    "caution": "A high ratio may still conceal an unobserved catastrophic loss.",
    "connection": "Put sortino ratio alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-13",
    "module": 1,
    "index": 13,
    "title": "Drawdown duration",
    "concept": "Drawdown duration measures how long a portfolio stays below its earlier peak. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "An account can recover a 20% drop only after two difficult years.",
    "caution": "Depth and duration are different risks that need separate checks.",
    "connection": "Put drawdown duration alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-14",
    "module": 1,
    "index": 14,
    "title": "Risk of ruin",
    "concept": "Risk of ruin asks whether repeated losses could exhaust usable trading capital. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Betting half an account on every trade makes a losing streak dangerous.",
    "caution": "Simplified ruin models often assume unrealistic independent bets.",
    "connection": "Put risk of ruin alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-15",
    "module": 1,
    "index": 15,
    "title": "Marginal risk contributions",
    "concept": "One holding's contribution depends on what else the portfolio owns. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Adding another bank stock to a bank-heavy portfolio may increase shared risk.",
    "caution": "Relationships estimated from history change in stressed markets.",
    "connection": "Put marginal risk contributions alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-16",
    "module": 1,
    "index": 16,
    "title": "Risk parity weights",
    "concept": "Risk parity tries to balance modeled risk contributions rather than cash amounts. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A calm bond can receive more capital than a volatile share in a simple model.",
    "caution": "This approach can use leverage and does not guarantee diversification.",
    "connection": "Put risk parity weights alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-17",
    "module": 1,
    "index": 17,
    "title": "Volatility targeting",
    "concept": "A strategy may reduce exposure when forecast volatility rises. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A portfolio targeting 10% risk may halve exposure if forecast risk doubles.",
    "caution": "Slow volatility estimates and rushed selling create new risks.",
    "connection": "Put volatility targeting alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-18",
    "module": 1,
    "index": 18,
    "title": "Factor exposures",
    "concept": "Factors are shared return drivers such as equity markets, rates and industry shocks. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Banks and property developers may both respond to interest-rate changes.",
    "caution": "Chosen factors may miss new risks or correlations.",
    "connection": "Put factor exposures alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-19",
    "module": 1,
    "index": 19,
    "title": "Performance attribution",
    "concept": "Attribution explains observed returns by factors, assets or investment decisions. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A 6% gain could be assigned 4% to market movement and 2% to selection.",
    "caution": "Explanations depend on the model and are not proof of causation.",
    "connection": "Put performance attribution alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-20",
    "module": 1,
    "index": 20,
    "title": "Covariance shrinkage",
    "concept": "Shrinkage softens unstable correlations by blending noisy estimates with a target. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A correlation of −1 estimated from a few days can be pulled toward a safer baseline.",
    "caution": "Too much shrinkage removes genuine portfolio differences.",
    "connection": "Put covariance shrinkage alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-21",
    "module": 1,
    "index": 21,
    "title": "Concentration risk limits",
    "concept": "Limits prevent one company or sector from dominating the portfolio. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A 60% single-stock holding losing half of its value cuts the portfolio by 30%.",
    "caution": "Different names may still share the same economic exposure.",
    "connection": "Put concentration risk limits alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-22",
    "module": 1,
    "index": 22,
    "title": "Liquidity-adjusted losses",
    "concept": "A position may be worth less when it must be sold urgently. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A holding marked at ₹100 might sell for ₹97 during a thin market.",
    "caution": "Displayed market depth can vanish before a large trade executes.",
    "connection": "Put liquidity-adjusted losses alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-23",
    "module": 1,
    "index": 23,
    "title": "Price gaps and stops",
    "concept": "A stop trigger may execute far beyond the intended level after a gap. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A share closing at ₹100 can reopen at ₹88 below a ₹95 stop.",
    "caution": "A stop order is not a guaranteed maximum-loss promise.",
    "connection": "Put price gaps and stops alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-24",
    "module": 1,
    "index": 24,
    "title": "Joint stress scenarios",
    "concept": "Scenarios shock several related prices at once to study a bad outcome. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A recession scenario may lower stocks and widen credit spreads together.",
    "caution": "A scenario is not a probability forecast unless evidence supports it.",
    "connection": "Put joint stress scenarios alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-25",
    "module": 1,
    "index": 25,
    "title": "Historical-simulation VaR",
    "concept": "This method replays historical moves on today's exposures to estimate losses. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "One hundred trading days provide one hundred scenario shocks.",
    "caution": "Past history can miss a larger future market shock.",
    "connection": "Put historical-simulation var alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-26",
    "module": 1,
    "index": 26,
    "title": "Monte Carlo risk paths",
    "concept": "Simulations generate many model outcomes to study uncertain paths. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Ten thousand hypothetical paths can estimate how often modeled capital falls below a limit.",
    "caution": "More simulations do not fix incorrect assumptions.",
    "connection": "Put monte carlo risk paths alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-27",
    "module": 1,
    "index": 27,
    "title": "Kelly position sizing",
    "concept": "Kelly links bet size to estimated win probabilities and payoffs. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "With even-money bets and 55% modeled win odds, full Kelly is 10%.",
    "caution": "Estimated probabilities are uncertain and full Kelly can be overly aggressive.",
    "connection": "Put kelly position sizing alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-28",
    "module": 1,
    "index": 28,
    "title": "Margin and forced selling",
    "concept": "Leveraged losses can trigger collateral demands and selling at bad prices. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A fund may liquidate valuable holdings because a broker calls for cash.",
    "caution": "Margin requirements can increase in the very stress event being modeled.",
    "connection": "Put margin and forced selling alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-29",
    "module": 1,
    "index": 29,
    "title": "VaR exception monitoring",
    "concept": "Risk-model exceptions occur when actual losses exceed predicted thresholds. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A 95% daily VaR should be exceeded about five times per hundred comparable days.",
    "caution": "Matching the exception count alone can hide clustered extreme losses.",
    "connection": "Put var exception monitoring alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-2-30",
    "module": 1,
    "index": 30,
    "title": "Risk-model drift",
    "concept": "Models should be monitored when behavior, data quality or markets change. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A strategy risk estimate trained before a market reform may become unreliable afterward.",
    "caution": "Do not automatically retrain before checking missing or mislabelled inputs.",
    "connection": "Put risk-model drift alongside the earlier quantitative risk & return lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-13",
    "module": 2,
    "index": 13,
    "title": "Dividends and total return",
    "concept": "Total shareholder return includes received dividends as well as price changes. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Buying at ₹100, receiving ₹3 and selling at ₹105 gives 8% before costs.",
    "caution": "Taxes and ex-dividend timing can alter an investor's net return.",
    "connection": "Put dividends and total return alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-14",
    "module": 2,
    "index": 14,
    "title": "Share splits and adjusted charts",
    "concept": "A stock split increases share count and changes price per share mechanically. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "One ₹200 share becomes two shares near ₹100 after a two-for-one split.",
    "caution": "Raw and adjusted price histories should not be mixed.",
    "connection": "Put share splits and adjusted charts alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-15",
    "module": 2,
    "index": 15,
    "title": "Working capital and cash",
    "concept": "Inventory and customer bills tie up cash while supplier credit can release it. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Inventory +₹20 and receivables +₹10, offset by payables +₹5, uses ₹25.",
    "caution": "Working-capital definitions must be consistent between companies.",
    "connection": "Put working capital and cash alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-16",
    "module": 2,
    "index": 16,
    "title": "Free cash flow to the firm",
    "concept": "FCFF estimates operating cash available to both lenders and shareholders after investment. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Operating profit after tax 100 plus depreciation 20 minus capex 35 and working capital 10 leaves 75.",
    "caution": "One-off spending and forecast reinvestment can distort normalized cash flow.",
    "connection": "Put free cash flow to the firm alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-17",
    "module": 2,
    "index": 17,
    "title": "Debt maturities",
    "concept": "When repayments are due matters as much as the total amount owed. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A firm owing ₹200 next month with ₹60 cash may require refinancing.",
    "caution": "Debt totals do not show covenant and collateral restrictions.",
    "connection": "Put debt maturities alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-18",
    "module": 2,
    "index": 18,
    "title": "Issuing shares and dilution",
    "concept": "More shares divide ownership among more investors unless new value offsets dilution. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A business worth ₹1,000 with 100 shares implies ₹10 per share before new issuance.",
    "caution": "A share issue also brings in cash and may fund profitable growth.",
    "connection": "Put issuing shares and dilution alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-19",
    "module": 2,
    "index": 19,
    "title": "Enterprise versus equity value",
    "concept": "Enterprise value measures business claims; equity value belongs to shareholders after debt and adjustments. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Enterprise value ₹500 minus net debt ₹120 leaves simplified equity value ₹380.",
    "caution": "Minority interests and non-operating assets can change the bridge.",
    "connection": "Put enterprise versus equity value alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-20",
    "module": 2,
    "index": 20,
    "title": "Valuation scenarios",
    "concept": "Using weak, normal and strong cases shows that business value is uncertain. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A stock might be estimated at ₹70, ₹100 or ₹140 across three reasonable scenarios.",
    "caution": "Scenario probabilities are judgments rather than facts about future prices.",
    "connection": "Put valuation scenarios alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-21",
    "module": 2,
    "index": 21,
    "title": "Choosing comparable companies",
    "concept": "Useful peers share economics, not just a sector label. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Two firms at 15 times earnings may differ because one needs far more capital.",
    "caution": "Accounting choices and growth assumptions make simple ratios deceptive.",
    "connection": "Put choosing comparable companies alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-22",
    "module": 2,
    "index": 22,
    "title": "Earnings quality",
    "concept": "Accounting profit and operating cash flow can differ for valid or concerning reasons. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "₹100 reported profit alongside ₹20 operating cash flow calls for investigation.",
    "caution": "One quarter is not enough to conclude earnings manipulation.",
    "connection": "Put earnings quality alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-23",
    "module": 2,
    "index": 23,
    "title": "Currency cross-rates",
    "concept": "Cross rates link two currencies through another quoted currency. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "EUR/USD 1.10 and USD/INR 84 imply EUR/INR around 92.4 before spreads.",
    "caution": "Quote direction and observation time must match.",
    "connection": "Put currency cross-rates alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-24",
    "module": 2,
    "index": 24,
    "title": "FX transaction spreads",
    "concept": "Currency prices have different immediate buy and sell quotes. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "USD/INR bid 84.10 and ask 84.14 has a ₹0.04 quoted spread.",
    "caution": "The midpoint may not be tradable at the requested size.",
    "connection": "Put fx transaction spreads alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-25",
    "module": 2,
    "index": 25,
    "title": "Forward points",
    "concept": "Forward points describe how a currency forward quote differs from today's spot quote. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Spot 84.00 and a three-month forward 84.60 give 0.60 forward points.",
    "caution": "Positive forward points do not guarantee profit to the hedge buyer.",
    "connection": "Put forward points alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-26",
    "module": 2,
    "index": 26,
    "title": "Covered interest parity",
    "concept": "A hedged interest-rate comparison helps explain FX forward pricing. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A country with a higher interest rate often has a forward discount in the corresponding currency.",
    "caution": "Funding constraints and cross-currency basis create real-world differences.",
    "connection": "Put covered interest parity alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-27",
    "module": 2,
    "index": 27,
    "title": "Cross-currency basis",
    "concept": "Currency swaps can carry extra cost beyond simple interest-rate differences. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A business seeking dollar funding may pay an extra basis spread to exchange rupees.",
    "caution": "Basis varies by tenor, collateral and market conditions.",
    "connection": "Put cross-currency basis alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-28",
    "module": 2,
    "index": 28,
    "title": "FX translation exposure",
    "concept": "Foreign-currency receivables and overseas subsidiaries are affected differently by exchange rates. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A dollar invoice converts to fewer rupees if USD/INR falls before payment.",
    "caution": "Accounting translation is not the same as a realized cash transaction.",
    "connection": "Put fx translation exposure alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-29",
    "module": 2,
    "index": 29,
    "title": "Forward hedging of imports",
    "concept": "Importers can fix a planned dollar cost in rupees using a forward contract. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "A $100,000 bill at ₹84.50 locks a planned ₹84.5 lakh outflow before costs.",
    "caution": "A hedge removes favorable outcomes too and can be oversized.",
    "connection": "Put forward hedging of imports alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-30",
    "module": 2,
    "index": 30,
    "title": "Currency option collars",
    "concept": "An option collar exchanges part of favorable currency movement for downside protection. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "An importer can buy dollar-rise protection and sell an option limiting gains from a dollar fall.",
    "caution": "Strikes, premiums and exercise rules determine actual protection.",
    "connection": "Put currency option collars alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-31",
    "module": 2,
    "index": 31,
    "title": "FX drivers and rate surprises",
    "concept": "Currencies respond to rate expectations, flows, inflation and global risk appetite. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "INR may weaken despite a domestic rate rise if demand for dollars jumps.",
    "caution": "One observed macro relationship is not a certain trading rule.",
    "connection": "Put fx drivers and rate surprises alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  },
  {
    "id": "quant-topic-3-32",
    "module": 2,
    "index": 32,
    "title": "Market hours and FX liquidity",
    "concept": "Currency liquidity changes through the day as major regions open and close. This lesson builds the meaning of the idea before using it in a calculation or a market decision.",
    "example": "Spreads may be tighter in an active session than during an offshore holiday.",
    "caution": "News can overwhelm any usual time-of-day liquidity pattern.",
    "connection": "Put market hours and fx liquidity alongside the earlier equities & currencies lessons. Start with a small example, decide what information is known, and check whether the stated limitation changes the result."
  }
];
