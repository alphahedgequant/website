"use client";
import { useState } from "react";

// A research navigation layer over verified upstream fields.
// Never infer a broker opinion, concall transcript or filing from an absent source.
const explanations = {
  pe: ["P/E", "Price compared with earnings per share. Compare with peers; a low P/E does not automatically mean cheap."],
  roe: ["ROE", "How much profit a company produces relative to shareholder equity."],
  debtEquity: ["Debt / Equity", "Debt relative to shareholder equity. Meaning varies greatly across industries."],
  revenueGrowth: ["Sales growth", "The rate at which reported sales are changing."],
  operatingMargin: ["Operating margin", "The share of revenue remaining after operating costs."],
  netMargin: ["Net margin", "The share of revenue ultimately retained as profit."],
};
const categories = [
  {id:"overview",label:"Overview"},
  {id:"financials",label:"Financials"},
  {id:"technicals",label:"Technicals"},
  {id:"calls",label:"Concall & Ratings"},
  {id:"events",label:"Events & News"}
];
const fmt = (v, unit="") => v == null || !Number.isFinite(Number(v)) ? "Not available" : Number(v).toLocaleString("en-IN",{maximumFractionDigits:2}) + unit;
export default function StockResearchSections({data, market}) {
  const [tab,setTab]=useState("overview");
  const f=data.fundamentals || {};
  const isIndia=market==="NSE";
  const researchLinks = isIndia ? [
    {label:"NSE financial results",href:"https://www.nseindia.com/companies-listing/corporate-filings-financial-results"},
    {label:"NSE board meetings",href:"https://www.nseindia.com/companies-listing/corporate-filings-board-meetings"},
    {label:"NSE announcements",href:"https://www.nseindia.com/companies-listing/corporate-filings-announcements"}
  ] : [
    {label:"SEC EDGAR company filings",href:"https://www.sec.gov/edgar/search/"},
    {label:"NYSE listed companies",href:"https://www.nyse.com/listings_directory/stock"},
    {label:"Nasdaq company directory",href:"https://www.nasdaq.com/market-activity/stocks"}
  ];
  return <section className="card mt-5 p-5 md:p-7" aria-label="Company research center">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div><p className="eyebrow mb-2">Company research center</p><h2 className="font-display text-2xl md:text-3xl text-body">Understand {data.name || data.symbol}</h2>
        <p className="mt-2 text-sm text-muted">Plain-language context with clear separation between actual data and missing coverage.</p>
      </div>
      <span className="text-xs rounded-full border border-line px-3 py-1.5 text-muted">Data completeness varies by company</span>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-3 mb-5 border-b border-line" role="tablist" aria-label="Stock research topics">
      {categories.map(c=><button key={c.id} role="tab" type="button" aria-selected={tab===c.id} onClick={()=>setTab(c.id)}
        className={`px-3 py-2 whitespace-nowrap rounded-lg text-xs md:text-sm ${tab===c.id?"bg-raised text-amber font-semibold":"text-muted hover:text-body"}`}>{c.label}</button>)}
    </div>
    <div role="tabpanel">
      {tab==="overview" && <div className="grid gap-3 md:grid-cols-3">
        <Insight title="Business" value={data.sector || "Not provided"} explanation={data.industry ? `Industry: ${data.industry}` : "Sector classification is not available from this feed."}/>
        <Insight title="Valuation" value={fmt(f.pe)+" P/E"} explanation="P/E measures the price paid for each unit of earnings. Always compare with sector peers and earnings quality."/>
        <Insight title="Quality" value={fmt(f.roe,"%")+" ROE"} explanation="ROE indicates how efficiently shareholder equity is used to generate profit."/>
      </div>}
      {tab==="financials" && <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(explanations).map(([key,[name,meaning]])=><Insight key={key} title={name} value={fmt(f[key],["roe","revenueGrowth","operatingMargin","netMargin"].includes(key)?"%":"")} explanation={meaning}/>)}
        </div>
        <p className="mt-5 text-sm text-muted">Annual and quarterly revenue/profit charts appear further down this page when available. A complete audited income statement, balance sheet and cash-flow statement require a licensed filing-data feed; missing line items are not estimated.</p>
      </>}
      {tab==="technicals" && <div className="grid gap-3 md:grid-cols-3">
        <Insight title="Price" value={fmt(data.price ? data.price : null, "")} explanation={isIndia?"Quoted in INR":"Quoted in USD"}/>
        <Insight title="50-day average" value={fmt(f.sma50)} explanation="A rolling price trend measure, not an investment recommendation."/>
        <Insight title="200-day average" value={fmt(f.sma200)} explanation="A longer-term trend benchmark. Intraday signals and indicators may not be available."/>
      </div>}
      {tab==="calls" && <div className="grid gap-4 md:grid-cols-2">
        <Insight title="Analyst consensus" value={f.analystRec ? String(f.analystRec).replaceAll("_"," ").toUpperCase() : "Not available"} explanation={f.targetPrice != null ? `Mean target from the connected fundamentals feed: ${fmt(f.targetPrice)}. This is aggregated, not an attributed brokerage note.` : "No verified broker-by-broker call and target history is connected."}/>
        <Insight title="Earnings call transcripts" value="Source integration required" explanation="Transcript dates, speaker quotes and summaries will only appear once official or licensed transcripts are available. No fictional commentary is generated."/>
      </div>}
      {tab==="events" && <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">For board meetings, financial results, investor communications and significant news, consult the primary filing sources below. A dated, company-filtered events feed is not connected yet.</p>
        <div className="flex flex-wrap gap-3">
          {researchLinks.map(x=><a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer" className="btn-ghost !text-xs">{x.label} ↗</a>)}
        </div>
        <p className="text-xs text-muted">These links open official search or listing pages; they are not verified announcements specifically for {data.symbol}.</p>
      </div>}
    </div>
    <p className="text-[11px] font-mono text-muted mt-6 pt-4 border-t border-line">SOURCE: CONNECTED SCREENER / FUNDAMENTALS FEED · MARKET QUOTES MAY BE DELAYED OR STALE · UNAVAILABLE DATA IS NOT IMPLIED</p>
  </section>;
}
function Insight({title,value,explanation}) {
  return <div className="rounded-xl border border-line bg-raised p-4">
    <p className="text-xs uppercase tracking-widest font-mono text-muted">{title}</p>
    <p className="mt-2 text-lg font-semibold text-body break-words">{value}</p>
    <p className="mt-2 text-sm leading-relaxed text-muted">{explanation}</p>
  </div>;
}
