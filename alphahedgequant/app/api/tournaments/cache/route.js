/**
 * Stable Neon-backed snapshots, updated by the signed 30-minute GitHub workflow.
 * Unlike commits to public/*.json, a database refresh needs no redeployment.
 * Public GET returns only organiser data; writes require GitHub OIDC.
 */
import {neon} from "@neondatabase/serverless";
import {verifyTournamentGithubToken} from "@/lib/tournamentGithubOIDC.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const out=(x,status=200)=>Response.json(x,{status,headers:{"Cache-Control":"no-store"}});
async function table(){
 if(!process.env.NEON_DATABASE_URL)throw Error("Database not configured");
 const db=neon(process.env.NEON_DATABASE_URL);
 await db`CREATE TABLE IF NOT EXISTS ahq_tournament_cache (
   cache_key TEXT PRIMARY KEY,
   payload JSONB NOT NULL,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`;
 return db;
}
export async function GET(req){
 const kind=new URL(req.url).searchParams.get("kind");
 if(!["snapshot","news"].includes(kind))return out({error:"Unknown snapshot type"},400);
 try{
   const db=await table();
   const rows=await db`SELECT payload, updated_at FROM ahq_tournament_cache WHERE cache_key=${kind} LIMIT 1`;
   if(!rows.length)return out({error:"Snapshot not available yet"},404);
   return out(rows[0].payload);
 }catch{return out({error:"Live snapshot store unavailable"},503)}
}
export async function POST(req){
 if(!await verifyTournamentGithubToken(req.headers.get("authorization")))return out({error:"Signed workflow authorization required"},403);
 let body;
 try{
   const raw=await req.text();
   if(raw.length>1500000)return out({error:"Snapshot too large"},413);
   body=JSON.parse(raw);
 }catch{return out({error:"Invalid snapshot JSON"},400)}
 const snapshot=body?.snapshot,news=body?.news;
 if(snapshot?.version!==1||!Array.isArray(snapshot?.lichess?.official)||snapshot.lichess.official.length>150||
   !Array.isArray(snapshot?.devpost?.hackathons)||snapshot.devpost.hackathons.length>250||
   news?.version!==1||!Array.isArray(news.items)||news.items.length>200||
   news.items.some(item=>typeof item?.title!=="string"||typeof item?.observedAt!=="string"||typeof item?.id!=="string"))
   return out({error:"Invalid source snapshot schema"},400);
 try{
   const db=await table(),snap=JSON.stringify(snapshot),archive=JSON.stringify(news);
   await db`INSERT INTO ahq_tournament_cache(cache_key,payload,updated_at)
     VALUES('snapshot',${snap}::jsonb,NOW())
     ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,updated_at=NOW()`;
   await db`INSERT INTO ahq_tournament_cache(cache_key,payload,updated_at)
     VALUES('news',${archive}::jsonb,NOW())
     ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,updated_at=NOW()`;
   return out({ok:true,source:"GitHub Actions OIDC",broadcasts:snapshot.lichess.official.length,
     hackathons:snapshot.devpost.hackathons.length,newsItems:news.items.length});
 }catch{return out({error:"Snapshot database write unavailable"},503)}
}
