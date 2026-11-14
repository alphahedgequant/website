// Independent AHQ educational lessons: original explanations and computed exercises; no source names.
export const SPECIALIST_SECTIONS=[
  {
    "id": "section-13",
    "number": 13,
    "title": "Fixed Income Instruments & Credit Analytics",
    "description": "Bond structures, yield curves, credit spreads and portfolio risk"
  },
  {
    "id": "section-14",
    "number": 14,
    "title": "Option Pricing & Numerical Valuation",
    "description": "Sensitivities, exotic options and robust numerical option valuation"
  },
  {
    "id": "section-15",
    "number": 15,
    "title": "Applied Quantitative Trading Research",
    "description": "Forecasting, cointegration, dynamic factors and volatility trading"
  },
  {
    "id": "section-16",
    "number": 16,
    "title": "Financial Machine Learning & Backtest Integrity",
    "description": "Event-time sampling, robust labels, leakage-resistant validation and portfolio design"
  },
  {
    "id": "section-17",
    "number": 17,
    "title": "Derivatives Markets, Hedging & Risk Systems",
    "description": "Forwards, futures, swaps, options, collateral and risk controls"
  }
];
export const SPECIALIST_GUIDES=[
  {
    "title": "Fixed Income Instruments & Credit Analytics",
    "intro": "Fixed income is not simply a fixed return. A bond is a series of promised payments, which an investor must value using interest rates while accounting for issuer default, repayment options, liquidity and funding. We move from simple bond mathematics to yield curves, duration, convexity, structured credit and institutional portfolio controls.",
    "bridge": "Begin with contractual cash flows and the price paid today. Separate changes in benchmark rates from credit-spread movements and ask how a portfolio behaves when funding costs, prepayments or recovery expectations change.",
    "assignment": "Calculate bond prices and rate sensitivity using a compact cash-flow schedule.",
    "code": "cashflows = {1: 45.0, 2: 45.0, 3: 1045.0}\ndef present_value(yield_rate):\n    return sum(c / (1 + yield_rate)**t for t,c in cashflows.items())\nbase = present_value(0.07)\nhigher = present_value(0.08)\nprint('Base price:', round(base,2))\nprint('Price at 8% yield:',round(higher,2))\nprint('Yield-shock change:',round(higher-base,2))\n# Teaching example: no default, liquidity or transaction costs.",
    "tasks": [
      "Explain why bond yields differ from coupon rates even when promised payments do not change.",
      "Compare the result after extending the maturity, and describe why duration tends to increase.",
      "List credit, liquidity and reinvestment risks that the simple cash-flow formula omits."
    ]
  },
  {
    "title": "Option Pricing & Numerical Valuation",
    "intro": "An option price depends on more than market direction. Its strike, expiry, interest rates, dividends, volatility, exercise rules and sometimes the entire underlying-price path influence the contract value. This module develops payoff intuition before comparing analytical, tree-based and simulation pricing methods with their numerical limitations.",
    "bridge": "First draw the payoff. Then choose a valuation assumption and check whether your result is sensitive to volatility or time. For exotic products, ask which part of the payoff depends on monitoring dates, averages, barriers or the worst performing asset.",
    "assignment": "Price a one-step call option with a no-arbitrage probability and compare assumption changes.",
    "code": "spot, strike = 100.0, 100.0\nup, down, growth = 1.15, 0.90, 1.03\nq = (growth - down) / (up - down)\nif not 0 <= q <= 1:\n    raise ValueError('Invalid tree probability')\nup_payoff = max(spot*up - strike,0)\ndown_payoff = max(spot*down - strike,0)\nprice = (q*up_payoff + (1-q)*down_payoff)/growth\nprint('Risk-neutral up weight:',round(q,4))\nprint('One-step option value:',round(price,4))\n# European call toy example; no dividends or bid-ask spread.",
    "tasks": [
      "Change the strike and explain why the option's payoff is convex rather than linear.",
      "Check what happens if the risk-free gross growth factor makes the tree probability invalid.",
      "Explain why an early-exercisable option or barrier option requires different model mechanics."
    ]
  },
  {
    "title": "Applied Quantitative Trading Research",
    "intro": "A good signal must work on observations it did not use during development. Here we explore regression, time-series forecasting, cointegration, changing correlations, volatility regimes, factor-based portfolio management and practical trading costs. Each method begins with an intuitive question and ends with a test of where it can fail.",
    "bridge": "Compare a simple baseline against advanced forecasts on later dates only. Model spreads, slippage and changing economic conditions, because a small forecasting improvement can disappear when a strategy must be executed in a real market.",
    "assignment": "Compare rolling forecasts to a naive zero-return baseline without training on the future.",
    "code": "series = [0.02,-0.01,0.01,0.005,-0.008,0.012,-0.013,0.009,0.018,-0.003]\nrolling_errors, benchmark_errors = [],[]\nfor t in range(4,len(series)):\n    prediction = sum(series[t-4:t])/4\n    rolling_errors.append(abs(series[t]-prediction))\n    benchmark_errors.append(abs(series[t]))\nprint('Rolling MAE:',sum(rolling_errors)/len(rolling_errors))\nprint('Zero-baseline MAE:',sum(benchmark_errors)/len(benchmark_errors))\n# Error reduction is not necessarily profitable after execution costs.",
    "tasks": [
      "Explain why every prediction must be based only on earlier observations.",
      "Change the lookback and inspect whether the baseline still outperforms the model.",
      "Explain how a changing market regime could invalidate the relationship."
    ]
  },
  {
    "title": "Financial Machine Learning & Backtest Integrity",
    "intro": "Machine learning can discover patterns, but financial observations overlap and the underlying system changes. The hardest problem is often not choosing a powerful model; it is constructing a realistic prediction task, representing the timeline correctly and estimating what happens out of sample without being misled by repeated experiments.",
    "bridge": "Start by asking what information existed at the trading decision. Separate training, validation and test events when labels overlap, then assess feature usefulness, the effect of repeated trial selection and the risk that a seemingly stable market regime has shifted.",
    "assignment": "Remove event labels that overlap a held-out period before training the model.",
    "code": "events = [(0,3),(1,4),(3,6),(5,8),(7,10),(9,12)]\ntest_start,test_end,embargo = 5,8,1\ntraining,excluded = [],[]\nfor start,end in events:\n    overlaps = start <= test_end and end >= test_start\n    embargoed = test_end < start <= test_end+embargo\n    (excluded if overlaps or embargoed else training).append((start,end))\nprint('Train:',training)\nprint('Excluded:',excluded)\n# Illustration only; real purging must follow actual label horizons.",
    "tasks": [
      "Explain how overlapping outcome windows allow information from the test set into training.",
      "Change the embargo length and observe the amount of remaining training data.",
      "Describe how repeated model selection can still overfit despite leakage controls."
    ]
  },
  {
    "title": "Derivatives Markets, Hedging & Risk Systems",
    "intro": "Derivatives transform future asset prices, interest rates or credit events into contractual cash flows. A position can be hedged economically yet still face margin calls, basis movements, market impact or counterparty risk. This module connects pricing and risk-management mathematics with the actual exchange and over-the-counter mechanics.",
    "bridge": "Write the payoff first, then the daily collateral and settlement rules. Check whether the hedge covers a market move and whether the account has enough liquidity to survive that move. Follow the exposure across counterparties and through portfolio scenarios.",
    "assignment": "Compare a futures hedged inventory position under alternate price scenarios.",
    "code": "inventory_units = 500.0\nspot_initial,future_initial=100.0,102.0\ncash_buffer=6000.0\nfor new_spot,new_future in [(90,91),(100,101),(115,116)]:\n    inventory = (new_spot-spot_initial)*inventory_units\n    short_future = (future_initial-new_future)*inventory_units\n    print(new_spot,'net PnL',inventory+short_future,\n          'liquidity sufficient?',cash_buffer+short_future>=0)\n# Hypothetical perfect-lot hedge; ignores basis and margin conventions.",
    "tasks": [
      "Explain why a profitable physical hedge may generate an interim futures margin call.",
      "Change the futures price relative to spot and identify the resulting basis risk.",
      "Describe how a counterparty default or a failed hedge execution changes outcomes."
    ]
  }
];
export const SPECIALIST_BRIDGES=[
  "Begin with contractual cash flows and the price paid today. Separate changes in benchmark rates from credit-spread movements and ask how a portfolio behaves when funding costs, prepayments or recovery expectations change. What matters is not merely the formula but whether the data, contract terms and execution conditions justify the conclusions drawn from it.",
  "First draw the payoff. Then choose a valuation assumption and check whether your result is sensitive to volatility or time. For exotic products, ask which part of the payoff depends on monitoring dates, averages, barriers or the worst performing asset. What matters is not merely the formula but whether the data, contract terms and execution conditions justify the conclusions drawn from it.",
  "Compare a simple baseline against advanced forecasts on later dates only. Model spreads, slippage and changing economic conditions, because a small forecasting improvement can disappear when a strategy must be executed in a real market. What matters is not merely the formula but whether the data, contract terms and execution conditions justify the conclusions drawn from it.",
  "Start by asking what information existed at the trading decision. Separate training, validation and test events when labels overlap, then assess feature usefulness, the effect of repeated trial selection and the risk that a seemingly stable market regime has shifted. What matters is not merely the formula but whether the data, contract terms and execution conditions justify the conclusions drawn from it.",
  "Write the payoff first, then the daily collateral and settlement rules. Check whether the hedge covers a market move and whether the account has enough liquidity to survive that move. Follow the exposure across counterparties and through portfolio scenarios. What matters is not merely the formula but whether the data, contract terms and execution conditions justify the conclusions drawn from it."
];
export const SPECIALIST_LESSONS=[
  {
    "id": "quant-practice-13-01",
    "section": 12,
    "title": "Bond discounting",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A one-year zero-coupon bond promises ₹1,000 and yields 5%. What is its price?",
    "question": "A one-year zero-coupon bond promises ₹1,000 and yields 5%. What is its price?",
    "answer": 952.3809523809523,
    "formula": "Price = face / (1 + yield)",
    "solution": "Price = 1000/1.05 = ₹952.38. Use two decimal places; the exact value is accepted."
  },
  {
    "id": "quant-practice-13-02",
    "section": 12,
    "title": "Credit spread",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A corporate bond yields 8.5% and a comparable government bond 6.5%. How many basis points is the spread?",
    "question": "A corporate bond yields 8.5% and a comparable government bond 6.5%. How many basis points is the spread?",
    "answer": 200,
    "formula": "Spread in bp = (corporate yield − government yield) × 100",
    "solution": "2.0 percentage points × 100 = 200 basis points. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-13-03",
    "section": 12,
    "title": "Duration shock",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A ₹1,000 bond has modified duration 4. Estimate the price change for a 1% yield increase, in rupees.",
    "question": "A ₹1,000 bond has modified duration 4. Estimate the price change for a 1% yield increase, in rupees?",
    "answer": -40,
    "formula": "Price change ≈ −price × duration × yield change",
    "solution": "−1000 × 4 × .01 = −₹40. This first-order estimate ignores convexity."
  },
  {
    "id": "quant-practice-14-01",
    "section": 13,
    "title": "Call expiry profit",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A call expires with spot ₹113, strike ₹100 and premium ₹7. Find profit per unit before costs.",
    "question": "A call expires with spot ₹113, strike ₹100 and premium ₹7. Find profit per unit before costs?",
    "answer": 6,
    "formula": "Call profit = max(spot − strike, 0) − premium",
    "solution": "Intrinsic value is ₹13, so net expiry profit is ₹13−₹7 = ₹6. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-14-02",
    "section": 13,
    "title": "Risk-neutral probability",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A tree has up factor 1.1, down factor 0.9, and gross risk-free growth 1.02. Find the risk-neutral up weight.",
    "question": "A tree has up factor 1.1, down factor 0.9, and gross risk-free growth 1.02. Find the risk-neutral up weight?",
    "answer": 0.6,
    "formula": "q = (gross growth − down) / (up − down)",
    "solution": "(1.02−0.9)/(1.1−0.9)=0.6. Pricing weight is not the real-world probability of a rise."
  },
  {
    "id": "quant-practice-14-03",
    "section": 13,
    "title": "Parity implied put",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A European call costs ₹8, spot is ₹100, and discounted strike is ₹96. What is the put worth in parity?",
    "question": "A European call costs ₹8, spot is ₹100, and discounted strike is ₹96. What is the put worth in parity?",
    "answer": 4,
    "formula": "Put = call − spot + PV(strike)",
    "solution": "Put = call−spot+discounted strike = 8−100+96 = ₹4. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-15-01",
    "section": 14,
    "title": "Trading-cost adjustment",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A signal earns 12 basis points gross and costs 8 basis points round-trip. What is its net edge, in basis points?",
    "question": "A signal earns 12 basis points gross and costs 8 basis points round-trip. What is its net edge, in basis points?",
    "answer": 4,
    "formula": "Net return = gross return − round-trip costs",
    "solution": "12−8=4 basis points, before other financing or market impact. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-15-02",
    "section": 14,
    "title": "Pairs spread",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "Stock A trades at ₹110, stock B at ₹92, and the illustrative hedge ratio is 1. What is A−B?",
    "question": "Stock A trades at ₹110, stock B at ₹92, and the illustrative hedge ratio is 1. What is A−B?",
    "answer": 18,
    "formula": "Spread = A − hedge ratio × B",
    "solution": "110−1×92=18. This does not establish cointegration. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-15-03",
    "section": 14,
    "title": "Weighted portfolio return",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "60% of a portfolio earns 5% and 40% earns −2%. What is total return, in percent?",
    "question": "60% of a portfolio earns 5% and 40% earns −2%. What is total return, in percent?",
    "answer": 2.2,
    "formula": "Portfolio return (%) = sum(weight × asset return %)",
    "solution": "0.6×5+0.4×(−2)=2.2%. This ignores rebalance costs. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-16-01",
    "section": 15,
    "title": "Concurrent event weight",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "Three event labels overlap on a single day. What is inverse-concurrency uniqueness for one event?",
    "question": "Three event labels overlap on a single day. What is inverse-concurrency uniqueness for one event?",
    "answer": 0.3333333333333333,
    "formula": "Instant weight = 1 / number of concurrent outcomes",
    "solution": "1/3≈0.333333. A real event weight averages uniqueness across its full interval."
  },
  {
    "id": "quant-practice-16-02",
    "section": 15,
    "title": "Embargo boundary",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "Testing ends on day 20 and a three-day embargo excludes days 21–23. What is the next allowable day?",
    "question": "Testing ends on day 20 and a three-day embargo excludes days 21–23. What is the next allowable day?",
    "answer": 24,
    "formula": "Next day = test end + embargo days + 1",
    "solution": "20+3+1=24, assuming trading days are numbered consecutively. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-16-03",
    "section": 15,
    "title": "Capital-at-risk sizing",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "An illustrative position can lose ₹250 per unit and your stated loss budget is ₹2,000. How many whole units fit?",
    "question": "An illustrative position can lose ₹250 per unit and your stated loss budget is ₹2,000. How many whole units fit?",
    "answer": 8,
    "formula": "Units = risk budget / assumed unit loss",
    "solution": "2000÷250=8. Stop losses may not execute at assumed prices. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-17-01",
    "section": 16,
    "title": "Short futures profit",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A short future sells at ₹120 and is closed at ₹113. Profit per unit before charges?",
    "question": "A short future sells at ₹120 and is closed at ₹113. Profit per unit before charges?",
    "answer": 7,
    "formula": "Short futures profit = entry price − exit price",
    "solution": "120−113=7 per unit; daily cash flows can differ. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  },
  {
    "id": "quant-practice-17-02",
    "section": 16,
    "title": "Collateral shortfall",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "A margin call requires ₹18,000 but available cash is ₹12,000. What is the funding gap?",
    "question": "A margin call requires ₹18,000 but available cash is ₹12,000. What is the funding gap?",
    "answer": 6000,
    "formula": "Funding shortfall = margin required − cash available",
    "solution": "18000−12000=₹6000. A hedge can reduce final risk while increasing interim funding need."
  },
  {
    "id": "quant-practice-17-03",
    "section": 16,
    "title": "Hedge contract count",
    "explain": "Work this small, explicitly hypothetical financial scenario using the stated assumptions; distinguish what the arithmetic demonstrates from risks the model does not include.",
    "example": "An inventory exposure is 500 units and each futures contract covers 100. How many contracts provide an equal-unit hedge?",
    "question": "An inventory exposure is 500 units and each futures contract covers 100. How many contracts provide an equal-unit hedge?",
    "answer": 5,
    "formula": "Contracts = inventory units / units per contract",
    "solution": "500÷100=5 contracts, with basis risk remaining. Confirm that the displayed result uses the requested units and that the simplified model omits trading and funding risks."
  }
];
