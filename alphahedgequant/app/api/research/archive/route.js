import {researchDb} from "@/lib/researchArchive";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req) {
  if(!process.env.NEON_DATABASE_URL)return Response.json({ok:false,error:"Archive unavailable"},{status:503});
  const params=new URL(req.url).searchParams;
  const q=(params.get("q")||"").trim().slice(0,120);
  const topic=(params.get("topic")||"all").toLowerCase();
  const offset=Math.max(0,Math.min(2000,Number.parseInt(params.get("offset")||"0",10)||0));
  const code={quant:"q-fin.",math:"math.",economics:"econ.",ml:"stat.ML",ai:"cs.AI",llm:"cs.CL",finance:"q-fin."}[topic]||"";
  const sql=researchDb();
  try{
    const term="%"+q.replace(/[%_\\]/g,x=>"\\ "+x).replace(/\\ /g,"\\")+"%";
    const rows=await sql`SELECT arxiv_id AS id,title,summary,authors,categories,
      published_at::date::text AS published,abstract_url AS abs,pdf_url AS pdf
      FROM ahq_research_archive
      WHERE (${q}='' OR title ILIKE ${term} OR summary ILIKE ${term})
      AND (${code}='' OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c LIKE ${code+"%"}))
      ORDER BY published_at DESC NULLS LAST LIMIT 30 OFFSET ${offset}`;
    return Response.json({ok:true,data:rows.map(r=>({...r,authorsMore:0,primaryCat:r.categories?.[0]||"",source:"arXiv",summary:r.summary.slice(0,400)})),nextOffset:rows.length===30?offset+30:null},{headers:{"Cache-Control":"public, s-maxage=120"}});
  }catch{return Response.json({ok:false,error:"Archive not initialized yet"},{status:503});}
}
