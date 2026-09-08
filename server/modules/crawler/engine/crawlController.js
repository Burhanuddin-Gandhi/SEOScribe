const crypto = require('crypto');
const { scrapeWithFirecrawl, mapWithFirecrawl } = require('./firecrawlFetcher');
const { fetchWithGateway } = require('./gatewayFetcher');
const { fetchHttp } = require('./httpFetcher');
const { renderWithBrowser } = require('./browserRenderer');
const { extractMetadata } = require('../extractors/metadataExtractor');
const { extractSocialMetadata } = require('../extractors/socialExtractor');
const { segmentPageSections } = require('../extractors/mainContentDetector');
const { extractContentTree } = require('../extractors/contentTreeExtractor');
const { extractHeadingTree } = require('../extractors/headingExtractor');
const { extractLinks } = require('../extractors/linkExtractor');
const { extractMedia } = require('../extractors/mediaExtractor');
const { extractStructuredData } = require('../extractors/schemaExtractor');
const { extractFaqs } = require('../extractors/faqExtractor');
const { extractTables } = require('../extractors/tableExtractor');
const { extractEntities } = require('../extractors/entityExtractor');
const { computeDerivedMetrics } = require('../analytics/derivedMetrics');
const { buildSiteLinkGraph } = require('../analytics/siteGraphBuilder');
const { fetchRobotsAndSitemaps } = require('../storage/sitemapRobotsParser');
const { normalizeUrl, extractRootDomain } = require('../normalizers/urlNormalizer');
const { assemblePageKnowledgeRecord } = require('../normalizers/dataNormalizer');

/**
 * Extracts comprehensive structured knowledge from a single page URL.
 * Multi-tier cloud and local waterfall:
 *   Tier 1: Firecrawl (AI-native clean markdown, rendered HTML, flat 1-credit efficiency)
 *   Tier 2: ScrapingBee (Heavy artillery residential proxy & anti-bot bypass)
 *   Tier 3: Local Playwright / HTTP Fetcher (Zero-cost offline safety net)
 */
async function extractPageKnowledge(targetUrl, options = {}) {
  const normalizedUrl = normalizeUrl(targetUrl);
  if (!normalizedUrl) {
    throw new Error(`Invalid URL provided: ${targetUrl}`);
  }

  let rawHtml = '';
  let markdown = '';
  let httpMetadata = {};
  let extractionTier = 'TIER_1_HTTP';
  let cloudMetadata = null;

  // --- PASS 1: Firecrawl Cloud Scraper (Primary) ---
  if (process.env.FIRECRAWL_API_KEY && !options.skipFirecrawl) {
    try {
      const fcResult = await scrapeWithFirecrawl(normalizedUrl, options);
      if (fcResult.success && fcResult.rawHtml && fcResult.rawHtml.length > 200) {
        rawHtml = fcResult.rawHtml;
        markdown = fcResult.markdown || '';
        httpMetadata = fcResult.httpMetadata;
        cloudMetadata = fcResult.metadata;
        extractionTier = 'TIER_1_FIRECRAWL';
      } else {
        console.warn(`[Crawler] Firecrawl fell through: ${fcResult.error?.message || 'Empty payload'}`);
      }
    } catch (fcErr) {
      console.warn(`[Crawler] Firecrawl error: ${fcErr.message}`);
    }
  }

  // --- PASS 2: ScrapingBee Stealth Gateway (Heavy Artillery Fallback) ---
  if (!rawHtml && process.env.SCRAPINGBEE_API_KEY) {
    try {
      console.log(`[Crawler] Escalating to ScrapingBee stealth gateway for ${normalizedUrl}...`);
      const sbResult = await fetchWithGateway(normalizedUrl, {
        ...options,
        renderJs: true,
      });
      if (sbResult.success && sbResult.rawHtml && sbResult.rawHtml.length > 200) {
        rawHtml = sbResult.rawHtml;
        httpMetadata = sbResult.httpMetadata;
        extractionTier = 'TIER_2_SCRAPINGBEE';
      }
    } catch (sbErr) {
      console.warn(`[Crawler] ScrapingBee error: ${sbErr.message}`);
    }
  }

  // --- PASS 3: Local Playwright / HTTP Fetch (Zero-cost Safety Net) ---
  if (!rawHtml) {
    console.log(`[Crawler] Using local fetcher/renderer for ${normalizedUrl}...`);
    const httpResult = await fetchHttp(normalizedUrl, options);
    rawHtml = httpResult.rawHtml;
    httpMetadata = httpResult.httpMetadata;
    extractionTier = 'TIER_3_LOCAL_HTTP';

    const shouldRenderWithBrowser =
      options.forceBrowser ||
      httpResult.jsEvaluation?.requiresRendering ||
      (httpResult.httpMetadata?.status_code >= 400 && httpResult.httpMetadata?.status_code !== 404);

    if (shouldRenderWithBrowser) {
      try {
        const browserResult = await renderWithBrowser(normalizedUrl, options);
        if (browserResult.success && browserResult.rawHtml.length > 200) {
          rawHtml = browserResult.rawHtml;
          httpMetadata = browserResult.httpMetadata;
          extractionTier = 'TIER_3_LOCAL_PLAYWRIGHT';
        }
      } catch (browserErr) {
        console.warn(`[Crawler] Local browser error: ${browserErr.message}`);
      }
    }
  }

  httpMetadata.extraction_tier = extractionTier;

  // 4. Run Deterministic Extractors on Rendered HTML
  const metadata = extractMetadata(rawHtml, normalizedUrl);
  // Merge any high-accuracy cloud metadata (e.g. OpenGraph, clean title from Firecrawl)
  if (cloudMetadata) {
    if (cloudMetadata.title && (!metadata.title || !metadata.title.raw)) {
      metadata.title = {
        raw: cloudMetadata.title,
        length_chars: cloudMetadata.title.length,
        is_missing: false,
        multiple_detected: false,
        all_declared: [cloudMetadata.title],
      };
    }
    if (cloudMetadata.description && (!metadata.description || !metadata.description.raw)) {
      metadata.description = {
        raw: cloudMetadata.description,
        length_chars: cloudMetadata.description.length,
        is_missing: false,
        multiple_detected: false,
        all_declared: [cloudMetadata.description],
      };
    }
    if (cloudMetadata.canonicalUrl && (!metadata.canonical || !metadata.canonical.declared)) {
      metadata.canonical = {
        declared: cloudMetadata.canonicalUrl,
        resolved: cloudMetadata.canonicalUrl,
        is_missing: false,
        is_self_referential: cloudMetadata.canonicalUrl === normalizedUrl,
        multiple_detected: false,
        conflicting_canonical: false,
        all_declared: [cloudMetadata.canonicalUrl],
      };
    }
  }

  const social = extractSocialMetadata(rawHtml, normalizedUrl);
  const mainContent = segmentPageSections(rawHtml);
  // If Firecrawl provided pristine AI markdown, enrich mainContent with it
  if (markdown) {
    mainContent.markdown = markdown;
  }

  const contentTree = extractContentTree(rawHtml);
  const headings = extractHeadingTree(rawHtml);
  const links = extractLinks(rawHtml, normalizedUrl);
  const media = extractMedia(rawHtml, normalizedUrl);
  const structuredData = extractStructuredData(rawHtml);
  const faqs = extractFaqs(rawHtml, normalizedUrl, structuredData);
  const tables = extractTables(rawHtml);
  const entities = extractEntities(rawHtml, structuredData, metadata);

  // 5. Compute Deterministic Derived Metrics
  const derivedMetrics = computeDerivedMetrics({
    text: mainContent.sections.main_content_text,
    contentTree,
    headings,
    links,
    media,
    tables,
    mainContent,
  });

  // 6. Assemble Normalized Page Knowledge Record
  return assemblePageKnowledgeRecord({
    url: normalizedUrl,
    httpMetadata,
    metadata,
    social,
    mainContent,
    contentTree,
    headings,
    links,
    media,
    structuredData,
    faqs,
    tables,
    entities,
    derivedMetrics,
  });
}

/**
 * Multi-page Site Intelligence Crawler
 * Combines Firecrawl /map with recursive crawling and site link graph analysis.
 */
async function extractSiteKnowledge(startUrl, options = {}) {
  const maxPages = options.maxPages || 5;
  const normalizedStartUrl = normalizeUrl(startUrl);
  const rootDomain = extractRootDomain(normalizedStartUrl);

  const sessionId = 'crawl_' + crypto.randomBytes(6).toString('hex');
  const startedAt = new Date().toISOString();

  // 1. Fetch robots.txt and sitemaps
  const robotsAndSitemaps = await fetchRobotsAndSitemaps(normalizedStartUrl, options);

  const queue = [normalizedStartUrl];
  const visited = new Set();
  const pages = [];
  const failedUrls = [];

  // 2. Discover URLs rapidly using Firecrawl /map if configured
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const mapResult = await mapWithFirecrawl(normalizedStartUrl, { limit: maxPages * 3 });
      if (mapResult.success && Array.isArray(mapResult.links)) {
        mapResult.links.forEach((discoveredUrl) => {
          const norm = normalizeUrl(discoveredUrl);
          if (norm && extractRootDomain(norm) === rootDomain && !queue.includes(norm)) {
            queue.push(norm);
          }
        });
      }
    } catch {
      // Non-fatal, proceed with recursive crawl
    }
  }

  // 3. Process crawl queue up to maxPages
  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const pageRecord = await extractPageKnowledge(currentUrl, options);
      pages.push(pageRecord);

      // Enqueue newly discovered internal links belonging to the same root domain
      pageRecord.links?.internal?.forEach((link) => {
        const linkDomain = extractRootDomain(link.normalized_url);
        if (linkDomain === rootDomain && !visited.has(link.normalized_url) && !queue.includes(link.normalized_url)) {
          queue.push(link.normalized_url);
        }
      });
    } catch (err) {
      failedUrls.push({
        url: currentUrl,
        error: err.message,
      });
    }
  }

  // 4. Build Site Architecture Link Graph
  const siteArchitecture = {
    link_graph: buildSiteLinkGraph(pages),
    discovered_urls_count: visited.size + queue.length,
    remaining_queue_count: queue.length,
  };

  return {
    website: {
      domain: rootDomain,
      base_url: normalizedStartUrl,
      crawl: {
        session_id: sessionId,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        total_pages_crawled: pages.length,
        failed_urls: failedUrls,
      },
      robots: robotsAndSitemaps.robots,
      sitemaps: robotsAndSitemaps.sitemaps,
    },
    pages,
    site_architecture: siteArchitecture,
  };
}

module.exports = {
  extractPageKnowledge,
  extractSiteKnowledge,
};
