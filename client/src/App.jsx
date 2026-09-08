import { BrowserRouter, Routes, Route } from 'react-router-dom'

import SEOAnalyzerTab from './components/SEOAnalyzerTab'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import MethodologyPage from './components/MethodologyPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-950 font-['Inter',sans-serif]">

        <SiteHeader />

        <main className="flex-1">
          <Routes>

            <Route
              path="/"
              element={
                <div className="max-w-5xl mx-auto px-6 py-10">
                  <SEOAnalyzerTab />
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