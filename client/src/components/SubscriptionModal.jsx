import { useState } from 'react';

export default function SubscriptionModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedTier, setSelectedTier] = useState('pro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
            <span>You've used all 3 free audits</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Unlock Unlimited SEO Generation & Audits
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
            Upgrade to SEOScribe Pro for unlimited live URL audits, automatic pre-publishing SEO Kits, and custom schema generators.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pro Plan */}
          <div
            onClick={() => setSelectedTier('pro')}
            className={`
              relative p-5 rounded-xl border cursor-pointer transition-all
              ${selectedTier === 'pro'
                ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10'
                : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">SEOScribe Pro</span>
              <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-medium">Popular</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">$29</span>
              <span className="text-xs text-gray-400"> / month</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Unlimited Live URL Audits
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                PDF-to-SEO Kit Generation
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                JSON-LD Schema & Meta Tag Exports
              </li>
            </ul>
          </div>

          {/* Agency Plan */}
          <div
            onClick={() => setSelectedTier('agency')}
            className={`
              relative p-5 rounded-xl border cursor-pointer transition-all
              ${selectedTier === 'agency'
                ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10'
                : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Agency & Team</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">$79</span>
              <span className="text-xs text-gray-400"> / month</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                White-label Client Reports
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                API Access & Multi-seat Logins
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onUpgradeSuccess?.();
              onClose();
            }}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all"
          >
            Start 14-Day Free Pro Trial
          </button>
          <p className="text-center text-[11px] text-gray-500">
            Cancel anytime with 1 click. Zero risk.
          </p>
        </div>
      </div>
    </div>
  );
}
