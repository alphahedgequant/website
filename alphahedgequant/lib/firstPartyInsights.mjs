// AlphaHedgeQuant Insights: privacy-restricted, first-party analytics storage.
// Only coarse navigation and operational events are persisted. No email, IP,
// stock search, trading parameters, raw user ID, or user-agent is stored.
import {neon} from "@neondatabase/serverless";
import {randomUUID} from "node:crypto";
import {hashQuotaIdentity} from "./serverRateLimit.mjs";

export const CLIENT_EVENTS=Object.freeze([
  "pageview","engagement","option_chain_opened","options_page_viewed","strategy_builder_opened",
  "screener_viewed","model_lesson_opened","backtest_viewed","quant_terminal_opened",
  "ipo_page_opened","article_opened","waitlist_opened",
  // Fixed low-cardinality product actions; never include ticker, question,
  // filter values, search terms or trade parameters in event names.
  "ipo_tab_selected","ipo_filter_changed","ipo_issue_opened","academy_area_selected","mental_math_round_started",
  "mental_math_answer_submitted","interview_mock_started","interview_answer_checked",
  "interview_mock_answer_submitted","interview_bookmark_toggled","interview_answer_revealed",
  "screener_market_switched","screener_filters_opened","screener_filter_changed",
  "screener_view_selected","screener_exported","screener_stock_opened",
  "terminal_tab_selected","terminal_stock_selected","option_chain_refreshed",
  "option_chain_selected","strategy_leg_added","backtest_run_submitted",
  "research_search_submitted","research_filter_selected","trust_tracker_viewed","research_preview_unlock_clicked"
]);
const clientSet=new Set(CLIENT_EVENTS);
const sourceSet=new Set(["direct","google","bing","duckduckgo","x","linkedin","reddit","valuepickr","other"]);
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const campaignPattern=/^[a-z0-9][a-z0-9_.-]{0,49}$/;
let schemaReady=null,cleanedDay=-1;

export function validAnonymousId(id){return typeof id==="string" && uuidPattern.test(id);}
export function safePagePath(path){
  if(typeof path!=="string"||path.length>180||!/^\/(?:[a-zA-Z0-9_~.\-]+\/?)*$/.test(path)||path.includes(".."))return null;
  const normalized=path.length>1?path.replace(/\/$/,""):path;
  // Group per-company paths: the owner can measure company-page engagement
  // without collecting which securities an individual browser viewed.
  if(/^\/(stock|stocks|company)\/[^/]+(?:\/.*)?$/.test(normalized)){
    const prefix=normalized.split("/")[1];
    return "/"+prefix+"/detail";
  }
  if(/^\/(admin|api|sign-in|sign-up|account|settings)(\/|$)/.test(normalized)||
    /^\/terminal\/import(\/|$)/.test(normalized))return null;
  return normalized;
}
export function safeCampaign(value){
  return typeof value==="string" && campaignPattern.test(value.toLowerCase())?value.toLowerCase():null;
}
export function validClientEvent(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
  if(!clientSet.has(raw.event)||!validAnonymousId(raw.visitor)||!validAnonymousId(raw.session))return null;
  const path=safePagePath(raw.path);
  if(!path)return null;
  const seconds=raw.event==="engagement"?raw.activeSeconds:0;
  if(raw.event==="engagement" && (!Number.isInteger(seconds)||seconds<1||seconds>60))return null;
  if(raw.event!=="engagement" && raw.activeSeconds!=null && raw.activeSeconds!==0)return null;
  return {
    event:raw.event,visitor:raw.visitor,session:raw.session,path,
    activeSeconds:seconds,
    source:sourceSet.has(raw.source)?raw.source:"direct",
    utmSource:safeCampaign(raw.utmSource),utmMedium:safeCampaign(raw.utmMedium),
    utmCampaign:safeCampaign(raw.utmCampaign)
  };
}
export function isAllowedEventOrigin(request){
  const own=new URL(request.url).origin;
  const origin=request.headers.get("origin");
  // Browsers set Origin for fetch and sendBeacon. Refuse missing/cross-site
  // values instead of relying on spoofable referrer strings for authorization.
  return Boolean(origin && origin===own &&
    !["cross-site","same-site"].includes(request.headers.get("sec-fetch-site")));
}
function sqlClient(){
  if(!process.env.NEON_DATABASE_URL)throw Error("First-party analytics storage is not configured");
  return neon(process.env.NEON_DATABASE_URL);
}
function hashIdentity(namespace,id){
  const secret=process.env.AHQ_INSIGHTS_HASH_KEY||process.env.NEON_DATABASE_URL;
  if(!secret)throw Error("Analytics identity secret not configured");
  return hashQuotaIdentity(namespace,id,secret);
}
export async function ensureInsightsTable(sql){
  if(!schemaReady){
    schemaReady=(async()=>{
      await sql`CREATE TABLE IF NOT EXISTS ahq_insights_events (
        id BIGSERIAL PRIMARY KEY,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        event_type VARCHAR(40) NOT NULL,
        visitor_hash CHAR(64) NOT NULL,
        session_hash CHAR(64) NOT NULL,
        path VARCHAR(180) NOT NULL,
        active_seconds SMALLINT NOT NULL DEFAULT 0,
        ref_source VARCHAR(40) NOT NULL DEFAULT 'direct',
        utm_source VARCHAR(50),
        utm_medium VARCHAR(50),
        utm_campaign VARCHAR(50)
      )`;
      await sql`CREATE INDEX IF NOT EXISTS ahq_insights_time_event_idx ON ahq_insights_events (occurred_at DESC,event_type)`;
      await sql`CREATE INDEX IF NOT EXISTS ahq_insights_visitor_time_idx ON ahq_insights_events (visitor_hash,occurred_at DESC)`;
    })().catch(e=>{schemaReady=null;throw e});
  }
  return schemaReady;
}
async function expireOldEvents(sql){
  const day=Math.floor(Date.now()/86400000);
  if(day===cleanedDay)return;
  cleanedDay=day;
  try{await sql`DELETE FROM ahq_insights_events WHERE occurred_at < now()-interval '180 days'`;}
  catch{cleanedDay=-1;}
}
export async function recordClientEvent(raw){
  const event=validClientEvent(raw);
  if(!event)throw Error("Invalid analytics event");
  const sql=sqlClient();await ensureInsightsTable(sql);
  const visitor=hashIdentity("insights-visitor",event.visitor);
  const session=hashIdentity("insights-session",event.session);
  await sql`INSERT INTO ahq_insights_events
    (event_type,visitor_hash,session_hash,path,active_seconds,ref_source,utm_source,utm_medium,utm_campaign)
    VALUES (${event.event},${visitor},${session},${event.path},${event.activeSeconds},${event.source},
      ${event.utmSource},${event.utmMedium},${event.utmCampaign})`;
  await expireOldEvents(sql);
}
export async function recordConfirmedWaitlistSignup({visitor,session,source="landing",campaign=null}){
  const sql=sqlClient();await ensureInsightsTable(sql);
  // Missing/opted-out browser identity uses an unlinkable one-time ID, while
  // still counting an operationally verified new waitlist registration.
  const visitorHash=hashIdentity("insights-visitor",validAnonymousId(visitor)?visitor:randomUUID());
  const sessionHash=hashIdentity("insights-session",validAnonymousId(session)?session:randomUUID());
  const channel=(safeCampaign(source)||"landing").slice(0,40);
  await sql`INSERT INTO ahq_insights_events
    (event_type,visitor_hash,session_hash,path,ref_source,utm_campaign)
    VALUES ('waitlist_signup',${visitorHash},${sessionHash},'/waitlist',${channel},${safeCampaign(campaign)})`;
}
export async function deleteMyAnonymousEvents(visitor){
  if(!validAnonymousId(visitor))throw Error("Invalid analytics visitor");
  const sql=sqlClient();await ensureInsightsTable(sql);
  const visitorHash=hashIdentity("insights-visitor",visitor);
  // Only deletes records associated with this unguessable browser identifier.
  await sql`DELETE FROM ahq_insights_events WHERE visitor_hash=${visitorHash}`;
}
export function getInsightsSQL(){return sqlClient();}
