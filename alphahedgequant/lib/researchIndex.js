import {neon} from "@neondatabase/serverless";
export const DISCIPLINES={quant:"q-fin.ST",math:"math.PR",engineering:"q-fin.CP",finance:"q-fin.PM",economics:"econ.EM",ml:"stat.ML",ai:"cs.AI",llm:"cs.CL"};
const decode=s=>String(s||"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const one=(s,t)=>decode(s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+t+">"))?.[1]);
const blocks=(s,t)=>[...s.matchAll(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+t+">","g"))].map(x=>x[1]);
export function parseAtom(xml,discipline){
 return blocks(xml,"entry").map(e=>{
  const raw=one(e,"id"),id=raw.match(/arxiv.org\/abs\/([^/?]+)/)?.[1],published=one(e,"published").slice(0,10),title=one(e,"title").slice(0,450);
  if(!id||!/^[\w.-]{3,50}$/.test(id)||!/^\d{4}-\d{2}-\d{2}$/.test(published)||!title)return null;
  return {id,title,published,discipline,authors:blocks(e,"author").map(a=>one(a,"name")).filter(Boolean).slice(0,12),summary:one(e,"summary").slice(0,6000),abs:"https://arxiv.org/abs/"+id,pdf:"https://arxiv.org/pdf/"+id,source:"arXiv"};
 }).filter(Boolean);
}
export function database(){if(!process.env.NEON_DATABASE_URL)throw Error("Index database not configured");return neon(process.env.NEON_DATABASE_URL)}
export async function ensureIndex(sql){
 await sql`CREATE TABLE IF NOT EXISTS ahq_research_papers(id TEXT PRIMARY KEY,title TEXT NOT NULL,authors JSONB NOT NULL DEFAULT '[]',summary TEXT NOT NULL DEFAULT '',published DATE NOT NULL,disciplines TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],abs TEXT NOT NULL,pdf TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'arXiv',indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
 await sql`CREATE INDEX IF NOT EXISTS ahq_research_papers_published_idx ON ahq_research_papers(published DESC)`;
}