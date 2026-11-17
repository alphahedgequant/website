import {verifiedIpoReference,IPO_REFERENCE_AS_OF} from "@/lib/ipoVerifiedEvents.mjs";
export async function generateMetadata({params}){
 const {symbol}=await params;
 const slug=String(symbol||"");
 const verified=verifiedIpoReference(slug);
 const title=verified?verified.name+" IPO — Dates, Price Band, GMP, Subscription & Listing | AlphaHedgeQuant":"IPO Issue Details — Dates, GMP and Listing | AlphaHedgeQuant";
 const description=verified
  ?verified.name+" IPO overview: issuer-referenced bidding schedule, issue details, unofficial GMP observations, and actual listing information when available. Updated provider data is date-checked."
  :"Public Indian IPO issue details, price-band information, subscription, reported GMP and listing outcomes. Source dates and data limitations are shown.";
 return {
   title,description,alternates:{canonical:"/ipo/"+encodeURIComponent(slug)},
   robots:{index:Boolean(verified),follow:true},
   openGraph:{title,description,url:"https://www.alphahedgequant.com/ipo/"+encodeURIComponent(slug),type:"website"},
   other:verified?{"source-reviewed-on":IPO_REFERENCE_AS_OF}:{}
 };
}
export default function PublicIpoDetailLayout({children}){return children;}
