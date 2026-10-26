// Conservative NSE RSS discovery: a discovery hit is not a verified PDF.
// No scraping Screener; only NSE's official published RSS sources.
export const FEEDS = [
  {id:"announcements",url:"https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml"},
  {id:"annual_reports",url:"https://nsearchives.nseindia.com/content/RSS/Annual_Reports.xml"},
  {id:"board_meetings",url:"https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml"}
];
// Exact issuer-label matching. Add more mappings from a verified NSE security master,
// never from fuzzy substring matching (e.g., "TCS" inside unrelated words).
export const ISSUERS = [
  {symbol:"HAL",names:["HINDUSTAN AERONAUTICS LIMITED","HINDUSTAN AERONAUTICS LTD"]},
  {symbol:"TCS",names:["TATA CONSULTANCY SERVICES LIMITED","TATA CONSULTANCY SERVICES LTD"]},
  {symbol:"RELIANCE",names:["RELIANCE INDUSTRIES LIMITED","RELIANCE INDUSTRIES LTD"]},
  {symbol:"AVANTEL",names:["AVANTEL LIMITED","AVANTEL LTD"]}
];
export function unescapeXml(text) {
  return String(text||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");
}
const field=(xml,name)=>unescapeXml(xml.match(new RegExp("<(?:[\\w-]+:)?" + name +"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?" + name + "\\s*>","i"))?.[1]||"").trim();
export function parseRss(xml,limit=120){
  if(typeof xml!=="string" || xml.length>2_000_000)throw Error("Oversized RSS feed");
  const blocks=xml.match(/<item\b[^>]*>[\s\S]*?<\/item\s*>/gi)||[];
  return blocks.slice(0,limit).map(b=>({
    title:field(b,"title").replace(/<[^>]*>/g,"").trim(),
    description:field(b,"description").replace(/<[^>]*>/g,"").trim(),
    link:field(b,"link").replace(/<[^>]*>/g,"").trim(),
    pubDate:field(b,"pubDate"),
    guid:field(b,"guid")
  }));
}
export function findIssuer(item,issuers=ISSUERS){
  // Match only an explicit issuer name in a distinct title segment, not fuzzy name text.
  const title=item.title.toUpperCase().replace(/\s+/g," ").trim();
  for(const issuer of issuers){
    for(const name of issuer.names){
      if(title===name || title.startsWith(name+" - ") || title.startsWith(name+" : ") ||
        title.startsWith(name+" – ") || title.startsWith(name+" | "))return issuer.symbol;
    }
  }
  return null;
}
export function classify(item,feedId){
  const t=(item.title+" "+item.description).toLowerCase();
  if(feedId==="annual_reports")return "annual_reports";
  if(/\b(transcript|earnings call|investor call|conference call|concall|audio recording|earnings webcast)\b/.test(t))return "concalls";
  return "announcements";
}
export function sourceLink(value){
  try{
    const url=new URL(value);
    if(url.protocol!=="https:" || url.username || url.password || url.port)return null;
    const host=url.hostname.toLowerCase();
    if(!["nsearchives.nseindia.com","archives.nseindia.com","www.nseindia.com","nseindia.com"].includes(host))return null;
    return url.href;
  }catch{return null;}
}
export function dateIso(value){
  const t=Date.parse(value);
  if(!Number.isFinite(t))return null;
  const iso=new Date(t).toISOString().slice(0,10);
  if(iso<"2000-01-01" || t>Date.now()+86_400_000)return null;
  return iso;
}
export function discover(xml,feedId,issuers=ISSUERS){
  return parseRss(xml).flatMap(item=>{
    const symbol=findIssuer(item,issuers);
    const url=sourceLink(item.link);
    const publishedAt=dateIso(item.pubDate);
    if(!symbol || !url || !publishedAt || !item.title)return [];
    return [{
      symbol,market:"NSE",category:classify(item,feedId),
      title:item.title.slice(0,240),publisher:"NSE official RSS",
      publishedAt,url,description:"Discovered through NSE official "+feedId.replace("_"," ")+" feed.",
      // RSS alone is metadata, NOT an authenticated PDF or transcript.
      verified:false
    }];
  });
}
