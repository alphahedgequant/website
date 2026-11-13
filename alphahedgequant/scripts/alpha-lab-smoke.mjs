import assert from "node:assert/strict";
import {test} from "node:test";
import {parseFormula,evaluateFormula,runAlphaResearch,ALPHA_PRESETS} from "../lib/alphaLabEngine.mjs";

const symbols=["RELIANCE","TCS","HDFCBANK","ICICIBANK","INFY","SBIN"];
function fixture(n=180){
 const out={};
 symbols.forEach((s,j)=>{
  const arr=[];
  for(let t=0;t<n;t++){
   const day=new Date(Date.UTC(2024,0,1+t)).toISOString().slice(0,10);
   const open=100+j*13+t*.27+Math.sin((t+j)/7)*(2+j*.2);
   const close=open+Math.cos((t+j)/11)*1.2;
   arr.push({date:day,open,close,high:Math.max(open,close)+2,low:Math.min(open,close)-2,volume:500000+j*22000+t*400+(t%9)*1500});
  }
  out[s]=arr;
 });
 return out;
}
test("Safe parser accepts supported math and rejects JS execution",()=>{
 assert.ok(parseFormula("rank(-ts_corr(returns,log(volume+1),20))"));
 assert.throws(()=>parseFormula("process.exit(0)"),/Unexpected character|Unknown operator/);
 assert.throws(()=>parseFormula("eval(close)"),/Unknown operator/);
 assert.throws(()=>parseFormula("close; alert(1)"),/Unexpected character/);
});
test("All five built-in hypotheses produce numeric results on test-only fixtures",()=>{
 const fixtureData=fixture();
 for(const p of ALPHA_PRESETS){
  const result=runAlphaResearch(p.formula,fixtureData,5);
  assert.ok(result.curve.length>=30,p.name);
  assert.ok(Number.isFinite(result.metrics.totalReturn),p.name);
  assert.equal(result.symbols.length,6);
  assert.ok(result.byYear.length>0);
 }
});
test("Missing market data is not silently replaced by dummy prices",()=>{
 assert.throws(()=>runAlphaResearch("rank(close)",{},5),/At least four/);
 const x=fixture(20);
 assert.throws(()=>runAlphaResearch("rank(close)",x,5),/Insufficient overlapping/);
});
test("Window and lag guards fail safely",()=>{
 assert.throws(()=>runAlphaResearch("ts_mean(close,999)",fixture(),5),/Window and lag/);
 assert.throws(()=>runAlphaResearch("ts_autocorr(close,20,21)",fixture(),5),/smaller than the window/);
});
test("Equity path depends on next-open prices, not same-day closing mark",()=>{
 const x=fixture(),y=fixture();
 y.RELIANCE[179].close*=1.01;
 y.RELIANCE[179].high=Math.max(y.RELIANCE[179].close,y.RELIANCE[179].high);
 const a=runAlphaResearch("rank(volume)",x,0),b=runAlphaResearch("rank(volume)",y,0);
 assert.equal(a.metrics.totalReturn,b.metrics.totalReturn);
});
