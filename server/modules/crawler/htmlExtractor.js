const cheerio = require('cheerio');

/**
 * Extract SEO-relevant signals + text content from an HTML string.
 * Used for BOTH the fast static fetch and the Playwright-rendered fallback —
 * whichever produced the HTML, this logic (and therefore the resulting
 * signal shape) is identical, so results from the two paths are directly
 * comparable.
 *
 * @param {string} html
 * @param {string} finalUrl - the URL the HTML was actually served from
 */
function extractSignals(html, finalUrl) {
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  const h1Count = $('h1').length;
  const h1Texts = [];
  $('h1').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) h1Texts.push(text);
  });
  const h2Count = $('h2').length;

  const headings = [];
  $('h1, h2, h3').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) headings.push(text);
  });

  const paragraphs = [];
  $('p').each((i, elem) => {
    if (i < 80) {
      const text = $(elem).text().trim();
      if (text && text.length > 20) paragraphs.push(text);
    }
  });

  const images = $('img');
  const imageCount = images.length;
  let imagesMissingAlt = 0;
  images.each((i, el) => {
    const alt = $(el).attr('alt');
    if (!alt || !alt.trim()) imagesMissingAlt++;
  });

  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const hasSchema = $('script[type="application/ld+json"]').length > 0;
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  let isHttps = true;
  let hostname = '';
  try {
    const parsedUrl = new URL(finalUrl);
    isHttps = parsedUrl.protocol === 'https:';
    hostname = parsedUrl.hostname;
  } catch {
    // keep defaults if finalUrl can't be parsed
  }

  let internalLinkCount = 0;
  $('a[href]').each((i, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('/') || (hostname && href.includes(hostname))) {
      internalLinkCount++;
    }
  });

  // Clean visible text excluding scripts, styles, and SVGs
  const bodyClone = $('body').clone();
  bodyClone.find('script, style, noscript, svg, iframe').remove();
  const cleanVisibleBody = bodyClone.text().replace(/\s+/g, ' ').trim();

  let bodyText = [title, description, ...headings, ...paragraphs]
    .filter((t) => t && t.length > 0)
    .join('\n');

  // If paragraphs were sparse (e.g. SPAs, login gates, modern div-based landing pages), incorporate clean visible text
  if (bodyText.length < 300 && cleanVisibleBody.length > bodyText.length) {
    bodyText = [title, description, ...headings, cleanVisibleBody.slice(0, 6000)]
      .filter(Boolean)
      .join('\n');
  }

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Raw visible body text length, independent of our own tag selection
  const rawBodyText = cleanVisibleBody;

  return {
    title: title || '',
    description: description || '',
    content: bodyText,
    rawBodyTextLength: rawBodyText.length,
    rawBodyTextSample: rawBodyText.slice(0, 2000),
    htmlLength: html.length,
    signals: {
      title,
      metaDescription: description,
      h1Count,
      h1Texts,
      h2Count,
      imageCount,
      imagesMissingAlt,
      hasCanonical,
      hasSchema,
      hasViewportMeta,
      isHttps,
      internalLinkCount,
      wordCount,
    },
  };
}

/**
 * Heuristic check: does this extraction look like it actually captured the
 * page's real content, or does it look like a JS-rendered shell / block
 * page that a non-JS fetch couldn't see through?
 *
 * This does NOT prove the content is complete — it just flags known
 * failure signatures worth escalating to a heavier render.
 */
const SPA_SHELL_MARKERS = [
  /<div\s+id=["']root["']\s*>\s*<\/div>/i,
  /<div\s+id=["']app["']\s*>\s*<\/div>/i,
  /<div\s+id=["']__next["']\s*>\s*<\/div>/i,
  /you need to enable javascript/i,
  /please enable javascript/i,
];

function looksSuspicious(extracted, rawHtml) {
  const reasons = [];

  if (extracted.signals.wordCount < 80) {
    reasons.push(`Very low extracted word count (${extracted.signals.wordCount}).`);
  }

  if (extracted.rawBodyTextLength < 200) {
    reasons.push(`Very little visible body text (${extracted.rawBodyTextLength} chars).`);
  }

  // Script-heavy, content-light HTML is a classic SPA-shell signature:
  // most of the payload is JS bundles, not markup with text in it.
  if (extracted.htmlLength > 20000 && extracted.rawBodyTextLength < extracted.htmlLength * 0.02) {
    reasons.push('HTML is large but almost none of it is visible text (likely JS-rendered).');
  }

  if (SPA_SHELL_MARKERS.some((pattern) => pattern.test(rawHtml))) {
    reasons.push('Detected a known single-page-app shell or "enable JavaScript" marker.');
  }

  return { suspicious: reasons.length > 0, reasons };
}

module.exports = { extractSignals, looksSuspicious };