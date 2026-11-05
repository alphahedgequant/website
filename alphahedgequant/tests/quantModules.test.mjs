import test from "node:test";
import assert from "node:assert/strict";
import {MODULE_GUIDES,MODULE_TOPICS,topicProgress} from "../lib/quantModuleGuides.mjs";
import {TOPIC_DEEP_DIVES} from "../lib/quantDeepDives.mjs";
import {QUANT_LESSONS,QUANT_SECTIONS} from "../lib/quantCourse.mjs";
test("six module headings and syllabus topics are structured in the required order",()=>{
 assert.equal(MODULE_GUIDES.length,6);
 assert.equal(QUANT_SECTIONS.length,6);
 assert.deepEqual(MODULE_TOPICS.reduce((a,t)=>(a[t.module]++,a),Array(6).fill(0)),[10,10,12,13,15,14]);
 assert.equal(new Set(MODULE_TOPICS.map(t=>t.id)).size,MODULE_TOPICS.length);
});
test("every syllabus topic gives a beginner explanation, applied example and limitation",()=>{
 for(const t of MODULE_TOPICS){
  assert.match(t.id,/^quant-topic-[1-6]-[0-9]{2}$/);
  assert.ok(t.title.length>=12,t.id+" title");
  assert.ok(t.concept.length>=110,t.id+" explanation");
  assert.ok(t.example.length>=90,t.id+" real-world example");
  assert.ok(t.caution.length>=60,t.id+" limitation");
 }
});
test("each module has an actual Python coding exercise, tasks and approachable introduction",()=>{
 for(const m of MODULE_GUIDES){
  assert.ok(m.intro.length>250,m.title+" introduction");
  assert.ok(m.bridge.length>150,m.title+" bridge");
  assert.ok(m.code.length>250,m.title+" starter code");
  assert.equal(m.tasks.length,3);
  assert.ok(m.tasks.every(x=>x.length>25));
 }
});
test("existing 74 foundation lessons and module topic completion are independent",()=>{
 assert.equal(QUANT_LESSONS.length,74);
 const p={"quant-topic-1-01":{completed:true},"math-1":{completed:true},"quant-lab-1":{completed:true}};
 assert.deepEqual(topicProgress(p,0),{total:10,done:1});
 assert.deepEqual(topicProgress(p,1),{total:10,done:0});
});
test("topic and coding progress IDs match Clerk/Neon progress API contract",()=>{
 const pattern=/^(math-|prob-|stats-|markets-|econ-|calc-|risk-|deriv-|portfolio-|quant-|ml-|stochastic-|options-|llm-|interview-|mental-)[a-z0-9-]{1,75}$/;
 for(const t of MODULE_TOPICS)assert.match(t.id,pattern);
 for(let i=1;i<=6;i++)assert.match("quant-lab-"+i,pattern);
});

test("advanced chapters have individual analogies, math and non-overstated limits",()=>{
 const keys=Object.keys(TOPIC_DEEP_DIVES);
 assert.ok(keys.length>=30);
 const known=new Set(MODULE_TOPICS.map(x=>x.id));
 for(const key of keys){
  assert.ok(known.has(key),key+" missing chapter");
  const d=TOPIC_DEEP_DIVES[key];
  assert.ok(d.intuition.length>=100,key+" intuition too short");
  assert.ok(d.worked.length>=100,key+" worked example too short");
  assert.ok(d.formula.length>=20,key+" formula missing");
  assert.ok(d.pitfall.length>=70,key+" caution missing");
 }
});
