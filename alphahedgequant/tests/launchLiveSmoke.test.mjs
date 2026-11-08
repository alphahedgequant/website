import test from "node:test";
import assert from "node:assert/strict";

const BASE="https://www.alphahedgequant.com";
async function check(path) {
 const r=await fetch(BASE+path,{
   method:"GET",redirect:"manual",cache:"no-store",
   headers:{"User-Agent":"AlphaHedgeQuant-Launch-Smoketest/1.0","Accept":"text/html,application/json"},
   signal:AbortSignal.timeout(15000)
 });
 console.log(path, "HTTP",r.status);
 return r;
}
test("public home and legal pages respond without login",async()=>{
 for(const p of ["/","/about","/privacy","/terms","/disclaimer"]){
  const r=await check(p);
  assert.equal(r.status,200,p+" should be accessible without login");
  assert.match(r.headers.get("content-type")||"",/text\/html/,p);
  const html=await r.text();
  assert.match(html,/alphahedgequant/i,p);
 }
});
test("unauthenticated admin analytics must not expose owner data",async()=>{
 const r=await check("/api/admin/analytics");
 assert.notEqual(r.status,200,"owner-only endpoint must not return data");
 assert.ok([301,302,303,307,308,401,403,404].includes(r.status),"expected access denial or sign-in redirect");
});
test("scheduled worker refuses unauthenticated public calls",async()=>{
 const r=await check("/api/cron/ingest-research");
 assert.equal(r.status,401,"cron endpoint must require bearer secret");
});
test("waitlist endpoint rejects GET without writing data",async()=>{
 const r=await check("/api/waitlist");
 assert.equal(r.status,405);
});
