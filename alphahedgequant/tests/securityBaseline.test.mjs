import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");

test("Next.js responses include baseline security headers and no framework signature",async()=>{
 const mod=await import("../next.config.mjs");
 const conf=mod.default;
 assert.equal(conf.poweredByHeader,false);
 const list=await conf.headers();
 const keys=new Map(list.flatMap(x=>x.headers).map(x=>[x.key,x.value]));
 assert.equal(keys.get("X-Content-Type-Options"),"nosniff");
 assert.equal(keys.get("X-Frame-Options"),"DENY");
 assert.ok(keys.get("Referrer-Policy"));
 assert.ok(keys.get("Strict-Transport-Security"));
});
test("private account progress is bound to authenticated user and never stored with a client-supplied user id",()=>{
 const s=read("app/api/learn/progress/route.js");
 assert.match(s,/const \{userId\}=auth\(\)/);
 assert.match(s,/WHERE user_id=\$\{userId\}/);
 assert.match(s,/VALUES \(\$\{userId\}/);
 assert.match(s,/Cache-Control.*private/);
});
test("admin analytics and spreadsheet ingestion require verified admin allowlist",()=>{
 for(const f of ["app/api/admin/analytics/route.js","app/api/terminal/import-spreadsheet/route.js"]){
  const s=read(f);
  assert.match(s,/currentUser\(\)/,f);
  assert.match(s,/verification\?\.status==="verified"/,f);
  assert.match(s,/ADMIN_EMAILS/,f);
 }
});
test("scheduled jobs and ingestion writes reject missing credentials",()=>{
 for(const f of ["app/api/cron/ingest-research/route.js","app/api/cron/scrape-calls/route.js","app/api/cron/discover-nse-documents/route.js"]){
  const s=read(f);
  assert.match(s,/CRON_SECRET/,f);
  assert.match(s,/authorization/,f);
 }
 const ingestion=read("app/api/terminal/ingest/route.js");
 assert.match(ingestion,/verifyGithubToken/);
 assert.match(ingestion,/claims\.repository/);
 assert.match(ingestion,/claims\.workflow_ref/);
});
test("user-controlled inputs have bounded sizes and exception output stays generic",()=>{
 const wait=read("app/api/waitlist/route.js");
 assert.match(wait,/MAX_BODY_BYTES/);
 assert.match(wait,/MAX_EMAIL_LENGTH/);
 assert.match(wait,/MAX_SOURCE_LENGTH/);
 const ai=read("app/api/copilot/route.js");
 assert.doesNotMatch(ai,/detail: detail\.slice/);
 assert.doesNotMatch(ai,/error: String\(e\.message/);
});
test("public git repository has a secrets-aware ignore policy",()=>{
 const s=readFileSync(new URL("../../.gitignore",import.meta.url),"utf8");
 for(const term of [".env","*.pem","*.key","node_modules","*.xlsx","*.sqlite"])assert.ok(s.includes(term),term);
});
test("market API proxy is restricted to a fixed endpoint whitelist",()=>{
 const s=read("app/api/market/[...path]/route.js");
 assert.match(s,/const ALLOWED/);
 assert.match(s,/ALLOWED\.some/);
 assert.match(s,/Market-data endpoint not allowed/);
});
