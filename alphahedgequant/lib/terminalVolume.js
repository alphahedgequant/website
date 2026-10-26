// NSE-local session clock, with null for missing data; never synthesize volumes.
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false });
export function sessionParts(timestamp) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(timestamp)).map(x=>[x.type,x.value]));
  return { date: p.year+"-"+p.month+"-"+p.day, minute: Number(p.hour)*60+Number(p.minute) };
}
export function median(xs) { const v=[...xs].sort((a,b)=>a-b); return v.length ? (v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2) : null; }
export function volumeSeries(history, today, lookback=15) {
  const currentDate=today.length ? sessionParts(today[0][0]).date : null;
  const dates=[...new Set(history.map(x=>sessionParts(x[0]).date))].filter(d=>d!==currentDate).sort().reverse().slice(0,lookback);
  const timeSlots=Array.from({length:375},(_,i)=>555+i); // 09:15–15:29 NSE
  function cumulative(rows, date) {
    const m=new Map();
    for(const x of rows) {
      const s=sessionParts(x[0]), v=Number(x[5]);
      if(s.date===date && s.minute>=555 && s.minute<930 && Number.isFinite(v)&&v>=0)m.set(s.minute,v);
    }
    // Disallow incomplete historical sessions rather than assuming missing bars are zero.
    if(m.size < 360)return null;
    let c=0;return timeSlots.map(t=>{if(!m.has(t))return null;c+=m.get(t);return c;});
  }
  const refs=dates.map(d=>cumulative(history,d)).filter(Boolean);
  const todayDate=currentDate;
  const current = todayDate ? new Map(today.filter(x=>sessionParts(x[0]).date===todayDate).map(x=>[sessionParts(x[0]).minute,Number(x[5])])) : new Map();
  let running=0, missing=false;
  return { eligibleSessions:refs.length, requestedSessions:lookback, points:timeSlots.map((slot,i)=>{
    const values=refs.map(r=>r[i]).filter(Number.isFinite);
    let observed=null;
    if(current.has(slot)&&!missing){const v=current.get(slot);if(Number.isFinite(v)&&v>=0){running+=v;observed=running;}else missing=true;}
    else if(current.size && Math.min(...current.keys())<=slot && Math.max(...current.keys())>=slot)missing=true;
    const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
    return {time:String(Math.floor(slot/60)).padStart(2,"0")+":"+String(slot%60).padStart(2,"0"),today:observed,mean,median:median(values),rvol:observed!==null&&mean>0?observed/mean:null,coverage:values.length};
  }) };
}
