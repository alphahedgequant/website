"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {CASES,CAREERS} from "@/lib/academyInterviews";
import "./interview-arena.css";

const LEVELS=["All","Beginner","Intermediate","Advanced"];
const shuffled=(array)=>{const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const isNumeric=(q)=>q?.kind==="numeric"&&Array.isArray(q.options);
const validGrade=(n)=>n===0||n===50||n===100;
function formatClock(seconds){const s=Math.max(0,seconds);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
function Icon({name}){return <span aria-hidden="true" className="ia-icon">{name}</span>;}

export default function InterviewArena({progress={},save=async()=>false,sync=""}){
 const [role,setRole]=useState("Researcher");
 const [level,setLevel]=useState("All");
 const [topic,setTopic]=useState("All topics");
 const [query,setQuery]=useState("");
 const [scope,setScope]=useState("all");
 const [activeId,setActiveId]=useState(null);
 const [choice,setChoice]=useState(null);
 const [checked,setChecked]=useState(false);
 const [revealed,setRevealed]=useState(false);
 const [grade,setGrade]=useState(null);
 const [bookmarks,setBookmarks]=useState([]);
 const [reviewIds,setReviewIds]=useState([]);
 const [session,setSession]=useState("practice");
 const [mockQueue,setMockQueue]=useState([]);
 const [mockPos,setMockPos]=useState(0);
 const [mockAnswers,setMockAnswers]=useState([]);
 const [timeLeft,setTimeLeft]=useState(300);
 const [mockComplete,setMockComplete]=useState(false);
 const [showMockReview,setShowMockReview]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
   try{
     const b=JSON.parse(localStorage.getItem("ahq-interview-bookmarks-v1")||"[]");
     const r=JSON.parse(localStorage.getItem("ahq-interview-review-v1")||"[]");
     if(Array.isArray(b))setBookmarks(b.filter(v=>typeof v==="string"));
     if(Array.isArray(r))setReviewIds(r.filter(v=>typeof v==="string"));
   }catch{}
 },[]);
 const persist=useCallback((key,arr)=>{try{localStorage.setItem(key,JSON.stringify(arr));}catch{}},[]);
 const toggleBookmark=useCallback(id=>setBookmarks(previous=>{const next=previous.includes(id)?previous.filter(x=>x!==id):[...previous,id];persist("ahq-interview-bookmarks-v1",next);return next;}),[persist]);
 const setReview=useCallback((id,needsReview)=>setReviewIds(previous=>{const next=needsReview?Array.from(new Set([...previous,id])):previous.filter(x=>x!==id);persist("ahq-interview-review-v1",next);return next;}),[persist]);
 const topics=useMemo(()=>["All topics",...new Set(CASES.filter(x=>x.role===role).map(x=>x.topic||"Core reasoning"))].sort((a,b)=>a==="All topics"?-1:b==="All topics"?1:a.localeCompare(b)),[role]);
 const roleCases=useMemo(()=>CASES.filter(x=>x.role===role),[role]);
 const isMastered=useCallback(id=>!!progress["interview-"+id]?.completed,[progress]);
 const filtered=useMemo(()=>roleCases.filter(q=>{
  const text=(q.question+" "+(q.concept||"")+" "+(q.topic||"")+" "+q.level).toLowerCase();
  return (level==="All"||q.level===level)
   &&(topic==="All topics"||(q.topic||"Core reasoning")===topic)
   &&(!query.trim()||text.includes(query.trim().toLowerCase()))
   &&(scope!=="saved"||bookmarks.includes(q.id))
   &&(scope!=="review"||reviewIds.includes(q.id))
   &&(scope!=="mastered"||isMastered(q.id))
   &&(scope!=="new"||!isMastered(q.id));
 }),[roleCases,level,topic,query,scope,bookmarks,reviewIds,isMastered]);
 const practiceQuestion=filtered.find(q=>q.id===activeId)||filtered[0]||null;
 const mockQuestion=mockQueue[mockPos]||null;
 const question=session==="mock"?mockQuestion:practiceQuestion;
 const totalMastered=CASES.filter(q=>isMastered(q.id)).length;
 const roleMastered=roleCases.filter(q=>isMastered(q.id)).length;
 const numericCount=roleCases.filter(isNumeric).length;
 const currentIndex=practiceQuestion?filtered.findIndex(q=>q.id===practiceQuestion.id):0;
 const mockCorrect=mockAnswers.filter(a=>a.correct).length;
 const mockAttempted=mockAnswers.filter(a=>a.choice!==null).length;
 const resetResponse=()=>{setChoice(null);setChecked(false);setRevealed(false);setGrade(null);setNotice("");};
 const switchQuestion=(id)=>{setActiveId(id);resetResponse();};
 const switchRole=(r)=>{setRole(r);setLevel("All");setTopic("All topics");setScope("all");setQuery("");setActiveId(null);resetResponse();};
 const nextPractice=()=>{if(!filtered.length)return;switchQuestion(filtered[(currentIndex+1)%filtered.length].id);};
 const prevPractice=()=>{if(!filtered.length)return;switchQuestion(filtered[(currentIndex-1+filtered.length)%filtered.length].id);};
 const rememberGrade=async(q,value)=>{
   if(!validGrade(value))return;
   if(value===100)setReview(q.id,false);else setReview(q.id,true);
   const ok=await save("interview-"+q.id,value,value===100);
   if(!ok)setNotice("Your answer was graded, but account sync failed. You can retry after signing in.");
 };
 const checkPractice=()=>{
   if(!isNumeric(question)||choice===null||checked)return;
   setChecked(true);setRevealed(true);
   const correct=choice===question.correctIndex;
   rememberGrade(question,correct?100:0);
 };
 const assessTheory=(rating)=>{
   if(!question||isNumeric(question)||!revealed||grade!==null)return;
   setGrade(rating);rememberGrade(question,rating);
 };
 const startMock=()=>{
   const pool=shuffled(roleCases.filter(q=>isNumeric(q)&&(level==="All"||q.level===level)));
   if(pool.length<10){setNotice("Choose a broader difficulty to begin the mock.");return;}
   setMockQueue(pool.slice(0,10));setMockPos(0);setMockAnswers([]);setTimeLeft(300);
   setSession("mock");setMockComplete(false);setShowMockReview(false);resetResponse();
 };
 const finishMock=useCallback(()=>{setMockComplete(true);setShowMockReview(false);},[]);
 useEffect(()=>{if(session!=="mock"||mockComplete||mockQueue.length===0)return;
   const id=window.setInterval(()=>setTimeLeft(t=>Math.max(0,t-1)),1000);
   return()=>clearInterval(id);
 },[session,mockComplete,mockQueue.length]);
 useEffect(()=>{if(session==="mock"&&!mockComplete&&mockQueue.length&&timeLeft===0)finishMock();},[session,mockComplete,mockQueue.length,timeLeft,finishMock]);
 const submitMock=()=>{
   if(!mockQuestion||mockComplete)return;
   const correct=choice!==null&&choice===mockQuestion.correctIndex;
   setMockAnswers(prev=>[...prev,{id:mockQuestion.id,question:mockQuestion.question,choice,correct,answer:mockQuestion.answer,selected:choice===null?"Unanswered":mockQuestion.options[choice],explanation:mockQuestion.example}]);
   if(choice!==null)rememberGrade(mockQuestion,correct?100:0);
   resetResponse();
   if(mockPos+1>=mockQueue.length)finishMock();
   else setMockPos(i=>i+1);
 };
 const exitMock=()=>{setSession("practice");setMockQueue([]);setMockComplete(false);resetResponse();};
 const activeTags=[role,level!=="All"?level:null,topic!=="All topics"?topic:null].filter(Boolean);
 return <section className="ia-root" aria-label="Quant interview arena">
  <div className="ia-hero">
   <div className="ia-grid-decoration" aria-hidden="true"/>
   <div className="ia-hero-copy"><p className="ia-eyebrow">ALPHAHEDGEQUANT / INTERVIEW INTELLIGENCE</p>
    <h2>Think in <em>probabilities.</em><br/>Answer with <em>precision.</em></h2>
    <p>Serious preparation for quantitative research, trading, engineering and market risk. Explain the reasoning. Test the numbers. Learn from mistakes.</p>
    <div className="ia-hero-meta"><span><b>{CASES.length.toLocaleString("en-IN")}</b> total questions</span><span><b>48</b> numerical scenario families</span><span><b>4</b> career tracks</span></div>
   </div>
   <div className="ia-orbit" aria-hidden="true"><div className="ia-ring ia-ring-a"/><div className="ia-ring ia-ring-b"/><div className="ia-ring ia-ring-c"/><span className="ia-orbit-center">∑</span><span className="ia-mote ia-mote-a">σ²</span><span className="ia-mote ia-mote-b">∇f</span><span className="ia-mote ia-mote-c">Δ</span><span className="ia-mote ia-mote-d">E[X]</span></div>
  </div>
  <div className="ia-stats">
   <div><small>QUESTIONS MASTERED</small><strong>{totalMastered}<span> / {CASES.length.toLocaleString("en-IN")}</span></strong></div>
   <div><small>IN THIS TRACK</small><strong>{roleMastered}<span> / {roleCases.length}</span></strong></div>
   <div><small>NUMERICAL CHALLENGES</small><strong>{numericCount}</strong></div>
   <div><small>ACCOUNT SYNC</small><p aria-live="polite">{sync||"Sign in to keep your progress."}</p></div>
  </div>
  <div className="ia-role-grid" role="group" aria-label="Select interview career track">
   {CAREERS.map(c=><button key={c.key} type="button" className={"ia-role"+(role===c.key?" active":"")} aria-pressed={role===c.key} onClick={()=>switchRole(c.key)}>
    <span className="ia-role-symbol">{c.key==="Researcher"?"∑":c.key==="Trader"?"Δ":c.key==="Developer"?"⌘":"σ"}</span><strong>{c.key}</strong><small>{c.desc}</small><span className="ia-role-count">{CASES.filter(q=>q.role===c.key).length} QUESTIONS <Icon name="↗"/></span>
   </button>)}
  </div>
  <div className="ia-lab">
   <div className="ia-lab-top"><div><span className="ia-eyebrow">PRACTICE LAB / {role.toUpperCase()}</span><h3>Train how you think.</h3></div>
    <div className="ia-mode-switch" role="group" aria-label="Practice mode">
     <button type="button" className={session==="practice"?"selected":""} onClick={exitMock}>Practice</button>
     <button type="button" className={session==="mock"?"selected":""} onClick={startMock}>5-min mock · 10 Q</button>
    </div>
   </div>
   {session==="practice"&&<div className="ia-controls">
    <div className="ia-levels" role="group" aria-label="Question difficulty">{LEVELS.map(l=><button key={l} type="button" aria-pressed={level===l} onClick={()=>{setLevel(l);setActiveId(null);resetResponse();}} className={level===l?"selected":""}>{l}</button>)}</div>
    <label className="ia-field-label">FOCUS AREA<select value={topic} onChange={e=>{setTopic(e.target.value);setActiveId(null);resetResponse();}}>{topics.map(t=><option key={t}>{t}</option>)}</select></label>
    <label className="ia-field-label ia-search">SEARCH QUESTION BANK<input aria-label="Search interview questions" placeholder="Greeks, volatility, SQL, VaR…" value={query} onChange={e=>{setQuery(e.target.value);setActiveId(null);resetResponse();}}/></label>
    <div className="ia-scopes" role="group" aria-label="Filter questions">
     {[["all","All"],["new","Not mastered"],["mastered","Mastered"],["saved","Bookmarked"],["review","Needs review"]].map(([value,label])=><button key={value} type="button" aria-pressed={scope===value} className={scope===value?"selected":""} onClick={()=>{setScope(value);setActiveId(null);resetResponse();}}>{label}</button>)}
    </div>
   </div>}
   {session==="mock"&&<div className="ia-mock-bar"><div><small>ROLE</small><b>{role}</b></div><div><small>TIME LEFT</small><b className={timeLeft<60?"ia-danger":""}>{formatClock(timeLeft)}</b></div><div><small>QUESTION</small><b>{Math.min(mockPos+1,10)} / 10</b></div><button type="button" onClick={exitMock}>Exit mock</button></div>}
   {session==="mock"&&mockComplete?<div className="ia-results">
    <p className="ia-eyebrow">SESSION COMPLETE / OBJECTIVELY SCORED</p><h3>Your mock interview results.</h3>
    <strong>{mockCorrect}<span> / 10 correct</span></strong>
    <p>{mockAttempted} attempted · {10-mockAttempted} unanswered in this session · {formatClock(300-timeLeft)} elapsed. Only numerical multiple-choice questions are automatically scored.</p>
    <div className="ia-results-actions"><button type="button" className="ia-main-button" onClick={()=>setShowMockReview(v=>!v)}>{showMockReview?"Hide answer review":"Review questions and explanations"}</button><button type="button" onClick={startMock}>Try another mock</button><button type="button" onClick={exitMock}>Back to practice</button></div>
    {showMockReview&&<div className="ia-result-list">{mockQueue.map((q,i)=>{const a=mockAnswers.find(x=>x.id===q.id);return <div key={q.id} className="ia-result-item"><b>{i+1}. {q.question}</b><p className={a?.correct?"ia-good":"ia-bad"}>{a?.correct?"Correct":"Not correct"} · Your choice: {a?.selected||"Unanswered"}</p><p>Correct answer: {q.answer}. {q.example}</p></div>;})}</div>}
   </div>:question?<div className="ia-question-layout">
    <article className="ia-question">
     <div className="ia-question-top"><span className="ia-q-number">{session==="mock"?"MOCK "+(mockPos+1)+" / 10":String(currentIndex+1).padStart(3,"0")+" / "+filtered.length}</span><div className="ia-q-tags">{(session==="mock"?[role,question.level,question.topic]:activeTags).map(x=><span key={x}>{x}</span>)}</div>
      {session==="practice"&&<button type="button" aria-label={bookmarks.includes(question.id)?"Remove bookmark":"Bookmark question"} title={bookmarks.includes(question.id)?"Remove bookmark":"Bookmark question"} className={"ia-bookmark"+(bookmarks.includes(question.id)?" saved":"")} onClick={()=>toggleBookmark(question.id)}>{bookmarks.includes(question.id)?"★":"☆"}</button>}
     </div>
     <p className="ia-concept">{question.concept||question.topic||"Conceptual reasoning"} / {question.kind==="numeric"?"NUMERICAL REASONING":"OPEN-ENDED REASONING"}</p>
     <h4>{question.question}</h4>
     {isNumeric(question)?<div className="ia-choices" role="group" aria-label="Choose one answer">
      {question.options.map((option,i)=>{const good=checked&&i===question.correctIndex;const wrong=checked&&i===choice&&choice!==question.correctIndex;return <button key={i} type="button" aria-pressed={choice===i} disabled={checked||mockComplete} className={"ia-choice"+(choice===i?" chosen":"")+(good?" correct":"")+(wrong?" wrong":"")} onClick={()=>setChoice(i)}><span>{String.fromCharCode(65+i)}</span><b>{option}</b>{good&&<Icon name="✓"/>}{wrong&&<Icon name="×"/>}</button>})}
     </div>:<div className="ia-open-answer"><p>Interview prompt: state your assumptions, explain the mechanism, derive the result, and give one real market example.</p><textarea rows={5} placeholder="Write your answer here before revealing the model framework…" aria-label="Your interview answer" disabled={revealed||session==="mock"}/></div>}
     {session==="practice"&&(checked||revealed)&&<div className={"ia-feedback"+(checked&&choice!==question.correctIndex?" needs-work":"")}>
      <p className="ia-feedback-label">{isNumeric(question)?(choice===question.correctIndex?"CORRECT · WELL REASONED":"REVIEW THE METHOD"):"MODEL ANSWER / ASSESS YOUR REASONING"}</p>
      {isNumeric(question)&&<p className="ia-answer">Correct answer: <strong>{question.answer}</strong></p>}
      <ol>{question.points.map((p,i)=><li key={i}>{p}</li>)}</ol>
      <p><b>Worked example</b> — {question.example}</p><p><b>Common pitfall</b> — {question.trap}</p>
      {!isNumeric(question)&&<div className="ia-self-grade"><small>How confidently could you explain this without looking?</small><div>{[[0,"Review again"],[50,"Partly understood"],[100,"I can explain it"]].map(([value,label])=><button key={value} type="button" disabled={grade!==null} className={grade===value?"selected":""} onClick={()=>assessTheory(value)}>{label}</button>)}</div></div>}
     </div>}
     {notice&&<p className="ia-notice" role="status">{notice}</p>}
     <div className="ia-actions">
      {session==="mock"?<button type="button" className="ia-main-button" onClick={submitMock}>{mockPos===9?"Finish mock":"Submit & continue"} <Icon name="→"/></button>
      :<>{isNumeric(question)&&!checked&&<button type="button" disabled={choice===null} className="ia-main-button" onClick={checkPractice}>Check answer <Icon name="→"/></button>}
       {!isNumeric(question)&&!revealed&&<button type="button" className="ia-main-button" onClick={()=>setRevealed(true)}>Reveal worked answer <Icon name="↗"/></button>}
       <button type="button" className="ia-minor-button" onClick={prevPractice} disabled={!filtered.length}>← Previous</button>
       <button type="button" className="ia-minor-button" onClick={nextPractice}>Next question →</button>
       <button type="button" className="ia-minor-button" onClick={()=>{if(!filtered.length)return;switchQuestion(filtered[Math.floor(Math.random()*filtered.length)].id);}}>Surprise me ↝</button>
      </>}
     </div>
    </article>
    <aside className="ia-aside">
     <span className="ia-eyebrow">REASONING ENGINE / 01</span>
     <div className="ia-aside-visual" aria-hidden="true"><svg viewBox="0 0 260 120" width="100%" role="presentation"><defs><linearGradient id="ia-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#4f7de8"/><stop offset="100%" stopColor="#a2d6ff"/></linearGradient></defs><g stroke="#2c4963" opacity=".65" strokeWidth=".5">{[20,50,80,110].map(y=><path key={y} d={"M0 "+y+" H260"}/>)}{[30,65,100,135,170,205,240].map(x=><path key={x} d={"M"+x+" 0 V120"}/>)}</g><path d="M0 101 C 28 97 34 72 58 84 S 96 116 120 66 S 160 27 184 52 S 226 72 260 13" stroke="url(#ia-gradient)" fill="none" strokeWidth="2.5" strokeLinecap="round"/><circle r="4" fill="#c1e4ff"><animateMotion dur="7s" repeatCount="indefinite" path="M0 101 C 28 97 34 72 58 84 S 96 116 120 66 S 160 27 184 52 S 226 72 260 13"/></circle></svg></div>
     <p className="ia-aside-topic">{question.topic||"Core reasoning"}</p>
     <h5>{question.concept||"Research and communicate clearly."}</h5>
     <p>Think before revealing. In a real interview, your assumptions and method matter as much as the final answer.</p>
     {session==="practice"&&!revealed&&!checked&&<details><summary>Need a nudge? <Icon name="+" /></summary><p>{question.hint||question.points[0]}</p></details>}
     <div className="ia-aside-foot"><small>BANK COMPOSITION</small><p>24 original open-ended cases + 1,200 parameterized numerical cases. A numerical variation is not a new theoretical concept.</p></div>
    </aside>
   </div>:<div className="ia-empty"><h4>No matching questions found.</h4><p>Try another topic, role, difficulty, or clear your search.</p><button onClick={()=>{setQuery("");setScope("all");setTopic("All topics");setLevel("All");}}>Clear filters</button></div>}
   <div className="ia-foot"><span>NOT A LIVE MARKET FEED · EDUCATIONAL EXERCISES</span><span>{session==="practice"?filtered.length+" questions match your filters":"Mock sessions are sampled from the same validated question bank"}</span></div>
  </div>
 </section>;
}
