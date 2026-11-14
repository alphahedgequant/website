import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {EXTENDED_SECTIONS,EXTENDED_MODULE_GUIDES,EXTENDED_MODULE_TOPICS,EXTENDED_LESSONS,EXTENDED_BRIDGES} from "../lib/quantExtendedModules.mjs";
import {QUANT_SECTIONS,QUANT_LESSONS} from "../lib/quantCourse.mjs";
import {MODULE_GUIDES,MODULE_TOPICS} from "../lib/quantModuleGuides.mjs";

const reader=readFileSync(new URL("../components/ContinuousQuantCourse.jsx",import.meta.url),"utf8");
const page=readFileSync(new URL("../app/learn/page.jsx",import.meta.url),"utf8");
const publicCourse=readFileSync(new URL("../app/learn/PublicLearnCourse.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../components/continuous-course.css",import.meta.url),"utf8");

test("six new modules build upon six unchanged foundation modules",()=>{
 assert.equal(QUANT_SECTIONS.length,6);
 assert.equal(QUANT_LESSONS.length,74);
 assert.equal(MODULE_GUIDES.length,6);
 assert.equal(EXTENDED_SECTIONS.length,6);
 assert.equal(EXTENDED_MODULE_GUIDES.length,6);
 assert.equal(EXTENDED_SECTIONS.length+QUANT_SECTIONS.length,12);
 for(let i=0;i<6;i++){
  assert.equal(EXTENDED_SECTIONS[i].number,i+7);
  assert.equal(EXTENDED_SECTIONS[i].id,`section-${i+7}`);
 }
 assert.match(EXTENDED_SECTIONS[0].title,/Fixed Income/);
 assert.match(EXTENDED_SECTIONS[1].title,/Energy/);
 assert.match(EXTENDED_SECTIONS[3].title,/HFT Infrastructure/);
});

test("all 42 new chapters have beginner explanation, example, formula and caution",()=>{
 assert.equal(EXTENDED_MODULE_TOPICS.length,42);
 const allTopicIds=[...MODULE_TOPICS,...EXTENDED_MODULE_TOPICS].map(t=>t.id);
 assert.equal(new Set(allTopicIds).size,allTopicIds.length);
 for(const [i,chapter] of EXTENDED_MODULE_TOPICS.entries()){
  assert.match(chapter.id,/^quant-topic-(?:7|8|9|10|11|12)-\d{2}$/);
  assert.equal(chapter.module,6+Math.floor(i/7));
  assert.ok(chapter.concept.length>95,chapter.id+" concept");
  assert.ok(chapter.example.length>85,chapter.id+" example");
  assert.ok(chapter.caution.length>65,chapter.id+" caution");
  assert.ok(chapter.formula.length>18,chapter.id+" formula");
  assert.ok(chapter.connection.length>50,chapter.id+" connection");
 }
});

test("all 18 beginner practice questions have valid numeric answers and stable IDs",()=>{
 assert.equal(EXTENDED_LESSONS.length,18);
 assert.equal(new Set(EXTENDED_LESSONS.map(l=>l.id)).size,18);
 for(const [i,l] of EXTENDED_LESSONS.entries()){
  assert.match(l.id,/^quant-practice-(?:7|8|9|10|11|12)-\d{2}$/);
  assert.equal(l.section,6+Math.floor(i/3));
  assert.ok(Number.isFinite(l.answer),l.id);
  assert.ok(l.formula.length>12);
  assert.ok(l.solution.length>35);
 }
});

test("six executable-looking Python exercises have no Python syntax errors",()=>{
 for(const m of EXTENDED_MODULE_GUIDES){
  assert.ok(m.intro.length>250,m.title+" intro");
  assert.ok(m.bridge.length>180,m.title+" bridge");
  assert.ok(m.code.length>260,m.title+" code");
  assert.equal(m.tasks.length,3);
  assert.ok(m.tasks.every(t=>t.length>35));
  const p=spawnSync("python3",["-c","import ast,sys; ast.parse(sys.stdin.read())"],{input:m.code,encoding:"utf8"});
  if(p.error?.code==="ENOENT") continue; // Unit tests can still run on Node-only machines.
  assert.equal(p.status,0,m.title+": "+p.stderr);
 }
});

test("reader retains the original site style, free access and progression",()=>{
 assert.equal(EXTENDED_BRIDGES.length,6);
 assert.ok(EXTENDED_BRIDGES.every(x=>x.length>180));
 assert.match(reader,/ALL_SECTIONS=\[\.\.\.QUANT_SECTIONS,\.\.\.EXTENDED_SECTIONS\]/);
 assert.match(reader,/ALL_TOPICS=\[\.\.\.MODULE_TOPICS,\.\.\.EXTENDED_MODULE_TOPICS,/);
 assert.match(reader,/ALL_LESSONS=\[\.\.\.QUANT_LESSONS,/);
 assert.match(reader,/length:ALL_SECTIONS\.length/);
 assert.match(reader,/CHAPTER_CONNECTIONS\[topic\.id\]\|\|topic\.connection/);
 assert.match(reader,/section<ALL_SECTIONS\.length-1/);
 assert.match(reader,/className="ac-sidebar"/);
 assert.match(reader,/className="ac-paper"/);
 assert.match(page,/Seventeen-module open quantitative finance curriculum/);
 assert.match(publicCourse,/All seventeen modules/);
 assert.doesNotMatch(css,/#e3be4f|amber|yellow|gold/i);
});
