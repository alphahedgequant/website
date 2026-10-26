// SEC EDGAR public US issuer documents. No brokerage commentary or concall claims.
// Configure SEC_USER_AGENT as "AlphaHedgeQuant admin@yourdomain.com" for polite access.
export const runtime = "nodejs";
export const revalidate = 21600;
const SEC = "https://www.sec.gov";
const DATA = "https://data.sec.gov";
const forms = new Set(["10-K", "10-Q", "8-K", "20-F", "6-K", "40-F"]);
async function getJSON(url) {
  const agent = process.env.SEC_USER_AGENT;
  if (!agent || !agent.includes("@")) throw Error("SEC feed not configured");
  const response = await fetch(url, {
    headers: { "User-Agent": agent, Accept: "application/json" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw Error("SEC returned "+response.status);
  return response.json();
}
export async function GET(request) {
  const params=new URL(request.url).searchParams;
  const symbol=(params.get("symbol")||"").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,12}$/.test(symbol)) return Response.json({error:"Invalid ticker",documents:[]},{status:400});
  if (!process.env.SEC_USER_AGENT) return Response.json({documents:[],status:"not_configured"});
  try {
    const tickers=await getJSON(SEC+"/files/company_tickers.json");
    const issuer=Object.values(tickers).find(x=>x.ticker?.toUpperCase()===symbol);
    if (!issuer) return Response.json({documents:[],status:"not_found"});
    const cik=String(issuer.cik_str).padStart(10,"0");
    const j=await getJSON(DATA+"/submissions/CIK"+cik+".json");
    const recent=j.filings?.recent||{};
    const result=[];
    for(let i=0;i<(recent.form?.length||0)&&result.length<24;i++){
      const form=recent.form[i];
      if(!forms.has(form))continue;
      const acc=recent.accessionNumber?.[i], filename=recent.primaryDocument?.[i];
      if(!/^\d{10}-\d{2}-\d{6}$/.test(acc||"") || !/^[A-Za-z0-9_.-]+$/.test(filename||""))continue;
      const category=["10-K","20-F","40-F"].includes(form)?"annual_reports":"announcements";
      result.push({
        market:"US",symbol,verified:true,category,
        title:({ "10-K":"Annual Report (10-K)","10-Q":"Quarterly Filing (10-Q)","8-K":"Material Event Filing (8-K)","20-F":"Annual Report (20-F)","40-F":"Annual Report (40-F)","6-K":"Foreign Issuer Report (6-K)" })[form],
        publishedAt:recent.filingDate?.[i]||null,publisher:"SEC EDGAR",
        url:SEC+"/Archives/edgar/data/"+String(issuer.cik_str)+"/"+acc.replaceAll("-","")+"/"+filename
      });
    }
    return Response.json({documents:result,status:"ok",issuer:j.name||issuer.title},{
      headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=3600"}
    });
  }catch{
    return Response.json({documents:[],status:"unavailable"},{headers:{"Cache-Control":"no-store"}});
  }
}
