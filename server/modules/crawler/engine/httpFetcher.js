const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; SEOScribeBot/1.0; +https://seoscribe.ai/bot)';

/**
 * Detects whether raw HTML requires client-side JavaScript rendering
 */
function detectJsRenderingRequirement(html, status) {
  if (!html || status >= 400) {
    return { requiresRendering: false, reason: 'Non-HTML or error response' };
  }

  const $ = cheerio.load(html);

  // 1. Check for standard SPA root mounting nodes with sparse content
  const spaContainers = ['#root', '#app', '#__next', 'app-root', '#__nuxt', '#root-app'];
  for (const selector of spaContainers) {
    const el = $(selector);
    if (el.length > 0) {
      const containerText = el.text().trim();
      if (containerText.length < 150) {
        return {
          requiresRendering: true,
          reason: `SPA mount point detected (${selector}) with sparse server-rendered text (${containerText.length} chars)`,
          detectedContainer: selector,
        };
      }
    }
  }

  // 2. Check for explicit NoScript messages
  const noscriptText = $('noscript').text().toLowerCase();
  if (noscriptText.includes('enable javascript') || noscriptText.includes('requires javascript') || noscriptText.includes('need to enable javascript')) {
    return {
      requiresRendering: true,
      reason: 'Explicit <noscript> JavaScript requirement declared in DOM',
    };
  }

  // 3. Check for script-heavy vs body text ratio
  $('script, style, noscript, svg').remove();
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();

  if (visibleText.length < 100 && html.length > 1000) {
    return {
      requiresRendering: true,
      reason: `Extremely low visible text length (${visibleText.length} chars) despite large HTML payload (${html.length} bytes)`,
    };
  }

  return {
    requiresRendering: false,
    reason: 'Sufficient server-rendered static HTML content detected',
    textLength: visibleText.length,
  };
}

/**
 * Tier 1: High-Speed HTTP Fetcher
 * Collects HTTP metadata, headers, status, timing, and raw HTML.
 */
async function fetchHttp(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 15000;
  const userAgent = options.userAgent || DEFAULT_USER_AGENT;
  const startTime = Date.now();

  const redirectChain = [];
  const normalizedInitialUrl = normalizeUrl(targetUrl);

  try {
    const response = await axios.get(normalizedInitialUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      timeout: timeoutMs,
      maxRedirects: 8,
      validateStatus: () => true, // Handle all status codes (404, 500, etc.) without throwing
      beforeRedirect: (options, responseDetails) => {
        redirectChain.push({
          url: responseDetails.headers.location || 'unknown',
          statusCode: responseDetails.statusCode,
        });
      },
    });

    const totalDownloadTimeMs = Date.now() - startTime;
    const finalUrl = normalizeUrl(response.request?.res?.responseUrl || response.config?.url || targetUrl);
    const contentTypeHeader = response.headers['content-type'] || 'text/html';
    const rawHtml = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || '');

    // Charset parsing
    const charsetMatch = contentTypeHeader.match(/charset=([^\s;]+)/i);
    const detectedCharset = charsetMatch ? charsetMatch[1].toUpperCase() : 'UTF-8';

    // Layer A Raw HTTP Metadata
    const httpMetadata = {
      requested_url: normalizedInitialUrl,
      final_url: finalUrl,
      status_code: response.status,
      status_text: response.statusText,
      redirect_chain: redirectChain,
      content_type: contentTypeHeader,
      charset: detectedCharset,
      content_length_bytes: Buffer.byteLength(rawHtml, 'utf-8'),
      is_https: finalUrl.startsWith('https://'),
      timing_ms: {
        total: totalDownloadTimeMs,
        ttfb: Math.round(totalDownloadTimeMs * 0.7), // Estimated TTFB split
      },
      headers: {
        server: response.headers['server'] || null,
        'x-robots-tag': response.headers['x-robots-tag'] || null,
        'last-modified': response.headers['last-modified'] || null,
        etag: response.headers['etag'] || null,
        'cache-control': response.headers['cache-control'] || null,
        vary: response.headers['vary'] || null,
      },
      extraction_timestamp: new Date().toISOString(),
      extraction_method: 'HTTP',
      extraction_tier: 'TIER_1_HTTP',
    };

    // Analyze if Playwright JS rendering fallback is necessary
    const jsEvaluation = detectJsRenderingRequirement(rawHtml, response.status);

    return {
      success: response.status < 400,
      httpMetadata,
      rawHtml,
      jsEvaluation,
    };
  } catch (err) {
    const totalDownloadTimeMs = Date.now() - startTime;
    return {
      success: false,
      error: {
        code: err.code || 'HTTP_FETCH_ERROR',
        message: err.message,
        status_code: err.response?.status || 0,
      },
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: err.response?.status || 0,
        status_text: err.message,
        redirect_chain: redirectChain,
        timing_ms: { total: totalDownloadTimeMs },
        extraction_timestamp: new Date().toISOString(),
        extraction_method: 'HTTP_FAILED',
        extraction_tier: 'TIER_1_HTTP',
      },
      rawHtml: '',
      jsEvaluation: { requiresRendering: true, reason: 'HTTP Fetch failed or blocked' },
    };
  }
}

module.exports = {
  fetchHttp,
  detectJsRenderingRequirement,
};
