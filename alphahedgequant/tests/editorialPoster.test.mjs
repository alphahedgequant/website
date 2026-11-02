import test from "node:test";
import assert from "node:assert/strict";
import {renderEditorialPoster} from "../lib/editorialPoster.mjs";
test("AHQ poster renders both required publishing aspect ratios",()=>{
 for(const [format,dimensions] of [["portrait",'viewBox="0 0 1080 1350"'],["landscape",'viewBox="0 0 1200 675"']]){
  const svg=renderEditorialPoster({format,title:"How India measures growth and inflation",deck:"An educational primer for finance researchers"});
  assert.ok(svg.startsWith("<svg"));assert.ok(svg.includes(dimensions));assert.match(svg,/ALPHAHEDGEQUANT/);
 }
});
test("numeric artwork refuses missing sources, dates and units",()=>{
 const base={title:"Tracking Indian economic indicators",metricValue:5,metricLabel:"Illustration",metricUnit:"%",metricSource:"Issuer reference",metricPeriod:"2026-10-01"};
 assert.match(renderEditorialPoster(base),/As of 2026-10-01/);
 for(const change of [{metricSource:""},{metricUnit:""},{metricPeriod:"October"},{metricLabel:""}])assert.throws(()=>renderEditorialPoster({...base,...change}));
});
test("SVG output escapes user-provided content instead of injecting markup",()=>{
 const svg=renderEditorialPoster({title:"Research & insight <script>alert(1)</script>",deck:'Year-on-year <strong>moves</strong>'});
 assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);assert.doesNotMatch(svg,/<strong>/);
});
test("overlong input is rejected",()=>{
 assert.throws(()=>renderEditorialPoster({title:"Short"}));
 assert.throws(()=>renderEditorialPoster({title:"Economic research narrative",deck:"a".repeat(300)}));
});
