import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport, getAllSlugs } from "@/lib/reports";

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
  switch (block.type) {
    case "h2":
      return (
        <h2 className="font-display text-xl font-medium mt-12 mb-4">
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="text-[15px] text-body/85 leading-[1.8] mt-4">
          {block.text}
        </p>
      );
    case "stats":
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          {block.items.map(([label, value, note]) => (
            <div key={label} className="card p-4">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                {label}
              </p>
              <p className="font-display text-lg font-medium text-amber mt-1.5">
                {value}
              </p>
              <p className="text-[11px] text-muted leading-snug mt-1">{note}</p>
            </div>
          ))}
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-amber pl-5 mt-8">
          <p className="font-display text-lg leading-relaxed text-body/90">
            {block.text}
          </p>
        </blockquote>
      );
    case "note":
      return (
        <p className="font-mono text-[11px] text-muted leading-relaxed mt-12 pt-6 border-t border-line">
          {block.text}
        </p>
      );
    default:
      return null;
  }
}

export default function ReportPage({ params }) {
  const report = getReport(params.slug);
  if (!report) notFound();

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <Link
        href="/reports"
        className="font-mono text-xs text-muted hover:text-amber transition-colors"
      >
        ← All reports
      </Link>

      <p className="eyebrow mt-8 mb-3">[ {report.tag} ]</p>
      <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight leading-tight">
        {report.title}
      </h1>
      <p className="text-muted text-base leading-relaxed mt-4">{report.dek}</p>
      <p className="font-mono text-[11px] text-muted mt-5 pb-8 border-b border-line">
        {fmtDate(report.date)} · {report.readMins} MIN READ · ALPHAHEDGEQUANT
      </p>

      <article className="mt-2">
        {report.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      <div className="mt-14 pt-8 border-t border-line flex items-center justify-between">
        <Link
          href="/reports"
          className="font-mono text-xs text-muted hover:text-amber transition-colors"
        >
          ← All reports
        </Link>
        <Link href="/#waitlist" className="btn-primary !py-2 !px-4">
          Join waitlist
        </Link>
      </div>
    </div>
  );
}
