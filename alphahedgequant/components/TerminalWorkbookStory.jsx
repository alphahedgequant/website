"use client";
import {useMemo,useState} from "react";
import {WORKBOOK_STORIES,WORKBOOK_TICKERS} from "@/lib/terminalWorkbookStory";
const fmt=n=>Number(n).toLocaleString("en-IN",{maximumFractionDigits:1});
const pct=n=>Number.isFinite(n)?(n>=0?"+":"")+n.toFixed(1)+"%":"—";
function growth(a,b){return a>0?(b/a-1)*100:null}
export default function TerminalWorkbookStory({symbol,onChoose,onForecast}){
 const data=WORKBOOK_STORIES[symbol];
 const [years,setYears]=useState(5);
 const details=useMemo(()=>{if(!data)return null;const h=data.years,first=h[0],last=h.at(-1),prior=h.at(-2),g=growth(prior[1],last[1]),pg=growth(prior[2],last[2]),margin=last[1]>0?last[2]/last[1]*100:null,pm=prior[1]>0?prior[2]/prior[1]*100:null;const cagr=first[1]>0?(Math.pow(last[1]/first[1],1/(last[0]-first[0]))-1)*100:null;return {last,prior,g,pg,margin,pm,cagr}},[data]);
 if(!data)return null;
 const {last,prior,g,pg,margin,pm,cagr}=details;
 const finance=/Bank|Finance|Finserv/i.test(data.name);
 const scenarios=[{name:"Bear",shift:-5,marginShift:-2},{name:"Base",shift:0,marginShift:0},{name:"Bull",shift:5,marginShift:2}];
 const baseGrowth=Math.max(-15,Math.min(25,cagr??0));
 return <section className="qt-workbook-story" aria-label="Research narrative from uploaded financial history">
 <div className="qt-workbook-source">FINANCIAL HISTORY / USER-UPLOADED WORKBOOK / NOT INDEPENDENTLY VERIFIED</div>
 <h3>{data.name}: the numbers behind the business</h3>
 <p>Over FY{data.years[0][0]}–FY{last[0]}, reported spreadsheet revenue moved from <mark>₹{fmt(data.years[0][1])} crore</mark> to <mark>₹{fmt(last[1])} crore</mark>. This represents approximately <mark>{pct(cagr)}</mark> annualised revenue growth across the available period. Figures are from an uploaded workbook, not a validated primary filing.</p>
 <div className="qt-workbook-kpis">
 {[[ "FY"+last[0]+" revenue","₹"+fmt(last[1])+" Cr"],["Revenue YoY",pct(g)],["FY"+last[0]+" net profit","₹"+fmt(last[2])+" Cr"],["Net profit YoY",pct(pg)],["Net profit margin",margin==null?"—":margin.toFixed(1)+"%"]].map(([name,value])=><div key={name}><small>{name}</small><strong>{value}</strong></div>)}
 </div>
 <h4>What changed?</h4>
 <p>Revenue {g>=0?"expanded":"contracted"} <mark>{pct(g)}</mark> in FY{last[0]} compared with FY{prior[0]}; net profit {pg>=0?"increased":"decreased"} <mark>{pct(pg)}</mark>. Net profit margin moved from {pm?.toFixed(1)??"—"}% to {margin?.toFixed(1)??"—"}%. {g>=0&&pg<0?"Profit growth lagged sales; investigate costs, one-offs and segment mix.":g<0&&pg>0?"Profit improved despite weaker sales; investigate margins, tax and one-offs.":g>=0&&pg>=0?"Both revenue and profit grew, but sustainability still depends on operating drivers and cash conversion.":"Both sales and profit weakened; investigate demand, pricing and costs."}</p>
 <h4>From history to forecasts</h4>
 <p>{finance?"For banks and lenders, interest income and reported profit do not directly translate into industrial free cash flow. Forecast credit growth, net interest margin, credit costs, capital adequacy, and ROE using a financial-institution model.":"For a non-financial business, start with growth, operating margins, reinvestment needs, taxes and cost of capital. Net profit margin is a diagnostic, not a substitute for EBIT margin or free cash flow."} The scenarios below are <strong>illustrations, not analyst targets</strong>.</p>
 <div className="qt-workbook-scenarios">{scenarios.map(sc=>{const rate=Math.max(-25,Math.min(35,baseGrowth+sc.shift));const sales=last[1]*Math.pow(1+rate/100,years);return <article key={sc.name}><small>{sc.name} scenario</small><strong>₹{fmt(sales)} Cr</strong><span>Illustrative FY{last[0]+years} revenue</span><span>Annual growth assumption: {rate.toFixed(1)}%</span><span>Net profit margin sensitivity: {sc.marginShift>0?"+":""}{sc.marginShift} pp (not applied to revenue)</span></article>})}</div>
 <label className="qt-workbook-years">Scenario horizon <select value={years} onChange={e=>setYears(Number(e.target.value))}><option value={3}>3 years</option><option value={5}>5 years</option></select></label>
 <p className="qt-workbook-caution">Method: future revenue = latest annual revenue × (1 + assumed annual growth) ^ years. Base growth uses the uploaded history's revenue CAGR, capped at −15% to +25%; bear/bull vary by ±5 percentage points. These are mechanical sensitivities, not price targets or validated forecasts. Do not use FCFF valuation for banks/insurers.</p>
 <button type="button" onClick={onForecast}>Open detailed valuation assumptions</button>
 <h4>Explore uploaded companies</h4>
 <nav aria-label="Companies with uploaded financial history" className="qt-workbook-tickers">{WORKBOOK_TICKERS.map(t=><button type="button" aria-current={symbol===t?"page":undefined} key={t} onClick={()=>onChoose(t)}>{t}</button>)}</nav>
 </section>
}
