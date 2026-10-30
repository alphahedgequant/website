import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req){
 const symbol=String(new URL(req.url).searchParams.get("symbol")||"").trim().toUpperCase();
 if(!/^[A-Z0-9&_.-]{1,40}$/.test(symbol))return Response.json({ok:false,error:"Invalid symbol"},{status:400});
 if(!process.env.NEON_DATABASE_URL)return Response.json({ok:true,items:[],status:"database_not_configured"});
 try{const sql=neon(process.env.NEON_DATABASE_URL);
 const items=await sql`SELECT section,period::text AS period,metric,value::float8 AS value,verification_status FROM terminal_spreadsheet_facts WHERE symbol=${symbol} ORDER BY period DESC,section,metric LIMIT 1200`;
 return Response.json({ok:true,symbol,items},{headers:{"Cache-Control":"public,max-age=60"}});
 }catch{return Response.json({ok:true,symbol,items:[],status:"not_imported_or_unavailable"})}
}
