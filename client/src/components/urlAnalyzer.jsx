import { useState, useCallback, useEffect } from 'react';
import api from '../api';
import AnalysisLoader from './AnalysisLoader';

const URL_PRESETS = ['example.com', 'mybrand.io', 'acmecorp.dev'];

function normalizeUrl(input) {
  let trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

function isValidUrl(input) {
  if (!input) return false;
  const normalized = normalizeUrl(input);
  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

const URL_STEPS = [
  {
    title: 'Connecting to target website...',
    description: 'Fetching HTML payload, status code, and HTTP headers.',
    progressTarget: 25,
  },
  {
    title: 'Parsing DOM & rendering styles...',
    description: 'Scanning meta tags, OpenGraph data, headings, and semantic DOM.',
    progressTarget: 55,
  },
  {
    title: 'Evaluating links & media assets...',
    description: 'Checking internal/external link structures, images, and alt attributes.',
    progressTarget: 80,
  },
  {
    title: 'Compiling SEO health score...',
    description: 'Generating actionable optimization checklist and grade.',
    progressTarget: 95,
  },
];

export default function URLAnalyzer({ onAnalysisComplete }) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  // Smoothly increment progress and step messages while analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      setStepIndex(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < URL_STEPS.length - 1 ? prev + 1 : prev));
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 92) return oldProgress;
        const diff = 92 - oldProgress;
        const step = Math.max(0.6, diff * 0.08);
        return Math.min(92, Number((oldProgress + step).toFixed(1)));
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  const handleChange = useCallback((e) => {
    setUrl(e.target.value);
    if (error) setError(null);
  }, [error]);

  const handlePreset = useCallback((preset) => {
    setUrl(preset);
    setError(null);
    setTouched(true);
  }, []);

  const handleAnalyze = useCallback(async () => {
    setTouched(true);
    const trimmed = url.trim();

    if (!trimmed) {
      setError('Enter a website domain or URL to analyze.');
      return;
    }

    if (!isValidUrl(trimmed)) {
      setError('Enter a valid domain name (e.g. example.com or mybrand.io)');
      return;
    }

    const normalizedTarget = normalizeUrl(trimmed);

    setIsAnalyzing(true);
    setError(null);
    setProgress(10);
    setStepIndex(0);

    try {
      const response = await api.post(
        '/api/seo/analyze-url',
        { url: normalizedTarget },
        { timeout: 90000 }
      );

      const payload = response.data;

      if (!payload?.success) {
        setError(payload?.error || 'Analysis failed. Please try again.');
        return;
      }

      setProgress(100);

      const normalized = {
        sourceType: 'url',
        target: payload.url,
        metadata: {
          title: payload.pageTitle || payload.url,
          analyzedAt: new Date().toISOString(),
          pagesCount: 1,
        },
        analysis: payload.analysis,
        evidence: payload.evidence,
        consistencyCheck: payload.consistencyCheck,
      };

      setTimeout(() => {
        onAnalysisComplete?.(normalized);
      }, 400);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED'
          ? 'The analysis timed out. The site may be slow to respond — try again.'
          : null) ||
        err.message ||
        'An unexpected error occurred. Please try again.';
      setError(message);
      setProgress(0);
      setStepIndex(0);
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, onAnalysisComplete]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  }, [handleAnalyze, isAnalyzing]);

  const showInlineInvalid = touched && url && !isValidUrl(url) && !error;

  return (
    <div className="space-y-8">
      {/* Title Section with Freemium Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-emerald-400">Live Web Page Audit &bull; Full Access</span>
        </div>

        <h2 className="text-3xl font-bold text-white tracking-tight">
          Live Website SEO Analyzer &amp; Generator
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
          Enter any website domain or link to generate an instant actionable SEO audit &amp; tailored replacement SEO Kit.
        </p>
      </div>

      {/* Input Zone (styled with clean modern rounded-xl borders) */}
      <div
        className={`
          relative group rounded-xl border-2 border-dashed p-10
          transition-all duration-300 ease-out
          ${showInlineInvalid
            ? 'border-red-500/40 bg-red-500/5'
            : url && isValidUrl(url)
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-gray-700 bg-gray-900/50 focus-within:border-violet-500/50 focus-within:bg-gray-900'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Icon */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${url && isValidUrl(url)
              ? 'bg-emerald-500/20'
              : 'bg-gray-800 group-focus-within:bg-violet-500/20 group-focus-within:text-violet-400'
            }
          `}>
            {url && isValidUrl(url) ? (
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-gray-400 group-focus-within:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5 21 3m0 0h-5.25M21 3v5.25M3 21l7.5-7.5M3 21v-5.25M3 21h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>

          {/* Text + Input */}
          <div className="w-full max-w-md space-y-2">
            <p className="text-gray-300 font-medium text-base">
              Enter website domain or link
            </p>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              onChange={handleChange}
              onBlur={() => setTouched(true)}
              onKeyDown={handleKeyDown}
              placeholder="example.com or mybrand.io/about"
              disabled={isAnalyzing}
              className={`
                w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium
                bg-gray-950/60 border text-white placeholder-gray-600
                focus:outline-none focus:ring-2 transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                ${showInlineInvalid
                  ? 'border-red-500/40 focus:ring-red-500/30'
                  : 'border-gray-800 focus:ring-violet-500/30 focus:border-violet-500/50'
                }
              `}
            />
            {showInlineInvalid && (
              <p className="text-red-400 text-xs font-medium">
                Enter a valid domain name (e.g. example.com)
              </p>
            )}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-600">
              Quick test:
            </span>
            {URL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                disabled={isAnalyzing}
                className="px-3 py-1 rounded-lg bg-gray-800/80 hover:bg-violet-500/10 border border-gray-700 hover:border-violet-500/40 text-gray-400 hover:text-violet-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern High-Precision Analysis Loader */}
      {isAnalyzing && (
        <AnalysisLoader
          progress={progress}
          steps={URL_STEPS}
          stepIndex={stepIndex}
          fileMeta={{ name: url.replace(/^https?:\/\//, '') }}
          sourceType="url"
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-red-400 font-medium text-sm">Analysis Error</p>
            <p className="text-red-300/80 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!isAnalyzing && (
        <div className="flex items-center justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            id="analyze-url-btn"
            className="px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            Generate Tailored SEO Audit
          </button>
        </div>
      )}
    </div>
  );
}