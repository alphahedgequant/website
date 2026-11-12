import Link from "next/link";
import {notFound} from "next/navigation";
import {RESEARCH_PREVIEWS,PREVIEW_RELEASE_DATE,findResearchPreview,findResearchSeries} from "@/lib/publicResearchPreviews.mjs";
import {UnlockResearch,SeriesBreadcrumb} from "../../components.jsx";
import "../../../library.css";
import "../../preview.css";
const root="https://www.alphahedgequant.com";
export const dynamicParams=false;
export function generateStaticParams(){return RESEARCH_PREVIEWS.map(x=>({series:x.series,slug:x.slug}));}
export async function generateMetadata({params}){
 const {series,slug}=await params;const article=findResearchPreview(series,slug);
 if(!article)return {};
 const path="/library/series/"+article.series+"/"+article.slug;
 return {
  title:article.title+" | AlphaHedgeQuant Research",
  description:article.subtitle+" Explore the research question, methodology and implications.",
  alternates:{canonical:path},
  openGraph:{title:article.title+" | AlphaHedgeQuant Research",description:article.subtitle,url:path,type:"article",publishedTime:PREVIEW_RELEASE_DATE},
  robots:{index:true,follow:true}
 };
}
function niceDate(iso){const d=new Date(iso+"T00:00:00Z");return new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",year:"numeric",month:"short",day:"numeric"}).format(d);}
export default async function PreviewArticle({params}){
 const {series:id,slug}=await params;const item=findResearchPreview(id,slug);
 if(!item)notFound();const category=findResearchSeries(id);
 const path=root+"/library/series/"+item.series+"/"+item.slug;
 const related=RESEARCH_PREVIEWS.filter(x=>x.series===item.series&&x.slug!==item.slug).slice(0,3);
 const schema={"@context":"https://schema.org","@type":"Article",headline:item.title,description:item.subtitle,url:path,mainEntityOfPage:{"@type":"WebPage","@id":path},datePublished:PREVIEW_RELEASE_DATE,isAccessibleForFree:true,inLanguage:"en-IN",author:{"@type":"Organization",name:"AlphaHedgeQuant Research Desk"},publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:root}};
 return <div className="rl-site rp-site rp-article">
   <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
   <SeriesBreadcrumb series={category}/>
   <header className="rp-article-top"><div className="rl-shell">
     <p className="rl-eyebrow">{item.label} / RESEARCH NOTE</p>
     <h1>{item.title}</h1>
     <p className="rp-article-lead">{item.subtitle}</p>
     <div className="rp-meta"><span>ALPHAHEDGEQUANT RESEARCH DESK</span><span>RESEARCH NOTE · {niceDate(PREVIEW_RELEASE_DATE)}</span><span>{item.reading}</span></div>
   </div></header>
   <main className="rp-paper">
    <div className="rp-paper-shell">
     <div className="rp-note-label"><span>01 / RESEARCH NOTES</span><span>ALPHAHEDGEQUANT / RESEARCH</span></div>
     <div className="rp-lead-note"><p>{item.question}</p><span>THE QUESTION THIS RESEARCH ADDRESSES</span></div>
     <section className="rp-article-body" aria-label="Research note">
       <h2>Understanding the research</h2>
       {item.intro.map((t,i)=><p key={i}>{t}</p>)}
       {item.formula&&<div className="rp-equation"><span>MODEL IDEA / SCHEMATIC</span><pre>{item.formula}</pre></div>}
       <h2>Three things to take away</h2><ul>{item.takeaways.map(x=><li key={x}>{x}</li>)}</ul>
     </section>
     {item.paper&&<aside className="rp-original-reference"><p>ORIGINAL PAPER / PUBLISHER ACCESS</p><a href={item.paper.url} target="_blank" rel="noopener noreferrer">{item.paper.label} <span aria-hidden="true">↗</span></a><small>Original publications are independently hosted and may have their own licensing or access restrictions. AlphaHedgeQuant does not grant third-party publisher access.</small></aside>}
     {item.series==="macro-outlook"&&<p className="rp-history-note">ARCHIVED RESEARCH · Original report dated {niceDate(item.published)}. Figures or policy interpretations in the full archived text may no longer describe current conditions. Verify primary releases before using historical data.</p>}
     <section className="rp-locked-outline" aria-labelledby="rp-locked-heading">
       <p className="rl-eyebrow">02 / FURTHER RESEARCH</p>
       <h2 id="rp-locked-heading">Explore the <em>next questions.</em></h2>
       <p>The full research workspace develops these questions through additional evidence, methodology and examples.</p>
       <ol>{item.locked.map((x,i)=><li key={x}><span>{String(i+1).padStart(2,"0")}</span>{x}<span aria-hidden="true">⌁</span></li>)}</ol>
     </section>
     <UnlockResearch href={item.fullRoute} label={category.fullLabel} notice={category.notice}/>
     <p className="rp-research-disclaimer">Educational research, not investment advice. Examples, model formulas and publication metadata require independent verification for investment or policy decisions. This note is original explanatory material, not a reproduced or redistributed third-party research paper.</p>
    </div>
   </main>
   <section className="rl-shell rp-related">
     <div className="rp-related-head"><h2>Further reading</h2><Link href={"/library/series/"+category.id}>All {category.title} ↗</Link></div>
     <div className="rp-related-grid">{related.map(a=><article key={a.slug}><span>{a.label}</span><h3><Link href={"/library/series/"+a.series+"/"+a.slug}>{a.title}</Link></h3><Link href={"/library/series/"+a.series+"/"+a.slug}>Read research ↗</Link></article>)}</div>
   </section>
 </div>;
}
