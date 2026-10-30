import {neon} from "@neondatabase/serverless";
import {createHash,createPublicKey,verify as verifySignature} from "node:crypto";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ISSUER="https://token.actions.githubusercontent.com";
const AUDIENCE="ahq-annual-report-review-ingest-v1";
const REPOSITORY="alphahedgequant/website";
const WORKFLOW=REPOSITORY+"/.github/workflows/annual-report-ingest.yml@refs/heads/main";
const out=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const decode=s=>JSON.parse(Buffer.from(s,"base64url").toString("utf8"));
async function verifyGithubToken(raw){
 if(typeof raw!=="string"||raw.length>12000||!raw.startsWith("Bearer "))return false;
 const token=raw.slice(7),parts=token.split(".");
 if(parts.length!==3||parts.some(x=>!x||x.length>8000))return false;
 let head,claims;try{head=decode(parts[0]);claims=decode(parts[1])}catch{return false}
 if(head.alg!=="RS256"||!head.kid||typeof head.kid!=="string")return false;
 const now=Math.floor(Date.now()/1000);
 if(claims.iss!==ISSUER||claims.aud!==AUDIENCE||claims.repository!==REPOSITORY||
    claims.ref!=="refs/heads/main"||claims.workflow_ref!==WORKFLOW||
    claims.sub!=="repo:"+REPOSITORY+":ref:refs/heads/main"||
    !["push","workflow_dispatch"].includes(claims.event_name)||
    !/^[0-9]{1,18}$/.test(String(claims.run_id||""))||
    typeof claims.exp!=="number"||claims.exp<=now||
    typeof claims.iat!=="number"||claims.iat>now+30||claims.iat<now-600||
    (claims.nbf!=null&&claims.nbf>now+30))return false;
 let jwks;try{const r=await fetch("https://token.actions.githubusercontent.com/.well-known/jwks",{next:{revalidate:1200},signal:AbortSignal.timeout(7500)});if(!r.ok)return false;jwks=await r.json()}catch{return false}
 const jwk=jwks.keys?.find(k=>k.kid===head.kid&&k.kty==="RSA"&&k.use==="sig"&&k.alg==="RS256");
 if(!jwk)return false;
 try{const key=createPublicKey({key:jwk,format:"jwk"});return verifySignature("RSA-SHA256",Buffer.from(parts[0]+"."+parts[1]),key,Buffer.from(parts[2],"base64url"))}catch{return false}
}
async function schema(sql){
 await sql`CREATE TABLE IF NOT EXISTS terminal_report_excerpts (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,fiscal_period TEXT NOT NULL,
  source_url TEXT NOT NULL,source_page INTEGER NOT NULL,
  category TEXT NOT NULL,evidence TEXT NOT NULL,
  checksum TEXT NOT NULL UNIQUE,review_status TEXT NOT NULL DEFAULT 'pending_review',
  reviewed_by TEXT,reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 )`;
 await sql`CREATE INDEX IF NOT EXISTS terminal_report_excerpt_symbol_idx ON terminal_report_excerpts(symbol,review_status,category)`;
}
export async function POST(request){
 if(!await verifyGithubToken(request.headers.get("authorization")))return out({ok:false,error:"GitHub Actions OIDC authorization required"},403);
 if(!process.env.NEON_DATABASE_URL)return out({ok:false,error:"Neon database not configured in Vercel"},503);
 let payload;try{const text=await request.text();if(text.length>900000)return out({ok:false,error:"Review payload too large"},413);payload=JSON.parse(text)}catch{return out({ok:false,error:"Invalid JSON"},400)}
 const symbol=String(payload?.symbol||"").toUpperCase(),period=String(payload?.fiscal_period||""),url=String(payload?.source_url||"");
 let parsed;try{parsed=new URL(url)}catch{}
 if(!/^[A-Z0-9&_.-]{1,40}$/.test(symbol)||!/^[A-Za-z0-9 /-]{4,32}$/.test(period)||
 !parsed||parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.port||url.length>1500||
 !Array.isArray(payload.candidates)||payload.candidates.length>150||
 payload.verification!=="PENDING_REVIEW")
 return out({ok:false,error:"Invalid source or report metadata"},400);
 const cats=new Set(["financial_statements","cash_flows","segments","geography","major_customers","suppliers"]);
 const rows=[];
 for(const c of payload.candidates){
  const evidence=String(c?.evidence||""),category=String(c?.category||""),page=Number(c?.page);
  if(!cats.has(category)||!Number.isInteger(page)||page<1||page>1200||
     evidence.length<45||evidence.length>1500||
     c.symbol!==symbol||c.fiscal_period!==period||c.source_url!==url)return out({ok:false,error:"Invalid evidence or page citation"},400);
  const checksum=createHash("sha256").update(symbol+"|"+url+"|"+page+"|"+category+"|"+evidence).digest("hex");
  if(checksum!==c.checksum)return out({ok:false,error:"Source evidence checksum mismatch"},400);
  rows.push({symbol,period,url,page,category,evidence,checksum});
 }
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);await schema(sql);
  let inserted=0;
  for(const r of rows){
   const result=await sql`INSERT INTO terminal_report_excerpts
    (symbol,fiscal_period,source_url,source_page,category,evidence,checksum)
    VALUES(${r.symbol},${r.period},${r.url},${r.page},${r.category},${r.evidence},${r.checksum})
    ON CONFLICT(checksum) DO NOTHING RETURNING id`;
   inserted+=result.length;
  }
  return out({ok:true,source:"GitHub Actions OIDC",symbol,received:rows.length,inserted,pending_review:true});
 }catch{return out({ok:false,error:"Database connection or insertion failed"},503)}
}
export async function GET(){return out({ok:true,service:"Annual-report review ingest",authentication:"GitHub Actions OIDC required for writes"})}
