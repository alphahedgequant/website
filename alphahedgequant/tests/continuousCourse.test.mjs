import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MODULE_TOPICS,MODULE_GUIDES} from "../lib/quantModuleGuides.mjs";
import {QUANT_LESSONS} from "../lib/quantCourse.mjs";
import {CHAPTER_CONNECTIONS,MODULE_LEARNING_BRIDGES} from "../lib/quantLearningConnections.mjs";
const view=readFileSync(new URL("../components/ContinuousQuantCourse.jsx",import.meta.url),"utf8");
const page=readFileSync(new URL("../app/learn/page.jsx",import.meta.url),"utf8");
const publicPage=readFileSync(new URL("../app/learn/PublicLearnCourse.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../components/continuous-course.css",import.meta.url),"utf8");
test("only the continuous reader is active on the Learn Quant page",()=>{
 assert.match(page,/import PublicLearnCourse/);
 assert.match(page,/<PublicLearnCourse\/>/);
 assert.match(publicPage,/<ContinuousQuantCourse progress=\{progress\} save=\{save\} sync=\{sync\}/);
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
 assert.match(publicPage,/setSync\("Progress saved to your account"\);return true/);
 assert.match(publicPage,/return false/);
});

test("Learn Quant avoids duplicate dashboard metrics and giant selection cards",()=>{
 assert.match(publicPage,/aria-label="Academy areas"/);
 assert.match(publicPage,/href="\/learn\/interviews"/);
 assert.match(publicPage,/href="\/learn\/mental-maths"/);
 assert.doesNotMatch(publicPage,/tab!=="quant"&&<div className="grid grid-cols-2/);
 assert.match(publicPage,/aria-label="Academy areas"/);
 assert.doesNotMatch(publicPage,/className="grid gap-3 md:grid-cols-3 mt-8"/);
});

test("all 74 chapters have a distinct substantive connection to adjacent concepts",()=>{
 assert.equal(Object.keys(CHAPTER_CONNECTIONS).length,74);
 for(const t of MODULE_TOPICS){
  assert.ok(CHAPTER_CONNECTIONS[t.id],t.id+" missing context");
  assert.ok(CHAPTER_CONNECTIONS[t.id].length>=125,t.id+" context too brief");
 }
 assert.equal(MODULE_LEARNING_BRIDGES.length,6);
 assert.ok(MODULE_LEARNING_BRIDGES.every(s=>s.length>=180));
 assert.match(view,/CHAPTER_CONNECTIONS\[topic\.id\]\|\|topic\.connection/);
 assert.match(view,/ALL_BRIDGES\[section\]/);
});
