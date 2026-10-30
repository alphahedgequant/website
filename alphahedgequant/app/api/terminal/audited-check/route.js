import {VERIFIED_FINANCIAL_SNAPSHOTS,statementCheck} from "@/lib/terminalAuditedSeed";
export const dynamic="force-dynamic";
export function GET(req){
 const symbol=String(new URL(req.url).searchParams.get("symbol")||"RELIANCE").trim().toUpperCase();
 const dataset=VERIFIED_FINANCIAL_SNAPSHOTS[symbol];
 if(!dataset)return Response.json({ok:false,status:"not_imported",symbol,verifiedCoverage:0},{status:404});
 const problems=statementCheck(dataset);
 return Response.json({ok:problems.length===0,symbol,status:problems.length?"review_required":"source_cross_checked",
  financialYears:dataset.years.map(x=>x.period),consolidation:dataset.consolidation,
  statementPages:dataset.statementPages,source:dataset.source.url,
  integrityChecks:{passed:problems.length===0,issues:problems},
  segmentCoverage:{period:dataset.segmentMix?.period,externalTurnoverTotal:dataset.segmentMix?.denominator,
    segmentCount:dataset.segmentMix?.rows?.length||0,sharesSum:dataset.segmentMix?.rows?.reduce((sum,x)=>sum+x.amount,0)/dataset.segmentMix?.denominator*100},
  namedCustomerCoverage:dataset.customers.length,namedSupplierCoverage:dataset.suppliers.length},
  {headers:{"Cache-Control":"no-store"}});
}
