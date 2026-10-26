import assert from "node:assert/strict";
import test from "node:test";
import {validateRecord,dedupeDocuments} from "../lib/documentRegistry.mjs";

const base={
  symbol:"HAL",market:"NSE",category:"concalls",title:"Earnings call transcript",
  publisher:"NSE",url:"https://nsearchives.nseindia.com/corporate/example.pdf",
  publishedAt:"2026-10-01"
};
test("accepts issuer-specific original exchange document metadata",()=>{
  const r=validateRecord(base);
  assert.equal(r?.symbol,"HAL");
  assert.equal(r?.verified,true);
});
test("rejects copied index links and unknown or unsafe hosts",()=>{
  for(const url of ["https://screener.in/company/HAL/","http://nsearchives.nseindia.com/a.pdf","https://nsearchives.nseindia.com.evil.org/a.pdf","https://127.0.0.1/private","file:///etc/passwd"]) {
    assert.equal(validateRecord({...base,url}),null);
  }
});
test("requires issuer symbol and source metadata",()=>{
  assert.equal(validateRecord({...base,symbol:""}),null);
  assert.equal(validateRecord({...base,title:""}),null);
  assert.equal(validateRecord({...base,market:"OTHER"}),null);
});
test("dedupes identical URLs per issuer",()=>{
  const item=validateRecord(base);
  assert.equal(dedupeDocuments([item,item,{...item,symbol:"TCS"}]).length,2);
});
