import Link from "next/link";

export const metadata={
 title:"Our Philosophy | About AlphaHedgeQuant",
 description:"Why AlphaHedgeQuant is building a research-first, transparent and accessible quantitative finance platform for the long term."
};

const commitments=[
 {no:"01",title:"We believe in earned trust.",body:"Trust is built through repeated, ordinary decisions: saying where data comes from, acknowledging when it is missing, correcting an error, and making uncertainty visible. We aspire to be judged by these habits rather than by any promise."},
 {no:"02",title:"We believe knowledge should travel.",body:"The methods used in quantitative finance should not be reserved for those who already speak its language. We want a curious beginner to understand the question, the reasoning and the limits of a model before relying on its outputs."},
 {no:"03",title:"We believe time reveals quality.",body:"A good financial tool is not finished when it launches. It becomes worthy of attention through maintenance, careful testing, honest feedback and the willingness to improve the difficult parts."},
 {no:"04",title:"We believe restraint is strength.",body:"Markets invite certainty where none exists. We choose to separate observation from inference, an illustrative calculation from live data, and a research result from investment advice."}
];

export default function AboutPage(){
 return <main className="ahq-about-story">
  <style>{`
   .ahq-about-story{overflow:hidden}
   .ahq-about-story .serif{font-family:"Playfair Display",Georgia,serif;letter-spacing:-.055em;font-weight:400}
   .ahq-about-story .about-halo{background:radial-gradient(ellipse 65% 55% at 72% 35%,rgba(227,190,79,.11),transparent 80%),linear-gradient(180deg,rgba(255,255,255,.02),transparent)}
   .ahq-about-story .manifesto-index{font-family:Georgia,serif;font-size:clamp(4rem,8vw,7rem);font-style:italic;line-height:1;color:var(--ahq-amber);opacity:.3}
   .ahq-about-story .statement{border-top:1px solid var(--ahq-line)}
   .ahq-about-story .quote-frame{border:1px solid var(--ahq-line);background:linear-gradient(140deg,rgba(227,190,79,.07),transparent 70%),var(--ahq-surface)}
  `}</style>
  <section className="about-halo border-b border-line">
   <div className="max-w-shell mx-auto px-5 pt-20 md:pt-32 pb-24 md:pb-36">
    <p className="eyebrow mb-8">[ ABOUT US / OUR CONVICTIONS ]</p>
    <h1 className="serif max-w-6xl text-[clamp(4.2rem,10vw,9.5rem)] leading-[.98] text-body">The future is built<br/>by those who <em className="text-amber">care.</em></h1>
    <div className="mt-12 md:mt-16 grid md:grid-cols-2 gap-10">
     <p className="serif text-3xl md:text-4xl text-body leading-snug">We are not trying to win a moment of attention. We are trying to create something worth returning to.</p>
     <p className="text-base md:text-lg text-muted leading-relaxed">AlphaHedgeQuant is an independent initiative to make market research, options analytics and quantitative learning more understandable. It is a work in progress, shaped by the belief that finance deserves better questions, clearer explanations and more responsible tools.</p>
    </div>
   </div>
  </section>

  <section className="max-w-shell mx-auto px-5 py-24 md:py-36 grid lg:grid-cols-[.7fr_1.3fr] gap-10 md:gap-20">
   <div><p className="eyebrow">[ A LETTER FROM THE BEGINNING ]</p><p className="font-mono text-xs tracking-widest text-muted mt-6">OUR REASON FOR BUILDING</p></div>
   <div>
    <h2 className="serif text-5xl md:text-6xl leading-tight text-body">Markets are complicated.<br/><em>Clarity shouldn't be a privilege.</em></h2>
    <div className="mt-9 space-y-6 text-base md:text-lg leading-[1.9] text-muted">
     <p>Every day, people encounter more financial information than they can reasonably evaluate. A chart looks decisive. A number looks scientific. A confident prediction sounds comforting. Yet none of these alone makes a decision wiser.</p>
     <p>We started from a simpler conviction: people deserve tools that explain themselves. If a model produces a result, we should be able to explain what went into it, what it assumes, and what could make it wrong.</p>
     <p>That is the standard we are working toward. Not perfect predictions. Not a secret formula. A place where curiosity can mature into understanding, and where better research habits can be learned, challenged and refined.</p>
     <p>We know credibility cannot be borrowed from a beautiful design. It has to be earned through what we build, how we behave, and what we do when things go wrong.</p>
    </div>
   </div>
  </section>

  <section className="bg-surface border-y border-line">
   <div className="max-w-shell mx-auto px-5 py-24 md:py-32">
    <p className="eyebrow mb-7">[ OUR PHILOSOPHY ]</p>
    <h2 className="serif text-5xl md:text-7xl max-w-4xl text-body leading-tight">The principles are simple.<br/><em className="text-amber">Living by them is the work.</em></h2>
    <div className="mt-16">{commitments.map(c=><article key={c.no} className="statement grid md:grid-cols-[.22fr_.78fr] gap-6 md:gap-14 py-10 md:py-14">
     <span className="manifesto-index">{c.no}</span>
     <div className="grid lg:grid-cols-[.85fr_1fr] gap-6 md:gap-10 items-start">
      <h3 className="serif text-3xl md:text-4xl text-body">{c.title}</h3>
      <p className="text-muted leading-relaxed text-base md:text-lg">{c.body}</p>
     </div>
    </article>)}</div>
   </div>
  </section>

  <section className="max-w-shell mx-auto px-5 py-24 md:py-36">
   <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-24 items-center">
    <div><p className="eyebrow mb-6">[ THE LONG VIEW ]</p><h2 className="serif text-5xl md:text-7xl leading-tight text-body">We intend to<br/><em className="text-amber">build for years,</em><br/>not headlines.</h2><p className="text-muted leading-relaxed text-lg mt-8 max-w-lg">Our ambition is to keep making this platform more thoughtful, useful and accountable over time. We cannot ask people to trust us because we say so. We have to make the work worthy of that trust.</p></div>
    <div className="quote-frame rounded-3xl p-8 md:p-12"><p className="font-mono text-[11px] tracking-[.2em] text-amber">A STANDARD WE HOLD OURSELVES TO</p><blockquote className="serif text-3xl md:text-5xl leading-snug text-body mt-12">“If we cannot explain a result honestly, we have not finished the work.”</blockquote><p className="mt-10 pt-6 border-t border-line text-xs text-muted tracking-widest font-mono">ALPHAHEDGEQUANT / OUR GUIDING PRINCIPLE</p></div>
   </div>
  </section>

  <section className="border-y border-line bg-surface">
   <div className="max-w-shell mx-auto px-5 py-24 md:py-28">
    <p className="eyebrow mb-7">[ WHAT WE BUILD / WHAT WE DO NOT CLAIM ]</p>
    <div className="grid md:grid-cols-2 gap-12">
     <div><h2 className="serif text-4xl md:text-5xl text-body">Tools grounded in inquiry.</h2><p className="mt-6 text-muted leading-relaxed">We are building a workspace for exploring companies, market data, options, quantitative models and educational research. Features and data availability will evolve, and integrations may be unavailable at times.</p><div className="flex flex-wrap gap-3 mt-8"><Link href="/options" className="btn-primary">Explore options analytics ↗</Link><Link href="/models" className="btn-ghost">Explore our models ↗</Link></div></div>
     <div><h2 className="serif text-4xl md:text-5xl text-body">No promise of certainty.</h2><p className="mt-6 text-muted leading-relaxed">We do not promise profitable trades, complete market coverage, faultless data or risk-free outcomes. Research and educational model outputs are not individualized investment advice. Wherever possible, our aim is to distinguish sourced data, assumptions and illustrative scenarios.</p><Link href="/learn" className="inline-block mt-8 text-amber text-sm hover:underline">Start with understanding ↗</Link></div>
    </div>
   </div>
  </section>

  <section className="max-w-shell mx-auto px-5 py-24 md:py-32 grid lg:grid-cols-[.9fr_1.1fr] gap-12">
   <div><p className="eyebrow mb-6">[ THE PERSON BUILDING IT ]</p><h2 className="serif text-5xl md:text-6xl text-body">There is a person<br/>behind the <em>promise.</em></h2></div>
   <div className="rounded-2xl border border-line p-7 md:p-10">
    <p className="font-mono text-[11px] tracking-widest text-amber">FOUNDER / ALPHAHEDGEQUANT</p>
    <h3 className="serif text-4xl md:text-5xl text-body mt-6">Shreyash</h3>
    <p className="mt-5 text-muted leading-relaxed">Building AlphaHedgeQuant as a long-term project focused on quantitative research, financial understanding and more useful tools for curious market participants.</p>
    <a href="https://x.com/Shreyy214" target="_blank" rel="noopener noreferrer" className="inline-flex mt-8 text-amber hover:underline text-sm">Connect on X · @Shreyy214 ↗</a>
   </div>
  </section>

  <section className="border-t border-line bg-surface"><div className="max-w-shell mx-auto px-5 py-24 md:py-32 text-center">
   <p className="eyebrow mb-6">[ THE STORY CONTINUES ]</p><h2 className="serif text-5xl md:text-7xl leading-tight text-body">The best work<br/><em className="text-amber">takes time.</em></h2><p className="text-muted mt-7 max-w-xl mx-auto leading-relaxed">If you believe financial understanding should be more accessible and research should be held to a higher standard, you're welcome to explore what we're building.</p><Link href="/" className="btn-primary !rounded-full mt-9">Return to AlphaHedgeQuant ↗</Link>
  </div></section>
 </main>;
}
