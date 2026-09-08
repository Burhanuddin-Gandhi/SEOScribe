import { useState, useCallback } from 'react';
import URLAnalyzer from './urlAnalyzer';
import PDFUploader from './PDFUploader';
import SEODashboard from './SEODashboard';
import PDFSEODashboard from './PDFSEODashboard';

export default function SEOAnalyzerTab() {
  const [mode, setMode] = useState('url'); // 'url' | 'pdf'
  const [result, setResult] = useState(null);

  const handleReset = useCallback(() => setResult(null), []);

  return (
    <div className="space-y-8">
      {/* Mode Selector — hidden once a result is showing */}
      {!result && (
        <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-900/80 border border-gray-800 w-fit mx-auto">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${mode === 'url'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Web Page URL
          </button>
          <button
            type="button"
            onClick={() => setMode('pdf')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${mode === 'pdf'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            PDF Document
          </button>
        </div>
      )}

      {/* Active view */}
      {result ? (
        result.sourceType === 'pdf' || result.agentCreation ? (
          <PDFSEODashboard data={result} onReset={handleReset} />
        ) : (
          <SEODashboard data={result} onReset={handleReset} />
        )
      ) : mode === 'url' ? (
        <URLAnalyzer onAnalysisComplete={setResult} />
      ) : (
        <PDFUploader onAnalysisComplete={setResult} />
      )}
    </div>
  );
}
