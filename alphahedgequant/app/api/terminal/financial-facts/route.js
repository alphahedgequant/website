import {neon} from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const valid=s=>/^[A-Z0-9&_.-]{1,40}$/.test(s);
async function reviewer(){
 const {userId}=await auth();
 if(!userId)return null;
 const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.length)return null;
 const person=await currentUser();
 return (person?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").some(x=>allowed.includes(x.emailAddress.toLowerCase()))?userId:null;
}
async function setup(sql){
 await sql`CREATE TABLE IF NOT EXISTS terminal_financial_facts(
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL, statement TEXT NOT NULL CHECK(statement IN ('income','balance','cash')),
  metric TEXT NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('annual','quarterly')),
  reporting_scope TEXT NOT NULL CHECK(reporting_scope IN ('consolidated','standalone')),
  amount_inr_crore NUMERIC(24,4) NOT NULL,
  source_url TEXT NOT NULL,
  source_document TEXT NOT NULL,
  source_page TEXT NOT NULL,
  evidence TEXT NOT NULL,
  audited BOOLEAN NOT NULL DEFAULT FALSE,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  submitted_by TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol,statement,metric,period_end,reporting_scope,source_url)
 )`;
 await sql`CREATE INDEX IF NOT EXISTS terminal_financial_facts_query_idx
   ON terminal_financial_facts(symbol,review_status,period_end DESC)`;
}
const isAllowedMetric=(statement,metric)=>({
 income:["grossSalesAndServices","revenueFromOperations","otherIncome","totalIncome","totalExpenses","profitBeforeTax","taxExpense","profitForYear","ebit","ebitda","interestExpense"],
 balance:["nonCurrentAssets","currentAssets","totalAssets","cashAndEquivalents","shortTermBorrowings","longTermBorrowings","currentLiabilities","nonCurrentLiabilities","totalLiabilities","totalEquity","inventories","tradeReceivables","tradePayables"],
 cash:["operatingCashFlow","investingCashFlow","financingCashFlow","changeInCash","closingCash","capitalExpenditure"]
}[statement]||[]).includes(metric);
export async function GET(req){
 const q=new URL(req.url).searchParams,symbol=String(q.get("symbol")||"").toUpperCase().trim();
 if(!valid(symbol))return reply({ok:false,error:"Invalid NSE ticker"},400);
 if(!process.env.NEON_DATABASE_URL)return reply({ok:true,items:[],pending:[],storage:"not_configured"});
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await setup(sql);
  const items=await sql`SELECT id,symbol,statement,metric,period_end,period_type,reporting_scope,amount_inr_crore,source_url,source_document,source_page,evidence,audited FROM terminal_financial_facts WHERE symbol=${symbol} AND review_status='verified' ORDER BY period_end DESC,statement,metric LIMIT 350`;
  const editorId=q.get("review")==="1"?await reviewer():null;
  const pending=editorId?await sql`SELECT id,symbol,statement,metric,period_end,period_type,reporting_scope,amount_inr_crore,source_url,source_document,source_page,evidence,audited FROM terminal_financial_facts WHERE symbol=${symbol} AND review_status='pending_review' ORDER BY created_at DESC LIMIT 80`:[];
  return reply({ok:true,items,pending,canReview:!!editorId,storage:"connected"});
 }catch{return reply({ok:false,error:"Audited financial facts database unavailable"},503)}
}
export async function POST(req){
 const userId=await reviewer();if(!userId)return reply({ok:false,error:"Authorized research editor required"},403);
 if(!process.env.NEON_DATABASE_URL)return reply({ok:false,error:"Database unavailable"},503);
 let data;try{data=await req.json()}catch{return reply({ok:false,error:"Invalid JSON"},400)}
 const symbol=String(data.symbol||"").trim().toUpperCase();
 const statement=String(data.statement||""),metric=String(data.metric||"");
 const period=String(data.period_end||""),scope=String(data.reporting_scope||"");
 const type=String(data.period_type||""),amount=data.amount_inr_crore;
 const doc=String(data.source_document||"").trim(),page=String(data.source_page||"").trim();
 const evidence=String(data.evidence||"").trim();
 let link;try{link=new URL(String(data.source_url||""))}catch{}
 const amt=amount===null||amount===""?NaN:Number(amount);
 if(!valid(symbol)||!isAllowedMetric(statement,metric)||!/^\d{4}-\d{2}-\d{2}$/.test(period)||!Number.isFinite(Date.parse(period))||
 !["annual","quarterly"].includes(type)||!["consolidated","standalone"].includes(scope)||
 !Number.isFinite(amt)||Math.abs(amt)>1e13||doc.length<5||doc.length>250||
 !page||page.length>50||evidence.length<15||evidence.length>1500||
 !link||link.protocol!=="https:"||link.username||link.password||link.port||link.href.length>1500)
 return reply({ok:false,error:"Invalid statement metric, financial period, source or amount. All amounts must be INR crore."},400);
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await setup(sql);
  const rows=await sql`INSERT INTO terminal_financial_facts
  (symbol,statement,metric,period_end,period_type,reporting_scope,amount_inr_crore,source_url,source_document,source_page,evidence,audited,submitted_by)
  VALUES(${symbol},${statement},${metric},${period},${type},${scope},${amt},${link.toString()},${doc},${page},${evidence},${data.audited===true},${userId})
  ON CONFLICT DO NOTHING RETURNING id`;
  if(!rows.length)return reply({ok:false,error:"A fact with this exact source and period already exists"},409);
  return reply({ok:true,id:rows[0].id,status:"pending_review"},201);
 }catch{return reply({ok:false,error:"Failed to store source-backed financial fact"},503)}
}
export async function PATCH(req){
 const userId=await reviewer();if(!userId)return reply({ok:false,error:"Authorized research editor required"},403);
 if(!process.env.NEON_DATABASE_URL)return reply({ok:false,error:"Database unavailable"},503);
 let body;try{body=await req.json()}catch{return reply({ok:false,error:"Invalid JSON"},400)}
 const id=Number(body.id),status=String(body.status||"");
 if(!Number.isSafeInteger(id)||id<1||!["verified","rejected"].includes(status))return reply({ok:false,error:"Invalid review decision"},400);
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await setup(sql);
  const rows=await sql`UPDATE terminal_financial_facts SET review_status=${status},reviewed_by=${userId},reviewed_at=now() WHERE id=${id} AND review_status='pending_review' RETURNING id`;
  if(!rows.length)return reply({ok:false,error:"Fact not found or already reviewed"},404);
  return reply({ok:true,id,status});
 }catch{return reply({ok:false,error:"Unable to complete source review"},503)}
}
