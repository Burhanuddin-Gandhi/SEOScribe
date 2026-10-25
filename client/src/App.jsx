import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import api from './api'

import SEOAnalyzerTab from './components/SEOAnalyzerTab'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import MethodologyPage from './components/MethodologyPage'

function App() {
  const [resetKey, setResetKey] = useState(0);

  // Warm up backend on initial load (prevents Render free-tier cold-start timeouts)
  useEffect(() => {
    api.get('/api/seo/health').catch(() => {
      // Ignore initial background ping error if waking up
    });
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-950 font-['Inter',sans-serif]">

        <SiteHeader onReset={handleReset} />

        <main className="flex-1">
          <Routes>

            <Route
              path="/"
              element={
                <div className="max-w-5xl mx-auto px-6 py-10">
                  <SEOAnalyzerTab key={resetKey} />
                </div>
              }
            />

            <Route
              path="/methodology"
              element={<MethodologyPage />}
            />

          </Routes>
        </main>

        <SiteFooter />

      </div>
    </BrowserRouter>
  )
}

export default App