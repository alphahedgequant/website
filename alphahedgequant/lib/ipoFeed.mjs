// IPO provider payload validation and normalization.
// Preserve missing GMP as null (not zero) and never convert implied gain into realized gain.
export const numberOrNull=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
export function classifyIpoStatus(input){
 const s=String(input||"").trim().toLowerCase().replace(/[\s_-]+/g," ");
 if(["open","open now","subscription open"].includes(s))return "open";
 if(["upcoming","announced","forthcoming","opening soon"].includes(s))return "upcoming";
 if(["listed","listing completed","trading","recently listed"].includes(s))return "listed";
 if(["closed","allotted","allotment","allotment pending","subscription closed","listing soon","to be listed","basis of allotment"].includes(s))return "closed";
 return null; // Unrecognized provider statuses are reported, never silently discarded.
}
export function normalizeIpo(x){
 const price=numberOrNull(x?.priceMax);
 const min=numberOrNull(x?.priceMin);
 const gmp=numberOrNull(x?.lastGmp);
 const rawStatus=String(x?.status||"").trim();
 const ipo={
  id:String(x?.slug||""),name:String(x?.name||"IPO"),symbol:x?.symbol||null,
  segment:String(x?.board||"").toUpperCase()==="SME"?"SME":"Mainboard",
  status:classifyIpoStatus(rawStatus),rawStatus,
  issuePrice:price,priceBand:min!=null&&price!=null?"₹"+min+"–₹"+price:price!=null?"₹"+price:null,
  lotSize:numberOrNull(x?.lotSize),issueSize:numberOrNull(x?.issueSizeCr),
  open:x?.openDate||null,close:x?.closeDate||null,listingDate:x?.listingDate||null,
  gmp,gmpPct:gmp!=null&&price>0?+(100*gmp/price).toFixed(2):null,
  estimatedListingPrice:gmp!=null&&price>0?+(price+gmp).toFixed(2):null,
  gmpSources:numberOrNull(x?.gmpSources),gmpSpread:numberOrNull(x?.gmpSpread),
  gmpDisputed:x?.gmpDisputed===true,subscription:numberOrNull(x?.lastSubX),
  listingGain:numberOrNull(x?.listingGainPct),
  source:"Xflot",sourceUrl:"https://www.xflot.com/ipo-gmp",gmpUnofficial:true
 };
 return ipo;
}
export function buildIpoBuckets(rows){
 const buckets={open:[],upcoming:[],closed:[],listed:[]};
 const unknownStatuses={};let invalid=0,duplicates=0;const seen=new Set();
 for(const row of rows){
  const ipo=normalizeIpo(row);
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(ipo.id)){invalid++;continue;}
  if(seen.has(ipo.id)){duplicates++;continue;}seen.add(ipo.id);
  if(ipo.status) buckets[ipo.status].push(ipo);
  else { const key=ipo.rawStatus||"(missing)";unknownStatuses[key]=(unknownStatuses[key]||0)+1; }
 }
 return {buckets,unknownStatuses,invalid,duplicates,accepted:Object.values(buckets).reduce((n,x)=>n+x.length,0)};
}
