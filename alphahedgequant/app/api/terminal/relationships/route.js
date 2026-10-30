import {neon} from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const out=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const validateSymbol=s=>/^[A-Z0-9&_.-]{1,40}$/.test(s);
async function prepare(sql){
 await sql`CREATE TABLE IF NOT EXISTS terminal_company_relationships (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('customer','supplier')),
  entity_name TEXT NOT NULL,
  share_pct NUMERIC(6,3),
  share_basis TEXT NOT NULL CHECK (share_basis IN ('company_revenue','segment_revenue','procurement','not_reported')),
  fiscal_period TEXT NOT NULL,
  document_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_page TEXT,
  evidence TEXT NOT NULL,
  published_by TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now()
 )`;
 await sql`CREATE INDEX IF NOT EXISTS terminal_company_rel_symbol_idx ON terminal_company_relationships(symbol,relation_type,published_at DESC)`;
}
async function editor(){
 const {userId}=await auth();
 if(!userId)return null;
 const allow=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allow.length)return null;
 const u=await currentUser();
 const emails=(u?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").map(x=>x.emailAddress.toLowerCase());
 return emails.some(x=>allow.includes(x))?userId:null;
}
export async function GET(req){
 const symbol=String(new URL(req.url).searchParams.get("symbol")||"").trim().toUpperCase();
 if(!validateSymbol(symbol))return out({ok:false,error:"Invalid symbol"},400);
 if(!process.env.NEON_DATABASE_URL)return out({ok:true,symbol,items:[],storage:"not_configured"});
 try{
 const sql=neon(process.env.NEON_DATABASE_URL);await prepare(sql);
 const items=await sql`SELECT id,symbol,relation_type,entity_name,share_pct,share_basis,fiscal_period,document_title,source_url,source_page,evidence,published_at FROM terminal_company_relationships WHERE symbol=${symbol} ORDER BY published_at DESC LIMIT 250`;
 return out({ok:true,symbol,items,storage:"connected"});
 }catch{return out({ok:false,error:"Disclosures database unavailable"},503)}
}
export async function POST(req){
 const userId=await editor();
 if(!userId)return out({ok:false,error:"Authorized research editor required"},403);
 if(!process.env.NEON_DATABASE_URL)return out({ok:false,error:"Research database not configured"},503);
 let b;try{b=await req.json()}catch{return out({ok:false,error:"Invalid JSON"},400)}
 const symbol=String(b.symbol||"").trim().toUpperCase(),type=String(b.relation_type||""),
 entity=String(b.entity_name||"").trim(),period=String(b.fiscal_period||"").trim(),
 title=String(b.document_title||"").trim(),page=String(b.source_page||"").trim(),evidence=String(b.evidence||"").trim();
 const basis=String(b.share_basis||"not_reported"),rawPct=b.share_pct;
 const pct=rawPct==null||rawPct===""?null:Number(rawPct);
 let source;try{source=new URL(String(b.source_url||""))}catch{}
 if(!validateSymbol(symbol)||!["customer","supplier"].includes(type)||entity.length<2||entity.length>160||
 !["company_revenue","segment_revenue","procurement","not_reported"].includes(basis)||
 (pct!==null&&(!Number.isFinite(pct)||pct<0||pct>100))||
 (pct===null&&basis!=="not_reported")||(pct!==null&&basis==="not_reported")||
 period.length<4||period.length>32||title.length<5||title.length>200||page.length>50||
 evidence.length<15||evidence.length>1300||!source||source.protocol!=="https:"||
 source.username||source.password||source.port||source.href.length>1300)
 return out({ok:false,error:"Provide an original HTTPS source, cited period/page, evidence, and percentage basis. Unknown shares must be blank."},400);
 try{
 const sql=neon(process.env.NEON_DATABASE_URL);await prepare(sql);
 const result=await sql`INSERT INTO terminal_company_relationships (symbol,relation_type,entity_name,share_pct,share_basis,fiscal_period,document_title,source_url,source_page,evidence,published_by) VALUES (${symbol},${type},${entity},${pct},${basis},${period},${title},${source.toString()},${page||null},${evidence},${userId}) RETURNING id`;
 return out({ok:true,id:result[0].id},201);
 }catch{return out({ok:false,error:"Unable to save sourced disclosure"},503)}
}
