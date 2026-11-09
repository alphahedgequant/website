import PublicLearnCourse from "./PublicLearnCourse";
export const metadata={
 title:"Learn Quant Finance Free — Mathematics, Risk, Options & ML | AlphaHedgeQuant",
 description:"Learn quantitative finance for free with six full modules, mathematical intuition, worked examples, options, risk management, machine learning and Python exercises. No login required to read.",
 alternates:{canonical:"/learn"},
 robots:{index:true,follow:true},
 openGraph:{title:"Free Quant Finance Course | AlphaHedgeQuant",description:"Read all six quant finance learning modules for free, from first principles to Python practice.",url:"/learn",type:"website"}
};
export default function LearnPage(){
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"Course",name:"Quant Finance Learning Lab",description:"Six-module open quantitative finance curriculum with mathematics, risk, equities, machine learning, fixed income and Python practice.",provider:{"@type":"Organization",name:"AlphaHedgeQuant",url:"https://www.alphahedgequant.com"},url:"https://www.alphahedgequant.com/learn",isAccessibleForFree:true,hasCourseInstance:{"@type":"CourseInstance",courseMode:"online"}}).replace(/</g,"\\u003c")}}/>
  <PublicLearnCourse/>
 </>;
}
