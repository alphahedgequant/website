import Link from "next/link";
import "../public-preview.css";

export const metadata={
 title:"Quant Finance Research Papers — Methods & Reading Guide | AlphaHedgeQuant",
 description:"Explore research on market microstructure, statistical arbitrage, volatility modelling, portfolio risk and machine learning. Read the free overview and sign in for AlphaHedgeQuant's complete research discovery tools.",
 alternates:{canonical:"/research"},
 openGraph:{title:"Quant Finance Research Papers | AlphaHedgeQuant",description:"An introduction to quantitative research papers, evidence and replication. Sign in for the full research discovery library.",url:"/research",type:"website"}
};

const fields=[
 ["STATISTICAL ARBITRAGE","Cointegration & Pairs Trading","Understand stationary spread assumptions, hedge-ratio drift, mean reversion, fees and out-of-sample testing."],
 ["MARKET MICROSTRUCTURE","Order Flow & Market Integrity","Study order-book imbalance, queue dynamics, cancellation behavior and the challenges of identifying manipulative intent."],
 ["RISK & VOLATILITY","GARCH, Tail Risk & Expected Shortfall","Go beyond a single standard deviation and examine clustering, fat tails, stress scenarios and parameter uncertainty."],
 ["MACHINE LEARNING","Prediction, Features & Overfitting","Separate training performance from implementable forecasts using point-in-time features and realistic execution."]
];
const schema={"@context":"https://schema.org","@type":"CollectionPage",name:"Quant Finance Research Papers",url:"https://www.alphahedgequant.com/research",description:"Public introduction to quantitative finance research topics and methods, with account-linked research discovery.",isAccessibleForFree:true,hasPart:{"@type":"WebPageElement",name:"Free Research Overview",isAccessibleForFree:true}};
export default function ResearchOverview(){
return <div className="ahq-open-preview">
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
 <header className="ap-hero"><div className="ap-shell">
  <div className="ap-crumb"><Link href="/">AHQ</Link><span>/</span><Link href="/library">Open Research</Link><span>/</span><span>Papers</span></div>
  <p className="ap-kicker" style={{marginTop:36}}>RESEARCH / LITERATURE & METHODOLOGY</p>
  <h1 className="ap-title">Quant research.<br/><em>Evidence before inference.</em></h1>
  <p className="ap-lede">From statistical arbitrage to market microstructure, understand the questions that quantitative finance papers attempt to answer—and why a mathematically elegant result is not automatically an investable strategy.</p>
  <div className="ap-metadata"><span>PUBLIC RESEARCH OVERVIEW</span><span>FULL AHQ DISCOVERY TOOLS · SIGN IN</span></div>
 </div></header>
 <main className="ap-main ap-shell">
  <div className="ap-two">
   <section><p className="ap-kicker">FIELD GUIDE / 01</p><h2 className="ap-section-title">How to read a <em>quant paper.</em></h2>
    <p>Begin by identifying the data-generating process, sample period, unit of observation and the decision the model actually informs. A paper may forecast a conditional return, a market regime, a jump intensity or an order-book event: those are distinct targets with different evaluation criteria.</p>
    <p>Inspect whether the backtest uses only historically available inputs. A model that quietly sees final-index constituents, revised data or after-close results can look extraordinarily accurate without being tradable.</p>
    <p>Finally, distinguish statistical significance from economic significance. Returns after spread, market impact, funding and adverse selection may differ materially from a paper's gross hypothetical returns.</p>
   </section>
   <aside className="ap-paper"><p className="ap-paper-label">RESEARCH READING FRAMEWORK</p><h3>Five tests of a useful result</h3>
    <p>01 · What is predicted or explained?</p><p>02 · Could the inputs be known at decision time?</p><p>03 · What is the counterfactual benchmark?</p><p>04 · Are uncertainty and trading costs modeled?</p><p>05 · Does the finding survive new markets and periods?</p>
    <div className="ap-equation">Observed edge ≠ executable edge</div>
   </aside>
  </div>
  <div className="ap-rule"/>
  <section><p className="ap-kicker">SELECTED DISCIPLINES / FREE OVERVIEW</p><h2 className="ap-section-title">Where the <em>research leads.</em></h2><div className="ap-grid">
   {fields.map(([tag,title,desc],i)=><article className="ap-card" key={tag}><span className="ap-id">{String(i+1).padStart(2,"0")} / {tag}</span><h3>{title}</h3><p>{desc}</p><Link href="/library">Read public finance explainers ↗</Link></article>)}
  </div></section>
  <section className="ap-gate" aria-labelledby="research-signin"><p className="ap-kicker">CONTINUE THE RESEARCH</p><h2 id="research-signin">Unlock the full research discovery library.</h2><p>Sign in to access AlphaHedgeQuant's searchable research-paper feed, category filters, curated foundational literature and the existing research workspace. The original papers may also be available on their publishers' or preprint servers independently of AlphaHedgeQuant.</p>
   <Link href="/research/explore" className="ap-cta">Sign in to explore research ↗</Link>
   <Link href="/library" className="ap-secondary">Continue reading free guides</Link>
   <p className="ap-note">The free introduction above is readable without an account. The AHQ full discovery interface requires authentication; no external publisher's copyright or access conditions are altered.</p>
  </section>
 </main></div>;
}
