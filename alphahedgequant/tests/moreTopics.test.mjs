import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MODULE_TOPICS} from "../lib/quantModuleGuides.mjs";
import {EXTENDED_MODULE_TOPICS} from "../lib/quantExtendedModules.mjs";
import {MORE_TOPICS_1} from "../lib/quantMoreTopics1.mjs";
import {MORE_TOPICS_2} from "../lib/quantMoreTopics2.mjs";
import {MORE_TOPICS_3} from "../lib/quantMoreTopics3.mjs";
import {MORE_TOPICS_4} from "../lib/quantMoreTopics4.mjs";

const additions=[...MORE_TOPICS_1,...MORE_TOPICS_2,...MORE_TOPICS_3,...MORE_TOPICS_4];
const preexisting=[...MODULE_TOPICS,...EXTENDED_MODULE_TOPICS];
const all=[...preexisting,...additions];

test("exactly 20 additional chapters appear in each of twelve modules",()=>{
 assert.equal(additions.length,240);
 assert.equal(new Set(all.map(t=>t.id)).size,all.length,"No existing progress IDs may be reused");
 for(let module=0;module<12;module++){
  const before=preexisting.filter(t=>t.module===module);
  const after=additions.filter(t=>t.module===module);
  assert.equal(after.length,20,`Module ${module+1} has 20 new topics`);
  assert.equal(all.filter(t=>t.module===module).length,before.length+20);
  assert.equal(after[0].index,before.length+1);
  assert.equal(after.at(-1).index,before.length+20);
  for(const t of after)assert.match(t.id,new RegExp(`^quant-topic-${module+1}-\\d{2}$`));
 }
});

test("topics are distinct, readable, and include specific worked context and limitations",()=>{
 const seen=new Set();
 for(const t of all){
  const title=t.title.trim().toLowerCase().replace(/[^a-z0-9]+/g," ");
  assert.ok(!seen.has(`${t.module}:${title}`),`Repeated title in same module: ${t.title}`);
  seen.add(`${t.module}:${title}`);
 }
 for(const t of additions){
  assert.ok(t.title.length>=8,t.id+" title missing");
  assert.ok(t.concept.length>=85,t.id+" explanation incomplete");
  assert.ok(t.example.length>=40,t.id+" example incomplete");
  assert.ok(t.caution.length>=35,t.id+" caveat incomplete");
  assert.ok(t.connection.length>=100,t.id+" transition incomplete");
  assert.doesNotMatch(t.concept+t.example,/guaranteed (profits?|returns?|gains?)/i);
 }
});

test("new chapters are integrated into one existing reader without global style changes",()=>{
 const reader=readFileSync(new URL("../components/ContinuousQuantCourse.jsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../components/continuous-course.css",import.meta.url),"utf8");
 for(let i=1;i<=4;i++)assert.match(reader,new RegExp(`\\.\\.\\.MORE_TOPICS_${i}`));
 assert.match(reader,/const topics=useMemo\(\(\)=>ALL_TOPICS\.filter\(t=>t\.module===section\)/);
 assert.match(reader,/const doneTopics=ALL_TOPICS\.filter/);
 assert.match(reader,/className="ac-sidebar"/);
 assert.match(reader,/className="ac-paper"/);
 assert.match(reader,/topics\.map\(topic=><Chapter/);
 assert.doesNotMatch(css,/#e3be4f|amber|yellow|gold/i);
});
