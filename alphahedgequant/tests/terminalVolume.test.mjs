import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../lib/terminalVolume.js", import.meta.url), "utf8");
const {volumeSeries} = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

const bar=(date,minute,volume)=> {
  const h=String(Math.floor(minute/60)).padStart(2,"0"),m=String(minute%60).padStart(2,"0");
  return [date+"T"+h+":"+m+":00+05:30",1,1,1,1,volume,0];
};
const day=(date,volume,count=375)=>Array.from({length:count},(_,i)=>bar(date,555+i,volume));

test("mean median cumulative RVOL aligned by NSE minute",()=>{
  const x=volumeSeries([...day("2026-10-22",10),...day("2026-10-23",20)],[bar("2026-10-26",555,30),bar("2026-10-26",556,30)],15);
  assert.equal(x.eligibleSessions,2);
  assert.equal(x.points[0].mean,15);
  assert.equal(x.points[0].median,15);
  assert.equal(x.points[0].rvol,2);
  assert.equal(x.points[1].today,60);
  assert.equal(x.points[1].mean,30);
  assert.equal(x.points[1].rvol,2);
  assert.equal(x.points[2].today,null);
});
test("current session is not part of historical baseline",()=>{
 const current=day("2026-10-26",100);
 const x=volumeSeries([...day("2026-10-23",10),...current],current,15);
 assert.equal(x.eligibleSessions,1);
 assert.equal(x.points[0].mean,10);
});
test("incomplete historic session excluded",()=>{
 const x=volumeSeries([...day("2026-10-22",10,350),...day("2026-10-23",20)],day("2026-10-26",30,5),15);
 assert.equal(x.eligibleSessions,1);
 assert.equal(x.points[0].mean,20);
});
test("missing current minute not filled as zero",()=>{
 const x=volumeSeries(day("2026-10-23",10),[bar("2026-10-26",555,30),bar("2026-10-26",557,30)],15);
 assert.equal(x.points[1].today,null);
 assert.equal(x.points[2].today,null);
});
