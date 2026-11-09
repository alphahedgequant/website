// Public evergreen editorial research. No paid data, tokens, live prices or user inputs.
// Educational material: worked examples are intentionally hypothetical.
// No date is automatically rewritten just to make articles appear newer.
export const LIBRARY_PUBLISHED="2026-11-09";
export const RESEARCH_LIBRARY=[
  {
    "slug": "ipo-gmp-vs-listing-gain",
    "category": "ipo",
    "title": "IPO GMP vs Listing Gain: What the Numbers Actually Mean",
    "description": "Understand Indian IPO grey market premium (GMP), implied listing price, actual listing gain, worked examples and why informal quotes can be misleading.",
    "eyebrow": "IPO / PRICE SIGNALS",
    "read": 7,
    "lead": "A grey market premium is an informal expression of interest before listing—not a stock-exchange price and not a forecast you can rely on. Separate that signal from the measurable return when shares actually begin trading.",
    "takeaways": [
      "GMP is an unofficial, off-exchange indication; it can be unrepresentative, unreliable or stale.",
      "An implied listing price is issue price plus reported GMP, not the guaranteed debut price.",
      "Listing gain uses the actual opening or first traded price relative to the final issue price; specify which price you use."
    ],
    "sections": [
      {
        "h": "Three different quantities, three different meanings",
        "p": [
          "The issue price is the final amount paid per allotted share under the IPO terms. Reported grey market premium (GMP) is a non-exchange quotation often discussed before admission to trading. The listing price is the price observed when trading starts; depending on the calculation, analysts may use the opening print, first trade or later close.",
          "Treat each quantity separately. Two websites may quote different GMP figures for the same IPO because the market is informal, participation is opaque and timestamps differ. A positive quotation says nothing reliable about whether you receive an allotment."
        ]
      },
      {
        "h": "Calculate, then interrogate, the implied gain",
        "formula": "Indicative listing price = final issue price + reported GMP\nIndicative premium (%) = reported GMP ÷ issue price × 100\nObserved listing gain (%) = (listing reference price − issue price) ÷ issue price × 100",
        "example": {
          "title": "Illustrative ₹100 IPO",
          "body": "A final issue price of ₹100 with a reported GMP of ₹15 implies ₹115, or an indicative 15% premium. If the share actually opens at ₹107, the observed opening gain is 7%. The eight-percentage-point difference is not a data error: the market is a different venue with different participants and conditions."
        },
        "p": [
          "These calculations ignore taxes, brokerage charges and execution slippage. If you sell at a different price from the opening print, your realized return differs again. No one should use an indicative number as an investable guarantee."
        ]
      },
      {
        "h": "Where GMP is especially easy to misread",
        "bullets": [
          "Timing: a quote from yesterday may be irrelevant after a material market move or change in subscription.",
          "Liquidity and provenance: there is no centralized exchange order book validating the reported informal premium.",
          "Issue details: compare GMP with the final price, not just the top end of an obsolete price band.",
          "Supply and demand: allotment, lock-ups, broader indices and risk sentiment can shift the opening outcome."
        ],
        "p": [
          "A useful research habit is to store the quote timestamp, final issue price, provisional estimate and actual listing price separately. Evaluate forecast error across many listings rather than showcasing only successful examples."
        ]
      },
      {
        "h": "A disciplined reading sequence",
        "p": [
          "Read the offer document first: business model, growth, risks, use of proceeds and pricing. Then check actual subscription and final issue terms. Only after that, inspect any unofficial market indication as a weak supplementary signal.",
          "For current IPO dates and reported data, visit AlphaHedgeQuant IPO Intelligence. The research question is not merely whether an issue lists at a premium, but whether its price and risks make sense under plausible operating outcomes."
        ]
      }
    ],
    "sources": [
      {
        "label": "SEBI Investor — Book-building Process",
        "url": "https://investor.sebi.gov.in/book_building.html"
      },
      {
        "label": "NSE India — Official market data",
        "url": "https://www.nseindia.com/market-data/live-market-indices"
      }
    ],
    "companion": {
      "href": "/ipo",
      "label": "Explore live IPO Intelligence"
    }
  },
  {
    "slug": "ipo-price-band-book-building",
    "category": "ipo",
    "title": "IPO Price Bands and Book Building in India, Explained",
    "description": "How a book-built IPO sets its price band, discovers a cut-off price and allocates shares in India, with a demand-curve example.",
    "eyebrow": "IPO / PRICE DISCOVERY",
    "read": 7,
    "lead": "In a book-built IPO, the issuer does not simply pick a final price and hope investors accept it. Bids within a disclosed price band help establish the price at which the issue can be placed.",
    "takeaways": [
      "The floor and cap define the bidding range; the final issue price is determined later.",
      "The cut-off bid option, where eligible, accepts the final discovered price rather than a specific quoted price.",
      "A bid at or above the final issue price does not ensure allotment when the issue is oversubscribed."
    ],
    "sections": [
      {
        "h": "What the price band does",
        "p": [
          "In a fixed-price offering, the offer price is specified before subscription. In book building, an issuer and its advisers announce a floor and cap and collect bids during the subscription window. The demand schedule informs final pricing within the permitted range.",
          "The draft red herring prospectus (DRHP) introduces the business and risks, while the red herring prospectus (RHP) sets out the offer and bidding details. A final prospectus and exchange notices establish the finalized terms. Always read documents for the particular issue rather than assuming every IPO uses identical mechanics."
        ]
      },
      {
        "h": "The demand curve in one worked example",
        "formula": "Cumulative demand at price P = sum of valid share bids priced at or above P",
        "example": {
          "title": "Hypothetical offer of 1,000 shares",
          "body": "Suppose cumulative eligible demand is 1,500 shares at ₹100, 1,200 at ₹105 and 800 at ₹110. Under this stylized illustration, ₹105 is the highest price among those shown that can cover the 1,000-share offer. The actual discovery procedure depends on offer rules, investor categories and valid bids."
        },
        "p": [
          "Price discovery is not the same as valuation. An IPO might price successfully with strong demand even if its implied earnings multiple embeds optimistic assumptions. A high cut-off alone is not proof that subsequent returns will be positive."
        ]
      },
      {
        "h": "Cut-off bidding and allotment are separate decisions",
        "bullets": [
          "An eligible retail investor using the cut-off option agrees to pay the finally determined issue price subject to the application terms.",
          "A specific-price bid below the discovered price can become ineligible.",
          "Valid bids can still receive no allotment or a smaller allocation when demand exceeds the shares available to that category.",
          "Rules can differ for SME IPOs, anchor investors and other categories; consult the offer document."
        ],
        "p": [
          "The price band and lot size help you estimate blocked application capital, but allocation probabilities cannot be determined from one aggregate subscription ratio."
        ]
      },
      {
        "h": "What to inspect before applying",
        "p": [
          "Record the issue size, share split between fresh issue and offer for sale, proceeds to the issuer, category reservation, bid lots, final listing venue and risk factors. Compare the issue valuation to peers using consistent accounting definitions.",
          "A useful question is what revenue growth, reinvestment and margins must occur for the issue price to be justified—not just how many times the book is subscribed."
        ]
      }
    ],
    "sources": [
      {
        "label": "SEBI Investor — Book-building Process",
        "url": "https://investor.sebi.gov.in/book_building.html"
      }
    ],
    "companion": {
      "href": "/ipo",
      "label": "Compare upcoming IPO terms"
    }
  },
  {
    "slug": "ipo-subscription-allotment",
    "category": "ipo",
    "title": "IPO Subscription, Oversubscription and Share Allotment",
    "description": "Learn how IPO subscription multiples are calculated, how allotment differs by investor category, and why 20× subscription does not imply a 5% allotment probability.",
    "eyebrow": "IPO / DEMAND & ALLOTMENT",
    "read": 7,
    "lead": "A headline subscription number is a demand ratio, not a probability model for any individual application. It needs context: category, share count, valid bids and allocation rules.",
    "takeaways": [
      "Subscription multiple is bid demand divided by shares offered within the relevant pool.",
      "Overall subscription can mask differences between retail, institutional and non-institutional portions.",
      "Allotment depends on the rules, valid bids and lot-size allocation—not a simple 1 ÷ headline subscription calculation."
    ],
    "sections": [
      {
        "h": "Calculate the demand multiple correctly",
        "formula": "Subscription multiple = eligible shares bid ÷ shares available in that category",
        "example": {
          "title": "Illustrative 4× subscription",
          "body": "A category with 2 million shares available and valid bids for 8 million shares is subscribed 4×. That does not mean every bidder receives one-quarter of the shares requested. Allotment and investor eligibility operate under separate rules."
        },
        "p": [
          "Official reported totals can change throughout the offer period. A 2× reading at noon is not the final closing multiple, and cancellation or validation adjustments can alter the count. Timestamp every quote you use."
        ]
      },
      {
        "h": "Why category-level analysis matters",
        "p": [
          "Offer documents specify how shares are reserved or allocated among eligible groups such as retail individual investors, qualified institutional buyers and non-institutional investors. The overall multiple adds demand across pools that may have different allotment processes.",
          "For a retail lot application, the number of valid applicants and the available minimum lots are often more informative than a headline overall multiplier. An exact allotment probability cannot be inferred from published aggregate numbers alone."
        ]
      },
      {
        "h": "Interpreting strong demand without overclaiming",
        "bullets": [
          "Compare each category's demand to its own allocation rather than only total demand.",
          "Distinguish qualified bids, applications and shares requested; these are not interchangeable counts.",
          "Check whether anchor placements are part of the displayed statistic.",
          "Look for changes during the subscription window, not just a single snapshot.",
          "Do not equate oversubscription with intrinsic business value or a certain listing profit."
        ],
        "p": [
          "Demand can reflect distribution, sentiment, valuations, investor mandates and expectations of a near-term listing move. These forces can diverge from longer-term earnings outcomes."
        ]
      },
      {
        "h": "After the offer closes",
        "p": [
          "Follow the registrar's official allotment status, the final issue announcement and the exchange's listing information. If allotment is not received, the relevant blocked funds should be released under the application process.",
          "For a complete reading, combine the demand information with the company's prospectus, valuation and cash-generation assumptions. Treat GMP as unofficial commentary rather than validated demand evidence."
        ]
      }
    ],
    "sources": [
      {
        "label": "SEBI Investor — Book Building and Allotment",
        "url": "https://investor.sebi.gov.in/book_building.html"
      },
      {
        "label": "SEBI Investor — Applying via ASBA",
        "url": "https://investor.sebi.gov.in/ipo_through_asba.html"
      }
    ],
    "companion": {
      "href": "/ipo",
      "label": "Follow IPO subscriptions"
    }
  },
  {
    "slug": "ipo-asba-upi-process",
    "category": "ipo",
    "title": "ASBA and UPI for IPOs: How Fund Blocking Works",
    "description": "Understand ASBA and UPI IPO application funding in India, the difference between blocked and debited money, and why an accepted mandate is not allotment.",
    "eyebrow": "IPO / APPLICATION PROCESS",
    "read": 6,
    "lead": "ASBA is designed so that application money is blocked rather than paid to the issuer immediately. A successful UPI mandate confirms a funding step; it does not promise shares.",
    "takeaways": [
      "ASBA stands for Application Supported by Blocked Amount.",
      "Money ordinarily stays blocked in your bank account until the application is settled or released.",
      "Check the correct mandate, deadline, broker/registrar status and final allotment separately."
    ],
    "sections": [
      {
        "h": "Blocked does not mean spent",
        "p": [
          "Under ASBA, the bank earmarks funds supporting an IPO application. The account retains the money, but the blocked amount is not freely available for other payments. If shares are allotted, the required amount is debited; if no shares are allotted, the relevant block is released.",
          "The process differs from sending the full amount away at the moment of application. An account balance may still show the funds even while the available balance is reduced. Read your bank's transaction description before interpreting it as a charge or refund."
        ]
      },
      {
        "h": "Where UPI fits into the process",
        "p": [
          "Eligible applications may use UPI as the payment authorization method. An investor submits the application through an approved intermediary and then authorizes a matching mandate in the supported UPI application. The mandate should show the appropriate IPO and amount.",
          "A mandate that was not approved, arrived late, expired or failed may leave the application incomplete. Successful mandate approval is not the same event as bid validation, allotment or listing. Always check status through the broker, bank, registrar and relevant official records."
        ]
      },
      {
        "h": "A practical application checklist",
        "bullets": [
          "Confirm the offer dates, lot size, application category and price terms in the official documents.",
          "Match the mandate amount and IPO name before approval; reject unexpected requests.",
          "Use the supported account and payment method for your category.",
          "Verify that the application and mandate actually reached an accepted state before the applicable deadline.",
          "After allotment, reconcile the debit, release of excess block and shares received."
        ],
        "p": [
          "Never rely solely on a social-media message claiming that allotment is guaranteed or requiring a transfer to a personal account. The legitimate application flow should be traceable through regulated intermediaries."
        ]
      },
      {
        "h": "Example of a partially filled application",
        "example": {
          "title": "Hypothetical blocked ₹28,000",
          "body": "An investor authorizes a ₹28,000 block for a valid IPO application. If the final allocation requires ₹14,000, that amount is debited and the remaining ₹14,000 should be unblocked subject to bank/registrar processing. If there is no allotment, the block should be released rather than treated as a permanent payment."
        },
        "p": [
          "Exact time frames, monetary limits, lot sizes and eligibility can change. Always rely on the specific issuer's documents and current SEBI/market guidance."
        ]
      }
    ],
    "sources": [
      {
        "label": "SEBI Investor — Apply in IPO Through ASBA",
        "url": "https://investor.sebi.gov.in/ipo_through_asba.html"
      }
    ],
    "companion": {
      "href": "/ipo",
      "label": "Explore current IPOs"
    }
  },
  {
    "slug": "how-to-read-ipo-drhp-valuation",
    "category": "ipo",
    "title": "How to Read an IPO DRHP: Valuation, Risk and Cash Flows",
    "description": "A fundamentals-first DRHP checklist covering fresh issue vs OFS, use of proceeds, customer concentration, earnings quality, IPO valuation and risk factors.",
    "eyebrow": "IPO / FUNDAMENTAL RESEARCH",
    "read": 9,
    "lead": "A prospectus is not only a growth narrative. It is the starting point for reconciling how the company makes money, who receives the IPO proceeds and what assumptions the offer price needs to justify.",
    "takeaways": [
      "Fresh-issue proceeds may fund the business; offer-for-sale proceeds go to selling holders, subject to offer terms.",
      "Profit and cash flow are different; inspect working-capital intensity, debt, capex and related-party transactions.",
      "A valuation multiple is meaningful only alongside peer comparability, growth, margins, capital returns and risk."
    ],
    "sections": [
      {
        "h": "Start with the transaction, not the story",
        "p": [
          "Identify whether the IPO consists of new shares, shares sold by existing shareholders, or both. Fresh equity may bring cash onto the company's balance sheet; an offer for sale (OFS) generally transfers ownership and does not give the issuer the same proceeds.",
          "Read the stated use of proceeds and the schedule for spending the cash. Debt repayment, expansion capex and working capital can have very different implications for return on invested capital and future dilution."
        ]
      },
      {
        "h": "Reconstruct the economic engine",
        "bullets": [
          "Revenue: separate volume, price, acquisitions and one-off drivers.",
          "Margins: distinguish sustainable operating improvement from temporary input-cost benefits.",
          "Cash conversion: compare cash flow from operations to reported profit over multiple years.",
          "Balance sheet: examine receivables, inventory, contingent liabilities, guarantees and debt maturity.",
          "Concentration: identify major customers, suppliers, geographic markets and promoter dependencies where disclosed."
        ],
        "p": [
          "If a business reports rapid sales growth but receivables and inventory grow even faster, ask whether revenue is converting to cash. Read the accounting policies and auditor observations before concluding that reported earnings represent repeatable cash earnings."
        ]
      },
      {
        "h": "Reverse-engineer the asking price",
        "formula": "Indicative P/E = implied equity value at issue price ÷ comparable annual net earnings\nEV/EBITDA = (equity value + net debt + other relevant claims) ÷ comparable EBITDA",
        "example": {
          "title": "Hypothetical valuation check",
          "body": "If the post-issue equity value is ₹1,200 crore and consistent annual profit is ₹80 crore, the headline P/E is 15×. That ratio alone cannot establish cheapness: a concentrated business with low cash conversion and cyclical profits is not equivalent to a diversified peer at 15×."
        },
        "p": [
          "Be precise about post-issue share count, fully diluted securities, minority interests, lease/debt adjustments and whether an earnings number is one-off. Forecasting should connect growth to reinvestment and operating margins, not assume profits rise automatically with revenue."
        ]
      },
      {
        "h": "A decision journal for every issue",
        "p": [
          "Write down what must happen over three to five years for the current valuation to make sense. Include a base, upside and downside operating case and the assumptions that would invalidate each.",
          "Keep the record independent of GMP excitement. A good long-term investment and a short-term listing gain are different hypotheses; one need not imply the other."
        ]
      }
    ],
    "sources": [
      {
        "label": "SEBI Investor — IPO Book-building and Offer Documents",
        "url": "https://investor.sebi.gov.in/book_building.html"
      }
    ],
    "companion": {
      "href": "/ipo",
      "label": "See IPO dates and issue terms"
    }
  },
  {
    "slug": "options-greeks-delta-gamma-theta-vega",
    "category": "quant",
    "title": "Options Greeks: Delta, Gamma, Theta and Vega Explained",
    "description": "A practical explanation of option delta, gamma, theta and vega with a price-change approximation, portfolio aggregation and model-risk caveats.",
    "eyebrow": "QUANT / DERIVATIVES",
    "read": 9,
    "lead": "An option is a nonlinear exposure to price, time and implied volatility. Greeks are local sensitivities—not independent predictions of how a traded contract will reprice.",
    "takeaways": [
      "Delta describes the option's local premium change for a one-unit move in the underlying, holding other inputs fixed.",
      "Gamma describes how delta itself changes with spot; theta and vega capture time and volatility sensitivity under stated conventions.",
      "Greeks depend on models, quote conventions, units, contract multipliers and dynamically changing assumptions."
    ],
    "sections": [
      {
        "h": "Start from an option price function",
        "formula": "V = V(S, K, T, σ, r, q)\nDelta = ∂V/∂S; Gamma = ∂²V/∂S²\nVega = ∂V/∂σ; Theta = ∂V/∂t",
        "p": [
          "Think of the model value as a surface across underlying price S, strike K, time to expiry T, implied volatility σ, rates r and dividends q. The Greek is a local derivative of that surface at one point.",
          "Delta is often reported per 1 currency-unit move in the underlying. Gamma is the change in delta per spot unit. Vega might be quoted per one volatility percentage point, while theta is commonly expressed per day; those units must be checked before adding positions."
        ]
      },
      {
        "h": "Second-order price change and why it matters",
        "formula": "Approximate ΔV ≈ Delta × ΔS + ½ × Gamma × (ΔS)² + Vega × Δσ + Theta × Δt",
        "example": {
          "title": "Hypothetical local estimate",
          "body": "Suppose a call's delta is 0.55 and gamma is 0.015 per ₹1. If the stock moves up ₹2 with other inputs held fixed, the delta-plus-gamma approximation is 0.55 × 2 + 0.5 × 0.015 × 4 = ₹1.13 per share of option premium. This is an approximation, not a fillable quote."
        },
        "p": [
          "The approximation can deteriorate for large spot moves, earnings events, sharp volatility changes and very short expiries. Cross-effects (such as vanna and charm) can also matter."
        ]
      },
      {
        "h": "From one option to a portfolio",
        "p": [
          "Multiply each Greek by signed contract quantity and lot size before aggregating. A short call reverses the sign of the call's Greek. A spread may have modest net delta but material gamma or gap risk.",
          "Do not assume a net-zero delta portfolio is riskless. As spot moves, gamma changes delta and hedges need adjusting; liquidity, bid/ask spread, slippage and exchange margin may dominate a theoretical payoff."
        ]
      },
      {
        "h": "What to check on an option desk",
        "bullets": [
          "Underlying spot and forward reference, strike and exact expiry.",
          "Price source, quote timestamp and implied volatility model convention.",
          "Per-lot versus per-share units for delta, gamma, vega and theta.",
          "Whether Greeks reflect dividend, interest rate and settlement assumptions.",
          "Scenario analysis beyond the local Greek approximation."
        ],
        "p": [
          "An IV surface or strategy payoff chart is most useful when the underlying assumptions and risk limits are visible alongside the attractive headline metric."
        ]
      }
    ],
    "sources": [
      {
        "label": "Options Industry Council — Understanding Options Greeks",
        "url": "https://prd-web.optionseducation.org/advancedconcepts/understanding-options-greeks"
      }
    ],
    "companion": {
      "href": "/options",
      "label": "Open Options Analytics"
    }
  },
  {
    "slug": "implied-volatility-rank-percentile",
    "category": "quant",
    "title": "IV Rank vs IV Percentile: What High Implied Volatility Means",
    "description": "Compare implied volatility rank and percentile, with explicit formulas, a worked lookback example, skew and event-risk considerations.",
    "eyebrow": "QUANT / VOLATILITY",
    "read": 8,
    "lead": "When a trader says implied volatility is high, the essential question is: high relative to what? IV Rank, IV Percentile and absolute implied volatility answer different questions.",
    "takeaways": [
      "IV Rank scales the latest IV between a lookback minimum and maximum.",
      "IV Percentile counts the proportion of observations below the current reading; it is a frequency measure.",
      "High IV can reflect genuine event risk and does not by itself make an option short attractive."
    ],
    "sections": [
      {
        "h": "IV comes from an option pricing model",
        "p": [
          "Implied volatility is the volatility input that makes an option pricing model match an observed option price. It is not a direct measurement of future realized volatility and depends on pricing model, rates, dividends, quote quality and exercise/settlement features.",
          "When comparing history, choose a consistent instrument definition: for example, a 30-day constant-maturity at-the-money implied volatility series. Mixing strikes, maturities and models can manufacture false changes."
        ]
      },
      {
        "h": "Two statistics that are frequently confused",
        "formula": "IV Rank (%) = 100 × (current IV − lookback low) ÷ (lookback high − lookback low)\nIV Percentile (%) = 100 × [count of past IV observations below current IV] ÷ [number of observations]",
        "example": {
          "title": "Four-observation toy sample",
          "body": "For observations 20%, 25%, 30%, 40% and a current IV of 25%, IV Rank is (25 − 20) / (40 − 20) × 100 = 25%. Strictly-below IV Percentile is 1 / 4 = 25%. A different data distribution can give radically different values even if the rank is unchanged."
        },
        "p": [
          "Percentile conventions vary, particularly with ties and whether the current observation is included. If the high and low are equal, IV Rank's denominator is zero: display not available rather than divide by zero."
        ]
      },
      {
        "h": "Why 'high IV = sell' is incomplete",
        "p": [
          "An option may have expensive-looking volatility because a corporate announcement, expiry, policy event or discontinuous jump is approaching. Collecting premium exposes a seller to nonlinear losses and potentially fast gamma expansion.",
          "A useful comparison pairs model-implied dispersion with a carefully specified realized-volatility forecast, bid/ask costs, strike skew, term structure and portfolio stress tests. Selling volatility based on a lookback rank alone is a rule of thumb, not a complete strategy."
        ]
      },
      {
        "h": "Better volatility dashboards",
        "bullets": [
          "Show current IV, timestamp, series definition, lookback length and available observations.",
          "Display IV Rank and IV Percentile side by side with clear tie handling.",
          "Plot skew and term structure, not only one ATM number.",
          "Separate historical backtest performance from live market conditions.",
          "Add shock scenarios for spot jumps and implied-volatility repricing."
        ],
        "p": [
          "A high percentile is an invitation to ask what changed in the risk distribution, not evidence of an automatic edge."
        ]
      }
    ],
    "sources": [
      {
        "label": "Options Industry Council — Greeks and Volatility",
        "url": "https://prd-web.optionseducation.org/advancedconcepts/understanding-options-greeks"
      }
    ],
    "companion": {
      "href": "/options",
      "label": "Explore volatility analytics"
    }
  },
  {
    "slug": "gamma-exposure-and-gamma-flip",
    "category": "quant",
    "title": "Gamma Exposure and Gamma Flip: A Practical Model",
    "description": "Learn how gamma exposure (GEX) is approximated from option-chain data, why dealer-position signs are unknown, and how to stress-test a gamma-flip level.",
    "eyebrow": "QUANT / MARKET MICROSTRUCTURE",
    "read": 10,
    "lead": "Gamma exposure models try to translate a field of option positions into potential re-hedging pressure. The critical limitation: public open interest usually reveals quantity, not who is long or short.",
    "takeaways": [
      "Gamma measures how an option's delta changes as the underlying moves.",
      "Open interest times unit gamma produces a position-size proxy; the true net dealer sign is not observable from open interest alone.",
      "A gamma flip is model-dependent, sensitive to assumptions and not a universal market turning point."
    ],
    "sections": [
      {
        "h": "Why dealer hedges enter the conversation",
        "p": [
          "If an options book is long gamma, its delta tends to rise when the underlying rises. Delta-neutral hedging commonly requires selling some underlying exposure into a rise and buying into a fall. For short gamma, the direction can reverse. These are conditional mechanical descriptions, not evidence that dealers actually carry the assumed position.",
          "Aggregate dealer inventory is not generally published as a clean signed open-interest figure. Any model assigning call and put positions a fixed sign is an assumption that requires disclosure and sensitivity analysis."
        ]
      },
      {
        "h": "Build a transparent, unit-aware proxy",
        "formula": "GEX proxy per 1% spot move ≈ Σ [assumed position sign × gammaᵢ × OIᵢ × lotSizeᵢ × S² × 0.01]",
        "p": [
          "Here gamma is the option delta change per one unit of underlying price; OI is contracts and S is spot. The result is a scaled delta-value sensitivity under the chosen convention. Not all desks report or normalize GEX the same way—currency, notional and per-point conventions differ.",
          "Calculate gamma with the same model across strikes and expiries. Clean stale or crossed quotes and avoid silently treating missing OI as zero. Show results for several plausible positioning assumptions rather than only the one producing a compelling chart."
        ]
      },
      {
        "h": "What is a gamma-flip level?",
        "p": [
          "A modeled flip level is a hypothetical spot value at which the signed aggregate proxy changes sign after the options are repriced. Recalculate gamma at candidate spot levels, hold other model assumptions explicit, and numerically identify a zero crossing if one exists.",
          "There may be no crossing in a reasonable range. Multiple crossings are possible. Open interest can change intraday, realized dealer positions can depart from your assumptions, and a large move may coincide with changes in implied volatility or expiry. A single crossing is therefore not a guaranteed support or resistance level."
        ]
      },
      {
        "h": "How to validate rather than advertise the model",
        "bullets": [
          "Document sign assumptions and provide alternative-positioning scenarios.",
          "Specify whether OI is previous-day or intraday and which expiries are included.",
          "Recompute gamma under spot and IV shocks; show uncertainty bands around any flip.",
          "Compare model signals with realized order flow and outcomes using out-of-sample periods.",
          "Report failed or unstable estimates rather than forcing a single number."
        ],
        "example": {
          "title": "Interpretation, not a trading trigger",
          "body": "If one scenario produces positive modeled GEX and another produces negative GEX for the same chain, the disagreement is telling you that the unknown position signs dominate the result. The right output is a range of scenarios—not a high-confidence gamma-flip headline."
        }
      }
    ],
    "sources": [
      {
        "label": "Options Industry Council — Understanding Gamma and Greeks",
        "url": "https://prd-web.optionseducation.org/advancedconcepts/understanding-options-greeks"
      }
    ],
    "companion": {
      "href": "/options",
      "label": "Inspect the options chain"
    }
  },
  {
    "slug": "pairs-trading-cointegration",
    "category": "quant",
    "title": "Cointegration and Pairs Trading: From Intuition to Tests",
    "description": "A step-by-step guide to cointegration pairs trading, Engle–Granger testing, hedge ratios, z-scores, mean reversion and out-of-sample validation.",
    "eyebrow": "QUANT / STATISTICAL ARBITRAGE",
    "read": 10,
    "lead": "Two stocks moving together is not enough to justify a mean-reversion trade. Pairs trading asks whether an economically meaningful combination of price series has a stable statistical structure.",
    "takeaways": [
      "Correlation of returns and cointegration of nonstationary price levels are different concepts.",
      "A hedge ratio estimated in-sample is a parameter that can drift, not a permanent physical constant.",
      "Transaction costs, borrow availability, structural breaks and selection bias can erase a seemingly attractive z-score signal."
    ],
    "sections": [
      {
        "h": "Correlation is not a stationary spread",
        "p": [
          "Highly correlated series can drift apart permanently. Cointegration, in the classic setting, concerns individually integrated time series with a linear combination that is stationary. The Engle–Granger framework provides a methodology for estimating a long-run relationship and testing the residual.",
          "Before running a pair strategy, consider the economic relationship between companies, currency adjustments, split/dividend treatment and whether each series has a compatible trading schedule. Statistical significance without an economic story is vulnerable to regime changes."
        ]
      },
      {
        "h": "Estimate and test a hedge ratio",
        "formula": "Estimated spreadₜ = log(Pₐ,ₜ) − α − β log(Pᵦ,ₜ)\nZ-scoreₜ = (spreadₜ − rolling spread mean) ÷ rolling spread standard deviation",
        "p": [
          "Estimate α and β only on the training window. Test the spread for stationarity using an appropriate residual-based critical value; a naive standard ADF test on fitted residuals may require different critical values from those for raw observations.",
          "Z-scores standardize deviations relative to recent history but they do not prove the spread will revert or tell you how long to wait. Calibrate holding periods and execution rules separately."
        ]
      },
      {
        "h": "Illustrate a deviation without pretending it is an edge",
        "example": {
          "title": "Hypothetical standardized spread",
          "body": "Suppose a fitted spread has a training-window mean of 6 and standard deviation of 3, and today's comparable spread reads 12. The standardized deviation is z = (12 − 6) / 3 = +2. That is a descriptive distance, not a guarantee that it will fall tomorrow."
        },
        "p": [
          "If the relationship breaks after an acquisition, regulatory change, liquidity event or sector realignment, the spread may be re-pricing to a new equilibrium rather than offering a mispricing. Trade sizing should anticipate that possibility."
        ]
      },
      {
        "h": "Build an honest out-of-sample experiment",
        "bullets": [
          "Select pairs and estimate the regression using only information available at each decision date.",
          "Re-estimate on rolling windows and avoid retuning thresholds after observing the test set.",
          "Model both legs, borrow costs, market impact, dividends, margin and unfilled orders.",
          "Track maximum drawdown, exposure concentration, time in trade and unstable parameters.",
          "Use walk-forward validation and include pairs that stopped working."
        ],
        "p": [
          "A backtest is most informative when it can tell you why the strategy would fail. A smooth in-sample spread chart by itself is not a tradable conclusion."
        ]
      }
    ],
    "sources": [
      {
        "label": "Engle & Granger (1987) — Co-Integration and Error Correction",
        "url": "https://doi.org/10.2307/1913236"
      }
    ],
    "companion": {
      "href": "/backtest",
      "label": "Explore strategy backtesting"
    }
  },
  {
    "slug": "backtesting-lookahead-survivorship-bias",
    "category": "quant",
    "title": "Backtesting Biases: Look-Ahead, Survivorship and Costs",
    "description": "Identify look-ahead bias, survivorship bias, overfitting and execution slippage in equity backtests; learn how to design a defensible out-of-sample evaluation.",
    "eyebrow": "QUANT / RESEARCH DESIGN",
    "read": 9,
    "lead": "The objective of a backtest is not to generate the smoothest equity curve. It is to estimate whether a decision rule could have been implemented using information genuinely available at the time.",
    "takeaways": [
      "Point-in-time data prevents information published later from leaking into past signals.",
      "Survivorship bias arises when delisted or failed securities are missing from the historical universe.",
      "Net results depend on bid/ask, brokerage, taxes, borrow, turnover and realistically fillable order sizes."
    ],
    "sections": [
      {
        "h": "Point-in-time information is the foundation",
        "p": [
          "Suppose you rank stocks using a company's annual earnings as of a date before the annual report was filed. Even if the financial year has ended, the earnings figure may not have been public. Using it in that historical signal leaks future information.",
          "Corporate actions, index membership, sector classifications, forecasts, financial-statement restatements and revised datasets can all create timing errors. Store release timestamps and enforce a publication lag before permitting a feature into the trading signal."
        ]
      },
      {
        "h": "A current list is not a historical universe",
        "p": [
          "A universe consisting of today's surviving constituents drops companies that delisted, were acquired or failed. Such a sample can overstate historical returns and understate tail losses.",
          "Construct historical investable universes with contemporary membership, liquidity, price and borrow constraints. Corporate-action-adjusted series must be treated consistently; adjusted prices alone do not solve every bias."
        ]
      },
      {
        "h": "Execution changes the measured return",
        "formula": "Net strategy return ≈ gross trading return − commissions − taxes − spread − slippage − financing/borrow",
        "example": {
          "title": "Gross is not net",
          "body": "An illustrative strategy appears to earn 12% over a year. If transaction costs, slippage and financing collectively consume 5 percentage points over that same period, the simplified net return is 7% before any other adjustments. In high-turnover strategies, costs can erase the apparent edge entirely."
        },
        "p": [
          "Model latency, participation limits, auction rules and gaps between intended and actually available execution prices. Minute bars do not reveal every queue position or hidden order book interaction."
        ]
      },
      {
        "h": "Experiment design you can defend",
        "bullets": [
          "Separate exploration, training, validation and a genuinely untouched test period.",
          "Use walk-forward procedures and purge or embargo overlapping event labels where relevant.",
          "Estimate uncertainty, turnover, drawdown, tail losses and parameter sensitivity—not only Sharpe.",
          "Compare to simple benchmarks and disclose the number of strategies and settings tried.",
          "Preserve failed results and data-quality exceptions in an audit trail."
        ],
        "p": [
          "A result that survives realistic frictions and multiple market regimes is more useful than one whose parameters were selected by repeatedly looking at the future."
        ]
      }
    ],
    "sources": [
      {
        "label": "Engle & Granger (1987) — Estimation and Testing Framework",
        "url": "https://doi.org/10.2307/1913236"
      }
    ],
    "companion": {
      "href": "/backtest",
      "label": "Open Quant Backtesting"
    }
  },
  {
    "slug": "position-sizing-volatility-kelly",
    "category": "quant",
    "title": "Position Sizing: Risk Budgets, Volatility Targeting and Kelly",
    "description": "Compare fixed risk per trade, volatility-targeted exposures and Kelly sizing with worked examples, gap risk and model-error safeguards.",
    "eyebrow": "QUANT / PORTFOLIO RISK",
    "read": 9,
    "lead": "The position size often determines whether a model survives long enough to learn from its forecasts. Sizing is a risk-control system, not just an optimization formula.",
    "takeaways": [
      "A fixed cash risk budget depends on the distance to an exit level and may fail across gaps.",
      "Volatility targeting sizes exposure inversely with estimated volatility, subject to leverage and liquidity constraints.",
      "Full Kelly maximizes theoretical logarithmic growth for known distributions, but its estimates are extremely sensitive to edge uncertainty."
    ],
    "sections": [
      {
        "h": "Fixed-fraction risk begins with a loss budget",
        "formula": "Illustrative quantity = (portfolio equity × risk fraction) ÷ abs(entry − planned exit)",
        "example": {
          "title": "₹10 lakh portfolio, 0.5% planned risk",
          "body": "With ₹10,00,000 capital and a 0.5% planned loss budget, the target risk is ₹5,000. Buying at ₹250 with a ₹240 planned stop suggests 500 shares: ₹5,000 ÷ ₹10. The notional purchase is ₹1,25,000. A gap down through ₹240 can produce a larger loss, so the arithmetic is not a maximum-loss guarantee."
        },
        "p": [
          "Check whether enough liquidity exists near the expected exit, and cap the percentage of portfolio value invested. Correlated positions can each meet an individual risk budget while violating the portfolio's aggregate stress limit."
        ]
      },
      {
        "h": "Volatility targeting adjusts exposure to recent risk",
        "formula": "Target exposure weight ≈ target annualized volatility ÷ estimated annualized asset volatility",
        "p": [
          "With a 10% target and a 20% estimated asset volatility, a simplistic standalone target weight is 0.50. But portfolio correlations, cash, leverage, estimation error and non-linear products change realized portfolio risk. A target volatility is an operating constraint, not a promised result.",
          "Volatility estimates rise after markets move, so reactive targeting can sell into stress and buy into calm periods. Use realistic rebalance schedules and hard exposure limits."
        ]
      },
      {
        "h": "Kelly criterion: mathematically appealing, operationally fragile",
        "formula": "Simple binary-bet Kelly fraction f* = p − (1 − p) ÷ b",
        "example": {
          "title": "Theoretical 55% win rate at even money",
          "body": "For p = 0.55 and b = 1 unit gained per unit lost, the classic formula yields f* = 0.10, or 10% of capital. But if the true win rate is only 50%, the theoretical edge disappears. This sensitivity is why uncertainty, drawdowns and leverage limits matter more than displaying a precise Kelly number."
        },
        "p": [
          "The simple binary model does not describe most multi-period trading strategies with fat tails, serial dependence, costs and uncertain payoff distributions. Even fractional Kelly can be too aggressive when the edge estimate is unreliable."
        ]
      },
      {
        "h": "Risk rules worth writing down",
        "bullets": [
          "Set limits on single-name, sector, factor and currency concentration.",
          "Stress gap-down scenarios and liquidity evaporation, not only small normal moves.",
          "Measure open exposure and the combined effect of correlated signals.",
          "Define stopping, review and model-shutdown conditions before trading.",
          "Prefer explicit risk budgets to an optimizer that hides extreme assumptions."
        ],
        "p": [
          "A credible position-size recommendation shows the assumed loss distribution and what would falsify it. No formula compensates for inaccurate or stale input data."
        ]
      }
    ],
    "sources": [
      {
        "label": "Options Industry Council — Greeks and Model Sensitivities",
        "url": "https://prd-web.optionseducation.org/advancedconcepts/understanding-options-greeks"
      }
    ],
    "companion": {
      "href": "/models",
      "label": "Explore quant risk models"
    }
  }
];
export const RESEARCH_CATEGORIES=Object.freeze([
  {id:"ipo",label:"IPO Intelligence",summary:"A measured guide to Indian new issues, informal GMP, allocation, offer documents and capital-market mechanics."},
  {id:"quant",label:"Quantitative Finance",summary:"Practical mathematics and risk reasoning for derivatives, statistical arbitrage, testing and portfolio construction."}
]);
export const getResearchArticle=(slug)=>RESEARCH_LIBRARY.find(x=>x.slug===slug)||null;
