import Link from "next/link";

export const metadata = {
  title: "About AlphaHedgeQuant",
  description: "Explore AlphaHedgeQuant's quantitative research, market intelligence and educational tools.",
};

export default function AboutPage() {
  return (
    <section className="max-w-shell mx-auto px-5 py-20 md:py-28">
      <p className="eyebrow">About AlphaHedgeQuant</p>
      <h1 className="mt-5 max-w-3xl font-display text-4xl md:text-6xl leading-tight text-body">
        Quant research, made accessible.
      </h1>
      <p className="mt-7 max-w-2xl text-base md:text-lg leading-relaxed text-muted">
        AlphaHedgeQuant brings market intelligence, systematic strategy research,
        AI-assisted backtesting, options analytics and education into one workspace.
        Explore the tools, examine their outputs and research the markets in a more structured way.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/screener" className="btn-primary">Explore products</Link>
        <Link href="/learn" className="btn-ghost">Start learning</Link>
      </div>
      <p className="mt-14 max-w-2xl border-t border-line pt-6 text-sm leading-relaxed text-muted">
        Analytics and model outputs are intended for research and education.
        They are not a guarantee of future financial results.
      </p>
    </section>
  );
}
