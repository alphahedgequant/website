import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ROOT=(process.env.MARKET_DATA_API_URL||"https://zerohedgequant-backend.onrender.com").replace(/\/$/,"");
const headers={"Cache-Control":"public, s-maxage=300, stale-while-revalidate=300"};
const numericFields=["marketCap","pe","fwdPe","pb","peg","ps","evEbitda","eps","roe","roa","debtEquity","grossMargin","operatingMargin","netMargin","dividend","targetPrice","beta","high52w","low52w","revenueGrowth","earningsGrowth","sma50","sma200"];
export async function GET(request){
 const symbol=String(new URL(request.url).searchParams.get("symbol")||"").trim().toUpperCase();
 if(!/^[A-Z0-9&_.-]{1,40}$/.test(symbol))return NextResponse.json({ok:false,error:"Invalid NSE ticker"},{status:400});
 try{
  const deep=await fetch(ROOT+"/api/fundamentals/"+encodeURIComponent(symbol)+"?market=NSE",{next:{revalidate:900},signal:AbortSignal.timeout(12000)});
  const json=await deep.json();
  if(deep.ok&&json.success&&json.data){
   const d=json.data;
   return NextResponse.json({ok:true,symbol,provider:"Yahoo Finance company summary via AHQ market-data backend",retrievedAt:new Date().toISOString(),completeness:"company_summary",
    data:{symbol,name:d.name||symbol,sector:d.sector||null,industry:d.industry||null,about:d.about||null,price:d.price??null,priceChangePct:d.changePct??null,fundamentals:d.fundamentals||{},annual:Array.isArray(d.annual)?d.annual:[],quarterly:Array.isArray(d.quarterly)?d.quarterly:[]}}, {headers});
  }
 }catch{}
 // Fail over to the already available screener's cached vendor fundamentals.
 // This is PARTIAL data; never invent full financial statements or relationship percentages.
 try{
  const response=await fetch(ROOT+"/api/screener",{next:{revalidate:900},signal:AbortSignal.timeout(18000)});
  const json=await response.json();
  const row=Array.isArray(json.data)?json.data.find(x=>String(x.symbol).toUpperCase()===symbol):null;
  if(response.ok&&row){
   const fundamentals=Object.fromEntries(numericFields.map(k=>[k,row[k]??null]));
   return NextResponse.json({ok:true,symbol,provider:"Cached AHQ screener fundamentals (Yahoo-sourced; partial coverage)",retrievedAt:new Date().toISOString(),completeness:"ratios_only",
    data:{symbol,name:row.name||symbol,sector:row.sector||null,industry:row.industry||null,about:null,price:row.price>0?row.price:null,priceChangePct:row.changePct??null,fundamentals,annual:[],quarterly:[]}}, {headers});
  }
 }catch{}
 return NextResponse.json({ok:false,error:"No company financials are available from the connected providers for this stock. Add sourced annual-report inputs manually for a valuation."},{status:503,headers:{"Cache-Control":"no-store"}});
}
