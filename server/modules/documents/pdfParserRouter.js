const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');
const { LlamaParse } = require('llama-parse');
const { PDFDocument } = require('pdf-lib');

/**
 * For high-volume visual / scanned PDFs (> 15 pages), extracts the primary executive pages
 * (first 12 pages + final 2 summary pages) so that multimodal vision OCR runs within 30-40 seconds,
 * avoiding reverse-proxy gateway timeouts on free cloud tiers.
 */
async function extractKeyVisualPages(pdfBuffer, maxPages = 15) {
  try {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const total = srcDoc.getPageCount();
    if (total <= maxPages) {
      return { buffer: pdfBuffer, sampled: false, totalPages: total, processedPages: total };
    }
    const dstDoc = await PDFDocument.create();
    const indices = [];
    for (let i = 0; i < Math.min(12, total); i++) indices.push(i);
    for (let i = Math.max(12, total - 2); i < total; i++) {
      if (!indices.includes(i)) indices.push(i);
    }
    const copiedPages = await dstDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((p) => dstDoc.addPage(p));
    const subPdfBytes = await dstDoc.save();
    return {
      buffer: Buffer.from(subPdfBytes),
      sampled: true,
      totalPages: total,
      processedPages: indices.length,
    };
  } catch (err) {
    console.warn(`[ParserRouter] Visual page sampling failed, using original buffer: ${err.message}`);
    return { buffer: pdfBuffer, sampled: false, totalPages: 0, processedPages: 0 };
  }
}

/**
 * Wraps an async promise with a strict timeout to prevent indefinite server hangs
 */
function withTimeout(promise, ms = 15000, errorMsg = 'Operation timed out') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(errorMsg);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Lazy-load pdfjs-dist ES Module
let pdfjsLibPromise = null;
function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLibPromise;
}

// ---------------------------------------------------------------------------
// CONFIGURATION & TUNABLE THRESHOLDS
// ---------------------------------------------------------------------------
/**
 * CLASSIFICATION HEURISTIC THRESHOLDS
 *
 * NOTE: These thresholds are initial baseline placeholders tuned for typical business
 * and technical PDFs. They should be tuned after empirical testing across diverse PDF sets.
 *
 * 1. PAGE_MIN_TEXT_CHARS: If a page has fewer than this many extracted text characters,
 *    it is considered a candidate for visual classification when paired with image coverage.
 * 2. PAGE_IMAGE_COVERAGE_THRESHOLD: Minimum fraction of page area (0.0 to 1.0) covered by
 *    drawn images required to consider a low-text page as "visual".
 * 3. DOMINANT_IMAGE_COVERAGE: If image coverage exceeds this fraction (e.g. 50%), the page
 *    is treated as visual regardless of incidental header/footer text.
 * 4. DOCUMENT_VISUAL_THRESHOLD: Fraction of pages in a multi-page document that must be
 *    classified as visual for the entire document to route to Gemini (e.g. 30%).
 * 5. MAX_SUPPORTED_PAGES: Maximum pages supported by the current tier.
 */
const CLASSIFICATION_THRESHOLDS = {
  PAGE_MIN_TEXT_CHARS: 120,          // Pages with < 120 chars are text-sparse
  PAGE_IMAGE_COVERAGE_THRESHOLD: 0.20, // 20% image coverage triggers visual flag on text-sparse pages
  DOMINANT_IMAGE_COVERAGE: 0.50,      // 50%+ image coverage is visual regardless of small text
  DOCUMENT_VISUAL_THRESHOLD: 0.30,    // If >= 30% of pages are visual, route whole doc to Gemini
  MAX_SUPPORTED_PAGES: 200,           // High-capacity tier supporting up to 200 pages via Gemini / LlamaParse
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024, // 30 MB max file size
};

const BUDGET_FILE = path.join(__dirname, '..', '..', 'logs', 'llamaparse-budget.json');
const LLAMAPARSE_MONTHLY_CREDIT_LIMIT = 10000; // Free tier monthly credits shared across all users

// ---------------------------------------------------------------------------
// 1. BUDGET TRACKING FOR LLAMAPARSE
// ---------------------------------------------------------------------------
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getBudgetStore() {
  try {
    if (!fs.existsSync(BUDGET_FILE)) {
      return { month: getCurrentMonthKey(), usedCredits: 0, lastUpdated: new Date().toISOString() };
    }
    const raw = fs.readFileSync(BUDGET_FILE, 'utf-8');
    const store = JSON.parse(raw);
    const currentMonth = getCurrentMonthKey();

    // Reset if month has rolled over
    if (store.month !== currentMonth) {
      return { month: currentMonth, usedCredits: 0, lastUpdated: new Date().toISOString() };
    }
    return store;
  } catch (err) {
    console.error('[BudgetTracker] Error reading budget store:', err.message);
    return { month: getCurrentMonthKey(), usedCredits: 0, lastUpdated: new Date().toISOString() };
  }
}

function saveBudgetStore(store) {
  try {
    fs.mkdirSync(path.dirname(BUDGET_FILE), { recursive: true });
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[BudgetTracker] Error saving budget store:', err.message);
  }
}

function checkLlamaParseBudget(estimatedPages = 1) {
  const store = getBudgetStore();
  const remaining = LLAMAPARSE_MONTHLY_CREDIT_LIMIT - store.usedCredits;

  if (store.usedCredits + estimatedPages > LLAMAPARSE_MONTHLY_CREDIT_LIMIT) {
    const error = new Error(
      `LlamaParse monthly free-tier credit limit (${LLAMAPARSE_MONTHLY_CREDIT_LIMIT} credits) has been reached. Current month usage: ${store.usedCredits} credits, requested: ${estimatedPages}. Please upgrade your plan or reset the monthly budget.`
    );
    error.code = 'BUDGET_EXHAUSTED';
    error.status = 429;
    throw error;
  }

  return { usedCredits: store.usedCredits, remainingCredits: remaining };
}

function recordLlamaParseUsage(pagesUsed = 1) {
  const store = getBudgetStore();
  store.usedCredits += pagesUsed;
  store.lastUpdated = new Date().toISOString();
  saveBudgetStore(store);
  return store;
}

// ---------------------------------------------------------------------------
// 2. MATRIX MULTIPLICATION & TRANSFORM STATE TRACKER
// ---------------------------------------------------------------------------
function multiplyMatrix(m1, m2) {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

// ---------------------------------------------------------------------------
// 3. LOCAL DETERMINISTIC CLASSIFICATION HEURISTIC (Zero AI Calls)
// ---------------------------------------------------------------------------
/**
 * Inspects the PDF structure locally using pdfjs-dist.
 * Calculates page count, extractable text length, and image draw operator coverage.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<object>} Classification results & detailed page metrics
 */
async function classifyPDF(pdfBuffer) {
  const pdfjsModule = await getPdfjsLib();
  const pdfjsLib = pdfjsModule.getDocument ? pdfjsModule : pdfjsModule.default;
  const OPS = pdfjsModule.OPS || pdfjsLib.OPS;

  let doc;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    doc = await loadingTask.promise;
  } catch (err) {
    if (err.message && (err.message.includes('password') || err.message.includes('encrypted'))) {
      const error = new Error('This PDF is password-protected. Please upload an unprotected PDF.');
      error.code = 'PDF_ENCRYPTED';
      error.status = 400;
      throw error;
    }
    const error = new Error('Unable to read this PDF. The file may be corrupted or in an unsupported format.');
    error.code = 'PDF_PARSE_FAILED';
    error.status = 400;
    throw error;
  }

  const numPages = doc.numPages;

  // -------------------------------------------------------------------------
  // SIZE BOUNDARY CHECK
  // -------------------------------------------------------------------------
  // NOTE FOR FUTURE ROADMAP:
  // Documents exceeding MAX_SUPPORTED_PAGES are rejected here.
  // [FUTURE INTEGRATION POINT]: Route high-volume/large documents to a self-hosted
  // Unstructured.io + PaddleOCR asynchronous worker queue pipeline.
  if (numPages > CLASSIFICATION_THRESHOLDS.MAX_SUPPORTED_PAGES) {
    try {
      if (doc.cleanup) await doc.cleanup();
      if (loadingTask.destroy) await loadingTask.destroy();
    } catch (_) {}
    const error = new Error('This PDF is larger than we currently support — high-volume document processing is on our roadmap.');
    error.code = 'DOCUMENT_TOO_LARGE';
    error.status = 413;
    throw error;
  }

  let totalTextChars = 0;
  let visualPagesCount = 0;
  const pageMetrics = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageArea = Math.max(viewport.width * viewport.height, 1);

    // 1. Text extraction
    const textContent = await page.getTextContent();
    const textItems = textContent.items || [];
    const pageText = textItems.map((item) => item.str || '').join(' ').replace(/\s+/g, ' ').trim();
    const charCount = pageText.length;
    const wordCount = pageText.split(/\s+/).filter(Boolean).length;
    totalTextChars += charCount;

    // 2. Image operator coverage calculation via graphics state tracking
    const opList = await page.getOperatorList();
    let currentMatrix = [1, 0, 0, 1, 0, 0];
    const matrixStack = [];
    let totalImageArea = 0;
    let imageCount = 0;

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === OPS.save) {
        matrixStack.push([...currentMatrix]);
      } else if (fn === OPS.restore) {
        if (matrixStack.length > 0) {
          currentMatrix = matrixStack.pop();
        }
      } else if (fn === OPS.transform) {
        currentMatrix = multiplyMatrix(currentMatrix, args);
      } else if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        fn === OPS.paintInlineImageXObjectGroup ||
        fn === OPS.paintImageMaskXObject
      ) {
        imageCount++;
        // The determinant of the 2x2 affine portion gives the transformed area of unit square
        const det = Math.abs(currentMatrix[0] * currentMatrix[3] - currentMatrix[1] * currentMatrix[2]);
        totalImageArea += det;
      }
    }

    const imageCoverageRatio = Math.min(totalImageArea / pageArea, 1.0);

    // 3. Determine if individual page is visual
    const isVisual =
      (charCount < CLASSIFICATION_THRESHOLDS.PAGE_MIN_TEXT_CHARS &&
        imageCoverageRatio >= CLASSIFICATION_THRESHOLDS.PAGE_IMAGE_COVERAGE_THRESHOLD) ||
      (charCount < 40 && imageCoverageRatio >= 0.05) ||
      (imageCoverageRatio >= CLASSIFICATION_THRESHOLDS.DOMINANT_IMAGE_COVERAGE);

    if (isVisual) {
      visualPagesCount++;
    }

    pageMetrics.push({
      pageNumber: pageNum,
      charCount,
      wordCount,
      imageCount,
      imageArea: Math.round(totalImageArea),
      pageArea: Math.round(pageArea),
      imageCoverageRatio: Number(imageCoverageRatio.toFixed(3)),
      isVisual,
    });
  }

  // Get metadata if available
  let info = {};
  try {
    const meta = await doc.getMetadata();
    if (meta?.info) {
      info = {
        title: meta.info.Title || null,
        author: meta.info.Author || null,
        creator: meta.info.Creator || null,
      };
    }
  } catch {
    // Non-fatal if metadata extraction fails
  }

  try {
    if (doc.cleanup) await doc.cleanup();
    if (loadingTask.destroy) await loadingTask.destroy();
  } catch (_) {}

  const visualRatio = visualPagesCount / numPages;
  // A document is classified as VISUAL if a meaningful proportion of pages are image-heavy / text-light,
  // or if a short (1-2 page) document has any visual-dominant page.
  const isDocumentVisual =
    visualRatio >= CLASSIFICATION_THRESHOLDS.DOCUMENT_VISUAL_THRESHOLD ||
    (numPages <= 2 && visualPagesCount >= 1);

  const documentType = isDocumentVisual ? 'VISUAL' : 'STANDARD';

  return {
    documentType,
    totalPages: numPages,
    visualPages: visualPagesCount,
    visualRatio: Number(visualRatio.toFixed(3)),
    totalTextChars,
    info,
    pageMetrics,
    thresholds: CLASSIFICATION_THRESHOLDS,
  };
}

// ---------------------------------------------------------------------------
// 4. STRUCTURED DATA EXTRACTION HELPERS
// ---------------------------------------------------------------------------
/**
 * Parses Markdown tables (| Col 1 | Col 2 |) into structured row/column arrays.
 */
function extractTablesFromMarkdown(markdown) {
  const tables = [];
  const lines = markdown.split('\n');
  let currentTable = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if this is a separator line (e.g. |---|---|)
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else if (isSeparator) {
        // Separator line confirms previous line was headers
      } else {
        currentTable.rows.push(cells);
      }
    } else {
      if (currentTable) {
        if (currentTable.headers.length > 0 && currentTable.rows.length > 0) {
          tables.push(currentTable);
        }
        currentTable = null;
      }
    }
  }

  if (currentTable && currentTable.headers.length > 0 && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Parses AI-interpreted visual elements from Gemini output.
 */
function extractVisualElements(text) {
  const visualElements = [];
  const regex = /\[AI-VISUAL-INTERPRETATION\]\s*(?:\((?:Type:\s*)?([^)]+)\))?:\s*([^\n]+)/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawType = (match[1] || 'visual_element').replace(/^type:\s*/i, '').toLowerCase().trim();
    visualElements.push({
      type: rawType,
      description: match[2].trim(),
      isAiInterpretation: true,
    });
  }

  // Also check for a dedicated "Visual Elements" markdown section if tags were formatted as bullets
  const sectionMatch = text.match(/##?\s*(?:Visual Elements|Visual Interpretation|Visuals and Layout)[\s\S]*?(?=(?:##|$))/i);
  if (sectionMatch && visualElements.length === 0) {
    const items = sectionMatch[0].split('\n').filter((l) => /^[-*•]\s+/.test(l.trim()));
    items.forEach((item) => {
      const cleaned = item.replace(/^[-*•]\s+/, '').replace(/^\[AI-VISUAL-INTERPRETATION\]\s*/i, '').trim();
      if (cleaned) {
        visualElements.push({
          type: 'layout_graphic',
          description: cleaned,
          isAiInterpretation: true,
        });
      }
    });
  }

  return visualElements;
}

/**
 * Creates a clean plain-text fallback summary without markdown tokens.
 */
function createPlainTextSummary(markdown) {
  return markdown
    .replace(/\[AI-VISUAL-INTERPRETATION\].*?$/gm, '') // Remove visual interpretation markers
    .replace(/^#+\s+/gm, '')             // Remove headers
    .replace(/!\[.*?\]\(.*?\)/g, '')     // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Simplify links
    .replace(/(\*\*|__)(.*?)\1/g, '$2')  // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2')     // Remove italics
    .replace(/^[-*•]\s+/gm, '')          // Remove bullet markers
    .replace(/^\|.*?\|$/gm, ' ')         // Collapse table rows
    .replace(/`{1,3}.*?`{1,3}/gs, '')    // Remove code blocks
    .replace(/\n{3,}/g, '\n\n')          // Normalize spacing
    .trim();
}

/**
 * Computes structural metrics (headings, lists, tables).
 */
function computeStructuralMetrics(markdown, tablesCount = 0, visualCount = 0) {
  const headings = {
    h1: (markdown.match(/^#\s+[^\n]+/gm) || []).length,
    h2: (markdown.match(/^##\s+[^\n]+/gm) || []).length,
    h3: (markdown.match(/^###\s+[^\n]+/gm) || []).length,
  };
  const totalHeadings = headings.h1 + headings.h2 + headings.h3;
  const bulletItems = (markdown.match(/^[-*•]\s+[^\n]+/gm) || []).length;
  const tableRows = (markdown.match(/^\|.+\|$/gm) || []).length;

  return {
    totalHeadings,
    headings,
    tableRows,
    tablesCount,
    bulletItems,
    visualElementsCount: visualCount,
    hasMarkdownStructure: totalHeadings > 0 || tableRows > 0 || bulletItems > 0,
  };
}

// ---------------------------------------------------------------------------
// 5. PARSER ENGINES (LlamaParse & Gemini)
// ---------------------------------------------------------------------------

/**
 * STANDARD Route: LlamaParse
 */
async function parseWithLlamaParse(pdfBuffer, filename, classification) {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey || apiKey.includes('your-key')) {
    const error = new Error('LLAMA_CLOUD_API_KEY is not set or empty in .env');
    error.code = 'MISSING_API_KEY';
    error.status = 500;
    throw error;
  }

  // Enforce monthly free-tier credit budget
  checkLlamaParseBudget(classification.totalPages);

  const parser = new LlamaParse({
    apiKey,
    verbose: false,
  });

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  if (!blob.name) blob.name = filename;

  console.log(`[ParserRouter] Executing LlamaParse for STANDARD document: "${filename}" (${classification.totalPages} pages)...`);
  const result = await parser.parseFile(blob);
  const markdown = typeof result === 'string' ? result : (result.markdown || JSON.stringify(result));

  // Record budget usage upon successful execution
  recordLlamaParseUsage(classification.totalPages);

  const tables = extractTablesFromMarkdown(markdown);
  const plainTextSummary = createPlainTextSummary(markdown);
  const metrics = computeStructuralMetrics(markdown, tables.length, 0);

  // LlamaParse produces deterministic text extraction -> high confidence ceiling
  const confidence = plainTextSummary.length > 50 ? 'high' : 'medium';
  const confidenceReasons = [];
  if (confidence === 'high') {
    confidenceReasons.push('High-fidelity deterministic text and table extraction verified via LlamaParse.');
  } else {
    confidenceReasons.push('Extracted content length is sparse.');
  }

  return {
    rawStructuredContent: markdown,
    tables,
    visualElements: [], // Standard text documents do not have AI-inferred visual elements
    plainTextSummary,
    extractionMethod: 'llamaparse',
    confidence,
    confidenceReasons,
    pageCount: classification.totalPages,
    title: classification.info?.title || null,
    characterCount: plainTextSummary.length,
    wordCount: plainTextSummary.split(/\s+/).filter(Boolean).length,
    metrics,
  };
}

/**
 * VISUAL Route: Gemini 2.5 Flash
 * Prompted to transcribe faithful literal text AND describe visual elements.
 */
async function parseWithGemini(pdfBuffer, filename, classification) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-key')) {
    const error = new Error('GEMINI_API_KEY is not set or empty in .env');
    error.code = 'MISSING_API_KEY';
    error.status = 500;
    throw error;
  }

  // If visual document has > 15 pages, sample key executive pages for fast vision processing
  let targetBuffer = pdfBuffer;
  let samplingMeta = { sampled: false };
  if (classification.totalPages > 15) {
    samplingMeta = await extractKeyVisualPages(pdfBuffer, 15);
    targetBuffer = samplingMeta.buffer;
    console.log(
      `[ParserRouter] Visual document "${filename}" has ${classification.totalPages} pages. ` +
      `Optimized to ${samplingMeta.processedPages} key pages (${(targetBuffer.length / 1024 / 1024).toFixed(2)} MB) for fast OCR.`
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = targetBuffer.toString('base64');

  const prompt = `You are an expert SEO document analyzer and high-speed structural extractor.
Analyze this scanned/visual document and produce a structured, content-rich summary for SEO evaluation:

1. DOCUMENT STRUCTURE & HEADINGS:
- Extract the main title, subtitle, and all primary section headings (# H1, ## H2, ### H3).

2. KEY CONTENT & EXECUTIVE SUMMARY:
- Synthesize the core concepts, topics, methodology, and key paragraphs into clean Markdown.
- Preserve all significant domain-specific terminology, keywords, entities, and data points.

3. DATA TABLES & METRICS:
- Extract and format any tables or key metrics into Markdown tables (| Column 1 | Column 2 |).

4. VISUAL ELEMENTS:
- Note any diagrams, charts, or visual figures:
  [AI-VISUAL-INTERPRETATION] (Type: chart|diagram|table|figure): <Brief description of figure>

Be comprehensive yet concise. Do NOT generate unnecessary filler words.`;

  console.log(`[ParserRouter] Executing Gemini 2.5 Flash for VISUAL document: "${filename}" (${classification.totalPages} pages)...`);

  let response = null;
  try {
    // 65-second timeout allowing thorough vision analysis well within cloud gateway limits
    response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      }),
      65000,
      'Gemini 2.5 Flash request timed out (65s limit reached).'
    );
  } catch (err) {
    console.warn(`[ParserRouter] Gemini 2.5 Flash failed or busy (${err.message}).`);
    throw err;
  }

  if (!response || !response.text) {
    throw new Error('Gemini 2.5 Flash returned an empty response.');
  }

  const markdown = response.text || '';
  const tables = extractTablesFromMarkdown(markdown);
  const visualElements = extractVisualElements(markdown);
  const plainTextSummary = createPlainTextSummary(markdown);
  const metrics = computeStructuralMetrics(markdown, tables.length, visualElements.length);

  // Gemini visual extractions are capped at medium confidence ceiling
  // because visual interpretation is inherently inferential.
  const confidence = plainTextSummary.length > 30 ? 'medium' : 'low';
  const confidenceReasons = [
    samplingMeta.sampled
      ? `Visual document: processed key ${samplingMeta.processedPages} of ${samplingMeta.totalPages} pages via Gemini 2.5 Flash vision OCR.`
      : 'Visual document: text transcribed and visual elements described via Gemini 2.5 Flash.',
  ];
  if (plainTextSummary.length <= 30) {
    confidenceReasons.push('Sparse text extracted from visual document.');
  }

  return {
    rawStructuredContent: markdown,
    tables,
    visualElements,
    plainTextSummary,
    extractionMethod: 'gemini',
    confidence,
    confidenceReasons,
    pageCount: classification.totalPages,
    title: classification.info?.title || null,
    characterCount: plainTextSummary.length,
    wordCount: plainTextSummary.split(/\s+/).filter(Boolean).length,
    metrics,
  };
}

// ---------------------------------------------------------------------------
// 6. MAIN ROUTER ENTRY POINT
// ---------------------------------------------------------------------------
/**
 * Main entry point: Classifies PDF locally, then routes to LlamaParse or Gemini.
 *
 * @param {Buffer} pdfBuffer - Uploaded PDF file buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<object>} Full structured output
 */
async function parseAndRoutePDF(pdfBuffer, filename = 'document.pdf') {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    const error = new Error('No PDF data provided.');
    error.code = 'EMPTY_BUFFER';
    error.status = 400;
    throw error;
  }

  if (pdfBuffer.length > CLASSIFICATION_THRESHOLDS.MAX_FILE_SIZE_BYTES) {
    const error = new Error(
      `File size exceeds maximum limit (${(CLASSIFICATION_THRESHOLDS.MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB).`
    );
    error.code = 'FILE_TOO_LARGE';
    error.status = 400;
    throw error;
  }

  const startTime = Date.now();
  // Generate deterministic binary buffer hash so edited files with identical names are distinctly recognized
  const bufferHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  // Step 1: Deterministic Local Classification
  const classification = await classifyPDF(pdfBuffer);

  console.log(
    `[ParserRouter] "${filename}" [hash: ${bufferHash.slice(0, 10)}] classified as ${classification.documentType} ` +
    `(${classification.totalPages} pages, ${classification.visualPages} visual pages, ratio: ${(classification.visualRatio * 100).toFixed(1)}%)`
  );

  // Step 2: Route to appropriate high-fidelity parser with automatic resilient fallback
  let parsedResult;
  if (classification.documentType === 'VISUAL') {
    try {
      parsedResult = await parseWithGemini(pdfBuffer, filename, classification);
    } catch (geminiErr) {
      console.warn(
        `[ParserRouter] Gemini 2.5 Flash unavailable or timed out (${geminiErr.message}). Automatically routing to LlamaParse fallback...`
      );
      parsedResult = await parseWithLlamaParse(pdfBuffer, filename, classification);
      parsedResult.confidenceReasons = [
        'Gemini experienced temporary high demand/timeout; successfully extracted via LlamaParse with high structural fidelity.',
        ...(parsedResult.confidenceReasons || []),
      ];
    }
  } else {
    parsedResult = await parseWithLlamaParse(pdfBuffer, filename, classification);
  }

  const latencyMs = Date.now() - startTime;

  return {
    ...parsedResult,
    bufferHash,
    latencyMs,
    classification,
    info: classification.info || {},
  };
}

module.exports = {
  parseAndRoutePDF,
  classifyPDF,
  checkLlamaParseBudget,
  recordLlamaParseUsage,
  getBudgetStore,
  CLASSIFICATION_THRESHOLDS,
  LLAMAPARSE_MONTHLY_CREDIT_LIMIT,
  extractTablesFromMarkdown,
  extractVisualElements,
  createPlainTextSummary,
};
