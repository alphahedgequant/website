import {normalizeIpo} from "@/lib/ipoFeed.mjs";
import {verifiedIpoReference} from "@/lib/ipoVerifiedEvents.mjs";
// IPO detail gateway for the same attributed GMP provider used by the list.
// The detail page never accepts arbitrary external URLs.
export const runtime="nodejs";
export const revalidate=60;
const n=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
export async function GET(_req,{params}) {
  const {symbol}=await params;
  const slug=String(symbol||"");
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug))return Response.json({ok:false,error:"Invalid IPO identifier"},{status:400});
  try {
    const res=await fetch("https://www.xflot.com/api/public/market/ipos/"+encodeURIComponent(slug),{next:{revalidate:60},signal:AbortSignal.timeout(10000),headers:{Accept:"application/json"}});
    if(!res.ok)throw Error("Provider unavailable");
    const data=await res.json();
    if(!data.ok||!data.ipo)throw Error("IPO data unavailable");
    const x=data.ipo, normalized=normalizeIpo({...data.ipo,slug}), price=normalized.issuePrice;
    const gmp=normalized.gmp;
    const subs=Array.isArray(x.subs)?x.subs:[];
    const sub=key=>n(subs.find(z=>String(z.category).toUpperCase()===key)?.timesSub);
    const ipo={
      name:normalized.name, symbol:normalized.symbol, type:normalized.segment,status:normalized.status,
      priceBand:normalized.priceBand,
      issuePrice:price,lotSize:normalized.lotSize,minAmount:normalized.minimumInvestment,issueSize:normalized.issueSize,
      openDate:normalized.open,closeDate:normalized.close,
      allotmentDate:normalized.allotmentDate,listingDate:normalized.listingDate,
      listingPrice:normalized.listingPrice,listingGain:normalized.listingGain,
      subscription:{qib:sub("QIB"),nii:sub("NII"),retail:sub("RETAIL"),total:sub("TOTAL")??n(x.lastSubX)},
      gmp:gmp!=null?{price:gmp,percentage:normalized.gmpPct}:null,
      gmpHistory:Array.isArray(x.gmp)?x.gmp.slice(-30).map(v=>({date:v.observedAt,premium:n(v.gmp),source:v.source||null})):[],
      gmpDisputed:normalized.gmpDisputed,gmpSources:normalized.gmpSources,gmpSpread:normalized.gmpSpread,
      dateAdjusted:normalized.dateAdjusted,statusReason:normalized.statusReason,priceSuspect:normalized.priceSuspect,
      source:"Xflot",sourceUrl:"https://xflot.com/api-docs",
      about:null,strengths:null,risks:null,prospectus:verifiedIpoReference(slug)?.sourceUrl||null,nseInfo:"https://www.nseindia.com/market-data/all-upcoming-issues-ipo"
    };
    return Response.json({ok:true,ipo,source:"Xflot",disclaimer:data.disclaimer||"GMP is unofficial and cannot guarantee listing performance."},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=30"}});
  }catch(e){return Response.json({ok:false,error:"IPO details are temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}