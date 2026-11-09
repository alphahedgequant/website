import Link from "next/link";
import {LIBRARY_PUBLISHED,RESEARCH_LIBRARY,RESEARCH_CATEGORIES} from "@/lib/publicResearchLibrary.mjs";
import "./library.css";

export const metadata={
 title:"IPO & Quant Finance Research Library | AlphaHedgeQuant",
 description:"Read free, public research guides on Indian IPO GMP, listing gains, allotment, ASBA, DRHP valuation, options Greeks, implied volatility, gamma exposure, pairs trading, backtesting and risk.",
 alternates:{canonical:"/library"},
 openGraph:{title:"IPO & Quant Finance Research Library — AlphaHedgeQuant",description:"A free, accessible collection of structured educational research on Indian IPOs, derivatives and quantitative finance.",url:"/library",type:"website"}
};

const canonical="https://www.alphahedgequant.com";
const jsonld={
 "@context":"https://schema.org",
 "@type":"CollectionPage",
 "@id":canonical+"/library#collection",
 name:"IPO & Quant Finance Research Library",
 description:"Free, evergreen educational research about Indian IPOs and quantitative financial models.",
 url:canonical+"/library",
 isAccessibleForFree:true,
 inLanguage:"en-IN",
 datePublished:LIBRARY_PUBLISHED,
 publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:canonical},
 mainEntity:{
  "@type":"ItemList",
  itemListElement:RESEARCH_LIBRARY.map((x,i)=>({"@type":"ListItem",position:i+1,name:x.title,url:canonical+"/library/"+x.slug}))
 }
};

function ResearchCard({item,index}){
 return <article className="rl-card">
   <div className="rl-card-top"><span>{String(index+1).padStart(2,"0")} / {item.eyebrow}</span><span>{item.read} MIN READ</span></div>
   <h3><Link href={"/library/"+item.slug}>{item.title}</Link></h3>
   <p>{item.description}</p>
   <div className="rl-card-bottom"><span>RESEARCH NOTE · 09 NOV 2026</span><Link href={"/library/"+item.slug}>Read research <span aria-hidden="true">↗</span></Link></div>
 </article>;
}

export default function LibraryHome(){
 const ipo=RESEARCH_LIBRARY.filter(x=>x.category==="ipo");
 const quant=RESEARCH_LIBRARY.filter(x=>x.category==="quant");
 return <div className="rl-site">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonld).replace(/</g,"\\u003c")}}/>
  <section className="rl-hero">
    <div className="rl-shell">
      <div className="rl-hero-inner">
        <p className="rl-eyebrow">ALPHAHEDGEQUANT / OPEN RESEARCH</p>
        <h1>Finance is complicated.<br/><em>Understanding shouldn't be.</em></h1>
        <p className="rl-hero-sub">A public library of quantitative finance and Indian IPO research, built around definitions, real mathematics, worked examples, and the assumptions behind every answer.</p>
        <div className="rl-hero-links"><a href="#ipo-research">Explore IPO research <span>↘</span></a><a href="#quant-research">Explore Quant finance <span>↘</span></a></div>
        <div className="rl-stats"><span><strong>{RESEARCH_LIBRARY.length}</strong> open research notes</span><span><strong>2</strong> research disciplines</span><span><strong>0</strong> account requirements</span></div>
      </div>
      <div className="rl-hero-orbit" aria-hidden="true"><div className="rl-orbit1"/><div className="rl-orbit2"/><div className="rl-orbit3"/><span>∂V/∂S</span><i>σ</i><b>α</b></div>
    </div>
  </section>
  <section className="rl-intro rl-shell" aria-label="Editorial approach">
    <div><p className="rl-eyebrow">THE RESEARCH STANDARD</p><h2>Start with the <em>reasoning.</em><br/>Keep the uncertainty.</h2></div>
    <div><p>We connect finance vocabulary to the calculation beneath it. These articles are educational explainers, not market calls, price targets, investment recommendations, or promises of profit.</p><p>Numbers in worked examples are illustrative. Primary and specialist references appear with each guide so readers can inspect the underlying material.</p></div>
  </section>
  <div className="rl-shell rl-index-nav" aria-label="Research categories">
    {RESEARCH_CATEGORIES.map((c,i)=><a href={i===0?"#ipo-research":"#quant-research"} key={c.id}><span>0{i+1}</span>{c.label}<span aria-hidden="true">↓</span></a>)}
  </div>
  <section className="rl-catalog rl-shell" id="ipo-research">
    <div className="rl-heading"><div><p className="rl-eyebrow">SECTION 01 / PUBLIC CAPITAL MARKETS</p><h2>IPO <em>Intelligence.</em></h2><p>{RESEARCH_CATEGORIES[0].summary}</p></div><Link href="/ipo">Open the IPO dashboard <span aria-hidden="true">↗</span></Link></div>
    <div className="rl-cards">{ipo.map((x,i)=><ResearchCard key={x.slug} item={x} index={i}/>)}</div>
  </section>
  <section className="rl-catalog rl-shell" id="quant-research">
    <div className="rl-heading"><div><p className="rl-eyebrow">SECTION 02 / MATHEMATICAL FINANCE</p><h2>Quantitative <em>Finance.</em></h2><p>{RESEARCH_CATEGORIES[1].summary}</p></div><Link href="/learn">Explore the learning lab <span aria-hidden="true">↗</span></Link></div>
    <div className="rl-cards">{quant.map((x,i)=><ResearchCard key={x.slug} item={x} index={i}/>)}</div>
  </section>
  <section className="rl-catalog rl-shell" aria-labelledby="ahq-in-depth-research">
    <div className="rl-heading"><div><p className="rl-eyebrow">NEXT / DEEPER RESEARCH</p><h2 id="ahq-in-depth-research">Explore further. <em>Sign in to go deeper.</em></h2><p>Read public summaries of our research papers, mathematical models and India macro analysis. Complete collections and interactive lessons require an AlphaHedgeQuant account.</p></div></div>
    <div className="rl-cards">
      {[
        {href:"/research",eyebrow:"LITERATURE / RESEARCH PAPERS",title:"Research Papers",description:"Understand the questions, methods and assumptions behind papers on quant finance, statistics and financial markets."},
        {href:"/models",eyebrow:"MODELLING / QUANT FINANCE",title:"Quant Models",description:"Public introductions to market risk, volatility, statistical arbitrage and portfolio construction, with full model lessons after sign-in."},
        {href:"/reports",eyebrow:"ECONOMICS / MACRO OUTLOOK",title:"Macro Outlook",description:"Read public summaries of India macro research and log in for the complete source-based field notes."}
      ].map((x,i)=><article className="rl-card" key={x.href}><div className="rl-card-top"><span>{String(i+1).padStart(2,"0")} / {x.eyebrow}</span></div><h3><Link href={x.href}>{x.title}</Link></h3><p>{x.description}</p><div className="rl-card-bottom"><Link href={x.href}>Read public overview <span aria-hidden="true">↗</span></Link></div></article>)}
    </div>
   </section>
   <section className="rl-end rl-shell"><p className="rl-eyebrow">LEARN / VERIFY / QUESTION</p><h2>Better questions create<br/><em>better research.</em></h2><p>Research methods evolve. Refer to the latest regulations and primary disclosures when making real-world decisions.</p><div><Link href="/ipo">IPO Intelligence ↗</Link><Link href="/research">Research Papers ↗</Link><Link href="/about">About AlphaHedgeQuant ↗</Link></div></section>
 </div>;
}
