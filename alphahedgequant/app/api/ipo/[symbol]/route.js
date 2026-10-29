// IPO detail gateway for the same attributed GMP provider used by the list.
// The detail page never accepts arbitrary external URLs.
export const runtime="nodejs";
export const revalidate=600;
const n=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
export async function GET(_req,{params}) {
  const slug=String(params.symbol||"");
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug))return Response.json({ok:false,error:"Invalid IPO identifier"},{status:400});
  try {
    const res=await fetch("https://xflot.com/api/public/market/ipos/"+encodeURIComponent(slug),{next:{revalidate:600},signal:AbortSignal.timeout(10000),headers:{Accept:"application/json"}});
    if(!res.ok)throw Error("Provider unavailable");
    const data=await res.json();
    if(!data.ok||!data.ipo)throw Error("IPO data unavailable");
    const x=data.ipo, price=n(x.priceMax), gmp=n(x.lastGmp ?? x.gmp?.at(-1)?.gmp);
    const subs=Array.isArray(x.subs)?x.subs:[];
    const sub=key=>n(subs.find(z=>String(z.category).toUpperCase()===key)?.timesSub);
    const ipo={
      name:x.name||slug, symbol:x.symbol||null, type:x.board||null,status:x.status||null,
      priceBand:price!=null?"₹"+(n(x.priceMin)!=null?x.priceMin+"–":"")+price:null,
      issuePrice:price,lotSize:n(x.lotSize),issueSize:n(x.issueSizeCr),
      openDate:x.openDate||null,closeDate:x.closeDate||null,
      allotmentDate:x.allotmentDate||null,listingDate:x.listingDate||null,
      listingPrice:n(x.listingPrice),listingGain:n(x.listingGainPct),
      subscription:{qib:sub("QIB"),nii:sub("NII"),retail:sub("RETAIL"),total:sub("TOTAL")??n(x.lastSubX)},
      gmp:gmp!=null?{price:gmp,percentage:price>0?+(100*gmp/price).toFixed(2):null}:null,
      gmpHistory:Array.isArray(x.gmp)?x.gmp.slice(-30).map(v=>({date:v.observedAt,premium:n(v.gmp),source:v.source||null})):[],
      gmpDisputed:x.gmpDisputed===true,gmpSources:n(x.gmpSources),gmpSpread:n(x.gmpSpread),
      source:"Xflot",sourceUrl:"https://xflot.com/api-docs",
      about:null,strengths:null,risks:null,prospectus:null,nseInfo:null
    };
    return Response.json({ok:true,ipo,source:"Xflot",disclaimer:data.disclaimer||"GMP is unofficial and cannot guarantee listing performance."},{headers:{"Cache-Control":"public, s-maxage=600"}});
  }catch(e){return Response.json({ok:false,error:"IPO details are temporarily unavailable."},{status:503});}
}