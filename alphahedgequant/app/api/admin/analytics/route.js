import {NextResponse} from "next/server";
import {isInsightsOwner} from "@/lib/insightsOwnerAccess.mjs";
import {getInsightsSQL,ensureInsightsTable} from "@/lib/firstPartyInsights.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body,status=200)=>NextResponse.json(body,{status,headers:{
  "Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"
}});
const allowedWindows=new Set([1,7,30,90]);

export async function GET(request){
  // Authenticate before doing any database work; not even summary totals
  // should be accessible to a different Clerk account.
  if(!await isInsightsOwner())return reply({error:"Not found"},404);
  if(!process.env.NEON_DATABASE_URL)return reply({error:"First-party analytics database not configured"},503);
  const url=new URL(request.url);
  const days=Number(url.searchParams.get("days")||7);
  if(!allowedWindows.has(days))return reply({error:"Invalid date range"},400);
  const since=new Date(Date.now()-days*86400000).toISOString();
  try{
    const sql=getInsightsSQL();
    await ensureInsightsTable(sql);
    const [overviewRows,pages,features,trend,sources]=await Promise.all([
      sql`SELECT
        COUNT(*) FILTER(WHERE event_type='pageview' AND occurred_at>=${since}::timestamptz)::integer AS pageviews,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview' AND occurred_at>=${since}::timestamptz)::integer AS visitors,
        COUNT(DISTINCT session_hash) FILTER(WHERE event_type='pageview' AND occurred_at>=${since}::timestamptz)::integer AS sessions,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview' AND (occurred_at AT TIME ZONE 'Asia/Kolkata')::date=(now() AT TIME ZONE 'Asia/Kolkata')::date)::integer AS dau,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview' AND occurred_at>=now()-interval '7 days')::integer AS wau,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview' AND occurred_at>=now()-interval '30 days')::integer AS mau,
        COALESCE(SUM(active_seconds) FILTER(WHERE occurred_at>=${since}::timestamptz),0)::integer AS active_seconds,
        COALESCE(ROUND(
          SUM(active_seconds) FILTER(WHERE occurred_at>=${since}::timestamptz)::numeric /
          NULLIF(COUNT(DISTINCT session_hash) FILTER(WHERE event_type='pageview' AND occurred_at>=${since}::timestamptz),0),1),0) AS avg_active_seconds,
        COUNT(*) FILTER(WHERE event_type='waitlist_signup' AND occurred_at>=${since}::timestamptz)::integer AS waitlist_signups
        FROM ahq_insights_events WHERE occurred_at>=now()-interval '90 days'`,
      sql`SELECT path,COUNT(*) FILTER(WHERE event_type='pageview')::integer AS views,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview')::integer AS visitors,
        COALESCE(SUM(active_seconds),0)::integer AS active_seconds,
        COALESCE(ROUND(SUM(active_seconds)::numeric/
          NULLIF(COUNT(DISTINCT session_hash) FILTER(WHERE event_type='pageview'),0),1),0) AS avg_active_seconds
        FROM ahq_insights_events WHERE occurred_at>=${since}::timestamptz
        AND event_type IN ('pageview','engagement')
        GROUP BY path HAVING COUNT(*) FILTER(WHERE event_type='pageview')>0
        ORDER BY views DESC LIMIT 25`,
      sql`SELECT event_type AS feature,COUNT(*)::integer AS uses,
        COUNT(DISTINCT visitor_hash)::integer AS visitors
        FROM ahq_insights_events WHERE occurred_at>=${since}::timestamptz
        AND event_type NOT IN ('pageview','engagement','waitlist_signup')
        GROUP BY event_type ORDER BY uses DESC LIMIT 25`,
      sql`SELECT (occurred_at AT TIME ZONE 'Asia/Kolkata')::date::text AS day,
        COUNT(DISTINCT visitor_hash)::integer AS visitors,
        COUNT(*)::integer AS pageviews
        FROM ahq_insights_events WHERE occurred_at>=${since}::timestamptz
        AND event_type='pageview'
        GROUP BY day ORDER BY day ASC LIMIT 95`,
      sql`SELECT COALESCE(NULLIF(utm_source,''),ref_source,'direct') AS source,
        COUNT(*) FILTER(WHERE event_type='pageview')::integer AS pageviews,
        COUNT(DISTINCT visitor_hash) FILTER(WHERE event_type='pageview')::integer AS visitors,
        COUNT(*) FILTER(WHERE event_type='waitlist_signup')::integer AS waitlist_signups
        FROM ahq_insights_events WHERE occurred_at>=${since}::timestamptz
        AND event_type IN ('pageview','waitlist_signup')
        GROUP BY source ORDER BY pageviews DESC LIMIT 25`
    ]);
    const overview=overviewRows[0]||{};
    const visitors=Number(overview.visitors||0);
    const conversions=Number(overview.waitlist_signups||0);
    // Conversion percentage is an aggregate proxy, not an identity-matched,
    // causal funnel; privacy opt-outs and repeat visits affect the denominator.
    return reply({
      configured:true,days,generatedAt:new Date().toISOString(),timezone:"Asia/Kolkata",
      definition:"Visitor metrics are pseudonymous browser-based estimates, not verified Clerk account counts.",
      overview:{...overview,conversion_percent:visitors?Math.round(conversions/visitors*10000)/100:0},
      pages,features,trend,sources
    });
  }catch{
    return reply({error:"Analytics temporarily unavailable. Check database configuration and access."},503);
  }
}
