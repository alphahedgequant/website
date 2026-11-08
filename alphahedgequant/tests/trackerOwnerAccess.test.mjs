import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("verified owner can edit when separate tracker editor list is unset",()=>{
  const add=read("app/api/tracker/calls/route.js");
  const mod=read("app/api/tracker/calls/[id]/route.js");
  for(const route of [add,mod]){
    assert.match(route,/import \{isInsightsOwner\} from/);
    assert.match(route,/if\(allowed\.length\)\{/);
    assert.match(route,/else if\(!await isInsightsOwner\(\)\)/);
    assert.match(route,/status:403/);
    assert.doesNotMatch(route,/if\(!allowed\.length\)return Response\.json\(\{success:false,error:"Tracker admin not configured"/);
  }
});
test("owner fallback fails closed and requires a verified account; dedicated editor list remains available",()=>{
  const access=read("lib/insightsOwnerAccess.mjs");
  assert.match(access,/if\(!allowedId&&!allowedEmail\)return false/);
  assert.match(access,/if\(!userId\)return false/);
  assert.match(access,/verification\?\.status==="verified"/);
  const add=read("app/api/tracker/calls/route.js");
  assert.match(add,/AHQ_TRACKER_ADMIN_EMAILS/);
  assert.match(add,/AHQ_ANALYTICS_ADMIN_EMAILS/);
  const patch=read("app/api/tracker/calls/[id]/route.js");
  assert.match(patch,/async function editorError/);
  assert.match(patch,/const denied=await editorError\(\)/);
  assert.match(patch,/verification_status/);
});
