import {researchDb,ensureResearchTable,TOPICS} from "@/lib/researchArchive";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const decode=s=>(s||"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g," ").trim();
const grab=(xml,tag)=>{const m=xml.match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+tag+">"));return m?decode(m[1]):"";};
function parse(xml) {
  const records=[];
  for(const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){
    const e=match[1], link=grab(e,"id"), id=(link.match(/arxiv.org\/abs\/([^\s?]+)/)||[])[1];
    if(!id || !/^\d{4}\.\d{4,5}(v\d+)?$/.test(id))continue;
    const authors=[...e.matchAll(/<author>([\s\S]*?)<\/author>/g)].map(x=>grab(x[1],"name")).filter(Boolean);
    const categories=[...e.matchAll(/<category\s+[^>]*term="([^"]+)"/g)].map(x=>x[1]);
    const title=grab(e,"title"),summary=grab(e,"summary");
    if(!title||!summary)continue;
    records.push({id:id.replace(/v\d+$/,""),title,summary:summary.slice(0,12000),authors:authors.slice(0,30),categories,
      published:grab(e,"published")||null,updated:grab(e,"updated")||null,
      abs:"https://arxiv.org/abs/"+id.replace(/v\d+$/,""),pdf:"https://arxiv.org/pdf/"+id.replace(/v\d+$/,"")});
  }
  return records;
}
export async function GET(request) {
  if(!process.env.CRON_SECRET || request.headers.get("authorization")!=="Bearer "+process.env.CRON_SECRET)
    return Response.json({error:"Unauthorized"},{status:401});
  if(!process.env.NEON_DATABASE_URL)return Response.json({error:"Database not configured"},{status:503});
  const sql=researchDb();
  try {
    await ensureResearchTable(sql);
    let processed=0;const failures=[];
    // Sequential requests respect arXiv API usage; each broad query returns up to 75 recent records.
    let requestIndex=0;
    for(const [topic,query] of Object.entries(TOPICS)){
      if(requestIndex++>0) await new Promise(resolve=>setTimeout(resolve,3200));
      try {
        const params=new URLSearchParams({search_query:query,start:"0",max_results:"75",sortBy:"submittedDate",sortOrder:"descending"});
        const response=await fetch("https://export.arxiv.org/api/query?"+params,{cache:"no-store",headers:{"User-Agent":"AlphaHedgeQuantResearch/1.0 (research indexing)"},signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw Error("Upstream HTTP "+response.status);
        for(const paper of parse(await response.text())){
          await sql`INSERT INTO ahq_research_archive (arxiv_id,title,summary,authors,categories,published_at,updated_at,abstract_url,pdf_url)
            VALUES (${paper.id},${paper.title},${paper.summary},${JSON.stringify(paper.authors)}::jsonb,${JSON.stringify(paper.categories)}::jsonb,
            ${paper.published},${paper.updated},${paper.abs},${paper.pdf})
            ON CONFLICT (arxiv_id) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,
            authors=EXCLUDED.authors,categories=EXCLUDED.categories,updated_at=EXCLUDED.updated_at,
            last_seen=now()`;
          processed++;
        }
      }catch(error){failures.push(topic+": "+String(error.message).slice(0,80));}
    }
    return Response.json({status:processed?"ok":"unavailable",processed,failures},{status:processed?200:503});
  }catch(error){return Response.json({error:"Research ingestion unavailable"},{status:503});}
}
