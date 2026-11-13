// AHQ Alpha Lab: controlled market-data proxy for daily OHLCV research.
// No synthetic prices, no fallbacks that would fabricate backtest performance.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = (process.env.MARKET_DATA_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zerohedgequant-backend.onrender.com").replace(/\/$/, "");

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const symbols = [...new Set(String(params.get("symbols") || "").toUpperCase().split(",").map(s=>s.trim()).filter(Boolean))];
  if(symbols.length < 4 || symbols.length > 8 || symbols.some(s => !/^[A-Z][A-Z0-9&._-]{0,25}$/.test(s))){
    return Response.json({success:false,error:"Select 4–8 valid NSE ticker symbols."},{status:400});
  }
  try{
    const series = {};
    const meta = {};
    const responses = await Promise.all(symbols.map(async symbol=>{
      const path = "/api/prices?symbol="+encodeURIComponent(symbol)+"&interval=1d";
      const response = await fetch(BASE+path,{
        headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(18000),
      });
      if(!response.ok)throw new Error("Market-data service rejected "+symbol+" ("+response.status+").");
      const body=await response.json();
      if(body?.success === false || !Array.isArray(body?.data)){
        throw new Error("Historical daily OHLCV unavailable for "+symbol+".");
      }
      const rows = body.data.slice(-850).filter(bar=>bar && typeof bar==="object");
      if(rows.length < 125)throw new Error("Fewer than 125 daily observations available for "+symbol+".");
      return {symbol,rows};
    }));
    responses.forEach(({symbol,rows})=>{
      series[symbol]=rows;
      meta[symbol]={count:rows.length,first:rows[0]?.date||null,last:rows.at(-1)?.date||null};
    });
    return Response.json({success:true,series,meta,source:"AHQ configured market-data backend",
      note:"Daily OHLCV only. Adjustment, corporate-action and point-in-time membership quality depend on the source. Validate before trading."},
      {headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return Response.json({success:false,error:e?.message||"Historical data unavailable. No backtest was run."},
      {status:502,headers:{"Cache-Control":"no-store"}});
  }
}
