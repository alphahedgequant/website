import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SCENARIO_CASES,SCENARIO_FAMILIES} from "../lib/interviewScenarioBank.mjs";

const source=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const cases=SCENARIO_CASES;
test("1,200 reproducible, unique and complete numerical interview scenarios",()=>{
 assert.equal(SCENARIO_FAMILIES,48);
 assert.equal(cases.length,1200);
 assert.equal(new Set(cases.map(q=>q.id)).size,cases.length,"question IDs must be unique");
 assert.equal(new Set(cases.map(q=>q.question)).size,cases.length,"questions must not repeat");
 for(const role of ["Researcher","Trader","Developer","Market Risk"]){
  assert.equal(cases.filter(q=>q.role===role).length,300,role);
  for(const level of ["Beginner","Intermediate","Advanced"])assert.equal(cases.filter(q=>q.role===role&&q.level===level).length,100,role+" "+level);
 }
 for(const level of ["Beginner","Intermediate","Advanced"])assert.equal(cases.filter(q=>q.level===level).length,400,level);
});
test("all answer choices include one and only one correctly indexed answer",()=>{
 for(const q of cases){
  assert.equal(q.kind,"numeric",q.id);
  assert.ok(q.topic&&q.concept&&q.role&&q.level,q.id);
  assert.ok(q.question.length>40,q.id);
  assert.equal(q.options.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id+" duplicate choice");
  assert.ok(q.correctIndex>=0&&q.correctIndex<4,q.id);
  assert.equal(q.options[q.correctIndex],q.answer,q.id+" answer-key mismatch");
  assert.equal(q.options.filter(x=>x===q.answer).length,1,q.id);
  assert.ok(q.points.length>=3&&q.points[0].length>35,q.id);
  assert.ok(q.example.length>=40&&q.trap.length>25&&q.hint.length>20,q.id);
  assert.ok(!q.answer.includes("NaN")&&!q.answer.includes("Infinity"),q.id);
 }
});
test("representative quantitative calculations match independently checked financial arithmetic",()=>{
 const byId=Object.fromEntries(cases.map(q=>[q.id,q]));
 assert.equal(byId["scenario-01-01"].answer,"1.92%");
 assert.equal(byId["scenario-13-01"].answer,"₹0.1");
 assert.equal(byId["scenario-17-01"].answer,"5 units");
 assert.equal(byId["scenario-21-01"].answer,"₹0.02");
 assert.equal(byId["scenario-24-01"].answer,"₹0.21");
 assert.equal(byId["scenario-25-01"].answer,"5 steps");
 assert.equal(byId["scenario-37-01"].answer,"₹1,000");
 assert.equal(byId["scenario-48-01"].answer,"50%");
});
test("interactive arena ships without replacing continuous course or math modules",()=>{
 const page=source("../app/learn/page.jsx");
 const arena=source("../components/InterviewArena.jsx");
 const bank=source("../lib/academyInterviews.js");
 const css=source("../components/interview-arena.css");
 assert.match(page,/tab==="quant"&&<ContinuousQuantCourse/);
 assert.match(page,/tab==="mental"&&<section/);
 assert.match(page,/tab==="interview"&&<InterviewArena progress=\{progress\} save=\{save\} sync=\{sync\}/);
 assert.match(bank,/\.concat\(SCENARIO_CASES\)/);
 assert.match(arena,/5-min mock · 10 Q/);
 assert.match(arena,/localStorage\.setItem/);
 assert.match(arena,/rememberGrade\(question,correct\?100:0\)/);
 assert.match(arena,/await save\("interview-"\+q\.id,value,value===100\)/);
 assert.match(arena,/prefers-reduced-motion|aria-label="Quant interview arena"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(arena,/Math\.random\(\).*answer/);
});
