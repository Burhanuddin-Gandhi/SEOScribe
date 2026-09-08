import { useState, useEffect } from 'react';

/**
 * AnalysisLoader: A clean, sleek, high-precision loading card with structured progress steps,
 * live elapsed timer, and crisp modern borders (no excessive roundness/bubble shapes).
 */
export default function AnalysisLoader({
  progress = 0,
  steps = [],
  stepIndex = 0,
  fileMeta = null,
  sourceType = 'pdf', // 'pdf' | 'url'
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}s`;
  };

  const currentStep = steps[stepIndex] || steps[0] || {
    title: 'Analyzing document...',
    description: 'Processing content and calculating SEO audit signals.',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/90 shadow-2xl p-6 sm:p-7 space-y-6 animate-fadeIn">
      {/* Top Header with Active Stage & Live Elapsed Timer */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {currentStep.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {sourceType === 'pdf' ? 'High-fidelity document audit in progress' : 'Live web page audit in progress'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700/60 text-xs font-mono text-gray-300">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Elapsed: <strong className="text-violet-300">{formatTime(elapsedSeconds)}</strong></span>
        </div>
      </div>

      {/* Progress Track & Metric */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">
            Stage {stepIndex + 1} of {steps.length || 1}
          </span>
          <span className="text-violet-400 font-semibold font-mono text-sm">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Clean Linear Progress Bar */}
        <div className="w-full h-2 rounded-md bg-gray-800/90 overflow-hidden relative border border-gray-700/40">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(139,92,246,0.5)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Step Breakdown Timeline Grid */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div
                key={idx}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border transition-all text-xs
                  ${isCurrent
                    ? 'border-violet-500/40 bg-violet-950/20 text-white'
                    : isCompleted
                      ? 'border-gray-800 bg-gray-800/30 text-gray-400'
                      : 'border-transparent bg-gray-900/40 text-gray-600'
                  }
                `}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded bg-violet-500/20 border border-violet-500/60 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-gray-400/80 line-clamp-1 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Target Info Footer Card */}
      {fileMeta && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-gray-800/50 border border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-2 truncate">
            <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="font-medium text-gray-200 truncate">{fileMeta.name}</span>
          </div>
          {fileMeta.size && (
            <span className="text-gray-500 font-mono flex-shrink-0 ml-3">
              {(fileMeta.size / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>
      )}
    </div>
  );
}
