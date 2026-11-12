import Link from "next/link";
import {SignedIn,SignedOut} from "@clerk/nextjs";
export function UnlockResearch({href,label,notice,compact=false}){
 return <section className={"rp-unlock"+(compact?" rp-unlock-compact":"")} aria-label="Continue with AlphaHedgeQuant research">
  <div className="rp-lock-mark" aria-hidden="true">α</div>
  <div className="rp-unlock-content">
   <p className="rp-unlock-kicker">RESEARCH WORKSPACE</p>
   <h2>Continue the analysis.</h2>
   <p>Explore detailed research, supporting evidence and interactive methods in the AlphaHedgeQuant workspace.</p>
   <div className="rp-unlock-actions">
    <SignedOut><Link href={href} data-ahq-event="research_preview_unlock_clicked" className="rp-unlock-primary">Continue reading <span aria-hidden="true">↗</span></Link></SignedOut>
    <SignedIn><Link href={href} data-ahq-event="research_preview_unlock_clicked" className="rp-unlock-primary">{label||"Continue reading"} <span aria-hidden="true">↗</span></Link></SignedIn>
   </div>
   {notice&&<p className="rp-unlock-notice">{notice}</p>}
  </div>
 </section>;
}
export function SeriesBreadcrumb({series}){
 return <nav className="rl-shell rp-breadcrumb" aria-label="Breadcrumb">
   <Link href="/">AlphaHedgeQuant</Link><span aria-hidden="true">/</span><Link href="/library">Open Research</Link>
   {series&&<><span aria-hidden="true">/</span><Link href={"/library/series/"+series.id}>{series.title}</Link></>}
 </nav>;
}
