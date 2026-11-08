import test from "node:test";
import assert from "node:assert/strict";
import {CASES, CAREERS} from "../lib/academyInterviews.js";
import {SCENARIO_CASES, SCENARIO_FAMILIES} from "../lib/interviewScenarioBank.mjs";

test("interview question count and track coverage remain intact",()=>{
  assert.equal(SCENARIO_FAMILIES,48);
  assert.equal(SCENARIO_CASES.length,1200);
  assert.equal(CASES.length,1224);
  const roles=CAREERS.map(x=>x.key);
  assert.deepEqual(roles,["Researcher","Trader","Developer","Market Risk"]);
  for (const role of roles){
    assert.equal(CASES.filter(q=>q.role===role&&q.kind==="numeric").length,300,role);
    assert.ok(CASES.filter(q=>q.role===role&&q.kind==="theory").length>=5,role);
  }
});

test("IDs, text and grading data stay safe and complete",()=>{
  const ids=new Set();
  const roles=new Set(CAREERS.map(x=>x.key));
  for(const q of CASES){
    assert.match(q.id,/^(case-\d+|scenario-\d{2}-\d{2})$/);
    assert.ok(!ids.has(q.id),"duplicate ID "+q.id);ids.add(q.id);
    assert.ok(roles.has(q.role),"unknown career "+q.role);
    assert.ok(["Beginner","Intermediate","Advanced"].includes(q.level));
    for(const p of ["question","concept","example","trap","hint"]){
      assert.equal(typeof q[p],"string",q.id+" missing "+p);
      assert.ok(q[p].trim().length>4,q.id+" empty "+p);
    }
    assert.ok(Array.isArray(q.points)&&q.points.length>=3,q.id+" missing worked steps");
    assert.ok(q.points.every(p=>typeof p==="string"&&p.length>8),q.id+" missing explanation");
    const progressId="interview-"+q.id;
    assert.match(progressId,/^(interview-)[a-z0-9-]{1,75}$/);
    if(q.kind==="numeric"){
      assert.equal(q.options.length,4,q.id);
      assert.equal(new Set(q.options).size,4,q.id+" duplicate answers");
      assert.ok(Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<4,q.id);
      assert.equal(q.options[q.correctIndex],q.answer,q.id+" incorrect answer key");
    }else assert.equal(q.kind,"theory");
  }
});

test("all 48 scenario families produce exactly 25 distinct identifiers",()=>{
  const counts=new Map();
  for(const q of SCENARIO_CASES){
    const family=q.id.slice(0,-3);
    counts.set(family,(counts.get(family)||0)+1);
  }
  assert.equal(counts.size,48);
  assert.ok([...counts.values()].every(n=>n===25));
});
