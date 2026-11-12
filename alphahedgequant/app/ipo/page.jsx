import IpoScreen from "@/components/IpoScreen";
import "./ipo-intro.css";

export const metadata={
 title: "IPO Intelligence India — IPO Calendar, GMP, Subscription, Allotment & Listing | AlphaHedgeQuant",
 description:"Explore the Indian IPO market: upcoming and open NSE/BSE issues, mainboard and SME price bands, bidding dates, allotments, category subscriptions, unofficial GMP trends and actual listing performance. Open access.",
 alternates: { canonical: "/ipo" },
 robots:{index:true,follow:true},
 openGraph:{
  title:"IPO Intelligence India | AlphaHedgeQuant",
  description:"Follow IPO calendars, mainboard and SME issues, unofficial GMP, investor demand and actual listing outcomes.",
  url:"/ipo",type:"website",siteName:"AlphaHedgeQuant"
 }
};
const root="https://www.alphahedgequant.com";
const common={"@context":"https://schema.org"};
const pageSchema={
 ...common,"@type":"CollectionPage",name:"India IPO Intelligence — Calendar, GMP and Listing Performance",
 url:root+"/ipo",isAccessibleForFree:true,inLanguage:"en-IN",
 description:"An openly accessible Indian IPO dashboard with price bands, issue dates, category-wise subscription where available, unofficial GMP and actual listing performance.",
 publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:root}
};
const faqs=[
 {
  q:"What is an IPO grey-market premium (GMP)?",
  a:"GMP is an unofficial reported premium or discount to an IPO's issue price. Neither NSE, BSE nor SEBI publishes or verifies it. A disputed or unavailable GMP cannot be treated as a confirmed listing gain."
 },
 {
  q:"How is an indicative IPO listing gap calculated?",
  a:"The displayed indicative percentage is reported GMP divided by the upper issue price, multiplied by 100. The indicative listing price is upper issue price plus reported GMP. It is only an arithmetic illustration, not a forecast or actual trading price."
 },
 {
  q:"What is the difference between subscription and allotment?",
  a:"Subscription shows demand relative to shares offered to each investor category, expressed as a multiple such as 2 times. Allotment is the subsequent allocation of shares to applicants, conducted through the prescribed process."
 },
 {
  q:"Is a listed IPO's return the same as its pre-listing GMP?",
  a:"No. Actual listing gain or loss measures the recorded debut price against the issue price. Pre-listing GMP is an unofficial sentiment indicator and may differ sharply from the eventual listing performance."
 },
 {
  q:"How frequently is the IPO dashboard updated?",
  a:"The dashboard checks its connected provider when loaded, about once per minute while visible, and when the browser regains focus. Source timestamps and verification status are shown separately because a fresh fetch does not prove the underlying figures are current."
 }
];
const faqSchema={...common,"@type":"FAQPage",mainEntity:faqs.map(x=>({"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}}))};
export default function Page(){
 return <main className="ahq-ipo-page">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(pageSchema).replace(/</g,"\\u003c")}}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema).replace(/</g,"\\u003c")}}/>
  <section className="ipo-page-hero" aria-labelledby="ipo-page-title">
   <div className="ipo-page-shell">
    <p className="ipo-hero-kicker">ALPHAHEDGEQUANT / PUBLIC MARKET INTELLIGENCE</p>
    <h1 id="ipo-page-title" aria-label="Indian IPO Intelligence">Indian IPO<br/><em>Intelligence.</em></h1>
    <p className="ipo-hero-lead">From the first prospectus to the first traded price. Track upcoming IPOs, public issue terms, subscription demand, unofficial GMP and realized listing outcomes — without confusing expectations with evidence.</p>
    <div className="ipo-hero-tags"><span>NSE + BSE</span><span>MAINBOARD + SME</span><span>LISTING PERFORMANCE</span></div>
    <div className="ipo-brief" aria-label="IPO Intelligence introduction">
     <p className="ipo-brief__label">THE IPO LIFECYCLE</p>
     <div className="ipo-brief__track">
      <div className="ipo-brief__step"><strong>01 / DISCOVER</strong><span>Follow the bidding window, issue price, lot size and upcoming listings.</span></div>
      <div className="ipo-brief__step"><strong>02 / EXAMINE</strong><span>Compare subscription demand and reported grey-market premiums, including disputed or missing figures.</span></div>
      <div className="ipo-brief__step"><strong>03 / VERIFY</strong><span>Compare indicative listing gaps against actual historical outcomes, and check exchange records.</span></div>
     </div><div className="ipo-brief__progress" aria-hidden="true"/>
    </div>
   </div>
  </section>
  <IpoScreen />
  <section className="ipo-education" aria-labelledby="ipo-explained">
   <div className="ipo-page-shell">
    <p className="ipo-hero-kicker">03 / THE RESEARCH NOTES</p>
    <h2 id="ipo-explained">Know the number.<br/><em>Know its limits.</em></h2>
    <div className="ipo-faqs">{faqs.map((item,i)=><details key={item.q} open={i===0}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
    <p className="ipo-education-note">All market figures are for research and education. Verify company offer documents, official subscription status, allotments and listing data before relying on a reported value. This page does not provide an apply-or-avoid recommendation.</p>
   </div>
  </section>
 </main>;
}
