import React from "react";

// Values reproduce the approved October 2026 publication. These charts are
// static research exhibits, not a live market feed.
const COLORS={navy:"#234669",gold:"#B8935A",ink:"#20334B",muted:"#64748A",teal:"#3D7895",red:"#A6504A",line:"#D9D2C6"};
const money=n=>Number(n).toFixed(2);
function Exhibit({number,title,dek,source,children,footnote}){
 return <figure className="macro-figure" aria-label={"Figure "+number+": "+title}>
  <figcaption className="macro-figure-head"><div><span>FIGURE {number} / OCTOBER 2026</span><h3>{title}</h3><p>{dek}</p></div></figcaption>
  <div className="macro-figure-visual">{children}</div>
  <div className="macro-figure-foot"><span>SOURCE: {source}</span>{footnote&&<span>{footnote}</span>}</div>
 </figure>;
}
function Label({x,y,children,anchor="middle",size=12,color=COLORS.muted,weight=500}){
 return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight} fontFamily="DM Sans, system-ui, sans-serif">{children}</text>;
}
function Grid({x=60,y=24,w=620,h=230,max=100,ticks=[0,25,50,75,100],formatter=x=>x}){
 return <g>{ticks.map(t=>{const pos=y+h-h*t/max;return <g key={t}><line x1={x} x2={x+w} y1={pos} y2={pos} stroke={COLORS.line} strokeWidth="1"/><Label x={x-12} y={pos+4} anchor="end" size={11}>{formatter(t)}</Label></g>})}</g>;
}
export function GoodsTradeChart(){
 const periods=[{label:"OCT ’25",exports:34.11,imports:76.69,deficit:42.58},{label:"SEP ’26",exports:44.40,imports:74.61,deficit:30.21},{label:"OCT ’26",exports:49.47,imports:89.35,deficit:39.88}];
 const yFor=v=>275-225*v/100;
 return <Exhibit number="01" title="Exports accelerated. The import bill remained larger." dek="The bars show merchandise exports and imports. The lower strip isolates the trade deficit, so values are not compared on misleading dual scales." source="Ministry of Commerce, October 2026 trade statement" footnote="USD billion · observations refer to different months, as labelled">
  <svg viewBox="0 0 760 446" role="img" aria-label="October 2025 exports 34.11 billion dollars and imports 76.69; September 2026 exports 44.40 and imports 74.61; October 2026 exports 49.47 and imports 89.35. Goods trade deficits are 42.58, 30.21 and 39.88 billion dollars respectively.">
   <Grid x={68} y={40} w={640} h={235} max={100}/>
   {periods.map((p,i)=>{const bx=175+i*206,eh=235*p.exports/100,ih=235*p.imports/100;return <g key={p.label}>
    <rect x={bx-55} y={275-eh} width="49" height={eh} rx="3" fill={COLORS.gold}/>
    <rect x={bx+8} y={275-ih} width="49" height={ih} rx="3" fill={COLORS.navy}/>
    <Label x={bx-30} y={269-eh} size={12} color={COLORS.ink} weight={700}>{money(p.exports)}</Label>
    <Label x={bx+32} y={269-ih} size={12} color={COLORS.ink} weight={700}>{money(p.imports)}</Label>
    <Label x={bx} y={299} size={12} color={COLORS.ink} weight={700}>{p.label}</Label>
    <rect x={bx-64} y={337} width="128" height="67" rx="7" fill="#F0ECE3" stroke={COLORS.line}/>
    <Label x={bx} y={360} size={10} color={COLORS.muted}>GOODS DEFICIT</Label>
    <Label x={bx} y={389} size={22} color={COLORS.red} weight={750}>{money(p.deficit)}</Label>
   </g>})}
   <rect x="477" y="11" width="15" height="10" rx="2" fill={COLORS.gold}/><Label x={498} y={20} anchor="start" size={11}>Exports</Label>
   <rect x="582" y="11" width="15" height="10" rx="2" fill={COLORS.navy}/><Label x={603} y={20} anchor="start" size={11}>Imports</Label>
  </svg>
 </Exhibit>;
}
export function ServicesBridgeChart(){
 const exports=40.51,imports=20.72,surplus=19.79,w=560,baseX=78,y=112;
 return <Exhibit number="02" title="Services partly cushion the goods deficit" dek="Estimated services exports can be read as two pieces: overseas services spending (imports) and the positive net balance (surplus)." source="Ministry of Commerce, provisional October 2026 services estimate" footnote="US$ billion · preliminary, not yet RBI's final October services data">
  <svg viewBox="0 0 760 288" role="img" aria-label="October services exports 40.51 billion US dollars, services imports 20.72 billion, and the provisional services surplus 19.79 billion.">
   <Label x="78" y="44" anchor="start" size={12} color={COLORS.muted} weight={700}>SERVICES EXPORTS</Label>
   <Label x="640" y="44" anchor="end" size={23} color={COLORS.ink} weight={750}>$40.51bn</Label>
   <rect x={baseX} y={y} width={w} height="58" rx="8" fill="#E8E0D1"/>
   <rect x={baseX} y={y} width={w*imports/exports} height="58" rx="6" fill={COLORS.navy}/>
   <rect x={baseX+w*imports/exports} y={y} width={w*surplus/exports} height="58" rx="6" fill={COLORS.gold}/>
   <Label x={baseX+(w*imports/exports)/2} y={147} color="#fff" size={16} weight={750}>$20.72bn</Label>
   <Label x={baseX+w*imports/exports+(w*surplus/exports)/2} y={147} color="#201C17" size={16} weight={750}>$19.79bn</Label>
   <rect x="82" y="207" width="12" height="12" fill={COLORS.navy}/><Label x="104" y="218" anchor="start" color={COLORS.ink}>Services imports</Label>
   <rect x="388" y="207" width="12" height="12" fill={COLORS.gold}/><Label x="409" y="218" anchor="start" color={COLORS.ink}>Services surplus</Label>
   <Label x="78" y="263" anchor="start" size={12}>This is a provisional trade estimate. Revisions are possible when RBI actuals arrive.</Label>
  </svg>
 </Exhibit>;
}
export function InflationChart(){
 const series=[{name:"HEADLINE CPI",values:[5.54,6.09],color:COLORS.navy},{name:"FOOD CPI",values:[7.74,8.94],color:COLORS.red}];
 const scale=v=>250-(v-4)*42;
 return <Exhibit number="03" title="Food prices are pulling inflation higher" dek="September–October year-on-year inflation. The chart uses a 4%–10% scale, clearly labelled to avoid overstating the change." source="MoSPI, October 2026 CPI release, published 12 November" footnote="Percentage change from the same month one year earlier">
  <svg viewBox="0 0 760 320" role="img" aria-label="Headline CPI moved from 5.54 percent in September to 6.09 percent in October; food CPI moved from 7.74 to 8.94 percent.">
   {[4,5,6,7,8,9,10].map(t=><g key={t}><line x1="107" y1={scale(t)} x2="651" y2={scale(t)} stroke={COLORS.line}/><Label x={85} y={scale(t)+4} size={11} anchor="end">{t}%</Label></g>)}
   {series.map(s=><g key={s.name}>
    <path d={"M220,"+scale(s.values[0])+" L525,"+scale(s.values[1])} stroke={s.color} strokeWidth="4" fill="none" strokeLinecap="round"/>
    {[220,525].map((x,i)=><g key={i}><circle cx={x} cy={scale(s.values[i])} r="8" fill={s.color} stroke="#fff" strokeWidth="2"/><Label x={x} y={scale(s.values[i])-19} color={s.color} size={15} weight={750}>{s.values[i].toFixed(2)}%</Label></g>)}
    <Label x="668" y={scale(s.values[1])+5} anchor="start" size={12} color={s.color} weight={750}>{s.name}</Label>
   </g>)}
   <Label x="220" y="282" size={12} weight={700} color={COLORS.ink}>SEP 2026</Label><Label x="525" y="282" size={12} weight={700} color={COLORS.ink}>OCT 2026</Label>
  </svg>
 </Exhibit>;
}
export function IndustrialChart(){
 const rows=[["Intermediate goods",12.2],["Capital goods",10.4],["Infrastructure & construction",7.2],["Consumer durables",6.0],["Consumer non-durables",1.4]];
 return <Exhibit number="04" title="Investment-linked industry leads household staples" dek="September industrial production growth. Longer bars represent faster output growth, not a larger share of GDP." source="MoSPI, September 2026 IIP release" footnote="Year-on-year change, % · preliminary September observations">
  <svg viewBox="0 0 760 360" role="img" aria-label="Industrial output growth: intermediate goods 12.2%, capital goods 10.4%, infrastructure and construction 7.2%, consumer durables 6.0%, and consumer nondurables 1.4%.">
   {rows.map(([name,val],i)=>{const y=34+i*59;return <g key={name}>
    <Label x={238} y={y+16} anchor="end" size={12} color={COLORS.ink} weight={600}>{name}</Label>
    <rect x="252" y={y} width="405" height="27" rx="3" fill="#E8E4DC"/>
    <rect x="252" y={y} width={405*val/14} height="27" rx="3" fill={i<2?COLORS.gold:COLORS.navy}/>
    <Label x={252+405*val/14+10} y={y+19} anchor="start" size={13} color={COLORS.ink} weight={750}>{val.toFixed(1)}%</Label>
   </g>})}
   <Label x="252" y="346" anchor="start" size={11}>0%</Label><Label x="657" y="346" anchor="end" size={11}>14%</Label>
  </svg>
 </Exhibit>;
}
export function GSTCompositionChart(){
 const domestic=159044,imports=72246,total=domestic+imports,frac=domestic/total,arc=2*Math.PI*96;
 return <Exhibit number="05" title="GST revenue: domestic activity and import-linked collections" dek="A proportional donut shows the October GST mix; growth rates are kept separate because value shares and growth rates are different measures." source="GSTN October 2026 revenue statement, 1 November" footnote="₹ crore, gross collections · tax receipts are not a direct measure of inflation-adjusted consumption">
  <svg viewBox="0 0 760 354" role="img" aria-label="Gross October GST of 231290 crore rupees: domestic collections 159044 crore, import-linked 72246 crore.">
   <circle cx="217" cy="165" r="96" stroke="#E6DED0" strokeWidth="36" fill="none"/>
   <circle cx="217" cy="165" r="96" stroke={COLORS.navy} strokeWidth="36" fill="none" strokeDasharray={arc*frac+" "+arc*(1-frac)} transform="rotate(-90 217 165)"/>
   <circle cx="217" cy="165" r="96" stroke={COLORS.gold} strokeWidth="36" fill="none" strokeDasharray={arc*(1-frac)+" "+arc*frac} strokeDashoffset={-arc*frac} transform="rotate(-90 217 165)"/>
   <Label x="217" y="154" color={COLORS.ink} size={12} weight={700}>OCT GROSS GST</Label><Label x="217" y="185" color={COLORS.ink} size={21} weight={750}>₹2.31L cr</Label>
   <rect x="405" y="72" width="14" height="14" rx="2" fill={COLORS.navy}/><Label x="429" y="85" anchor="start" color={COLORS.ink} size={14} weight={700}>Domestic GST</Label>
   <Label x="429" y="112" anchor="start" size={20} weight={750} color={COLORS.ink}>₹1,59,044 cr</Label><Label x="429" y="134" anchor="start" size={12}>68.8% of gross collections</Label><Label x="429" y="154" anchor="start" size={12}>+15.8% YoY</Label>
   <rect x="405" y="204" width="14" height="14" rx="2" fill={COLORS.gold}/><Label x="429" y="216" anchor="start" color={COLORS.ink} size={14} weight={700}>Import-linked GST</Label>
   <Label x="429" y="244" anchor="start" size={20} weight={750} color={COLORS.ink}>₹72,246 cr</Label><Label x="429" y="266" anchor="start" size={12}>31.2% of gross collections</Label><Label x="429" y="286" anchor="start" size={12}>+42.2% YoY</Label>
  </svg>
 </Exhibit>;
}
export function CashFlowChart(){
 const cases=[["CONSTRUCTIVE",832],["MARGIN SQUEEZE",589],["RISK-OFF",358]],max=900;
 return <Exhibit number="06" title="Sales growth is not the same as cash generation" dek="Illustrative free cash flow to the firm (FCFF) across three hypothetical business outcomes. These are scenarios, not live company forecasts or price targets." source="AlphaHedgeQuant scenario assumptions, not reported financial statistics" footnote="₹ crore · example company only, starting with ₹10,000 crore annual revenue">
  <svg viewBox="0 0 760 347" role="img" aria-label="Hypothetical free cash flow to the firm: constructive 832 crore, margin squeeze 589 crore and risk-off 358 crore.">
   <Grid x={73} y={26} w={614} h={222} max={900} ticks={[0,200,400,600,800]} formatter={x=>"₹"+x}/>
   {cases.map(([name,v],i)=>{const x=145+i*220,h=222*v/max;return <g key={name}>
    <rect x={x} y={248-h} width="104" height={h} rx="4" fill={i===0?COLORS.gold:i===1?COLORS.teal:COLORS.navy}/>
    <Label x={x+52} y={240-h} size={17} color={COLORS.ink} weight={750}>₹{v}</Label>
    <Label x={x+52} y={273} size={11} color={COLORS.ink} weight={700}>{name}</Label>
   </g>})}
   <Label x="73" y="318" anchor="start" size={12}>Different margins, reinvestment and capital costs change value even when revenue rises.</Label>
  </svg>
 </Exhibit>;
}
export function TransmissionChart(){
 const columns=[
  {title:"ECONOMY",nodes:["Exports / trade","Inflation / rates","Currency / energy"]},
  {title:"BUSINESS",nodes:["Sales volumes","Unit costs / margins","Working capital"]},
  {title:"VALUATION",nodes:["Free cash flow","Return on capital","Discount rate"]}
 ];
 return <Exhibit number="07" title="From macro headlines to company value" dek="Use this chain to test why the same macro news can affect two businesses differently. A headline matters only through its effect on durable cash flows and risk." source="AlphaHedgeQuant valuation framework" footnote="Conceptual transmission diagram · no numerical forecast implied">
  <svg viewBox="0 0 760 298" role="img" aria-label="Macro transmission pathway: economy indicators affect company sales, margins and working capital which affect free cash flow, return on capital and the discount rate.">
   {columns.map((col,i)=>{const x=32+i*251;return <g key={col.title}>
    <rect x={x} y="36" width="217" height="212" rx="9" fill={i===2?"#EEE4D2":"#F0EEE8"} stroke={COLORS.line}/>
    <Label x={x+108} y="63" color={i===2?COLORS.gold:COLORS.navy} size={12} weight={750}>{col.title}</Label>
    {col.nodes.map((node,j)=><g key={node}>
     <rect x={x+14} y={78+j*49} rx="4" width="189" height="37" fill={i===2?"#FFFEFA":"#FFFEFC"} stroke={COLORS.line}/>
     <Label x={x+108} y={101+j*49} color={COLORS.ink} size={12} weight={600}>{node}</Label>
    </g>)}
    {i<2&&<g><path d={"M"+(x+221)+" 140 l23 0 m-8 -7 l8 7 -8 7"} stroke={COLORS.gold} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/></g>}
   </g>})}
  </svg>
 </Exhibit>;
}
export function MacroFigures({section}){
 if(section==="trade")return <><GoodsTradeChart/><ServicesBridgeChart/></>;
 if(section==="inflation")return <InflationChart/>;
 if(section==="industry")return <IndustrialChart/>;
 if(section==="fiscal")return <GSTCompositionChart/>;
 if(section==="valuation")return <><CashFlowChart/><TransmissionChart/></>;
 return null;
}
