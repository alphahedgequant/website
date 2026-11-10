// Expanded HFT, option analytics, and quantitative-strategy chapters, designed for first-time readers.
export const MORE_TOPICS_4=[
  {
    "id": "quant-topic-10-08",
    "module": 9,
    "index": 8,
    "title": "Exchange messaging protocols",
    "concept": "An exchange feed and order gateway follow specific rules for message layout, sequence and acknowledgments. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A parser must decode the right instrument, side and quantity before a trading decision.",
    "caution": "Protocol fields differ by exchange and must not be guessed.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-09",
    "module": 9,
    "index": 9,
    "title": "UDP versus TCP in feeds",
    "concept": "UDP favors low-overhead datagrams; TCP provides ordered byte delivery with reliability mechanisms. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A multicast market-data feed may use UDP while an order connection uses TCP.",
    "caution": "Transport choice does not by itself guarantee accurate or timely market state.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-10",
    "module": 9,
    "index": 10,
    "title": "Multicast market-data delivery",
    "concept": "Multicast can distribute one data stream to many listeners on a network. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Several trading engines may subscribe to the same market-data group.",
    "caution": "Packet loss or incorrect group configuration can cause silent missing updates.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-11",
    "module": 9,
    "index": 11,
    "title": "Packet capture and replay",
    "concept": "Recording raw packets allows engineers to reproduce a feed problem later. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Replay the exact received messages that preceded an incorrect bid–ask book.",
    "caution": "A replay must preserve ordering and timestamps to be a fair diagnosis.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-12",
    "module": 9,
    "index": 12,
    "title": "Snapshot recovery",
    "concept": "After a feed gap, a fresh snapshot can rebuild a complete book before applying new changes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "If order updates 201 and 203 arrive without 202, the engine can invalidate the book and resynchronize.",
    "caution": "Applying updates in the wrong order can produce a plausible but incorrect book.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-13",
    "module": 9,
    "index": 13,
    "title": "Duplicate-event handling",
    "concept": "Networks can resend or repeat a message, so processing must be idempotent when required. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A duplicated fill acknowledgment should not double a position change.",
    "caution": "Not all event types use one simple ID; inspect the venue's protocol.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-14",
    "module": 9,
    "index": 14,
    "title": "Bounded ring buffers",
    "concept": "A ring buffer holds items in reusable slots rather than allocating memory for each event. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A producer writes market updates into fixed slots while a consumer processes them.",
    "caution": "A full buffer needs a defined overflow policy; dropping stateful updates is dangerous.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-15",
    "module": 9,
    "index": 15,
    "title": "Backpressure and overload",
    "concept": "Backpressure occurs when incoming events arrive faster than the system can process them. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A feed spikes to 100,000 updates per second while a strategy handles only 60,000.",
    "caution": "Queue buildup increases latency and may make signals trade on stale prices.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-16",
    "module": 9,
    "index": 16,
    "title": "Cache lines and memory locality",
    "concept": "CPUs read nearby memory together, so contiguous data can reduce processing stalls. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A compact order-book array may access fewer memory locations than scattered objects.",
    "caution": "Micro-optimizations must be measured on representative workloads.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-17",
    "module": 9,
    "index": 17,
    "title": "False sharing between threads",
    "concept": "Threads can slow each other when they modify unrelated values on the same CPU cache line. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Two counters stored side by side may trigger repeated cache-line transfers.",
    "caution": "Padding memory to avoid false sharing can waste capacity if overused.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-18",
    "module": 9,
    "index": 18,
    "title": "Lock contention",
    "concept": "Locks protect shared state but waiting for a lock adds unpredictable delay. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A feed thread and order thread sharing one large mutex may block each other.",
    "caution": "Lock-free alternatives are complex and can introduce correctness bugs.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-19",
    "module": 9,
    "index": 19,
    "title": "NUMA architecture",
    "concept": "On multi-socket machines, memory can be faster for a nearby CPU than a remote one. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Pinning a worker and its data to the same NUMA node can reduce access time.",
    "caution": "Pinning assumptions may harm performance when system load changes.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-20",
    "module": 9,
    "index": 20,
    "title": "Zero-copy techniques",
    "concept": "Zero-copy avoids unnecessary memory copying when moving market messages through a pipeline. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A parser may read from a shared network buffer without making a second full copy.",
    "caution": "Buffer lifetime and ownership bugs can corrupt data in subtle ways.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-21",
    "module": 9,
    "index": 21,
    "title": "Hardware timestamping",
    "concept": "A network card can timestamp messages closer to where they enter a machine. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Compare NIC arrival with parser completion to estimate local processing delay.",
    "caution": "Different clock domains must be synchronized before subtracting timestamps.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-22",
    "module": 9,
    "index": 22,
    "title": "Clock drift and PTP",
    "concept": "Precise Time Protocol can align clocks for meaningful timestamp comparisons. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A clock offset of 200 microseconds can be larger than the code path being measured.",
    "caution": "Synchronization quality varies and must be monitored continuously.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-23",
    "module": 9,
    "index": 23,
    "title": "Tail-latency diagnostics",
    "concept": "Median latency can look healthy even while rare events are dangerously slow. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A system processes most events in 30 microseconds but 1% take 3 milliseconds.",
    "caution": "Always state measurement boundaries and number of samples for p99 results.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-24",
    "module": 9,
    "index": 24,
    "title": "Deterministic simulation",
    "concept": "A deterministic simulator replays a fixed event sequence to reproduce decisions. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "The same saved market events should produce the same order-intent log under a fixed model.",
    "caution": "Live networks, clocks and execution introduce behavior absent from a local replay.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-25",
    "module": 9,
    "index": 25,
    "title": "Failover and recovery",
    "concept": "Failover transfers processing to a backup when the primary system is unhealthy. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A backup trading engine must know outstanding orders before resuming submission.",
    "caution": "Two active engines without coordination can accidentally duplicate exposure.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-26",
    "module": 9,
    "index": 26,
    "title": "Order-rate throttles",
    "concept": "Rate throttles cap message volume to avoid exceeding broker or venue limits. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A gateway might allow at most a configured number of new orders per second.",
    "caution": "Real exchange rate rules vary; throttles need separate cancellation handling.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-10-27",
    "module": 9,
    "index": 27,
    "title": "Safe release and rollback",
    "concept": "Production changes need versioning, canary tests and a fast return to the last known-good engine. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Roll out a new parser to a monitored test stream before enabling its order gateway.",
    "caution": "A passing unit test cannot verify every production feed and venue condition.",
    "connection": "This extends HFT Infrastructure & Low-Latency Systems. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-08",
    "module": 10,
    "index": 8,
    "title": "Spot and forward moneyness",
    "concept": "Option moneyness compares the underlying reference price with the strike. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A call with spot 110 and strike 100 is in the money by 10 at that moment.",
    "caution": "Forward prices and dividends can matter more than spot for longer expiries.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-09",
    "module": 10,
    "index": 9,
    "title": "Put-call parity",
    "concept": "European calls and puts with matching strike and expiry are linked through forward value and discounting. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A synthetic long forward combines a long call and short put at the same strike.",
    "caution": "Dividends, exercise style, financing and trading costs change practical relationships.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-10",
    "module": 10,
    "index": 10,
    "title": "Dividend effects on options",
    "concept": "Expected dividends affect forward prices and can change call and put valuations. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A large expected dividend can reduce the forward stock price relevant to a future call.",
    "caution": "Ex-dividend dates and uncertain payout amounts create modeling risk.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-11",
    "module": 10,
    "index": 11,
    "title": "Early exercise and assignment",
    "concept": "Some options may be exercised before expiry, creating unexpected stock or cash positions. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A short American call near an ex-dividend date may face early assignment.",
    "caution": "European and cash-settled contracts follow different exercise rules.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-12",
    "module": 10,
    "index": 12,
    "title": "Volatility term structures",
    "concept": "Options with different expiries can imply different volatility levels. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "An earnings-week option may imply more movement than a contract expiring months later.",
    "caution": "Comparing raw annualized IV without isolating event windows can mislead.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-13",
    "module": 10,
    "index": 13,
    "title": "Event volatility",
    "concept": "Scheduled announcements can concentrate expected movement in a short time. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "An option expiring just after an earnings release may have a higher implied premium.",
    "caution": "The announcement can produce less or more movement than the premium implies.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-14",
    "module": 10,
    "index": 14,
    "title": "Put skew and downside insurance",
    "concept": "Out-of-the-money puts can have higher implied volatility because investors value crash protection. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A 90-strike put may carry higher IV than a 110-strike call.",
    "caution": "Skew varies by asset, expiry and market regime.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-15",
    "module": 10,
    "index": 15,
    "title": "Risk reversals",
    "concept": "A risk reversal compares a call and a put with similar delta magnitudes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "The IV gap between a 25-delta call and put summarizes directional skew.",
    "caution": "Contract conventions and option deltas must match before comparison.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-16",
    "module": 10,
    "index": 16,
    "title": "Butterfly volatility measures",
    "concept": "A volatility butterfly compares wing implied volatilities with the middle quote. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A steep smile can have expensive out-of-the-money options on both sides.",
    "caution": "A butterfly measure is not automatically a tradable arbitrage.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-17",
    "module": 10,
    "index": 17,
    "title": "Vanna exposure",
    "concept": "Vanna describes how option delta may change when implied volatility moves. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A delta hedge can become less accurate after a sharp IV shift even with little spot movement.",
    "caution": "Different pricing models give different vanna estimates.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-18",
    "module": 10,
    "index": 18,
    "title": "Charm exposure",
    "concept": "Charm describes how delta changes as time passes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A near-expiry option's hedge requirement can shift as the clock runs down.",
    "caution": "Clock effects interact with price jumps and shifting implied volatility.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-19",
    "module": 10,
    "index": 19,
    "title": "Volatility-of-volatility",
    "concept": "Vol-of-vol measures how much the volatility level itself changes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A short-vega book can suffer when IV jumps from 20% to 35%.",
    "caution": "The historical volatility of IV is not a guaranteed limit on its future move.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-20",
    "module": 10,
    "index": 20,
    "title": "Realized volatility windows",
    "concept": "Realized volatility depends on observation frequency and lookback window. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A five-day realized estimate can differ sharply from a 60-day estimate.",
    "caution": "Intraday noise, jumps and overnight returns need consistent treatment.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-21",
    "module": 10,
    "index": 21,
    "title": "Variance swaps",
    "concept": "A variance swap exchanges a fixed variance strike against realized variance under specified rules. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "The payout depends on squared realized movement, making large jumps especially important.",
    "caution": "Caps, sampling rules and counterparty exposure alter the contractual payoff.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-22",
    "module": 10,
    "index": 22,
    "title": "Gamma scalping intuition",
    "concept": "A trader hedging a long-gamma option repeatedly adjusts stock positions as price moves. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Buying stock after a delta falls and selling after it rises can benefit from price oscillation.",
    "caution": "Theta decay, spreads and trends can overwhelm theoretical hedging gains.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-23",
    "module": 10,
    "index": 23,
    "title": "Delta neutral versus vega neutral",
    "concept": "Delta neutrality targets a small spot move; vega neutrality targets an IV change. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Two option portfolios can have zero delta yet very different sensitivity to IV.",
    "caution": "Neutrality at one instant is not riskless after price, time and IV move.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-24",
    "module": 10,
    "index": 24,
    "title": "Expiry pin and settlement risk",
    "concept": "Prices near strikes at expiry can create uncertain exercise, assignment and hedge outcomes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A stock close very near a strike may leave the final stock position uncertain.",
    "caution": "Exchange settlement prices and exercise deadlines control actual outcomes.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-25",
    "module": 10,
    "index": 25,
    "title": "Option bid-ask and depth",
    "concept": "An attractive theoretical option value is irrelevant if the available market is wide. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A theoretical value of ₹10 with bid ₹8 and ask ₹12 offers no immediate ₹10 fill.",
    "caution": "Displayed depth can disappear, particularly during volatile periods.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-26",
    "module": 10,
    "index": 26,
    "title": "Dealer gamma inference limits",
    "concept": "Public open interest does not tell who owns every option or how it is hedged. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Large call open interest could include both long and short dealer positions.",
    "caution": "A published gamma-flip estimate is model-dependent, not an observed dealer fact.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-11-27",
    "module": 10,
    "index": 27,
    "title": "Joint spot and IV shocks",
    "concept": "Option risk should be tested under simultaneous underlying-price and IV changes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A falling stock and rising put IV can worsen a short-put position together.",
    "caution": "Greek approximations may fail for large discontinuous shocks.",
    "connection": "This extends Options, Volatility & Market Making. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-08",
    "module": 11,
    "index": 8,
    "title": "Survivorship bias",
    "concept": "A historical stock list may omit firms that delisted, failed or merged. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Testing today's top 100 stocks in 2018 excludes some past losers.",
    "caution": "Use a point-in-time universe rather than today's winners.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-09",
    "module": 11,
    "index": 9,
    "title": "Point-in-time fundamentals",
    "concept": "A financial ratio is tradable only after the underlying report became publicly available. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A March-quarter result announced in May cannot inform an April signal.",
    "caution": "Revised datasets often overwrite the originally available value.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-10",
    "module": 11,
    "index": 10,
    "title": "Publication-lag features",
    "concept": "Economic and company data reach traders later than the period they describe. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "April inflation statistics may be released in May, not at April month-end.",
    "caution": "Date labels must distinguish observation dates from release timestamps.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-11",
    "module": 11,
    "index": 11,
    "title": "Multiple-testing bias",
    "concept": "Testing many strategies increases the chance that one looks successful by luck. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Among 1,000 random signals, some can have impressive backtests by chance.",
    "caution": "A lucky winner needs an untouched final test and uncertainty analysis.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-12",
    "module": 11,
    "index": 12,
    "title": "Parameter sensitivity",
    "concept": "A robust idea should not collapse when one harmless threshold changes. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A moving average strategy working at 19 days but failing at 18 and 20 is suspect.",
    "caution": "Wide performance plateaus do not prove the signal survives trading costs.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-13",
    "module": 11,
    "index": 13,
    "title": "Selection and delisting rules",
    "concept": "A historical test needs eligibility, suspension and delisting rules matching the period. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A company that ceased trading must not simply disappear from portfolio losses.",
    "caution": "Data-vendor coverage differences can introduce invisible biases.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-14",
    "module": 11,
    "index": 14,
    "title": "Exchange calendar alignment",
    "concept": "Different markets have holidays, closing times and daylight-saving rules. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A US close cannot be assumed available to an Indian strategy earlier that same day.",
    "caution": "Improper timezone conversion can create look-ahead information.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-15",
    "module": 11,
    "index": 15,
    "title": "Corporate-action accounting",
    "concept": "Backtests must process splits, dividends, spin-offs and symbol changes consistently. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "After a split, quantity and adjusted cost basis change together.",
    "caution": "Applying corporate-action adjustments twice creates false profits.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-16",
    "module": 11,
    "index": 16,
    "title": "OHLC bar ambiguity",
    "concept": "A candle reports high and low but not the exact sequence within the period. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "If both stop and target fit inside a minute bar, the order of fills is unknown.",
    "caution": "Assuming the winning trigger happened first is optimistic bias.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-17",
    "module": 11,
    "index": 17,
    "title": "Volume participation constraints",
    "concept": "A small backtest may appear profitable at trade sizes the market could never absorb. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A strategy buying 20% of a thin stock's daily volume needs impact analysis.",
    "caution": "Historical turnover does not guarantee immediately available depth.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-18",
    "module": 11,
    "index": 18,
    "title": "Limit order fill simulation",
    "concept": "A limit price touched in historical data does not mean your resting order filled. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A candle low of ₹100 can occur without enough volume reaching your queued ₹100 order.",
    "caution": "Order position, cancellations and partial fills matter.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-19",
    "module": 11,
    "index": 19,
    "title": "Execution delay sensitivity",
    "concept": "Signals decay while data travels and orders wait to be executed. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A model profitable at instant fills may lose when entry is delayed 500 milliseconds.",
    "caution": "Delay assumptions should match the planned instrument and system.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-20",
    "module": 11,
    "index": 20,
    "title": "Slippage stress tests",
    "concept": "Backtests should check what happens when trading is more expensive than expected. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "An average edge of 12 bps disappears when slippage increases from 5 to 15 bps.",
    "caution": "A fixed cost estimate can understate costs during fast markets.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-21",
    "module": 11,
    "index": 21,
    "title": "Turnover and capacity",
    "concept": "Turnover measures trading activity; capacity measures how much capital can use the strategy before costs erode it. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "A daily-rebalanced small-cap model may work for ₹1 lakh but not ₹10 crore.",
    "caution": "Capacity depends on market conditions, liquidity and order execution.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-22",
    "module": 11,
    "index": 22,
    "title": "Compounded versus summed P&L",
    "concept": "Adding trade percentages does not describe a portfolio that reinvests capital. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Two gains of 10% turn ₹100 into ₹121, a 21% compound gain.",
    "caution": "Overlapping positions and leverage need cash-aware portfolio accounting.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-23",
    "module": 11,
    "index": 23,
    "title": "Bootstrapped strategy paths",
    "concept": "Resampling trading outcomes can illustrate uncertainty in drawdown sequences. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Shuffle simulated weekly blocks and compare the resulting worst drawdowns.",
    "caution": "Resampling assumptions may destroy real serial dependence or event clusters.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-24",
    "module": 11,
    "index": 24,
    "title": "Walk-forward test windows",
    "concept": "Repeatedly train on past data and evaluate on later data to reveal model instability. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Train on year one, test quarter one of year two, then roll the training window forward.",
    "caution": "A walk-forward result can still be overfit through repeated strategy searches.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-25",
    "module": 11,
    "index": 25,
    "title": "Stress regimes and market halts",
    "concept": "Strategies should be tested in high-volatility days, illiquid periods and exchange interruptions. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "An intraday signal can be trapped when the market halts before its exit.",
    "caution": "Historical crisis windows may not cover the next type of market failure.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-26",
    "module": 11,
    "index": 26,
    "title": "Paper-to-live reconciliation",
    "concept": "Paper trading checks signal logic; live fills test practical execution under real constraints. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Compare intended order size with accepted, partially filled and canceled quantities.",
    "caution": "Paper accounts cannot model every queue, fee and market-impact condition.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  },
  {
    "id": "quant-topic-12-27",
    "module": 11,
    "index": 27,
    "title": "Post-trade research journal",
    "concept": "Keeping a structured record of predictions and outcomes helps improve models responsibly. Start with the meaning and then look at how this behaves in a real trading or engineering workflow.",
    "example": "Log signal time, input version, decision, actual fill, costs and reason for deviations.",
    "caution": "Do not rewrite the original hypothesis after seeing the outcome.",
    "connection": "This extends Quant Strategy Research & Backtesting. Use the example to explain the mechanism in plain language, then name a failure case or operational safeguard before trusting the result."
  }
];
