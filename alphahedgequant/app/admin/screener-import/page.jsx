import {isInsightsOwner} from "@/lib/insightsOwnerAccess.mjs";
import ScreenerImportClient from "./ScreenerImportClient";
export const dynamic="force-dynamic";
export default async function ScreenerImportPage(){
  if(!await isInsightsOwner())return <main className="max-w-3xl mx-auto px-5 py-16"><section className="card p-8"><p className="eyebrow mb-2">AHQ DATA OPERATIONS</p><h1 className="font-display text-2xl text-body">Owner access required</h1><p className="text-sm text-muted mt-3">Sign in with the verified AlphaHedgeQuant owner account to import production screener data.</p></section></main>;
  return <ScreenerImportClient/>;
}
