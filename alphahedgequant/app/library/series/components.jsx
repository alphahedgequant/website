import Link from "next/link";
import {SignedIn,SignedOut} from "@clerk/nextjs";
export function UnlockResearch({href,label,notice,compact=false}){
 return <section className={"rp-unlock"+(compact?" rp-unlock-compact":"")} aria-label="Continue with a free AlphaHedgeQuant account">
  <div className="rp-lock-mark" aria-hidden="true">α</div>
  <div className="rp-unlock-content">
   <p className="rp-unlock-kicker">FULL READING EXPERIENCE / ACCOUNT ACCESS</p>
   <h2>Continue beyond the preview.</h2>
   <p>The introduction above is free to read. Detailed research and interactive material are kept inside the AlphaHedgeQuant signed-in workspace.</p>
   <div className="rp-unlock-actions">
    <SignedOut><Link href={href} data-ahq-event="research_preview_unlock_clicked" className="rp-unlock-primary">Sign in to continue reading <span aria-hidden="true">↗</span></Link><Link href="/sign-up" className="rp-unlock-secondary">Create a free account <span aria-hidden="true">↗</span></Link></SignedOut>
    <SignedIn><Link href={href} data-ahq-event="research_preview_unlock_clicked" className="rp-unlock-primary">{label||"Open complete research"} <span aria-hidden="true">↗</span></Link></SignedIn>
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
