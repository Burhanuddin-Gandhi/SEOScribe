import { useState } from 'react';

export default function AgentRemediationView({ remediation, target = '' }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!remediation) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const auditor = remediation.auditorReport || {};
  const preserved = auditor.preservedAssets || [];
  const missing = auditor.missingGaps || [];
  const fixes = remediation.generatedFixes || {};
  const hasFixes = Object.keys(fixes).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Multi-Agent Remediation Philosophy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-gray-900 to-indigo-950/40 border border-violet-500/30">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Agent Surgical Remediation</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Targeted Fixes (Missing Items Only)
          </h3>
          <p className="text-xs text-gray-400 max-w-xl">
            Our agents do not overwrite your existing good tags. We preserve healthy assets and generate code <strong>only for what is missing or broken</strong>.
          </p>
        </div>

        {remediation.targetedHtmlSnippet && (
          <button
            onClick={() => copyToClipboard(remediation.targetedHtmlSnippet, 'targetedHtml')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20 whitespace-nowrap"
          >
            {copiedField === 'targetedHtml' ? (
              <>
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Copied Missing Tags!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9 9 0 0 0-9 9m16.5 0a9 9 0 0 0-9-9H6.75" />
                </svg>
                <span>Copy Missing Tags HTML</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            ✓
          </div>
          <div>
            <p className="text-xs text-gray-400">Healthy Assets Preserved</p>
            <p className="text-sm font-bold text-white">
              {auditor.preservedCount || preserved.length} elements left untouched
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-lg">
            ⚡
          </div>
          <div>
            <p className="text-xs text-gray-400">Gaps Fixed by Agents</p>
            <p className="text-sm font-bold text-white">
              {auditor.missingCount || missing.length} surgical elements generated
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Preserved Assets (What is working well) */}
      <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">🛡️</span>
            <span>Preserved Healthy Assets (No Action Needed)</span>
          </h4>
          <span className="text-xs text-emerald-400 font-semibold">Verified Optimal</span>
        </div>

        {preserved.length === 0 ? (
          <p className="text-xs text-gray-400">No primary tags met optimal criteria; all required agent intervention.</p>
        ) : (
          <div className="space-y-2.5">
            {preserved.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-gray-800 bg-gray-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200">{item.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                      Kept As-Is
                    </span>
                  </div>
                  {item.currentValue && (
                    <p className="text-xs text-gray-400 truncate max-w-xl font-mono">
                      "{item.currentValue}"
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 sm:text-right">{item.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Agent Generated Fixes (Missing Items Only) */}
      <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-violet-400">⚡</span>
            <span>Agent-Generated Fixes (Surgical Interventions)</span>
          </h4>
          <span className="text-xs text-violet-300 font-semibold">{Object.keys(fixes).length} Fixes Ready</span>
        </div>

        {!hasFixes ? (
          <p className="text-xs text-emerald-400 font-medium">
            Congratulations! All audited structural tags were already healthy. No surgical fixes required.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Fix: Title (Only if missing or substandard) */}
            {fixes.title && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-300">{fixes.title.label}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">{fixes.title.length} chars</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fixes.title.value, 'fixTitle')}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                  >
                    {copiedField === 'fixTitle' ? 'Copied!' : 'Copy Title'}
                  </button>
                </div>
                <p className="text-xs text-gray-300 font-medium">{fixes.title.value}</p>
                <p className="text-[11px] text-gray-400">{fixes.title.explanation}</p>
              </div>
            )}

            {/* Fix: Meta Description (Only if missing or substandard) */}
            {fixes.metaDescription && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-300">{fixes.metaDescription.label}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">{fixes.metaDescription.length} chars</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fixes.metaDescription.value, 'fixDesc')}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                  >
                    {copiedField === 'fixDesc' ? 'Copied!' : 'Copy Description'}
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{fixes.metaDescription.value}</p>
                <p className="text-[11px] text-gray-400">{fixes.metaDescription.explanation}</p>
              </div>
            )}

            {/* Fix: H1 Heading (Only if missing or unified) */}
            {fixes.h1 && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{fixes.h1.label}</span>
                  <button
                    onClick={() => copyToClipboard(fixes.h1.value, 'fixH1')}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                  >
                    {copiedField === 'fixH1' ? 'Copied!' : 'Copy H1'}
                  </button>
                </div>
                <p className="text-xs text-gray-300 font-medium font-mono">{fixes.h1.codeSnippet}</p>
                <p className="text-[11px] text-gray-400">{fixes.h1.explanation}</p>
              </div>
            )}

            {/* Fix: JSON-LD Schema (Only if missing) */}
            {fixes.schema && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{fixes.schema.label} ({fixes.schema.type})</span>
                  <button
                    onClick={() => copyToClipboard(fixes.schema.codeSnippet, 'fixSchema')}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                  >
                    {copiedField === 'fixSchema' ? 'Copied Schema!' : 'Copy JSON-LD'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">{fixes.schema.explanation}</p>
                <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-[11px] text-gray-300 font-mono overflow-x-auto max-h-32">
                  {JSON.stringify(fixes.schema.json, null, 2)}
                </pre>
              </div>
            )}

            {/* Fix: Canonical Link (Only if missing) */}
            {fixes.canonical && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{fixes.canonical.label}</span>
                  <button
                    onClick={() => copyToClipboard(fixes.canonical.codeSnippet, 'fixCanonical')}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                  >
                    {copiedField === 'fixCanonical' ? 'Copied!' : 'Copy Tag'}
                  </button>
                </div>
                <p className="text-xs text-gray-300 font-mono">{fixes.canonical.codeSnippet}</p>
                <p className="text-[11px] text-gray-400">{fixes.canonical.explanation}</p>
              </div>
            )}

            {/* Fix: Image Alt Tag Recommendations */}
            {fixes.imageAlt && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                <span className="text-xs font-bold text-amber-300">{fixes.imageAlt.label}</span>
                <p className="text-xs text-gray-300">{fixes.imageAlt.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Targeted HTML Code Box */}
      {remediation.targetedHtmlSnippet && (
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>Targeted HTML Code (Paste Directly into &lt;head&gt;)</span>
            </h4>
            <button
              onClick={() => copyToClipboard(remediation.targetedHtmlSnippet, 'targetedSnippet')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/20"
            >
              {copiedField === 'targetedSnippet' ? 'Copied All Code!' : 'Copy Code'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            This snippet contains <strong>only the missing elements</strong> identified by our agents.
          </p>
          <pre className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs text-violet-300 font-mono overflow-x-auto max-h-56 leading-relaxed">
            {remediation.targetedHtmlSnippet}
          </pre>
        </div>
      )}
    </div>
  );
}
