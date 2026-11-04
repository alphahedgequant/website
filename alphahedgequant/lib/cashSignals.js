// Cash-only research engine. No broker orders, artificial ticks, or synthetic returns.
// Each model fails closed when its required observations are unavailable.
export const CASH_MODELS = [
 {id:"residual",number:"01",name:"Residual Momentum",short:"Sector-neutral leadership",group:"EQUITY FACTORS",horizon:"5–20 sessions",requires:"120 aligned daily stock, market and sector bars",universe:["RELIANCE","HDFCBANK","ICICIBANK","TCS","INFY","LT"]},
 {id:"delivery",number:"02",name:"Accumulation Footprint",short:"Delivery + close location",group:"FLOW INTELLIGENCE",horizon:"3–15 sessions",requires:"60 verified daily delivery-quantity records and price-volume bars",universe:["RELIANCE","ICICIBANK","SBIN","LT","BEL","BHARTIARTL"]},
 {id:"rotation",number:"03",name:"Sector Rotation",short:"Breadth-confirmed leadership",group:"SECTOR FACTORS",horizon:"2–6 weeks",requires:"Constituent breadth, sector and Nifty daily returns",universe:["BANKBEES","ITBEES","PHARMABEES","NIFTYBEES"]},
 {id:"earnings",number:"04",name:"Earnings Drift",short:"Surprise × price-volume",group:"EVENT DRIVEN",horizon:"5–30 sessions",requires:"Timestamped earnings surprise, historical expectations and event-day volume",universe:["TCS","INFY","HDFCBANK","ICICIBANK","RELIANCE","LT"]},
 {id:"shock",number:"05",name:"Liquidity Shock Reversal",short:"Excess selling → stabilization",group:"SHORT-TERM",horizon:"1–5 sessions",requires:"100 daily price-volume bars and Nifty 100 trend",universe:["RELIANCE","HDFCBANK","ICICIBANK","SBIN","INFY","ITC"]},
 {id:"breadth",number:"06",name:"Breadth Recovery",short:"Participating-stock recovery",group:"MARKET REGIME",horizon:"5–15 sessions",requires:"60-day timestamped index breadth history and index bars",universe:["NIFTYBEES","BANKBEES","JUNIORBEES"]},
 {id:"goldSilver",number:"07",name:"Gold / Silver Rotation",short:"ETF relative-return spread",group:"COMMODITIES / ETF",horizon:"1–4 weeks",requires:"120 daily bars for both gold and silver ETFs",universe:["GOLDBEES","HDFCSILVER"]},
 {id:"metalBreak",number:"08",name:"Metal Volatility Breakout",short:"Compression → breakout",group:"COMMODITIES / ETF",horizon:"3–20 sessions",requires:"110 daily bars of a verified metal ETF",universe:["GOLDBEES","HDFCSILVER"]},
 {id:"metalBeta",number:"09",name:"Producer Beta Mispricing",short:"Commodity-adjusted equity residual",group:"CROSS-ASSET",horizon:"5–20 sessions",requires:"120 matching commodity spot, Nifty and producer equity bars",universe:["HINDALCO","HINDZINC","NATIONALUM","TATASTEEL"]},
 {id:"crude",number:"10",name:"Crude Shock Transmission",short:"Oil + INR lagged response",group:"CROSS-ASSET",horizon:"3–15 sessions",requires:"120 matching Brent spot, USD/INR, Nifty and stock daily bars",universe:["ONGC","OIL","IOC","BPCL","HPCL","ASIANPAINT"]}
];
const valid=x=>Number.isFinite(Number(x))&&x!==null&&x!=="";
const num=x=>valid(x)?Number(x):null;
const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
const sd=v=>v.length>1?Math.sqrt(v.reduce((s,x)=>s+(x-mean(v))**2,0)/(v.length-1)):null;
const round=(x,d=2)=>valid(x)?Number(Number(x).toFixed(d)):null;
const tail=(a,n)=>a.slice(Math.max(0,a.length-n));
const percentage=(newV,oldV)=>oldV>0?(newV/oldV-1)*100:null;
const zscore=(value,values)=>{const s=sd(values);return s>0?(value-mean(values))/s:null};
const changeSeries=b=>b.slice(1).map((r,i)=>percentage(r.close,b[i].close)/100);
const highs=b=>b.map(x=>x.high);
const lows=b=>b.map(x=>x.low);
const closes=b=>b.map(x=>x.close);
const vol=b=>b.map(x=>x.volume);
const average=(b,k,n)=>mean(tail(b,n).map(x=>x[k]));
export function normalizeBars(raw){
 const rows=Array.isArray(raw)?raw:Array.isArray(raw?.data)?raw.data:Array.isArray(raw?.candles)?raw.candles:[];
 return rows.map(x=>{
  const time=x.date??x.timestamp??x.datetime??x.time;
  const date=new Date(typeof time==="number"&&time<1e11?time*1000:time);
  return {time:Number.isFinite(+date)?date.toISOString():null,open:num(x.open),high:num(x.high),low:num(x.low),close:num(x.close),volume:num(x.volume)};
 }).filter(x=>x.time&&x.close>0&&x.high>=x.low&&x.high>0&&x.low>0&&x.volume!==null&&x.volume>=0)
 .sort((a,b)=>a.time.localeCompare(b.time))
 .filter((x,i,a)=>i===a.length-1||x.time!==a[i+1].time);
}
function atr(b,n=14){if(b.length<n+1)return null;const tr=b.slice(1).map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-b[i].close),Math.abs(x.low-b[i].close)));return mean(tail(tr,n))}
function rsi(cl,n=3){if(cl.length<n+1)return null;const delta=tail(cl,n+1).slice(1).map((c,i)=>c-tail(cl,n+1)[i]);const gain=mean(delta.map(x=>Math.max(0,x))),loss=mean(delta.map(x=>Math.max(0,-x)));return loss===0?100:100-100/(1+gain/loss)}
function beta(a,b){const m=mean(a),n=mean(b);const denominator=b.reduce((s,x)=>s+(x-n)**2,0);return denominator>0?a.reduce((s,x,i)=>s+(x-m)*(b[i]-n),0)/denominator:null}
const notReady=(model,detail)=>({modelId:model.id,status:"INPUT REQUIRED",direction:"NONE",explanation:detail||model.requires,entry:null,stop:null,target:null,horizon:model.horizon,confidence:null,updatedAt:null});
const noSetup=(model,reason)=>({modelId:model.id,status:"NO SETUP",direction:"NONE",explanation:reason||"No confirmed qualifying setup",entry:null,stop:null,target:null,horizon:model.horizon,confidence:null,updatedAt:null});
function proposal(model,bar,why,anchor=null,extra={}){
 const a=extra.dailyAtr??null;
 const entry=anchor??bar.close;
 const stop=a>0?round(entry-1.5*a):null;
 const target=a>0?round(entry+2.5*a):null;
 return {modelId:model.id,status:"QUALIFIED / AWAITING ENTRY",direction:"LONG CASH",explanation:why,entry:round(entry),stop,target,horizon:model.horizon,confidence:null,updatedAt:bar.time,...extra};
}
export function intradayWatch(raw,quote,quoteTime=null,now=new Date()){
 const b=normalizeBars(raw);
 if(b.length<24||!(quote>0))return {status:"NOT AVAILABLE",reason:"Need at least 24 valid five-minute candles and a positive observed quote"};
 const latest=b.at(-1), age=(+now-new Date(latest.time))/60000;
 if(age<0||age>10)return {status:"STALE",reason:"Last 5-minute candle is outside the ten-minute freshness limit",asOf:latest.time};
 const prev=b.slice(-5,-1);
 const entry=Math.max(...highs(prev));
 const a=atr(b,14);
 if(!a||a<=0)return {status:"NOT AVAILABLE",reason:"Cannot compute intraday ATR"};
 const gap=(entry-quote)/quote;
 if(gap<0||gap>0.004)return {status:"NO NEAR TRIGGER",reason:"Price is not within 0–0.4% below the prior four-bar breakout"};
 return {status:"NEAR ENTRY",entry:round(entry),stop:round(entry-a),target:round(entry+1.8*a),distancePct:round(gap*100,3),asOf:latest.time,window:"Next 15–20 minutes: conditional monitoring, not an ETA or price prediction",reason:"Prior four-bar high; 5-minute ATR scenario. Never auto-executable without fresh bid/ask and risk checks."};
}
export function evaluateCashModel(id,bars=[],context={}){
 const model=CASH_MODELS.find(x=>x.id===id);
 if(!model)return {status:"INVALID",explanation:"Unknown model"};
 const b=normalizeBars(bars),last=b.at(-1),c=closes(b),r=changeSeries(b);
 const enough=(n)=>b.length>=n;
 if(id==="residual"){
  const sector=normalizeBars(context.sectorBars),market=normalizeBars(context.marketBars);
  if(!enough(145)||sector.length<b.length||market.length<b.length)return notReady(model);
  const sr=changeSeries(tail(sector,b.length)),mr=changeSeries(tail(market,b.length));
  const bi=beta(tail(r,120),tail(mr,120)),bs=beta(tail(r,120),tail(sr,120));
  if(bi==null||bs==null)return notReady(model,"Risk-factor regression could not be estimated");
  const residuals=r.map((x,i)=>x-bi*mr[i]-bs*sr[i]);
  const momentum=mean(residuals.slice(-25,-5));
  return momentum>0&&percentage(c.at(-1),c.at(-61))>0?proposal(model,last,"Positive 20-session residual momentum excluding the last five sessions; market and sector beta adjusted"):noSetup(model);
 }
 if(id==="delivery"){
  const delivery=context.deliveryBars;
  if(!Array.isArray(delivery)||delivery.length<60||!enough(62))return notReady(model);
  const d=delivery.slice(-60).map(x=>num(x.deliveryQty));
  if(d.some(x=>x==null))return notReady(model,"Delivery quantities were incomplete");
  const hits=tail(d,5).filter(x=>zscore(x,d.slice(0,-5))>1.5).length;
  const clv=last.high>last.low?(last.close-last.low)/(last.high-last.low):null;
  return hits>=3&&clv>.70&&percentage(last.close,b.at(-6).close)>0?proposal(model,last,"Three of five abnormal delivery sessions, positive five-day return, strong closing location"):noSetup(model);
 }
 if(id==="rotation"){
  const sb=context.sectorBreadth,sector=normalizeBars(context.sectorBars),market=normalizeBars(context.marketBars);
  if(!valid(sb)||sector.length<61||market.length<61||!enough(61))return notReady(model);
  const rel=percentage(sector.at(-1).close,sector.at(-61).close)-percentage(market.at(-1).close,market.at(-61).close);
  return rel>0&&Number(sb)>55?proposal(model,last,"Sector 60-day relative momentum is positive, with majority constituent participation"):noSetup(model);
 }
 if(id==="earnings"){
  const e=context.earningsEvent;
  if(!enough(21)||!e||!valid(e.actualEPS)||!valid(e.expectedEPS)||!valid(e.announcementVolumeZ)||!valid(e.sectorAdjustedReturn))return notReady(model);
  const lag=(Date.now()-new Date(e.publishedAt))/86400000;
  return lag>=0&&lag<=15&&Number(e.actualEPS)>Number(e.expectedEPS)&&e.announcementVolumeZ>2&&e.sectorAdjustedReturn>0?proposal(model,last,"Sourced earnings surprise and positive abnormal announcement reaction"):noSetup(model);
 }
 if(id==="shock"){
  const market=normalizeBars(context.marketBars);
  if(!enough(100)||market.length<100)return notReady(model);
  const prev=b.at(-2),lastReturn=percentage(prev.close,b.at(-3).close);
  const sampled=r.slice(-62,-2);
  const returnZ=zscore(lastReturn/100,sampled);
  const avgTurn=average(b.slice(-22,-2),"volume",20);
  const m=market.at(-1).close,ma=mean(tail(closes(market),100));
  return returnZ!=null&&returnZ<=-2&&avgTurn>0&&prev.volume>avgTurn*1.8&&rsi(closes(b.slice(0,-1)),3)<15&&last.close>prev.low&&m>ma?
   proposal(model,last,"Prior session's abnormal selling followed by price stabilization; market trend positive"):noSetup(model);
 }
 if(id==="breadth"){
  const breadth=context.breadthHistory,market=normalizeBars(context.marketBars);
  if(!Array.isArray(breadth)||breadth.length<21||market.length<100)return notReady(model);
  const recent=breadth.slice(-20).map(Number);if(recent.some(x=>!Number.isFinite(x)||x<0||x>100))return notReady(model);
  return market.at(-1).close>mean(tail(closes(market),100))&&recent.at(-1)-Math.min(...recent)>=10?proposal(model,last,"Breadth recovered 10 percentage points from recent low; index trend confirmed"):noSetup(model);
 }
 if(id==="goldSilver"){
  const gold=normalizeBars(context.goldBars),silver=normalizeBars(context.silverBars);
  if(gold.length<125||silver.length<125)return notReady(model);
  // ETF units differ; compare BASE-100 normalized returns, not raw price ratios.
  const gg=tail(gold,125),ss=tail(silver,125),ratio=gg.map((x,i)=>x.close/gg[0].close/(ss[i].close/ss[0].close));
  const zz=zscore(ratio.at(-1),ratio.slice(-121,-1));
  const goldMom=percentage(gg.at(-1).close,gg.at(-21).close),silverMom=percentage(ss.at(-1).close,ss.at(-21).close);
  const sym=String(context.symbol||"").toUpperCase();
  const chosen=zz>1.5&&silverMom>0?"HDFCSILVER":zz< -1.5&&goldMom>0?"GOLDBEES":null;
  if(!chosen||sym!==chosen)return noSetup(model,chosen?"Relative rotation favors "+chosen+"; selected instrument differs":"No confirmed relative-value rotation");
  const chosenBar=chosen==="GOLDBEES"?gg.at(-1):ss.at(-1);
  return proposal(model,chosenBar,"Base-100 ETF relative-performance spread has normalized Z beyond ±1.5; positive chosen-metal momentum",{...({})}.close??chosenBar.close,{dailyAtr:atr(chosen==="GOLDBEES"?gg:ss)});
 }
 if(id==="metalBreak"){
  if(!["GOLDBEES","HDFCSILVER"].includes(String(context.symbol||"").toUpperCase()))return notReady(model,"Model is restricted to verified gold / silver cash ETFs");
  if(!enough(110))return notReady(model);
  const recent=tail(r,10),long=tail(r,60),rv10=sd(recent),rv60=sd(long);
  const high20=Math.max(...highs(b.slice(-21,-1)));
  const sma100=mean(tail(c,100));
  return rv10!=null&&rv60>0&&rv10/rv60<.65&&last.close>high20&&last.close>sma100?
   proposal(model,last,"Ten-day realized volatility below 65% of 60-day; close above previous 20-bar high and SMA100",high20,{dailyAtr:atr(b)}):noSetup(model);
 }
 if(id==="metalBeta"){
  const spot=normalizeBars(context.commodityBars),market=normalizeBars(context.marketBars);
  if(!enough(125)||spot.length<125||market.length<125)return notReady(model);
  const a=tail(r,120),b1=tail(changeSeries(spot),120),b2=tail(changeSeries(market),120);
  const betaC=beta(a,b1),betaM=beta(a,b2);if(betaC==null||betaM==null)return notReady(model);
  const res=a.map((v,i)=>v-betaC*b1[i]-betaM*b2[i]),zz=zscore(mean(tail(res,10)),res.slice(0,-10));
  return zz< -1.5&&percentage(spot.at(-1).close,spot.at(-21).close)>0?proposal(model,last,"Underreaction versus commodity spot factor with positive spot trend"):noSetup(model);
 }
 if(id==="crude"){
  const crude=normalizeBars(context.crudeBars),fx=normalizeBars(context.fxBars),market=normalizeBars(context.marketBars);
  if(!enough(125)||crude.length<125||fx.length<125||market.length<125)return notReady(model);
  const a=tail(r,120),oil=tail(changeSeries(crude),120),currency=tail(changeSeries(fx),120),mkt=tail(changeSeries(market),120);
  const bo=beta(a,oil),bf=beta(a,currency),bm=beta(a,mkt);
  if([bo,bf,bm].some(x=>x===null))return notReady(model);
  const expected=bo*oil.at(-1)+bf*currency.at(-1)+bm*mkt.at(-1),gap=expected-a.at(-1);
  return Math.abs(oil.at(-1))>2*sd(oil.slice(0,-1))&&gap>0.015?proposal(model,last,"Spot crude shock and lagged positive residual catch-up hypothesis"):noSetup(model);
 }
 return notReady(model);
}
