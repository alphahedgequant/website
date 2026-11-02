// AlphaHedgeQuant editorial assurance rules.
// Deterministic metadata checks; not a substitute for a researcher checking the linked source.
export const STAGES = Object.freeze(["idea","research","fact_check","creative","editor_review","owner_review","approved","scheduled","published","measured"]);
const VALID_PLATFORMS = new Set(["website","x","linkedin","reddit","valuepickr","email"]);
const urlOk = value => { try { const u = new URL(value); return u.protocol === "https:" && Boolean(u.hostname) && !/^(localhost|127\\.|10\\.|192\\.168\\.)/.test(u.hostname); } catch { return false; } };
const dateOk = value => typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
const filled = value => typeof value === "string" && value.trim().length > 0;
const uniq = arr => [...new Set(arr)];
export function checkEditorialPacket(packet) {
 const errors = [], warnings = [];
 if (!packet || typeof packet !== "object" || Array.isArray(packet)) return {status:"HOLD",errors:["Missing editorial packet"],warnings:[]};
 if (!filled(packet.id) || !/^[a-z0-9_-]{5,100}$/.test(packet.id)) errors.push("Packet needs a stable lowercase ID");
 if (!filled(packet.title)) errors.push("Missing title");
 if (!filled(packet.thesis)) errors.push("Missing distinct research thesis");
 if (!STAGES.includes(packet.stage)) errors.push("Invalid workflow stage");
 if (!Array.isArray(packet.claims) || packet.claims.length===0) errors.push("No evidence ledger (claims) supplied");
 const claimIds = new Set();
 for (const [i,c] of (Array.isArray(packet.claims)?packet.claims:[]).entries()) {
  const key = "Claim "+(i+1);
  if (!filled(c?.id) || claimIds.has(c.id)) errors.push(key+": claim ID missing or duplicate"); else claimIds.add(c.id);
  if (!filled(c?.statement)) errors.push(key+": statement missing");
  if (!urlOk(c?.sourceUrl)) errors.push(key+": missing/unsafe primary or attributable source URL");
  if (!dateOk(c?.sourcePublishedOn)) errors.push(key+": source publication date missing/invalid");
  if (!dateOk(c?.sourceCheckedOn)) errors.push(key+": source checking date missing/invalid");
  if (!["primary","secondary"].includes(c?.sourceType)) errors.push(key+": source type missing");
  if (c?.numeric === true) {
   if (typeof c?.value!=="number" || !Number.isFinite(c.value)) errors.push(key+": numeric value missing/nonfinite");
   if (!filled(c?.unit)) errors.push(key+": numeric unit missing");
   if (!dateOk(c?.periodEnd)) errors.push(key+": financial measurement period end missing");
  }
  if (c?.sourceVerified !== true || !filled(c?.verificationNote)) errors.push(key+": evidence not verified against source");
  if (c?.sourceType === "secondary") warnings.push(key+": secondary source; seek original release or filing");
 }
 const assets = Array.isArray(packet.assets)?packet.assets:[];
 for(const [i,a] of assets.entries()){
  const key="Asset "+(i+1);
  if(!filled(a?.format)||!filled(a?.copy))errors.push(key+": format or copy missing");
  if(!Array.isArray(a?.claimIds))errors.push(key+": referenced claims list missing");
  else for(const ref of a.claimIds) if(!claimIds.has(ref))errors.push(key+": unknown claim "+String(ref));
  if(a?.imageContainsData===true && !filled(a?.sourceCaption))errors.push(key+": data graphic needs readable source caption");
  if(a?.format==="poster"||a?.format==="carousel")if(!filled(a?.altText))warnings.push(key+": provide accessibility text");
 }
 const distribution=Array.isArray(packet.distribution)?packet.distribution:[];
 for(const [i,d] of distribution.entries()){
  const key="Distribution "+(i+1);
  if(!VALID_PLATFORMS.has(d?.platform))errors.push(key+": unknown channel");
  if(d?.platform==="valuepickr" && (d?.postingAllowed===true||d?.promotion===true||d?.aiWrittenCopy===true)) errors.push(key+": ValuePickr forbids self-promotion and AI-generated posts; analysis-only channel");
  if(d?.platform==="reddit" && (d?.postingAllowed===true && d?.communityRulesReviewed!==true))errors.push(key+": subreddit permission/rules not reviewed");
  if(d?.platform==="x" && d?.trendAutomation===true)errors.push(key+": automated trending-topic exploitation forbidden");
  if(d?.autoComment===true||d?.autoDm===true||d?.autoLike===true)errors.push(key+": prohibited unsolicited engagement automation");
  if(d?.campaignUrl && !urlOk(d.campaignUrl))errors.push(key+": invalid campaign URL");
 }
 const uniqueErrors=uniq(errors),uniqueWarnings=uniq(warnings);
 return {status:uniqueErrors.length?"HOLD":uniqueWarnings.length?"REVISE":"PASS",errors:uniqueErrors,warnings:uniqueWarnings};
}
// External authentication must establish these IDs; the AI agent must never populate them.
export function canPublish(packet,{authenticatedOwnerId,authenticatedEditorId}={}){
 const audit=checkEditorialPacket(packet);
 if(audit.status!=="PASS")return {allowed:false,reason:"Editorial evidence gate did not pass",audit};
 const a=packet.approval||{};
 if(!filled(authenticatedOwnerId)||!filled(authenticatedEditorId)||authenticatedOwnerId===authenticatedEditorId)return {allowed:false,reason:"Distinct authenticated owner and editor approvals required",audit};
 if(a.editor?.kind!=="human"||a.editor?.userId!==authenticatedEditorId||a.owner?.kind!=="human"||a.owner?.userId!==authenticatedOwnerId)return {allowed:false,reason:"Human sign-off must match authenticated identities",audit};
 if(!dateOk(a.editor?.approvedOn)||!dateOk(a.owner?.approvedOn))return {allowed:false,reason:"Missing approval dates",audit};
 if(!["approved","scheduled"].includes(packet.stage))return {allowed:false,reason:"Packet has not reached an authorized publishing stage",audit};
 return {allowed:true,reason:"Metadata and authenticated human approvals passed; source accuracy still requires manual verification",audit};
}
export function experimentUrl({destination,source,medium,campaign,content}){
 const url=new URL(destination);
 if(url.protocol!=="https:"||!["alphahedgequant.com","www.alphahedgequant.com"].includes(url.hostname))throw new Error("Only AlphaHedgeQuant HTTPS landing pages permitted");
 for (const [key,val] of Object.entries({utm_source:source,utm_medium:medium,utm_campaign:campaign,utm_content:content}))
  if (val!=null && val!=="") { const v=String(val).trim(); if(!/^[a-z0-9_-]{1,80}$/i.test(v))throw new Error("Invalid UTM tag: "+key);url.searchParams.set(key,v); }
 return url.toString();
}
export function experimentMetrics({visitors,signups,spend=0}={}){
 if(![visitors,signups,spend].every(v=>Number.isFinite(v)&&v>=0)||signups>visitors)throw new Error("Invalid acquisition counts");
 return {visitors,signups,conversionRate:visitors===0?null:signups/visitors,costPerSignup:signups===0?null:spend/signups};
}
