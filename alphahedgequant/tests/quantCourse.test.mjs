import test from "node:test";
import assert from "node:assert/strict";
import {QUANT_SECTIONS,QUANT_LESSONS,sectionProgress,isCorrect} from "../lib/quantCourse.mjs";
test("exactly six sequential sections have requested lesson totals",()=>{
 assert.equal(QUANT_SECTIONS.length,6);
 assert.deepEqual(Array.from({length:6},(_,i)=>QUANT_LESSONS.filter(l=>l.section===i).length),[10,10,13,12,15,14]);
 assert.equal(QUANT_LESSONS.length,74);
});
test("lesson IDs are unique and compatible with existing signed-in progress endpoint",()=>{
 const ids=QUANT_LESSONS.map(l=>l.id);
 assert.equal(new Set(ids).size,ids.length);
 const allowed=/^(math-|prob-|stats-|markets-|econ-|calc-|risk-|deriv-|portfolio-|quant-|ml-|stochastic-|options-|llm-|interview-|mental-)[a-z0-9-]{1,75}$/;
 ids.forEach(id=>assert.match(id,allowed));
});
test("every lesson includes substantive explanation, real-life worked setup and question",()=>{
 for(const l of QUANT_LESSONS){
  assert.ok(l.title.length>=8,l.id+" title");
  assert.ok(l.explain.length>=105,l.id+" explanation is too short");
  assert.ok(l.example.length>=60,l.id+" worked scenario is too short");
  assert.ok(l.question.includes("?"),l.id+" must ask a question");
  assert.ok(Number.isFinite(l.answer),l.id+" needs numeric answer");
 }
});
test("progress is calculated across sections rather than lesson order",()=>{
 const progress={"math-1":{completed:true},"markets-12":{completed:true},"econ-2":{completed:true}};
 assert.deepEqual(sectionProgress(progress,0),{total:10,done:1});
 assert.deepEqual(sectionProgress(progress,2),{total:13,done:1});
 assert.deepEqual(sectionProgress(progress,5),{total:14,done:1});
});
test("numerical checks do not treat blank or nonnumeric input as zero",()=>{
 const zero=QUANT_LESSONS.find(x=>x.id==="risk-1");
 assert.equal(zero.answer,0);
 assert.equal(isCorrect(zero,""),false);
 assert.equal(isCorrect(zero,"not a number"),false);
 assert.equal(isCorrect(zero,"0"),true);
 const option=QUANT_LESSONS.find(x=>x.id==="markets-12");
 assert.equal(isCorrect(option,"14"),true);
 assert.equal(isCorrect(option,"15"),false);
});
