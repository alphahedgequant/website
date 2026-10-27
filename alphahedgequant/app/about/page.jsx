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
      <div className="mt-14 max-w-2xl rounded-xl border border-line p-5 md:p-6">
        <p className="eyebrow mb-4">Founder</p>
        <div className="flex items-center gap-3">
          <span aria-label="AlphaHedgeQuant logo" className="font-mono text-amber border border-amber/50 rounded px-2 py-1 text-sm tracking-widest">AHQ</span>
          <div>
            <h2 className="font-display text-xl text-body">Shreyash</h2>
            <p className="text-xs text-muted mt-1">Building AlphaHedgeQuant</p>
          </div>
        </div>
        <a href="https://x.com/Shreyy214" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-muted hover:text-body" aria-label="Shreyash on X, @Shreyy214">
          <span aria-hidden="true" className="text-lg">𝕏</span><span>@Shreyy214</span><span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="mt-14 max-w-2xl border-t border-line pt-6 text-sm leading-relaxed text-muted">
        Analytics and model outputs are intended for research and education.
        They are not a guarantee of future financial results.
      </p>
    </section>
  );
}
