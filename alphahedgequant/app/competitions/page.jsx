import CompetitionDashboard from "@/components/CompetitionDashboard";
import {COMPETITIONS,VERIFIED_AS_OF} from "@/lib/competitionEvents.mjs";
import "./competitions.css";

export const metadata = {
  title: "Chess Tournaments, Hackathons & Quant Championships | AlphaHedgeQuant",
  description: "Explore verified chess tournaments, hackathons, trading competitions and quantitative finance championships around the world. Filter by country, category, status and date.",
  alternates: {canonical:"/competitions"},
  openGraph: {title:"Global Competition Calendar | AlphaHedgeQuant",url:"/competitions",type:"website"}
};

export default function CompetitionsPage() {
  const structured={
    "@context":"https://schema.org", "@type":"CollectionPage",
    name:"AlphaHedgeQuant Competition Calendar",
    url:"https://www.alphahedgequant.com/competitions",
    isAccessibleForFree:true,
    mainEntity:{"@type":"ItemList",itemListElement:COMPETITIONS.map((e,i)=>({
      "@type":"ListItem",position:i+1,name:e.title,url:"https://www.alphahedgequant.com/competitions/"+e.slug
    }))}
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
    <CompetitionDashboard initialEvents={COMPETITIONS} verifiedAsOf={VERIFIED_AS_OF}/>
  </>;
}
