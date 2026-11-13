import Link from "next/link";
import {auth} from "@clerk/nextjs/server";
import {UnlockResearch} from "../../components.jsx";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {MacroFigures} from "./MacroFigures.jsx";
import "../../../library.css";
import "../../preview.css";
import "./macro-report.css";

export const dynamic="force-dynamic";
export const revalidate=0;
const route="/library/series/macro-outlook/october-2026";
const title="India Macro Monthly — October 2026 | The Export Breakout Meets the Inflation Test";
const dek="Record merchandise exports, a heavier sequential import bill and renewed inflation pressure: what October's numbers mean for Indian growth, industry and business cash flows.";
export const metadata={
 title,description:dek,robots:{index:true,follow:true},
 alternates:{canonical:route},
 openGraph:{title,description:dek,url:route,type:"article",publishedTime:"2026-11-13T17:30:00.000Z",siteName:"AlphaHedgeQuant"},
 twitter:{card:"summary_large_image",title,description:dek}
};
function extractBlocks(markdown){
 const lines=markdown.split(/\r?\n/),blocks=[];
 for(let i=0;i<lines.length;){
  const line=lines[i].trim();
  if(!line||line==="---"){i++;continue}
  if((line.startsWith("# ")||line.startsWith("## "))&&(line.includes("ALPHAHEDGEQUANT | MONTHLY")||line.includes("October 2026 — The Export Breakout"))){i++;continue}
  if(line==="AlphaHedgeQuant Research Desk"){i++;continue}
  const source=line.match(/^\[(S\d{2})\]\s+(.+)$/);
  if(source){blocks.push({type:"source",id:source[1].toLowerCase(),text:source[2]});i++;continue}
  const heading=line.match(/^(#{1,3}) (.+)$/);
  if(heading){blocks.push({type:"heading",level:heading[1].length,text:heading[2],id:heading[2].match(/^(\d{2})\s+\//)?.[1]||null});i++;continue}
  if(line.startsWith("|")&&i+1<lines.length&&lines[i+1].trim().startsWith("|---")){
   const headers=line.split("|").slice(1,-1).map(x=>x.trim());i+=2;const rows=[];
   while(i<lines.length&&lines[i].trim().startsWith("|")){rows.push(lines[i].split("|").slice(1,-1).map(x=>x.trim()));i++}
   blocks.push({type:"table",headers,rows});continue
  }
  if(line.startsWith("- ")){
   const items=[];while(i<lines.length&&lines[i].trim().startsWith("- ")){items.push(lines[i].trim().slice(2));i++}
   blocks.push({type:"list",items});continue
  }
  const p=[line];i++;
  while(i<lines.length&&lines[i].trim()&&!/^#{1,3} |^[-] |^\||^---$|^\[S\d{2}\]/.test(lines[i].trim())){p.push(lines[i].trim());i++}
  blocks.push({type:"paragraph",text:p.join(" ")});
 }
 return blocks;
}
function Inline({text}){
 const re=/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\)|\[[Ss]\d{2}(?:,\s*[Ss]\d{2})*\]|https?:\/\/[^\s;]+)/g;
 return <>{String(text).split(re).filter(Boolean).map((p,i)=>{
  if(p.startsWith("**")&&p.endsWith("**"))return <strong key={i}>{p.slice(2,-2)}</strong>;
  const mdLink=p.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
  if(mdLink)return <a key={i} href={mdLink[2]} target="_blank" rel="noopener noreferrer">{mdLink[1]} ↗</a>;
  if(/^\[S\d{2}(?:,\s*S\d{2})*\]$/i.test(p)){
   const ids=p.slice(1,-1).split(/,\s*/);
   return <span className="macro-source-cites" key={i}>{ids.map((id,j)=><a href={"#source-"+id.toLowerCase()} key={id}>{id}{j<ids.length-1?", ":""}</a>)}</span>;
  }
  if(p.startsWith("https://")){const url=p.replace(/[).,]+$/,"");return <span key={i}><a href={url} target="_blank" rel="noopener noreferrer">Source ↗</a>{p.slice(url.length)}</span>;}
  return <span key={i}>{p}</span>;
 })}</>;
}
const figureFor={"01":"trade","02":"inflation","03":"industry","05":"fiscal","10":"valuation"};
function BodyBlock({block}){
 switch(block.type){
  case "heading":
   return block.level===1?<h2 className="macro-section-heading" id="sources">{block.text}</h2>:
    block.level===2?<h2 className="macro-section-heading" id={block.id?"section-"+block.id:undefined}>{block.text}</h2>:
    <h3 className="macro-subheading">{block.text}</h3>;
  case "paragraph":return <p className="macro-copy"><Inline text={block.text}/></p>;
  case "list":return <ul className="macro-list">{block.items.map((s,i)=><li key={i}><Inline text={s}/></li>)}</ul>;
  case "table":return <div className="macro-table-scroll" role="region" aria-label="Research data table" tabIndex={0}><table><thead><tr>{block.headers.map((h,i)=><th key={i} scope="col"><Inline text={h}/></th>)}</tr></thead><tbody>{block.rows.map((r,i)=><tr key={i}>{r.map((col,j)=><td key={j}><Inline text={col}/></td>)}</tr>)}</tbody></table></div>;
  case "source":return <div className="macro-source-entry" id={"source-"+block.id}><span>{block.id.toUpperCase()}</span><p><Inline text={block.text}/></p></div>;
  default:return null;
 }
}
const absolute="https://www.alphahedgequant.com"+route;
export default async function OctoberMacroReport(){
 // Access is enforced while rendering on the server. Public visitors never
 // receive the complete article in the HTML or a downloadable page payload.
 const {userId}=await auth();
 const signedIn=Boolean(userId);
 const blocks=signedIn?extractBlocks(readFileSync(join(process.cwd(),"content","october-2026-india-macro.md"),"utf8")):[];
 const sections=signedIn?blocks.filter(b=>b.type==="heading"&&b.id):[];
 const schema={"@context":"https://schema.org","@type":"Article",
  headline:"India Macro Monthly — October 2026: The Export Breakout Meets the Inflation Test",
  description:dek,datePublished:"2026-11-13T17:30:00+00:00",dateModified:"2026-11-13T17:30:00+00:00",
  mainEntityOfPage:absolute,url:absolute,isAccessibleForFree:false,inLanguage:"en-IN",
  author:{"@type":"Organization",name:"AlphaHedgeQuant Research Desk"},
  publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:"https://www.alphahedgequant.com"}};
 return <div className="rl-site rp-site rp-article ahq-macro-report">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  <div className="rl-shell rp-breadcrumb"><Link href="/">AlphaHedgeQuant</Link><span>/</span><Link href="/library">Research Library</Link><span>/</span><Link href="/library/series/macro-outlook">Macro Outlook</Link><span>/</span><span>October 2026</span></div>
  <header className="rp-article-top"><div className="rl-shell">
   <p className="rl-eyebrow">INDIA MACRO / MONTHLY REPORT / OCTOBER 2026</p>
   <h1>The export breakout meets <em>the inflation test.</em></h1>
   <p className="rp-article-lead">{dek}</p>
   <div className="rp-meta"><span>ALPHAHEDGEQUANT RESEARCH DESK</span><span>13 NOV 2026</span><span>{signedIn?"COMPLETE RESEARCH":"PUBLIC RESEARCH PREVIEW"}</span></div>
   <div className="macro-hero-stats" aria-label="October India macro highlights">
    {[["$49.47bn","GOODS EXPORTS","+45.1% year on year"],["$39.88bn","GOODS TRADE DEFICIT","Down 6.3% YoY · up 32% MoM"],["6.09%","OCTOBER CPI","Food inflation 8.94%"],["5.50%","RBI REPO RATE","After October 7 decision"]].map(x=><div key={x[1]}><strong>{x[0]}</strong><span>{x[1]}</span><small>{x[2]}</small></div>)}
   </div>
  </div></header>
  <main className="rp-paper"><article className="rp-paper-shell">
   <div className="rp-note-label"><span>01 / {signedIn?"COMPLETE MACRO RESEARCH":"OPEN RESEARCH PREVIEW"}</span><span>RESEARCH CUT-OFF / 13 NOV 2026</span></div>
   <div className="rp-lead-note"><p>Record exports are an encouraging signal. Higher inflation and a large import bill mean the economic story is more complicated.</p><span>THE CENTRAL RESEARCH QUESTION</span></div>
   {!signedIn&&<div className="macro-public-preview" aria-label="October 2026 research introduction">
    <p className="macro-preview-kicker">THE OCTOBER STORY / THREE LINKED QUESTIONS</p>
    <h2>More exports. A stubborn import bill. Higher inflation.</h2>
    <p>October's trade figures make a strong first impression: merchandise exports reached <strong>$49.47 billion</strong>, about <strong>45% above</strong> the same month a year earlier. But India's merchandise trade deficit remained large at <strong>$39.88 billion</strong>, despite being smaller than a year ago.</p>
    <p>The trade balance also worsened relative to September. That matters because a record export month can coexist with a rising import bill. Economic growth looks more durable when the additional sales translate into stronger business margins, returns on capital and cash flows.</p>
    <MacroFigures section="trade"/>
    <div className="macro-preview-takeaways">
     <h3>What the complete research examines</h3>
     <ol>
      <li><strong>Trade and services:</strong> which parts of the export breakout appear sustainable, and why services estimates should be treated as provisional.</li>
      <li><strong>Inflation and household demand:</strong> how October CPI of 6.09% and food inflation of 8.94% affect purchasing power and monetary policy.</li>
      <li><strong>Industry, jobs and credit:</strong> why investment-linked manufacturing can grow faster than broad consumption.</li>
      <li><strong>Company valuations:</strong> when higher sales actually produce higher margins, cash flow and economic value.</li>
     </ol>
    </div>
    <div className="macro-preview-gate">
     <div className="rp-next-list"><span>01</span><span>Complete data tables and monthly sector narrative</span><span aria-hidden="true">↗</span></div>
     <div className="rp-next-list"><span>02</span><span>All seven research exhibits and scenario comparisons</span><span aria-hidden="true">↗</span></div>
     <div className="rp-next-list"><span>03</span><span>Detailed valuation interpretation and 25-source register</span><span aria-hidden="true">↗</span></div>
    </div>
   </div>}
   {!signedIn&&<UnlockResearch href={"/sign-in?redirect_url="+encodeURIComponent(route)} label="Read complete October report"
      notice="Research figures are dated to the stated publication cut-off. Provisional releases and historical scenarios should be read in their original time context."/>}
   {signedIn&&<>
   <nav className="macro-toc" aria-label="In this report"><span>RESEARCH INDEX</span><div>{sections.map(s=><a href={"#section-"+s.id} key={s.id}>{s.text.replace(/^\d{2}\s+\//,"").trim()}</a>)}<a href="#sources">Source register</a></div></nav>
   <section className="rp-article-body macro-article-body" aria-label="Full October macro research">
    {blocks.map((block,i)=><div className="macro-block" key={i}><BodyBlock block={block}/>{block.type==="heading"&&figureFor[block.id]&&<MacroFigures section={figureFor[block.id]}/>}</div>)}
   </section>
   </>}
   <div className="macro-report-end"><strong>ALPHAHEDGEQUANT RESEARCH</strong><p>Research and educational analysis, not investment advice. Provisional services estimates, comparison periods, illustrative INR conversions and hypothetical valuation scenarios are explicitly identified in the article.</p><Link href="/library/series/macro-outlook">← Return to Macro Outlook</Link></div>
  </article></main>
 </div>;
}
