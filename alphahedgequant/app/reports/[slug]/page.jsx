import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport, getAllSlugs } from "@/lib/reports";
import "../../learn/pencil-reader.css";

export function generateStaticParams() {
  return getAllSlugs();
}

export function generateMetadata({ params }) {
  const report = getReport(params.slug);
  if (!report) return { title: "Report not found — AlphaHedgeQuant" };
  return {
    title: `${report.title} — AHQ Reports`,
    description: report.dek,
  };
}

function fmtDate(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Block({ block }) {
  switch(block.type){
    case "h2": return <h2 className="pencil-heading !mt-12"><span className="pencil-highlight">{block.text}</span></h2>;
    case "p": return <p className="pencil-prose mt-5">{block.text}</p>;
    case "stats": return <section className="mt-9"><p className="pencil-formula-label">✎ Numbers in focus</p><div className="grid sm:grid-cols-2 gap-x-9 gap-y-6 mt-5">{block.items.map(([label,value,note])=><div key={label} className="border-b border-[#c8bca9] pb-3"><p className="pencil-formula-label">{label}</p><p className="text-[28px] font-semibold text-[#29476d] mt-2"><span className="pencil-highlight">{value}</span></p><p className="text-[14px] text-[#52627b] mt-2">{note}</p></div>)}</div></section>;
    case "quote": return <blockquote className="mt-8 border-l-[3px] border-[#922d50] pl-5"><p className="pencil-handnote !mt-0">{block.text}</p></blockquote>;
    case "note": return <p className="pencil-note pencil-prose !text-[13px] mt-10">{block.text}</p>;
    default: return null;
  }
}
export default function ReportPage({ params }) {
  const report = getReport(params.slug);
  if (!report) notFound();

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-12">
      <Link href="/reports" className="text-xs text-amber hover:underline font-mono">← All Macro Outlooks</Link>
      <article className="ahq-pencil-reader mt-7">
        <div className="pencil-main">
          <p className="pencil-kicker">AHQ MACRO FIELD NOTES / {report.tag}</p>
          <h1 className="pencil-title">{report.title}<span className="text-[#922d50]">.</span></h1>
          <p className="pencil-lead">{report.dek}</p>
          <div className="mt-5 flex items-center gap-3 flex-wrap"><p className="pencil-formula-label">{fmtDate(report.date)} · {report.readMins} MIN READ</p><span className="pencil-handnote !mt-0">Evidence over noise ↗</span></div>
          <hr className="pencil-divider"/>
          {report.body.map((block,i)=><Block key={i} block={block}/>)}
          <hr className="pencil-divider"/>
          <p className="pencil-formula-label">ALPHAHEDGEQUANT · ORIGINAL MARKET RESEARCH</p>
          <p className="pencil-prose !text-[13px] mt-3">For research and education only, not investment advice. Refer to the original cited releases for underlying numbers.</p>
        </div>
      </article>
      <div className="flex items-center justify-between gap-4 mt-8">
        <Link href="/reports" className="btn-ghost">← All Macro Outlooks</Link>
        <Link href="/#waitlist" className="btn-primary">Join waitlist</Link>
      </div>
    </div>
  );
}
