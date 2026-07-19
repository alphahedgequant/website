// ════════════════════════════════════════════════════════════════════
//  AHQ REPORTS REGISTRY
//  Publishing model: committing an entry here IS publishing.
//  Every entry is written/reviewed by a human before commit.
//
//  Block types for `body`:
//    { type: "p",     text }                      → paragraph
//    { type: "h2",    text }                      → section heading
//    { type: "stats", items: [[label, value, note], ...] }  → stat grid
//    { type: "quote", text }                      → pull quote
//    { type: "note",  text }                      → small-print note
// ════════════════════════════════════════════════════════════════════

export const reports = [
  // ──────────────────────────────────────────────────────────────────
  // #2 — INDIA MACRO MONTHLY · JULY 2026
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "india-macro-monthly-july-2026",
    tag: "INDIA MACRO · MONTHLY",
    title: "India Macro Monthly — July 2026",
    dek: "Headline inflation is comfortably inside the band. Almost everything underneath it is moving — silver-driven personal care at 16.7%, a record trade deficit, the driest June in twelve years.",
    date: "2026-07-16",
    readMins: 9,
    summary:
      "June CPI printed 4.38% — quiet on the surface, loud underneath. Rural-urban divergence, a 9.87% WPI, GST growth carried by imports, a record $30.4bn trade deficit, and a failing monsoon. All figures verified against primary sources (MoSPI, GSTN, CBDT, Commerce Ministry, PLFS).",
    body: [
      { type: "p", text: "June's consumer price index rose 4.38% year on year — inside the RBI's 2–6% tolerance band, close to the 4% target, and on its own an unremarkable print. This report is about why that headline is misleading. Underneath it, rural and urban India are living in different inflation regimes, wholesale prices are running at more than twice the consumer rate, tax collections are accelerating while underlying domestic demand looks soft, the trade deficit just set a record, and the monsoon has delivered the driest June in twelve years. Each of these is a story; together they are the setup for the second half of FY27." },

      { type: "h2", text: "Prices: one headline, two Indias" },
      { type: "stats", items: [
        ["CPI · Jun", "4.38%", "rural 4.74% vs urban 3.92%"],
        ["WPI · Jun", "9.87%", "pipeline pressure, 2.3× CPI"],
        ["Personal care", "16.72%", "silver +133% y/y, gold +37%"],
        ["Telangana CPI", "6.36%", "above the RBI band"],
      ]},
      { type: "p", text: "The rural-urban split is the first crack in the calm headline: rural CPI at 4.74% against urban at 3.92%, an 82bp gap. The division-level detail explains part of it. Personal care and effects — the CPI bucket that carries gold and silver jewellery — is running at 16.72%, driven by silver up roughly 133% year on year and gold up 37%. Restaurants and hotels printed 6.91%. Transport tells a two-speed story of its own: vehicle prices fell 4.59% while the cost of operating them rose 7.35%, and freight rates rose 7.70% — deflation in the showroom, inflation on the road." },
      { type: "p", text: "The state dispersion matters for the 'inflation is beaten' narrative: Telangana printed 6.36%, above the top of the RBI's band. And the wholesale price index at 9.87% is the number that should keep the doves honest — more than twice the consumer rate, it represents pipeline pressure that either compresses producer margins or eventually passes through to the shelf." },

      { type: "h2", text: "Activity and the fisc: strong collections, soft core" },
      { type: "stats", items: [
        ["Net direct tax", "+16.4%", "₹6.51L cr to Jul 13, accelerating"],
        ["GST · Jun", "₹1,94,812 cr", "+13.9% y/y, fastest in 13 months"],
        ["GST domestic YTD", "+2.8%", "vs imports +34.6% in June"],
        ["IIP · May", "+5.1%", "industrial output holding up"],
      ]},
      { type: "p", text: "The fiscal engine looks superb at first glance. Net direct tax collections reached ₹6.51 lakh crore by July 13, up 16.4% — and accelerating, from +14.6% at mid-June (gross collections ₹7.74 lakh crore). June GST came in at ₹1,94,812 crore, up 13.9%, the fastest growth in thirteen months, with Maharashtra alone contributing ₹30.7 thousand crore and Uttar Pradesh growing 19%." },
      { type: "p", text: "The composition is the caveat. June's GST growth was carried by imports (+34.6%) while domestic collections grew just 6.5% — and year-to-date domestic GST is up only 2.8%. Strip out the import surge and the underlying domestic demand signal is far weaker than the headline suggests. Industrial production (+5.1% in May) is the more reassuring activity print." },

      { type: "h2", text: "The external account: a record deficit" },
      { type: "stats", items: [
        ["Trade deficit · Jun", "$30.43bn", "all-time record"],
        ["Imports · Jun", "+31%", "precious metals a major driver"],
        ["CAD · Q4 FY26", "+$7.1bn", "surplus — now firmly behind us"],
      ]},
      { type: "p", text: "June's merchandise trade deficit of $30.43 billion is a record. Imports rose 31%, and the same precious-metals surge that shows up in the CPI's personal care division shows up here as bullion imports. The current account was in surplus as recently as Q4 FY26 (+$7.1bn); that cushion is now spent. A deficit of this size, if it persists, is a straightforward source of rupee pressure and imported inflation — which loops back into the CPI story." },

      { type: "h2", text: "Labour and the monsoon: the two-front risk" },
      { type: "stats", items: [
        ["Urban unemployment", "6.6%", "improving (PLFS Q1)"],
        ["Rural unemployment", "4.3%", "deteriorating"],
        ["June rainfall", "Driest in 12 yrs", "kharif sowing −23%"],
        ["El Niño odds", "92%", "food inflation risk into H2"],
      ]},
      { type: "p", text: "The PLFS Q1 bulletin shows urban unemployment improving to 6.6% while rural unemployment rose to 4.3% — the same rural-urban divergence as the inflation data, from the other side. And the monsoon is the single biggest risk on the board: the driest June in twelve years, kharif sowing down 23%, and a 92% probability of El Niño conditions. Rural India is being squeezed twice — higher inflation and weakening employment — just as the crop outlook deteriorates." },

      { type: "h2", text: "Policy: the RBI's uneasy hold" },
      { type: "p", text: "Against this backdrop the RBI held the repo rate at 5.25%, projecting FY27 CPI at 5.1% and GDP growth at 6.6%. Read those projections carefully: the central bank's own forecast has inflation averaging above the 4% target for the fiscal year. The hold is not a victory lap — it is a wait-and-see stance with the risks (monsoon, WPI pipeline, record trade deficit, bullion) stacked mostly on the upside. Our read: the bar for a cut is much higher than the bar for a longer hold." },

      { type: "h2", text: "Bottom line" },
      { type: "quote", text: "The headline says 4.38% and calm. The internals say rural stress, pipeline pressure, import-led revenue, a record external gap, and a failing monsoon. Trade the internals." },

      { type: "note", text: "All figures verified against primary sources: MoSPI CPI release (Jul 13, incl. annexures), GSTN (Jul 1), CBDT (Jul 14), Ministry of Commerce (Jul 13), PLFS Q1 bulletin, RBI MPC statement. Research and education only — not investment advice." },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // #1 — THE TWIN PAUSE · US + INDIA MACRO
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "the-twin-pause",
    tag: "GLOBAL MACRO · US + INDIA",
    title: "The Twin Pause",
    dek: "The Fed and the RBI are both on hold. The pauses could not be more different — one has a finger on the hike trigger, the other is praying for rain.",
    date: "2026-07-15",
    readMins: 8,
    summary:
      "Two central banks, two holds, two very different reasons. The Fed's pause at 3.50–3.75% carries a hawkish bias — nine of eighteen officials project a hike by end-2026. The RBI's pause at 5.25% is a wait against monsoon failure and a record trade deficit. What a 'pause' means depends entirely on what the next move is priced to be.",
    body: [
      { type: "p", text: "In June, the Federal Open Market Committee held the federal funds rate at 3.50–3.75%. A week earlier — half a world away — the Reserve Bank of India held the repo rate at 5.25%. Two pauses, and on a Bloomberg screen they look identical: no change, next meeting circled. But a pause is not a position; it is a direction withheld. This report is about why these two holds point in opposite directions, and what that means for anyone trading rates, currency, or equity risk in either market." },

      { type: "h2", text: "Washington: the hawkish hold" },
      { type: "stats", items: [
        ["Fed funds", "3.50–3.75%", "held, unanimous, June FOMC"],
        ["Dot plot", "9 of 18", "officials see a hike by end-2026"],
        ["CPI · Jun", "3.5%", "core 2.6%; energy −5.7% m/m"],
        ["Payrolls", "+57k", "softer than expected"],
      ]},
      { type: "p", text: "The June meeting was Chair Kevin Warsh's first at the helm of a rate decision, and the unanimous hold was the least interesting part of it. The dot plot shifted hawkish: nine of eighteen officials now project at least one hike by the end of 2026. This is a pause with a finger on the trigger — the FOMC is holding not because it is finished, but because it is deciding whether it has to go the other way." },
      { type: "p", text: "June's CPI complicated that hawkish tilt in both directions at once. Headline inflation fell to 3.5% from 4.2% in May — the monthly decline of 0.4% was the largest since April 2020 — but almost all of it was energy, which slumped 5.7% on the month while still standing 15.7% higher than a year ago (gasoline +26.7% y/y). Core, at 2.6% with shelter up just 0.1%, is the number the doves will point to. Meanwhile the labour market handed the Fed a reason to wait: nonfarm payrolls rose just 57,000, well below expectations. After the CPI print, futures markets trimmed the odds of a September hike to roughly 63% from above 75%." },
      { type: "p", text: "The asymmetry is what matters. With headline inflation still a point and a half above target and half the committee projecting a hike, the Fed's next move is priced to be up. There is no Summary of Economic Projections at the July 28–29 meeting — which makes the statement language, and Warsh's press conference, the entire event." },

      { type: "h2", text: "Mumbai: the uneasy hold" },
      { type: "stats", items: [
        ["Repo rate", "5.25%", "held; FY27 CPI proj. 5.1%"],
        ["CPI · Jun", "4.38%", "rural 4.74% vs urban 3.92%"],
        ["Trade deficit", "$30.43bn", "June — all-time record"],
        ["Monsoon", "Driest June in 12 yrs", "sowing −23%, 92% El Niño"],
      ]},
      { type: "p", text: "The RBI's hold at 5.25% reads dovish next to the Fed's — India's CPI at 4.38% sits inside the tolerance band — but the internals give the MPC little room to relax. Rural inflation (4.74%) is running well ahead of urban (3.92%). The wholesale price index at 9.87% signals pipeline pressure at more than twice the consumer rate. Personal care is inflating at 16.72% on the back of silver up 133% and gold up 37% — a precious-metals impulse that simultaneously shows up in the trade data, where June's $30.43 billion deficit set an all-time record on imports up 31%." },
      { type: "p", text: "And then there is the sky. The driest June in twelve years has kharif sowing down 23%, with a 92% probability of El Niño conditions. Food inflation with a monsoon failure is the scenario every Indian rate-setter is paid to fear, and it is why the RBI's own FY27 projection has CPI at 5.1% — above target — even as it holds. This is not a pause before cuts. It is a pause that hopes for rain." },

      { type: "h2", text: "Two pauses, opposite vectors" },
      { type: "p", text: "Put the two side by side and the word 'pause' stops doing useful work. The Fed is on hold with inflation above target, a hawkish dot plot, and a market pricing a two-in-three chance of a hike by September — its pause has an upward vector. The RBI is on hold with inflation inside the band today but its own forecast above target for the year, a record external deficit, and a weather problem no policy rate can fix — its pause has no vector at all; it is pinned in place by risks it can only watch." },
      { type: "p", text: "For markets, the implications diverge accordingly. A Fed with a hiking bias and cooling-but-high headline inflation keeps US front-end yields firm and caps duration rallies until the September question resolves. For India, the record trade deficit plus a hold — while US rates stay high or rise — is a recipe for rupee pressure, which imports inflation and further narrows the MPC's room. The bullion surge sits at the centre of both stories: it is US inflation hedging on one side of the ledger and India's import bill on the other." },

      { type: "h2", text: "What we're watching" },
      { type: "p", text: "The July 28–29 FOMC statement language, with no dot plot to hide behind. The next US payrolls print — a second sub-100k month would kill the September hike. The IMD's monsoon revival forecast and weekly sowing data — the single highest-leverage variable for Indian rates. July GST collections, for whether domestic (not import) growth recovers. And the rupee, which sits at the intersection of every pressure named above." },

      { type: "note", text: "US data: Federal Reserve June FOMC statement and minutes; BLS June CPI release (Jul 14); BLS employment situation. India data verified against MoSPI, GSTN, CBDT, Ministry of Commerce, and RBI MPC primary releases. Research and education only — not investment advice." },
    ],
  },
];

export function getReport(slug) {
  return reports.find((r) => r.slug === slug) || null;
}

export function getAllSlugs() {
  return reports.map((r) => ({ slug: r.slug }));
}
