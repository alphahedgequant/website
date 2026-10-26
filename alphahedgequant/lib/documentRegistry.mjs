// Approved issuer documents registry. Store metadata only; never copy source content.
// A future ingestion worker can populate this table after verifying source and licensing.
export const DOC_CATEGORIES = ["announcements","annual_reports","credit_ratings","concalls"];
export const ALLOWED_HOSTS = [
  "nseindia.com","bseindia.com","nsearchives.nseindia.com",
  "sec.gov","www.sec.gov","data.sec.gov",
  "ril.com","tcs.com","avantel.in","hal-india.co.in",
];
export function validateRecord(input,{additionalHosts=[]}={}) {
  if (!input || typeof input!=="object") return null;
  const symbol=String(input.symbol||"").trim().toUpperCase();
  const market=input.market;
  const category=input.category;
  if (!/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(symbol) ||
      !["NSE","US"].includes(market) || !DOC_CATEGORIES.includes(category)) return null;
  const title=String(input.title||"").trim();
  const publisher=String(input.publisher||"").trim();
  if (!title || title.length>240 || !publisher || publisher.length>120) return null;
  let url;
  try {
    url=new URL(String(input.url||""));
    if(url.protocol!=="https:" || url.username || url.password || url.port) return null;
    const host=url.hostname.toLowerCase();
    const approved=[...ALLOWED_HOSTS,...additionalHosts].some(h=>host===h || host.endsWith("."+h));
    if(!approved || /^(localhost|127\.|169\.254\.)/.test(host)) return null;
  } catch {return null;}
  const publishedAt=String(input.publishedAt||"");
  if(publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) return null;
  return { symbol,market,category,title,publisher,url:url.href,publishedAt:publishedAt||null,
    description:String(input.description||"").slice(0,500),verified:true };
}
export function dedupeDocuments(items) {
  const seen=new Set();
  return items.filter(d=>{
    const key=[d.market,d.symbol,d.url].join("|");
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}
