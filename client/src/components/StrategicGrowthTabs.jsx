import { useState } from 'react';

export default function StrategicGrowthTabs({ growthData, targetName = '' }) {
  const [subTab, setSubTab] = useState('geo'); // 'geo' | 'blogs' | 'backlinks' | 'faqs'
  const [copiedKey, setCopiedKey] = useState(null);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  if (!growthData) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const geo = growthData.aiSearchOptimization || {};
  const blogs = growthData.blogClusters || [];
  const backlinks = growthData.backlinkStrategy || {};
  const faqs = growthData.faqs || [];
  const faqSchemaCode = growthData.faqSchemaCode || '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navigation bar */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        {[
          { id: 'geo', label: 'AI Search (GEO) 🤖', desc: 'ChatGPT & Perplexity citations' },
          { id: 'blogs', label: `Blog Topic Clusters (${blogs.length}) 📚`, desc: 'Topical authority' },
          { id: 'backlinks', label: 'Backlinks Blueprint 🔗', desc: 'Outreach & linkable assets' },
          { id: 'faqs', label: `Strategic FAQs (${faqs.length}) ❓`, desc: 'PAA snippets & Schema' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
              ${subTab === tab.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. AI Search & GEO Optimization Tab */}
      {subTab === 'geo' && (
        <div className="space-y-6">
          {/* Quotable Direct Answer Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-violet-950/20 border border-violet-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                  Direct AI Quotability Snippet
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Optimized Answer for Perplexity &amp; ChatGPT Search
                </h3>
                <p className="text-xs text-gray-400">
                  Place this 40–50 word block directly under your primary H2. AI scrapers favor concise, authoritative definitions.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(geo.quotableAnswerSnippet, 'geoAnswer')}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/20 whitespace-nowrap"
              >
                {copiedKey === 'geoAnswer' ? 'Copied Snippet!' : 'Copy Snippet'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 leading-relaxed font-sans border-l-4 border-l-violet-500">
              "{geo.quotableAnswerSnippet}"
            </div>
          </div>

          {/* Citation Hooks & Entity Clarity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Citation Hooks */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎯</span>
                <span>AI Citation Hooks</span>
              </h4>
              <p className="text-xs text-gray-400">Specific tactics to make this content favored by LLM search synthesis:</p>
              <ul className="space-y-2.5">
                {(geo.citationHooks || []).map((hook, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-violet-400 font-bold mt-0.5">&bull;</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Entity Knowledge Graph */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🌐</span>
                <span>Entity Knowledge Graph Disambiguation</span>
              </h4>
              <p className="text-xs text-gray-400">How to establish your brand/service as a verified entity in AI model weights:</p>
              <ul className="space-y-2.5">
                {(geo.entityClarity || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Blog Topic Clusters Tab */}
      {subTab === 'blogs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📚</span>
              <span>Topical Authority Blog Clusters</span>
            </h3>
            <p className="text-xs text-gray-400">
              Publish these 3–4 supporting articles to build topical authority. Google favors websites that cover an entire topic ecosystem rather than single standalone pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.map((blog, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {blog.intent} Intent
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">Post #{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{blog.workingTitle}</h4>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(blog.targetKeywords || []).map((kw, kIdx) => (
                      <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded bg-gray-950 text-gray-300 border border-gray-800">
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Outline Preview */}
                  <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800/80 space-y-1 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recommended Outline (H2s):</span>
                    {(blog.sectionOutline || []).map((sec, sIdx) => (
                      <p key={sIdx} className="text-xs text-gray-300 flex items-center gap-2 truncate">
                        <span className="text-violet-400 text-[10px]">H2</span>
                        <span className="truncate">{sec}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Internal Link Direction */}
                <div className="pt-2 border-t border-gray-800/60 text-[11px] text-gray-400">
                  <span className="text-violet-300 font-semibold">Internal Link: </span>
                  {blog.internalLinkOpportunity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Backlinks & Authority Blueprint Tab */}
      {subTab === 'backlinks' && (
        <div className="space-y-6">
          {/* Linkable Asset Proposal */}
          {backlinks.linkableAsset && (
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧲</span>
                  <h3 className="text-base font-bold text-white">Recommended Linkable Asset</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-400">High Viral / Citation Potential</span>
              </div>
              <p className="text-sm font-bold text-violet-300">{backlinks.linkableAsset.title}</p>
              <p className="text-xs text-gray-300 leading-relaxed">{backlinks.linkableAsset.description}</p>
            </div>
          )}

          {/* Outreach Niches & Safe Anchor Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outreach Niches */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎯</span>
                <span>Target Outreach Niches</span>
              </h4>
              <p className="text-xs text-gray-400">Categories of publications, directories, and resource pages to pitch:</p>
              <ul className="space-y-2">
                {(backlinks.targetNiches || []).map((niche, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span>{niche}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Anchor Text Distribution */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⚖️</span>
                <span>Safe Anchor Text Distribution</span>
              </h4>
              <p className="text-xs text-gray-400">Maintain this split to earn backlinks naturally without triggering Google link spam filters:</p>
              <div className="space-y-2.5 pt-1">
                <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Branded Anchors (Brand / URL)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">50%</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Topical / LSI Anchors (Solutions, Guides)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">30%</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Exact Match Keywords</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">20% max</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Strategic FAQs & Schema Tab */}
      {subTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gray-900 border border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>❓</span>
                <span>High-Impact Search FAQs &amp; Schema</span>
              </h3>
              <p className="text-xs text-gray-400">
                Extracted from actual user search intent. Adding these to your page makes you eligible for Google "People Also Ask" (PAA) rich results.
              </p>
            </div>

            {faqSchemaCode && (
              <button
                onClick={() => copyToClipboard(faqSchemaCode, 'faqSchema')}
                className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/20 whitespace-nowrap"
              >
                {copiedKey === 'faqSchema' ? 'Copied FAQ Schema!' : 'Copy FAQPage JSON-LD'}
              </button>
            )}
          </div>

          {/* Interactive FAQ Accordion */}
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-800 bg-gray-950/80 transition-all cursor-pointer hover:border-gray-700"
                onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="text-violet-400">Q:</span>
                    <span>{faq.question}</span>
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {openFaqIdx === idx ? '−' : '+'}
                  </span>
                </div>

                {openFaqIdx === idx && (
                  <div className="mt-3 pt-3 border-t border-gray-800/60 text-xs text-gray-300 leading-relaxed pl-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQPage JSON-LD Schema Snippet Box */}
          {faqSchemaCode && (
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚙️</span>
                  <span>FAQPage JSON-LD Code (Paste into &lt;head&gt;)</span>
                </h4>
                <button
                  onClick={() => copyToClipboard(faqSchemaCode, 'faqCodeBox')}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all"
                >
                  {copiedKey === 'faqCodeBox' ? 'Copied Code!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-[11px] text-gray-300 font-mono overflow-x-auto max-h-40 leading-relaxed">
                {faqSchemaCode}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
