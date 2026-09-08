const { chromium } = require('playwright');

/**
 * Lazily-launched, reused Chromium instance. Launching a browser process
 * per-request would be far too slow — we keep one alive for the life of
 * the server process and open a fresh page/context per request.
 *
 * NOTE: this singleton pattern assumes a long-lived Node process (fine on
 * localhost or a normal server/VM deploy). It does NOT carry over to a
 * serverless deploy (e.g. Vercel functions), where each invocation is a
 * fresh process — that will need a different approach (an external
 * headless-browser service, or a bundled-chromium serverless package).
 * Flagging this now so it isn't a surprise at deploy time.
 */
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true }).catch((err) => {
      // Reset so the next call retries launching instead of caching a failure.
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

/**
 * Render a URL with a real browser (executes JS, waits for network idle),
 * then return the fully-rendered HTML.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<{ html: string, finalUrl: string }>}
 */
async function renderWithPlaywright(url, timeoutMs = 20000) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  try {
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    });

    const html = await page.content();
    const finalUrl = page.url();

    return { html, finalUrl };
  } finally {
    // Always close the context (releases memory) even if rendering failed.
    await context.close();
  }
}

/**
 * Call this on server shutdown to release the browser process cleanly.
 */
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser) await browser.close();
    browserPromise = null;
  }
}

module.exports = { renderWithPlaywright, closeBrowser };
