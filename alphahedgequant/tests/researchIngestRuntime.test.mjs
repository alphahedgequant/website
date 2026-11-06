import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../app/api/cron/ingest-research/route.js",import.meta.url),"utf8");

test("cron authentication precedes ingestion and denies missing token",()=>{
  const auth=code.indexOf('request.headers.get("authorization")');
  const db=code.indexOf("await ensureResearchTable");
  assert.ok(auth>=0 && db>auth);
  assert.match(code,/status:401/);
});
test("daily job processes at most three categories with upstream pacing",()=>{
 assert.match(code,/const selected=entries\.slice\(offset\).*\.slice\(0,3\)/);
 assert.match(code,/3200/);
 assert.match(code,/AbortSignal\.timeout\(12000\)/);
 assert.match(code,/max_results:"50"/);
 assert.doesNotMatch(code,/for\(const paper of parse\(/);
});
test("records are imported in one parameterized jsonb batch per category",()=>{
 assert.match(code,/jsonb_to_recordset\(\$\{payload\}::jsonb\)/);
 assert.match(code,/ON CONFLICT \(arxiv_id\) DO UPDATE SET/);
 assert.match(code,/topics_checked:checked/);
});
