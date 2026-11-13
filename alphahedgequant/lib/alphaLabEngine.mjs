/**
 * AHQ Alpha Lab — safe expression parser and cross-sectional OHLCV research engine.
 *
 * No eval / Function, external scripting, implicit market data or synthetic results.
 * Every signal is computed at the close of t and first applied from open(t+1)
 * to open(t+2). Daily price bars are provided by /api/alpha-lab/prices.
 */

export const ALPHA_PRESETS = [
  {
    name: "Residualised reversal",
    family: "Mean reversion · robust scaling",
    theory: "A short-horizon reversal score scaled by 60-bar realised z-score and weighted toward historically liquid instruments.",
    formula: "rank(-ts_zscore(ts_delta(log(close), 5), 60) * ts_rank(volume / ts_mean(volume, 20), 20))",
    math: "αᵢ,t = Rankₓₛ[−Z₆₀(Δ₅ ln Pᵢ,t) · Rank₂₀(Vᵢ,t / ADV₂₀)]",
  },
  {
    name: "Volume–return dependence",
    family: "Information theory · microstructure",
    theory: "Low short-run return/volume dependence, combined with exponentially weighted pressure.",
    formula: "rank(-ts_corr(returns, log(volume + 1), 20) + ts_decay_linear(returns, 8))",
    math: "αᵢ,t = Rankₓₛ[−ρ₂₀(r, ln(1+V)) + Σₖ k·rₜ₋₈₊ₖ / Σₖ k]",
  },
  {
    name: "Conditional volatility",
    family: "Higher moments · distribution shape",
    theory: "Prefer stable recent movements with a volatility penalty and a skewness-adjusted tail filter.",
    formula: "rank(ts_mean(returns, 20) / (ts_std_dev(returns, 20) + 0.0001) - 0.2 * abs(ts_skewness(returns, 60)))",
    math: "αᵢ,t = Rankₓₛ[μ₂₀/σ₂₀ − 0.2|Skew₆₀|]",
  },
  {
    name: "Autocorrelation anomaly",
    family: "Time series · serial dependence",
    theory: "Combine weak lag-one autocorrelation with an entropy-based penalty on highly irregular returns.",
    formula: "rank(-ts_autocorr(returns, 30, 1) - 0.1 * ts_entropy(returns, 30))",
    math: "αᵢ,t = Rankₓₛ[−Corr(rₜ,rₜ₋₁) − 0.1H₃₀(r)]",
  },
  {
    name: "Range-adjusted momentum",
    family: "Price action · covariance",
    theory: "Smoothed close-location value combined with a rolling momentum filter.",
    formula: "rank(ts_mean((close - low) / (high - low + 0.01), 10) + ts_zscore(ts_delta(close, 20) / close, 60))",
    math: "αᵢ,t = Rankₓₛ[MA₁₀((C−L)/(H−L+ε)) + Z₆₀(Δ₂₀P/P)]",
  },
];

const FIELD_NAMES = new Set(["open", "high", "low", "close", "volume", "returns"]);
const ONE_ARG = new Set(["abs", "log", "sqrt", "sign", "rank", "zscore", "normalize", "scale", "exp"]);
const TWO_ARG = new Set(["min", "max", "power", "ts_mean", "ts_sum", "ts_std_dev", "ts_delta", "delay",
  "ts_rank", "ts_zscore", "ts_min", "ts_max", "ts_arg_max", "ts_arg_min", "ts_decay_linear",
  "ts_skewness", "ts_kurtosis", "ts_entropy"]);
const THREE_ARG = new Set(["ts_corr", "ts_cov", "ts_beta", "ts_autocorr"]);
export const OPERATORS = [
  "rank(x)", "zscore(x)", "normalize(x)", "scale(x)", "ts_mean(x,n)", "ts_std_dev(x,n)",
  "ts_zscore(x,n)", "ts_rank(x,n)", "ts_corr(x,y,n)", "ts_cov(x,y,n)", "ts_beta(y,x,n)",
  "ts_autocorr(x,n,lag)", "ts_entropy(x,n)", "ts_skewness(x,n)", "ts_kurtosis(x,n)",
  "ts_decay_linear(x,n)", "ts_delta(x,n)", "delay(x,n)", "ts_arg_max(x,n)", "ts_arg_min(x,n)",
  "ts_min(x,n)", "ts_max(x,n)", "ts_sum(x,n)", "log(x)", "sqrt(x)", "abs(x)", "sign(x)", "exp(x)",
  "power(x,y)", "min(x,y)", "max(x,y)", "open", "high", "low", "close", "volume", "returns",
];

function tokenize(source) {
  if (!source || source.length > 2000) throw new Error("Formula must be 1–2,000 characters.");
  const tokens = [];
  let pos = 0;
  while (pos < source.length) {
    if (/\s/.test(source[pos])) { pos++; continue; }
    const slice = source.slice(pos);
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|^[A-Za-z_]\w*|^[()+\-*/^,]/.exec(slice);
    if (!match) throw new Error("Unexpected character at column " + (pos + 1) + ".");
    tokens.push({ value: match[0], pos });
    if (tokens.length > 400) throw new Error("Formula exceeds 400 tokens.");
    pos += match[0].length;
  }
  return tokens;
}
export function parseFormula(source) {
  const t = tokenize(source);
  let index = 0;
  const peek = () => t[index]?.value;
  const consume = value => {
    if (peek() !== value) throw new Error("Expected '" + value + "' near column " + ((t[index]?.pos ?? source.length) + 1) + ".");
    index++; 
  };
  let depth = 0;
  const primary = () => {
    if (++depth > 35) throw new Error("Expression nesting exceeds limit.");
    try {
      const v = peek();
      if (v === "+" || v === "-") { index++; return { type: "unary", op: v, arg: expression(30) }; }
      if (v === "(") { consume("("); const ast = expression(0); consume(")"); return ast; }
      if (v === undefined) throw new Error("Incomplete formula.");
      if (/^(?:\d|\.)/.test(v)) { index++; const n = Number(v); if (!Number.isFinite(n)) throw new Error("Invalid number."); return { type: "num", value: n }; }
      if (/^[A-Za-z_]/.test(v)) {
        index++;
        if (peek() === "(") {
          consume("(");
          const args = [];
          if (peek() !== ")") {
            args.push(expression(0));
            while (peek() === ",") { consume(","); args.push(expression(0)); if (args.length > 4) throw new Error("Too many arguments."); }
          }
          consume(")");
          const count = ONE_ARG.has(v) ? 1 : TWO_ARG.has(v) ? 2 : THREE_ARG.has(v) ? 3 : null;
          if (count === null) throw new Error("Unknown operator: " + v);
          if (args.length !== count) throw new Error(v + " expects " + count + " arguments.");
          return { type: "call", fn: v, args };
        }
        if (!FIELD_NAMES.has(v)) throw new Error("Unknown data field: " + v);
        return { type: "field", name: v };
      }
      throw new Error("Unexpected token '" + v + "'.");
    } finally { depth--; }
  };
  const precedence = { "+": 10, "-": 10, "*": 20, "/": 20, "^": 30 };
  const expression = min => {
    let left = primary();
    while (precedence[peek()] !== undefined && precedence[peek()] >= min) {
      const op = peek(); index++;
      const right = expression(precedence[op] + (op === "^" ? 0 : 1));
      left = { type: "binary", op, left, right };
    }
    return left;
  };
  const ast = expression(0);
  if (index < t.length) throw new Error("Unexpected token '" + peek() + "' at column " + (t[index].pos + 1) + ".");
  return ast;
}

const valid = Number.isFinite;
const avg = xs => xs.reduce((a,b)=>a+b,0) / xs.length;
const variance = xs => { const m=avg(xs);return avg(xs.map(x=>(x-m)**2));};
const stdev = xs => Math.sqrt(Math.max(0,variance(xs)));
const finiteOrNaN = x => valid(x) ? x : NaN;
function percentRank(xs, x) {
  const less = xs.filter(y => y < x).length;
  const same = xs.filter(y => y === x).length;
  return xs.length === 1 ? 0.5 : (less + (same - 1) / 2) / (xs.length - 1);
}

function extractWindow(ast, lower=2) {
  if (ast.type !== "num" || !Number.isInteger(ast.value) || ast.value < lower || ast.value > 252) {
    throw new Error("Window and lag parameters must be integer literals from " + lower + " to 252.");
  }
  return ast.value;
}
function rowsOf(matrix) { return matrix.map(row=>row.length); }
function mapUnary(mat, fn) { return mat.map(row=>row.map(v=>valid(v) ? finiteOrNaN(fn(v)) : NaN)); }
function mapBinary(a, b, fn) {
  return a.map((row,s)=>row.map((v,t)=>valid(v)&&valid(b[s][t])?finiteOrNaN(fn(v,b[s][t])):NaN));
}
function rollingOne(mat, n, fn) {
  return mat.map(row=>row.map((_,t)=>{
    if(t+1<n) return NaN;
    const w=row.slice(t-n+1,t+1);
    return w.every(valid) ? finiteOrNaN(fn(w)) : NaN;
  }));
}
function rollingTwo(a,b,n,fn) {
  return a.map((row,s)=>row.map((_,t)=>{
    if(t+1<n) return NaN;
    const x=row.slice(t-n+1,t+1), y=b[s].slice(t-n+1,t+1);
    return x.every(valid) && y.every(valid) ? finiteOrNaN(fn(x,y)) : NaN;
  }));
}
function covariance(x,y) { const a=avg(x),b=avg(y);return avg(x.map((v,i)=>(v-a)*(y[i]-b))); }
function correlation(x,y) { const denom=stdev(x)*stdev(y);return denom>1e-12?covariance(x,y)/denom:NaN; }

export function evaluateFormula(ast, data) {
  const {symbols, dates, bars} = data;
  const count = dates.length;
  const fill = n => symbols.map(()=>Array(count).fill(n));
  const fields = Object.fromEntries([...FIELD_NAMES].map(f=>[f,symbols.map(s=>
    bars[s].map((row,t)=>f==="returns"?(t ? (row.close/bars[s][t-1].close-1) : NaN):Number(row[f])))]));
  const walk = node => {
    if (node.type==="num") return fill(node.value);
    if (node.type==="field") return fields[node.name];
    if (node.type==="unary") { const x=walk(node.arg);return node.op==="-"?mapUnary(x,v=>-v):x; }
    if (node.type==="binary") {
      const x=walk(node.left),y=walk(node.right);
      const ops={"+":(a,b)=>a+b,"-":(a,b)=>a-b,"*":(a,b)=>a*b,"/":(a,b)=>b!==0?a/b:NaN,"^":(a,b)=>Math.pow(a,b)};
      return mapBinary(x,y,ops[node.op]);
    }
    const {fn,args} = node;
    const x=walk(args[0]);
    if (ONE_ARG.has(fn)) {
      if (fn==="rank"||fn==="zscore"||fn==="normalize"||fn==="scale") {
        const out=fill(NaN);
        for(let t=0;t<count;t++) {
          const usable=x.map((row,s)=>({s,v:row[t]})).filter(p=>valid(p.v));
          if(!usable.length)continue;
          const vals=usable.map(p=>p.v), mu=avg(vals), sd=stdev(vals), gross=vals.reduce((a,b)=>a+Math.abs(b),0);
          for(const p of usable) {
            out[p.s][t]=fn==="rank"?percentRank(vals,p.v):
              fn==="zscore"?(sd>1e-12?(p.v-mu)/sd:0):
              fn==="normalize"?p.v-mu:(gross>1e-12?p.v/gross:0);
          }
        }
        return out;
      }
      const fns={abs:Math.abs,log:v=>v>0?Math.log(v):NaN,sqrt:v=>v>=0?Math.sqrt(v):NaN,sign:Math.sign,exp:Math.exp};
      return mapUnary(x,fns[fn]);
    }
    if (fn==="power" || fn==="min" || fn==="max") {
      const y=walk(args[1]);
      return mapBinary(x,y,fn==="power"?Math.pow:fn==="min"?Math.min:Math.max);
    }
    if (THREE_ARG.has(fn)) {
      if (fn==="ts_autocorr") {
        const n=extractWindow(args[1]),lag=extractWindow(args[2],1);
        if(lag>=n)throw new Error("ts_autocorr lag must be smaller than the window.");
        return rollingOne(x,n,w=>correlation(w.slice(lag),w.slice(0,-lag)));
      }
      const y=walk(args[1]),n=extractWindow(args[2]);
      if (fn==="ts_cov") return rollingTwo(x,y,n,covariance);
      if (fn==="ts_corr") return rollingTwo(x,y,n,correlation);
      if (fn==="ts_beta") return rollingTwo(x,y,n,(a,b)=>{const v=variance(b);return v>1e-12?covariance(a,b)/v:NaN;});
    }
    const n=extractWindow(args[1],fn==="ts_delta"||fn==="delay"?1:2);
    if (fn==="delay" || fn==="ts_delta") {
      return x.map(row=>row.map((v,i)=>{
        if(i<n || !valid(row[i-n]) || !valid(v))return NaN;
        return fn==="delay"?row[i-n]:v-row[i-n];
      }));
    }
    const operations = {
      ts_mean: avg,
      ts_sum: w=>w.reduce((s,v)=>s+v,0),
      ts_std_dev: stdev,
      ts_zscore: w=>{const sd=stdev(w);return sd>1e-12?(w.at(-1)-avg(w))/sd:NaN;},
      ts_rank: w=>percentRank(w,w.at(-1)),
      ts_min: w=>Math.min(...w),
      ts_max: w=>Math.max(...w),
      ts_arg_max: w=>n-1-w.indexOf(Math.max(...w)),
      ts_arg_min: w=>n-1-w.indexOf(Math.min(...w)),
      ts_decay_linear: w=>w.reduce((s,v,i)=>s+v*(i+1),0)/(n*(n+1)/2),
      ts_skewness: w=>{const mu=avg(w),sd=stdev(w);return sd>1e-12?avg(w.map(v=>((v-mu)/sd)**3)):NaN;},
      ts_kurtosis: w=>{const mu=avg(w),sd=stdev(w);return sd>1e-12?avg(w.map(v=>((v-mu)/sd)**4))-3:NaN;},
      // Discretised Shannon entropy with fixed 8 equal-width bins. Undefined for constant windows.
      ts_entropy: w=>{
        const lo=Math.min(...w),hi=Math.max(...w);
        if(hi-lo<1e-12)return 0;
        const counts=Array(8).fill(0);
        for(const v of w)counts[Math.min(7,Math.floor(8*(v-lo)/(hi-lo)))]++;
        return -counts.reduce((h,k)=>k?h+(k/n)*Math.log(k/n):h,0);
      },
    };
    if(!operations[fn]) throw new Error("Unsupported operator: " + fn);
    return rollingOne(x,n,operations[fn]);
  };
  return walk(ast);
}

function normalizeInput(symbolToBars) {
  const symbols=Object.keys(symbolToBars);
  if(symbols.length<4) throw new Error("At least four symbols are required for a market-neutral cross-sectional test.");
  const clean={};
  for(const symbol of symbols) {
    const x=symbolToBars[symbol];
    if(!Array.isArray(x))throw new Error("No historical series for "+symbol);
    const byDate=new Map();
    for(const b of x) {
      const date=String(b.date||b.datetime||b.timestamp||"").slice(0,10);
      const row={date,open:Number(b.open),high:Number(b.high),low:Number(b.low),close:Number(b.close),volume:Number(b.volume)};
      if(/^\d{4}-\d{2}-\d{2}$/.test(date) && ["open","high","low","close"].every(k=>valid(row[k]) && row[k]>0)
        && valid(row.volume)&&row.volume>=0 && row.high>=row.low && row.high>=Math.max(row.open,row.close)
        && row.low<=Math.min(row.open,row.close)) byDate.set(date,row);
    }
    clean[symbol]=byDate;
  }
  const dates=[...clean[symbols[0]].keys()].filter(d=>symbols.every(s=>clean[s].has(d))).sort();
  if(dates.length<125)throw new Error("Insufficient overlapping daily bars ("+dates.length+"). Need at least 125 verified common sessions.");
  const trimmed=dates.slice(-850);
  return {symbols,dates:trimmed,bars:Object.fromEntries(symbols.map(s=>[s,trimmed.map(d=>clean[s].get(d))]))};
}
function calcMetrics(returns, benchmark, curve, turnover, ic) {
  const sample=returns.length,m=avg(returns),sd=stdev(returns);
  const downside=Math.sqrt(avg(returns.map(r=>Math.min(0,r)**2)));
  const end=curve.at(-1).strategy;
  let peak=1,dd=0;
  for(const p of curve){peak=Math.max(peak,p.strategy);dd=Math.min(dd,p.strategy/peak-1);}
  const betaDen=variance(benchmark);
  const active=returns.map((r,i)=>r-benchmark[i]);
  const b=betaDen>1e-12?covariance(returns,benchmark)/betaDen:null;
  return {
    sharpe:sd>1e-12?m/sd*Math.sqrt(252):null,
    sortino:downside>1e-12?m/downside*Math.sqrt(252):null,
    totalReturn:(end-1)*100,
    annReturn:(Math.pow(end,252/sample)-1)*100,
    drawdown:dd*100,
    volatility:sd*Math.sqrt(252)*100,
    turnover:avg(turnover)*100,
    hitRate:returns.filter(r=>r>0).length/sample*100,
    tStat:sd>1e-12?m/sd*Math.sqrt(sample):null,
    beta:b,
    trackingError:stdev(active)*Math.sqrt(252)*100,
    informationRatio:stdev(active)>1e-12?avg(active)/stdev(active)*Math.sqrt(252):null,
    meanIC:ic.length?avg(ic):null,
    icIR:ic.length>2&&stdev(ic)>1e-12?avg(ic)/stdev(ic):null,
    observations:sample,
  };
}
export function runAlphaResearch(formula, symbolToBars, costBps=5) {
  if(!valid(Number(costBps))||Number(costBps)<0||Number(costBps)>100)throw new Error("Trading costs must be 0–100 bps per dollar traded.");
  const ast=parseFormula(formula);
  const data=normalizeInput(symbolToBars);
  const signal=evaluateFormula(ast,data);
  let previous=Object.fromEntries(data.symbols.map(s=>[s,0]));
  let equity=1,benchEquity=1;
  const curve=[], daily=[],bench=[],turnover=[],informationCoefficients=[],yearly=new Map();
  const daySeries=[];
  for(let t=1;t<data.dates.length-2;t++){
    // Information observed at close(t), first executable open is t+1.
    const validSignals=data.symbols.map((s,j)=>({s,score:signal[j][t]})).filter(p=>valid(p.score));
    if(validSignals.length<4)continue;
    validSignals.sort((a,b)=>b.score-a.score || a.s.localeCompare(b.s));
    const n=Math.max(1,Math.floor(validSignals.length/3)), weight=1/n;
    const positions=Object.fromEntries(data.symbols.map(s=>[s,0]));
    validSignals.slice(0,n).forEach(p=>positions[p.s]=weight);
    validSignals.slice(-n).forEach(p=>positions[p.s]=-weight);
    const future={};
    for(const s of data.symbols){
      const first=data.bars[s][t+1].open,next=data.bars[s][t+2].open;
      future[s]=next/first-1;
    }
    const traded=data.symbols.reduce((sum,s)=>sum+Math.abs(positions[s]-previous[s]),0);
    const gross=data.symbols.reduce((sum,s)=>sum+positions[s]*future[s],0);
    const net=gross-traded*Number(costBps)/10000;
    if(!valid(net)||net<=-1)throw new Error("Return path invalid. Check the input price series for splits/corporate actions.");
    const benchmarkRet=avg(data.symbols.map(s=>future[s]));
    equity*=1+net;
    benchEquity*=1+benchmarkRet;
    const date=data.dates[t+2];
    curve.push({date,strategy:equity,benchmark:benchEquity,daily:net,turnover:traded/2});
    daySeries.push({date,scoreCount:validSignals.length});
    daily.push(net);bench.push(benchmarkRet);turnover.push(traded/2);
    const xs=validSignals.map(p=>p.score),ys=validSignals.map(p=>future[p.s]);
    const sr=xs.map(v=>percentRank(xs,v)), yr=ys.map(v=>percentRank(ys,v));
    const ic=correlation(sr,yr);
    if(valid(ic))informationCoefficients.push(ic);
    const year=date.slice(0,4);
    if(!yearly.has(year)) yearly.set(year,{days:0,returnFactor:1,benchmarkFactor:1});
    const item=yearly.get(year);
    item.days++;item.returnFactor*=1+net;item.benchmarkFactor*=1+benchmarkRet;
    previous=positions;
  }
  if(daily.length<30)throw new Error("Not enough non-missing alpha signals for analysis (need 30 evaluated days). Try a shorter rolling window.");
  const metrics=calcMetrics(daily,bench,curve,turnover,informationCoefficients);
  const byYear=[...yearly.entries()].map(([year,v])=>({
    year,days:v.days,return:(v.returnFactor-1)*100,benchmark:(v.benchmarkFactor-1)*100,
  }));
  const complete=data.symbols.every(s=>data.bars[s].length===data.dates.length);
  return {
    symbols:data.symbols,period:{first:curve[0].date,last:curve.at(-1).date,aligned:data.dates.length},
    metrics,curve,byYear,informationCoefficients:informationCoefficients.length,
    checks:[
      {label:"Formula parsed without code execution",status:"pass"},
      {label:"OHLCV prices aligned by common session",status:complete?"pass":"fail"},
      {label:"Signals lagged until next session open",status:"pass"},
      {label:"Cross-sectional breadth (≥ 4 symbols)",status:data.symbols.length>=4?"pass":"fail"},
      {label:"Evaluated days (≥ 100)",status:daily.length>=100?"pass":"warning"},
      {label:"Trading fees included",status:"pass"},
      {label:"Point-in-time constituents / corporate actions",status:"warning"},
      {label:"Universe survivorship and independent OOS validation",status:"pending"},
    ],
  };
}
