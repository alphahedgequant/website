export const metadata = {
  title: "Dark Pool & ECN Tracker — Weekly Historical Off-Exchange Intelligence | AlphaHedgeQuant",
  description: "Explore weekly historical FINRA ATS and non-ATS OTC activity alongside SEC ATS disclosures. Track reported venue concentration, cross-week changes and historical patterns. Not a live trade tape.",
  alternates: { canonical: "/dark-pool" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Dark Pool & ECN Tracker | AlphaHedgeQuant",
    description: "A historical, source-attributed view of US off-exchange activity. Connect FINRA weekly reports with SEC ATS disclosures.",
    url: "/dark-pool",
    type: "website",
    siteName: "AlphaHedgeQuant",
  },
};

const root = "https://www.alphahedgequant.com";
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Dark Pool & ECN Tracker — Weekly Historical Intelligence",
  url: root + "/dark-pool",
  isAccessibleForFree: true,
  inLanguage: "en-US",
  description: "A public historical research workspace for FINRA-reported ATS and OTC activity and SEC ATS disclosures. It is not an intraday trade feed.",
  publisher: { "@type": "Organization", name: "AlphaHedgeQuant", url: root },
};

const steps = [
  {
    number: "01",
    title: "FINRA weekly reports",
    text: "Start with reported shares and trade counts by symbol, reporting week and ATS or non-ATS firm where the published record supports that level of detail.",
    tag: "ACTIVITY",
  },
  {
    number: "02",
    title: "SEC venue disclosures",
    text: "Connect ATS names and operators with public SEC ATS records and Form ATS-N disclosures, keeping the filing date and source attached.",
    tag: "VENUE CONTEXT",
  },
  {
    number: "03",
    title: "Cross-week comparisons",
    text: "Compare each reporting week with prior weeks to find acceleration, persistence, concentration and changes in reported average trade size.",
    tag: "TIME SERIES",
  },
  {
    number: "04",
    title: "Research signals",
    text: "Turn the linked records into explainable historical observations—not claims about a hidden buyer, seller or institution.",
    tag: "INTERPRETATION",
  },
];

const researchViews = [
  ["Symbol activity", "Weekly shares and trade counts for a selected US ticker, with the FINRA tier and reporting period shown."],
  ["Venue concentration", "Top-venue and top-three venue share within the reported ATS dataset for the same symbol and week."],
  ["Unusual weekly activity", "A week-over-week move and a trailing-baseline comparison, with the number of observations used."],
  ["Trade-size context", "Reported shares divided by reported trade count; an average, not a reconstruction of individual executions."],
  ["Persistence", "How often reported activity remains above its trailing baseline across consecutive published weeks."],
  ["ATS profile links", "Venue/operator context from SEC ATS lists and Form ATS-N disclosures, with filing links and dates."],
];

const faqs = [
  {
    q: "Is this a live dark-pool or ECN tape?",
    a: "No. This product is designed around published weekly historical reports and SEC disclosures. It does not show intraday executions, live prints, order-book events or real-time venue activity.",
  },
  {
    q: "Does “latest week” mean the calendar week that just ended?",
    a: "Not necessarily. The dashboard will show the latest reporting week actually published by the source, along with its first publication date and last source-update date. FINRA's initial publication schedule is approximately two weeks for NMS Tier 1 and four weeks for NMS Tier 2 and OTC securities.",
  },
  {
    q: "Are all off-exchange reports dark-pool executions?",
    a: "No. ATS reports describe activity reported by alternative trading systems. Non-ATS OTC reports are a separate reporting category. The tracker will keep those categories separate and will not label every off-exchange share as a dark-pool execution.",
  },
  {
    q: "Can the data reveal whether institutions were buying or selling?",
    a: "No. Weekly aggregate share and trade counts do not identify the buyer, seller, beneficial owner, trade direction or investment intent. The tracker will not infer those details.",
  },
  {
    q: "How are the historical signals calculated?",
    a: "Signals compare source-reported weekly totals with earlier published weeks. Each calculation will show its formula, comparison window, source fields and data coverage. No missing week will be silently filled with an estimate.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(item => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function DarkPoolPage() {
  return (
    <main className="ahq-page-product">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-16" aria-labelledby="dark-pool-title">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">ALPHAHEDGEQUANT / US MARKET STRUCTURE</p>
          <span className="inline-flex items-center rounded border border-amber/35 bg-amber/10 px-2.5 py-1 font-mono text-[10px] tracking-[.14em] text-amber">
            HISTORICAL · DELAYED
          </span>
        </div>

        <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)] xl:items-end">
          <div>
            <h1 id="dark-pool-title" className="max-w-4xl font-display text-4xl font-semibold leading-[1.06] tracking-tight md:text-6xl">
              Dark Pool &amp; ECN
              <span className="mt-1 block text-amber">Intelligence Tracker.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
              Connect the dots across weekly off-exchange activity. Combine FINRA-reported ATS and non-ATS OTC statistics with SEC venue disclosures to examine where reported activity is concentrated, how it changes over time, and what the public record says about the venues behind it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["US EQUITIES", "FINRA WEEKLY REPORTS", "SEC ATS DISCLOSURES", "NO INTRADAY PRINTS"].map(item => (
                <span key={item} className="rounded border border-line bg-surface/70 px-3 py-2 font-mono text-[10px] tracking-[.12em] text-muted">{item}</span>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-line bg-surface/80 p-5 md:p-6" aria-label="Data mode and reporting schedule">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] tracking-[.18em] text-muted">DATA MODE</p>
              <span className="rounded border border-amber/35 bg-amber/10 px-2 py-1 font-mono text-[10px] text-amber">WEEKLY HISTORY</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-body">Latest published week</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              We show the reporting period the source actually published—not an assumed “last week” label.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-raised/60 p-3">
                <p className="font-mono text-[10px] tracking-wider text-muted">NMS TIER 1</p>
                <p className="mt-1 text-lg font-semibold text-body">~2 weeks</p>
                <p className="text-[11px] text-muted">Initial publication lag</p>
              </div>
              <div className="rounded-lg border border-line bg-raised/60 p-3">
                <p className="font-mono text-[10px] tracking-wider text-muted">TIER 2 + OTC</p>
                <p className="mt-1 text-lg font-semibold text-body">~4 weeks</p>
                <p className="text-[11px] text-muted">Initial publication lag</p>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-muted">
              Every populated view will carry its reporting week, first publication date and last source-update date. This is historical research—not a live scanner.
            </p>
          </aside>
        </div>

        <div className="mt-10 rounded-xl border border-line bg-surface/75 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[.2em] text-amber">WEEKLY INTELLIGENCE WORKSPACE</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-body md:text-2xl">Latest available reporting week</h2>
            </div>
            <span className="rounded border border-line px-3 py-1.5 font-mono text-[10px] tracking-wider text-muted">OFFICIAL-SOURCE DATA ONLY</span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["REPORTING WEEK", "Source-reported date range"],
              ["FIRST PUBLISHED", "FINRA publication date"],
              ["LAST SOURCE UPDATE", "FINRA update date"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-raised/55 p-4">
                <p className="font-mono text-[10px] tracking-[.15em] text-muted">{label}</p>
                <p className="mt-2 text-sm font-medium text-body">{value}</p>
                <p className="mt-1 text-xs text-muted">Displayed from the source record</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-dashed border-amber/35 bg-amber/[.035] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-body">Historical source connection is being prepared.</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                No sample prints, synthetic venue rankings or invented weekly totals are shown. The workspace will populate only when the official dataset is connected and its public-display terms are confirmed.
              </p>
            </div>
            <span className="shrink-0 rounded border border-amber/35 px-3 py-2 font-mono text-[10px] tracking-wider text-amber">NO FABRICATED DATA</span>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface/35" aria-labelledby="connect-dots-title">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow">01 / THE RESEARCH ENGINE</p>
            <h2 id="connect-dots-title" className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Not just a volume table.<br /><span className="text-amber">A connected market-structure view.</span></h2>
            <p className="mt-4 text-sm leading-7 text-muted md:text-base">
              A weekly print count on its own is only a starting point. The value comes from linking a security, its reported ATS activity, the venue's public disclosures and the way those observations evolve across reporting weeks.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map(step => (
              <article key={step.number} className="feature-card rounded-xl border border-line bg-surface p-5" style={{ "--glow": "rgba(215,180,119,.22)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-amber">{step.number}</span>
                  <span className="font-mono text-[9px] tracking-[.16em] text-muted">{step.tag}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold text-body">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16" aria-labelledby="research-views-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">02 / WHAT YOU CAN INVESTIGATE</p>
            <h2 id="research-views-title" className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">From weekly records to useful questions.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">Each signal will expose its inputs and comparison window. Missing source weeks remain missing; no interpolation will be presented as observed activity.</p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {researchViews.map(([title, text], index) => (
            <article key={title} className="rounded-xl border border-line bg-surface/80 p-5">
              <p className="font-mono text-[10px] tracking-[.16em] text-amber">VIEW / 0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold text-body">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface/70 p-5 md:p-6">
            <p className="font-mono text-[10px] tracking-[.18em] text-amber">EXAMPLE CALCULATIONS</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-body">Average reported trade size</p>
                <p className="mt-1 font-mono text-sm text-muted">weekly shares ÷ weekly trade count</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-body">Top-three ATS concentration</p>
                <p className="mt-1 font-mono text-sm text-muted">shares at top 3 ATS ÷ all reported ATS shares</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-body">Weekly activity change</p>
                <p className="mt-1 font-mono text-sm text-muted">(current week ÷ prior published week) − 1</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-body">Historical anomaly score</p>
                <p className="mt-1 font-mono text-sm text-muted">(current week − trailing mean) ÷ trailing standard deviation</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface/70 p-5 md:p-6">
            <p className="font-mono text-[10px] tracking-[.18em] text-amber">INTERPRETATION GUARDRAILS</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <li className="flex gap-2"><span className="text-amber">—</span><span>ATS and non-ATS OTC activity stay in separate categories.</span></li>
              <li className="flex gap-2"><span className="text-amber">—</span><span>Concentration means concentration within the reported dataset—not ownership or control by one institution.</span></li>
              <li className="flex gap-2"><span className="text-amber">—</span><span>Weekly aggregates do not reveal buy/sell direction, counterparties or execution timestamps.</span></li>
              <li className="flex gap-2"><span className="text-amber">—</span><span>No total-market dark-pool percentage will be claimed without a compatible consolidated-volume denominator.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface/35" aria-labelledby="sources-title">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-14">
          <p className="eyebrow">03 / SOURCE TRANSPARENCY</p>
          <h2 id="sources-title" className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Official records first.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            FINRA's weekly dataset includes security identifiers, ATS/OTC participant identifiers, reported weekly share quantities, trade counts, tier, reporting week, initial publication date and update dates. SEC records provide the public ATS register and Form ATS-N disclosures for NMS-stock ATSs.
          </p>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <a href="https://developer.finra.org/docs/api-explorer/query_api-equity-weekly_summary" target="_blank" rel="noreferrer" className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-amber/45">
              <p className="font-mono text-[10px] tracking-[.16em] text-amber">PRIMARY ACTIVITY SOURCE</p>
              <h3 className="mt-2 text-lg font-semibold text-body group-hover:text-amber">FINRA OTC / ATS Weekly Summary ↗</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Dataset schema, reporting-week fields, venue identifiers and publication-lag metadata.</p>
            </a>
            <a href="https://www.sec.gov/foia/frequently-requested-documents/alternative-trading-system-ats-list" target="_blank" rel="noreferrer" className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-amber/45">
              <p className="font-mono text-[10px] tracking-[.16em] text-amber">VENUE REFERENCE SOURCE</p>
              <h3 className="mt-2 text-lg font-semibold text-body group-hover:text-amber">SEC Alternative Trading System List ↗</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Public ATS names, business names, locations and cessation notices; updated by the SEC periodically.</p>
            </a>
            <a href="https://www.sec.gov/divisions/marketreg/form-ats-n-filings.htm" target="_blank" rel="noreferrer" className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-amber/45">
              <p className="font-mono text-[10px] tracking-[.16em] text-amber">OPERATING DISCLOSURES</p>
              <h3 className="mt-2 text-lg font-semibold text-body group-hover:text-amber">SEC Form ATS-N Filings ↗</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Public disclosures for ATSs trading NMS stocks, used to add operating and affiliation context to venue profiles.</p>
            </a>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted">
            Source attribution will be retained. FINRA's applicable Equity Data terms govern access, attribution and redistribution; the public dashboard will not publish source rows until the applicable display rights are confirmed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16" aria-labelledby="dark-pool-faq-title">
        <p className="eyebrow">04 / METHODOLOGY & FAQ</p>
        <h2 id="dark-pool-faq-title" className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Read the data in context.</h2>
        <div className="mt-7 divide-y divide-line border-y border-line">
          {faqs.map((item, index) => (
            <details key={item.q} className="group py-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-body">
                {item.q}
                <span className="font-mono text-lg text-amber transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-7 max-w-4xl text-xs leading-6 text-muted">
          Historical market-structure research for informational and educational use. Data coverage, reporting lag, source corrections and publication terms may change. This tracker is not a live market feed, execution venue, investment recommendation or evidence of any specific institution's position.
        </p>
      </section>
    </main>
  );
}
