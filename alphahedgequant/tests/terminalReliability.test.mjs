import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
const content=await readFile(new URL("../lib/terminalValuation.js",import.meta.url),"utf8");
const {modelValue,scenarioCases,sensitivity,reverseGrowth}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(content));
const base={revenueCr:1000,growth:.1,stableGrowth:.04,currentMargin:.15,targetMargin:.18,salesToCapital:2,tax:.25,wacc:.12,terminalROIC:.12,netDebtCr:100,sharesCr:10};
test("DCF reconciles enterprise, equity and per share",()=>{
 const v=modelValue(base);assert.equal(v.ok,true);
 assert.equal(v.rows.length,5);
 const total=v.rows.reduce((a,r)=>a+r.presentValueCr,0)+v.terminalPVCr;
 assert.ok(Math.abs(total-v.enterpriseValueCr)<1e-8);
 assert.ok(Math.abs(v.equityValueCr-(v.enterpriseValueCr-100))<1e-8);
 assert.ok(Math.abs(v.fairValue-v.equityValueCr/10)<1e-8);
});
test("DCF refuses incomplete and invalid economic assumptions",()=>{
 for(const o of [{revenueCr:""},{salesToCapital:0},{stableGrowth:.13},{terminalROIC:.02},{sharesCr:0,revenueCr:-1}])assert.equal(modelValue({...base,...o}).ok,false);
});
test("missing net debt or shares never produces a fabricated share value",()=>{
 assert.equal(modelValue({...base,netDebtCr:""}).fairValue,null);
 assert.equal(modelValue({...base,sharesCr:""}).fairValue,null);
});
test("scenario and discount sensitivity calculations remain finite or explicit invalid",()=>{
 const v=scenarioCases(base);assert.equal(v.length,3);
 assert.ok(v.every(x=>x.result.ok && Number.isFinite(x.result.enterpriseValueCr)));
 const matrix=sensitivity(base);assert.equal(matrix.cells.length,5);assert.ok(matrix.cells.every(r=>r.length===5 && r.every(c=>c.ok===true || typeof c.error==="string")));
});
test("reverse growth reproduces synthetic observed equity within tolerance",()=>{
 const v=modelValue(base);const r=reverseGrowth(base,v.equityValueCr);
 assert.equal(r.ok,true);assert.ok(Math.abs(r.impliedInitialGrowth-base.growth)<1e-7);
});
const workbook=JSON.parse(await readFile(new URL("../lib/terminalWorkbookData.json",import.meta.url),"utf8"));
test("all uploaded financial records have valid ticker IDs and fiscal periods",()=>{
 assert.equal(Object.keys(workbook).length,11);
 for(const [ticker,company] of Object.entries(workbook)){
  assert.match(ticker,/^[A-Z0-9&_.-]{1,40}$/);
  for(const kind of ["annual","quarterly","balance","cashflow"]){
   assert.ok(Array.isArray(company[kind]) && company[kind].length>0,`${ticker} ${kind}`);
   const dates=new Set();
   for(const row of company[kind]){
    assert.match(row.period,/^20\d\d-\d\d-\d\d$/);
    assert.equal(Number.isFinite(Date.parse(row.period)),true);
    assert.equal(dates.has(row.period),false,`${ticker} ${kind}: duplicate period`);
    dates.add(row.period);
    for(const [key,value] of Object.entries(row))if(key!=="period")assert.ok(typeof value==="number"&&Number.isFinite(value),`${ticker} ${kind} ${key}`);
   }
  }
 }
});

test("company story summaries match the authoritative uploaded annual history",async()=>{
 const raw=await readFile(new URL("../lib/terminalWorkbookStory.js",import.meta.url),"utf8");
 assert.match(raw,/terminalWorkbookData\.json/,"Narratives must use uploaded financial source");
 assert.doesNotMatch(raw,/years:\s*\[\[20\d\d,/,"No disconnected hardcoded annual narratives");
 for(const [symbol,company] of Object.entries(workbook)){
  const complete=company.annual.filter(row=>Number.isFinite(row.sales)&&Number.isFinite(row.pat));
  assert.ok(complete.length>=2,symbol+" needs two annual observations");
  assert.ok(complete.every(row=>row.sales>0),symbol+" revenue should be positive for growth calculations");
 }
});

test("PostgreSQL company graph retains source provenance and verification status",async()=>{
 const schema=await readFile(new URL("../db/001_company_graph.sql",import.meta.url),"utf8");
 for(const table of ["ahq_company","ahq_security","ahq_source","ahq_company_fact","ahq_company_relationship"])
  assert.match(schema,new RegExp("CREATE TABLE IF NOT EXISTS "+table+"\\b"));
 for(const col of ["company_id","source_id","period_end","reporting_scope","verification_status","relationship_type"])
  assert.match(schema,new RegExp("\\b"+col+"\\b"));
 assert.doesNotMatch(schema,/DROP TABLE|TRUNCATE TABLE|DELETE FROM/i);
});
