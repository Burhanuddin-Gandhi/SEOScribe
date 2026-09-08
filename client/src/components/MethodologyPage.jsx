import { Link } from 'react-router-dom';

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 space-y-16">
      {/* Hero */}
      <div className="space-y-5">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
          Methodology
        </span>
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
          How we verify what we tell you
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          No automated tool — ours included — can guarantee its extracted data is 100% correct.
          What we can do is show you exactly how we try to catch our own mistakes, and give you
          the means to check our work yourself. This page describes the actual pipeline behind
          every report, not a marketing summary of it.
        </p>
      </div>

      {/* Two-pass URL extraction */}
      <Section
        eyebrow="Website analysis"
        title="Two independent passes, not one guess"
      >
        <p>
          Reading a live webpage has one major failure mode: a lot of modern sites render their
          real content with JavaScript, and a simple page fetch never sees it. So we don't rely
          on a single method.
        </p>

        <ol className="space-y-4 mt-2">
          <Step number="1" title="Fast static fetch">
            We first fetch the page directly, the way a search engine crawler would. This is fast
            and works correctly for the majority of sites.
          </Step>
          <Step number="2" title="Suspicion check">
            We check the result against known failure signatures: very little visible text, a
            near-empty page body next to a large JavaScript bundle, or markers of a single-page-app
            shell that hasn't rendered yet.
          </Step>
          <Step number="3" title="Full browser render, only if needed">
            If the fetch looks unreliable, we escalate to a real headless browser that executes the
            page's JavaScript, then re-check the same signals. We only trust this result if it
            actually surfaces meaningfully more content than the fast fetch did — otherwise we
            treat the page as blocked or gated, not "fixed."
          </Step>
        </ol>
      </Section>

      {/* PDF cross-check */}
      <Section eyebrow="PDF analysis" title="Two parsers reading the same file">
        <p>
          For uploaded PDFs, we don't rely on a single parsing library either. We extract text with
          one parser, then independently re-read the same file with a second, separately-built
          parser and compare the facts that should always match — starting with page count, which
          is declared in the PDF's own internal file structure, not inferred.
        </p>
        <p>
          If two independent readers of the same file disagree on something that basic, that's a
          real signal something went wrong — not a stylistic difference to shrug off.
        </p>
      </Section>

      {/* Confidence gating */}
      <Section eyebrow="Confidence" title="We tell you when we're not sure — and we stop">
        <p>
          Every analysis gets a confidence rating based on the checks above. It's not shown as a
          score to make you feel better about the result — it changes what actually happens:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <ConfidenceCard
            level="High"
            color="emerald"
            description="The fast fetch (or PDF's primary parser) looked reliable on its own — no escalation was needed."
          />
          <ConfidenceCard
            level="Medium"
            color="amber"
            description="A fallback method was needed and resolved cleanly, or a secondary check couldn't run at all."
          />
          <ConfidenceCard
            level="Low"
            color="red"
            description="Our checks disagreed, or content still looked unreliable after every fallback."
          />
        </div>
        <p className="mt-2">
          A <span className="text-red-400 font-medium">low</span> confidence result is never shown
          as a finished report. Instead, you get an honest message that we couldn't reliably
          analyze the page or file, with a suggestion to try again or check the source. We would
          rather tell you we don't know than guess and present it as fact.
        </p>
      </Section>

      {/* Evidence / self-verification */}
      <Section eyebrow="Self-verification" title="Every number in the report is checkable">
        <p>
          Every report includes an <span className="text-violet-300 font-medium">Evidence</span>{' '}
          tab showing the exact raw values our extraction found — the actual title tag, the actual
          H1 text, real counts for images and links, and whether structural tags like canonical or
          schema markup were present. Nothing in that tab is summarized or interpreted.
        </p>
        <p>
          You don't have to take our word for any of it: open view-source on your own page, or your
          PDF's own document properties, and compare them directly against what we found.
        </p>
      </Section>

      {/* Consistency tracking */}
      <Section eyebrow="Consistency" title="We track whether we agree with ourselves">
        <p>
          Every time you re-analyze the same page or file, we compare the new result against the
          last one. Small score changes from real content changes are expected and shown as
          normal. But if the exact same content ever produces a meaningfully different score, that
          indicates a bug in our own scoring — and we flag it as an anomaly rather than silently
          showing you a new number.
        </p>
      </Section>

      {/* Audit trail */}
      <Section eyebrow="Traceability" title="Every analysis is fingerprinted">
        <p>
          Each analysis is logged internally with a cryptographic hash of the exact content it was
          run on, along with which extraction method was used and what confidence it received. If
          a result is ever questioned, we can trace it back to the exact source data that produced
          it — not just re-run the pipeline and hope for the same answer.
        </p>
      </Section>

      {/* Honest limitations */}
      <Section eyebrow="Limitations" title="What we're not able to do">
        <p>
          Being transparent about our process means being transparent about its edges, too:
        </p>
        <ul className="space-y-2 mt-2 text-gray-400">
          <li className="flex gap-2">
            <span className="text-gray-600">—</span>
            <span>We can't analyze pages behind a login, paywall, or aggressive bot protection — those get flagged as low-confidence rather than guessed at.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">—</span>
            <span>We don't have access to real backlink or domain-authority databases. Competitor mentions reflect names that literally appear in the page's content, not verified authority rankings.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">—</span>
            <span>Our recommendations are generated from the specific issues we detect — they're a starting point, not a substitute for a full manual SEO audit.</span>
          </li>
        </ul>
      </Section>

      {/* Ongoing validation — intentionally no fabricated percentage here.
          Fill this in once a real, manually-verified benchmark exists. */}
      <Section eyebrow="Ongoing validation" title="We're building a public accuracy benchmark">
        <p>
          Beyond the built-in checks above, we're assembling a set of manually-verified websites
          and documents — where we already know the ground truth — to measure our extraction
          accuracy against, and we intend to publish that measured result here rather than an
          unverifiable claim. This section will be updated once that benchmark is complete.
        </p>
      </Section>

      <div className="pt-4 border-t border-gray-800/50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all"
        >
          ← Back to the analyzer
        </Link>
      </div>
    </div>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3 text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}

function Step({ number, title, children }) {
  return (
    <li className="flex gap-4">
      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-white text-sm font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

const CONFIDENCE_STYLES = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  red: 'bg-red-500/10 border-red-500/20 text-red-400',
};

function ConfidenceCard({ level, color, description }) {
  return (
    <div className={`p-4 rounded-xl border ${CONFIDENCE_STYLES[color]}`}>
      <h4 className="font-bold text-sm mb-1.5">{level}</h4>
      <p className="text-xs leading-relaxed opacity-90">{description}</p>
    </div>
  );
}