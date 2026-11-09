import Link from "next/link";

export const metadata = {
  title: "Quant Finance Guides — Options Greeks, Pairs Trading & Risk | AlphaHedgeQuant",
  description: "Free, detailed quant finance guides: options delta, gamma, theta and vega; pairs trading and cointegration; position sizing, volatility targeting and Kelly criterion.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Quant Finance Guides | AlphaHedgeQuant",
    description: "Read rigorous explainers on options risk, statistical arbitrage and position sizing.",
    url: "/guides",
    type: "website",
  }
};

const guides=[
  {
    href:"/learn/options-greeks", number:"01", subject:"DERIVATIVES / OPTIONS",
    title:"Options Greeks: Delta, Gamma, Theta & Vega",
    description:"What Greeks actually measure, why their values change with spot, time and volatility, and how to reason about a portfolio rather than a single contract.",
    topics:["Delta & gamma sensitivity","Time decay and vega","Portfolio exposure"]
  },
  {
    href:"/learn/cointegration-pairs-trading", number:"02", subject:"STATISTICAL ARBITRAGE",
    title:"Cointegration and Pairs Trading",
    description:"A practical framework for testing price relationships, estimating a hedge ratio, examining residual stationarity and understanding why correlation is not cointegration.",
    topics:["Engle–Granger & Johansen","Mean-reversion half-life","Z-score limitations"]
  },
  {
    href:"/learn/position-sizing", number:"03", subject:"RISK / PORTFOLIO",
    title:"Position Sizing: Volatility Targeting & Kelly",
    description:"How to translate a risk budget into exposure, why volatility and transaction costs matter, and what can go wrong when an estimated trading edge is treated as certain.",
    topics:["Fixed fractional risk","Volatility targeting","Kelly criterion limits"]
  }
];
export default function GuidesPage(){
  return <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24 text-body">
    <p className="eyebrow tracking-[.22em]">AHQ / OPEN RESEARCH NOTES</p>
    <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
      Quantitative finance <span className="text-amber">guides</span>
    </h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">An accessible collection of mathematical finance explanations: options risk, statistical arbitrage and portfolio sizing. Each lesson sets out the intuition, calculations and assumptions behind the result. All three articles are free to read without an account.</p>
    <nav aria-label="Guide topics" className="mt-10 flex flex-wrap gap-3">
      <a href="#options" className="rounded-full border border-line px-4 py-2 text-sm hover:text-amber">Options</a>
      <a href="#pairs" className="rounded-full border border-line px-4 py-2 text-sm hover:text-amber">Statistical arbitrage</a>
      <a href="#risk" className="rounded-full border border-line px-4 py-2 text-sm hover:text-amber">Risk management</a>
    </nav>
    <section className="mt-14 grid gap-5" aria-label="Quant finance articles">
      {guides.map((g,i)=><article id={["options","pairs","risk"][i]} key={g.href} className="rounded-2xl border border-line bg-raised/40 p-6 md:p-9">
        <p className="font-mono text-xs tracking-widest text-amber">{g.number} / {g.subject}</p>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-4xl"><Link className="hover:text-amber" href={g.href}>{g.title}</Link></h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">{g.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">{g.topics.map(k=><span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted" key={k}>{k}</span>)}</div>
        <Link href={g.href} className="mt-6 inline-block font-semibold text-amber hover:underline">Read the full guide →</Link>
      </article>)}
    </section>
    <section className="mt-16 max-w-4xl border-t border-line pt-10">
      <h2 className="font-display text-2xl font-semibold">How to use these guides</h2>
      <p className="mt-4 leading-8 text-muted">Begin with the assumptions and variables. Recalculate each worked example, then ask whether the inputs would have been known when a trade was made. For derivatives, a Greek is a local sensitivity, not a forecast. For pairs strategies, a historical relationship can break. For sizing, uncertainty in expected returns can dominate even an elegant formula.</p>
      <p className="mt-4 leading-8 text-muted">For interactive modules, interview practice and your progress dashboard, visit <Link className="text-amber underline" href="/learn">AlphaHedgeQuant Learn</Link>. Those account-linked tools remain protected by sign-in. You can also explore our <Link className="text-amber underline" href="/platform">platform capabilities</Link> without an account.</p>
    </section>
    <p className="mt-12 text-xs text-muted">Educational research only, not investment advice. Examples are illustrative, not trading recommendations.</p>
  </div>;
}
