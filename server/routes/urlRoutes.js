const express = require('express');
const router = express.Router();
const axios = require('axios');
const { analyzeSEOContent } = require('../modules/seo/seoAnalyzer');
const { extractSignals, looksSuspicious } = require('../modules/crawler/htmlExtractor');
const { renderWithPlaywright } = require('../modules/crawler/playwrightRenderer');
const { scrapeWithFirecrawl } = require('../modules/crawler/engine/firecrawlFetcher');
const { scrapeWithScrapingBee } = require('../modules/crawler/engine/gatewayFetcher');
const { logExtraction, hashContent } = require('../modules/seo/auditLog');
const { checkAndRecordConsistency } = require('../modules/seo/analysisHistory');
const { orchestrateUrlRemediation } = require('../modules/agents/agentOrchestrator');
const { heavySeoLimiter, verifyClientHeader, isSafePublicUrl } = require('../middleware/security');

const MIN_CONTENT_CHARS = 300;

/**
 * POST /api/seo/analyze-url
 *
 * Multi-Tier Cloud & Local Extraction Waterfall:
 *   1. Primary: Firecrawl Cloud API (Clean AI Markdown, fully-rendered DOM, flat 1-credit).
 *   2. Secondary: ScrapingBee Stealth Gateway (Residential proxies & tough anti-bot bypass).
 *   3. Tertiary: Fast static fetch + conditional Playwright headless browser.
 */
router.post('/analyze-url', heavySeoLimiter, verifyClientHeader, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'No URL provided. Please provide a valid website URL.',
      code: 'NO_URL',
    });
  }

  const urlValidation = isSafePublicUrl(url);
  if (!urlValidation.valid) {
    return res.status(400).json({
      success: false,
      error: urlValidation.error,
      code: 'INVALID_URL',
    });
  }

  const validatedUrl = urlValidation.url;
  console.log(`[URL Analyzer] Received: ${validatedUrl}`);

  try {
    let finalExtraction = null;
    let finalHtml = '';
    let finalUrl = validatedUrl;
    let renderMethod = 'unknown';
    let confidence = 'high';
    let fallbackAttempted = false;
    let fallbackError = null;

    // =========================================================================
    // TIER 1: Firecrawl Cloud API (Primary)
    // =========================================================================
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        console.log(`[URL Analyzer] Initiating Tier 1 Firecrawl scrape for ${validatedUrl}...`);
        const fcResult = await scrapeWithFirecrawl(validatedUrl, { timeoutMs: 12000 });

        if (fcResult.success && fcResult.rawHtml && fcResult.rawHtml.length > 200) {
          finalHtml = fcResult.rawHtml;
          finalUrl = fcResult.httpMetadata?.final_url || validatedUrl;
          finalExtraction = extractSignals(finalHtml, finalUrl);

          // Enrich signals with Firecrawl's clean markdown & metadata
          if (fcResult.markdown) {
            finalExtraction.markdown = fcResult.markdown;
            // If raw text was sparse, markdown can provide additional clean content
            if (finalExtraction.content.length < 500 && fcResult.markdown.length > finalExtraction.content.length) {
              finalExtraction.content = fcResult.markdown;
            }
          }
          if (fcResult.metadata?.title && !finalExtraction.signals.title) {
            finalExtraction.signals.title = fcResult.metadata.title;
            finalExtraction.title = fcResult.metadata.title;
          }
          if (fcResult.metadata?.description && !finalExtraction.signals.metaDescription) {
            finalExtraction.signals.metaDescription = fcResult.metadata.description;
            finalExtraction.description = fcResult.metadata.description;
          }

          renderMethod = 'firecrawl-cloud';
          confidence = 'high';
          console.log(`[URL Analyzer] Firecrawl scrape succeeded (${finalExtraction.signals.wordCount} words)`);
        } else {
          fallbackAttempted = true;
          fallbackError = fcResult.error?.message || 'Firecrawl returned empty body';
          console.warn(`[URL Analyzer] Firecrawl did not complete: ${fallbackError}`);
        }
      } catch (fcErr) {
        fallbackAttempted = true;
        fallbackError = fcErr.message;
        console.warn(`[URL Analyzer] Firecrawl attempt failed: ${fcErr.message}`);
      }
    }

    // =========================================================================
    // TIER 2: ScrapingBee Stealth Gateway (Heavy Artillery Fallback)
    // =========================================================================
    if (!finalExtraction && process.env.SCRAPINGBEE_API_KEY) {
      try {
        console.log(`[URL Analyzer] Escalating to Tier 2 ScrapingBee stealth gateway for ${validatedUrl}...`);
        fallbackAttempted = true;
        const sbResult = await scrapeWithScrapingBee(validatedUrl, {
          renderJs: true,
          timeoutMs: 15000,
        });

        if (sbResult.success && sbResult.rawHtml && sbResult.rawHtml.length > 200) {
          finalHtml = sbResult.rawHtml;
          finalUrl = sbResult.httpMetadata?.final_url || validatedUrl;
          finalExtraction = extractSignals(finalHtml, finalUrl);
          renderMethod = 'scrapingbee-stealth';
          confidence = 'high';
          console.log(`[URL Analyzer] ScrapingBee stealth scrape succeeded (${finalExtraction.signals.wordCount} words)`);
        } else {
          fallbackError = sbResult.error?.message || 'ScrapingBee returned empty body';
          console.warn(`[URL Analyzer] ScrapingBee failed: ${fallbackError}`);
        }
      } catch (sbErr) {
        fallbackError = sbErr.message;
        console.warn(`[URL Analyzer] ScrapingBee attempt failed: ${sbErr.message}`);
      }
    }

    // =========================================================================
    // TIER 3: Local Static Fetch + Conditional Headless Playwright
    // =========================================================================
    if (!finalExtraction) {
      console.log(`[URL Analyzer] Using Tier 3 local fetch/render for ${validatedUrl}...`);
      fallbackAttempted = true;

      let staticFetch;
      try {
        staticFetch = await fetchStaticHTML(validatedUrl);
      } catch (error) {
        return handleFetchError(res, error);
      }

      finalUrl = staticFetch.finalUrl;
      const staticExtraction = extractSignals(staticFetch.html, staticFetch.finalUrl);
      const suspicion = looksSuspicious(staticExtraction, staticFetch.html);

      finalExtraction = staticExtraction;
      finalHtml = staticFetch.html;
      renderMethod = 'static';

      // Conditional Playwright fallback if static looked thin/suspicious
      if (suspicion.suspicious) {
        console.log(
          `[URL Analyzer] Static fetch looked unreliable (${suspicion.reasons.join(' ')}) — escalating to Playwright.`
        );

        try {
          const rendered = await renderWithPlaywright(validatedUrl);
          const renderedExtraction = extractSignals(rendered.html, rendered.finalUrl);

          if (renderedExtraction.signals.wordCount > staticExtraction.signals.wordCount * 1.3) {
            finalExtraction = renderedExtraction;
            finalHtml = rendered.html;
            finalUrl = rendered.finalUrl;
            renderMethod = 'headless-fallback';
            confidence = 'medium';
          } else {
            renderMethod = 'headless-fallback-no-improvement';
            confidence = 'low';
          }
        } catch (err) {
          fallbackError = err.message;
          console.error('[URL Analyzer] Headless fallback failed:', err.message);
          renderMethod = 'headless-fallback-failed';
          confidence = 'low';
        }
      } else {
        confidence = 'high';
      }
    }

    // --- Confidence gate & Login Wall Detection ---
    const finalSuspicion = looksSuspicious(finalExtraction, finalHtml);
    const stillTooThin = finalExtraction.content.length < MIN_CONTENT_CHARS;

    const isLoginWall =
      /(\/login|\/signin|\/log-in|\/sign-in)/i.test(finalUrl) ||
      /\b(log in|sign in|create an account|login to continue|log in to facebook)\b/i.test(finalExtraction.title || '') ||
      (finalExtraction.signals.wordCount < 100 && /\b(login|password|sign in|forgot password|email address or mobile)\b/i.test(finalExtraction.content || ''));

    if (stillTooThin && renderMethod !== 'firecrawl-cloud' && renderMethod !== 'scrapingbee-stealth') {
      confidence = 'low';
    }

    logExtraction({
      sourceType: 'url',
      target: validatedUrl,
      renderMethod,
      confidence,
      fallbackAttempted,
      fallbackError,
      finalWordCount: finalExtraction.signals.wordCount,
      contentHash: hashContent(finalExtraction.content),
      htmlHash: hashContent(finalHtml),
      finalSuspicionReasons: finalSuspicion.reasons,
    });

    if ((confidence === 'low' && stillTooThin) || finalExtraction.content.length < 50) {
      return res.status(422).json({
        success: false,
        error: isLoginWall
          ? "This website requires a user login or active authentication session (e.g. Facebook Login). SEOScribe cannot access login-gated or private pages. Please enter a public website, blog post, or product landing page."
          : "We couldn't reliably analyze this page — it may be blocking automated access, require a login, or rely on content we couldn't load. Try again with a public article or landing page.",
        code: isLoginWall ? 'LOGIN_WALL_DETECTED' : 'UNRELIABLE_EXTRACTION',
      });
    }

    // --- Analyze SEO Content ---
    const analysis = analyzeSEOContent(finalExtraction.content, finalUrl, finalExtraction.signals);
    const contentHash = hashContent(finalExtraction.content);

    // --- Multi-Agent Surgical Remediation (Fixes ONLY what is missing) ---
    const agentRemediation = await orchestrateUrlRemediation({
      url: finalUrl,
      signals: finalExtraction.signals,
      content: finalExtraction.content,
      competitors: analysis.competitors || [],
      keywords: analysis.keywords || [],
    });

    analysis.agentRemediation = agentRemediation;

    // --- Consistency check against previous runs ---
    const consistencyCheck = checkAndRecordConsistency(finalUrl, {
      score: analysis.score,
      wordCount: finalExtraction.signals.wordCount,
      contentHash,
      confidence,
    });

    // --- Raw Checkable Evidence ---
    const evidence = {
      title: finalExtraction.signals.title || null,
      metaDescription: finalExtraction.signals.metaDescription || null,
      h1Count: finalExtraction.signals.h1Count,
      h1Texts: finalExtraction.signals.h1Texts,
      imageCount: finalExtraction.signals.imageCount,
      imagesMissingAlt: finalExtraction.signals.imagesMissingAlt,
      hasCanonical: finalExtraction.signals.hasCanonical,
      hasSchema: finalExtraction.signals.hasSchema,
      hasViewportMeta: finalExtraction.signals.hasViewportMeta,
      isHttps: finalExtraction.signals.isHttps,
      internalLinkCount: finalExtraction.signals.internalLinkCount,
      wordCount: finalExtraction.signals.wordCount,
      renderMethod,
      contentHash,
    };

    return res.json({
      success: true,
      url: finalUrl,
      pageTitle: finalExtraction.title || 'No title found',
      pageDescription: finalExtraction.description || 'No description',
      characterCount: finalExtraction.content.length,
      extractedText: finalExtraction.content,
      markdown: finalExtraction.markdown || null,
      analysis,
      agentRemediation,
      evidence,
      consistencyCheck,
      extractionMeta: {
        confidence,
        renderMethod,
      },
    });
  } catch (error) {
    console.error('[URL Analyzer] Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error analyzing website',
      code: 'ANALYSIS_ERROR',
    });
  }
});

function handleFetchError(res, error) {
  if (error.message.includes('ENOTFOUND')) {
    return res.status(400).json({
      success: false,
      error: 'Domain not found. Please check the URL spelling.',
      code: 'DOMAIN_NOT_FOUND',
    });
  }
  if (error.message.includes('ECONNREFUSED')) {
    return res.status(400).json({
      success: false,
      error: 'Connection refused. Website may be down or blocking access.',
      code: 'CONNECTION_REFUSED',
    });
  }
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return res.status(408).json({
      success: false,
      error: 'Website took too long to respond. Please try again later.',
      code: 'TIMEOUT',
    });
  }
  if (error.response?.status === 400 || error.message.includes('status code 400')) {
    return res.status(400).json({
      success: false,
      error: 'This website blocked non-browser requests (HTTP 400). It may require a full user session or CAPTCHA verification.',
      code: 'ACCESS_REJECTED',
    });
  }
  if (error.response?.status === 403 || error.message.includes('status code 403') || error.response?.status === 401 || error.message.includes('status code 401')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: This website blocks automated crawlers or requires login authentication (HTTP 401/403).',
      code: 'AUTH_REQUIRED',
    });
  }
  return res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Error fetching website',
    code: error.code || 'FETCH_ERROR',
  });
}

async function fetchStaticHTML(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    maxRedirects: 5,
  });

  if (!response.data) {
    throw new Error('Response body is empty');
  }

  const finalUrl = response.request?.res?.responseUrl || response.config.url || url;
  return { html: response.data, finalUrl };
}

module.exports = router;