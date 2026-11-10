// Additional AHQ learn modules. All prices, rates, orders and examples here are hypothetical teaching cases.
// Existing six modules and completed progress IDs are deliberately left unchanged.
export const EXTENDED_SECTIONS=[
  {
    "id": "section-7",
    "title": "Fixed Income II · Rates & Bond Trading",
    "description": "Understand yields, bond risks and trading interest rates",
    "number": 7
  },
  {
    "id": "section-8",
    "title": "Energy & Commodity Trading",
    "description": "Oil, gas, power, futures curves and physical supply",
    "number": 8
  },
  {
    "id": "section-9",
    "title": "Market Microstructure & Execution",
    "description": "Order books, queues, spreads and trade execution",
    "number": 9
  },
  {
    "id": "section-10",
    "title": "HFT Infrastructure & Low-Latency Systems",
    "description": "Market data pipelines, event loops, latency and safeguards",
    "number": 10
  },
  {
    "id": "section-11",
    "title": "Options, Volatility & Market Making",
    "description": "Implied volatility, option exposure and hedging",
    "number": 11
  },
  {
    "id": "section-12",
    "title": "Quant Strategy Research & Backtesting",
    "description": "From an idea to a tested strategy and safer deployment",
    "number": 12
  }
];
export const EXTENDED_MODULE_GUIDES=[
  {
    "title": "Fixed Income II · Rates & Bond Trading",
    "intro": "Bonds are loans with promised payments. To understand bond trading, first write down when the cash arrives, then ask what it is worth today. This module starts with simple interest rates and moves step by step into yield curves, duration, swaps and funding. You do not need to know advanced bond mathematics before starting.",
    "bridge": "Begin with one payment in one year, then add several payments. Changing the discount rate changes today's price, even if the promised amount stays the same. A trader must also consider credit quality, liquidity and financing.",
    "assignment": "Compare simple bond prices as interest rates rise and fall using a tiny Python model",
    "code": "# A teaching example: one payment at maturity, no coupon or default\nface_value = 1000.0\nyears = 3\nrates = [0.04, 0.06, 0.08]\n\ndef zero_coupon_price(face, annual_rate, term):\n    return face / (1 + annual_rate) ** term\n\nbase_price = zero_coupon_price(face_value, 0.06, years)\nfor rate in rates:\n    price = zero_coupon_price(face_value, rate, years)\n    print(f\"Rate {rate:.0%}: price {price:.2f}; change {price-base_price:+.2f}\")",
    "tasks": [
      "Explain why a higher required yield creates a lower price for the same promised payment.",
      "Change maturity from three years to eight years and compare how sensitive the price becomes.",
      "Describe why this toy example does not capture coupons, taxes, credit risk or trading costs."
    ]
  },
  {
    "title": "Energy & Commodity Trading",
    "intro": "Energy trading begins in the real world. Oil must be produced, shipped and stored. Power must be generated and balanced on a grid. Those physical constraints affect prices, delivery risk and the shape of futures markets. This module introduces those ideas in everyday language before adding basic trading calculations.",
    "bridge": "Imagine a sudden heat wave. Electricity demand rises, but some power plants cannot increase output instantly. Prices can react very differently from stock prices. We connect supply, demand and storage to forward contracts and risk controls.",
    "assignment": "Create a simple energy supply-and-demand stress table using Python",
    "code": "# Made-up electricity data for learning only\nhours = [9, 12, 15, 18, 21]\ndemand_mw = [90, 110, 125, 150, 115]\nsupply_mw = [115, 120, 120, 120, 120]\n\nfor hour, demand, supply in zip(hours, demand_mw, supply_mw):\n    balance = supply - demand\n    status = \"shortage\" if balance < 0 else \"surplus\"\n    print(f\"{hour:02d}:00: demand {demand} MW, supply {supply} MW, \"\n          f\"balance {balance:+} MW ({status})\")\n# This is NOT a power-price or dispatch model.",
    "tasks": [
      "Identify which hours have a shortage and explain why tight supply can matter for energy prices.",
      "Increase available supply by 20 MW and describe how the balances change.",
      "Explain why network constraints, bids and market rules mean the balances cannot predict an actual power price."
    ]
  },
  {
    "title": "Market Microstructure & Execution",
    "intro": "A correct price prediction does not guarantee a good trade. Orders must reach an exchange, meet buyers or sellers and compete for limited liquidity. This module explains the mechanics of the order book, then shows why spreads, queues and execution costs matter for every trading strategy.",
    "bridge": "Picture two people trying to buy the same limited set of shares. Who trades first depends on price, order timing and market rules. These small details can turn a promising backtest into a disappointing live result.",
    "assignment": "Simulate the cost of crossing a simple two-level order book",
    "code": "# Hypothetical ask-side prices and visible quantities\nasks = [(101.0, 5), (101.5, 10), (102.0, 20)]\nquantity = 12\nremaining = quantity\ncost = 0.0\nfor price, size in asks:\n    filled = min(remaining, size)\n    cost += filled * price\n    remaining -= filled\n    if remaining == 0:\n        break\nif remaining > 0:\n    print(\"Not enough visible liquidity to fill the order\")\nelse:\n    print(\"Shares filled:\", quantity)\n    print(\"Average price:\", round(cost / quantity, 4))\n# Real order books change during execution; this example does not.",
    "tasks": [
      "Compare the average fill with the best displayed ask and explain the difference.",
      "Try quantity 4 versus quantity 25 and note when deeper levels become necessary.",
      "Explain why this snapshot does not include queue changes, cancellation or price movement."
    ]
  },
  {
    "title": "HFT Infrastructure & Low-Latency Systems",
    "intro": "High-frequency trading is as much an engineering problem as a finance problem. A computer must receive market events, update its view, decide whether to place an order and track what actually happened. This module explains each step without assuming you already know network engineering or advanced C++.",
    "bridge": "Imagine a live race where prices change in milliseconds. Fast code helps only if the market data is accurate, orders are tracked correctly and risk controls remain active. We will distinguish speed, correctness and reliability instead of treating them as the same goal.",
    "assignment": "Measure event-processing times in a small Python simulation without presenting them as HFT benchmarks",
    "code": "import time\nfrom statistics import median\n# Learning-only demonstration; Python timings are not exchange latency.\nevents = [{\"bid\": 99.9 + i * 0.01, \"ask\": 100.1 + i * 0.01}\n          for i in range(1000)]\nmeasurements_ns = []\nspreads = []\nfor event in events:\n    start = time.perf_counter_ns()\n    spreads.append(round(event[\"ask\"] - event[\"bid\"], 4))\n    measurements_ns.append(time.perf_counter_ns() - start)\nprint(\"Events:\", len(spreads))\nprint(\"Median local processing ns:\", median(measurements_ns))\nprint(\"Max local processing ns:\", max(measurements_ns))\n# Network, queues, OS scheduling and exchange timings are NOT included.",
    "tasks": [
      "Explain why a local processing benchmark is not the same as end-to-end order latency.",
      "Compare the median and maximum processing duration and explain why tail latency matters.",
      "Describe where timestamps, order limits and a kill switch would be added in a real system."
    ]
  },
  {
    "title": "Options, Volatility & Market Making",
    "intro": "Options behave differently from shares because their value also depends on time and expected movement. Traders often compare what the option market implies with what actually happens, then decide whether a position's risks are acceptable. This module takes volatility and Greeks from simple intuition into safer portfolio-level thinking.",
    "bridge": "Start with a single call option. Ask how its price changes if the stock moves, a day passes or implied volatility shifts. Then combine these moving parts carefully; collecting option premium is not the same as earning a safe income.",
    "assignment": "Compare an option's simplified delta and gamma exposure under different underlying moves",
    "code": "# Educational local approximation; not an option-pricing engine.\noption_value = 12.0\ndelta = 0.45\ngamma = 0.025\nfor stock_move in [-5, -2, 0, 2, 5]:\n    first_order = delta * stock_move\n    second_order = 0.5 * gamma * stock_move ** 2\n    approx_value = option_value + first_order + second_order\n    print(f\"Stock move {stock_move:+}: approx option value {approx_value:.3f}\")\n# Time decay, IV shifts, dividends, rates and other effects are omitted.",
    "tasks": [
      "Explain why adding the gamma term changes the prediction for larger price movements.",
      "Change gamma to zero and compare the outcomes for equal positive and negative moves.",
      "Describe which risks are missing from this approximation and why it cannot be used as a live quote."
    ]
  },
  {
    "title": "Quant Strategy Research & Backtesting",
    "intro": "A trading idea should survive questions before it becomes code. Could you have known the inputs at that time? What happens after costs? Does the result depend on one lucky period? This module connects the mathematics of the earlier lessons to practical research, careful testing and monitoring.",
    "bridge": "Treat a new strategy like an experiment. Write down the hypothesis, the data used to test it, the rules that would have been known in real time and the reason the result might disappear. Success means learning what evidence supports the idea, not creating a beautiful chart.",
    "assignment": "Calculate a toy strategy's gross and net returns after transaction costs using Python",
    "code": "# Made-up per-trade returns, no live data and no implied profits.\ntrade_returns = [0.004, -0.002, 0.006, -0.007, 0.003, 0.001]\nround_trip_cost = 0.0015  # 15 basis points per trade\nnet_returns = [ret - round_trip_cost for ret in trade_returns]\ngross_total = sum(trade_returns)\nnet_total = sum(net_returns)\nprint(\"Gross sum of simple trade returns:\", round(gross_total, 5))\nprint(\"Net sum after modeled costs:\", round(net_total, 5))\nprint(\"Number of net winning trades:\", sum(x > 0 for x in net_returns))\n# Sum is not a compounded portfolio result; execution is simplified.",
    "tasks": [
      "Explain why total modeled costs increase as the number of trades increases.",
      "Double the round-trip cost and compare results with the original experiment.",
      "List at least three reasons why simulated fills may differ from live fills."
    ]
  }
];
export const EXTENDED_MODULE_TOPICS=[
  {
    "id": "quant-topic-7-01",
    "module": 6,
    "title": "Coupon, yield and clean price",
    "concept": "A coupon is interest the bond promises to pay. Yield is the return implied by the market price and future payments, under stated assumptions. The coupon rate and the yield are not necessarily equal.",
    "example": "A ₹1,000 bond paying ₹50 each year has a 5% coupon rate. If a buyer pays more than ₹1,000, the yield to maturity will generally be below 5%, assuming the cash flows are paid.",
    "caution": "A quoted yield is not a guaranteed realized return: sale timing, reinvestment, default and fees can change the result.",
    "formula": "Coupon rate = annual coupon ÷ face value",
    "connection": "First separate the contractual cash payment from the return implied by the price someone will actually pay.",
    "index": 1
  },
  {
    "id": "quant-topic-7-02",
    "module": 6,
    "title": "Why bond prices move opposite to yields",
    "concept": "A bond pays a fixed series of amounts. When investors demand a higher return, those same future payments must be purchased at a lower price today. This inverse relationship is the foundation of interest-rate risk.",
    "example": "A single ₹110 payment due in one year is worth ₹100 at a 10% yield, but only ₹95.65 at a 15% yield, before credit or transaction costs.",
    "caution": "This simple discounting assumes the promised payment is made and ignores other bonds' coupon patterns.",
    "formula": "Price = future payment ÷ (1 + yield)",
    "connection": "Think of a promised payment as something fixed in the future: the discount rate is what moves its present value.",
    "index": 2
  },
  {
    "id": "quant-topic-7-03",
    "module": 6,
    "title": "The yield curve",
    "concept": "A yield curve compares borrowing rates for different maturities, such as one year and ten years. Its slope may reflect expected policy rates, inflation, risk and supply, not a single certain forecast.",
    "example": "If one-year yields are 6% and ten-year yields are 7%, the longer rate is 1 percentage point higher. A steepening or flattening changes the relative value of bonds.",
    "caution": "Do not treat the shape as proof of future economic growth or recession; risk premiums also move.",
    "formula": "Curve slope = 10-year yield − 1-year yield",
    "connection": "Compare maturities at the same observation time before interpreting changes in the curve.",
    "index": 3
  },
  {
    "id": "quant-topic-7-04",
    "module": 6,
    "title": "Duration and DV01",
    "concept": "Duration summarizes how much a bond price responds to a small yield movement. DV01 turns that sensitivity into money for a one-basis-point move, making portfolio rate risks easier to compare.",
    "example": "A portfolio with DV01 of ₹2,000 may lose roughly ₹20,000 if rates rise ten basis points, for a small move and with sign convention stated.",
    "caution": "Duration is a local approximation. Large moves and changing credit spreads require additional analysis.",
    "formula": "Approx. price change ≈ −DV01 × change in basis points",
    "connection": "Translate an abstract rate shock into a rupee impact; it becomes easier to set risk limits.",
    "index": 4
  },
  {
    "id": "quant-topic-7-05",
    "module": 6,
    "title": "Convexity and large moves",
    "concept": "Duration assumes the price–yield curve is nearly straight over a tiny move. Convexity describes how that sensitivity bends as yields change, especially for longer-maturity bonds.",
    "example": "A long-duration bond may lose slightly less on a large yield rise than a straight-line duration estimate suggests, when it has positive convexity.",
    "caution": "Callable and mortgage-linked bonds can have negative convexity; the simple positive-convexity story is not universal.",
    "formula": "Approx. ΔP/P ≈ −duration × Δyield + ½ × convexity × (Δyield)²",
    "connection": "After measuring first-order risk with duration, ask what happens when rates move far enough to change the sensitivity itself.",
    "index": 5
  },
  {
    "id": "quant-topic-7-06",
    "module": 6,
    "title": "Interest-rate swaps and hedging",
    "concept": "An interest-rate swap exchanges fixed-rate cash flows for floating-rate cash flows under a contract. It can change exposure to interest rates without buying or selling the underlying bond.",
    "example": "A firm paying floating interest might use a pay-fixed, receive-floating swap to reduce uncertainty in future borrowing payments.",
    "caution": "Swaps introduce counterparty exposure, collateral requirements and differences between the hedge and the loan.",
    "formula": "Swap net cash flow = floating-leg cash flow − fixed-leg cash flow, for receive-floating",
    "connection": "A hedge should target an identified risk rather than be described simply as a trade that must make money.",
    "index": 6
  },
  {
    "id": "quant-topic-7-07",
    "module": 6,
    "title": "Repo and financing",
    "concept": "A repo is commonly a secured borrowing arrangement using securities as collateral. Funding cost and collateral terms can change the profit of a bond position, even when the bond price forecast is correct.",
    "example": "A dealer financing ₹100 of bonds at 5% annual repo interest pays about ₹5 for a full year before fees and haircuts.",
    "caution": "Haircuts, margin calls, rollovers and collateral availability can matter more than the headline funding rate.",
    "formula": "Approx. funding cost = borrowed cash × annual repo rate × years",
    "connection": "The bond's return and the cost of holding it are two different calculations; include both before calling a spread attractive.",
    "index": 7
  },
  {
    "id": "quant-topic-8-01",
    "module": 7,
    "title": "Physical markets versus financial contracts",
    "concept": "A physical energy trade arranges the delivery of oil, gas or power at a place and time. A futures or swap contract gives financial or delivery-linked price exposure under specified terms. The same price view can have very different operational risks.",
    "example": "Buying 1,000 barrels of a specified grade of crude for delivery next month requires logistics; a cash-settled futures contract can instead settle financially.",
    "caution": "Always check grade, quality, location, contract size and settlement rules before comparing quotes.",
    "formula": "Trade specification = product + quantity + location + delivery time",
    "connection": "First identify what is actually being bought, delivered or cash-settled before studying its price.",
    "index": 1
  },
  {
    "id": "quant-topic-8-02",
    "module": 7,
    "title": "Oil supply, demand and inventory",
    "concept": "Crude prices react to production, refinery demand, inventories, transport and unexpected disruptions. Inventory provides a buffer between today's production and consumption, but storage capacity is limited.",
    "example": "If daily demand is 100 units and available supply drops from 102 to 95 units, stocks may need to cover the seven-unit shortfall until supply recovers.",
    "caution": "One supply–demand equation does not capture quality differences, geopolitics or changes in expected future demand.",
    "formula": "Inventory change ≈ supply − demand",
    "connection": "The market balances physical barrels over time, not just opinions about tomorrow's price.",
    "index": 2
  },
  {
    "id": "quant-topic-8-03",
    "module": 7,
    "title": "Natural gas, seasonality and transport",
    "concept": "Gas demand changes with weather, industry and electricity generation. Pipeline capacity and liquefied natural gas terminals affect where gas can move, so prices can differ widely by region.",
    "example": "An unusually cold winter can increase heating demand while a constrained pipeline prevents cheaper gas from reaching a high-demand city.",
    "caution": "Regional hub prices should not be treated as one universal natural-gas price.",
    "formula": "Net balance = production + imports − demand − exports",
    "connection": "Seasonal patterns are a starting point, not a guarantee that an individual winter will match the average.",
    "index": 3
  },
  {
    "id": "quant-topic-8-04",
    "module": 7,
    "title": "Power markets and the grid",
    "concept": "Electricity must be balanced almost continuously because large-scale storage is limited in many systems. Generation availability, network congestion, renewable output and demand shape short-term power prices.",
    "example": "A hot evening increases air-conditioning demand just as solar generation falls; an expensive generator may set the marginal market price.",
    "caution": "Actual settlement depends on market design, bidding, grid constraints and local rules.",
    "formula": "Grid balance ≈ generation + imports − consumption − exports − losses",
    "connection": "Unlike a stock, electricity has a strong location-and-hour dimension that must be included in analysis.",
    "index": 4
  },
  {
    "id": "quant-topic-8-05",
    "module": 7,
    "title": "Contango and backwardation",
    "concept": "A futures curve lists prices for different delivery dates. Contango means later futures are priced above nearer contracts; backwardation means later contracts are priced below nearer contracts.",
    "example": "If a near-month future is ₹100 and next-month is ₹104, the quoted calendar spread is ₹4; this is not a guaranteed ₹4 return.",
    "caution": "Storage, financing, convenience value and supply expectations influence curves; roll returns depend on the trade.",
    "formula": "Calendar spread = far-month futures price − near-month futures price",
    "connection": "Look at the delivery month before concluding that an energy price has risen or fallen.",
    "index": 5
  },
  {
    "id": "quant-topic-8-06",
    "module": 7,
    "title": "Crack spreads and spark spreads",
    "concept": "Refiners earn a margin between products and crude input, while gas-fired power producers compare electricity revenue with fuel cost. Crack and spark spreads are simplified ways to study these operating margins.",
    "example": "If electricity sells for ₹7 per kWh and gas plus emissions cost ₹5 per kWh, the simplified spark spread is ₹2 per kWh.",
    "caution": "Real margins depend on heat rate, conversion factors, outages, taxes, locations and contract specifics.",
    "formula": "Simple spark spread = power revenue − fuel cost − emissions cost",
    "connection": "A positive spread is not the same as an actual profit after fixed costs and operating constraints.",
    "index": 6
  },
  {
    "id": "quant-topic-8-07",
    "module": 7,
    "title": "Energy risk, hedging and stress testing",
    "concept": "A producer, airline or power company may use derivatives to reduce price uncertainty. Position limits must also consider delivery requirements, margin calls, basis differences and unusually large price gaps.",
    "example": "An airline hedges part of next quarter's fuel use, but its actual fuel bill can still move differently from the benchmark contract.",
    "caution": "Hedges reduce selected exposures; they do not remove volume risk, basis risk or liquidity risk.",
    "formula": "Residual exposure = physical exposure − effective hedge exposure",
    "connection": "Start with the quantity of energy the business actually needs or produces before choosing a hedge.",
    "index": 7
  },
  {
    "id": "quant-topic-9-01",
    "module": 8,
    "title": "Limit order books",
    "concept": "An order book holds priced buy and sell interests at each level. The best bid is the highest displayed buy price and the best ask is the lowest displayed sell price; neither is guaranteed to remain available.",
    "example": "If the best bid is ₹99.90 and the best ask is ₹100.10, the quoted spread is ₹0.20 before fees and price movement.",
    "caution": "Some venues contain hidden orders, implied liquidity or different order types not visible in basic snapshots.",
    "formula": "Quoted spread = best ask − best bid",
    "connection": "Read both price and available quantity; a good displayed price might exist for only a tiny order.",
    "index": 1
  },
  {
    "id": "quant-topic-9-02",
    "module": 8,
    "title": "Market orders and limit orders",
    "concept": "A market order prioritizes execution but may pay a worse price. A limit order states a price boundary but may not execute at all. The trade-off is urgency versus price control.",
    "example": "A trader buying 100 shares immediately may sweep several ask levels. A limit buy at the best bid could remain unfilled when the market rises.",
    "caution": "Execution priority, order protection and supported order types vary across venues and broker systems.",
    "formula": "Buy limit: executed price must not exceed the order's limit",
    "connection": "First decide whether your strategy values immediate execution more than avoiding an unfavorable fill.",
    "index": 2
  },
  {
    "id": "quant-topic-9-03",
    "module": 8,
    "title": "Queue position and cancellations",
    "concept": "At the same price, many venues use time priority, so earlier orders are ahead of later ones. Cancellations and new orders constantly change estimated queue position and the chance of a fill.",
    "example": "If 500 shares are ahead of your 100-share buy order and only 200 shares sell into that price, your order may receive no fill.",
    "caution": "A simple public feed may not reveal every individual order or reliably reconstruct hidden queue state.",
    "formula": "Available ahead ≈ displayed quantity in front of your order",
    "connection": "Queue position turns a market view into a question about the likelihood and timing of execution.",
    "index": 3
  },
  {
    "id": "quant-topic-9-04",
    "module": 8,
    "title": "Spread, slippage and fees",
    "concept": "Spread is the distance between current buying and selling quotes. Slippage measures how the actual execution differs from a chosen benchmark. Fees and taxes can consume a small statistical advantage.",
    "example": "A strategy predicting 0.10% average gain may still lose if round-trip spread, brokerage, taxes and slippage total 0.15%.",
    "caution": "Quoted spreads differ from effective spreads; always state the benchmark and total trade size.",
    "formula": "Net expected edge ≈ gross expected edge − all-in costs",
    "connection": "Backtests need modeled execution costs and later comparison with genuine fill records.",
    "index": 4
  },
  {
    "id": "quant-topic-9-05",
    "module": 8,
    "title": "VWAP and TWAP",
    "concept": "TWAP breaks an order across time, while VWAP schedules or assesses executions relative to traded volume. They can reduce concentration but are not magic ways to beat the market.",
    "example": "A 600-share order sent evenly across six slices of time uses 100 shares per slice under a simple TWAP plan.",
    "caution": "Real algorithms adjust to volume, risk limits and market conditions; benchmark outperformance is not guaranteed.",
    "formula": "TWAP slice size = total order quantity ÷ number of slices",
    "connection": "Think of an execution algorithm as a plan for how to trade, separate from a model for whether to trade.",
    "index": 5
  },
  {
    "id": "quant-topic-9-06",
    "module": 8,
    "title": "Market impact and adverse selection",
    "concept": "Large orders may move prices by consuming visible liquidity or revealing intent. A passive fill can also be unfavorable if it happens mainly when informed traders move the market against you.",
    "example": "A market-maker buying at the bid just before negative news may lose despite collecting the quoted spread.",
    "caution": "Observed price changes mix market impact, new information, randomness and wider market moves.",
    "formula": "Implementation shortfall = realized execution cost versus decision-price benchmark",
    "connection": "Measure the full cost of sending an order, not only the last displayed bid–ask spread.",
    "index": 6
  },
  {
    "id": "quant-topic-9-07",
    "module": 8,
    "title": "Execution safety controls",
    "concept": "A trading system needs order limits, duplicate-order protection and reconciliation between its records and broker or exchange status. Safety matters even when the signal model is accurate.",
    "example": "If an acknowledgment arrives late, blindly resending the same order may double exposure; reconcile its actual state first.",
    "caution": "An order timeout is not proof of cancellation, and risk controls must reflect exchange and broker behavior.",
    "formula": "Tracked position = acknowledged fills − confirmed offsets",
    "connection": "Trading systems should treat uncertainty about an order's status as a risk, not as permission to retry blindly.",
    "index": 7
  },
  {
    "id": "quant-topic-10-01",
    "module": 9,
    "title": "The full HFT event path",
    "concept": "A trading event travels from a data feed through a network card, parser, strategy and risk checks before an order goes out. Each stage has a processing time and can fail independently.",
    "example": "A feed message might be decoded in 20 microseconds while a congested network adds 300 microseconds; optimizing only the decoder misses the larger delay.",
    "caution": "Illustrative durations are not real measurements for a broker, venue or hardware stack.",
    "formula": "End-to-end latency ≈ sum of stage delays + queueing",
    "connection": "Draw the whole event path before choosing which part to optimize.",
    "index": 1
  },
  {
    "id": "quant-topic-10-02",
    "module": 9,
    "title": "Market-data feeds and sequence numbers",
    "concept": "A market-data feed delivers events such as new trades and order book updates. Sequence numbers help detect gaps, while snapshots help rebuild a correct state after lost messages.",
    "example": "If events numbered 120 and 122 arrive without 121, the book may be incomplete; the system should mark it stale and recover before relying on it.",
    "caution": "Exact recovery methods depend on feed protocol and venue; never assume every feed supports the same replay features.",
    "formula": "Expected next sequence = last accepted sequence + 1",
    "connection": "A fast but incorrect order book can be more dangerous than a slower verified one.",
    "index": 2
  },
  {
    "id": "quant-topic-10-03",
    "module": 9,
    "title": "Event-driven engines and state machines",
    "concept": "An event-driven program responds to messages rather than repeatedly scanning everything. An order state machine tracks transitions such as sent, acknowledged, partially filled, canceled or rejected.",
    "example": "After sending an order, the engine receives a partial-fill event and must update remaining quantity before deciding what to do next.",
    "caution": "Messages may arrive late or out of order; state transitions need idempotency and reconciliation.",
    "formula": "Remaining quantity = ordered quantity − confirmed filled quantity",
    "connection": "Correct state transitions protect against accidental duplicate orders even during communication errors.",
    "index": 3
  },
  {
    "id": "quant-topic-10-04",
    "module": 9,
    "title": "Latency, jitter and percentiles",
    "concept": "Latency is elapsed time between defined points. Jitter is variation in latency. A low average can hide rare but very slow events, so engineers monitor median, 99th percentile and worst observed times.",
    "example": "Most events may process in 50 microseconds but a few take 2 milliseconds during a memory pause; those outliers can matter in fast markets.",
    "caution": "Every benchmark must define start and end timestamps, sample size, environment and whether clocks are synchronized.",
    "formula": "P99 latency = time below which 99% of observed measurements fall",
    "connection": "Optimize the tail as well as the center; averages do not describe occasional stalls.",
    "index": 4
  },
  {
    "id": "quant-topic-10-05",
    "module": 9,
    "title": "Networks, clocks and colocated servers",
    "concept": "Servers near an exchange can reduce physical network delay, while accurate clock synchronization helps compare event times. Hardware placement cannot repair bad algorithms, feeds or risk design.",
    "example": "A system may timestamp receipt using a synchronized hardware clock and separately timestamp decision completion to diagnose processing delay.",
    "caution": "Round-trip comparisons are misleading when clocks disagree or different environments are benchmarked.",
    "formula": "Observed stage delay = end timestamp − start timestamp, on a valid clock basis",
    "connection": "Separate propagation delay from computation delay, and record which clock produced each timestamp.",
    "index": 5
  },
  {
    "id": "quant-topic-10-06",
    "module": 9,
    "title": "C++ performance and memory discipline",
    "concept": "Low-latency systems often use C++ to control allocations, memory layout and CPU work. Preallocation, bounded queues and careful data structures reduce unexpected pauses, but complexity itself can create bugs.",
    "example": "A fixed-size ring buffer can avoid repeated heap allocation while reading events, provided the producer and consumer correctly handle a full buffer.",
    "caution": "Lock-free code is not automatically faster or safer; contention, cache behavior and correctness must be measured.",
    "formula": "Throughput = processed events ÷ elapsed time",
    "connection": "First choose a correct bounded design, then profile real workloads before attempting clever optimizations.",
    "index": 6
  },
  {
    "id": "quant-topic-10-07",
    "module": 9,
    "title": "Pre-trade risk and kill switches",
    "concept": "A fast trading system must enforce quantity, notional, price and position limits before orders leave. Kill switches and reconciliation are safeguards against runaway behavior or inconsistent state.",
    "example": "If an order would breach a position limit, the gateway rejects it regardless of how strong the strategy signal appears.",
    "caution": "A kill switch must be tested with actual routing semantics; simply turning off a strategy process may leave live orders.",
    "formula": "Order allowed only if all mandatory risk checks pass",
    "connection": "In high-frequency trading, the fastest safe order is more valuable than an unsafe order sent a few microseconds earlier.",
    "index": 7
  },
  {
    "id": "quant-topic-11-01",
    "module": 10,
    "title": "Realized versus implied volatility",
    "concept": "Realized volatility describes movement observed in actual price history. Implied volatility is the model input that makes a quoted option price match a chosen pricing model. They are related but are not the same measurement.",
    "example": "An option may imply 25% annualized volatility while the last month of returns realized 18%; the difference is not a guaranteed future profit.",
    "caution": "Estimates depend on window, model, expiry, dividends, event risk and market liquidity.",
    "formula": "Volatility premium comparison = implied volatility − chosen realized-volatility estimate",
    "connection": "Compare like-for-like horizons and units before deciding whether volatility looks expensive.",
    "index": 1
  },
  {
    "id": "quant-topic-11-02",
    "module": 10,
    "title": "Delta, gamma, theta and vega",
    "concept": "Delta approximates sensitivity to a small stock-price move; gamma measures how delta changes. Theta measures sensitivity to time and vega to implied volatility. None operates in isolation in real markets.",
    "example": "With delta 0.4 and a ₹2 stock rise, an option may gain roughly ₹0.80 before gamma, time decay and IV changes.",
    "caution": "Greeks are derivatives of a pricing model, not fixed promises about traded prices.",
    "formula": "Small value change ≈ delta × spot move + vega × IV move + theta × time move",
    "connection": "Write the size and sign of every major sensitivity before describing a strategy as hedged.",
    "index": 2
  },
  {
    "id": "quant-topic-11-03",
    "module": 10,
    "title": "The volatility smile and surface",
    "concept": "Options with different strikes or expiries often trade at different implied volatilities. A volatility surface plots those differences and helps compare prices on a more consistent basis.",
    "example": "A far out-of-the-money put may have higher implied volatility than an at-the-money call because markets price downside tail risk differently.",
    "caution": "Surface values rely on model choices, forward prices, quote quality and interpolation.",
    "formula": "Volatility surface = implied volatility by strike and expiry",
    "connection": "A single headline IV number hides important differences across strikes and maturities.",
    "index": 3
  },
  {
    "id": "quant-topic-11-04",
    "module": 10,
    "title": "Option spreads and payoff diagrams",
    "concept": "Spreads combine multiple options to shape payoff and risk. The premiums, strikes, expiry and contract size must be written down before a payoff chart can be trusted.",
    "example": "Buying a ₹100 call for ₹8 and selling a ₹110 call for ₹3 costs ₹5. At expiry above ₹110, the spread's gross payoff is capped at ₹10 before the ₹5 net debit.",
    "caution": "Early exercise, assignment, liquidity, fees and margin rules vary by product and venue.",
    "formula": "Call vertical spread profit = long call payoff − short call payoff − net debit",
    "connection": "Start with each option leg's cash flows, then add them; do not rely on strategy names alone.",
    "index": 4
  },
  {
    "id": "quant-topic-11-05",
    "module": 10,
    "title": "Gamma exposure and dynamic hedging",
    "concept": "Gamma describes how delta can change after spot moves. A delta hedge needs rebalancing as the underlying and time evolve, potentially creating transaction costs and losses from jumps.",
    "example": "A dealer initially delta-neutral may become long or short underlying exposure after a rapid market move, requiring a hedge trade at new prices.",
    "caution": "Public option open interest does not reveal every dealer's true position or a certain market gamma-flip level.",
    "formula": "New delta ≈ starting delta + gamma × spot move",
    "connection": "Hedging neutralizes an estimated sensitivity at one moment; it does not freeze a portfolio's risk.",
    "index": 5
  },
  {
    "id": "quant-topic-11-06",
    "module": 10,
    "title": "Market making and inventory risk",
    "concept": "A market maker quotes prices at which others may trade, seeking enough spread or other edge to cover costs and risk. Inventory changes when only one side of the quote gets filled.",
    "example": "If buyers repeatedly lift the market maker's offers, the maker can become short options and may need to adjust quotes or hedge.",
    "caution": "Capturing the quoted spread is not guaranteed profit when adverse selection, inventory and jumps matter.",
    "formula": "Net maker P&L = spread capture + price changes − hedging and operating costs",
    "connection": "A quote is both an opportunity to trade and a commitment that can alter the maker's inventory.",
    "index": 6
  },
  {
    "id": "quant-topic-11-07",
    "module": 10,
    "title": "Short-volatility risk and stress tests",
    "concept": "Selling volatility often earns premium in quiet periods but can experience sharp losses during jumps, persistent trends or IV spikes. Stress testing checks outcomes beyond ordinary daily moves.",
    "example": "A short option portfolio that earns ₹200 in calm conditions can lose several thousand rupees after a large gap; the premium received is not the maximum loss.",
    "caution": "Scenario tests omit unknown events and depend on liquidity, margin, contract settlement and correlation assumptions.",
    "formula": "Stressed portfolio P&L = sum of repriced positions − costs",
    "connection": "Test severe spot and IV shocks together instead of judging a short-premium trade only by win rate.",
    "index": 7
  },
  {
    "id": "quant-topic-12-01",
    "module": 11,
    "title": "Define a testable hypothesis",
    "concept": "A good research idea makes a claim precise enough to disprove. State which instrument, signal, holding period, costs and market conditions matter before looking at results.",
    "example": "Instead of saying 'volume predicts price', test whether an unusually high first-hour volume ratio predicts the next-hour return after estimated costs.",
    "caution": "Changing rules after examining results can make random patterns appear more reliable than they are.",
    "formula": "Signal = measurable rule using information available before the trade",
    "connection": "Write down what would count as a failure before running the first backtest.",
    "index": 1
  },
  {
    "id": "quant-topic-12-02",
    "module": 11,
    "title": "Market data quality and timestamps",
    "concept": "Historical bars and quotes may contain gaps, bad prints, corporate actions or incorrect timestamps. Research must use the information available at each decision point, not corrected future knowledge.",
    "example": "A 10:00 trading decision cannot use a company's filing first published at 13:00 even if a downloaded dataset labels both rows with the same date.",
    "caution": "Survivorship, look-ahead and vendor coverage bias can make backtests unrealistically strong.",
    "formula": "Available feature time ≤ decision time",
    "connection": "Audit the data before building a sophisticated strategy on top of it.",
    "index": 2
  },
  {
    "id": "quant-topic-12-03",
    "module": 11,
    "title": "Train, validate and test in time order",
    "concept": "Training data is used to fit rules, validation data to compare choices and a final untouched test period to estimate performance on unseen history. In markets, random mixing of time periods can leak future information.",
    "example": "Develop on 2022–2024, tune using early 2025, then inspect one untouched later period only after choosing the final rules.",
    "caution": "One holdout period may still be unrepresentative, and repeated peeking at it destroys its independence.",
    "formula": "Training dates precede validation dates, which precede test dates",
    "connection": "A strong backtest earns credibility by avoiding decisions informed by future data.",
    "index": 3
  },
  {
    "id": "quant-topic-12-04",
    "module": 11,
    "title": "Backtest execution costs and constraints",
    "concept": "A price series is not a record of fills. A realistic test includes spreads, fees, slippage, participation limits, delays and rules about whether the order could execute at that time.",
    "example": "A model averaging 12 basis points per trade can lose after a realistic 15-basis-point round-trip cost.",
    "caution": "Cost estimates vary by venue, time, volume, instrument and broker; single-number assumptions need stress tests.",
    "formula": "Net trade return ≈ gross trade return − fees − spread − impact",
    "connection": "Model the actual trade you could place, rather than a frictionless execution at the closing price.",
    "index": 4
  },
  {
    "id": "quant-topic-12-05",
    "module": 11,
    "title": "Position sizing and portfolio limits",
    "concept": "A reliable signal can still cause large losses if position size is too high. Limit concentration, leverage, daily loss and correlated positions in addition to individual strategy risk.",
    "example": "With ₹1,00,000 capital and a 1% risk budget, a planned maximum risk allocation is ₹1,000 before gap risk and execution slippage.",
    "caution": "A stop order is not a guarantee of maximum loss during gaps, auctions or market halts.",
    "formula": "Nominal risk budget = equity × chosen risk fraction",
    "connection": "Translate performance forecasts into a bounded exposure plan before deploying orders.",
    "index": 5
  },
  {
    "id": "quant-topic-12-06",
    "module": 11,
    "title": "Walk-forward and robustness checks",
    "concept": "Walk-forward analysis repeatedly fits on older data and tests on later data. Robustness checks change costs, thresholds and market regimes to reveal fragile performance.",
    "example": "If a strategy works only when a moving average uses exactly 19 days, not 18 or 20, that sensitivity is a warning sign.",
    "caution": "Repeated searching across thousands of parameters can produce lucky winners even with walk-forward splits.",
    "formula": "Robustness = similar conclusions across reasonable assumptions",
    "connection": "A small stable effect is often more credible than a huge effect isolated to one parameter setting.",
    "index": 6
  },
  {
    "id": "quant-topic-12-07",
    "module": 11,
    "title": "Paper trading, monitoring and shutdown plans",
    "concept": "Paper trading checks whether signals, timestamps and simulated orders behave as expected. A live system also needs reconciliation, alerts, risk limits and a safe procedure for stopping new orders.",
    "example": "If an exchange connection fails, the system should track existing orders and positions rather than assuming every unacknowledged order vanished.",
    "caution": "Paper fills cannot validate real liquidity or market impact, so live rollouts still require caution and independent checks.",
    "formula": "Live monitoring = data health + order state + positions + risk limits",
    "connection": "Deployment is the beginning of monitoring the hypothesis, not the end of research.",
    "index": 7
  }
];
export const EXTENDED_LESSONS=[
  {
    "id": "quant-practice-7-01",
    "title": "Check the numbers",
    "explain": "Use the fixed income ii · rates & bond trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "Divide the one-year payment by 1.10 to obtain ₹100.",
    "question": "A zero-coupon bond pays ₹110 in one year. At 10% yield, price in rupees?",
    "answer": 100,
    "formula": "Price = 110 ÷ 1.10",
    "solution": "Divide the one-year payment by 1.10 to obtain ₹100.",
    "section": 6
  },
  {
    "id": "quant-practice-7-02",
    "title": "Work through an example",
    "explain": "Use the fixed income ii · rates & bond trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "7 − 6 equals 1 percentage point; do not confuse percentage points with percent change.",
    "question": "A 10-year yield is 7% and a 1-year yield is 6%. Curve slope in percentage points?",
    "answer": 1,
    "formula": "Slope = 10-year yield − 1-year yield",
    "solution": "7 − 6 equals 1 percentage point; do not confuse percentage points with percent change.",
    "section": 6
  },
  {
    "id": "quant-practice-7-03",
    "title": "Apply the idea",
    "explain": "Use the fixed income ii · rates & bond trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "₹200 × 5 = ₹1,000 approximate price loss for rising rates.",
    "question": "DV01 is ₹200 for each basis point. Rates rise 5 bps. Approximate loss in rupees?",
    "answer": 1000,
    "formula": "Approximate loss = DV01 × rate move in basis points",
    "solution": "₹200 × 5 = ₹1,000 approximate price loss for rising rates.",
    "section": 6
  },
  {
    "id": "quant-practice-8-01",
    "title": "Check the numbers",
    "explain": "Use the energy & commodity trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "104 − 100 = 4 in the same price units.",
    "question": "Near futures price is 100 and far futures price is 104. Calendar spread?",
    "answer": 4,
    "formula": "Spread = far − near",
    "solution": "104 − 100 = 4 in the same price units.",
    "section": 7
  },
  {
    "id": "quant-practice-8-02",
    "title": "Work through an example",
    "explain": "Use the energy & commodity trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "135 − 120 = 15 MW of shortage.",
    "question": "Energy supply is 120 MW and demand is 135 MW. Shortfall in MW?",
    "answer": 15,
    "formula": "Shortfall = demand − supply",
    "solution": "135 − 120 = 15 MW of shortage.",
    "section": 7
  },
  {
    "id": "quant-practice-8-03",
    "title": "Apply the idea",
    "explain": "Use the energy & commodity trading lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "8 − 5 = ₹3 per kWh before other costs.",
    "question": "Power price ₹8/kWh and simplified fuel cost ₹5/kWh. Spark spread?",
    "answer": 3,
    "formula": "Spread = power revenue − fuel cost",
    "solution": "8 − 5 = ₹3 per kWh before other costs.",
    "section": 7
  },
  {
    "id": "quant-practice-9-01",
    "title": "Check the numbers",
    "explain": "Use the market microstructure & execution lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "100.2 − 99.8 = ₹0.40; the quoted spread is not the full round-trip cost.",
    "question": "Best bid is 99.8 and ask is 100.2. Quoted spread?",
    "answer": 0.4,
    "formula": "Spread = ask − bid",
    "solution": "100.2 − 99.8 = ₹0.40; the quoted spread is not the full round-trip cost.",
    "section": 8
  },
  {
    "id": "quant-practice-9-02",
    "title": "Work through an example",
    "explain": "Use the market microstructure & execution lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "600 ÷ 6 = 100 shares in each equal slice.",
    "question": "Buy 600 shares in six equal TWAP slices. Shares per slice?",
    "answer": 100,
    "formula": "Slice = total shares ÷ number of slices",
    "solution": "600 ÷ 6 = 100 shares in each equal slice.",
    "section": 8
  },
  {
    "id": "quant-practice-9-03",
    "title": "Apply the idea",
    "explain": "Use the market microstructure & execution lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "15 − 11 = 4 basis points before model uncertainty.",
    "question": "Gross edge is 15 basis points and all-in cost is 11. Net edge in bps?",
    "answer": 4,
    "formula": "Net edge = gross edge − total cost",
    "solution": "15 − 11 = 4 basis points before model uncertainty.",
    "section": 8
  },
  {
    "id": "quant-practice-10-01",
    "title": "Check the numbers",
    "explain": "Use the hft infrastructure & low-latency systems lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "20 + 80 = 100 microseconds, ignoring overlap and queueing.",
    "question": "One stage takes 20 microseconds and the next 80. Total in microseconds?",
    "answer": 100,
    "formula": "Total = stage 1 + stage 2",
    "solution": "20 + 80 = 100 microseconds, ignoring overlap and queueing.",
    "section": 9
  },
  {
    "id": "quant-practice-10-02",
    "title": "Work through an example",
    "explain": "Use the hft infrastructure & low-latency systems lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "122 − 120 − 1 = 1 missing event, sequence 121.",
    "question": "Events 120 then 122 arrive. How many sequence numbers are missing between?",
    "answer": 1,
    "formula": "Missing count = next received − previous received − 1",
    "solution": "122 − 120 − 1 = 1 missing event, sequence 121.",
    "section": 9
  },
  {
    "id": "quant-practice-10-03",
    "title": "Apply the idea",
    "explain": "Use the hft infrastructure & low-latency systems lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "999 ÷ 1000 × 100 = 99.9%, which still leaves one missed deadline.",
    "question": "999 of 1,000 events meet a deadline. Success percentage?",
    "answer": 99.9,
    "formula": "Success rate = successes ÷ total × 100",
    "solution": "999 ÷ 1000 × 100 = 99.9%, which still leaves one missed deadline.",
    "section": 9
  },
  {
    "id": "quant-practice-11-01",
    "title": "Check the numbers",
    "explain": "Use the options, volatility & market making lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "0.4 × 5 = ₹2 before gamma and other effects.",
    "question": "Delta is 0.4 and stock rises ₹5. Approx first-order option move?",
    "answer": 2,
    "formula": "First-order option move ≈ delta × stock move",
    "solution": "0.4 × 5 = ₹2 before gamma and other effects.",
    "section": 10
  },
  {
    "id": "quant-practice-11-02",
    "title": "Work through an example",
    "explain": "Use the options, volatility & market making lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "8 − 3 = ₹5 premium paid.",
    "question": "Buy call for ₹8 and sell call for ₹3. Net premium paid?",
    "answer": 5,
    "formula": "Net debit = premium paid − premium received",
    "solution": "8 − 3 = ₹5 premium paid.",
    "section": 10
  },
  {
    "id": "quant-practice-11-03",
    "title": "Apply the idea",
    "explain": "Use the options, volatility & market making lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "25 − 18 = 7 percentage points, not a promised trading return.",
    "question": "Implied volatility is 25% and historical realized is 18%. Difference in percentage points?",
    "answer": 7,
    "formula": "Difference = IV% − RV%",
    "solution": "25 − 18 = 7 percentage points, not a promised trading return.",
    "section": 10
  },
  {
    "id": "quant-practice-12-01",
    "title": "Check the numbers",
    "explain": "Use the quant strategy research & backtesting lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "20 − 15 = 5 basis points before estimation error.",
    "question": "Gross return 20 basis points, modeled costs 15. Net in basis points?",
    "answer": 5,
    "formula": "Net return = gross return − costs",
    "solution": "20 − 15 = 5 basis points before estimation error.",
    "section": 11
  },
  {
    "id": "quant-practice-12-02",
    "title": "Work through an example",
    "explain": "Use the quant strategy research & backtesting lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "₹100,000 × 1% = ₹1,000; realized loss can exceed this during a gap.",
    "question": "Capital ₹100,000, risk budget 1%. Risk budget in rupees?",
    "answer": 1000,
    "formula": "Risk budget = capital × 0.01",
    "solution": "₹100,000 × 1% = ₹1,000; realized loss can exceed this during a gap.",
    "section": 11
  },
  {
    "id": "quant-practice-12-03",
    "title": "Apply the idea",
    "explain": "Use the quant strategy research & backtesting lessons to work through this calculation. Write down the units and the assumption before you enter an answer.",
    "example": "40 × ₹12 = ₹480; more trades create more total charges.",
    "question": "A 40-trade backtest charges ₹12 per trade. Total modeled charges in rupees?",
    "answer": 480,
    "formula": "Total charges = number of trades × cost per trade",
    "solution": "40 × ₹12 = ₹480; more trades create more total charges.",
    "section": 11
  }
];
export const EXTENDED_BRIDGES=[
  "A bond is not just a ticker or a quoted yield. Its value starts with a schedule of cash payments and the rate used to discount them. Each chapter adds one practical piece: curve shape, sensitivity, hedging or funding. The Python exercise lets you test how much the value changes under different assumptions.",
  "Energy prices are shaped by pipes, storage tanks, weather, power grids and contract delivery dates. A simple financial chart cannot capture those details alone. In these chapters you will learn to ask what physical product is being traded, where it must arrive, when delivery happens and which risks remain.",
  "You already know what a bid and ask are. Here we go inside the exchange to see how orders compete and how fills happen. The important question is not only whether a model predicts direction, but whether the expected advantage survives the spread, the order queue, and the impact of sending your trade.",
  "Start with the simple path of a market event: exchange feed, network, parser, strategy, risk check, order gateway and acknowledgement. At each stage ask what can be delayed, lost, duplicated or misunderstood. Reliability and measured latency are both essential; neither justifies weakening safety controls.",
  "This module is about understanding exposures, not discovering a guaranteed premium-selling strategy. Begin with the meaning of realized and implied volatility, then see how option sensitivities change as price, time and volatility move. The final goal is a clear risk ledger: what helps the trade, what hurts it and what cannot be known in advance.",
  "A strategy is a chain of assumptions connecting data, signal, position sizing, orders and realized P&L. A failure in any link can defeat a correct-looking prediction. Work through each link in order, keep the final test untouched, and plan how to detect differences between simulated behavior and actual trades."
];
