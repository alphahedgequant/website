import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
const path="app/library/series/macro-outlook/october-2026/";
test("the approved complete macro report is published without private author or style labels",()=>{
 const doc=read("content/october-2026-india-macro.md");
 assert.ok(doc.length>27000);
 assert.match(doc,/The Export Breakout Meets the Inflation Test/);
 assert.match(doc,/Primary-source and verification register/);
 for(let i=1;i<=25;i++)assert.ok(doc.includes("[S"+String(i).padStart(2,"0")+"]"),"missing source "+i);
 for(const bad of ["Shreyash","Randhe","Damodaran","in plain english","HOLD — owner approval"])assert.ok(!doc.toLowerCase().includes(bad.toLowerCase()),"unwanted attribution "+bad);
 assert.match(doc,/provisional/i);
 assert.match(doc,/hypothetical/i);
 assert.match(doc,/2026-11-13|13 November 2026/);
});
test("full public research article reuses the existing macro outlook reader and includes all source citations",()=>{
 const src=read(path+"page.jsx"),style=read(path+"macro-report.css");
 assert.match(src,/import "\.\.\/\.\.\/\.\.\/library\.css"/);
 assert.match(src,/import "\.\.\/\.\.\/preview\.css"/);
 assert.match(src,/rp-site rp-article ahq-macro-report/);
 assert.match(src,/rp-article-top/);
 assert.match(src,/rp-paper-shell/);
 assert.match(src,/macro-table-scroll/);
 assert.match(src,/macro-source-cites/);
 assert.match(src,/isAccessibleForFree:true/);
 assert.match(src,/robots:\{index:true,follow:true\}/);
 assert.match(src,/source-\+block\.id/);
 assert.match(style,/\.ahq-macro-report \.macro-figure/);
 assert.match(style,/@media\(max-width:520px\)/);
 assert.doesNotMatch(src,/auth\(|auth\.protect|SignedOut|UnlockResearch/);
});
test("seven scaled figures use real published numbers, denominators and source labels",()=>{
 const figures=read(path+"MacroFigures.jsx");
 for(const x of ["GoodsTradeChart","ServicesBridgeChart","InflationChart","IndustrialChart","GSTCompositionChart","CashFlowChart","TransmissionChart"])
  assert.ok(figures.includes("function "+x+"("),"missing "+x);
 for(const x of ["49.47","89.35","39.88","40.51","20.72","19.79","6.09","8.94","12.2","10.4","159044","72246","832","589","358"])
  assert.ok(figures.includes(x),"missing verified figure "+x);
 assert.match(figures,/frac=domestic\/total/);
 assert.match(figures,/strokeDasharray/);
 assert.match(figures,/return <Exhibit number="07"/);
 assert.match(figures,/aria-label/);
 assert.doesNotMatch(figures,/Math\.random\(/);
});
test("article is discoverable from the Macro Outlook series and public sitemap without opening gated Reports",()=>{
 const landing=read("app/library/series/[series]/page.jsx");
 const sitemap=read("app/sitemap.js");
 const middleware=read("middleware.js");
 assert.match(landing,/Read October report/);
 assert.match(landing,/\/library\/series\/macro-outlook\/october-2026/);
 assert.match(sitemap,/\/library\/series\/macro-outlook\/october-2026/);
 assert.match(middleware,/"\/library\(\.\*\)"/);
 assert.doesNotMatch(middleware,/"\/reports\(.*\)"/);
});
