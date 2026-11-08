import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const {mapResponse,WATCHLIST}=require("../lib/fetchConsensus.js");
const quote=p=>({currentPrice:{NSE:p}});
const target=(mean,reco,extras={})=>({priceTarget:{Mean:mean,...extras},recommendation:{Mean:reco}});

test("published recommendation is required; price/target direction cannot fabricate BUY/SELL",()=>{
  assert.equal(mapResponse("TEST",quote(100),{priceTarget:{Mean:120},recommendation:{}}).reason,"missing-valid-recommendation");
  assert.equal(mapResponse("TEST",quote(100),target(120,"not-a-number")).reason,"missing-valid-recommendation");
  assert.equal(mapResponse("TEST",quote(100),target(120,0)).reason,"missing-valid-recommendation");
  assert.equal(mapResponse("TEST",quote(100),target(120,6)).reason,"missing-valid-recommendation");
});
test("use provider mean before unverified/preliminary when both exist",()=>{
  const result=mapResponse("TEST",quote(100),target(112,1,{UnverifiedMean:200,PreliminaryMean:250}));
  assert.equal(result.ok,true);
  assert.equal(result.row.target_price,112);
  assert.equal(result.row.rating,"Buy");
  assert.equal(result.row.house,"Street Consensus");
});
test("inconsistent ratings and targets are rejected, missing prices never pass",()=>{
  assert.equal(mapResponse("T",quote(150),target(110,1)).reason,"buy-target-below-price");
  assert.equal(mapResponse("T",quote(100),target(140,5)).reason,"sell-target-above-price");
  assert.equal(mapResponse("T",quote(0),target(110,1)).reason,"missing-target-or-price");
  assert.equal(mapResponse("T",quote(100),target(null,1)).reason,"missing-target-or-price");
});
test("valid recommendations preserve narrower labels; unverified consensus is not impersonating a broker",()=>{
  assert.equal(mapResponse("T",quote(100),target(120,2)).row.rating,"Accumulate");
  assert.equal(mapResponse("T",quote(100),target(80,4)).row.rating,"Reduce");
  assert.equal(mapResponse("T",quote(100),target(100,3)).row.rating,"Hold");
  assert.ok(WATCHLIST.length>=50);
});
test("upstream calls are bounded and no secret appears in client-facing source",()=>{
  const src=readFileSync(new URL("../lib/fetchConsensus.js",import.meta.url),"utf8");
  assert.match(src,/AbortSignal\.timeout\(5000\)/);
  assert.match(src,/X-API-Key/);
  assert.doesNotMatch(src,/process\.env\.(NEXT_PUBLIC_INDIANAPI|PUBLIC_API_KEY)/);
});
