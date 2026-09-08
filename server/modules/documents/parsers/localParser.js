const { createStandardResult } = require('./baseParser');

let pdfjsLibPromise = null;
function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLibPromise;
}

/**
 * Local Baseline Parser (Free, fast, regex-cleaned, uses pdfjs-dist).
 */
async function parseWithLocal(pdfBuffer, filename = 'document.pdf') {
  const startTime = Date.now();
  try {
    const pdfjsModule = await getPdfjsLib();
    const pdfjsLib = pdfjsModule.getDocument ? pdfjsModule : pdfjsModule.default;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;

    let fullText = '';
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str || '').join(' ');
      fullText += pageText + '\n\n';
    }

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
      // Ignore metadata extraction error
    }

    await doc.destroy();

    const cleanedText = fullText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const latencyMs = Date.now() - startTime;
    const confidence = cleanedText.length > 50 ? 'high' : 'low';

    return createStandardResult({
      engine: 'Local_Baseline',
      text: cleanedText,
      rawMarkdown: cleanedText,
      pages: pageCount,
      latencyMs,
      estimatedCostUsd: 0.0,
      info,
      confidence,
      confidenceReasons: confidence === 'low' ? ['Sparse text extracted.'] : [],
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return createStandardResult({
      engine: 'Local_Baseline',
      latencyMs,
      error: err,
    });
  }
}

module.exports = { parseWithLocal };
