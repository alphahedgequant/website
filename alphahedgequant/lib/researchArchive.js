import { neon } from "@neondatabase/serverless";
export function researchDb() {
  if (!process.env.NEON_DATABASE_URL) throw Error("Database not configured");
  return neon(process.env.NEON_DATABASE_URL);
}
export async function ensureResearchTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS ahq_research_archive (
    arxiv_id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL,
    authors JSONB NOT NULL DEFAULT '[]', categories JSONB NOT NULL DEFAULT '[]',
    published_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    abstract_url TEXT NOT NULL, pdf_url TEXT NOT NULL,
    first_seen TIMESTAMPTZ DEFAULT now(), last_seen TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_research_published_idx ON ahq_research_archive (published_at DESC)`;
}
export const TOPICS = {
  quant: "cat:q-fin.*", math: "cat:math.*", economics: "(cat:econ.* OR cat:q-fin.EC)",
  ml: "(cat:cs.LG OR cat:stat.ML)", ai: "cat:cs.AI", llm: "cat:cs.CL"
};
