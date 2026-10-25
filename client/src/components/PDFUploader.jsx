import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../api';
import AnalysisLoader from './AnalysisLoader';

const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FRIENDLY_STEPS = [
  {
    title: 'Reading your document...',
    description: 'Checking page count, text sections, and layout.',
    progressTarget: 20,
  },
  {
    title: 'Extracting content & structure...',
    description: 'Gathering headings, key paragraphs, and data tables.',
    progressTarget: 45,
  },
  {
    title: 'Reviewing visual charts & tables...',
    description: 'Carefully reading scanned tables, graphics, and details.',
    progressTarget: 70,
  },
  {
    title: 'Running SEO health checks...',
    description: 'Analyzing keyword density, content structure, and SEO signals.',
    progressTarget: 88,
  },
  {
    title: 'Finalizing your audit report...',
    description: 'Putting together your custom score and recommendations.',
    progressTarget: 95,
  },
];

export default function PDFUploader({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Smoothly increment progress and step messages while uploading
  useEffect(() => {
    if (!isUploading) {
      setProgress(0);
      setStepIndex(0);
      return;
    }

    // Step message rotator
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < FRIENDLY_STEPS.length - 1 ? prev + 1 : prev));
    }, 7000);

    // Smooth progress bar animator
    const progressInterval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 93) return oldProgress; // Hold at 93% until server responds
        const diff = 93 - oldProgress;
        const step = Math.max(0.4, diff * 0.05);
        return Math.min(93, Number((oldProgress + step).toFixed(1)));
      });
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isUploading]);

  // Client-side validation
  const validateFile = useCallback((selectedFile) => {
    if (!selectedFile) return 'No file selected.';
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed. Please select a .pdf file.';
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback((selectedFile) => {
    setError(null);

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }, [validateFile]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }, [handleFile]);

  // Upload to backend
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(5);
    setStepIndex(0);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // 3-minute timeout for large documents (e.g. 40+ pages)
      const response = await api.post('/api/seo/upload-pdf', formData, {
        timeout: 180000,
      });

      const payload = response.data;

      if (!payload?.success) {
        setError(payload?.error || 'Analysis failed. Please try again.');
        return;
      }

      // Complete progress animation
      setProgress(100);

      // Map to PDFSEODashboard schema
      const normalized = {
        sourceType: 'pdf',
        target: payload.filename,
        metadata: {
          title: payload.title || payload.info?.title || payload.filename,
          analyzedAt: new Date().toISOString(),
          pagesCount: payload.pages || payload.pageCount,
          wordCount: payload.wordCount,
          fileSize: payload.fileSize,
        },
        analysis: payload.analysis,
        agentCreation: payload.agentCreation || payload.analysis?.agentCreation,
        evidence: payload.evidence,
        consistencyCheck: payload.consistencyCheck,
      };

      setTimeout(() => {
        onAnalysisComplete?.(normalized);
      }, 500);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred. Please try again.';
      setError(message);
      setProgress(0);
      setStepIndex(0);
    } finally {
      setIsUploading(false);
    }
  }, [file, onAnalysisComplete]);

  // Reset state
  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
    setStepIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const currentStep = FRIENDLY_STEPS[stepIndex] || FRIENDLY_STEPS[0];

  return (
    <div className="space-y-8">
      {/* Title Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          SEO Document Analyzer
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
          Upload your website audit, strategy notes, or SEO PDF report to generate an instant actionable SEO audit & health score dashboard.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => !file && !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group rounded-xl border-2 border-dashed p-10
          transition-all duration-300 ease-out
          ${isUploading ? 'cursor-wait border-violet-500/40 bg-violet-950/20' : 'cursor-pointer'}
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10 scale-[1.005]'
            : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-gray-700 bg-gray-900/50 hover:border-violet-500/50 hover:bg-gray-900'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          id="pdf-upload-input"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-4 text-center">
          {/* Icon */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${isDragging
              ? 'bg-violet-500/20 shadow-lg shadow-violet-500/10'
              : file
                ? 'bg-emerald-500/20'
                : 'bg-gray-800 group-hover:bg-violet-500/20 group-hover:text-violet-400'
            }
          `}>
            {file ? (
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-gray-400 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            )}
          </div>

          {/* Text */}
          {file ? (
            <div className="space-y-1">
              <p className="text-emerald-400 font-semibold text-base">{file.name}</p>
              <p className="text-gray-500 text-xs font-mono">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-gray-300 font-medium text-base">
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-gray-500 text-xs">
                or <span className="text-violet-400 hover:text-violet-300 font-medium">browse files</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern High-Precision Analysis Loader */}
      {isUploading && (
        <AnalysisLoader
          progress={progress}
          steps={FRIENDLY_STEPS}
          stepIndex={stepIndex}
          fileMeta={file ? { name: file.name, size: file.size } : null}
          sourceType="pdf"
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-red-400 font-medium text-sm">Upload Error</p>
            <p className="text-red-300/80 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {file && !isUploading && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleUpload}
            id="upload-pdf-btn"
            className="px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            Run SEO Analysis
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}