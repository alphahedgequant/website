// Validated IPO feed normalization. Source statuses are preserved, but issues
// whose bidding windows have conclusively elapsed must NEVER appear as open.
// Missing values and disputed GMP are not converted into fictional estimates.
export const numberOrNull=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
const positiveOrNull=x=>{const n=numberOrNull(x);return n!==null&&n>0?n:null;};
const isoDay=x=>{
 if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}/.test(x))return null;
 const date=x.slice(0,10);
 const ms=Date.parse(date+"T00:00:00Z");
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===date?date:null;
};
export function istToday(now=new Date()){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const get=part=>parts.find(x=>x.type===part)?.value;
 return get("year")+"-"+get("month")+"-"+get("day");
}
export function classifyIpoStatus(input){
 const s=String(input||"").trim().toLowerCase().replace(/[\s_-]+/g," ");
 if(["open","open now","subscription open"].includes(s))return "open";
 if(["upcoming","announced","forthcoming","opening soon"].includes(s))return "upcoming";
 if(["listed","listing completed","trading","recently listed"].includes(s))return "listed";
 if(["closed","allotted","allotment","allotment pending","subscription closed","listing soon","to be listed","basis of allotment"].includes(s))return "closed";
 return null;
}
export function reconcileIpoStatus(status,openDate,closeDate,today=istToday()){
 if(status!=="open"&&status!=="upcoming")return {status,adjusted:false};
 const open=isoDay(openDate),close=isoDay(closeDate);
 // Date corrections only for clearly identified bid windows; an unknown
 // provider status or already-listed issue is never overridden.
 if(close&&close<today)return {status:"closed",adjusted:status!=="closed"};
 if(open&&open>today)return {status:"upcoming",adjusted:status!=="upcoming"};
 if(open&&close&&open<=today&&close>=today)return {status:"open",adjusted:status!=="open"};
 return {status,adjusted:false};
}
export function normalizeIpo(x,today=istToday()){
 const price=positiveOrNull(x?.priceMax);
 const min=positiveOrNull(x?.priceMin);
 const rawGmp=numberOrNull(x?.lastGmp);
 const disputed=x?.gmpDisputed===true;
 const gmp=disputed?null:rawGmp;
 const rawStatus=String(x?.status||"").trim();
 const sourceStatus=classifyIpoStatus(rawStatus);
 const state=reconcileIpoStatus(sourceStatus,x?.openDate,x?.closeDate,today);
 const lotSize=positiveOrNull(x?.lotSize);
 const issuePrice=price;
 const listingGain=numberOrNull(x?.listingGainPct);
 return {
  id:String(x?.slug||"").trim(),name:String(x?.name||"").trim()||"Unnamed IPO",
  symbol:typeof x?.symbol==="string"?x.symbol.slice(0,40):null,
  segment:String(x?.board||"").trim().toUpperCase()==="SME"?"SME":String(x?.board||"").trim().toUpperCase()==="MAINBOARD"?"Mainboard":"Unspecified",
  status:state.status,rawStatus,sourceStatus,dateAdjusted:state.adjusted,
  issuePrice,priceBand:min!==null&&price!==null?"₹"+min+"–₹"+price:price!==null?"₹"+price:null,
  lotSize,minimumInvestment:price!==null&&lotSize!==null?+(price*lotSize).toFixed(2):null,
  issueSize:positiveOrNull(x?.issueSizeCr),
  open:isoDay(x?.openDate),close:isoDay(x?.closeDate),listingDate:isoDay(x?.listingDate),
  gmp,gmpPct:gmp!==null&&price!==null?+(100*gmp/price).toFixed(2):null,
  estimatedListingPrice:gmp!==null&&price!==null?+(price+gmp).toFixed(2):null,
  gmpSources:positiveOrNull(x?.gmpSources),gmpSpread:numberOrNull(x?.gmpSpread),
  gmpDisputed:disputed,subscription:numberOrNull(x?.lastSubX),
  listingGain,source:"Xflot",sourceUrl:"https://www.xflot.com/ipo",gmpUnofficial:true
 };
}
const ascending=(a,b,key)=>(a[key]||"9999").localeCompare(b[key]||"9999");
const descending=(a,b,key)=>(b[key]||"").localeCompare(a[key]||"");
export function buildIpoBuckets(rows,today=istToday()){
 const buckets={open:[],upcoming:[],closed:[],listed:[],other:[]};
 const unknownStatuses={};let invalid=0,duplicates=0,correctedStatuses=0;
 const seen=new Set();
 for(const row of rows){
  if(!row||typeof row!=="object"){invalid++;continue;}
  const ipo=normalizeIpo(row,today);
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(ipo.id)){invalid++;continue;}
  if(seen.has(ipo.id)){duplicates++;continue;}seen.add(ipo.id);
  if(ipo.dateAdjusted)correctedStatuses++;
  if(ipo.status)buckets[ipo.status].push(ipo);
  else{const key=ipo.rawStatus||"(missing)";unknownStatuses[key]=(unknownStatuses[key]||0)+1;buckets.other.push(ipo);}
 }
 buckets.open.sort((a,b)=>ascending(a,b,"close"));
 buckets.upcoming.sort((a,b)=>ascending(a,b,"open"));
 buckets.closed.sort((a,b)=>descending(a,b,"close"));
 buckets.listed.sort((a,b)=>descending(a,b,"listingDate"));
 return {buckets,unknownStatuses,invalid,duplicates,correctedStatuses,accepted:Object.values(buckets).reduce((n,x)=>n+x.length,0)};
}
