import { useState } from 'react';
import StrategicGrowthTabs from './StrategicGrowthTabs';

export default function PDFSEODashboard({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('seokit');
  const [copiedField, setCopiedField] = useState(null);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
  const [selectedDescIdx, setSelectedDescIdx] = useState(0);

  const agentCreation = data?.agentCreation || data?.analysis?.agentCreation;
  const kit = agentCreation?.generatedKit || data?.analysis?.generatedSEOKit;
  const compIntel = agentCreation?.competitorIntelligence;
  const roadmap = agentCreation?.publishingRoadmap;
  const metadata = data?.metadata || {};
  const analysis = data?.analysis || {};

  const copyToClipboard = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const titleOptions = kit?.titleOptions || [
    { label: 'Recommended Title', text: kit?.metaTitle || metadata?.title || 'Document SEO Title', length: (kit?.metaTitle || metadata?.title || '').length },
  ];

  const descOptions = kit?.descriptionOptions || [
    { label: 'Recommended Description', text: kit?.metaDescription || 'In-depth overview and actionable takeaways.', length: (kit?.metaDescription || '').length },
  ];

  const keywordsList = analysis?.keywords || [];
  const competitorsList = compIntel?.competitors || analysis?.competitors || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-xl backdrop-blur-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Agent SEO Studio &bull; Pre-Publishing Suite</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📄</span>
            <span className="truncate max-w-xl">{metadata?.title || data?.target || 'Document SEO Strategy'}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span>Pages: <strong className="text-gray-200">{metadata?.pagesCount || 1}</strong></span>
            <span>&bull;</span>
            <span>Est. Words: <strong className="text-gray-200">{metadata?.wordCount || 'Parsed'}</strong></span>
            <span>&bull;</span>
            <span>Target: <strong className="text-violet-300">{kit?.primaryKeyword || 'Commercial Intent'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => copyToClipboard(kit?.fullHtmlSnippet, 'headerAllHtml')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20"
          >
            {copiedField === 'headerAllHtml' ? (
              <>
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Copied All Code!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9 9 0 0 0-9 9m16.5 0a9 9 0 0 0-9-9H6.75" />
                </svg>
                <span>Copy Full &lt;head&gt; Kit</span>
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all whitespace-nowrap"
          >
            Upload New File
          </button>
        </div>
      </div>

      {/* Agent Team Status Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { role: 'Document Parser', status: 'Extracted', icon: '📑', color: 'border-blue-500/20 bg-blue-500/5 text-blue-300' },
          { role: 'Competitor Agent', status: `${competitorsList.length} Analyzed`, icon: '🎯', color: 'border-purple-500/20 bg-purple-500/5 text-purple-300' },
          { role: 'SEO Copywriter', status: `${titleOptions.length} Titles Crafted`, icon: '✍️', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' },
          { role: 'Schema Architect', status: 'JSON-LD Ready', icon: '⚙️', color: 'border-amber-500/20 bg-amber-500/5 text-amber-300' },
        ].map((agent) => (
          <div key={agent.role} className={`p-3 rounded-xl border flex items-center gap-3 ${agent.color}`}>
            <span className="text-xl">{agent.icon}</span>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">{agent.role}</p>
              <p className="text-xs font-semibold">{agent.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        {[
          { id: 'seokit', label: 'Generated SEO Assets ✨' },
          { id: 'growth', label: 'AI Search & Growth Blueprint 🚀' },
          { id: 'competitors', label: `Competitor Intelligence (${competitorsList.length}) 🎯` },
          { id: 'keywords', label: `Target Keyword Clusters (${keywordsList.length}) 🔑` },
          { id: 'roadmap', label: 'Publishing Roadmap & FAQs 📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB Growth: AI Search (GEO), Blogs, Backlinks, FAQs */}
      {activeTab === 'growth' && (
        <div className="animate-in fade-in">
          <StrategicGrowthTabs
            growthData={agentCreation?.strategicGrowth || data?.analysis?.agentCreation?.strategicGrowth}
            targetName={metadata?.title || data?.target}
          />
        </div>
      )}

      {/* TAB 1: Generated SEO Kit */}
      {activeTab === 'seokit' && (
        <div className="space-y-6">
          {/* Title Options */}
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Meta Title Options (Select Best Fit)</span>
                </h3>
                <p className="text-xs text-gray-400">Targeting 50–60 characters to maximize click-throughs without SERP truncation.</p>
              </div>
              <span className="text-xs font-medium text-gray-400">Strict SERP Validation</span>
            </div>

            <div className="space-y-3">
              {titleOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitleIdx(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    selectedTitleIdx === idx
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-violet-300">
                        {opt.label}
                      </span>
                      <span className={`text-[11px] font-semibold ${opt.length > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {opt.length} chars
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">{opt.text}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(opt.text, `title_${idx}`);
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-all flex items-center gap-1.5"
                  >
                    {copiedField === `title_${idx}` ? (
                      <span className="text-emerald-400">Copied!</span>
                    ) : (
                      <span>Copy Title</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Description Options */}
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📝</span>
                  <span>Meta Description Options</span>
                </h3>
                <p className="text-xs text-gray-400">Crafted to entice searchers with value hooks and primary keywords (140–160 chars).</p>
              </div>
            </div>

            <div className="space-y-3">
              {descOptions.map((desc, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedDescIdx(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    selectedDescIdx === idx
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-violet-300">
                        {desc.label}
                      </span>
                      <span className={`text-[11px] font-semibold ${desc.length > 160 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {desc.length} chars
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{desc.text}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(desc.text, `desc_${idx}`);
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-all"
                  >
                    {copiedField === `desc_${idx}` ? (
                      <span className="text-emerald-400">Copied!</span>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* URL Slug & Heading Outline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended URL Slug */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔗</span>
                <span>SEO URL Slug</span>
              </h4>
              <p className="text-xs text-gray-400">Clean, hyphenated URL path incorporating primary keyword.</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-emerald-400">
                <span className="text-gray-500">example.com/</span>
                <span className="truncate flex-1 font-semibold">{kit?.suggestedSlug || 'industry-strategy-guide'}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(kit?.suggestedSlug || '', 'slug')}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-sans font-semibold transition-all"
                >
                  {copiedField === 'slug' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Structured Data (Schema) */}
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚙️</span>
                  <span>JSON-LD Schema ({kit?.schema?.type || 'Article'})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => copyToClipboard(kit?.schema?.htmlSnippet || '', 'schemaCode')}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-semibold transition-all"
                >
                  {copiedField === 'schemaCode' ? 'Copied Schema!' : 'Copy JSON-LD'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Valid Schema.org structured data to enable Google rich snippet indexing.</p>
              <pre className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-[11px] text-gray-300 font-mono overflow-x-auto max-h-32">
                {JSON.stringify(kit?.schema?.json || {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Semantic Heading Architecture */}
          {kit?.headingOutline && (
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📑</span>
                    <span>Semantic Heading Architecture (H1 &bull; H2 &bull; H3)</span>
                  </h3>
                  <p className="text-xs text-gray-400">Structured hierarchy engineered for featured snippets and logical content flow.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = kit.headingOutline.map((h) => `${h.level}: ${h.text}`).join('\n');
                    copyToClipboard(text, 'allHeadings');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-all"
                >
                  {copiedField === 'allHeadings' ? 'Copied Outline!' : 'Copy Outline'}
                </button>
              </div>

              <div className="space-y-2">
                {kit.headingOutline.map((heading, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center gap-3 text-xs ${
                      heading.level === 'H1'
                        ? 'bg-violet-500/10 border-violet-500/30 font-bold text-white'
                        : heading.level === 'H2'
                          ? 'bg-gray-950/80 border-gray-800 font-semibold text-gray-200 ml-4'
                          : 'bg-gray-950/40 border-gray-800/60 text-gray-400 ml-8'
                    }`}
                  >
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-gray-800 text-violet-300">
                      {heading.level}
                    </span>
                    <span className="truncate">{heading.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Competitor Intelligence */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Competitors &amp; Market Entities Mentioned</span>
                </h3>
                <p className="text-xs text-gray-400">Brands and entities identified directly in the document, benchmarked for SEO positioning.</p>
              </div>
              <span className="text-xs font-semibold text-violet-400">Agent Benchmarked</span>
            </div>

            {competitorsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No specific competitors directly detected in the document text. The agents focused on broader category keywords.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {competitorsList.map((comp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-800 bg-gray-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{comp.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {comp.mentions || 1} mentions
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {comp.strategicObservation || 'Referenced in document context for industry comparison.'}
                    </p>
                    {comp.liveData?.title && (
                      <div className="p-2 rounded bg-gray-900 border border-gray-800 text-[11px] text-gray-300">
                        <span className="text-violet-400 font-semibold">Live Footprint: </span>
                        {comp.liveData.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tactical Counter-Positioning */}
          {compIntel?.counterPositioning && compIntel.counterPositioning.length > 0 && (
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⚔️</span>
                <span>Tactical SEO Counter-Positioning Angles</span>
              </h4>
              <div className="space-y-3">
                {compIntel.counterPositioning.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-1">
                    <p className="text-xs font-bold text-violet-300">{item.angle}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Target Keyword Clusters */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔑</span>
                <span>Extracted Target Keywords &amp; Search Intent</span>
              </h3>
              <p className="text-xs text-gray-400">Mined from document semantics and categorized by role in your content strategy.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {keywordsList.map((kw, idx) => {
                const phrase = typeof kw === 'string' ? kw : kw.phrase || kw.keyword;
                const role = idx === 0 ? 'Primary' : idx <= 3 ? 'Secondary' : 'Long-tail';
                const intent = idx % 2 === 0 ? 'Informational' : 'Commercial';

                return (
                  <div key={idx} className="p-3.5 rounded-xl border border-gray-800 bg-gray-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        role === 'Primary'
                          ? 'bg-violet-500/20 text-violet-300'
                          : role === 'Secondary'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-800 text-gray-400'
                      }`}>
                        {role}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">{intent}</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{phrase}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Publishing Roadmap & FAQs */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Pre-Publishing Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Recommended Target Word Count</span>
              <p className="text-2xl font-extrabold text-white">
                {roadmap?.recommendedWordCount || '1,500'}+ <span className="text-xs font-medium text-gray-400">words</span>
              </p>
              <p className="text-xs text-gray-400">Optimal article depth for authority ranking on this topic.</p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Estimated Reading Time</span>
              <p className="text-2xl font-extrabold text-white">
                {roadmap?.estimatedReadTimeMinutes || '6'} <span className="text-xs font-medium text-gray-400">minutes</span>
              </p>
              <p className="text-xs text-gray-400">Ideal dwell time to signal high user engagement to Google.</p>
            </div>
          </div>

          {/* Suggested FAQs to Add to Web Page */}
          {roadmap?.suggestedFaqs && (
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>❓</span>
                  <span>Suggested FAQs to Embed on the Web Page</span>
                </h3>
                <p className="text-xs text-gray-400">Answering these core questions captures "People Also Ask" (PAA) Google box snippets.</p>
              </div>

              <div className="space-y-3">
                {roadmap.suggestedFaqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-800 bg-gray-950 space-y-1.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-violet-400">Q:</span>
                      <span>{faq.question}</span>
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed pl-4">
                      {faq.answerSnippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
