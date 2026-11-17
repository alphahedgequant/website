// Auditable IPO feed normalization. No dates, prices or GMP are synthesized.
// Unknown or undated offers are separated from announced bidding windows.
// Identity-based de-duplication prevents the same issuer appearing as both listed
// and upcoming when a provider returns historical/summary rows together.
export const numberOrNull=x=>x===null||x===undefined||x===""?null:Number.isFinite(Number(x))?Number(x):null;
const positiveOrNull=x=>{const n=numberOrNull(x);return n!==null&&n>0?n:null;};
const isoDay=x=>{
 if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}/.test(x))return null;
 const day=x.slice(0,10),ms=Date.parse(day+"T00:00:00Z");
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===day?day:null;
};
export function istToday(now=new Date()){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const part=name=>parts.find(x=>x.type===name)?.value;
 return part("year")+"-"+part("month")+"-"+part("day");
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
 if(status!=="open"&&status!=="upcoming")return {status,adjusted:false,reason:null};
 const open=isoDay(openDate),close=isoDay(closeDate);
 if(close&&close<today)return {status:"closed",adjusted:true,reason:"Bidding window already elapsed"};
 if(open&&open>today)return {status:"upcoming",adjusted:status!=="upcoming",reason:status!=="upcoming"?"Opening date is in the future":null};
 if(open&&close&&open<=today&&close>=today)return {status:"open",adjusted:status!=="open",reason:status!=="open"?"Published window is active":null};
 if(!open)return {status:"pipeline",adjusted:true,reason:"No confirmed opening date in source"};
 if(status==="open"&&!close)return {status:"pipeline",adjusted:true,reason:"Closing date has not been verified"};
 return {status,adjusted:false,reason:null};
}
const sourceSlug=x=>String(x?.slug||"").trim();
export function normalizeIpo(x,today=istToday()){
 const rawMax=positiveOrNull(x?.priceMax),rawMin=positiveOrNull(x?.priceMin);
 // Under-₹1 issue price in a mainboard IPO is an unusual source value:
 // withhold it until verified, do not guess an implied 100x/10000x correction.
 const priceSuspect=rawMax!==null&&(rawMax<1||(rawMin!==null&&rawMin>rawMax));
 const price=priceSuspect?null:rawMax,min=priceSuspect?null:rawMin;
 const rawGmp=numberOrNull(x?.lastGmp);
 const disputed=x?.gmpDisputed===true;
 const gmp=disputed?null:rawGmp;
 const rawStatus=String(x?.status||"").trim(),sourceStatus=classifyIpoStatus(rawStatus);
 const status=reconcileIpoStatus(sourceStatus,x?.openDate,x?.closeDate,today);
 const lotSize=positiveOrNull(x?.lotSize);
 const listingPrice=positiveOrNull(x?.listingPrice);
 const rawGain=numberOrNull(x?.listingGainPct);
 const listingGainComputed=rawGain===null&&listingPrice!==null&&price!==null;
 const listingGain=rawGain!==null?rawGain:listingGainComputed?+((listingPrice/price-1)*100).toFixed(2):null;
 const segment=String(x?.board||"").trim().toUpperCase();
 return {
  id:sourceSlug(x),name:String(x?.name||"").trim().slice(0,180)||"Unnamed IPO",
  symbol:typeof x?.symbol==="string"?x.symbol.slice(0,40):null,
  segment:segment==="SME"?"SME":segment==="MAINBOARD"?"Mainboard":"Unspecified",
  status:status.status,rawStatus,sourceStatus,dateAdjusted:status.adjusted,statusReason:status.reason,
  issuePrice:price,priceSuspect,
  priceBand:min!==null&&price!==null?"₹"+min+"–₹"+price:price!==null?"₹"+price:null,
  lotSize,minimumInvestment:price!==null&&lotSize!==null?+(price*lotSize).toFixed(2):null,
  issueSize:positiveOrNull(x?.issueSizeCr),
  open:isoDay(x?.openDate),close:isoDay(x?.closeDate),
  allotmentDate:isoDay(x?.allotmentDate),listingDate:isoDay(x?.listingDate),
  listingPrice,listingGain,listingGainComputed,
  gmp,gmpPct:gmp!==null&&price!==null?+(100*gmp/price).toFixed(2):null,
  estimatedListingPrice:gmp!==null&&price!==null?+(price+gmp).toFixed(2):null,
  gmpSources:positiveOrNull(x?.gmpSources),gmpSpread:numberOrNull(x?.gmpSpread),
  gmpDisputed:disputed,subscription:numberOrNull(x?.lastSubX),
  source:"Xflot",sourceUrl:"https://www.xflot.com/ipo",gmpUnofficial:true
 };
}
// Issuer aliases differ between the provider's date-less pipeline feed and
// listed exchange records. Only exact, normalized company names are merged.
export function ipoIssuerKey(name){
 return String(name||"").toLowerCase().replace(/\b(limited|ltd|india|ipo)\b/g,"")
   .replace(/\bsteels\b/g,"steel").replace(/[^a-z0-9]/g,"").trim();
}
const rank={listed:5,open:4,upcoming:3,closed:2,pipeline:1,other:0};
const ascending=(a,b,key)=>(a[key]||"9999").localeCompare(b[key]||"9999");
const descending=(a,b,key)=>(b[key]||"").localeCompare(a[key]||"");
export function buildIpoBuckets(rows,today=istToday()){
 const buckets={open:[],upcoming:[],pipeline:[],closed:[],listed:[],other:[]};
 const unknownStatuses={};let invalid=0,duplicates=0,correctedStatuses=0,priceAlerts=0;
 const seenSlug=new Set(),byIssuer=new Map();
 for(const row of rows){
  if(!row||typeof row!=="object"){invalid++;continue;}
  const ipo=normalizeIpo(row,today);
  if(!/^[a-z0-9][a-z0-9-]{1,119}$/.test(ipo.id)){invalid++;continue;}
  if(seenSlug.has(ipo.id)){duplicates++;continue;}
  seenSlug.add(ipo.id);
  if(ipo.dateAdjusted)correctedStatuses++;
  if(ipo.priceSuspect)priceAlerts++;
  const key=ipoIssuerKey(ipo.name)||ipo.id;
  const prev=byIssuer.get(key);
  if(!prev){byIssuer.set(key,ipo);continue;}
  duplicates++;
  const priority=x=>(rank[x.status||"other"]||0)*100+
    (x.open?2:0)+(x.close?2:0)+(x.listingDate?3:0)+(x.issuePrice?2:0)+(x.listingGain!==null?3:0);
  if(priority(ipo)>priority(prev))byIssuer.set(key,ipo);
 }
 for(const ipo of byIssuer.values()){
  if(ipo.status&&buckets[ipo.status])buckets[ipo.status].push(ipo);
  else{const key=ipo.rawStatus||"(missing)";unknownStatuses[key]=(unknownStatuses[key]||0)+1;buckets.other.push(ipo);}
 }
 buckets.open.sort((a,b)=>ascending(a,b,"close"));
 buckets.upcoming.sort((a,b)=>ascending(a,b,"open"));
 buckets.pipeline.sort((a,b)=>a.name.localeCompare(b.name));
 buckets.closed.sort((a,b)=>descending(a,b,"close"));
 buckets.listed.sort((a,b)=>descending(a,b,"listingDate"));
 return {buckets,unknownStatuses,invalid,duplicates,correctedStatuses,priceAlerts,
  accepted:Object.values(buckets).reduce((n,x)=>n+x.length,0)};
}
