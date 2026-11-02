// Derived directly from user-uploaded workbook financial data.
// These figures are NOT independently audited or verified.
import workbook from "./terminalWorkbookData.json";
const sectors={
"BAJAJ-AUTO":"Auto","ASIANPAINT":"Paints","APOLLOHOSP":"Healthcare",
"BEL":"Defence electronics","TCS":"IT services","BAJAJFINSV":"Financial services",
"BAJFINANCE":"Lending","BHARTIARTL":"Telecom","AXISBANK":"Banking",
"ADANIENT":"Diversified infrastructure","ADANIPORTS":"Ports and logistics"
};
export const WORKBOOK_STORIES=Object.fromEntries(
 Object.entries(workbook).map(([symbol,company])=>[
  symbol,{name:company.name,sector:sectors[symbol]||"Unclassified",
   years:(company.annual||[]).filter(row=>Number.isFinite(row.sales)&&Number.isFinite(row.pat))
     .map(row=>[Number(row.period.slice(0,4)),row.sales,row.pat])
     .sort((a,b)=>a[0]-b[0])}
 ])
);
export const WORKBOOK_TICKERS=Object.keys(WORKBOOK_STORIES).sort();
