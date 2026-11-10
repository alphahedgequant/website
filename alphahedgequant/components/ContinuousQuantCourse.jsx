"use client";
import {useMemo,useState,useEffect} from "react";
import {MODULE_GUIDES,MODULE_TOPICS} from "@/lib/quantModuleGuides.mjs";
import {TOPIC_DEEP_DIVES} from "@/lib/quantDeepDives.mjs";
import {CHAPTER_CONNECTIONS,MODULE_LEARNING_BRIDGES} from "@/lib/quantLearningConnections.mjs";
import {QUANT_SECTIONS,QUANT_LESSONS,isCorrect} from "@/lib/quantCourse.mjs";
import {QUANT_TEACHING} from "@/lib/quantTeaching.mjs";
import {EXTENDED_SECTIONS,EXTENDED_MODULE_GUIDES,EXTENDED_MODULE_TOPICS,EXTENDED_LESSONS,EXTENDED_BRIDGES} from "@/lib/quantExtendedModules.mjs";
import {MORE_TOPICS_1} from "@/lib/quantMoreTopics1.mjs";
import {MORE_TOPICS_2} from "@/lib/quantMoreTopics2.mjs";
import {MORE_TOPICS_3} from "@/lib/quantMoreTopics3.mjs";
import {MORE_TOPICS_4} from "@/lib/quantMoreTopics4.mjs";
import "./continuous-course.css";

const lpad=n=>String(n).padStart(2,"0");
const ALL_SECTIONS=[...QUANT_SECTIONS,...EXTENDED_SECTIONS];
const ALL_GUIDES=[...MODULE_GUIDES,...EXTENDED_MODULE_GUIDES];
const ALL_TOPICS=[...MODULE_TOPICS,...EXTENDED_MODULE_TOPICS,...MORE_TOPICS_1,...MORE_TOPICS_2,...MORE_TOPICS_3,...MORE_TOPICS_4];
const ALL_LESSONS=[...QUANT_LESSONS,...EXTENDED_LESSONS.map(lesson=>({...lesson,example:"Work it out before checking the answer. Use the requested unit."}))];
const ALL_BRIDGES=[...MODULE_LEARNING_BRIDGES,...EXTENDED_BRIDGES];
function MiniFigure({section,topic}){
 const i=topic.index;
 if(section===2&&(i===3||i===2))return <figure className="ac-figure">
  <figcaption>Option call expiry example · strike ₹100 · premium ₹6 · per unit · illustrative</figcaption>
  <svg viewBox="0 0 640 205" role="img" aria-label="Call buyer profit stays at negative six below strike one hundred, crosses zero at price one hundred six, and increases at higher settlement prices" width="100%">
   <line x1="48" y1="150" x2="607" y2="150" stroke="#9c9c9c" strokeWidth="1"/><line x1="48" y1="18" x2="48" y2="174" stroke="#9c9c9c"/>
   <path d="M60 169 L345 169 L565 35" stroke="#181818" fill="none" strokeWidth="3"/><line x1="345" x2="345" y1="30" y2="172" stroke="#999" strokeDasharray="5 5"/>
   <text x="64" y="191" fill="#484848" fontSize="13">Buyer pays ₹6 upfront</text><text x="310" y="195" fill="#484848" fontSize="13">Strike ₹100</text><text x="420" y="129" fill="#484848" fontSize="13">Break-even ₹106</text>
  </svg>
  <p>The buyer has an option to purchase at ₹100. The value at expiry is not the same as profit: deduct the ₹6 premium and any charges.</p>
 </figure>;
 if(section===2&&i===12)return <figure className="ac-figure">
  <figcaption>Call option market snapshot · fabricated teaching quotes · not live or executable</figcaption>
  <div className="ac-xscroll"><table><thead><tr><th>Bid</th><th>Ask</th><th>LTP</th><th>Strike</th><th>Put LTP</th><th>Put bid</th><th>Put ask</th></tr></thead><tbody>
  {[[9.4,9.8,7.1,95,0.2,1,1.35],[6.4,6.8,4,100,2.3,2.7,3.05],[3.9,4.2,2.1,105,5.6,6.1,6.45]].map((r,j)=><tr key={j}>{r.map((v,k)=><td key={k} className={k===3?"ac-strike":""}>{Number(v).toFixed(k===3?0:2)}</td>)}</tr>)}
  </tbody></table></div><p>Bid, ask and last-traded price describe different things. The ask is the displayed offer to sell; a market buy may fill worse if depth disappears.</p></figure>;
 if(section===5&&(i===1||i===2))return <figure className="ac-figure">
  <figcaption>Bond price versus yield · ₹110 paid after one year · no default assumed</figcaption>
  <div className="ac-bars">{[[5,104.76],[10,100],[15,95.65]].map(([yieldPct,p])=><div key={yieldPct}><div className="ac-bars-value">₹{p}</div><span style={{height:(p/110*120)+"px"}}/><small>{yieldPct}% yield</small></div>)}</div><p>All bars represent the same promised payment. Higher required yield means lower price today.</p></figure>;
 if(section===1&&(i===1||i===4))return <figure className="ac-figure"><figcaption>Why winning frequently is not enough · hypothetical monetary P&amp;L</figcaption>
 <div className="ac-bars">{[10,10,10,10,10,-90].map((v,j)=><div key={j}><div className="ac-bars-value">{v>0?"+":""}{v}</div><span className={v<0?"ac-loss":""} style={{height:Math.abs(v)*1.25+"px"}}/><small>Trade {j+1}</small></div>)}</div><p>Small winners can be canceled by one large loser. Compare actual rupee P&amp;L and tail loss, not only the win rate.</p></figure>;
 if((section===3||section===4)&&(i===4||i===7))return <figure className="ac-figure"><figcaption>Time-respecting model development</figcaption><div className="ac-time"><span>Past observations<br/><b>TRAIN</b></span><span>Later observations<br/><b>VALIDATE</b></span><span>Unseen future<br/><b>TEST</b></span></div><p>Every input must be known before the simulated prediction. Do not repeatedly tune against your final test period.</p></figure>;
 return null;
}
function Chapter({topic,section,progress,save}){
 const [note,setNote]=useState("");
 const [message,setMessage]=useState("");
 const deep=TOPIC_DEEP_DIVES[topic.id];
 const done=Boolean(progress[topic.id]?.completed);
 const submit=async()=>{if(note.trim().length<25){setMessage("Explain the idea in at least one sentence before marking this chapter studied.");return}const saved=await save(topic.id,100,true);setMessage(saved?"Study recorded. Revisit this chapter whenever you need to.":"Could not save progress. Retry after checking your account connection.");};
 return <section className="ac-chapter" id={"ac-"+topic.id} aria-labelledby={"ac-title-"+topic.id}>
  <div className="ac-chapter-meta"><span>CHAPTER {lpad(topic.index)}</span><span>{done?"STUDIED ✓":"READ · UNDERSTAND · APPLY"}</span></div>
  <h3 id={"ac-title-"+topic.id}>{topic.title}</h3>
  <p className="ac-lead">{deep?.intuition||topic.concept}</p>
  {deep&&<p>{topic.concept}</p>}
  <p className="ac-explanation-bridge">{CHAPTER_CONNECTIONS[topic.id]||topic.connection}</p>
  <h4>Make it concrete</h4><p>{deep?.worked||topic.example}</p>
  {deep&&<p>{topic.example}</p>}
  <MiniFigure section={section} topic={topic}/>
  {!deep&&topic.formula&&<div className="ac-equation"><small>IN ONE LINE</small><p>{topic.formula}</p></div>}
  {deep&&<div className="ac-equation"><small>THE RELATIONSHIP</small><p>{deep.formula}</p></div>}
  <p><strong>What to remember:</strong> {topic.caution} {deep?.pitfall||""}</p>
  <div className="ac-review"><label htmlFor={"ac-ref-"+topic.id}>Check your understanding: explain this idea in your own words, including one limitation.</label>
   <textarea id={"ac-ref-"+topic.id} rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Write one or two sentences in everyday language…" disabled={done}/>
   <div className="ac-review-bottom"><button type="button" disabled={done} onClick={submit}>{done?"Study recorded ✓":"Mark chapter studied"}</button>{message&&<small role="status">{message}</small>}</div>
  </div>
 </section>
}
function Foundation({lesson,progress,save}){
 const [value,setValue]=useState("");
 const [result,setResult]=useState(null);
 const t=QUANT_TEACHING[lesson.id]||lesson;const done=Boolean(progress[lesson.id]?.completed);
 async function check(e){e.preventDefault();if(!value.trim())return;const ok=isCorrect(lesson,value);setResult(ok);if(ok){const saved=await save(lesson.id,100,true);if(!saved)setResult("save-failed")}}
 return <section className="ac-foundation" id={"ac-found-"+lesson.id}>
  <div className="ac-found-title"><h4>{lesson.title}</h4><span>{done?"COMPLETED ✓":"PRACTICE"}</span></div>
  <p>{lesson.explain} {lesson.example}</p>
  <div className="ac-equation"><small>IN ONE LINE</small><p>{t?.formula}</p></div>
  <form onSubmit={check} className="ac-question"><label htmlFor={"ac-answer-"+lesson.id}>{lesson.question}</label><div><input id={"ac-answer-"+lesson.id} type="number" step="any" value={value} onChange={e=>{setValue(e.target.value);setResult(null)}} placeholder="Your answer" disabled={done}/><button type="submit" disabled={done}>{done?"Completed ✓":"Check answer"}</button></div>
  {result!==null&&<p role="status" className="ac-answer-feedback">{result==="save-failed"?"Correct calculation, but progress could not be saved. Retry. ":result?"Correct. ":"Review and try again. "}{t?.solution}</p>}
  </form>
 </section>
}
function Coding({section,progress,save}){
 const guide=ALL_GUIDES[section];const id="quant-lab-"+(section+1);const done=Boolean(progress[id]?.completed);
 const [code,setCode]=useState(guide.code);const [reflection,setReflection]=useState("");const [feedback,setFeedback]=useState("");
 useEffect(()=>{setCode(guide.code);setReflection("");setFeedback("");},[guide]);
 const record=async()=>{if(reflection.trim().length<40){setFeedback("Write what you ran, changed and learned (at least 40 characters).");return}const saved=await save(id,100,true);setFeedback(saved?"Practice recorded. This is self-reported, not an automatically graded submission.":"Could not save practice to your account; please retry.")};
 return <section id="ac-coding" className="ac-coding">
  <p className="ac-overline">FINAL PRACTICE · MODULE {lpad(section+1)}</p><h3>Try the mathematics with Python</h3><p>{guide.assignment}. Run the code on your own computer or a Python notebook, then explain what happened. The website does not execute arbitrary code.</p>
  <label htmlFor="ac-code">Editable starter code</label><textarea id="ac-code" className="ac-code" spellCheck={false} rows={Math.max(12,guide.code.split("\n").length+2)} value={code} onChange={e=>setCode(e.target.value)}/>
  <div className="ac-code-actions"><button type="button" onClick={()=>{if(navigator.clipboard)navigator.clipboard.writeText(code).then(()=>setFeedback("Code copied."),()=>setFeedback("Clipboard unavailable; select and copy manually."))}}>Copy code</button><button type="button" onClick={()=>{setCode(guide.code);setFeedback("Original exercise restored.")}}>Reset</button></div>
  <h4>What to investigate</h4><ol>{guide.tasks.map((task,i)=><li key={i}>{task}</li>)}</ol>
  <label htmlFor="ac-lab-ref">Your observations</label><textarea id="ac-lab-ref" rows={3} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="What output did you observe? What did you change? Why does it matter?"/>
  <div className="ac-code-actions"><button disabled={done} type="button" onClick={record}>{done?"Practice recorded ✓":"Record coding practice"}</button>{feedback&&<span role="status">{feedback}</span>}</div>
  <p className="ac-small">This activity records your own practice. It does not execute or automatically verify Python, and no sample quotes are live market data.</p>
 </section>
}
export default function ContinuousQuantCourse({progress={},save,sync}){
 const [section,setSection]=useState(0);
 const topics=useMemo(()=>ALL_TOPICS.filter(t=>t.module===section),[section]);
 const foundations=useMemo(()=>ALL_LESSONS.filter(l=>l.section===section),[section]);
 const doneLessons=ALL_LESSONS.filter(l=>progress[l.id]?.completed).length;
 const doneTopics=ALL_TOPICS.filter(t=>progress[t.id]?.completed).length;
 const doneLabs=Array.from({length:ALL_SECTIONS.length},(_,i)=>progress["quant-lab-"+(i+1)]?.completed).filter(Boolean).length;
 const total=ALL_LESSONS.length+ALL_TOPICS.length+ALL_SECTIONS.length;
 const choose=i=>{setSection(i);setTimeout(()=>document.getElementById("ac-module-top")?.scrollIntoView({block:"start",behavior:"smooth"}),60)};
 return <section className="ac-course" id="learn-quant" aria-label="Quantitative finance course">
  <div className="ac-intro"><p>ALPHAHEDGEQUANT / LEARN QUANT</p><h2>Twelve modules, one clear learning path.</h2><span>Read the chapters in order, study worked examples, check your understanding, then try the Python exercise. Everything is written to be understandable with basic maths.</span></div>
  <div className="ac-layout">
   <aside className="ac-sidebar" aria-label="Module progress and navigation"><div className="ac-sidebar-title"><strong>YOUR PROGRESS</strong><span>{doneLessons+doneTopics+doneLabs} / {total}</span><div className="ac-progress"><span style={{width:(doneLessons+doneTopics+doneLabs)/total*100+"%"}}/></div></div>
    {ALL_SECTIONS.map((s,i)=>{const chItems=ALL_TOPICS.filter(t=>t.module===i),mathItems=ALL_LESSONS.filter(l=>l.section===i),lab=Boolean(progress["quant-lab-"+(i+1)]?.completed),d=chItems.filter(t=>progress[t.id]?.completed).length+mathItems.filter(l=>progress[l.id]?.completed).length+Number(lab),t=chItems.length+mathItems.length+1;return <button key={s.id} type="button" onClick={()=>choose(i)} aria-current={i===section?"page":undefined} className={"ac-sidebar-item "+(i===section?"selected":"")}><span>MODULE {lpad(i+1)} <small>{d}/{t}</small></span><strong>{s.title}</strong><span className="ac-progress"><span style={{width:d/t*100+"%"}}/></span></button>})}
    <p className="ac-sync" aria-live="polite">{sync}</p>
   </aside>
   <article className="ac-paper" id="ac-module-top">
    <div className="ac-paper-inner">
     <header className="ac-module-head"><p className="ac-overline">ALPHAHEDGEQUANT · MODULE {lpad(section+1)} OF {lpad(ALL_SECTIONS.length)}</p><h2>{ALL_GUIDES[section].title}</h2><p className="ac-lead">{ALL_GUIDES[section].intro}</p><p>{ALL_GUIDES[section].bridge}</p><p className="ac-module-bridge">{ALL_BRIDGES[section]}</p>
      <nav className="ac-toc" aria-label="In this module"><strong>On this page</strong><a href="#ac-chapter-start">Chapters 01–{lpad(topics.length)}</a><a href="#ac-foundations">Worked practice</a><a href="#ac-coding">Coding assignment</a></nav></header>
     <div id="ac-chapter-start" className="ac-chapters">
      {topics.map(topic=><Chapter key={topic.id} topic={topic} section={section} progress={progress} save={save}/>)}
     </div>
     <section className="ac-foundations" id="ac-foundations"><p className="ac-overline">WORKED PRACTICE / MODULE {lpad(section+1)}</p><h3>Make sure the basics are solid.</h3><p>These shorter exercises connect the chapter's ideas to calculations you can do on paper. Every check includes an individual worked solution.</p>
     {foundations.map(l=><Foundation key={l.id} lesson={l} progress={progress} save={save}/>)}
     </section>
     <Coding key={section} section={section} progress={progress} save={save}/>
     <footer className="ac-module-footer"><p>End of Module {lpad(section+1)} · {ALL_GUIDES[section].title}</p>{section<ALL_SECTIONS.length-1&&<button type="button" onClick={()=>choose(section+1)}>Continue to Module {lpad(section+2)} →</button>}</footer>
    </div>
   </article>
  </div>
 </section>
}
