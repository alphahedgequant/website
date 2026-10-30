import {neon} from "@neondatabase/serverless";
import workbook from "@/lib/terminalWorkbookData.json";
export const runtime="nodejs";export const dynamic="force-dynamic";
const metrics={annual:["sales","pbt","pat","interest","depreciation"],quarterly:["sales","pbt","pat","operatingProfit"],balance:["equityCapital","reserves","borrowings","totalAssets","cash"],cashflow:["cfo","cfi","cff","netCash"]};
export async function GET(req){
 const symbol=String(new URL(req.url).searchParams.get("symbol")||"").trim().toUpperCase();
 if(!/^[A-Z0-9&_.-]{1,40}$/.test(symbol))return Response.json({ok:false,error:"Invalid symbol"},{status:400});
 const curated=workbook[symbol];
 const items=curated?Object.entries(metrics).flatMap(([section,keys])=>(curated[section]||[]).flatMap(row=>keys.filter(k=>typeof row[k]==="number"&&Number.isFinite(row[k])).map(metric=>({section,period:row.period,metric,value:row[metric],verification_status:"unverified",source_type:"uploaded_workbook"})))):[];
 // Prefer the uploaded original for these tickers: DB imports may contain older duplicates.
 if(items.length)return Response.json({ok:true,symbol,company:curated.name,items,source:"uploaded_workbook_snapshot",verified:false},{headers:{"Cache-Control":"public,max-age=300"}});
 if(!process.env.NEON_DATABASE_URL)return Response.json({ok:true,items:[],status:"database_not_configured"});
 try{const sql=neon(process.env.NEON_DATABASE_URL);
 const result=await sql`SELECT section,period::text AS period,metric,value::float8 AS value,verification_status FROM terminal_spreadsheet_facts WHERE symbol=${symbol} ORDER BY period DESC,section,metric LIMIT 1200`;
 return Response.json({ok:true,symbol,items:result,source:"database_import",verified:false},{headers:{"Cache-Control":"public,max-age=60"}});
 }catch{return Response.json({ok:true,symbol,items:[],status:"not_imported_or_unavailable"})}
}
