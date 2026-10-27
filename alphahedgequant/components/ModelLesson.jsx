"use client";
import { useState } from "react";
import {modelLessons} from "@/lib/modelLessons";
import {deeperLessons} from "@/lib/deeperModelLessons";
import {allModelFoundations} from "@/lib/allModelFoundations";

export default function ModelLesson({model}){
 const lesson=modelLessons[model.id];
 const deeper=deeperLessons[model.id];
 const [answer,setAnswer]=useState(null);
 const foundation=allModelFoundations[model.id];
 if(!lesson)return <section className="border border-amber/30 rounded-xl p-5 md:p-6 mt-4">
  <p className="font-mono text-xs text-amber mb-2">FOUNDATIONS · START FROM ZERO</p>
  <h4 className="font-display text-xl text-body">Understanding {model.name}</h4>
  <p className="text-sm text-muted leading-relaxed mt-3"><strong className="text-body">First question:</strong> What problem are we trying to solve? {model.summary}</p>
  <div className="bg-raised border border-line rounded-lg p-4 mt-4">
   <p className="font-semibold text-body text-sm mb-2">An everyday analogy</p>
   <p className="text-sm md:text-base leading-relaxed text-muted">{foundation?.analogy || model.intuition}</p>
  </div>
  <div className="mt-5 space-y-3">
   <h5 className="font-semibold text-body">A complete numerical thought experiment</h5>
   <p className="text-sm md:text-base leading-relaxed text-muted">{foundation?.example || model.intuition}</p>
   <h5 className="font-semibold text-body">How to think about the calculation</h5>
   <p className="text-sm md:text-base leading-relaxed text-muted">{foundation?.steps || model.params?.join(". ")}</p>
  </div>
  <div className="rounded-lg border border-line p-4 mt-4">
   <p className="text-sm font-semibold text-body">How do you interpret this result?</p>
   <p className="text-sm leading-relaxed text-muted mt-2">{model.when}</p>
   <p className="text-sm leading-relaxed text-muted mt-3"><strong className="text-body">Important limitation:</strong> {foundation?.limitation || model.when}</p>
  </div>
  <p className="text-xs text-muted mt-3">This is an original illustrative example, not a fitted model, historical performance result or live signal. Formulas and more technical material follow below.</p>
 </section>;
 return <section className="border border-amber/30 rounded-xl p-4 md:p-5 mt-4" aria-label={model.name+" guided lesson"}>
  <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
   <p className="font-mono text-[11px] text-amber tracking-wider">GUIDED LESSON · ORIGINAL AHQ CONTENT</p>
   <span className="text-xs border border-line rounded px-2 py-1 text-muted">{lesson.level}</span>
  </div>
  <h4 className="font-display text-xl text-body mb-2">Learn {model.name}, step by step</h4>
  <p className="text-sm leading-relaxed text-muted"><strong className="text-body">You will learn:</strong> {lesson.objective}</p>
  <p className="text-sm leading-relaxed text-muted mt-2"><strong className="text-body">Before starting:</strong> {lesson.prerequisites}</p>
  <h5 className="font-semibold text-body mt-5 mb-2">Important words explained</h5>
  <dl className="grid gap-2 sm:grid-cols-2">{lesson.glossary.map(([term,description])=><div key={term} className="rounded-lg bg-raised border border-line p-3"><dt className="font-semibold text-sm text-body">{term}</dt><dd className="text-xs text-muted mt-1 leading-relaxed">{description}</dd></div>)}</dl>
  {deeper && <div className="mt-5 border-l-2 border-amber/50 pl-4">
   <h5 className="text-base font-semibold text-body mb-2">Build the intuition</h5>
   <p className="text-sm text-muted leading-relaxed">{deeper.intuition}</p>
  </div>}
  <h5 className="font-semibold text-body mt-5 mb-3">Worked lesson</h5>
  <ol className="space-y-3">{lesson.steps.map((step,i)=><li className="flex gap-3" key={i}>
   <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center border border-amber/40 text-amber rounded-full text-xs font-mono">{i+1}</span>
   <div><p className="text-sm font-semibold text-body">{step.title}</p><p className="text-sm text-muted leading-relaxed mt-1">{step.body}</p></div>
  </li>)}</ol>
  {deeper && <div className="rounded-xl border border-line p-4 mt-5">
    <h5 className="font-semibold text-body mb-3">Why each step works</h5>
    <div className="space-y-4">{deeper.reasoning.map(([heading,body],i)=><div key={heading}>
      <p className="font-semibold text-sm text-body">{i+1}. {heading}</p>
      <p className="text-sm text-muted leading-relaxed mt-1">{body}</p>
    </div>)}</div>
    <p className="text-sm leading-relaxed mt-4 border-t border-line pt-3"><strong className="text-body">Remember:</strong> <span className="text-muted">{deeper.takeaway}</span></p>
  </div>}
  <div className="rounded-lg bg-raised border border-line p-4 mt-4">
    <p className="text-xs font-semibold text-body mb-2">Solved numerical example</p>
    <p className="text-sm text-muted leading-relaxed">{lesson.worked}</p>
  </div>
  <div className="rounded-lg border border-line p-4 mt-3"><p className="font-semibold text-sm text-body">Common mistake to avoid</p><p className="text-sm text-muted mt-1 leading-relaxed">{lesson.misconception}</p></div>
  <div className="mt-5 border-t border-line pt-4">
   <h5 className="text-sm font-semibold text-body">Check your understanding</h5>
   <p className="text-sm text-muted mt-2">{lesson.check.question}</p>
   <div className="grid gap-2 mt-3">{lesson.check.choices.map((choice,i)=><button type="button" key={choice} onClick={()=>setAnswer(i)} aria-pressed={answer===i}
    className={`text-left text-sm px-3 py-2 border rounded-lg ${answer===i?"border-amber text-body bg-amber/5":"border-line text-muted hover:border-amber/40"}`}>{String.fromCharCode(65+i)}. {choice}</button>)}</div>
   {answer!==null&&<p role="status" className="text-sm mt-3 leading-relaxed">{answer===lesson.check.correct?"Correct. ":"Not quite. "}{lesson.check.why}</p>}
   {answer!==null&&<button type="button" onClick={()=>setAnswer(null)} className="mt-2 text-xs text-amber hover:underline">Try again</button>}
  </div>
 </section>;
}
