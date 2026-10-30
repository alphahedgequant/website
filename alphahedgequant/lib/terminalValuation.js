// Original AHQ scenario and intrinsic-value calculations.
// Financial data and user assumptions are strictly separated; model never invents facts.
const finite=x=>x!==""&&x!==null&&x!==undefined&&Number.isFinite(Number(x))?Number(x):null;
export function modelValue(input){
 const revenue=finite(input.revenueCr),growth=finite(input.growth),endGrowth=finite(input.stableGrowth),
  margin=finite(input.currentMargin),target=finite(input.targetMargin),salesCapital=finite(input.salesToCapital),
  tax=finite(input.tax),wacc=finite(input.wacc),terminalROIC=finite(input.terminalROIC);
 const fields=[revenue,growth,endGrowth,margin,target,salesCapital,tax,wacc,terminalROIC];
 if(fields.some(x=>x===null))return {ok:false,error:"Enter every required operating and discount-rate assumption."};
 if(revenue<=0||salesCapital<=0||growth<-.9||growth>2||endGrowth<-.05||endGrowth>.15||
 margin<-.5||margin>1||target<-.5||target>1||tax<0||tax>.6||
 wacc<=endGrowth||wacc<=0||wacc>.6||terminalROIC<=endGrowth||terminalROIC>1)
  return {ok:false,error:"Invalid inputs: revenue and sales/capital must be positive; WACC and terminal ROIC must exceed terminal growth."};
 let prior=revenue,pv=0,rows=[];
 for(let year=1;year<=5;year++){
  const g=growth+(endGrowth-growth)*(year-1)/4;
  const rev=prior*(1+g),operatingMargin=margin+(target-margin)*year/5;
  const ebit=rev*operatingMargin,nopat=ebit*(1-tax);
  const reinvestment=Math.max(0,rev-prior)/salesCapital;
  const fcff=nopat-reinvestment;
  const presentValue=fcff/(1+wacc)**year;
  pv+=presentValue;
  rows.push({year,revenueCr:rev,growth:g,margin:operatingMargin,ebitCr:ebit,nopatCr:nopat,reinvestmentCr:reinvestment,fcffCr:fcff,presentValueCr:presentValue});
  prior=rev;
 }
 const last=rows[rows.length-1],stableNOPAT=last.revenueCr*(1+endGrowth)*last.margin*(1-tax);
 const stableReinvestment=stableNOPAT*endGrowth/terminalROIC;
 const terminalFCFF=stableNOPAT-stableReinvestment;
 const terminalValue=terminalFCFF/(wacc-endGrowth),terminalPV=terminalValue/(1+wacc)**5;
 const enterpriseValueCr=pv+terminalPV;
 const netDebt=finite(input.netDebtCr),shares=finite(input.sharesCr);
 const equityValueCr=netDebt===null?null:enterpriseValueCr-netDebt;
 const fairValue=equityValueCr!==null&&shares!==null&&shares>0?equityValueCr/shares:null;
 return {ok:true,rows,enterpriseValueCr,operatingPVCr:pv,terminalPVCr:terminalPV,terminalWeight:enterpriseValueCr?terminalPV/enterpriseValueCr:null,
 equityValueCr,fairValue,terminalFCFFCr:terminalFCFF,netDebtKnown:netDebt!==null,sharesKnown:shares!==null&&shares>0};
}
export function scenarioCases(base){
 const growth=Number(base.growth),target=Number(base.targetMargin),wacc=Number(base.wacc);
 const specs=[["Bear",-0.04,-0.03,0.015],["Base",0,0,0],["Bull",0.04,0.03,-0.01]];
 return specs.map(([name,dg,dm,dw])=>{
 const result=modelValue({...base,growth:Math.max(-.9,growth+dg),targetMargin:Math.max(-.5,Math.min(1,target+dm)),wacc:wacc+dw});
 return {name,result,growth:growth+dg,targetMargin:target+dm,wacc:wacc+dw};
 });
}
export function sensitivity(base){
 const g=Number(base.stableGrowth),w=Number(base.wacc);
 const cols=[-.01,-.005,0,.005,.01].map(d=>g+d),rows=[-.02,-.01,0,.01,.02].map(d=>w+d);
 return {growths:cols,discounts:rows,cells:rows.map(rate=>cols.map(growth=>modelValue({...base,wacc:rate,stableGrowth:growth})))};
}

export function reverseGrowth(base,observedEquityCr){
 const equity=finite(observedEquityCr),debt=finite(base.netDebtCr);
 if(equity===null||debt===null||equity<=0)return {ok:false,error:"Observed market cap and analyst-supplied net debt required"};
 const target=equity+debt;
 const low=-.25,high=1.0;
 const bottom=modelValue({...base,growth:low}),top=modelValue({...base,growth:high});
 if(!bottom.ok||!top.ok)return {ok:false,error:"Model assumptions invalid"};
 const upward=top.enterpriseValueCr>bottom.enterpriseValueCr;
 const lo=upward?bottom.enterpriseValueCr:top.enterpriseValueCr,hi=upward?top.enterpriseValueCr:bottom.enterpriseValueCr;
 if(target<lo||target>hi)return {ok:false,error:"Observed enterprise value is outside the model's tested growth range (−25% to +100%)"};
 let a=low,b=high,mid=null;
 for(let i=0;i<65;i++){mid=(a+b)/2;const v=modelValue({...base,growth:mid});if(!v.ok)return {ok:false,error:v.error};
 if((v.enterpriseValueCr<target)===upward)a=mid;else b=mid;}
 mid=(a+b)/2;
 return {ok:true,impliedInitialGrowth:mid,observedEnterpriseCr:target};
}
