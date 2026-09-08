import { useState } from 'react';

export default function GeneratedSEOKitView({ kit, target = '', sourceType = 'pdf' }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!kit) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const domain = (target || 'example.com')
    .replace(/^https?:\/\//, '')
    .replace(/\.pdf$/i, '')
    .split('/')[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-violet-950/40 via-gray-900 to-indigo-950/40 border border-violet-500/30">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
            <span>Tailored SEO Kit</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {sourceType === 'pdf' ? 'Pre-Publishing SEO Assets' : 'Optimized Replacement SEO Kit'}
          </h3>
          <p className="text-xs text-gray-400 max-w-xl">
            {sourceType === 'pdf'
              ? 'Ready-to-use SEO assets synthesized directly from your document to paste into your CMS before publishing.'
              : 'Complete replacement meta tags, headings, and schema generated to fix or upgrade your website’s SEO.'}
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(kit.fullHtmlSnippet, 'fullHtml')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20"
        >
          {copiedField === 'fullHtml' ? (
            <>
              <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Copied All HTML!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9 9 0 0 0-9 9m16.5 0a9 9 0 0 0-9-9H6.75" />
              </svg>
              <span>Copy Full &lt;head&gt; HTML</span>
            </>
          )}
        </button>
      </div>

      {/* Google SERP Live Search Preview */}
      <div className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Google Search Snippet Preview
          </span>
          <span className="text-[11px] text-gray-500">Live SERP Simulation</span>
        </div>

        <div className="p-4 rounded-lg bg-gray-950 border border-gray-800/80 space-y-1.5 font-sans">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] text-violet-300">G</span>
            <span className="text-gray-300 truncate">https://{domain} &rsaquo; {kit.suggestedSlug}</span>
          </div>
          <h4 className="text-base font-medium text-blue-400 hover:underline cursor-pointer line-clamp-1">
            {kit.metaTitle}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {kit.metaDescription}
          </p>
        </div>
      </div>

      {/* Title & Description Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meta Title */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Optimized Title Tag</span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${kit.characterCounts.titleLength <= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {kit.characterCounts.titleLength} / 60 chars
              </span>
            </div>
            <p className="text-sm font-medium text-white bg-gray-950 p-3 rounded-lg border border-gray-800/60">
              {kit.metaTitle}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(kit.metaTitle, 'metaTitle')}
            className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            {copiedField === 'metaTitle' ? '✓ Copied Title' : 'Copy Title'}
          </button>
        </div>

        {/* Meta Description */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Optimized Meta Description</span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${kit.characterCounts.descriptionLength <= 160 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {kit.characterCounts.descriptionLength} / 160 chars
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed bg-gray-950 p-3 rounded-lg border border-gray-800/60">
              {kit.metaDescription}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(kit.metaDescription, 'metaDesc')}
            className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            {copiedField === 'metaDesc' ? '✓ Copied Description' : 'Copy Description'}
          </button>
        </div>
      </div>

      {/* Target Keywords & Intent Matrix */}
      <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Target Keywords &amp; Search Intent</span>
          <span className="text-[11px] text-gray-500">{kit.categorizedKeywords.length} targets mapped</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {kit.categorizedKeywords.map((k, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-gray-950 border border-gray-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  k.role === 'Primary'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : k.role === 'Secondary'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-gray-800 text-gray-400'
                }`}>
                  {k.role}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{k.searchIntent}</span>
              </div>
              <p className="text-xs font-medium text-white truncate">{k.keyword}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heading Architecture & JSON-LD Schema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommended Heading Structure */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">Semantic Heading Architecture</span>
            <span className="text-[11px] text-gray-500">CMS Outline</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {kit.headingOutline.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2 rounded-md bg-gray-950 border border-gray-800/60 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono font-bold text-[10px]">
                  {h.level}
                </span>
                <span className="text-gray-300 truncate">{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* JSON-LD Schema Snippet */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Structured Data (JSON-LD Schema)</span>
              <span className="text-[11px] text-emerald-400 font-mono">Article &bull; WebPage</span>
            </div>
            <pre className="text-[11px] font-mono text-gray-400 bg-gray-950 p-3 rounded-lg border border-gray-800/60 max-h-48 overflow-y-auto">
              {JSON.stringify(kit.jsonLdSchema, null, 2)}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(JSON.stringify(kit.jsonLdSchema, null, 2), 'schema')}
            className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            {copiedField === 'schema' ? '✓ Copied JSON-LD' : 'Copy JSON-LD Schema'}
          </button>
        </div>
      </div>
    </div>
  );
}
