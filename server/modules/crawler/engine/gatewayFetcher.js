const axios = require('axios');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Tier 2 Heavy Artillery: ScrapingBee Stealth Scraper Gateway
 * Serves as anti-bot bypass infrastructure when Firecrawl encounters stubborn Cloudflare/DataDome/Akamai blocks.
 */
async function fetchWithGateway(targetUrl, options = {}) {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  const startTime = Date.now();
  const normalizedInitialUrl = normalizeUrl(targetUrl);

  if (!apiKey || apiKey.includes('your_key')) {
    return {
      success: false,
      error: {
        code: 'SCRAPINGBEE_KEY_MISSING',
        message: 'ScrapingBee API key is not configured in .env',
      },
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: 0,
        extraction_method: 'SCRAPINGBEE_SKIPPED',
        extraction_tier: 'TIER_2_SCRAPINGBEE',
      },
      rawHtml: '',
    };
  }

  try {
    const renderJs = options.renderJs !== false ? 'true' : 'false';
    const params = {
      api_key: apiKey,
      url: normalizedInitialUrl,
      render_js: renderJs,
      timeout: options.timeoutMs || 25000,
    };

    // If stealth proxy or premium proxy requested
    if (options.stealthProxy) {
      params.stealth_proxy = 'true';
    }

    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params,
      timeout: (options.timeoutMs || 25000) + 5000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const totalDurationMs = Date.now() - startTime;
    const rawHtml = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const finalUrl = normalizeUrl(response.headers['spb-initial-url'] || normalizedInitialUrl);
    const statusCode = response.status || 200;

    const httpMetadata = {
      requested_url: normalizedInitialUrl,
      final_url: finalUrl,
      status_code: statusCode,
      status_text: 'OK',
      redirect_chain: [],
      content_type: response.headers['content-type'] || 'text/html; charset=UTF-8',
      charset: 'UTF-8',
      content_length_bytes: Buffer.byteLength(rawHtml, 'utf-8'),
      is_https: finalUrl.startsWith('https://'),
      timing_ms: {
        total: totalDurationMs,
        ttfb: Math.round(totalDurationMs * 0.5),
      },
      headers: {
        cost: response.headers['spb-cost'] || null,
      },
      extraction_timestamp: new Date().toISOString(),
      extraction_method: 'SCRAPINGBEE_STEALTH',
      extraction_tier: 'TIER_2_SCRAPINGBEE',
    };

    return {
      success: true,
      httpMetadata,
      rawHtml,
      rendered: renderJs === 'true',
    };
  } catch (err) {
    const totalDurationMs = Date.now() - startTime;
    const statusCode = err.response?.status || 0;

    return {
      success: false,
      error: {
        code: statusCode === 401 ? 'SCRAPINGBEE_AUTH_FAILED' : statusCode === 429 ? 'SCRAPINGBEE_RATE_LIMITED' : 'SCRAPINGBEE_FETCH_ERROR',
        status: statusCode,
        message: err.response?.data?.message || err.message,
      },
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: statusCode,
        timing_ms: { total: totalDurationMs },
        extraction_timestamp: new Date().toISOString(),
        extraction_method: 'SCRAPINGBEE_FAILED',
        extraction_tier: 'TIER_2_SCRAPINGBEE',
      },
      rawHtml: '',
      rendered: false,
    };
  }
}

module.exports = {
  fetchWithGateway,
  scrapeWithScrapingBee: fetchWithGateway,
};
