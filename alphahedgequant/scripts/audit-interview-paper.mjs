// Render an isolated, synthetic Interview layout fixture with the actual
// production Interview stylesheet. No Clerk account, production data, or
// user credentials are used. This tests CSS responsiveness, NOT signed-in UX.
import {chromium} from "playwright";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const css=await readFile("components/interview-arena.css","utf8");
const academy=await readFile("components/AcademyProtected.jsx","utf8");
assert.match(academy,/tab==="mental"&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-9"/,"Interview must not receive extra dashboard metrics");
assert.match(css,/AHQ pencil-paper interview reader/,"Paper-style design overrides missing");
const out="ahq-interview-style";
await mkdir(out,{recursive:true});
const html=`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0a1020;margin:0;padding:20px;box-sizing:border-box">
<section class="ia-root" aria-label="Quant interview arena">
 <div class="ia-hero"><div class="ia-grid-decoration"></div><div class="ia-hero-copy"><p class="ia-eyebrow">ALPHAHEDGEQUANT / INTERVIEW INTELLIGENCE</p><h2>Think in <em>probabilities.</em><br>Answer with <em>precision.</em></h2><p>Practice mathematical research and trading in a readable field notebook.</p><div class="ia-hero-meta"><span><b>1,224</b> total questions</span><span><b>4</b> career tracks</span></div></div><div class="ia-orbit">∑</div></div>
 <div class="ia-stats"><div><small>QUESTIONS MASTERED</small><strong>0 <span>/ 1,224</span></strong></div><div><small>IN THIS TRACK</small><strong>0 <span>/ 306</span></strong></div></div>
 <div class="ia-role-grid"><button class="ia-role active"><span class="ia-role-symbol">∑</span><strong>Researcher</strong><small>Inference and model validation</small><span class="ia-role-count">306 QUESTIONS</span></button><button class="ia-role"><span class="ia-role-symbol">Δ</span><strong>Trader</strong><small>Trading and market making</small></button><button class="ia-role"><span class="ia-role-symbol">⌘</span><strong>Developer</strong><small>Algorithms and systems</small></button><button class="ia-role"><span class="ia-role-symbol">σ</span><strong>Market Risk</strong><small>Exposure and stress tests</small></button></div>
 <div class="ia-lab"><div class="ia-lab-top"><div><p class="ia-eyebrow">PRACTICE LAB</p><h3>Train how you think.</h3></div><div class="ia-mode-switch"><button class="selected">Practice</button><button>5-min mock · 10 Q</button></div></div>
 <div class="ia-controls"><div class="ia-levels"><button class="selected">All</button><button>Beginner</button><button>Intermediate</button><button>Advanced</button></div><label class="ia-field-label">FOCUS AREA<select><option>All topics</option></select></label><label class="ia-field-label ia-search">SEARCH QUESTION BANK<input placeholder="Greeks, volatility, SQL, VaR…"></label></div>
 <div class="ia-question-layout"><article class="ia-question"><div class="ia-question-top"><span class="ia-q-number">001 / 306</span><div class="ia-q-tags"><span>Researcher</span></div><button class="ia-bookmark">☆</button></div><p class="ia-concept">COMPOUNDED RETURNS / NUMERICAL REASONING</p><h4>A portfolio gains 4% and then loses 2%. What is its total compounded return in percent?</h4><div class="ia-choices"><button class="ia-choice"><span>A</span><b>2.00%</b></button><button class="ia-choice chosen"><span>B</span><b>1.92%</b></button><button class="ia-choice"><span>C</span><b>1.88%</b></button><button class="ia-choice"><span>D</span><b>1.96%</b></button></div><div class="ia-feedback"><p class="ia-feedback-label">WORKED EXAMPLE</p><ol><li>Multiply gross returns rather than adding percentages.</li><li>1.04 × 0.98 − 1 = 0.0192</li></ol><p><b>Calculated answer</b> — 1.92%. This is an educational example.</p></div><div class="ia-actions"><button class="ia-main-button">Check answer</button><button class="ia-minor-button">Next question →</button></div></article>
 <aside class="ia-aside"><span class="ia-eyebrow">REASONING ENGINE / 01</span><div class="ia-aside-visual"></div><p class="ia-aside-topic">Compounded returns</p><h5>Start from first principles</h5><p>Explain each assumption, then derive the result.</p></aside></div><div class="ia-foot"><span>EDUCATIONAL EXERCISES</span><span>306 questions</span></div></div>
</section></body></html>`;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  await page.setContent(html);
  await page.addStyleTag({content:css});
  const v=await page.evaluate(()=>{
   const root=document.querySelector(".ia-root"),q=document.querySelector(".ia-question-layout");
   const style=el=>getComputedStyle(document.querySelector(el));
   const c=style(".ia-root");
   return {pageOverflow:document.documentElement.scrollWidth-innerWidth,rootBackground:c.backgroundColor,rootText:c.color,headingColor:style(".ia-hero h2").color,orbit:style(".ia-orbit").display,asideBackground:style(".ia-aside").backgroundColor,questionLayout:style(".ia-question-layout").display,roleGridColumns:style(".ia-role-grid").gridTemplateColumns,buttonCount:root.querySelectorAll("button").length,questionFont:style(".ia-question h4").fontFamily};
  });
  assert.equal(v.rootBackground,"rgb(251, 248, 239)","Pencil paper background");
  assert.equal(v.questionLayout,"block","Question must flow full width");
  assert.equal(v.orbit,"none","Old orbit hero should not render");
  assert.equal(v.asideBackground,"rgba(0, 0, 0, 0)","No dark sidebar");
  assert.ok(v.pageOverflow<=2,"Horizontal overflow: "+v.pageOverflow+"px at "+width+"px viewport");
  assert.ok(v.buttonCount>=10,"Question controls missing from fixture");
  if(width===390) assert.equal(v.roleGridColumns.split(" ").length,2,"Mobile role tabs should be two columns");
  const name=width===390?"mobile":width===768?"tablet":"desktop";
  await page.screenshot({path:`${out}/interview-paper-${name}.png`,fullPage:true,animations:"disabled"});
  report.push({width,result:"pass",...v});
  console.log("AHQ_INTERVIEW_STYLE",JSON.stringify({width,result:"pass",...v}));
  await page.close();
 }
}finally{await browser.close()}
await writeFile(`${out}/report.json`,JSON.stringify({kind:"synthetic CSS fixture, not authenticated production",report},null,2));
