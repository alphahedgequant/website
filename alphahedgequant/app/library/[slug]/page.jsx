import Link from "next/link";
import {notFound} from "next/navigation";
import {LIBRARY_PUBLISHED,RESEARCH_LIBRARY,getResearchArticle} from "@/lib/publicResearchLibrary.mjs";
import "../library.css";

const host="https://www.alphahedgequant.com";
export const dynamicParams=false;
export function generateStaticParams(){return RESEARCH_LIBRARY.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}){
 const {slug}=await params;
 const a=getResearchArticle(slug);if(!a)return {};
 const url="/library/"+a.slug;
 return {
  title:a.title+" | AlphaHedgeQuant Research",
  description:a.description,
  alternates:{canonical:url},
  openGraph:{title:a.title+" — AlphaHedgeQuant",description:a.description,url,type:"article",publishedTime:LIBRARY_PUBLISHED},
  robots:{index:true,follow:true}
 };
}

const dateText="09 NOV 2026";
function TopicSection({section,index}){
 return <section id={"section-"+index} className="rl-article-section">
  <p className="rl-section-no">FIELD NOTE / {String(index+1).padStart(2,"0")}</p>
  <h2>{section.h}</h2>
  {(section.p||[]).map((p,i)=><p key={i}>{p}</p>)}
  {section.formula&&<div className="rl-formula" role="note"><span>MODEL / FORMULA</span><pre>{section.formula}</pre></div>}
  {section.example&&<aside className="rl-example"><span>WORKED EXAMPLE / ILLUSTRATIVE</span><h3>{section.example.title}</h3><p>{section.example.body}</p></aside>}
  {(section.bullets||[]).length>0&&<ul>{section.bullets.map((b,i)=><li key={i}>{b}</li>)}</ul>}
 </section>;
}
export default async function ResearchArticle({params}){
 const {slug}=await params;const item=getResearchArticle(slug);
 if(!item)notFound();
 const related=RESEARCH_LIBRARY.filter(x=>x.slug!==item.slug&&x.category===item.category).slice(0,3);
 const path=host+"/library/"+item.slug;
 const schema={
  "@context":"https://schema.org",
  "@type":"Article",
  headline:item.title,
  description:item.description,
  mainEntityOfPage:{"@type":"WebPage","@id":path},
  url:path,
  datePublished:LIBRARY_PUBLISHED,
  dateModified:LIBRARY_PUBLISHED,
  inLanguage:"en-IN",
  isAccessibleForFree:true,
  author:{"@type":"Organization",name:"AlphaHedgeQuant Research Desk",url:host+"/about"},
  publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:host}
 };
 return <div className="rl-site rl-article-route">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  <div className="rl-shell rl-breadcrumb"><Link href="/">ALPHAHEDGEQUANT</Link><span>/</span><Link href="/library">OPEN RESEARCH</Link><span>/</span><span>{item.category==="ipo"?"IPO":"QUANT"}</span></div>
  <header className="rl-article-hero"><div className="rl-shell">
   <p className="rl-eyebrow">{item.eyebrow} / FREE PUBLIC RESEARCH</p>
   <h1>{item.title}</h1>
   <p className="rl-article-dek">{item.lead}</p>
   <div className="rl-byline"><span>ALPHAHEDGEQUANT RESEARCH DESK</span><span aria-hidden="true">·</span><time dateTime={LIBRARY_PUBLISHED}>{dateText}</time><span aria-hidden="true">·</span><span>{item.read} MIN READ</span></div>
  </div></header>
  <article className="rl-paper">
    <div className="rl-paper-wrap">
      <nav aria-label="On this page" className="rl-on-this-page"><span>IN THIS NOTE</span>{item.sections.map((s,i)=><a href={"#section-"+i} key={s.h}>{String(i+1).padStart(2,"0")} — {s.h}</a>)}</nav>
      <div className="rl-paper-main">
        <div className="rl-summary"><span>THE ESSENTIALS</span><h2>What you'll learn</h2><ul>{item.takeaways.map((t,i)=><li key={i}>{t}</li>)}</ul></div>
        {item.sections.map((section,i)=><TopicSection key={section.h} section={section} index={i}/>)}
        <section className="rl-sources"><p className="rl-section-no">SOURCES & FURTHER READING</p><h2>Go to the source.</h2>
        <p>These are reference materials for context; the calculations, explanations and examples above are AlphaHedgeQuant's educational synthesis. For regulatory or trading decisions, always check the most recent official documents.</p>
        <ol>{item.sources.map((s,i)=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} <span aria-hidden="true">↗</span></a></li>)}</ol>
        </section>
        <section className="rl-disclaimer" aria-label="Editorial method and disclosure"><strong>Research note · educational use only</strong><p>Worked numbers are hypothetical, not live stock prices or trading signals. This content was prepared with AI assistance for educational explanation; source links are provided for independent verification. No personal investment advice is offered. AlphaHedgeQuant does not guarantee the completeness, accuracy or future performance of any scenario.</p></section>
      </div>
    </div>
  </article>
  <section className="rl-after rl-shell"><div><p className="rl-eyebrow">APPLY THE CONCEPT</p><h2>From explanation<br/>to <em>exploration.</em></h2><p>Interactive product tools may require sign-in. This research article is free and public.</p><Link href={item.companion.href} className="rl-cta">{item.companion.label} <span>↗</span></Link></div></section>
  <section className="rl-related rl-shell"><div className="rl-related-top"><h2>Continue the research.</h2><Link href="/library">View all research ↗</Link></div>
    <div className="rl-related-grid">{related.map(x=><article key={x.slug}><span>{x.eyebrow}</span><h3><Link href={"/library/"+x.slug}>{x.title}</Link></h3><Link href={"/library/"+x.slug}>Read the guide ↗</Link></article>)}</div>
  </section>
 </div>;
}
