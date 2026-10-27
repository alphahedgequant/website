"use client";
import { useState } from "react";

const n=(x,d=2)=>Number(x).toLocaleString("en-IN",{maximumFractionDigits:d});
const typeFor=m=>{
 if(m.id==="O1"||m.id==="G3")return "iv";
 if(m.id==="O2")return "gamma";
 if(m.id==="G5")return "volume";
 if(m.id==="R9")return "drawdown";
 if(m.id==="G4")return "portfolio";
 if(m.cat==="risk")return "risk";
 if(m.cat==="vol")return "vol";
 if(m.cat==="banking")return "credit";
 if(m.cat==="statarb")return "spread";
 if(m.cat==="ml")return "ml";
 if(m.cat==="options")return "options";
 return "trend";
};
const configs={
 iv:{title:"IV compared with historical volatility",a:"Implied volatility (%)",b:"Past realised volatility (%)",start:[30,20],min:[1,1],max:[90,90],help:"A positive difference is not an option-selling profit estimate.",calculate:(a,b)=>({value:n(a-b,1)+" percentage points",meaning:a>b?"Options imply more volatility than the selected historical level.":a<b?"Options imply less volatility than the selected historical level.":"The two levels match."})},
 gamma:{title:"Illustrative gamma sensitivity",a:"Hypothetical signed gamma units",b:"Underlying move (%)",start:[20,2],min:[-100,-10],max:[100,10],help:"Signed dealer exposure is not observable from open interest alone; this is a sensitivity illustration, not a gamma-flip estimator.",calculate:(a,b)=>({value:n(a*b,1)+" relative units",meaning:"The sign and magnitude change with the assumed position and spot move. No actual dealer positioning is inferred."})},
 volume:{title:"Volume compared with the same time of day",a:"Today's cumulative volume (thousands)",b:"Historical median by now (thousands)",start:[200,100],min:[0,1],max:[1000,1000],help:"Both values refer to the same point during the trading session.",calculate:(a,b)=>({value:n(a/b,2)+"× RVOL",meaning:a/b>1?"Activity is above the chosen time-matched baseline.":"Activity is at or below the chosen baseline. Neither says whether prices will rise."})},
 drawdown:{title:"Portfolio loss and required recovery",a:"Previous portfolio peak (₹)",b:"Current portfolio value (₹)",start:[100,75],min:[1,1],max:[500,500],help:"Set the current value at or below the prior peak to model a drawdown.",calculate:(a,b)=>({value:n((Math.min(b,a)/a-1)*100,1)+"% drawdown",meaning:b<a?"Recovery from current value needs "+n((a/b-1)*100,1)+"% gain.":"There is no drawdown from the chosen peak."})},
 portfolio:{title:"Two-asset diversification illustration",a:"Asset correlation (× 100)",b:"Weight in asset A (%)",start:[20,50],min:[-100,0],max:[100,100],help:"Assumes two assets each have 20% annual volatility; actual optimisation needs historical returns and constraints.",calculate:(a,b)=>{const w=b/100,c=a/100;return{value:n(20*Math.sqrt(w*w+(1-w)*(1-w)+2*w*(1-w)*c),1)+"% hypothetical volatility",meaning:"Lower correlation can reduce combined volatility; this simplified example is not an optimal portfolio allocation."}}},
 risk:{title:"Normal-distribution one-day risk illustration",a:"Position value (₹ thousands)",b:"Daily volatility (%)",start:[100,2],min:[1,0.1],max:[1000,15],help:"Illustrative 95% one-day normal VaR only; real stress losses can substantially exceed this.",calculate:(a,b)=>({value:"₹"+n(a*1000*b/100*1.645,0)+" illustrative VaR",meaning:"Under a normal zero-mean model, this is the estimated one-day 95% loss threshold; it is not a maximum loss."})},
 vol:{title:"EWMA volatility response",a:"Yesterday's variance proxy (volatility %)",b:"Latest absolute daily return (%)",start:[2,4],min:[0,0],max:[12,20],help:"Uses EWMA decay λ = 0.94 to illustrate volatility updating, not a fitted GARCH forecast.",calculate:(a,b)=>({value:n(Math.sqrt(0.94*a*a+0.06*b*b),2)+"% updated proxy",meaning:"Larger shocks increase the volatility estimate. Specific models in this section have different assumptions and parameters."})},
 credit:{title:"Expected credit loss example",a:"Probability of default (%)",b:"Loss given default (%)",start:[3,45],min:[0,0],max:[100,100],help:"Assumes a ₹1,00,000 exposure at default. Banking ratios beyond credit loss require separate inputs.",calculate:(a,b)=>({value:"₹"+n(100000*a/100*b/100,0)+" expected loss",meaning:"PD × LGD × exposure measures modelled expected loss, not a precise prediction for a borrower."})},
 spread:{title:"Spread z-score illustration",a:"Current spread",b:"Long-run average spread",start:[115,100],min:[0,0],max:[200,200],help:"Assumes spread standard deviation is 10 units. Cointegration or mean reversion has NOT been tested.",calculate:(a,b)=>({value:n((a-b)/10,2)+" z-score",meaning:"A high or low z-score flags deviation; it does not guarantee the spread will revert."})},
 ml:{title:"Simple probability classifier",a:"Starting probability (%)",b:"Signal adjustment (percentage points)",start:[50,10],min:[0,-40],max:[100,40],help:"Not a trained machine-learning model; for illustration of how inputs affect a forecast probability.",calculate:(a,b)=>({value:n(Math.min(100,Math.max(0,a+b)),1)+"% illustrative probability",meaning:"A probability is not a trade or guaranteed outcome. Real models require training, calibration and out-of-sample tests."})},
 options:{title:"Option scenario: underlying move",a:"Delta (× 100)",b:"Price change (₹)",start:[50,10],min:[-100,-100],max:[100,100],help:"First-order delta approximation only; excludes gamma, vega, theta, premium and contract multiplier.",calculate:(a,b)=>({value:"₹"+n(a/100*b,2)+" approximate change",meaning:"A neutral delta at one instant does not remove the risk of subsequent price and volatility changes."})},
 trend:{title:"Simple momentum illustration",a:"Earlier price (₹)",b:"Later price (₹)",start:[100,112],min:[1,1],max:[300,300],help:"Illustrates past price change only, not a momentum backtest or predicted future return.",calculate:(a,b)=>({value:n((b/a-1)*100,1)+"% past change",meaning:b>a?"This period trended up; past performance does not establish future momentum.":"This period did not rise; regime and lookback choices still matter."})}
};
export default function ModelPlayground({model}){
 const type=typeFor(model), config=configs[type];
 const [a,setA]=useState(config.start[0]),[b,setB]=useState(config.start[1]);
 const result=config.calculate(a,b);
 return <div className="rounded-xl border border-amber/30 p-4 my-4" aria-label={model.name+" interactive example"}>
   <div className="flex flex-wrap gap-2 items-center justify-between mb-3"><p className="font-semibold text-sm text-body">Try an example: {config.title}</p><span className="text-[10px] rounded border border-line px-2 py-1 text-muted">Hypothetical · Not live</span></div>
   {[[config.a,a,setA,config.min[0],config.max[0]],[config.b,b,setB,config.min[1],config.max[1]]].map(([label,value,set,min,max],i)=><label key={i} className="block mb-4">
     <span className="flex justify-between gap-2 text-xs text-muted mb-2"><span>{label}</span><strong className="text-body font-mono">{value}</strong></span>
     <input aria-label={label} className="w-full accent-amber" type="range" value={value} min={min} max={max} step={type==="risk"&&i===1?0.1:1} onChange={e=>set(Number(e.target.value))}/>
   </label>)}
   <div className="rounded-lg bg-raised border border-line p-3">
     <p className="font-mono text-lg text-amber">{result.value}</p>
     <p className="text-xs text-body leading-relaxed mt-2">{result.meaning}</p>
   </div>
   <p className="text-xs text-muted leading-relaxed mt-3">{config.help}</p>
   <button type="button" onClick={()=>{setA(config.start[0]);setB(config.start[1]);}} className="mt-3 text-xs text-amber hover:underline">Reset example ↺</button>
 </div>;
}
