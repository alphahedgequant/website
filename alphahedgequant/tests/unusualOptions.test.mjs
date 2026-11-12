import test from "node:test";
import assert from "node:assert/strict";
import {toSnapshot,compareSnapshots,readFeedError} from "../lib/unusualOptions.mjs";
const chain=(iv=20,delta=0.4,extra={})=>({
  success:true,data:{spot_price:24000,expiry:"2026-11-26",received_at:"2026-11-12T06:30:00Z",
    strikes:[{strike_price:24000,
      call:{iv,delta,gamma:0.001,theta:-20,vega:10,ltp:150,oi:10000,...extra},
      put:{iv:22,delta:-0.4,gamma:0.001,theta:-20,vega:10,ltp:155,oi:11000}}] }
});
test("usable option snapshots preserve provider Greek units and side",()=>{
  const snap=toSnapshot(chain(), "NIFTY",1000);
  assert.equal(snap.options.get("24000:CE").iv,20);
  assert.equal(snap.options.get("24000:PE").delta,-0.4);
  assert.equal(snap.timestampKind,"BACKEND_SNAPSHOT");
});
test("first observation has no fake spike; unchanged feed produces no alert",()=>{
  const a=toSnapshot(chain(),"NIFTY",1000);
  const b=toSnapshot(chain(),"NIFTY",2000);
  assert.deepEqual(compareSnapshots(null,a),[]);
  assert.deepEqual(compareSnapshots(a,b),[]);
});
test("IV jump and delta swing are detected with explanation and strike identity",()=>{
  const a=toSnapshot(chain(),"NIFTY",1000);
  const b=toSnapshot(chain(26,0.6),"NIFTY",22000);
  const events=compareSnapshots(a,b);
  assert(events.some(x=>x.metric==="iv"&&x.direction==="UP"&&x.strike===24000));
  assert(events.some(x=>x.metric==="delta"&&x.direction==="UP"&&x.kind==="CE"));
  assert(events.every(x=>x.explanation.length>10));
});
test("sharp Greek fall is red, but never labelled sell/short",()=>{
  const a=toSnapshot(chain(20,0.4),"NIFTY",1000);
  const b=toSnapshot(chain(12,0.2),"NIFTY",23000);
  const events=compareSnapshots(a,b);
  assert(events.some(x=>x.metric==="iv"&&x.direction==="DOWN"));
  assert(events.every(x=>!JSON.stringify(x).includes("SHORT")));
});
test("reject cross-expiry, cross-symbol and over-window comparisons",()=>{
  const a=toSnapshot(chain(),"NIFTY",1000);
  const b=toSnapshot(chain(28),"NIFTY",2000);
  b.expiry="2026-12-31";
  assert.deepEqual(compareSnapshots(a,b),[]);
  b.expiry=a.expiry;b.symbol="BANKNIFTY";
  assert.deepEqual(compareSnapshots(a,b),[]);
  b.symbol=a.symbol;b.observedAt=170000;
  assert.deepEqual(compareSnapshots(a,b),[]);
});
test("reject same and regressing exchange timestamps",()=>{
  const c=chain();
  c.data.quote_timestamp="2026-11-12T06:30:00Z";
  const d=chain(30);
  d.data.quote_timestamp="2026-11-12T06:30:00Z";
  assert.deepEqual(compareSnapshots(toSnapshot(c,"NIFTY",1000),toSnapshot(d,"NIFTY",20000)),[]);
  d.data.quote_timestamp="2026-11-12T06:31:00Z";
  assert(compareSnapshots(toSnapshot(c,"NIFTY",1000),toSnapshot(d,"NIFTY",20000)).some(x=>x.metric==="iv"));
});
test("missing Greeks cannot be replaced with zero or fabricated metric events",()=>{
  const c=chain();delete c.data.strikes[0].call.iv;
  const d=chain(99);
  const ev=compareSnapshots(toSnapshot(c,"NIFTY",1000),toSnapshot(d,"NIFTY",20000));
  assert(!ev.some(x=>x.metric==="iv"));
});
test("bad payload is never treated as a valid quote",()=>{
  assert.equal(toSnapshot({success:false},"NIFTY"),null);
  assert.equal(toSnapshot({data:{spot_price:0,strikes:[{strike_price:1,call:{iv:20}}]}},"NIFTY"),null);
});
test("HTTP and authentication errors remain visible, not disguised as no signal",()=>{
  assert.match(readFeedError(503,{}),/unavailable/);
  assert.match(readFeedError(401,{error:"invalid token"}),/authentication/);
  assert.match(readFeedError(404,{}),/No supported option chain/);
});
