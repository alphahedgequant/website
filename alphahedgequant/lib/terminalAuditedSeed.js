// Verified source snapshot from Reliance Industries FY2025–26 Integrated Annual Report.
// Consolidated figures ONLY, in INR crore. Source pages refer to PRINTED report page numbers
// (PDF pages 100, 101, 103, and 129 in a 1-based PDF viewer).
// This is the first documented company snapshot, not universal company coverage.
const url="https://www.ril.com/reports/RIL-Integrated-Annual-Report-2025-26.pdf";
export const VERIFIED_FINANCIAL_SNAPSHOTS={
 RELIANCE:{
  company:"Reliance Industries Limited",financialYear:"FY2025-26",
  consolidation:"consolidated",currency:"INR",unit:"crore",
  source:{title:"Integrated Annual Report 2025-26",url,issuer:"Reliance Industries Limited",status:"manually_cross_checked"},
  years:[
   {period:"FY2025-26",end:"2026-03-31",
    income:{grossSalesAndServices:1175919,revenueFromOperations:1075675,otherIncome:28962,totalIncome:1104637,totalExpenses:981475,profitBeforeTax:123162,taxExpense:27552,profitForYear:95754},
    balance:{totalAssets:2178140,nonCurrentAssets:1583891,currentAssets:594249,totalEquity:1085866,totalLiabilities:1092274,currentLiabilities:541254,nonCurrentLiabilities:551020,cashAndEquivalents:145977,shortTermBorrowings:103670,longTermBorrowings:270751},
    cash:{operatingCashFlow:192113,investingCashFlow:-101089,financingCashFlow:-51549,changeInCash:39475,closingCash:145977}},
   {period:"FY2024-25",end:"2025-03-31",
    income:{grossSalesAndServices:1071174,revenueFromOperations:980136,otherIncome:17978,totalIncome:998114,totalExpenses:892097,profitBeforeTax:106017,taxExpense:25230,profitForYear:81309},
    balance:{totalAssets:1950121,nonCurrentAssets:1450851,currentAssets:499270,totalEquity:1009626,totalLiabilities:940495,currentLiabilities:453737,nonCurrentLiabilities:486758,cashAndEquivalents:106502,shortTermBorrowings:110631,longTermBorrowings:236899},
    cash:{operatingCashFlow:178703,investingCashFlow:-137535,financingCashFlow:-31891,changeInCash:9277,closingCash:106502}}
  ],
  statementPages:{income:"198–199",balance:"196–197",cash:"202–203",segments:"254–255"},
  segmentMix:{
   period:"FY2025-26",metric:"external_turnover",denominator:1175919,denominatorLabel:"Group gross value of sales and services (external turnover)",unit:"INR crore",
   note:"Shares are calculated on consolidated external turnover. NOT segment gross sales/revenue; intersegment transactions are excluded.",
   rows:[
    {name:"Oil to Chemicals",amount:658991},
    {name:"Oil and Gas",amount:19008},
    {name:"Retail",amount:365820},
    {name:"Digital Services",amount:59777},
    {name:"Others",amount:72323}
   ]
  },
  geography:[],customers:[],suppliers:[],
  note:"No named major-customer or major-supplier shares have been verified from this report. Their absence is missing data, not 0%. Revenue segmentation must not be confused with customer contribution."
 }
};
export function statementCheck(doc){
 const issues=[];
 for(const y of doc.years||[]){
  const a=y.balance,c=y.cash,p=y.income;
  if(Math.abs(a.totalAssets-(a.totalEquity+a.totalLiabilities))>1)issues.push(y.period+": accounting equation mismatch");
  if(Math.abs(a.totalAssets-(a.nonCurrentAssets+a.currentAssets))>1)issues.push(y.period+": asset split mismatch");
  if(Math.abs(a.totalLiabilities-(a.currentLiabilities+a.nonCurrentLiabilities))>1)issues.push(y.period+": liability split mismatch");
  if(Math.abs(c.operatingCashFlow+c.investingCashFlow+c.financingCashFlow-c.changeInCash)>1)issues.push(y.period+": cash flow reconciliation mismatch");
  if(Math.abs(c.closingCash-a.cashAndEquivalents)>1)issues.push(y.period+": closing cash mismatch");
  if(Math.abs(p.totalIncome-p.totalExpenses-p.profitBeforeTax)>1)issues.push(y.period+": earnings reconciliation mismatch");
 }
 const mix=doc.segmentMix;
 if(mix&&Math.abs(mix.rows.reduce((sum,r)=>sum+r.amount,0)-mix.denominator)>1)issues.push("Segments do not reconcile to group external turnover");
 return issues;
}
