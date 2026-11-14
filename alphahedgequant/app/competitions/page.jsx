import CompetitionBoardFrame from "@/components/CompetitionBoardFrame";
import {COMPETITIONS} from "@/lib/competitionEvents.mjs";
import "./competitions.css";

export const metadata = {
  title:"Global Tournament Board | Chess, Hackathons & Quant Championships | AlphaHedgeQuant",
  description:"Explore live chess broadcasts, India-first country-wise tournament schedules, hackathons and quant finance championships. Search participants, upcoming dates and official registration links.",
  alternates:{canonical:"/competitions"},
  openGraph:{title:"AlphaHedgeQuant Global Tournament Board",url:"/competitions",type:"website"}
};

export default function CompetitionsPage(){
  const structured={
    "@context":"https://schema.org","@type":"CollectionPage",
    name:"Global Tournament Board — AlphaHedgeQuant",
    url:"https://www.alphahedgequant.com/competitions",
    isAccessibleForFree:true,
    mainEntity:{"@type":"ItemList",itemListElement:COMPETITIONS.map((event,i)=>({
      "@type":"ListItem",position:i+1,name:event.title,
      url:"https://www.alphahedgequant.com/competitions/"+event.slug
    }))}
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
    <div className="sr-only"><h1>Global Tournament Board — Chess, Hackathons and Quant Championships</h1>
      <p>India-first worldwide competition calendar, verified event profiles, participants and updated live chess broadcasts.</p>
    </div>
    <CompetitionBoardFrame/>
  </>;
}
