import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("screener queries only the allowed same-origin NSE and US market-data gateway",()=>{
 const screen=read("app/screener/page.jsx"),config=read("lib/config.js"),gateway=read("app/api/market/[...path]/route.js");
 for(const path of ["/api/screener","/api/indices","/api/us-screener","/api/us-indices"])assert.ok(screen.includes(path),path);
 assert.match(config,/API_URL = "\/api\/market"/);
 for(const path of ["screener","us-screener","indices","us-indices"])assert.ok(gateway.includes(path));
 assert.match(gateway,/ALLOWED/);
});
test("each stock load uses cancellable requests and no overlapping refresh loops",()=>{
 const s=read("app/screener/page.jsx");
 assert.match(s,/const controller = new AbortController\(\)/);
 assert.match(s,/if \(busy\) return/);
 assert.match(s,/controller\.abort\(\)/);
 assert.match(s,/signal: controller\.signal/);
 assert.match(s,/refreshSeq/);
 assert.match(s,/setInterval\(\(\) => \{if\(!document\.hidden\)load\(\);\},15000\)/);
});
test("failures never turn a market-data 503 into confirmed live prices or no matching stocks",()=>{
 const s=read("app/screener/page.jsx");
 assert.match(s,/stocksResult\.value\?\.success === true/);
 assert.match(s,/stocksResult\.value\.data\.length > 0/);
 assert.match(s,/setStatus\(body\.stale === true \? "stale" : "live"\)/);
 assert.match(s,/setStatus\("error"\)/);
 assert.match(s,/role="alert"/);
 assert.match(s,/Retry now/);
 assert.match(s,/Market-data connection problem/);
 assert.match(s,/not confirmed live/);
 assert.match(s,/setIndices\(null\)/);
 assert.match(s,/v\?\.prevClose > 0/);
});
test("NSE and US switch, filters, views and export still exist",()=>{
 const s=read("app/screener/page.jsx");
 for(const x of ["switchMarket","screener_market_switched","screener_filter_changed",
 "screener_exported","screener_stock_opened","Charts","Tickers","Maps","Overview","Fundamental","Technical","Check now"])
 assert.ok(s.includes(x),x);
});
test("same-origin gateway does not proxy arbitrary URLs or user tokens",()=>{
 const src=read("app/api/market/[...path]/route.js");
 assert.match(src,/ALLOWED.some/);
 assert.doesNotMatch(src,/Authorization:|UPSTOX_ACCESS_TOKEN/);
 assert.match(src,/errorCode:/);
});
