# SEOScribe 🚀
### Automated SEO Intelligence & Pre-Publishing Studio

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini 2.5](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**SEOScribe** is a full-stack SEO intelligence platform engineered to bridge the gap between technical web audits and high-converting search optimization. Unlike traditional SEO tools that either provide generic checklist advice or rewrite entire pages indiscriminately, SEOScribe operates across two specialized workflows:

1. **Live Web Page Audit & Surgical Remediation (URL Mode):** Audits live URLs through a resilient multi-tier scraping waterfall, separates healthy tags from broken ones, and orchestrates specialized AI agents to generate *only* the missing or substandard HTML tags.
2. **Pre-Publishing Document SEO Studio (PDF Mode):** Ingests raw, unpublished business collateral (whitepapers, case studies, market reports), classifies layout structure deterministically, and crafts a complete **0-to-1 SEO kit** (CTR-optimized titles, meta descriptions, semantic heading hierarchies, OpenGraph cards, and JSON-LD schema) *before* the document is published online.

---

## ⚡ Key Highlights

- **Multi-Tier Scraper Waterfall:** Seamless failover from **Firecrawl Cloud API** (clean markdown) $\to$ **ScrapingBee Stealth Gateway** (residential proxies/anti-bot bypass) $\to$ **Playwright Headless Chromium** (SPA rendering) + Axios static fetch.
- **Deterministic Document Classifier:** Pure local inspection via `pdfjs-dist` (0ms AI latency) analyzing affine transformation matrices and image draw operator coverage. Routes image-heavy documents to **Gemini 2.5 Flash** (visual interpretations) and table-heavy documents to **LlamaParse** (structured Markdown tables).
- **Multi-Agent Orchestration:** Deconstructs prompt generation into 5 dedicated personas: *Auditor*, *Copywriter*, *Competitor Analyst*, *Technical Schema Architect*, and *Growth & GEO Strategist*.
- **Generative Engine Optimization (GEO):** Crafts 40–50 word direct definition snippets specifically tailored for citations in **Perplexity**, **ChatGPT Search**, and **Google AI Overviews**.
- **Trust, Verification & Consistency:**
  - **Raw Evidence Tab:** Direct exposure of unmanipulated DOM facts (character lengths, exact H1 text strings, missing image alt counts, canonical URLs).
  - **SHA-256 Audit Trail:** Fingerprints both binary PDF buffers and extracted text.
  - **Anomaly Detection:** Tracks re-analyzed URLs/documents. If the exact same content produces a scoring drift, flags an anomaly warning rather than silently displaying false numbers.

---

## 🏗️ Architecture & Data Flow

```
                                  ┌───────────────────────────────┐
                                  │   SEOScribe Web Client (Vite) │
                                  └───────────────┬───────────────┘
                                                  │
                                   REST API / JSON Payloads
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │      Node.js / Express        │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┴──┐         ┌──┴────────────────────┐
                     │   URL Analysis Mode   │         │   PDF Document Mode   │
                     └────────────┬──────────┘         └───────────┬───────────┘
                                  │                                │
                     ┌────────────▼──────────┐         ┌───────────▼───────────┐
                     │ Multi-Tier Waterfall  │         │ Deterministic Router  │
                     │  1. Firecrawl Cloud   │         │ (pdfjs-dist heuristic)│
                     │  2. ScrapingBee       │         └─────┬───────────┬─────┘
                     │  3. Playwright / DOM  │               │           │
                     └────────────┬──────────┘        Visual │           │ Standard Text
                                  │                   Pages  │           │ & Tables
                                  │                 (>= 30%) │           │
                                  │                          ▼           ▼
                                  │                   ┌──────────┐  ┌──────────┐
                                  │                   │  Gemini  │  │LlamaParse│
                                  │                   │2.5 Flash │  │  Cloud   │
                                  │                   └─────┬────┘  └─────┬────┘
                                  │                         │             │
                                  └─────────────────┬───────┴─────────────┘
                                                    │
                                                    ▼
                                  ┌──────────────────────────────────┐
                                  │      Agent Orchestrator          │
                                  ├──────────────────────────────────┤
                                  │ • Auditor Agent (Gap Detection)  │
                                  │ • Copywriter Agent (Titles/Meta) │
                                  │ • Competitor Intelligence        │
                                  │ • Technical Schema Architect     │
                                  │ • Growth & GEO Strategist        │
                                  └─────────────────┬────────────────┘
                                                    │
                                                    ▼
                                  ┌──────────────────────────────────┐
                                  │  Structured SEO Intelligence     │
                                  │  • Surgical Fixes / SEO Kit      │
                                  │  • Raw Evidence & SHA-256 Hash   │
                                  │  • GEO Answers & FAQ Schema      │
                                  └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (`react`, `react-dom`)
- **Tooling:** Vite 8, React Router v7
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Networking:** Axios
- **Design System:** Responsive dark-mode interface with animated status loaders, clipboard triggers, and tabbed dashboards.

### Backend
- **Runtime:** Node.js, Express 4
- **File Uploads:** Multer (in-memory buffer processing, 30MB limit)
- **Local PDF Analysis:** `pdfjs-dist` (graphics state tracking & affine transform determinant math)
- **HTML DOM Parsing:** Cheerio
- **Dynamic Headless Rendering:** Playwright (Chromium)
- **Data Integrity:** Node.js native `crypto` (SHA-256 content & binary buffer fingerprinting)

### External APIs
- **Google Gemini API (`@google/genai`):** Gemini 2.5 Flash for visual PDF parsing and multi-agent reasoning.
- **LlamaParse API (`llama-parse`):** High-precision table extraction with internal free-tier credit tracking.
- **Firecrawl API (`firecrawl`):** Tier-1 web extraction.
- **ScrapingBee API:** Tier-2 stealth headless rendering gateway.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/SEOScribe.git
cd SEOScribe
```

### 2. Backend Setup
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
In a separate terminal window:
```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```
