import {auth,currentUser} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
const reply=(data,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(req){
 const {userId}=auth();
 if(!userId)return reply({error:"Sign in required"},401);
 const allow=(process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allow.length)return reply({error:"Admin allowlist not configured",code:"ADMIN_NOT_CONFIGURED"},403);
 const user=await currentUser();
 const verified=(user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").map(x=>x.emailAddress.toLowerCase());
 if(!verified.some(email=>allow.includes(email)))return reply({error:"Forbidden"},403);
 const project=process.env.POSTHOG_PROJECT_ID,secret=process.env.POSTHOG_PERSONAL_API_KEY;
 if(!project||!secret)return reply({configured:false,message:"Add PostHog environment variables to enable real analytics."});
 const base=process.env.POSTHOG_QUERY_HOST||"https://us.posthog.com";
 if(!["https://us.posthog.com","https://eu.posthog.com"].includes(base))return reply({error:"Unsupported PostHog query host"},500);
 if(!/^\d+$/.test(project))return reply({error:"Invalid project configuration"},500);
 const url=new URL(req.url);const days=[1,7,30,90].includes(Number(url.searchParams.get("days")))?Number(url.searchParams.get("days")):7;
 const where=`timestamp >= now() - INTERVAL ${days} DAY`;
 const statements={
 overview:`SELECT uniqExactIf(distinct_id, event = '$pageview') AS visitors, countIf(event = '$pageview') AS pageviews, uniqExactIf(distinct_id, event = '$pageview' AND timestamp >= now()-INTERVAL 1 DAY) AS dau, countIf(event = 'ahq_page_engagement') AS engaged_visits, round(avgIf(toFloat64OrZero(properties.active_seconds), event = 'ahq_page_engagement'),1) AS avg_active_seconds FROM events WHERE ${where}`,
 pages:`SELECT properties.path AS page, count() AS views, uniqExact(distinct_id) AS visitors FROM events WHERE ${where} AND event='$pageview' AND properties.path IS NOT NULL GROUP BY page ORDER BY views DESC LIMIT 15`,
 engagement:`SELECT properties.path AS page, round(avg(toFloat64OrZero(properties.active_seconds)),1) AS avg_active_seconds, sum(toFloat64OrZero(properties.active_seconds)) AS total_active_seconds FROM events WHERE ${where} AND event='ahq_page_engagement' AND properties.path IS NOT NULL GROUP BY page ORDER BY total_active_seconds DESC LIMIT 15`,
 features:`SELECT event AS feature, count() AS uses, uniqExact(distinct_id) AS users FROM events WHERE ${where} AND event IN ('option_chain_opened','strategy_builder_opened','screener_viewed','model_lesson_opened','backtest_viewed') GROUP BY feature ORDER BY uses DESC`,
 trend:`SELECT toDate(timestamp) AS date, uniqExact(distinct_id) AS visitors, count() AS pageviews FROM events WHERE ${where} AND event='$pageview' GROUP BY date ORDER BY date ASC LIMIT 90`
 };
 const headers={Authorization:`Bearer ${secret}`,"Content-Type":"application/json"};
 const results=await Promise.allSettled(Object.values(statements).map(async sql=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);try{const res=await fetch(`${base}/api/projects/${project}/query/`,{method:"POST",headers,body:JSON.stringify({query:{kind:"HogQLQuery",query:sql}}),cache:"no-store",signal:controller.signal});if(!res.ok)throw new Error("PostHog query returned "+res.status);const json=await res.json();return{columns:json.columns||[],rows:json.results||[]}}finally{clearTimeout(timeout)}}));
 if(results.some(x=>x.status==="rejected"))return reply({configured:true,error:"Analytics service unavailable or credentials/permissions incorrect"},502);
 return reply({configured:true,days,results:Object.fromEntries(Object.keys(statements).map((name,i)=>[name,results[i].value]))});
}
