"use client";
import {useCallback,useEffect,useRef,useState} from "react";

// Research handwriting stays in this browser. It is not attached to market-data claims,
// source disclosures, or the public company database.
const INKS=[
 {label:"Ink",value:"#1f2937"},
 {label:"Blue",value:"#235fa4"},
 {label:"Red",value:"#b63d46"},
 {label:"Gold",value:"#886018"}
];
const HEIGHT=510;
const storageKey=(symbol,section)=>"ahq:research:ipad:v1:"+symbol+":"+section;
function drawStroke(ctx,stroke,width,height){
 const pts=stroke.points||[];if(!pts.length)return;
 ctx.beginPath();ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=stroke.color||"#1f2937";
 ctx.lineWidth=stroke.size||2.4;
 if(pts.length===1){ctx.arc(pts[0].x*width,pts[0].y*height,ctx.lineWidth/2,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();return}
 ctx.moveTo(pts[0].x*width,pts[0].y*height);
 for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x*width,pts[i].y*height);
 ctx.stroke();
}
function render(canvas,strokes){
 if(!canvas)return;
 const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=HEIGHT;
 const dpi=Math.min(3,window.devicePixelRatio||1);
 canvas.width=Math.round(w*dpi);canvas.height=Math.round(h*dpi);
 const ctx=canvas.getContext("2d");if(!ctx)return;
 ctx.setTransform(dpi,0,0,dpi,0,0);ctx.clearRect(0,0,w,h);
 strokes.forEach(s=>drawStroke(ctx,s,w,h));
}
export default function TerminalPencilNotebook({symbol,section}){
 const canvasRef=useRef(null),activeRef=useRef(null),historyRef=useRef([]),readyKeyRef=useRef(null);
 const [strokes,setStrokes]=useState([]),[text,setText]=useState(""),[writing,setWriting]=useState(false);
 const [color,setColor]=useState("#1f2937"),[size,setSize]=useState(2.4),[status,setStatus]=useState("Opening notes…");
 const key=storageKey(symbol,section);
 useEffect(()=>{
  readyKeyRef.current=null;activeRef.current=null;setWriting(false);
  let loaded={strokes:[],text:""};
  try{
   const parsed=JSON.parse(localStorage.getItem(key)||"null");
   if(Array.isArray(parsed?.strokes))loaded.strokes=parsed.strokes.slice(-300).filter(s=>Array.isArray(s?.points));
   if(typeof parsed?.text==="string")loaded.text=parsed.text.slice(0,12000);
  }catch{}
  historyRef.current=loaded.strokes;setStrokes(loaded.strokes);setText(loaded.text);
  readyKeyRef.current=key;setStatus("Notes stored privately in this browser");
 },[key]);
 useEffect(()=>{
  if(readyKeyRef.current!==key)return;
  try{
   localStorage.setItem(key,JSON.stringify({strokes:strokes.slice(-300),text}));
   setStatus("Saved locally · not shared or synced");
  }catch{setStatus("Local browser storage unavailable")}
 },[strokes,text,key]);
 useEffect(()=>{
  if(!canvasRef.current)return;
  const canvas=canvasRef.current;const update=()=>render(canvas,historyRef.current);
  update();
  if(typeof ResizeObserver==="undefined"){window.addEventListener("resize",update);return()=>window.removeEventListener("resize",update)}
  const observer=new ResizeObserver(update);observer.observe(canvas);return()=>observer.disconnect();
 },[key]);
 useEffect(()=>{historyRef.current=strokes;render(canvasRef.current,strokes)},[strokes,key]);

 const coords=useCallback(e=>{
  const rect=canvasRef.current.getBoundingClientRect();
  return {x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),
          y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};
 },[]);
 const start=e=>{
  if(!writing||e.button!==0||e.pointerType==="touch")return;
  e.preventDefault();
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
  activeRef.current={pointerId:e.pointerId,color,size,points:[coords(e)]};
  render(canvasRef.current,[...historyRef.current,activeRef.current]);
 };
 const move=e=>{
  const active=activeRef.current;if(!active||active.pointerId!==e.pointerId)return;
  e.preventDefault();
  const p=coords(e),prev=active.points.at(-1);
  if(prev&&Math.hypot(p.x-prev.x,p.y-prev.y)<.001)return;
  if(active.points.length<2000)active.points.push(p);
  render(canvasRef.current,[...historyRef.current,active]);
 };
 const finish=e=>{
  const active=activeRef.current;if(!active||active.pointerId!==e.pointerId)return;
  activeRef.current=null;setStrokes(old=>[...old,active].slice(-300));
  try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
 };
 const undo=()=>{activeRef.current=null;setStrokes(s=>s.slice(0,-1))};
 const clear=()=>{
  if(!strokes.length)return;
  if(window.confirm("Clear handwritten ink for "+symbol+" / "+section+"? Your typed notes will stay.")){
   activeRef.current=null;setStrokes([]);
  }
 };
 const exportPng=()=>{
  const src=canvasRef.current;if(!src)return;
  const w=Math.max(700,Math.round(src.getBoundingClientRect().width)),out=document.createElement("canvas");
  out.width=w*2;out.height=HEIGHT*2;
  const ctx=out.getContext("2d");if(!ctx)return;
  ctx.scale(2,2);ctx.fillStyle="#fffdf6";ctx.fillRect(0,0,w,HEIGHT);
  ctx.strokeStyle="#d5e2ed";ctx.lineWidth=.6;
  for(let y=40;y<HEIGHT;y+=30){ctx.beginPath();ctx.moveTo(22,y);ctx.lineTo(w-20,y);ctx.stroke()}
  historyRef.current.forEach(s=>drawStroke(ctx,s,w,HEIGHT));
  const a=document.createElement("a");a.download="AHQ-"+symbol+"-"+section+"-pencil-notes.png";a.href=out.toDataURL("image/png");a.click();
 };
 return <section className="qt-pencil" aria-label={symbol+" "+section+" Apple Pencil research notebook"}>
  <div className="qt-pencil-heading">
   <div><span>RESEARCH NOTEBOOK</span><h3>{symbol} · {section}</h3></div><span className="qt-pencil-local">Private to this browser</span>
  </div>
  <div className="qt-pencil-toolbar" role="toolbar" aria-label="Handwriting tools">
   <button type="button" className={writing?"selected":""} onClick={()=>setWriting(v=>!v)} aria-pressed={writing}>{writing?"✎ Writing ON":"✎ Apple Pencil / Draw"}</button>
   <button type="button" onClick={undo} disabled={!strokes.length}>↶ Undo</button>
   <button type="button" onClick={clear} disabled={!strokes.length}>Clear ink</button>
   <button type="button" onClick={exportPng}>Save PNG ↓</button>
  </div>
  <div className="qt-pencil-palette">
   {INKS.map(ink=><button type="button" key={ink.value} className={color===ink.value?"selected":""} onClick={()=>setColor(ink.value)} aria-label={"Choose "+ink.label+" pen color"} title={ink.label} style={{"--pen":ink.value}}><span/></button>)}
   <label>Thickness <select aria-label="Pen thickness" value={size} onChange={e=>setSize(Number(e.target.value))}><option value={1.5}>Fine</option><option value={2.4}>Medium</option><option value={4}>Bold</option></select></label>
  </div>
  <div className="qt-paper-wrap">
   <canvas ref={canvasRef} height={HEIGHT} className={writing?"qt-pencil-canvas drawing":"qt-pencil-canvas"} style={{touchAction:writing?"none":"pan-y"}} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label="Ruled paper drawing surface for Apple Pencil or mouse"/>
   {!writing&&<p className="qt-pencil-paper-hint">Tap “Apple Pencil / Draw” to write here.</p>}
  </div>
  <label className="qt-pencil-type">Typed research notes
   <textarea value={text} onChange={e=>setText(e.target.value.slice(0,12000))} placeholder="Investment thesis, questions, report page references, meeting notes…" rows={5} maxLength={12000}/>
  </label>
  <p className="qt-pencil-status" role="status">{status}. Apple Pencil or mouse works in writing mode; finger scrolling is preserved when writing is off. Handwriting stays on this device unless you export it.</p>
 </section>;
}
