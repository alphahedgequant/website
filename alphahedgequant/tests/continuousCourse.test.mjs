import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MODULE_TOPICS,MODULE_GUIDES} from "../lib/quantModuleGuides.mjs";
import {QUANT_LESSONS} from "../lib/quantCourse.mjs";
const view=readFileSync(new URL("../components/ContinuousQuantCourse.jsx",import.meta.url),"utf8");
const page=readFileSync(new URL("../app/learn/page.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../components/continuous-course.css",import.meta.url),"utf8");
test("only the continuous reader is active on the Learn Quant page",()=>{
 assert.match(page,/tab==="quant"&&<ContinuousQuantCourse/);
 assert.doesNotMatch(page,/<QuantCourse\s+progress=/);
 assert.match(view,/className="ac-sidebar"/);
 assert.match(view,/className="ac-paper"/);
 assert.doesNotMatch(view,/className="qmodule-topic-list"/);
 assert.doesNotMatch(view,/className="qcourse-lesson-nav"/);
});
test("all chapters and numeric practice are presented in sequential document sections",()=>{
 assert.match(view,/topics\.map\(topic=><Chapter/);
 assert.match(view,/foundations\.map\(l=><Foundation/);
 assert.match(view,/<Coding key=\{section\}/);
 assert.equal(MODULE_TOPICS.length,74);
 assert.equal(QUANT_LESSONS.length,74);
 assert.equal(MODULE_GUIDES.length,6);
});
test("navigation stays grayscale with only one module progress sidebar",()=>{
 assert.match(css,/\.ac-sidebar\{/);
 assert.match(css,/\.ac-sidebar-item\.selected/);
 assert.doesNotMatch(css,/#e3be4f|amber|yellow|gold/i);
});
test("completion messaging requires save success rather than assuming database writes worked",()=>{
 assert.match(view,/const saved=await save\(topic\.id,100,true\)/);
 assert.match(view,/const saved=await save\(id,100,true\)/);
 assert.match(page,/setSync\("Progress saved"\);return true/);
 assert.match(page,/return false/);
});
