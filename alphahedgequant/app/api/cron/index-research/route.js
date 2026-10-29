import {DISCIPLINES,parseAtom,database,ensureIndex} from "@/lib/researchIndex";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
export async function GET(req){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!=="Bearer "+secret)return Response.json({error:"Unauthorized"},{status:401});
 try{
  const sql=database();await ensureIndex(sql);
  let inserted=0,updated=0;const outcomes=[];
  for(const [discipline,category] of Object.entries(DISCIPLINES)){
   try{
    const query=new URLSearchParams({search_query:"cat:"+category,start:"0",max_results:"25",sortBy:"submittedDate",sortOrder:"descending"});
    const r=await fetch("https://export.arxiv.org/api/query?"+query,{cache:"no-store",signal:AbortSignal.timeout(8000),headers:{"User-Agent":"AlphaHedgeQuant-ResearchIndex/1.0"}});
    if(!r.ok)throw Error("Upstream "+r.status);
    const papers=parseAtom(await r.text(),discipline);let count=0;
    for(const p of papers){
      const rows=await sql`INSERT INTO ahq_research_papers(id,title,authors,summary,published,disciplines,abs,pdf,source) VALUES(${p.id},${p.title},${JSON.stringify(p.authors)}::jsonb,${p.summary},${p.published}::date,ARRAY[${discipline}]::text[],${p.abs},${p.pdf},${p.source}) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,authors=EXCLUDED.authors,disciplines=(SELECT ARRAY(SELECT DISTINCT UNNEST(ahq_research_papers.disciplines||EXCLUDED.disciplines))),refreshed_at=NOW() RETURNING (xmax=0) AS created`;
      if(rows[0]?.created)inserted++;else updated++;count++;
    }
    outcomes.push({discipline,indexed:count,status:"ok"});
   }catch(e){outcomes.push({discipline,status:"failed"});}
  }
  return Response.json({status:outcomes.some(x=>x.status==="ok")?"processed":"upstream_unavailable",inserted,updated,outcomes},{status:outcomes.some(x=>x.status==="ok")?200:503,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Research indexing unavailable"},{status:503});}
}