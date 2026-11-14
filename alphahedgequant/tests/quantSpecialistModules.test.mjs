import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {SPECIALIST_SECTIONS,SPECIALIST_GUIDES,SPECIALIST_BRIDGES,SPECIALIST_LESSONS} from "../lib/quantSpecialistModules.mjs";
import {SPECIALIST_TOPICS_A} from "../lib/quantSpecialistTopicsA.mjs";
import {SPECIALIST_TOPICS_B} from "../lib/quantSpecialistTopicsB.mjs";
import {QUANT_SECTIONS} from "../lib/quantCourse.mjs";
import {EXTENDED_SECTIONS} from "../lib/quantExtendedModules.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const topics=[...SPECIALIST_TOPICS_A,...SPECIALIST_TOPICS_B];
const visibleText=[...SPECIALIST_SECTIONS.map(s=>s.title+" "+s.description),
 ...SPECIALIST_GUIDES.map(g=>g.title+" "+g.intro+" "+g.bridge+" "+g.assignment+" "+g.tasks.join(" ")),
 ...topics.map(x=>[x.title,x.concept,x.example,x.caution,x.connection].join(" "))].join("\n");
test("exactly five specialist modules extend the previous twelve without replacing IDs",()=>{
 assert.equal(QUANT_SECTIONS.length+EXTENDED_SECTIONS.length,12);
 assert.equal(SPECIALIST_SECTIONS.length,5);
 assert.equal(SPECIALIST_GUIDES.length,5);
 assert.equal(SPECIALIST_BRIDGES.length,5);
 assert.deepEqual(SPECIALIST_SECTIONS.map(s=>s.number),[13,14,15,16,17]);
 assert.equal(new Set(SPECIALIST_SECTIONS.map(s=>s.id)).size,5);
 assert.equal(new Set(SPECIALIST_SECTIONS.map(s=>s.title)).size,5);
});
test("every specialist module has 24 substantive original chapters with precise formula and limitations",()=>{
 assert.equal(topics.length,120);
 assert.equal(SPECIALIST_TOPICS_A.length,72);
 assert.equal(SPECIALIST_TOPICS_B.length,48);
 assert.equal(new Set(topics.map(x=>x.id)).size,topics.length);
 for(let module=12;module<17;module++){
  const chapters=topics.filter(x=>x.module===module);
  assert.equal(chapters.length,24,"module "+module);
  assert.deepEqual(chapters.map(x=>x.index),Array.from({length:24},(_,i)=>i+1));
  for(const x of chapters){
   assert.equal(x.id,"quant-topic-"+(module+1)+"-"+String(x.index).padStart(2,"0"));
   assert.ok(x.title.length>=12,x.id+" title");
   assert.ok(x.concept.length>=90,x.id+" concept");
   assert.ok(x.example.length>=68,x.id+" example");
   assert.ok(x.formula.length>=15,x.id+" equation");
   assert.ok(x.caution.length>=58,x.id+" limitation");
   assert.ok(x.connection.length>=120,x.id+" explanation bridge");
  }
 }
});
test("five Python labs are syntactically valid and all cover explicit reproducible exercises",()=>{
 for(const g of SPECIALIST_GUIDES){
  assert.ok(g.intro.length>=240,g.title+" introduction");
  assert.ok(g.bridge.length>=160,g.title+" bridge");
  assert.ok(g.code.length>=260,g.title+" code");
  assert.equal(g.tasks.length,3);
  const parse=spawnSync("python3",["-c","import ast,sys;ast.parse(sys.stdin.read())"],{input:g.code,encoding:"utf8"});
  if(parse.error?.code==="ENOENT")continue;
  assert.equal(parse.status,0,g.title+": "+parse.stderr);
 }
});
test("fifteen short numerical examples use stable and valid progress identifiers",()=>{
 assert.equal(SPECIALIST_LESSONS.length,15);
 assert.equal(new Set(SPECIALIST_LESSONS.map(x=>x.id)).size,15);
 for(let module=12;module<17;module++)assert.equal(SPECIALIST_LESSONS.filter(x=>x.section===module).length,3);
 const allowed=/^(math-|prob-|stats-|markets-|econ-|calc-|risk-|deriv-|portfolio-|quant-|ml-|stochastic-|options-|llm-|interview-|mental-)[a-z0-9-]{1,75}$/;
 for(const l of SPECIALIST_LESSONS){
  assert.match(l.id,allowed);
  assert.ok(Number.isFinite(l.answer));
  assert.ok(l.solution.length>=65);
  assert.ok(l.question.includes("?"));
 }
});
test("new lessons avoid source publication titles, individual author names and PDF redistribution",()=>{
 assert.doesNotMatch(visibleText,/Fabozzi|Haug|Hull|Dunis|Naim|Lopez|Prado|Wiley|Pearson|McGraw|Handbook|[Bb]ook [Tt]itle|z-library|WeLib/);
 const files=["lib/quantSpecialistModules.mjs","lib/quantSpecialistTopicsA.mjs","lib/quantSpecialistTopicsB.mjs"];
 for(const file of files)assert.doesNotMatch(read(file),/https?:\/\/|\.pdf\b|base64|ISBN|\bquoted from\b/i);
});
test("existing continuous course design, free access, and login-only interview/math remain intact",()=>{
 const reader=read("components/ContinuousQuantCourse.jsx");
 const publicCourse=read("app/learn/PublicLearnCourse.jsx");
 const page=read("app/learn/page.jsx");
 const existingCSS=read("components/continuous-course.css");
 assert.match(reader,/SPECIALIST_SECTIONS/);
 assert.match(reader,/SPECIALIST_TOPICS_A/);
 assert.match(reader,/SPECIALIST_TOPICS_B/);
 assert.match(reader,/SPECIALIST_LESSONS/);
 assert.match(reader,/ALL_SECTIONS\.push\(\.\.\.SPECIALIST_SECTIONS\)/);
 assert.match(reader,/className="ac-sidebar"/);
 assert.match(reader,/className="ac-paper"/);
 assert.match(reader,/topics\.map\(topic=><Chapter/);
 assert.match(reader,/Seventeen modules, one clear learning path/);
 assert.match(publicCourse,/All seventeen modules/);
 assert.match(page,/Seventeen-module open quantitative finance curriculum/);
 assert.match(publicCourse,/href="\/learn\/interviews"/);
 assert.match(publicCourse,/href="\/learn\/mental-maths"/);
 assert.match(publicCourse,/const LOCAL_KEY="ahq-public-learn-progress-v1"/);
 assert.match(existingCSS,/\.ac-paper/);
 assert.doesNotMatch(existingCSS,/#e3be4f|amber|yellow|gold/i);
});
