import {istCalendar,NSE_SYMBOL} from "@/lib/dailyOptionsFlow.mjs";
import {flowDB,ensureFlowTables,readFlowDay,readFlowTicker} from "@/lib/dailyOptionsFlowStore.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const out=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request){
 if(!process.env.NEON_DATABASE_URL)return out({success:false,status:"not_configured",error:"Historical options archive storage is not configured"},503);
 const search=new URL(request.url).searchParams;
 const symbol=String(search.get("symbol")||"").toUpperCase();
 const day=search.get("day");
 if(symbol&&!NSE_SYMBOL.test(symbol))return out({success:false,error:"Invalid NSE ticker"},400);
 if(day&&!/^20\d\d-\d\d-\d\d$/.test(day))return out({success:false,error:"Invalid trading date"},400);
 if(day){
  const date=new Date(day+"T00:00:00Z");
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)return out({success:false,error:"Invalid calendar date"},400);
 }
 try{
  const sql=flowDB();await ensureFlowTables(sql);
  if(symbol){
   const history=await readFlowTicker(sql,symbol,45);
   return out({success:true,symbol,history,
    timeBasis:"BACKEND_RECEIPT_NOT_EXCHANGE_TICK",
    caveat:"Historical F&O option-chain snapshots only; incomplete days and missed symbols are not filled with estimates."});
  }
  let tradingDay=day;
  if(!tradingDay){
   const recent=await sql`SELECT MAX(trading_day)::text AS day FROM ahq_options_flow_observations`;
   tradingDay=recent?.[0]?.day||istCalendar().day;
  }
  const result=await readFlowDay(sql,tradingDay);
  return out({success:true,...result,
   timeBasis:"BACKEND_RECEIPT_NOT_EXCHANGE_TICK",
   caveat:"Ranked observed volume/OI and change-in-OI; not exchange trade prints, buyer/seller initiation, or a guarantee of complete intraday coverage."});
 }catch{
  return out({success:false,status:"unavailable",error:"Daily options archive database temporarily unavailable"},503);
 }
}
