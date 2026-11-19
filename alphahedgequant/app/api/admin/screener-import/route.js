import {neon} from "@neondatabase/serverless";
import {auth} from "@clerk/nextjs/server";
import {isInsightsOwner} from "@/lib/insightsOwnerAccess.mjs";
import {ensureNseFundamentalsSchema} from "@/lib/nseFundamentalsDb.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const validSymbol=s=>typeof s==="string"&&/^[A-Z0-9&_.-]{1,40}$/.test(s);
const validDate=s=>typeof s==="string"&&/^20\d\d-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s));
const validBasis=s=>s==="consolidated"||s==="standalone";
const maxBatch=1000;
export async function POST(request){
  const {userId}=await auth();
  if(!userId||!await isInsightsOwner())return reply({ok:false,error:"Owner access required"},403);
  if(!process.env.NEON_DATABASE_URL)return reply({ok:false,error:"Research database is not configured"},503);
  const text=await request.text();
  if(text.length>3_500_000)return reply({ok:false,error:"Batch too large; send fewer rows"},413);
  let body;try{body=JSON.parse(text)}catch{return reply({ok:false,error:"Invalid JSON"},400)}
  const sql=neon(process.env.NEON_DATABASE_URL);
  try{
    await ensureNseFundamentalsSchema(sql);
    const action=String(body?.action||"");
    if(action==="begin"){
      const m=body.meta||{},counts=m.counts||{};
      const importId=String(m.importId||""),source=String(m.sourceWorkbook||""),sha=String(m.sourceSha256||"");
      if(!/^nse-20\d{6}-[a-f0-9]{12}$/.test(importId)||source!=="NSE_Filings_Fundamentals_20261119.xlsx"||
        !/^[a-f0-9]{64}$/.test(sha)||!Number.isInteger(counts.coverage)||!Number.isInteger(counts.summary)||
        !Number.isInteger(counts.financials)||!Number.isInteger(counts.filings)||
        counts.coverage<1||counts.coverage>10000||counts.summary<1||counts.summary>20000||
        counts.financials<1||counts.financials>500000||counts.filings<1||counts.filings>500000)
        return reply({ok:false,error:"Dataset metadata failed validation"},400);
      const rows=await sql`INSERT INTO ahq_nse_fundamental_imports
        (import_id,source_workbook,source_sha256,uploaded_by,status,expected_coverage,expected_summary,expected_financials,expected_filings)
        VALUES(${importId},${source},${sha},${userId},'staging',
          ${counts.coverage},${counts.summary},${counts.financials},${counts.filings})
        ON CONFLICT(import_id) DO UPDATE SET
          source_workbook=EXCLUDED.source_workbook,source_sha256=EXCLUDED.source_sha256,
          expected_coverage=EXCLUDED.expected_coverage,expected_summary=EXCLUDED.expected_summary,
          expected_financials=EXCLUDED.expected_financials,expected_filings=EXCLUDED.expected_filings
        WHERE ahq_nse_fundamental_imports.status='staging'
        RETURNING import_id,status`;
      if(!rows.length){
        const existing=await sql`SELECT status FROM ahq_nse_fundamental_imports WHERE import_id=${importId} LIMIT 1`;
        if(existing[0]?.status==="published")return reply({ok:true,alreadyPublished:true,importId});
        return reply({ok:false,error:"Import already exists in a non-editable state"},409);
      }
      return reply({ok:true,importId,status:"staging"});
    }
    const importId=String(body?.importId||"");
    if(!/^nse-20\d{6}-[a-f0-9]{12}$/.test(importId))return reply({ok:false,error:"Invalid import identifier"},400);
    const state=await sql`SELECT status FROM ahq_nse_fundamental_imports WHERE import_id=${importId} LIMIT 1`;
    if(!state.length||state[0].status!=="staging")return reply({ok:false,error:"Import is not in staging state"},409);
    if(action==="batch"){
      const table=String(body.table||""),rows=body.rows;
      if(!Array.isArray(rows)||rows.length<1||rows.length>maxBatch)return reply({ok:false,error:"Invalid batch size"},400);
      let inserted=[];
      if(table==="coverage"){
        if(rows.some(r=>!validSymbol(r?.symbol)||typeof r?.name!=="string"||r.name.length>240))return reply({ok:false,error:"Invalid coverage row"},400);
        const payload=JSON.stringify(rows.map(r=>({symbol:r.symbol,data:r})));
        inserted=await sql`INSERT INTO ahq_nse_fundamental_coverage(import_id,symbol,data)
          SELECT ${importId},x.symbol,x.data FROM jsonb_to_recordset(${payload}::jsonb) AS x(symbol text,data jsonb)
          ON CONFLICT(import_id,symbol) DO UPDATE SET data=EXCLUDED.data RETURNING symbol`;
      }else if(table==="summary"){
        if(rows.some(r=>!validSymbol(r?.symbol)||!validBasis(r?.basis)||!r?.data||typeof r.data!=="object"||Array.isArray(r.data)))return reply({ok:false,error:"Invalid summary row"},400);
        const payload=JSON.stringify(rows.map(r=>({symbol:r.symbol,basis:r.basis,data:r.data})));
        inserted=await sql`INSERT INTO ahq_nse_fundamental_summary(import_id,symbol,basis,data)
          SELECT ${importId},x.symbol,x.basis,x.data FROM jsonb_to_recordset(${payload}::jsonb) AS x(symbol text,basis text,data jsonb)
          ON CONFLICT(import_id,symbol,basis) DO UPDATE SET data=EXCLUDED.data RETURNING symbol`;
      }else if(table==="financials"){
        const statements=new Set(["quarterly_pnl","annual_pnl","balance_sheet","cash_flow_ytd"]);
        if(rows.some(r=>!validSymbol(r?.symbol)||!validBasis(r?.basis)||!statements.has(r?.statement)||
          !["quarterly","annual","ytd"].includes(r?.periodType)||!validDate(r?.periodEnd)||
          (r?.firstPublicAt!=null&&(typeof r.firstPublicAt!=="string"||r.firstPublicAt.length>50))||
          (r?.nVersions!=null&&(!Number.isInteger(r.nVersions)||r.nVersions<1||r.nVersions>100))||
          !r?.data||typeof r.data!=="object"||Array.isArray(r.data)))return reply({ok:false,error:"Invalid financial record"},400);
        const payload=JSON.stringify(rows.map(r=>({symbol:r.symbol,basis:r.basis,statement:r.statement,period_type:r.periodType,
          period_end:r.periodEnd,first_public_at:r.firstPublicAt??null,n_versions:r.nVersions??null,kind:r.kind??null,data:r.data})));
        inserted=await sql`INSERT INTO ahq_nse_financial_records(import_id,symbol,basis,statement,period_type,period_end,first_public_at,n_versions,kind,data)
          SELECT ${importId},x.symbol,x.basis,x.statement,x.period_type,x.period_end::date,x.first_public_at,x.n_versions,x.kind,x.data
          FROM jsonb_to_recordset(${payload}::jsonb) AS x(symbol text,basis text,statement text,period_type text,period_end text,first_public_at text,n_versions integer,kind text,data jsonb)
          ON CONFLICT(import_id,symbol,basis,statement,period_end) DO UPDATE SET
            period_type=EXCLUDED.period_type,first_public_at=EXCLUDED.first_public_at,n_versions=EXCLUDED.n_versions,kind=EXCLUDED.kind,data=EXCLUDED.data
          RETURNING symbol`;
      }else if(table==="filings"){
        if(rows.some(r=>!validSymbol(r?.symbol)||!validBasis(r?.basis)||
          (r?.periodEnd!=null&&!validDate(r.periodEnd))||
          typeof r?.url!=="string"||!r.url.startsWith("https://nsearchives.nseindia.in/")||r.url.length>1800||
          (r?.publicAt!=null&&(typeof r.publicAt!=="string"||r.publicAt.length>50))||
          !r?.data||typeof r.data!=="object"||Array.isArray(r.data)))return reply({ok:false,error:"Invalid NSE filing index row"},400);
        const payload=JSON.stringify(rows.map(r=>({symbol:r.symbol,basis:r.basis,period_end:r.periodEnd??null,
          public_at:r.publicAt??null,revision:typeof r.revision==="boolean"?r.revision:null,
          parsed:typeof r.parsed==="boolean"?r.parsed:null,url:r.url,data:r.data})));
        inserted=await sql`INSERT INTO ahq_nse_filing_index(import_id,symbol,basis,period_end,public_at,revision,parsed,url,data)
          SELECT ${importId},x.symbol,x.basis,NULLIF(x.period_end,'')::date,x.public_at,x.revision,x.parsed,x.url,x.data
          FROM jsonb_to_recordset(${payload}::jsonb) AS x(symbol text,basis text,period_end text,public_at text,revision boolean,parsed boolean,url text,data jsonb)
          ON CONFLICT(import_id,url) DO UPDATE SET data=EXCLUDED.data,public_at=EXCLUDED.public_at,
            revision=EXCLUDED.revision,parsed=EXCLUDED.parsed RETURNING symbol`;
      }else return reply({ok:false,error:"Unknown import table"},400);
      return reply({ok:true,table,received:rows.length,upserted:inserted.length});
    }
    if(action==="finalize"){
      const expected=await sql`SELECT expected_coverage,expected_summary,expected_financials,expected_filings
        FROM ahq_nse_fundamental_imports WHERE import_id=${importId} LIMIT 1`;
      if(!expected.length)return reply({ok:false,error:"Import not found"},404);
      const actual=await sql`SELECT
        (SELECT COUNT(*)::int FROM ahq_nse_fundamental_coverage WHERE import_id=${importId}) AS coverage,
        (SELECT COUNT(*)::int FROM ahq_nse_fundamental_summary WHERE import_id=${importId}) AS summary,
        (SELECT COUNT(*)::int FROM ahq_nse_financial_records WHERE import_id=${importId}) AS financials,
        (SELECT COUNT(*)::int FROM ahq_nse_filing_index WHERE import_id=${importId}) AS filings`;
      const e=expected[0],a=actual[0];
      if(a.coverage!==e.expected_coverage||a.summary!==e.expected_summary||a.financials!==e.expected_financials||a.filings!==e.expected_filings)
        return reply({ok:false,error:"Dataset count check failed; nothing was published",expected:{coverage:e.expected_coverage,summary:e.expected_summary,financials:e.expected_financials,filings:e.expected_filings},actual:a},409);
      const published=await sql`WITH ready AS (
          UPDATE ahq_nse_fundamental_imports SET status='published',published_at=now()
          WHERE import_id=${importId} AND status='staging' RETURNING import_id
        )
        INSERT INTO ahq_nse_fundamental_current(slot,import_id)
        SELECT TRUE,import_id FROM ready
        ON CONFLICT(slot) DO UPDATE SET import_id=EXCLUDED.import_id,updated_at=now()
        RETURNING import_id`;
      if(!published.length)return reply({ok:false,error:"Unable to publish this import"},409);
      return reply({ok:true,status:"published",importId,counts:a});
    }
    return reply({ok:false,error:"Unknown action"},400);
  }catch(error){
    console.error("[NSE fundamentals import]",error?.message||error);
    return reply({ok:false,error:"Database import failed; the staged data remains unpublished"},503);
  }
}
