import { neon } from "@neondatabase/serverless";
import {FEEDS,discover} from "@/lib/nseRssDiscovery.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

// The worker only STAGES unverified documents. Nothing becomes public automatically.
export async function GET(request){
  const secret=process.env.CRON_SECRET;
  if(!secret || request.headers.get("authorization")!=="Bearer "+secret)return json({error:"Unauthorized"},401);
  if(!process.env.NEON_DATABASE_URL)return json({status:"not_configured"},503);
  const sql=neon(process.env.NEON_DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS ahq_document_candidates (
    id BIGSERIAL PRIMARY KEY,
    market TEXT NOT NULL,
    symbol TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at DATE,
    description TEXT,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    UNIQUE(market,symbol,url)
  )`;
  const feeds=[];
  let staged=0,skipped=0;
  for(const source of FEEDS){
    try{
      const res=await fetch(source.url,{headers:{"Accept":"application/rss+xml, application/xml, text/xml"},cache:"no-store",signal:AbortSignal.timeout(9000)});
      if(!res.ok)throw Error("Upstream HTTP "+res.status);
      const records=discover(await res.text(),source.id);
      let added=0;
      for(const d of records){
        const rows=await sql`INSERT INTO ahq_document_candidates
          (market,symbol,category,title,publisher,url,published_at,description,status)
          VALUES (${d.market},${d.symbol},${d.category},${d.title},${d.publisher},${d.url},${d.publishedAt},${d.description},'pending')
          ON CONFLICT(market,symbol,url) DO NOTHING RETURNING id`;
        added+=rows.length;
      }
      staged+=added;skipped+=records.length-added;
      feeds.push({feed:source.id,status:"ok",matched:records.length,staged:added});
    }catch(e){
      feeds.push({feed:source.id,status:"error",message:String(e?.message||"Fetch failed").slice(0,90)});
    }
  }
  return json({status:feeds.some(x=>x.status==="ok")?"processed":"upstream_unavailable",staged,duplicates:skipped,
    feeds,notice:"Records are unverified review candidates, not public research links."},feeds.some(x=>x.status==="ok")?200:503);
}
