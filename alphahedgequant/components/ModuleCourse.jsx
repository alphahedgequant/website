"use client";
import {useEffect,useMemo,useState} from "react";
import {MODULE_GUIDES,MODULE_TOPICS,topicProgress} from "@/lib/quantModuleGuides.mjs";

const REFLECTIONS=[
 "In your own words, why do models need assumptions? Explain what a simulated price cannot tell you about tomorrow.",
 "Explain why two portfolios with the same average return can expose investors to very different risks.",
 "Explain how the contract, the price and the cash flow differ for the instrument you just studied.",
 "How could future information leak into a prediction you claim you could have made yesterday?",
 "When might an advanced machine-learning model fail even if its backtest looks excellent?",
 "Explain why a bond's market price and its promised future coupon payments are different quantities."
];
function InstructionFlow({topic}){
 return <div className="qmodule-concept-flow" role="img" aria-label="Study sequence: understand the problem; work through the example; inspect what could go wrong">
   <div><small>01 · IDEA</small><strong>{topic.title}</strong><span>Define what the model is trying to describe</span></div>
   <span aria-hidden="true">→</span>
   <div><small>02 · REALITY</small><strong>Apply the example</strong><span>Turn the words into a concrete situation</span></div>
   <span aria-hidden="true">→</span>
   <div><small>03 · LIMIT</small><strong>Challenge it</strong><span>Understand what the result cannot promise</span></div>
 </div>;
}
export default function ModuleCourse({moduleIndex,progress,save}){
 const topics=useMemo(()=>MODULE_TOPICS.filter(t=>t.module===moduleIndex),[moduleIndex]);
 const guide=MODULE_GUIDES[moduleIndex];
 const [selected,setSelected]=useState(topics[0]?.id);
 const [reflection,setReflection]=useState("");
 const [assignmentNotes,setAssignmentNotes]=useState("");
 const [code,setCode]=useState(guide.code);
 const [feedback,setFeedback]=useState("");
 const [labFeedback,setLabFeedback]=useState("");
 const [filter,setFilter]=useState("");
 const [showSolution,setShowSolution]=useState(false);
 useEffect(()=>{setSelected(MODULE_TOPICS.find(t=>t.module===moduleIndex)?.id);setReflection("");setCode(MODULE_GUIDES[moduleIndex].code);setFeedback("");setLabFeedback("");setAssignmentNotes("");setShowSolution(false);setFilter("");},[moduleIndex]);
 const active=topics.find(t=>t.id===selected)||topics[0];
 const count=topicProgress(progress,moduleIndex);
 const completedLab=Boolean(progress["quant-lab-"+(moduleIndex+1)]?.completed);
 async function completeTopic(){
  if(reflection.trim().length<25){setFeedback("Write at least 25 characters explaining the idea in your own words before recording your study.");return;}
  await save(active.id,100,true);
  setFeedback("Topic study recorded in your account. Revisit the explanation whenever needed.");
 }
 async function completeLab(){
  if(code.trim().length<80||assignmentNotes.trim().length<35){setLabFeedback("Add your Python work and write at least 35 characters explaining what you ran and learned.");return;}
  await save("quant-lab-"+(moduleIndex+1),100,true);
  setLabFeedback("Practice logged. This site does not execute or automatically verify your Python output.");
 }
 const choose=(id)=>{setSelected(id);setReflection("");setFeedback("");setShowSolution(false);setTimeout(()=>document.getElementById("qmodule-topic-heading")?.scrollIntoView({block:"start",behavior:"smooth"}),50);};
 return <section className="qmodule-course" aria-label={"Deep-dive topics for module "+(moduleIndex+1)}>
  <div className="qmodule-intro">
   <p className="qmodule-kicker">MODULE {String(moduleIndex+1).padStart(2,"0")} / EXTENDED SYLLABUS</p>
   <h3>{guide.title}</h3><p>{guide.intro}</p><p>{guide.bridge}</p>
   <div className="qmodule-progress"><span>{count.done} of {count.total} topic studies recorded</span><div><span style={{width:(count.done/count.total*100)+"%"}}/></div></div>
  </div>
  <div className="qmodule-grid">
   <nav className="qmodule-topic-list" aria-label="Select module topic">
    <div className="qmodule-topic-top"><strong>COURSE CHAPTERS</strong><span>{topics.length} topics</span></div>
    <label className="sr-only" htmlFor="qmodule-filter">Filter syllabus topics</label>
    <input id="qmodule-filter" type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find a chapter…" />
    <div className="qmodule-topic-scroller">
    {topics.filter(t=>t.title.toLowerCase().includes(filter.toLowerCase())).map((t)=>(
      <button key={t.id} type="button" className={active.id===t.id?"is-current":""} onClick={()=>choose(t.id)} aria-current={active.id===t.id?"page":undefined}>
       <small>{String(t.index).padStart(2,"0")}</small><span>{t.title}</span><strong aria-label={progress[t.id]?.completed?"Study recorded":"Not yet studied"}>{progress[t.id]?.completed?"✓":"·"}</strong>
      </button>
    ))}
    </div>
   </nav>
   <div className="qmodule-reading" key={active.id}>
    <p className="qmodule-kicker">CHAPTER {String(active.index).padStart(2,"0")} / EXPLAINED FROM FIRST PRINCIPLES</p>
    <h4 id="qmodule-topic-heading">{active.title}</h4>
    <h5>Begin with the meaning</h5><p>{active.concept}</p>
    <p>Rather than memorizing a technical name, first identify the input, the outcome, and why a researcher needs the relationship. A useful model should clarify a decision; a complicated equation is not evidence that it will predict markets correctly.</p>
    <InstructionFlow topic={active}/>
    <h5>Imagine this happening in the real world</h5><p>{active.example}</p>
    <div className="qmodule-check-note"><strong>What could go wrong?</strong><p>{active.caution}</p></div>
    <h5>Think it through yourself</h5><p>{REFLECTIONS[moduleIndex]}</p>
    <textarea value={reflection} onChange={e=>setReflection(e.target.value)} aria-label="Explain the topic in your own words" placeholder="Explain the concept using ordinary words, and mention one limitation…" rows={3}/>
    <div className="qmodule-reading-actions"><button type="button" onClick={completeTopic} disabled={Boolean(progress[active.id]?.completed)}>{progress[active.id]?.completed?"Study recorded ✓":"Record topic as studied"}</button><button type="button" onClick={()=>setShowSolution(x=>!x)}>{showSolution?"Hide study checklist":"Show study checklist"}</button></div>
    {showSolution&&<div className="qmodule-check-note"><strong>Before moving on</strong><p>Can you define the term without jargon? Recreate the example using the quantities given? Explain the source of uncertainty, what the model assumes, and why a result might fail in actual markets? If not, return to the previous foundation lesson.</p></div>}
    {feedback&&<p role="status" className="qmodule-status">{feedback}</p>}
   </div>
  </div>
  <section className="qmodule-lab" aria-labelledby="qmodule-lab-heading">
   <header><div><p className="qmodule-kicker">PRACTICAL ASSIGNMENT / PYTHON</p><h4 id="qmodule-lab-heading">Build it yourself: {guide.assignment}</h4></div><span>{completedLab?"PRACTICED ✓":"ASSIGNMENT OPEN"}</span></header>
   <p>Start by reading each line in the starter code. Run it in your own Python environment, change the inputs, inspect output, and explain the economic assumptions. No external market-data connection or paid service is required.</p>
   <label htmlFor="qmodule-code" className="qmodule-code-label">EDITABLE PYTHON STARTER · CHANGE VALUES AND TRY IT</label>
   <textarea id="qmodule-code" spellCheck={false} className="qmodule-code" value={code} onChange={e=>setCode(e.target.value)} rows={Math.max(11,code.split("\n").length+2)} />
   <div className="qmodule-lab-actions"><button type="button" onClick={()=>{if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(code).then(()=>setLabFeedback("Code copied."),()=>setLabFeedback("Clipboard unavailable. Select and copy the code manually."));}}}>Copy Python</button><button type="button" onClick={()=>{setCode(guide.code);setLabFeedback("Starter restored.")}}>Restore starter</button></div>
   <h5>Assignment tasks</h5><ol>{guide.tasks.map((task,i)=><li key={i}>{task}</li>)}</ol>
   <label className="qmodule-code-label" htmlFor="qmodule-lab-reflection">WHAT DID YOU RUN, OBSERVE AND LEARN?</label>
   <textarea id="qmodule-lab-reflection" value={assignmentNotes} onChange={e=>setAssignmentNotes(e.target.value)} rows={3} placeholder="Record your output, the parameter you changed, and a limitation of the result…"/>
   <button className="qmodule-submit" onClick={completeLab} type="button" disabled={completedLab}>{completedLab?"Assignment practiced ✓":"Record coding practice"}</button>
   {labFeedback&&<p role="status" className="qmodule-status">{labFeedback}</p>}
   <p className="qmodule-disclaimer">Coding is not executed by AlphaHedgeQuant. Completing this activity records self-reported practice, not a verified programming grade. Synthetic inputs are for education, not live trading.</p>
  </section>
 </section>;
}
