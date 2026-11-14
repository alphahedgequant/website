import {notFound} from "next/navigation";
import {isInsightsOwner} from "@/lib/insightsOwnerAccess.mjs";
import OwnerInsightsDashboard from "@/components/OwnerInsightsDashboard";
import {parseOwnerAudienceSnapshot} from "@/lib/ownerAudienceSnapshot.mjs";
export const dynamic="force-dynamic";
export const metadata={
  title:"Owner Insights | AlphaHedgeQuant",
  robots:{index:false,follow:false}
};
// This is a SERVER component: unauthorized visitors never receive even the
// dashboard layout or component data. The JSON endpoint repeats this check.
export default async function PrivateInsightsPage(){
  if(!await isInsightsOwner())notFound();
  const ownerReported=parseOwnerAudienceSnapshot(process.env.AHQ_OWNER_REPORTED_AUDIENCE_SNAPSHOT);
  return <OwnerInsightsDashboard ownerReported={ownerReported}/>;
}
