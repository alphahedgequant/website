// Owner-specific PAPER journal; NEVER places broker orders.
// Every fill requires an independently timestamped, fresh market-data quote.
import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {CASH_MODELS} from "@/lib/cashSignals";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(x,s=200)=>Response.json(x,{status:s,headers:{"Cache-Control":"private, no-store"}});
const ROOT=(process.env.MARKET_DATA_API_URL||process.env.NEXT_PUBLIC_API_URL||"https://zerohedgequant-backend.onrender.com").replace(/\/$/,"");
async function db(){
 if(!process.env.NEON_DATABASE_URL)throw Error("NEON_DATABASE_URL not configured");
 const sql=neon(process.env.NEON_DATABASE_URL);
 await sql`CREATE TABLE IF NOT EXISTS ahq_cash_paper_fills(
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL,symbol TEXT NOT NULL,model_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),quantity INTEGER NOT NULL CHECK(quantity>0),
  price NUMERIC(22,4) NOT NULL CHECK(price>0),quote_asof TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL_PAPER',created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
 await sql`CREATE INDEX IF NOT EXISTS ahq_cash_paper_user_idx ON ahq_cash_paper_fills(user_id,created_at DESC)`;
 return sql;
}
function session(){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 const mins=Number(p.hour)*60+Number(p.minute);
 return !["Sat","Sun"].includes(p.weekday)&&mins>=555&&mins<930;
}
async function currentQuote(symbol){
 try{
  const r=await fetch(new URL("/api/terminal/quote/"+encodeURIComponent(symbol),ROOT),{cache:"no-store",signal:AbortSignal.timeout(12000)});
  const j=await r.json();if(!r.ok||j?.success===false)return null;
  const q=j?.data?.quote??j?.data??j?.quote??j;
  const price=Number(q.price??q.ltp??q.last_price??q.lastPrice??q.lastTradedPrice);
  let raw=q.timestamp??q.lastTradeTime??q.last_trade_time??q.lastUpdated??q.updatedAt??j.timestamp??null;
  if(typeof raw==="number"&&raw<1e11)raw*=1000;
  const at=raw?new Date(raw):null,age=at?(Date.now()-Number(at))/1000:Infinity;
  if(!Number.isFinite(price)||price<=0||!at||!Number.isFinite(+at)||age<0||age>120)return null;
  return {price,asOf:at.toISOString()};
 }catch{return null}
}
function ledger(rows){
 const groups=new Map(),closed=[];
 for(const r of rows){
  let acc=groups.get(r.symbol);
  if(!acc){acc={symbol:r.symbol,qty:0,lots:[],realized:0};groups.set(r.symbol,acc)}
  const price=Number(r.price),q=Number(r.quantity);
  if(r.side==="BUY"){acc.lots.push({qty:q,price});acc.qty+=q;}
  else{
   let remaining=q,realized=0;
   while(remaining>0&&acc.lots.length){
    const lot=acc.lots[0],taken=Math.min(lot.qty,remaining);
    realized+=(price-lot.price)*taken;lot.qty-=taken;remaining-=taken;if(lot.qty===0)acc.lots.shift();
   }
   acc.qty-=q;acc.realized+=realized;
   closed.push({id:r.id,symbol:r.symbol,realized:Number(realized.toFixed(2))});
  }
 }
 return [...groups.values()].map(g=>({symbol:g.symbol,quantity:g.qty,costBasis:g.lots.reduce((s,x)=>s+x.qty*x.price,0),avgCost:g.qty?g.lots.reduce((s,x)=>s+x.qty*x.price,0)/g.qty:null,realized:g.realized})).filter(x=>x.quantity>0||x.realized!==0);
}
export async function GET(){
 const {userId}=auth();if(!userId)return reply({ok:false,code:"AUTH_REQUIRED",error:"Sign in to view your private paper journal"},401);
 try{
  const sql=await db();
  const rows=await sql`SELECT id,symbol,model_id,side,quantity,price,quote_asof,source,created_at FROM ahq_cash_paper_fills WHERE user_id=${userId} ORDER BY created_at ASC,id ASC LIMIT 2000`;
  const positions=ledger(rows);
  const latest=[...rows].reverse().slice(0,200);
  return reply({ok:true,mode:"PAPER ONLY",trades:latest,positions,executedBrokerOrders:0,autoExecution:false,storage:"NEON"});
 }catch{return reply({ok:false,error:"Paper trade journal unavailable or not configured"},503)}
}
export async function POST(req){
 const {userId}=auth();if(!userId)return reply({ok:false,error:"Sign in is required"},401);
 let body;try{body=await req.json()}catch{return reply({ok:false,error:"Invalid JSON"},400)}
 const symbol=String(body?.symbol||"").toUpperCase(),model=String(body?.modelId||""),side=String(body?.side||""),quantity=Number(body?.quantity),id=String(body?.idempotencyKey||"");
 if(!/^[A-Z0-9&_.-]{1,30}$/.test(symbol)||!CASH_MODELS.some(x=>x.id===model)||!["BUY","SELL"].includes(side)||
 !Number.isSafeInteger(quantity)||quantity<1||quantity>100000||!/^[a-zA-Z0-9-]{12,90}$/.test(id))
 return reply({ok:false,error:"Invalid cash symbol, model, quantity or idempotency key"},400);
 if(!session())return reply({ok:false,error:"Paper fills are enabled only during the nominal 09:15–15:30 IST weekday cash session. Exchange holiday calendar is not yet integrated."},409);
 const quote=await currentQuote(symbol);
 if(!quote)return reply({ok:false,error:"No fresh source-timestamped cash quote (≤120 seconds). Cannot record an observed-price paper fill."},503);
 try{
  const sql=await db();
  const rows=await sql`WITH holdings AS (
    SELECT COALESCE(SUM(CASE WHEN side='BUY' THEN quantity ELSE -quantity END),0) AS held
    FROM ahq_cash_paper_fills WHERE user_id=${userId} AND symbol=${symbol}
  )
  INSERT INTO ahq_cash_paper_fills(id,user_id,symbol,model_id,side,quantity,price,quote_asof,source)
  SELECT ${id},${userId},${symbol},${model},${side},${quantity},${quote.price},${quote.asOf},'MANUAL_PAPER'
  FROM holdings WHERE ${side}='BUY' OR held>=${quantity}
  ON CONFLICT(id) DO NOTHING RETURNING id,side,symbol,quantity,price,quote_asof,created_at,source`;
  if(!rows.length)return reply({ok:false,error:"Insufficient paper holdings or duplicate request"},409);
  return reply({ok:true,mode:"PAPER ONLY",trade:rows[0],brokerOrder:false},201);
 }catch{return reply({ok:false,error:"Unable to persist the paper fill"},503)}
}
