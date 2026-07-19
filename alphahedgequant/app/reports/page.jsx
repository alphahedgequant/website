import Link from "next/link";
import { reports } from "@/lib/reports";

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
            className="card p-7 block hover:border-amber/40 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] tracking-[0.2em] text-amber">
                {r.tag}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {fmtDate(r.date)} · {r.readMins} min read
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium mt-3 leading-snug">
              {r.title}
            </h2>
            <p className="text-sm text-body/80 leading-relaxed mt-2 max-w-3xl">
              {r.dek}
            </p>
            <p className="text-sm text-muted leading-relaxed mt-3 max-w-3xl">
              {r.summary}
            </p>
            <span className="font-mono text-xs text-amber mt-4 inline-block">
              Read report →
            </span>
          </Link>
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted mt-10">
        RESEARCH &amp; EDUCATION ONLY — NOT INVESTMENT ADVICE.
      </p>
    </div>
  );
}
