#!/usr/bin/env node
// Referential and arithmetic checks on curated source-linked annual-report snapshots.
// Does not substitute for a reviewer checking the original issuer's financial statement.
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../lib/terminalAuditedSeed.js",import.meta.url),"utf8");
const codeUrl="data:text/javascript;base64,"+Buffer.from(source).toString("base64");
const {VERIFIED_FINANCIAL_SNAPSHOTS,statementCheck}=await import(codeUrl);
let tested=0;
for(const [symbol,snapshot] of Object.entries(VERIFIED_FINANCIAL_SNAPSHOTS)){
 const errors=statementCheck(snapshot);
 if(errors.length)throw new Error(symbol+": "+errors.join("; "));
 if(!snapshot.source?.url?.startsWith("https://")||snapshot.years?.length<2)throw new Error(symbol+": invalid source metadata or comparative periods");
 if(snapshot.years.some(y=>!y.period||!y.end||!y.income||!y.balance||!y.cash))throw new Error(symbol+": missing core statement");
 const mix=snapshot.segmentMix;
 if(mix&&Math.abs(mix.rows.reduce((sum,r)=>sum+r.amount,0)-mix.denominator)>0.01)throw new Error(symbol+": segment mix does not reconcile");
 for(const y of snapshot.years){
  if(y.balance.totalAssets<0||!Number.isFinite(y.income.revenueFromOperations))throw new Error(symbol+": invalid financial statement fields");
 }
 console.log(symbol+": "+snapshot.years.map(y=>y.period).join(", ")+" source figures; "+(mix?.rows.length||0)+" segments; all mechanical reconciliations pass.");
 tested++;
}
if(!tested)throw new Error("No curated financial snapshots installed");
console.log("Audited snapshot mechanical checks passed: "+tested+" companies. Source-page visual verification remains a separate requirement.");
