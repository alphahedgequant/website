import Link from "next/link";
import {notFound} from "next/navigation";
import {PUBLIC_RESEARCH_SERIES,RESEARCH_PREVIEWS,PREVIEW_RELEASE_DATE,findResearchSeries} from "@/lib/publicResearchPreviews.mjs";
import {UnlockResearch,SeriesBreadcrumb} from "../components.jsx";
import "../../library.css";
import "../preview.css";
const root="https://www.alphahedgequant.com";
export const dynamicParams=false;
export function generateStaticParams(){return PUBLIC_RESEARCH_SERIES.map(x=>({series:x.id}));}
export async function generateMetadata({params}){
 const {series:id}=await params;const category=findResearchSeries(id);
 if(!category)return {};
 return {
  title:category.title+" — Public Previews & Full Research | AlphaHedgeQuant",
  description:category.summary+" Read previews free; sign in for complete AHQ research.",
  alternates:{canonical:"/library/series/"+category.id},
  openGraph:{title:category.title+" — AlphaHedgeQuant Open Research",description:category.summary,url:"/library/series/"+category.id,type:"website"}
 };
}
export default async function SeriesLanding({params}){
 const {series:id}=await params;const category=findResearchSeries(id);if(!category)notFound();
 const articles=RESEARCH_PREVIEWS.filter(x=>x.series===category.id);
 const path=root+"/library/series/"+category.id;
 const schema={"@context":"https://schema.org","@type":"CollectionPage",name:category.title+" — Public Research Previews",description:category.summary,url:path,isAccessibleForFree:true,datePublished:PREVIEW_RELEASE_DATE,hasPart:articles.map(x=>({"@type":"WebPage",url:path+"/"+x.slug,name:x.title}))};
 return <div className="rl-site rp-site">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  <SeriesBreadcrumb/>
  <header className="rp-series-hero"><div className="rl-shell">
   <p className="rl-eyebrow">{category.eyebrow} / PUBLIC RESEARCH PREVIEW</p>
   <h1>{category.title}<em>.</em></h1>
   <p className="rp-series-sub">{category.intro}</p>
   <div className="rp-hero-data"><span>{articles.length} RESEARCH PREVIEWS</span><span>NO LOGIN FOR PREVIEWS</span><span>FULL READING REQUIRES SIGN-IN</span></div>
  </div></header>
  <main className="rl-shell rp-catalogue">
    <div className="rp-catalogue-header"><div><p className="rl-eyebrow">THE READING LIST</p><h2>Explore the <em>questions.</em></h2><p>{category.subject}</p></div><Link href="/library">← All public research</Link></div>
    <div className="rp-cards">{articles.map((item,i)=><article key={item.slug} className="rp-card">
      <div className="rp-card-index"><span>{String(i+1).padStart(2,"0")} / {item.label}</span><span>{item.reading}</span></div>
      <h3><Link href={path.replace(root,"")+"/"+item.slug}>{item.title}</Link></h3>
      <p>{item.subtitle}</p>
      <p className="rp-card-excerpt">{item.intro[0]}</p>
      <div className="rp-card-bottom"><Link href={"/library/series/"+category.id+"/"+item.slug}>Read the public preview <span aria-hidden="true">↗</span></Link><span>FULL MATERIAL / ACCOUNT ACCESS</span></div>
    </article>)}</div>
    <div className="rp-collection-note"><p className="rl-eyebrow">EDITORIAL NOTE</p><p>{category.notice}</p></div>
    <UnlockResearch href={category.fullRoute} label={category.fullLabel} notice={category.notice} compact/>
  </main>
 </div>;
}
