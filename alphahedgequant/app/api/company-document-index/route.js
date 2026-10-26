import { neon } from "@neondatabase/serverless";
import { validateRecord, dedupeDocuments } from "@/lib/documentRegistry.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers={"Cache-Control":"no-store"};
function db() {
  if(!process.env.NEON_DATABASE_URL) throw Error("not-configured");
  return neon(process.env.NEON_DATABASE_URL);
}
async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS ahq_company_documents (
    id BIGSERIAL PRIMARY KEY,
    market TEXT NOT NULL,
    symbol TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at DATE,
    description TEXT NOT NULL DEFAULT '',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(market,symbol,url)
  )`;
}
export async function GET(req) {
  const u=new URL(req.url),symbol=(u.searchParams.get("symbol")||"").toUpperCase();
  const market=u.searchParams.get("market");
  if(!/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(symbol)||!["NSE","US"].includes(market))return Response.json({documents:[],status:"invalid_request"},{status:400,headers});
  try{
    const sql=db();
    await ensureTable(sql);
    const rows=await sql`SELECT market,symbol,category,title,publisher,url, published_at::text AS published_at,description FROM ahq_company_documents WHERE market=${market} AND symbol=${symbol} AND verified=true ORDER BY published_at DESC NULLS LAST LIMIT 100`;
    return Response.json({status:"ok",documents:rows.map(r=>({...r,verified:true,publishedAt:r.published_at}))},{headers});
  } catch {
    return Response.json({status:"unavailable",documents:[]},{status:503,headers});
  }
}
export async function POST(req) {
  const token=process.env.DOCUMENT_INGEST_SECRET;
  const auth=req.headers.get("authorization")||"";
  if(!token || auth!==`Bearer ${token}`)return Response.json({error:"Unauthorized"},{status:401,headers});
  let body;
  try {body=await req.json();}catch{return Response.json({error:"Invalid JSON"},{status:400,headers});}
  if(!Array.isArray(body.documents)||body.documents.length===0||body.documents.length>50)return Response.json({error:"Provide 1-50 records"},{status:400,headers});
  const valid=body.documents.map(x=>validateRecord(x));
  if(valid.some(x=>!x))return Response.json({error:"Record rejected; verify publisher, issuer and HTTPS source"},{status:422,headers});
  try{
    const sql=db();await ensureTable(sql);
    let count=0;
    for(const item of dedupeDocuments(valid)){
      await sql`INSERT INTO ahq_company_documents (market,symbol,category,title,publisher,url,published_at,description,verified)
        VALUES (${item.market},${item.symbol},${item.category},${item.title},${item.publisher},${item.url},${item.publishedAt},${item.description},true)
        ON CONFLICT(market,symbol,url) DO UPDATE SET category=EXCLUDED.category,title=EXCLUDED.title,publisher=EXCLUDED.publisher,published_at=EXCLUDED.published_at,description=EXCLUDED.description,verified=true,checked_at=NOW()`;
      count++;
    }
    return Response.json({status:"stored",count},{headers});
  }catch{return Response.json({error:"Document index temporarily unavailable"},{status:503,headers});}
}
