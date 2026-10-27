"use client";
import {useState} from "react";
import {beginnerDeepDives} from "@/lib/beginnerDeepDives";
export default function BeginnerChapter({model}){
 const chapter=beginnerDeepDives[model.id];
 const [answer,setAnswer]=useState(null);
 if(!chapter)return null;
 return <article className="rounded-xl border border-amber/30 p-5 md:p-7 mt-5" aria-label={model.name+" full beginner chapter"}>
  <div className="flex gap-2 flex-wrap items-center justify-between mb-3"><span className="font-mono text-xs text-amber">BEGINNER CHAPTER · NO FINANCE BACKGROUND REQUIRED</span><span className="text-xs text-muted">{chapter.time} estimated reading</span></div>
  <h4 className="font-display text-2xl text-body leading-snug">{chapter.title}</h4>
  <div className="bg-raised border border-line rounded-xl p-4 my-5"><p className="text-xs text-amber font-mono mb-2">START WITH AN EVERYDAY IDEA</p><p className="text-base text-body leading-relaxed">{chapter.hook}</p></div>
  <h5 className="text-xl font-display text-body mb-3">Part 1 — Understanding every building block</h5>
  <ol className="space-y-4">{chapter.foundations.map(([heading,body],i)=><li key={heading} className="flex gap-3"><span className="w-7 h-7 shrink-0 flex items-center justify-center border border-amber/40 rounded-full text-amber text-xs">{i+1}</span><div><h6 className="text-base font-semibold text-body">{heading}</h6><p className="text-sm md:text-base text-muted mt-1 leading-relaxed">{body}</p></div></li>)}</ol>
  <h5 className="text-xl font-display text-body mt-8 mb-3">Part 2 — A complete example with numbers</h5>
  <div className="space-y-3">{chapter.walkthrough.map((s,i)=><div key={s.title} className="p-4 rounded-lg border border-line bg-raised"><p className="text-sm font-semibold text-body">Step {i+1}: {s.title}</p><p className="text-sm md:text-base text-muted leading-relaxed mt-2">{s.body}</p></div>)}</div>
  <h5 className="text-xl font-display text-body mt-8 mb-3">Part 3 — A dictionary of unfamiliar words</h5>
  <dl className="grid sm:grid-cols-2 gap-3">{chapter.glossary.map(([a,b])=><div key={a} className="border border-line rounded-lg p-3"><dt className="text-sm font-semibold text-body">{a}</dt><dd className="text-sm text-muted leading-relaxed mt-1">{b}</dd></div>)}</dl>
  <h5 className="text-xl font-display text-body mt-8 mb-3">Part 4 — What could go wrong?</h5>
  <ul className="space-y-2">{chapter.pitfalls.map(p=><li key={p} className="text-sm md:text-base text-muted flex gap-2 leading-relaxed"><span aria-hidden="true" className="text-amber">•</span>{p}</li>)}</ul>
  <div className="p-4 border border-line rounded-xl mt-6"><h5 className="font-semibold text-body">Check that you understood the example</h5><p className="text-sm text-muted mt-2">{chapter.quiz.question}</p><div className="grid gap-2 mt-3">{chapter.quiz.options.map((choice,i)=><button type="button" key={choice} aria-pressed={answer===i} onClick={()=>setAnswer(i)} className={`text-left border rounded-lg p-3 text-sm ${answer===i?"border-amber text-body bg-raised":"border-line text-muted hover:border-amber/40"}`}>{String.fromCharCode(65+i)}. {choice}</button>)}</div>{answer!==null&&<p role="status" className="text-sm mt-3 leading-relaxed text-body">{answer===chapter.quiz.answer?"Correct. ":"Not yet. "}{chapter.quiz.reason}</p>}</div>
  <p className="border-t border-line pt-4 mt-5 text-sm text-muted leading-relaxed"><strong className="text-body">Main lesson:</strong> {chapter.takeaway}</p>
  <p className="text-xs text-muted mt-3">Educational example; all values are hypothetical and are not trading signals.</p>
 </article>;
}
