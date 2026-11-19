import {neon} from "@neondatabase/serverless";
import {ensureNseFundamentalsSchema} from "@/lib/nseFundamentalsDb.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const validSymbol=s=>/^[A-Z0-9&_.-]{1,40}$/.test(s);
const validBasis=s=>s==="consolidated"||s==="standalone";
const headers={"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"};
const reply=(body,status=200)=>Response.json(body,{status,headers});
export async function GET(request){
  if(!process.env.NEON_DATABASE_URL)return reply({ok:true,status:"not_configured",items:[]});
  const q=new URL(request.url).searchParams,view=String(q.get("view")||"summary");
  const sql=neon(process.env.NEON_DATABASE_URL);
  try{
    await ensureNseFundamentalsSchema(sql);
    const current=await sql`SELECT i.import_id,i.source_workbook,i.source_sha256,i.published_at::text AS published_at,
      i.expected_coverage AS coverage_count,i.expected_summary AS summary_count,
      i.expected_financials AS financial_count,i.expected_filings AS filing_count
      FROM ahq_nse_fundamental_current c JOIN ahq_nse_fundamental_imports i ON i.import_id=c.import_id
      WHERE c.slot=TRUE AND i.status='published' LIMIT 1`;
    if(!current.length)return reply({ok:true,status:"not_imported",items:[]});
    const meta=current[0];
    if(view==="meta")return reply({ok:true,status:"ready",meta});
    if(view==="summary"){
      const basis=String(q.get("basis")||"consolidated");
      const symbol=String(q.get("symbol")||"").trim().toUpperCase();
      if(!validBasis(basis))return reply({ok:false,error:"Invalid reporting basis"},400);
      if(symbol&&!validSymbol(symbol))return reply({ok:false,error:"Invalid symbol"},400);
      const rows=symbol
        ? await sql`SELECT data FROM ahq_nse_fundamental_summary WHERE import_id=${meta.import_id} AND basis=${basis} AND symbol=${symbol} LIMIT 1`
        : await sql`SELECT data FROM ahq_nse_fundamental_summary WHERE import_id=${meta.import_id} AND basis=${basis} ORDER BY symbol`;
      return reply({ok:true,status:"ready",basis,meta,items:rows.map(r=>r.data)});
    }
        if(view==="history"){
      const symbol=String(q.get("symbol")||"").trim().toUpperCase(),basis=String(q.get("basis")||"consolidated");
      if(!validSymbol(symbol)||!validBasis(basis))return reply({ok:false,error:"Invalid symbol or reporting basis"},400);
      const [coverage,records,filings]=await Promise.all([
        sql`SELECT data FROM ahq_nse_fundamental_coverage WHERE import_id=${meta.import_id} AND symbol=${symbol} LIMIT 1`,
        sql`SELECT statement,period_type,period_end::text AS period_end,first_public_at,n_versions,kind,data
          FROM ahq_nse_financial_records WHERE import_id=${meta.import_id} AND symbol=${symbol} AND basis=${basis}
          ORDER BY period_end DESC,statement LIMIT 500`,
        sql`SELECT url,period_end::text AS period_end,public_at,revision,parsed,data FROM ahq_nse_filing_index
          WHERE import_id=${meta.import_id} AND symbol=${symbol} AND basis=${basis}
          ORDER BY public_at DESC NULLS LAST LIMIT 500`
      ]);
      return reply({ok:true,status:"ready",symbol,basis,meta,coverage:coverage[0]?.data||null,records,filings});
    }
    if(view==="coverage"){
      const rows=await sql`SELECT data FROM ahq_nse_fundamental_coverage
        WHERE import_id=${meta.import_id} ORDER BY symbol`;
      return reply({ok:true,status:"ready",meta,items:rows.map(r=>r.data)});
    }
    return reply({ok:false,error:"Unknown view"},400);
  }catch(error){
    console.error("[NSE fundamentals read]",error?.message||error);
    return reply({ok:false,status:"unavailable",error:"NSE filing data is temporarily unavailable"},503);
  }
}
