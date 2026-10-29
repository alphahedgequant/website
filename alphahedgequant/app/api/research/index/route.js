import {database,ensureIndex,DISCIPLINES} from "@/lib/researchIndex";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req){
 try{
  const url=new URL(req.url), q=(url.searchParams.get("q")||"").trim().slice(0,120),cat=url.searchParams.get("cat")||"all";
  if(cat!=="all"&&!Object.hasOwn(DISCIPLINES,cat))return Response.json({success:false,error:"Invalid category"},{status:400});
  const page=Math.max(1,Math.min(200,Number(url.searchParams.get("page"))||1)),limit=24,offset=(page-1)*limit;
  const sql=database();await ensureIndex(sql);
  const pattern="%"+q.replace(/[\\%_]/g,"").toLowerCase()+"%";
  const rows=await sql`SELECT id,title,authors,summary,published::text AS published,disciplines,abs,pdf,source,refreshed_at FROM ahq_research_papers WHERE (${q} = '' OR lower(title) LIKE ${pattern} OR lower(summary) LIKE ${pattern} OR lower(authors::text) LIKE ${pattern}) AND (${cat} = 'all' OR ${cat} = ANY(disciplines)) ORDER BY published DESC,id DESC LIMIT ${limit} OFFSET ${offset}`;
  return Response.json({success:true,category:cat,page,hasMore:rows.length===limit,data:rows.map(r=>({id:r.id,title:r.title,authors:r.authors,authorsMore:0,summary:r.summary.slice(0,450),published:r.published,primaryCat:r.disciplines[0]||"",abs:r.abs,pdf:r.pdf,source:r.source}))},{headers:{"Cache-Control":"public,s-maxage=300"}});
 }catch{return Response.json({success:false,error:"Search index is unavailable"},{status:503});}
}