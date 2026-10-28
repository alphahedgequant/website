import Link from "next/link";
import StockSearch from "@/components/StockSearch";
import WaitlistForm from "@/components/WaitlistForm";

const experiences=[
  {no:"01",eyebrow:"THE MARKET, IN CONTEXT",title:"See beyond the ticker.",desc:"Discover Indian and US companies, understand price movements and find the research that matters.",href:"/screener",cta:"Explore markets",symbol:"↗"},
  {no:"02",eyebrow:"DERIVATIVES, DECODED",title:"Make sense of uncertainty.",desc:"Explore option chains, implied volatility and the shape of risk before constructing a strategy.",href:"/options",cta:"Enter options desk",symbol:"σ"},
  {no:"03",eyebrow:"IDEAS, TESTED",title:"Curiosity deserves evidence.",desc:"Move from quantitative ideas to understandable models and repeatable research workflows.",href:"/models",cta:"Explore quant models",symbol:"α"}
];
const disciplines=[
 {number:"I",title:"Clarity before conviction.",copy:"A good decision starts by knowing what the numbers mean, where they came from, and what they cannot tell you."},
 {number:"II",title:"Process before prediction.",copy:"Markets do not owe anyone certainty. We focus on the quality of the question, the method, and the evidence."},
 {number:"III",title:"Progress over spectacle.",copy:"Useful tools improve with scrutiny, iteration and time. That is the kind of platform we intend to build."}
];
export default function Home(){
 return <main className="ahq-editorial-home">
   <style>{`
    .ahq-editorial-home{overflow:hidden}
    .ahq-editorial-home .serif{font-family:"Playfair Display",Georgia,serif;font-weight:400;letter-spacing:-.057em}
    .ahq-editorial-home .editorial-hero{background:radial-gradient(ellipse 55% 55% at 80% 36%,rgba(203,169,91,.10),transparent 70%),linear-gradient(180deg,rgba(255,255,255,.012),transparent)}
    .ahq-editorial-home .brand-frame{border:1px solid var(--ahq-line);background:linear-gradient(140deg,rgba(227,190,79,.08),transparent 54%),var(--ahq-surface);box-shadow:0 30px 90px -65px rgba(0,0,0,.75)}
    .ahq-editorial-home .orbital{width:min(62vw,430px);aspect-ratio:1;border:1px solid rgba(227,190,79,.24);border-radius:50%;display:grid;place-items:center;position:relative}
    .ahq-editorial-home .orbital:before,.ahq-editorial-home .orbital:after{content:"";position:absolute;border-radius:50%;inset:13%;border:1px solid rgba(227,190,79,.17)}
    .ahq-editorial-home .orbital:after{inset:29%;border-color:rgba(227,190,79,.3)}
    .ahq-editorial-home .orbital-glyph{font-family:Georgia,serif;font-size:clamp(8rem,18vw,14rem);font-style:italic;font-weight:400;color:var(--ahq-amber);opacity:.86;line-height:1;z-index:1}
    .ahq-editorial-home .experience{transition:transform .24s ease,border-color .24s ease;background:var(--ahq-surface)}
    .ahq-editorial-home .experience:hover{transform:translateY(-5px);border-color:var(--ahq-amber)}
    .ahq-editorial-home .hairline{background:linear-gradient(90deg,transparent,var(--ahq-amber),transparent);height:1px;opacity:.4}
    .ahq-editorial-home .chapter-no{font-family:Georgia,serif;font-size:5rem;line-height:1;opacity:.23}
    @media(prefers-reduced-motion:reduce){.ahq-editorial-home .experience{transition:none}}
   `}</style>
   <section className="editorial-hero relative">
    <div className="max-w-shell mx-auto px-5 pt-20 md:pt-28 pb-24 md:pb-32">
      <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[.27em] text-amber"><span className="h-px w-9 bg-amber"/> ALPHAHEDGEQUANT / AN INDEPENDENT PERSPECTIVE</div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_.82fr] gap-12 lg:gap-8 items-center mt-10">
       <div>
        <h1 className="serif text-[clamp(4.5rem,9.8vw,9rem)] leading-[.92] text-body">The market<br/>rewards <span className="italic text-amber">clarity.</span></h1>
        <p className="mt-9 max-w-xl text-lg md:text-xl leading-relaxed text-muted">Not louder opinions. Better questions. AlphaHedgeQuant brings research, options analytics and quantitative thinking together for people who want to understand markets more deeply.</p>
        <div className="mt-10 flex flex-wrap gap-3">
         <Link href="/options" className="btn-primary !rounded-full !px-7 !py-3">Explore the options desk <span aria-hidden="true">↗</span></Link>
         <Link href="/about" className="btn-ghost !rounded-full !px-7 !py-3">What we believe <span aria-hidden="true">↗</span></Link>
        </div>
       </div>
       <div className="brand-frame rounded-[2rem] min-h-[370px] lg:min-h-[520px] flex items-center justify-center relative overflow-hidden" aria-label="Abstract AlphaHedgeQuant alpha symbol">
        <div className="absolute top-6 left-6 font-mono tracking-[.25em] text-[10px] text-muted">THE DISCIPLINE OF THINKING</div>
        <div className="orbital"><span className="orbital-glyph">α</span></div>
        <div className="absolute bottom-6 right-6 font-mono tracking-[.25em] text-[10px] text-muted">INFORMATION ≠ UNDERSTANDING</div>
       </div>
      </div>
      <div className="mt-16 md:mt-24 pt-6 border-t border-line grid gap-4 sm:grid-cols-3 text-xs font-mono tracking-[.16em] text-muted">
       <p>RESEARCH WITHOUT THE NOISE</p><p>TOOLS WITHOUT THE MYSTERY</p><p>AMBITION WITHOUT SHORTCUTS</p>
      </div>
    </div>
   </section>

   <section className="bg-surface border-y border-line py-24 md:py-32">
    <div className="max-w-shell mx-auto px-5">
     <p className="eyebrow mb-6">[ WHY WE EXIST ]</p>
     <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-end">
      <h2 className="serif text-5xl md:text-7xl leading-[1.03] text-body">Information is everywhere.<br/><em className="text-amber">Understanding is rare.</em></h2>
      <p className="text-lg leading-relaxed text-muted max-w-md">More dashboards will not automatically create better investors. We want to make reasoning visible: what a metric measures, what a strategy assumes and where a model might fail.</p>
     </div>
    </div>
   </section>

   <section className="max-w-shell mx-auto px-5 py-24 md:py-32">
    <div className="flex flex-wrap gap-4 justify-between items-end mb-12"><div><p className="eyebrow mb-5">[ THE WORKSPACE ]</p><h2 className="serif text-5xl md:text-7xl text-body">Tools for the <em>thoughtful.</em></h2></div><Link href="/models" className="text-sm text-amber hover:underline">Explore the research library ↗</Link></div>
    <div className="grid md:grid-cols-3 gap-4">
     {experiences.map(e=><Link key={e.no} href={e.href} className="experience group rounded-2xl border border-line p-7 md:p-8 flex flex-col min-h-[370px]">
       <div className="flex justify-between items-start"><span className="font-mono text-xs text-amber tracking-widest">{e.no} / {e.eyebrow}</span><span className="serif text-6xl text-amber/70" aria-hidden="true">{e.symbol}</span></div>
       <div className="mt-auto"><h3 className="serif text-4xl leading-tight text-body">{e.title}</h3><p className="mt-5 text-muted text-sm md:text-base leading-relaxed">{e.desc}</p><p className="mt-8 text-xs uppercase tracking-widest font-mono text-amber group-hover:translate-x-1 transition-transform">{e.cta} ↗</p></div>
     </Link>)}
    </div>
   </section>

   <section className="bg-surface border-y border-line py-24 md:py-32">
     <div className="max-w-shell mx-auto px-5">
      <p className="eyebrow mb-5">[ AN OPEN DOOR TO RESEARCH ]</p>
      <h2 className="serif text-5xl md:text-6xl text-body max-w-3xl">Begin with a company.<br/><em>Follow the evidence.</em></h2>
      <p className="text-muted mt-5 mb-9 max-w-2xl leading-relaxed">Search the companies covered by our connected feeds and begin exploring their financials and market context. Availability and freshness depend on the underlying providers.</p>
      <StockSearch/>
     </div>
   </section>

   <section className="max-w-shell mx-auto px-5 py-24 md:py-32">
    <p className="eyebrow mb-5">[ THE PRINCIPLES ]</p><h2 className="serif text-5xl md:text-7xl max-w-4xl text-body">Built for people who<br/>prefer <em className="text-amber">substance.</em></h2>
    <div className="mt-14 grid md:grid-cols-3 gap-10">{disciplines.map(d=><div key={d.number} className="border-t border-line pt-6"><span className="chapter-no text-amber">{d.number}</span><h3 className="serif text-3xl mt-5 text-body">{d.title}</h3><p className="text-muted mt-4 leading-relaxed">{d.copy}</p></div>)}</div>
   </section>

   <section className="border-t border-line bg-surface">
    <div className="max-w-shell mx-auto px-5 py-24 md:py-32 grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-center">
     <div><p className="eyebrow mb-5">[ A LONG-TERM COMMITMENT ]</p><h2 className="serif text-5xl md:text-7xl text-body leading-tight">Not here for a moment.<br/><em className="text-amber">Here to build.</em></h2><p className="max-w-xl mt-6 text-muted leading-relaxed">We want to earn credibility through transparent methods, careful iteration and products that become more useful with time. Trust is not something a homepage can declare. It is something our work must deserve.</p><Link href="/about" className="btn-ghost !rounded-full mt-8">Read our philosophy ↗</Link></div>
     <div className="rounded-2xl border border-line p-8 md:p-10"><p className="font-mono text-xs tracking-widest text-amber">RESEARCH, NOT PROMISES</p><p className="serif text-3xl mt-8 leading-snug text-body">We would rather explain what we do not know than pretend to know what happens next.</p><div className="hairline my-8"/><p className="text-xs text-muted leading-relaxed">Market data may be delayed or unavailable. Educational models and analytics are not investment recommendations or guarantees of returns.</p></div>
    </div>
   </section>
   <section id="waitlist" className="max-w-shell mx-auto px-5 py-24 md:py-32 text-center">
    <p className="eyebrow mb-5">[ BUILD WITH THE FUTURE IN MIND ]</p><h2 className="serif text-5xl md:text-7xl text-body">Stay curious.<br/><em className="text-amber">Stay close.</em></h2><p className="max-w-lg mx-auto text-muted mt-5 mb-8">Follow the next chapters of AlphaHedgeQuant as our research and tools evolve.</p><div className="flex justify-center"><WaitlistForm source="landing"/></div>
   </section>
 </main>;
}
