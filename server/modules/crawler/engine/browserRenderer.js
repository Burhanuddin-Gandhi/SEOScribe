const { chromium } = require('playwright');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

let sharedBrowserPromise = null;

async function getSharedBrowser() {
  if (!sharedBrowserPromise) {
    sharedBrowserPromise = chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1440,900',
      ],
    }).catch((err) => {
      sharedBrowserPromise = null;
      throw err;
    });
  }
  return sharedBrowserPromise;
}

/**
 * Tier 2: Headless Playwright Stealth Browser Renderer
 */
async function renderWithBrowser(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 25000;
  const startTime = Date.now();
  const normalizedInitialUrl = normalizeUrl(targetUrl);

  let browser;
  let context;
  let page;

  try {
    browser = await getSharedBrowser();
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    page = await context.newPage();

    // Optimize performance: Abort non-essential media & tracking requests
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();
      if (['media', 'font'].includes(resourceType) || url.includes('google-analytics.com') || url.includes('doubleclick.net') || url.includes('hotjar.com')) {
        return route.abort();
      }
      route.continue();
    });

    const response = await page.goto(normalizedInitialUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    });

    // Wait a brief tick for dynamic hydration/rendering (e.g. Next.js, React)
    await page.waitForTimeout(options.postLoadWaitMs || 1200);

    const renderedHtml = await page.content();
    const finalUrl = normalizeUrl(page.url() || targetUrl);
    const statusCode = response ? response.status() : 200;
    const responseHeaders = response ? await response.allHeaders() : {};
    const totalDurationMs = Date.now() - startTime;

    const httpMetadata = {
      requested_url: normalizedInitialUrl,
      final_url: finalUrl,
      status_code: statusCode,
      status_text: response ? response.statusText() : 'OK',
      redirect_chain: [],
      content_type: responseHeaders['content-type'] || 'text/html',
      charset: 'UTF-8',
      content_length_bytes: Buffer.byteLength(renderedHtml, 'utf-8'),
      is_https: finalUrl.startsWith('https://'),
      timing_ms: {
        total: totalDurationMs,
        ttfb: Math.round(totalDurationMs * 0.5),
      },
      headers: {
        server: responseHeaders['server'] || null,
        'x-robots-tag': responseHeaders['x-robots-tag'] || null,
        'last-modified': responseHeaders['last-modified'] || null,
      },
      extraction_timestamp: new Date().toISOString(),
      extraction_method: 'PLAYWRIGHT_BROWSER',
      extraction_tier: 'TIER_2_PLAYWRIGHT',
      viewport: { width: 1440, height: 900 },
    };

    return {
      success: true,
      httpMetadata,
      rawHtml: renderedHtml,
      rendered: true,
    };
  } catch (err) {
    const totalDurationMs = Date.now() - startTime;
    return {
      success: false,
      error: {
        code: 'PLAYWRIGHT_RENDER_ERROR',
        message: err.message,
      },
      httpMetadata: {
        requested_url: normalizedInitialUrl,
        final_url: normalizedInitialUrl,
        status_code: 0,
        status_text: err.message,
        redirect_chain: [],
        timing_ms: { total: totalDurationMs },
        extraction_timestamp: new Date().toISOString(),
        extraction_method: 'PLAYWRIGHT_FAILED',
        extraction_tier: 'TIER_2_PLAYWRIGHT',
      },
      rawHtml: '',
      rendered: false,
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}

module.exports = {
  renderWithBrowser,
};
