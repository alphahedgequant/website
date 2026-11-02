import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const valid=/^[A-Z0-9&_.-]{1,40}$/;
export async function GET(req){
 const symbol=String(new URL(req.url).searchParams.get("symbol")||"").trim().toUpperCase();
 if(!valid.test(symbol))return Response.json({ok:false,error:"Invalid ticker"},{status:400});
 if(!process.env.NEON_DATABASE_URL)return Response.json({ok:false,error:"Research database unavailable"},{status:503});
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);
  const company=await sql`SELECT c.id,c.legal_name,s.exchange,s.symbol,s.isin
    FROM ahq_company c JOIN ahq_security s ON s.company_id=c.id
    WHERE s.exchange='NSE' AND s.symbol=${symbol} AND s.valid_to IS NULL LIMIT 1`;
  if(!company.length)return Response.json({ok:false,error:"Company not indexed",symbol},{status:404});
  const id=company[0].id;
  const [facts,relations]=await Promise.all([
   sql`SELECT f.metric,f.statement,f.period_end::text AS period_end,f.period_type,
     f.reporting_scope,f.value::float8 AS value,f.unit,
     src.verification_status,src.source_kind,src.document_title,src.source_url
     FROM ahq_company_fact f JOIN ahq_source src ON src.id=f.source_id
     WHERE f.company_id=${id}
     ORDER BY f.period_end DESC,f.statement,f.metric LIMIT 2500`,
   sql`SELECT r.relationship_type,r.counterparty_name,c.legal_name AS counterparty,
     s.symbol AS counterparty_symbol,r.share_pct::float8 AS share_pct,r.share_basis,
     r.fiscal_period,r.evidence,r.source_page,src.document_title,src.source_url
     FROM ahq_company_relationship r
     LEFT JOIN ahq_company c ON c.id=r.to_company_id
     LEFT JOIN ahq_security s ON s.company_id=c.id AND s.exchange='NSE' AND s.valid_to IS NULL
     JOIN ahq_source src ON src.id=r.source_id
     WHERE r.from_company_id=${id} AND r.review_status='verified'
     ORDER BY r.relationship_type,r.fiscal_period DESC LIMIT 300`
  ]);
  return Response.json({ok:true,company:company[0],financialFacts:facts,verifiedRelationships:relations},
   {headers:{"Cache-Control":"public,max-age=60"}});
 }catch{
  return Response.json({ok:false,error:"Company graph unavailable or migration incomplete"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
