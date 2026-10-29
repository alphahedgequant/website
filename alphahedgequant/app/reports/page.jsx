import Link from "next/link";
import { reports } from "@/lib/reports";
import "../learn/pencil-reader.css";

export const metadata = {
  title: "Reports — AlphaHedgeQuant",
  description:
    "Original macro and market-structure research from AHQ — verified against primary sources, written for people who trade the numbers.",
};

function fmtDate(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ReportsPage() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : REPORTS — PRIMARY-SOURCE MACRO ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Reports
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        Original macro research from AHQ. Every figure is verified against the
        primary release — MoSPI, GSTN, CBDT, RBI, the Fed, BLS — before it is
        published here. No hot takes, no unverified numbers.
      </p>

      <div className="mt-10 grid gap-5">
        {reports.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className="ahq-pencil-reader block transition-transform hover:-translate-y-1"
          >
            <div className="pencil-main !py-7"><div className="flex flex-wrap items-center gap-3">
              <span className="pencil-kicker">
                {r.tag}
              </span>
              <span className="pencil-formula-label">
                {fmtDate(r.date)} · {r.readMins} min read
              </span>
            </div>
            <h2 className="pencil-heading !text-[27px] !mt-4">
              {r.title}
            </h2>
            <p className="pencil-prose mt-2 max-w-3xl">
              {r.dek}
            </p>
            <p className="pencil-prose !text-[14px] mt-3 max-w-3xl">
              {r.summary}
            </p>
            <span className="pencil-handnote mt-4 inline-block">
              Read field notes →
            </span></div>
          </Link>
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted mt-10">
        RESEARCH &amp; EDUCATION ONLY — NOT INVESTMENT ADVICE.
      </p>
    </div>
  );
}
