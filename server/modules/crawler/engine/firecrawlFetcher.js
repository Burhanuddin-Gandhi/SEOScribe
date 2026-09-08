const axios = require('axios');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Tier 1: Firecrawl Cloud Fetcher & Scraper
 * Primary AI-first extractor delivering clean markdown, complete rendered HTML, and structured metadata.
 */
async function scrapeWithFirecrawl(targetUrl, options = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const normalizedInitialUrl = normalizeUrl(targetUrl);
  const startTime = Date.now();

  if (!apiKey || apiKey.includes('your_key')) {
    return {
      success: false,
      error: {
        code: 'FIRECRAWL_KEY_MISSING',
        message: 'Firecrawl API key not configured in .env',
      },
      rawHtml: '',
      cleanHtml: '',
      markdown: '',
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: 0,
        extraction_method: 'FIRECRAWL_SKIPPED',
        extraction_tier: 'TIER_1_FIRECRAWL',
      },
    };
  }

  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: normalizedInitialUrl,
        formats: ['markdown', 'html', 'rawHtml'],
        onlyMainContent: options.onlyMainContent ?? false,
        waitFor: options.waitForMs || 1000,
        timeout: options.timeoutMs || 25000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: (options.timeoutMs || 25000) + 5000,
      }
    );

    const totalDurationMs = Date.now() - startTime;
    const data = response.data?.data || {};
    // rawHtml preserves complete <head>, <meta>, <title>, <script> tags for DOM SEO extraction
    const rawHtml = data.rawHtml || data.html || '';
    const cleanHtml = data.html || '';
    const markdown = data.markdown || '';
    const metadata = data.metadata || {};

    const finalUrl = normalizeUrl(metadata.sourceURL || metadata.ogUrl || targetUrl);
    const statusCode = metadata.statusCode || 200;

    const httpMetadata = {
      requested_url: normalizedInitialUrl,
      final_url: finalUrl,
      status_code: statusCode,
      status_text: statusCode >= 400 ? 'HTTP Error' : 'OK',
      redirect_chain: [],
      content_type: 'text/html; charset=UTF-8',
      charset: 'UTF-8',
      content_length_bytes: Buffer.byteLength(rawHtml, 'utf-8'),
      is_https: finalUrl.startsWith('https://'),
      timing_ms: {
        total: totalDurationMs,
        ttfb: Math.round(totalDurationMs * 0.4),
      },
      headers: {
        'x-robots-tag': metadata.robots || null,
      },
      extraction_timestamp: new Date().toISOString(),
      extraction_method: 'FIRECRAWL_CLOUD',
      extraction_tier: 'TIER_1_FIRECRAWL',
    };

    return {
      success: true,
      rawHtml,
      cleanHtml,
      markdown,
      metadata: {
        title: metadata.title || '',
        description: metadata.description || '',
        ogTitle: metadata.ogTitle || '',
        ogDescription: metadata.ogDescription || '',
        ogImage: metadata.ogImage || '',
        language: metadata.language || '',
        canonicalUrl: metadata.canonical || '',
      },
      httpMetadata,
      rendered: true,
    };
  } catch (err) {
    const totalDurationMs = Date.now() - startTime;
    const statusCode = err.response?.status || 0;
    const isRateLimited = statusCode === 429;
    const isQuotaExhausted = statusCode === 402;

    return {
      success: false,
      error: {
        code: isQuotaExhausted
          ? 'FIRECRAWL_QUOTA_EXHAUSTED'
          : isRateLimited
            ? 'FIRECRAWL_RATE_LIMITED'
            : 'FIRECRAWL_FETCH_ERROR',
        status: statusCode,
        message: err.response?.data?.error || err.message,
      },
      rawHtml: '',
      cleanHtml: '',
      markdown: '',
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: statusCode,
        timing_ms: { total: totalDurationMs },
        extraction_timestamp: new Date().toISOString(),
        extraction_method: 'FIRECRAWL_FAILED',
        extraction_tier: 'TIER_1_FIRECRAWL',
      },
    };
  }
}

/**
 * Site Mapping using Firecrawl /map API endpoint
 * Fast URL discovery for sitemaps and site architecture
 */
async function mapWithFirecrawl(targetUrl, options = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { success: false, links: [] };

  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/map',
      {
        url: targetUrl,
        search: options.search || undefined,
        limit: options.limit || 50,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: options.timeoutMs || 20000,
      }
    );

    const links = response.data?.links || [];
    return {
      success: true,
      links,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      links: [],
    };
  }
}

module.exports = {
  scrapeWithFirecrawl,
  mapWithFirecrawl,
};
