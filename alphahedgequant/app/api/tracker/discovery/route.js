import {neon} from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";
import {RESEARCH_PUBLISHERS} from "@/lib/trackerPublishers";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const respond=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
async function requireEditor(){
 const {userId}=auth();
 if(!userId)return {error:respond({success:false,error:"Sign in required"},401)};
 const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.length)return {error:respond({success:false,error:"Tracker editor allowlist missing"},403)};
 const user=await currentUser();
 const emails=(user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").map(x=>x.emailAddress.toLowerCase());
 if(!emails.some(x=>allowed.includes(x)))return {error:respond({success:false,error:"Editor access required"},403)};
 return {userId};
}
async function table(sql){
 await sql`CREATE TABLE IF NOT EXISTS analyst_source_queue (
   id BIGSERIAL PRIMARY KEY, publisher_id TEXT NOT NULL, source_url TEXT NOT NULL,
   headline TEXT NOT NULL, published_on DATE, symbol TEXT, analyst_name TEXT, rating TEXT,
   target_price NUMERIC, entry_price NUMERIC, horizon_days INTEGER,
   notes TEXT NOT NULL DEFAULT '', review_status TEXT NOT NULL DEFAULT 'pending',
   submitted_by TEXT NOT NULL, reviewed_by TEXT,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ,
   UNIQUE(publisher_id,source_url)
 )`;
 await sql`ALTER TABLE analyst_source_queue ADD COLUMN IF NOT EXISTS analyst_name TEXT`;
 await sql`CREATE INDEX IF NOT EXISTS analyst_source_queue_review_idx ON analyst_source_queue(review_status, created_at DESC)`;
}
function sourceUrl(raw,portal){
 try{
 const u=new URL(raw),base=new URL(portal);
 if(u.protocol!=="https:"||u.username||u.password||u.port||raw.length>1200)return null;
 // Prevent unattributed third-party news from appearing under an original publisher.
 if(u.hostname!==base.hostname && !u.hostname.endsWith("."+base.hostname.replace(/^www\./,"")) )return null;
 u.hash="";return u.toString();
 }catch{return null}
}
export async function GET(){
 const user=await requireEditor();if(user.error)return user.error;
 if(!process.env.NEON_DATABASE_URL)return respond({success:false,error:"Database unavailable"},503);
 try{
 const sql=neon(process.env.NEON_DATABASE_URL);await table(sql);
 const rows=await sql`SELECT id,publisher_id,source_url,headline,published_on,symbol,analyst_name,rating,target_price,entry_price,horizon_days,notes,review_status,created_at FROM analyst_source_queue ORDER BY created_at DESC LIMIT 100`;
 return respond({success:true,items:rows});
 }catch{return respond({success:false,error:"Review queue temporarily unavailable"},503)}
}
export async function POST(request){
 const user=await requireEditor();if(user.error)return user.error;
 if(!process.env.NEON_DATABASE_URL)return respond({success:false,error:"Database unavailable"},503);
 let b;try{b=await request.json()}catch{return respond({success:false,error:"Invalid request body"},400)}
 const publisher=RESEARCH_PUBLISHERS.find(x=>x.id===b?.publisher_id);
 if(!publisher)return respond({success:false,error:"Unknown research publisher"},400);
 const url=sourceUrl(String(b.source_url||""),publisher.portal);
 const headline=String(b.headline||"").trim();
 const symbol=String(b.symbol||"").trim().toUpperCase();
 const analyst=String(b.analyst_name||"").trim();
 const rating=String(b.rating||"").toUpperCase();
 const date=String(b.published_on||"");
 const target=b.target_price===""||b.target_price==null?null:Number(b.target_price);
 const entry=b.entry_price===""||b.entry_price==null?null:Number(b.entry_price);
 const horizon=b.horizon_days===""||b.horizon_days==null?null:Number(b.horizon_days);
 const notes=String(b.notes||"").trim();
 if(!url||analyst.length>150||headline.length<5||headline.length>240||notes.length>1500||
    (symbol&&!/^[A-Z0-9.^_-]{1,25}$/.test(symbol))||
    (rating&&!["BUY","HOLD","SELL","ACCUMULATE","REDUCE","NEUTRAL"].includes(rating))||
    (date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date)>new Date()))||
    (target!==null&&(!Number.isFinite(target)||target<=0))||
    (entry!==null&&(!Number.isFinite(entry)||entry<=0))||
    (horizon!==null&&(!Number.isInteger(horizon)||horizon<1||horizon>3650)))
   return respond({success:false,error:"Invalid source, date, headline or recommendation fields"},400);
 try{
 const sql=neon(process.env.NEON_DATABASE_URL);await table(sql);
 const rows=await sql`INSERT INTO analyst_source_queue
 (publisher_id,source_url,headline,published_on,symbol,analyst_name,rating,target_price,entry_price,horizon_days,notes,submitted_by)
 VALUES (${publisher.id},${url},${headline},${date||null},${symbol||null},${analyst||null},${rating||null},${target},${entry},${horizon},${notes},${user.userId})
 ON CONFLICT (publisher_id,source_url) DO NOTHING RETURNING id`;
 if(!rows.length)return respond({success:false,error:"This original publication is already in the review queue"},409);
 return respond({success:true,id:rows[0].id,status:"pending"},201);
 }catch{return respond({success:false,error:"Unable to save candidate source"},503)}
}
export async function PATCH(request){
 const user=await requireEditor();if(user.error)return user.error;
 if(!process.env.NEON_DATABASE_URL)return respond({success:false,error:"Database unavailable"},503);
 let b;try{b=await request.json()}catch{return respond({success:false,error:"Invalid request"},400)}
 const id=Number(b.id);
 if(!Number.isSafeInteger(id)||id<1||!["reviewing","rejected","pending"].includes(b.status))return respond({success:false,error:"Invalid queue update"},400);
 try{
 const sql=neon(process.env.NEON_DATABASE_URL);await table(sql);
 const updated=await sql`UPDATE analyst_source_queue SET review_status=${b.status},reviewed_by=${user.userId},reviewed_at=now() WHERE id=${id} RETURNING id`;
 return updated.length?respond({success:true}):respond({success:false,error:"Item not found"},404);
 }catch{return respond({success:false,error:"Could not update review status"},503)}
}
