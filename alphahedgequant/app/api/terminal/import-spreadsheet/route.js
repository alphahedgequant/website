import {auth,currentUser} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const validSymbol=/^[A-Z0-9&_.-]{1,40}$/;
const kinds=["annual","quarterly","balance","cashflow"];
const metricNames={annual:["sales","pbt","pat","interest","depreciation"],quarterly:["sales","pbt","pat","operatingProfit"],balance:["equityCapital","reserves","borrowings","totalAssets","cash"],cashflow:["cfo","cfi","cff","netCash"]};
export async function POST(req){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in required"},{status:401});
 const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
 const user=await currentUser();const verified=(user?.emailAddresses||[]).filter(a=>a.verification?.status==="verified").map(a=>a.emailAddress.toLowerCase());
 if(!allowed.length||!verified.some(x=>allowed.includes(x)))return Response.json({error:"Admin only"},{status:403});
 if(!process.env.NEON_DATABASE_URL)return Response.json({error:"Research database not configured"},{status:503});
 const text=await req.text();if(text.length>3_000_000)return Response.json({error:"Import too large"},{status:413});
 let data;try{data=JSON.parse(text)}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 if(!data||typeof data!=="object"||Array.isArray(data)||Object.keys(data).length>100)return Response.json({error:"Invalid data structure"},{status:400});
 const entries=[];
 for(const [symbol,company] of Object.entries(data)){
  if(!validSymbol.test(symbol)||typeof company?.name!=="string"||company.name.length>200)return Response.json({error:"Invalid company"},{status:400});
  for(const kind of kinds){
   const rows=company[kind];if(!Array.isArray(rows)||rows.length>60)return Response.json({error:"Invalid series"},{status:400});
   for(const row of rows){
    if(typeof row?.period!=="string"||!/^20\d\d-\d\d-\d\d$/.test(row.period)||!Number.isFinite(Date.parse(row.period)))return Response.json({error:"Invalid period"},{status:400});
    for(const [metric,value] of Object.entries(row)){
     if(metric==="period")continue;
     if(!metricNames[kind].includes(metric)||typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>1e14)return Response.json({error:"Invalid metric"},{status:400});
     entries.push([symbol,company.name,kind,row.period,metric,value]);
    }
   }
  }
 }
 if(entries.length>20000)return Response.json({error:"Too many records"},{status:413});
 const sql=neon(process.env.NEON_DATABASE_URL);
 try{
  await sql`CREATE TABLE IF NOT EXISTS terminal_spreadsheet_facts(symbol TEXT NOT NULL,company_name TEXT NOT NULL,section TEXT NOT NULL,period DATE NOT NULL,metric TEXT NOT NULL,value NUMERIC(24,4) NOT NULL,source_type TEXT NOT NULL DEFAULT 'user_uploaded_workbook',verification_status TEXT NOT NULL DEFAULT 'unverified',uploaded_by TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(symbol,section,period,metric))`;
  const payload=JSON.stringify(entries.map(([symbol,company_name,section,period,metric,value])=>({symbol,company_name,section,period,metric,value})));
  await sql`INSERT INTO terminal_spreadsheet_facts(symbol,company_name,section,period,metric,value,uploaded_by)
    SELECT x.symbol,x.company_name,x.section,x.period::date,x.metric,x.value,${userId}
    FROM jsonb_to_recordset(${payload}::jsonb) AS x(symbol text,company_name text,section text,period text,metric text,value numeric)
    ON CONFLICT(symbol,section,period,metric) DO UPDATE
    SET value=EXCLUDED.value,company_name=EXCLUDED.company_name,verification_status='unverified',uploaded_by=EXCLUDED.uploaded_by,updated_at=now()`;
  return Response.json({ok:true,companies:Object.keys(data).length,facts:entries.length,status:"unverified"});
 }catch{return Response.json({error:"Database import failed"},{status:503})}
}
