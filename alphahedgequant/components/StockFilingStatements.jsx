"use client";
import {useMemo,useState} from "react";

const TABS=[
  {id:"quarterly_pnl",label:"Quarterly P&L"},
  {id:"annual_pnl",label:"Annual P&L"},
  {id:"balance_sheet",label:"Balance Sheet"},
  {id:"cash_flow_ytd",label:"Cash Flow · YTD"},
  {id:"filings",label:"Filing Index"}
];
const FIELDS={
  quarterly_pnl:[
    ["period_end","Period"],["revenue","Revenue · ₹ Cr"],["other_income","Other income · ₹ Cr"],
    ["total_income","Total income · ₹ Cr"],["total_expenses","Total expenses · ₹ Cr"],
    ["pbt","PBT · ₹ Cr"],["tax","Tax · ₹ Cr"],["net_profit","Net profit · ₹ Cr"],
    ["net_profit_owners","Profit to owners · ₹ Cr"],["eps_basic","EPS · ₹"],["eps_basic_adj","Adjusted EPS · ₹"],
    ["n_versions","Versions"],["first_public_at","First public"]
  ],
  annual_pnl:[
    ["period_end","Financial year"],["fy_revenue","Revenue · ₹ Cr"],["fy_other_income","Other income · ₹ Cr"],
    ["fy_total_income","Total income · ₹ Cr"],["fy_total_expenses","Total expenses · ₹ Cr"],
    ["fy_pbt","PBT · ₹ Cr"],["fy_tax","Tax · ₹ Cr"],["fy_net_profit","Net profit · ₹ Cr"],
    ["fy_net_profit_owners","Profit to owners · ₹ Cr"],["fy_eps_basic","EPS · ₹"],["fy_eps_diluted","Diluted EPS · ₹"],
    ["n_versions","Versions"],["first_public_at","First public"]
  ],
  balance_sheet:[
    ["period_end","As of"],["total_assets","Total assets · ₹ Cr"],["equity","Equity · ₹ Cr"],
    ["equity_capital","Equity capital · ₹ Cr"],["other_equity","Other equity · ₹ Cr"],
    ["minority_interest","Minority interest · ₹ Cr"],["borrowings_noncurrent","Non-current borrowings · ₹ Cr"],
    ["borrowings_current","Current borrowings · ₹ Cr"],["total_borrowings","Total borrowings · ₹ Cr"],
    ["cash","Cash · ₹ Cr"],["inventories","Inventories · ₹ Cr"],["receivables","Receivables · ₹ Cr"],
    ["fixed_assets","Fixed assets · ₹ Cr"],["cwip","CWIP · ₹ Cr"],["current_assets","Current assets · ₹ Cr"],
    ["current_liabilities","Current liabilities · ₹ Cr"],["n_versions","Versions"],["first_public_at","First public"]
  ],
  cash_flow_ytd:[
    ["period_end","Period"],["cfo","Operating cash flow · ₹ Cr"],["cfi","Investing cash flow · ₹ Cr"],
    ["cff","Financing cash flow · ₹ Cr"],["capex","Capital expenditure · ₹ Cr"],
    ["n_versions","Versions"],["first_public_at","First public"]
  ]
};
const moneyFields=new Set(["revenue","other_income","total_income","total_expenses","pbt","tax","net_profit","net_profit_owners","fy_revenue","fy_other_income","fy_total_income","fy_total_expenses","fy_pbt","fy_tax","fy_net_profit","fy_net_profit_owners","total_assets","equity","equity_capital","other_equity","minority_interest","borrowings_noncurrent","borrowings_current","total_borrowings","cash","inventories","receivables","fixed_assets","cwip","current_assets","current_liabilities","cfo","cfi","cff","capex"]);
const epsFields=new Set(["eps_basic","eps_basic_adj","fy_eps_basic","fy_eps_diluted"]);
function show(v,key){
  if(v==null||v==="")return "—";
  if(key==="first_public_at"||key==="public_at")return String(v).replace("T"," ").slice(0,19);
  if(moneyFields.has(key)||epsFields.has(key))return Number(v).toLocaleString("en-IN",{maximumFractionDigits:2});
  if(typeof v==="number")return Number(v).toLocaleString("en-IN",{maximumFractionDigits:2});
  return String(v);
}
export default function StockFilingStatements({symbol,basis,history}){
  const [tab,setTab]=useState("quarterly_pnl");
  const records=Array.isArray(history?.records)?history.records:[];
  const filings=Array.isArray(history?.filings)?history.filings:[];
  const rows=useMemo(()=>{
    if(tab==="filings")return [...filings].sort((a,b)=>String(b.public_at||"").localeCompare(String(a.public_at||"")));
    return records.filter(r=>r.statement===tab).sort((a,b)=>String(b.period_end||"").localeCompare(String(a.period_end||"")));
  },[records,filings,tab]);
  const columns=tab==="filings"?[
    ["period_end","Period"],["public_at","Public at"],["revision","Revision"],["audited","Audited"],["parsed","Parsed"],["listing","Listing"],["url","Source"]
  ]:FIELDS[tab]||[];
  const counts=useMemo(()=>Object.fromEntries(TABS.map(t=>[t.id,records.filter(r=>r.statement===t.id).length]).concat([["filings",filings.length]])),[records,filings]);
  return <section className="card p-5 md:p-7 mt-6">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div><p className="eyebrow mb-1">PRIMARY-SOURCE FINANCIAL HISTORY</p><h2 className="font-display text-xl md:text-2xl text-body">Reported statements & NSE filings</h2>
        <p className="text-xs text-muted mt-1">{symbol} · {basis==="standalone"?"Standalone":"Consolidated"} basis · Source workbook: {history?.meta?.source_workbook||"NSE filings"}</p>
      </div>
      {history?.coverage&&<div className="text-xs text-muted text-right">{Number(history.coverage.quarters||0).toLocaleString("en-IN")} covered quarters<br/>{history.coverage.first_quarter||"—"} to {history.coverage.last_quarter||"—"}</div>}
    </div>
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {TABS.map(t=><button key={t.id} type="button" onClick={()=>setTab(t.id)} className={"shrink-0 rounded-lg border px-3 py-2 text-xs font-medium "+(tab===t.id?"border-amber/60 bg-amber/10 text-amber":"border-line text-muted hover:text-body")}>{t.label} <span className="opacity-70">({counts[t.id]||0})</span></button>)}
      <button type="button" onClick={()=>setTab("filings")} className={"shrink-0 rounded-lg border px-3 py-2 text-xs font-medium "+(tab==="filings"?"border-amber/60 bg-amber/10 text-amber":"border-line text-muted hover:text-body")}>Filing Index ({counts.filings||0})</button>
    </div>
    <div className="text-xs text-muted mb-3">Statement values are ₹ crore; EPS is ₹ per share. Cash-flow rows are cumulative year-to-date. The workbook preserves first-public timestamps and version counts but contains latest-revised statement values, not the complete point-in-time revision history.</div>
    {history?.status==="not_imported"?<div className="rounded-lg border border-line bg-raised p-5 text-sm text-muted">The NSE filing dataset has not been published yet.</div>
    :rows.length===0?<div className="rounded-lg border border-line bg-raised p-5 text-sm text-muted">No {tab==="filings"?"filing-index":tab.replaceAll("_"," ")} records are available for this symbol and reporting basis.</div>
    :<div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full text-xs whitespace-nowrap">
        <thead className="bg-raised text-muted"><tr>{columns.map(([key,label])=><th key={key} className="px-3 py-3 text-left font-semibold">{label}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>{
          const d=r.data||{};
          return <tr key={r.url||r.period_end||i} className="border-t border-line/70 hover:bg-raised/60">
            {columns.map(([key])=>{
              const value=key==="period_end"?r.period_end:key==="public_at"?r.public_at:key==="first_public_at"?r.first_public_at:key==="n_versions"?r.n_versions:key==="revision"?r.revision:key==="parsed"?r.parsed:key==="url"?r.url:key==="audited"?d.audited:key==="listing"?d.listing:d[key];
              return <td key={key} className="px-3 py-2.5 text-body/90">{key==="url"&&typeof value==="string"&&value.startsWith("https://nsearchives.nseindia.in/")?<a href={value} target="_blank" rel="noreferrer" className="text-[#5aa9f5] hover:underline">Open filing ↗</a>:key==="revision"||key==="parsed"||key==="audited"?value===true?"Yes":value===false?"No":"—":show(value,key)}</td>;
            })}
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </section>;
}
