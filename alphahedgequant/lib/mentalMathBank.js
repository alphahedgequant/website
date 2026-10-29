// 12 independently enumerable mental-math families, 1,200 distinct prompts per family.
// No network, test bank uploads, or stored answer keys required.
export const MATH_TYPES=[
 {id:"addition",label:"Addition"},
 {id:"subtraction",label:"Subtraction"},
 {id:"multiplication",label:"Multiplication"},
 {id:"division",label:"Exact division"},
 {id:"percent",label:"Percent of a number"},
 {id:"roots",label:"Square roots"},
 {id:"squares",label:"Squares"},
 {id:"percentLarge",label:"Percentage of hundreds"},
 {id:"increase",label:"Percentage increase"},
 {id:"divisionQuick",label:"Quick division"},
 {id:"eleven",label:"Multiply by 11"},
 {id:"decrease",label:"Percentage decrease"}
];
export const QUESTIONS_PER_TYPE=1200;
export function mathExercise(type,index,difficulty="Mixed"){
 if(!Number.isInteger(type)||type<0||type>=MATH_TYPES.length)throw Error("Invalid type");
 if(!Number.isInteger(index)||index<0||index>=QUESTIONS_PER_TYPE)throw Error("Invalid index");
 const a=index%40,b=Math.floor(index/40),boost=difficulty==="Hard"?3:difficulty==="Easy"?1:2;
 const p=5*(a+2),q=5*(b+2);
 const number=(q,answer)=>({q,answer,type:MATH_TYPES[type].id});
 switch(type){
 case 0:{const x=boost*(a+12),y=boost*(b+21);return number(`${x} + ${y}`,x+y)}
 case 1:{const x=boost*(a+32),y=boost*(b+2);return number(`${x+y} − ${x}`,y)}
 case 2:{const x=a+7,y=boost*(b+3);return number(`${x} × ${y}`,x*y)}
 case 3:{const d=a+2,v=boost*(b+2);return number(`${d*v} ÷ ${d}`,v)}
 case 4:{const pct=a+1,n=100*(b+2)*boost;return number(`${pct}% of ${n}`,pct*n/100)}
 case 5:{const root=2+index+(boost-1)*1200;return number(`√${root*root}`,root)}
 case 6:{const x=11+index+(boost-1)*1200;return number(`${x}²`,x*x)}
 case 7:{const pct=5*(a+1),n=100*(b+2)*boost;return number(`${pct}% of ${n}`,pct*n/100)}
 case 8:{const n=20*(a+2)*boost,pct=b+1;return number(`${n} + ${pct}%`,n*(100+pct)/100)}
 case 9:{const d=a+2,v=(b+2)*boost;return number(`${d*v} ÷ ${d}`,v)}
 case 10:{const n=10+index+(boost-1)*1200;return number(`${n} × 11`,n*11)}
 case 11:{const n=100*(a+2)*boost,pct=b+1;return number(`${n} − ${pct}%`,n*(100-pct)/100)}
 }
}
export function nextMentalExercise(selection,difficulty,counters){
 const types=selection==="all"?MATH_TYPES.map((_,i)=>i):[MATH_TYPES.findIndex(t=>t.id===selection)].filter(i=>i>=0);
 if(!types.length)throw Error("Unknown question category");
 const type=types[Math.floor(Math.random()*types.length)];
 const ordinal=counters[type]||0;
 // 37 is coprime to 1200, so every block of 1200 yields all 1200 without duplicates.
 const index=(Math.floor(ordinal/1200)*0+((ordinal*37+179)%1200));
 counters[type]=ordinal+1;
 return mathExercise(type,index,difficulty);
}
