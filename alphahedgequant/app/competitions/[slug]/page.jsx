import Link from "next/link";
import {notFound} from "next/navigation";
import {COMPETITIONS,eventBySlug,competitionStatus,registrationStatus,VERIFIED_AS_OF} from "@/lib/competitionEvents.mjs";
import "../competitions.css";

const formatDate=date=>!date?"Not announced":new Intl.DateTimeFormat("en",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));
export function generateStaticParams(){return COMPETITIONS.map(e=>({slug:e.slug}));}
export async function generateMetadata({params}){
  const {slug}=await params; const event=eventBySlug(slug);
  if(!event)return {title:"Event not found | AlphaHedgeQuant"};
  return {title:event.title+" | Competition Calendar | AlphaHedgeQuant",
    description:event.description,alternates:{canonical:"/competitions/"+event.slug},
    openGraph:{title:event.title,url:"/competitions/"+event.slug,type:"website"}};
}
function Field({label,children}){return <div className="cq-field"><dt>{label}</dt><dd>{children}</dd></div>;}
export default async function CompetitionDetail({params}){
 const {slug}=await params, e=eventBySlug(slug);
 if(!e)notFound();
 const status=competitionStatus(e);
 const stage=registrationStatus(e);
 const structured={
  "@context":"https://schema.org","@type":"Event",
  name:e.title,description:e.description,startDate:e.start,
  ...(e.end?{endDate:e.end}:{}),
  eventAttendanceMode:e.mode==="Online"?"https://schema.org/OnlineEventAttendanceMode":
    e.mode==="Hybrid"?"https://schema.org/MixedEventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
  eventStatus:"https://schema.org/EventScheduled",
  location:e.mode==="Online"?{"@type":"VirtualLocation",url:e.sourceURL}:{"@type":"Place",name:e.city,address:{"@type":"PostalAddress",addressCountry:e.country}},
  organizer:{"@type":"Organization",name:e.organiser,url:e.sourceURL},
  url:"https://www.alphahedgequant.com/competitions/"+e.slug
 };
 return <div className="cq-shell"><div className="cq-container">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
  <Link href="/competitions" className="cq-detail-back">← All competitions</Link>
  <header className="cq-detail-header">
   <div className="cq-detail-head-meta"><span className={"cq-type cq-type-"+e.category.toLowerCase()}>{e.category}</span><span className={"cq-status cq-status-"+status.toLowerCase().replace(/\s/g,"-")}>{status} · calendar dates</span></div>
   <h1>{e.title}</h1>
   <p>{e.description}</p>
  </header>
  <div className="cq-detail-content">
   <div className="cq-detail-main">
    <section><p className="cq-overline">01 / PARTICIPANTS</p><h2>{e.category==="Chess"?"Who's playing?":"Who's competing?"}</h2>
     {e.participants.length?<><div className="cq-player-grid">{e.participants.map(name=><div className="cq-player" key={name}><span aria-hidden="true">♞</span>{name}</div>)}</div><p className="cq-source-note">{e.participantLabel}. The list is not the full player roster; see the official event coverage for pairings and live games.</p></>:
     <p>The organiser has not provided a verified participant roster in this directory. We do not invent players, teams, entrants or live matchups. Consult the linked event site for published entrants, standings and results.</p>}
    </section>
    <section><p className="cq-overline">02 / COMPETITION FORMAT</p><h2>What to expect</h2>
     <p>{e.format}. {e.eligibility}. For competition-specific entry requirements, costs, game rounds, team lists and time-zone information, refer to the organiser.</p>
     <div className="cq-tags">{e.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
    </section>
    <section><p className="cq-overline">03 / TIMELINE & RESULTS</p><h2>Dates & event status</h2>
     <p>Starts {formatDate(e.start)}{e.end?" and ends "+formatDate(e.end):e.endLabel?" with "+e.endLabel:"; end date is not confirmed in the available source"}. {e.dateNote||""}</p>
     <p>Current status shown above is derived from published calendar dates, not a confirmed live-score service. Event rankings, pairings, match scores and winning teams must be checked directly with the organiser.</p>
     {e.broadcastURL&&<p><a href={e.broadcastURL} target="_blank" rel="noopener noreferrer" className="cq-arrow-link">Explore live chess broadcasts ↗</a></p>}
    </section>
   </div>
   <aside className="cq-detail-side">
     <div className="cq-detail-aside-box">
      <h2>Event briefing</h2>
      <dl>
       <Field label="Calendar status">{status}</Field>
       <Field label="Category">{e.category}</Field>
       <Field label="Country / region">{e.country}</Field>
       <Field label="Venue">{e.city}</Field>
       <Field label="Attendance">{e.mode}</Field>
       <Field label="Organiser">{e.organiser}</Field>
       <Field label="Start">{formatDate(e.start)}</Field>
       <Field label="End">{e.endLabel||formatDate(e.end)}</Field>
       <Field label="Registration">{stage}</Field>
       {e.registrationDeadline&&<Field label="Published application deadline">{formatDate(e.registrationDeadline)}</Field>}
      </dl>
      <a className="cq-primary" href={e.sourceURL} target="_blank" rel="noopener noreferrer">Official source / entry ↗</a>
      <p className="cq-source-note">Source-checked {formatDate(VERIFIED_AS_OF)}. Registration status and deadlines can change. No affiliation with event organisers is implied.</p>
     </div>
   </aside>
  </div>
 </div></div>;
}
