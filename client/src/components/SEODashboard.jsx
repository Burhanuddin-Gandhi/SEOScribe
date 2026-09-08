import { useState, useMemo } from 'react';
import GeneratedSEOKitView from './GeneratedSEOKitView';
import AgentRemediationView from './AgentRemediationView';
import StrategicGrowthTabs from './StrategicGrowthTabs';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const SEVERITY_STYLES = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

const PRIORITY_STYLES = {
  High: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  Medium: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  Low: 'bg-gray-700/40 text-gray-300 border border-gray-600/40',
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function gradeTone(score) {
  if (score < 50) return { label: 'Needs Attention', className: 'bg-red-500/10 border-red-500/20 text-red-400' };
  if (score < 75) return { label: 'Room to Improve', className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
  return { label: 'Healthy', className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
}

function scoreColor(score) {
  if (score < 50) return 'text-red-500';
  if (score < 75) return 'text-amber-500';
  return 'text-emerald-500';
}

function barColor(score) {
  if (score < 50) return 'bg-red-500';
  if (score < 75) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function consistencyDisplay(check) {
  if (!check || check.label === 'first-analysis') {
    return {
      icon: '🆕',
      className: 'bg-gray-800/60 border-gray-700 text-gray-400',
      text: 'First time this target has been analyzed — nothing to compare against yet.',
    };
  }

  const prevDate = formatDate(check.previousAnalyzedAt);
  const deltaText =
    check.scoreDelta > 0
      ? `+${check.scoreDelta}`
      : check.scoreDelta === 0
        ? 'no change'
        : `${check.scoreDelta}`;

  switch (check.label) {
    case 'unchanged':
      return {
        icon: null,
        className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        text: `Consistent with the previous analysis (${prevDate}) — content and score are identical.`,
      };
    case 'minor-drift':
      return {
        icon: null,
        className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        text: `Consistent with the previous analysis (${prevDate}) — score changed by ${deltaText} points, within normal variation.`,
      };
    case 'significant-change':
      return {
        icon: null,
        className: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        text: `Score changed significantly since the last analysis (${prevDate}): ${deltaText} points. The page's content may have changed — worth a manual look.`,
      };
    case 'inconsistent-scoring-anomaly':
      return {
        icon: null,
        className: 'bg-red-500/10 border-red-500/20 text-red-400',
        text: `The exact same content produced a different score than the last analysis (${prevDate}). This shouldn't happen and has been flagged for review.`,
      };
    default:
      return null;
  }
}

export default function SEODashboard({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [severityFilter, setSeverityFilter] = useState('all');

  const analysis = data?.analysis;
  const metadata = data?.metadata;
  const sourceType = data?.sourceType;
  const target = data?.target;
  const evidence = data?.evidence;
  const consistencyCheck = data?.consistencyCheck;

  const tone = useMemo(
    () => (analysis ? gradeTone(analysis.score) : null),
    [analysis]
  );

  const filteredIssues = useMemo(() => {
    if (!analysis?.issues) return [];
    const filtered = severityFilter === 'all'
      ? analysis.issues
      : analysis.issues.filter((issue) => issue.severity === severityFilter);
    return [...filtered].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    );
  }, [analysis, severityFilter]);

  if (!analysis) {
    return (
      <div className="p-8 rounded-2xl bg-gray-900/90 border border-gray-800 text-center text-gray-400 text-sm">
        No analysis data to display yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold shrink-0">
            {sourceType === 'url' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{target || metadata?.title}</h3>
            <p className="text-xs text-gray-400">
              Analyzed {formatDate(metadata?.analyzedAt)}
              {metadata?.pagesCount ? ` • ${metadata.pagesCount} page${metadata.pagesCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all whitespace-nowrap"
        >
          Analyze Another
        </button>
      </div>

      {/* Consistency Banner — shows whether repeated analysis of this
          target has produced stable results, a concrete trust signal the
          user can observe by re-running the analysis themselves. */}
      {(() => {
        const c = consistencyDisplay(consistencyCheck);
        if (!c) return null;
        return (
          <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${c.className}`}>
            <p>{c.text}</p>
          </div>
        );
      })()}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        {[
          {
            id: 'seokit',
            label: (data?.agentRemediation || analysis?.agentRemediation)
              ? 'Agent Surgical Fixes ⚡'
              : 'Generated SEO Kit ✨',
          },
          { id: 'growth', label: 'AI Search & Growth Blueprint 🚀' },
          { id: 'overview', label: 'Executive Summary' },
          { id: 'issues', label: `SEO Issues (${analysis.summary?.totalIssues ?? analysis.issues?.length ?? 0})` },
          { id: 'recommendations', label: 'Action Roadmap' },
          { id: 'evidence', label: 'Evidence & Verification' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
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

      {/* Tab 0: Agent Surgical Fixes / Generated SEO Kit */}
      {activeTab === 'seokit' && (
        <div className="animate-in fade-in">
          {(data?.agentRemediation || analysis?.agentRemediation) ? (
            <AgentRemediationView
              remediation={data?.agentRemediation || analysis?.agentRemediation}
              target={target || metadata?.title}
            />
          ) : (
            <GeneratedSEOKitView
              kit={analysis.generatedSEOKit}
              target={target || metadata?.title}
              sourceType={sourceType}
            />
          )}
        </div>
      )}

      {/* Tab Growth: AI Search (GEO), Blogs, Backlinks, FAQs */}
      {activeTab === 'growth' && (
        <div className="animate-in fade-in">
          <StrategicGrowthTabs
            growthData={(data?.agentRemediation?.strategicGrowth || analysis?.agentRemediation?.strategicGrowth)}
            targetName={target || metadata?.title}
          />
        </div>
      )}

      {/* Tab 1: Executive Summary */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Score Hero Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-violet-950/30 border border-violet-500/20 shadow-2xl">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center p-4 md:border-r border-gray-800/60">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={scoreColor(analysis.score)}
                    strokeDasharray={`${analysis.score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white">{analysis.score}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">SEO Health</span>
                </div>
              </div>
              <div className={`mt-3 px-3 py-1 rounded-full border text-xs font-semibold ${tone.className}`}>
                Grade {analysis.grade} &bull; {tone.label}
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">SEO Category Performance</h4>

              <CategoryBar label="Technical SEO" score={analysis.categoryScores?.technical ?? 0} />
              <CategoryBar label="On-Page SEO" score={analysis.categoryScores?.onPage ?? 0} />
              <CategoryBar label="Performance & Mobile" score={analysis.categoryScores?.performance ?? 0} />
              <CategoryBar label="Content & Keyword Strategy" score={analysis.categoryScores?.content ?? 0} />
            </div>
          </div>

          {/* Quick Insights Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="Critical Issues" value={analysis.summary?.highSeverity ?? 0} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
            <MiniStat label="Medium Issues" value={analysis.summary?.mediumSeverity ?? 0} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
            <MiniStat label="Keywords Found" value={analysis.summary?.keywordsCount ?? analysis.keywords?.length ?? 0} color="text-violet-400" bg="bg-violet-500/10 border-violet-500/20" />
            <MiniStat label="Competitors Analyzed" value={analysis.summary?.competitorsAnalyzed ?? analysis.competitors?.length ?? 0} color="text-indigo-400" bg="bg-indigo-500/10 border-indigo-500/20" />
          </div>

          {/* Target Keywords & Competitors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keywords */}
            <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                Target Keywords Identified
              </h4>
              <div className="flex flex-wrap gap-2">
                {(analysis.keywords || []).map((kw, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
                    "{kw}"
                  </span>
                ))}
                {(!analysis.keywords || analysis.keywords.length === 0) && (
                  <span className="text-gray-500 text-xs">No keywords identified.</span>
                )}
              </div>
            </div>

            {/* Competitor Benchmarks */}
            <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                Competitors Mentioned in Content
              </h4>
              <div className="space-y-2">
                {(analysis.competitors || []).map((comp, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-xs">
                    <span className="font-semibold text-white">{comp.name}</span>
                    <div className="flex items-center gap-3 text-gray-400">
                      {typeof comp.da === 'number' && (
                        <span>DA: <strong className="text-violet-400">{comp.da}</strong></span>
                      )}
                      {comp.contentCount && <span>{comp.contentCount}</span>}
                      {typeof comp.mentions === 'number' && !comp.contentCount && (
                        <span>
                          Mentioned <strong className="text-violet-400">{comp.mentions}×</strong> in content
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!analysis.competitors || analysis.competitors.length === 0) && (
                  <span className="text-gray-500 text-xs italic">
                    No competitor brands or external domain references detected in this document.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SEO Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-gray-300">
              Found {analysis.issues?.length ?? 0} Audit Findings & Weaknesses
            </h4>
            <div className="flex items-center gap-2">
              {['all', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all
                    ${severityFilter === sev
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'text-gray-400 hover:text-gray-200 bg-gray-800/60 hover:bg-gray-800 border border-gray-700'
                    }
                  `}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex items-start gap-4">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.low}`}>
                  {issue.severity}
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h5 className="text-white text-sm font-semibold">{issue.title}</h5>
                    <span className="text-xs text-gray-500">{issue.category}</span>
                  </div>
                  <p className="text-xs text-gray-400">{issue.description}</p>
                </div>
              </div>
            ))}
            {filteredIssues.length === 0 && (
              <div className="p-6 rounded-xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 text-sm">
                No issues match this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Action Roadmap */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4 animate-in fade-in">
          <h4 className="text-sm font-semibold text-gray-300">
            Recommended Action Plan for Rank Optimization
          </h4>
          <div className="space-y-3">
            {(analysis.recommendations || []).map((rec, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Medium}`}>
                    Priority: {rec.priority}
                  </span>
                  <span className="text-xs text-gray-500">{rec.timeframe}</span>
                </div>
                <h5 className="text-white text-sm font-bold">{rec.title}</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{rec.action}</p>
              </div>
            ))}
            {(!analysis.recommendations || analysis.recommendations.length === 0) && (
              <div className="p-6 rounded-xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 text-sm">
                No recommendations available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Evidence — the raw facts behind the analysis, so the user
          can verify them directly (view-source on their own site, or the
          PDF's own document properties) instead of just trusting the
          conclusions above. */}
      {activeTab === 'evidence' && evidence && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <p className="text-xs text-gray-400 leading-relaxed">
              These are the exact values our extraction found — {sourceType === 'url'
                ? 'check them against your own page\'s view-source.'
                : 'check them against the PDF\'s own document properties.'} Every issue on the previous tabs is derived directly from these numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EvidenceRow label="Title tag found" value={evidence.title || '(none found)'} />
            {sourceType === 'url' && (
              <>
                <EvidenceRow label="Meta description found" value={evidence.metaDescription || '(none found)'} />
                <EvidenceRow label="H1 count" value={String(evidence.h1Count)} />
                <EvidenceRow label="H1 text" value={evidence.h1Texts?.length ? evidence.h1Texts.join(' | ') : '(none found)'} />
                <EvidenceRow label="Images / missing alt text" value={`${evidence.imagesMissingAlt} of ${evidence.imageCount}`} />
                <EvidenceRow label="Canonical tag present" value={evidence.hasCanonical ? 'Yes' : 'No'} />
                <EvidenceRow label="Schema (JSON-LD) present" value={evidence.hasSchema ? 'Yes' : 'No'} />
                <EvidenceRow label="Viewport meta tag present" value={evidence.hasViewportMeta ? 'Yes' : 'No'} />
                <EvidenceRow label="Served over HTTPS" value={evidence.isHttps ? 'Yes' : 'No'} />
                <EvidenceRow label="Internal links found" value={String(evidence.internalLinkCount)} />
                <EvidenceRow label="Word count" value={String(evidence.wordCount)} />
                <EvidenceRow
                  label="Extraction method"
                  value={evidence.renderMethod === 'headless-fallback' ? 'Full browser render (JS executed)' : 'Static page fetch'}
                />
              </>
            )}
            {sourceType === 'pdf' && (
              <>
                <EvidenceRow label="Author (from PDF metadata)" value={evidence.author || '(none found)'} />
                <EvidenceRow label="Pages (primary parser)" value={String(evidence.pages)} />
                <EvidenceRow
                  label="Pages (cross-check parser)"
                  value={evidence.crossCheckPageCount != null ? String(evidence.crossCheckPageCount) : 'unavailable'}
                />
                <EvidenceRow
                  label="Page counts agree"
                  value={evidence.pageCountsMatch == null ? 'Could not verify' : evidence.pageCountsMatch ? 'Yes' : 'No — flagged'}
                />
                <EvidenceRow label="Character count" value={String(evidence.characterCount)} />
                <EvidenceRow label="Word count" value={String(evidence.wordCount)} />
                <EvidenceRow label="Text truncated for analysis" value={evidence.truncated ? 'Yes' : 'No'} />
              </>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <p className="text-[11px] text-gray-500 font-mono break-all">
              Content hash (SHA-256): {evidence.contentHash}
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              This is a fingerprint of the exact text this analysis was run on — kept in our audit log so any result can be traced back to its exact source later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBar({ label, score }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{score} / 100</span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor(score)} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, bg }) {
  return (
    <div className={`p-4 rounded-xl border ${bg} flex flex-col items-center justify-center text-center`}>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EvidenceRow({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
      <span className="text-sm text-gray-200 break-words">{value}</span>
    </div>
  );
}