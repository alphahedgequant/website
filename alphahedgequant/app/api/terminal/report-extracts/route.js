import {neon} from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const output=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const validSymbol=s=>/^[A-Z0-9&_.-]{1,40}$/.test(s);
async function editor(){
 const {userId}=await auth();if(!userId)return null;
 const allow=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.toLowerCase().trim()).filter(Boolean);
 if(!allow.length)return null;
 const user=await currentUser();
 return (user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").some(x=>allow.includes(x.emailAddress.toLowerCase()))?userId:null;
}
async function ensure(sql){
 await sql`CREATE TABLE IF NOT EXISTS terminal_report_excerpts(
  id BIGSERIAL PRIMARY KEY, symbol TEXT NOT NULL, fiscal_period TEXT NOT NULL,
  source_url TEXT NOT NULL, source_page INTEGER NOT NULL,
  category TEXT NOT NULL, evidence TEXT NOT NULL, checksum TEXT NOT NULL UNIQUE,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  reviewed_by TEXT, reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 )`;
 await sql`CREATE INDEX IF NOT EXISTS terminal_report_excerpt_symbol_idx
  ON terminal_report_excerpts(symbol,review_status,category)`;
}
export async function GET(request){
 const {searchParams}=new URL(request.url),symbol=String(searchParams.get("symbol")||"").toUpperCase().trim();
 if(!validSymbol(symbol))return output({ok:false,error:"Invalid NSE ticker"},400);
 if(!process.env.NEON_DATABASE_URL)return output({ok:true,items:[],pending:[],storage:"not_configured"});
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await ensure(sql);
  const items=await sql`SELECT id,symbol,fiscal_period,source_url,source_page,category,evidence,created_at FROM terminal_report_excerpts WHERE symbol=${symbol} AND review_status='verified' ORDER BY fiscal_period DESC,source_page ASC LIMIT 75`;
  const editorId=searchParams.get("review")==="1"?await editor():null;
  const pending=editorId?await sql`SELECT id,symbol,fiscal_period,source_url,source_page,category,evidence,created_at FROM terminal_report_excerpts WHERE symbol=${symbol} AND review_status='pending_review' ORDER BY created_at DESC LIMIT 80`:[];
  return output({ok:true,items,pending,canReview:!!editorId});
 }catch{return output({ok:false,error:"Annual-report evidence store unavailable"},503)}
}
export async function POST(request){
 const reviewer=await editor();if(!reviewer)return output({ok:false,error:"Authorized research editor required"},403);
 if(!process.env.NEON_DATABASE_URL)return output({ok:false,error:"Database not configured"},503);
 let data;try{data=await request.json()}catch{return output({ok:false,error:"Invalid JSON"},400)}
 const id=Number(data?.id),status=String(data?.status||"");
 if(!Number.isSafeInteger(id)||id<1||!["verified","rejected"].includes(status))return output({ok:false,error:"Invalid review decision"},400);
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await ensure(sql);
  const rows=await sql`UPDATE terminal_report_excerpts SET review_status=${status},reviewed_by=${reviewer},reviewed_at=now() WHERE id=${id} AND review_status='pending_review' RETURNING id`;
  if(!rows.length)return output({ok:false,error:"Report excerpt not found or already reviewed"},404);
  return output({ok:true,id,status});
 }catch{return output({ok:false,error:"Unable to review extracted evidence"},503)}
}
