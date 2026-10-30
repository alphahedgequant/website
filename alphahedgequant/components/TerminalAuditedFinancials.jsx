"use client";
import {VERIFIED_FINANCIAL_SNAPSHOTS,statementCheck} from "@/lib/terminalAuditedSeed";
const display=n=>n===null||n===undefined||!Number.isFinite(Number(n))?"—":Number(n).toLocaleString("en-IN",{maximumFractionDigits:0});
const categoryMeta={
 income:{title:"Consolidated income statement",labels:[
 ["grossSalesAndServices","Gross sales & services"],["revenueFromOperations","Revenue from operations (net of GST)"],["otherIncome","Other income"],["totalIncome","Total income"],["totalExpenses","Total expenses"],["profitBeforeTax","Profit before tax"],["taxExpense","Tax expense"],["profitForYear","Profit for the year"]]},
 balance:{title:"Consolidated balance sheet",labels:[
 ["nonCurrentAssets","Non-current assets"],["currentAssets","Current assets"],["totalAssets","Total assets"],["cashAndEquivalents","Cash and cash equivalents"],["shortTermBorrowings","Current borrowings"],["longTermBorrowings","Non-current borrowings"],["currentLiabilities","Current liabilities"],["nonCurrentLiabilities","Non-current liabilities"],["totalLiabilities","Total liabilities"],["totalEquity","Total equity"]]},
 cash:{title:"Consolidated cash-flow statement",labels:[
 ["operatingCashFlow","Net cash from operations"],["investingCashFlow","Net cash from investing"],["financingCashFlow","Net cash from financing"],["changeInCash","Change in cash & equivalents"],["closingCash","Closing cash & equivalents"]]}
};
export default function TerminalAuditedFinancials({symbol,view="company"}){
 const doc=VERIFIED_FINANCIAL_SNAPSHOTS[symbol];
 if(!doc)return <section className="qt-panel qt-audited"><div className="qt-panel-top"><strong>PRIMARY-FILING FINANCIAL DATABASE</strong><span>Coverage in progress</span></div><p className="qt-audited-empty">No directly cross-checked audited statement has been imported for {symbol}. Third-party financial ratios above remain separate. Connect an annual-report source and verify statement figures before displaying audited values.</p><p className="qt-audited-empty"><a href="https://www.nseindia.com/companies-listing/corporate-filings-annual-reports-xbrl" target="_blank" rel="noopener noreferrer">Find company annual filings on NSE ↗</a></p></section>;
 const problems=statementCheck(doc),valid=problems.length===0;
 const getP=key=>doc.statementPages[key]||"—";
 return <section className="qt-audited">
 <div className="qt-audited-bar"><div><span>PRIMARY SOURCE / {doc.company} / CONSOLIDATED</span><strong>{doc.financialYear} audited statement snapshot</strong></div><span className={valid?"qt-audited-valid":"qt-audited-warning"}>{valid?"✓ RECONCILIATIONS PASS":"! REVIEW REQUIRED"}</span></div>
 <div className="qt-audited-source">Source: <a href={doc.source.url} target="_blank" rel="noopener noreferrer">{doc.source.title} ↗</a> · Figures in ₹ crore · PDF citations use printed report page numbers · Manual cross-check; not a continuous NSE/XBRL feed.</div>
 {problems.length>0&&<p className="qt-audited-warning">{problems.join(" · ")}</p>}
 {view==="company"?<div className="qt-audited-tables">{Object.entries(categoryMeta).map(([cat,meta])=><div className="qt-panel" key={cat}><div className="qt-panel-top"><strong>{meta.title.toUpperCase()}</strong><span>Report pages {getP(cat)}</span></div><div className="qt-fin-scroll"><table className="qt-financial-table"><thead><tr><th>Metric · ₹ Cr</th>{doc.years.map(y=><th key={y.period}>{y.period}</th>)}</tr></thead><tbody>{meta.labels.map(([key,label])=><tr key={key}><td>{label}</td>{doc.years.map(y=><td key={y.period}>{display(y[cat][key])}</td>)}</tr>)}</tbody></table></div></div>)}</div>:<div className="qt-panel"><div className="qt-panel-top"><strong>EXTERNAL-REVENUE BUSINESS MIX</strong><span>FY2025-26 · Report pp. {getP("segments")}</span></div><div className="qt-audited-mix"><p>{doc.segmentMix.note}</p>{doc.segmentMix.rows.map(x=>{const pct=x.amount/doc.segmentMix.denominator*100;return <div key={x.name} className="qt-mix-row"><div><strong>{x.name}</strong><span>₹{display(x.amount)} Cr · {pct.toFixed(2)}%</span></div><div className="qt-mix-track"><div style={{width:pct+"%"}}/></div></div>})}<div className="qt-mix-total"><strong>Total external turnover</strong><span>₹{display(doc.segmentMix.denominator)} Cr · 100.00%</span></div></div></div>}
 <p className="qt-audited-caution">{view==="company"?"FY2025 comparative figures are presented in the FY2025–26 audited consolidated report. This is not yet a 10-year financial database.":doc.note} <a href={doc.source.url} target="_blank" rel="noopener noreferrer">Inspect original evidence ↗</a></p>
 </section>;
}
