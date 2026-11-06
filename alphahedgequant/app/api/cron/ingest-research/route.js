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
    let processed=0,checked=0;
    const failures=[];
    // arXiv asks clients to space API queries. A previous single invocation
    // requested all six categories and individually UPSERTed hundreds of rows,
    // eventually exceeding Vercel's 60-second hard timeout.
    //
    // Rotate three categories per daily run so each category is revisited
    // every second day without sacrificing safe upstream request spacing.
    const entries=Object.entries(TOPICS);
    const day=Math.floor(Date.now()/86_400_000);
    const offset=(day*3)%entries.length;
    const selected=entries.slice(offset).concat(entries.slice(0,offset)).slice(0,3);
    for(const [index,[topic,query]] of selected.entries()){
      if(index>0)await new Promise(resolve=>setTimeout(resolve,3200));
      try{
        const params=new URLSearchParams({search_query:query,start:"0",max_results:"50",sortBy:"submittedDate",sortOrder:"descending"});
        const response=await fetch("https://export.arxiv.org/api/query?"+params,{
          cache:"no-store",headers:{"User-Agent":"AlphaHedgeQuantResearch/1.0 (research indexing)"},
          signal:AbortSignal.timeout(12000)
        });
        if(!response.ok)throw Error("Upstream HTTP "+response.status);
        const papers=parse(await response.text());
        if(papers.length){
          // One parameterized INSERT per category instead of 50-75 network
          // roundtrips per category to PostgreSQL, preserving source metadata.
          const payload=JSON.stringify(papers);
          await sql`INSERT INTO ahq_research_archive
            (arxiv_id,title,summary,authors,categories,published_at,updated_at,abstract_url,pdf_url)
            SELECT x.id,x.title,x.summary,x.authors,x.categories,
              NULLIF(x.published,'')::timestamptz,NULLIF(x.updated,'')::timestamptz,
              x.abs,x.pdf
            FROM jsonb_to_recordset(${payload}::jsonb)
              AS x(id text,title text,summary text,authors jsonb,categories jsonb,
                   published text,updated text,abs text,pdf text)
            WHERE true -- Disambiguate INSERT SELECT from ON CONFLICT in PostgreSQL.
            ON CONFLICT (arxiv_id) DO UPDATE SET
              title=EXCLUDED.title,summary=EXCLUDED.summary,
              authors=EXCLUDED.authors,categories=EXCLUDED.categories,
              updated_at=EXCLUDED.updated_at,last_seen=now()`;
          processed+=papers.length;
        }
        checked++;
      }catch(error){
        failures.push(topic+": "+String(error.message).slice(0,80));
      }
    }
    return Response.json({
      status:processed?"ok":"unavailable",
      processed,topics_checked:checked,topics_attempted:selected.length,
      topic_rotation:"three topics daily; all six every two days",
      failures
    },{status:processed?200:503});

  }catch(error){return Response.json({error:"Research ingestion unavailable"},{status:503});}
}
