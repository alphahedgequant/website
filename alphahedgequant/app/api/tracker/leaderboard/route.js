import {neon} from "@neondatabase/serverless";
import {fetchHistory,scoreAnalystCall} from "@/lib/trackerScoring";
import {aggregateCallOutcomes} from "@/lib/trackerMetrics.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function readCalls(sql){
 await sql`CREATE TABLE IF NOT EXISTS analyst_calls (
  id SERIAL PRIMARY KEY,house TEXT NOT NULL,symbol TEXT NOT NULL,
  rating TEXT NOT NULL DEFAULT 'BUY',target_price NUMERIC NOT NULL,
  price_at_call NUMERIC NOT NULL,call_date DATE NOT NULL,
  horizon_days INTEGER NOT NULL DEFAULT 365,note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW())`;
 await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS analyst_name TEXT`;
 await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS source_url TEXT`;
 await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'`;
 await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
 await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS deleted_by TEXT`;
 return sql`SELECT id,house,symbol,rating,target_price,price_at_call,call_date,
   horizon_days,analyst_name,source_url,verification_status
  FROM analyst_calls WHERE deleted_at IS NULL
  ORDER BY call_date DESC,id DESC`;
}
async function fetchHistories(calls){
 const symbols=[...new Set(calls.filter(c=>c.verification_status==="verified").map(c=>c.symbol))];
 const prices=new Map(),workers=Array.from({length:Math.min(6,symbols.length)},()=>null);
 let cursor=0;
 await Promise.all(workers.map(async()=>{while(cursor<symbols.length){
  const sym=symbols[cursor++];
  prices.set(sym,await fetchHistory(sym));
 }}));
 return prices;
}
export async function GET(){
 if(!process.env.NEON_DATABASE_URL)return Response.json({success:false,error:"Tracker database unavailable"},{status:503});
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);
  const rows=await readCalls(sql);
  const prices=await fetchHistories(rows);
  const aggregated=aggregateCallOutcomes(rows,c=>scoreAnalystCall(c,prices.get(c.symbol)||[]));
  return Response.json({success:true,...aggregated,
   sourceCoverage:{totalCalls:rows.length,reviewedCalls:rows.filter(c=>c.verification_status==="verified").length}},
   {headers:{"Cache-Control":"public,max-age=30,stale-while-revalidate=60"}});
 }catch(e){
  console.error("[Trust Tracker leaderboard]",e?.name||"Error");
  return Response.json({success:false,error:"Verified tracker rankings are temporarily unavailable"},{status:503});
 }
}
