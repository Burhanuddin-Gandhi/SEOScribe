const { LlamaParse } = require('llama-parse');
const { createStandardResult } = require('./baseParser');

/**
 * LlamaParse Adapter
 * Cost: Free tier 1,000 pages/day. Beyond free tier: ~$0.003/page.
 */
async function parseWithLlamaParse(pdfBuffer, filename = 'document.pdf') {
  const startTime = Date.now();
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;

  if (!apiKey || apiKey.includes('your-key-here')) {
    return createStandardResult({
      engine: 'LlamaParse',
      error: new Error('LLAMA_CLOUD_API_KEY is not set or empty in .env'),
    });
  }

  try {
    const parser = new LlamaParse({
      apiKey,
      verbose: false,
    });

    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    // In some environments, Blob needs a name attribute
    if (!blob.name) blob.name = filename;

    const result = await parser.parseFile(blob);
    const markdown = typeof result === 'string' ? result : (result.markdown || JSON.stringify(result));
    const latencyMs = Date.now() - startTime;

    // Estimate page count based on page separator (--- or \f)
    const pageSplits = markdown.split(/\n---\n|\f/);
    const estimatedPages = Math.max(pageSplits.length, 1);

    // Cost: $0 if within free 1,000 pages/day, or $0.003/page
    const estimatedCostUsd = estimatedPages * 0.003;

    return createStandardResult({
      engine: 'LlamaParse',
      text: markdown,
      rawMarkdown: markdown,
      pages: estimatedPages,
      latencyMs,
      estimatedCostUsd,
      confidence: 'high',
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return createStandardResult({
      engine: 'LlamaParse',
      latencyMs,
      error: err,
    });
  }
}

module.exports = { parseWithLlamaParse };
