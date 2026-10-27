"use client";
import {useState} from "react";
import {allModelFoundations} from "@/lib/allModelFoundations";

function extractTerms(model){
 const s=(model.math||[]).flatMap(m=>[m.label]).slice(0,2);
 return s.length?s:["Model assumptions","Risk considerations"];
}
export default function ModelMasterclass({model}){
 const f=allModelFoundations[model.id];
 const [answer,setAnswer]=useState(null);
 if(!f)return null;
 const terms=extractTerms(model);
 const question="Which statement correctly describes an important limitation of "+model.name+"?";
 const choices=[f.limitation,"A model output guarantees an investment result.","The example proves the strategy works on live market data."];
 const correct=f.limitation;
 return <article className="rounded-xl border border-amber/30 p-5 md:p-7 mt-5" aria-label={model.name+" complete foundations"}>
   <div className="flex flex-wrap gap-2 justify-between items-center"><p className="font-mono text-xs text-amber">MODEL COURSE · FROM FIRST PRINCIPLES</p><span className="text-xs text-muted">Read, solve, experiment</span></div>
   <h4 className="font-display text-2xl text-body mt-3">Understand {model.name} from the beginning</h4>
   <p className="text-base text-muted leading-relaxed mt-3">No prior knowledge of this model is assumed. Start with the everyday problem, follow an illustrative calculation, and learn how professional researchers check its assumptions.</p>
   <section className="mt-6"><h5 className="font-display text-xl text-body">1. The real-world problem</h5><p className="text-base leading-relaxed text-muted mt-2">{model.summary} In practical research, the challenge is to turn that question into a measurable rule without pretending uncertainty has disappeared.</p></section>
   <section className="mt-6 rounded-lg border border-line bg-raised p-4"><h5 className="font-display text-xl text-body">2. Imagine this instead</h5><p className="text-base leading-relaxed text-muted mt-2">{f.analogy}</p><p className="text-sm text-muted mt-3">An analogy makes the basic idea familiar, but it cannot establish whether market prices will behave in the same way.</p></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">3. What the model tries to measure</h5><p className="text-base leading-relaxed text-muted mt-2">{model.intuition}</p><p className="text-sm text-muted mt-3">An estimate is not the same thing as an observed fact, and a forecast is not the same thing as a guarantee.</p></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">4. Work through a numerical case</h5><div className="rounded-lg border border-line p-4 mt-3"><p className="font-semibold text-sm text-body">Hypothetical example</p><p className="text-base leading-relaxed text-muted mt-2">{f.example}</p></div><p className="text-base text-muted leading-relaxed mt-3">{f.steps}</p></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">5. The inputs you must choose</h5><ul className="space-y-3 mt-3">{(model.params||[]).map((p,i)=><li key={i} className="flex gap-3 text-sm md:text-base text-muted leading-relaxed"><span className="text-amber font-mono shrink-0">{i+1}.</span><span>{p}</span></li>)}</ul><p className="text-sm text-muted leading-relaxed mt-3">These are choices and assumptions, not universal optimal settings. Different inputs can produce different results.</p></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">6. Read the mathematics when ready</h5><p className="text-sm text-muted leading-relaxed mt-2">The equation formalises the idea in the worked example. Identify the quantities you observe, the parameters you estimate and the result you calculate.</p><div className="mt-3 flex gap-2 flex-wrap">{terms.map(t=><span key={t} className="text-xs border border-line rounded px-2 py-1 text-muted">{t}</span>)}</div></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">7. Interpreting the answer</h5><p className="text-base text-muted leading-relaxed mt-2">{model.when}</p><p className="text-sm text-muted leading-relaxed mt-3">Ask whether the model was fitted using only information known at the time, how realistic its transaction costs are, and whether the result survives a different historical period.</p></section>
   <section className="mt-6 rounded-lg border border-line p-4"><h5 className="font-display text-xl text-body">8. A mistake to avoid</h5><p className="text-base text-muted leading-relaxed mt-2">{f.limitation}</p><p className="text-sm text-muted leading-relaxed mt-2">Potential implementation limitations: {model.risks||model.when}</p></section>
   <section className="mt-6"><h5 className="font-display text-xl text-body">9. Test your understanding</h5><p className="text-sm text-muted mt-2">{question}</p><div className="grid gap-2 mt-3">{choices.map((c,i)=><button type="button" key={i} onClick={()=>setAnswer(i)} aria-pressed={answer===i} className={`text-left text-sm p-3 rounded-lg border ${answer===i?"border-amber text-body bg-raised":"border-line text-muted"}`}>{String.fromCharCode(65+i)}. {c}</button>)}</div>{answer!==null&&<p role="status" className="text-sm text-muted mt-3">{answer===0?"Correct. ":"Not quite. "}{correct}</p>}</section>
   <section className="mt-6 border-t border-line pt-4"><h5 className="font-display text-xl text-body">10. Apply it in a research notebook</h5><p className="text-base text-muted leading-relaxed mt-2">Reproduce the example with fresh hypothetical numbers. Record each input, unit and time horizon. Change one assumption at a time, describe how the answer changes, and explain why that does not imply a profitable trade.</p><p className="text-xs text-muted mt-3">Original educational content. Examples are hypothetical; not a trained model, live feed, or investment advice.</p></section>
 </article>;
}
