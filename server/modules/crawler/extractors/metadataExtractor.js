const cheerio = require('cheerio');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Deterministic Document Metadata Extractor
 */
function extractMetadata(html, baseUrl) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  // 1. Titles
  const titleElements = $('title');
  const rawTitle = titleElements.first().text().trim();
  const allTitles = titleElements.map((_, el) => $(el).text().trim()).get();

  const titleData = {
    raw: rawTitle || null,
    length_chars: rawTitle ? rawTitle.length : 0,
    is_missing: !rawTitle,
    multiple_detected: titleElements.length > 1,
    all_declared: allTitles,
  };

  // 2. Meta Descriptions
  const descElements = $('meta[name="description" i], meta[property="description" i]');
  const rawDesc = descElements.first().attr('content')?.trim() || null;
  const allDescriptions = descElements.map((_, el) => $(el).attr('content')?.trim()).filter(Boolean).get();

  const descriptionData = {
    raw: rawDesc,
    length_chars: rawDesc ? rawDesc.length : 0,
    is_missing: !rawDesc,
    multiple_detected: descElements.length > 1,
    all_declared: allDescriptions,
  };

  // 3. Meta Keywords
  const rawKeywords = $('meta[name="keywords" i]').attr('content')?.trim() || null;

  // 4. Canonical Tags
  const canonicalElements = $('link[rel="canonical" i]');
  const declaredCanonical = canonicalElements.first().attr('href')?.trim() || null;
  const resolvedCanonical = declaredCanonical ? normalizeUrl(declaredCanonical, baseUrl) : null;
  const allCanonicals = canonicalElements.map((_, el) => $(el).attr('href')?.trim()).filter(Boolean).get();

  const canonicalData = {
    declared: declaredCanonical,
    resolved: resolvedCanonical,
    is_missing: !declaredCanonical,
    is_self_referential: resolvedCanonical ? resolvedCanonical === normalizeUrl(baseUrl) : false,
    multiple_detected: canonicalElements.length > 1,
    conflicting_canonical: canonicalElements.length > 1 && new Set(allCanonicals).size > 1,
    all_declared: allCanonicals,
  };

  // 5. Robots Meta Directives
  const metaRobotsTag = $('meta[name="robots" i]').attr('content') || '';
  const googlebotRobotsTag = $('meta[name="googlebot" i]').attr('content') || '';
  const combinedRobots = `${metaRobotsTag}, ${googlebotRobotsTag}`.toLowerCase();

  const robotsDirectives = {
    raw: metaRobotsTag || null,
    googlebot_raw: googlebotRobotsTag || null,
    index: !combinedRobots.includes('noindex'),
    follow: !combinedRobots.includes('nofollow'),
    noarchive: combinedRobots.includes('noarchive'),
    nosnippet: combinedRobots.includes('nosnippet'),
    noimageindex: combinedRobots.includes('noimageindex'),
    notranslate: combinedRobots.includes('notranslate'),
  };

  // 6. Hreflang Alternates
  const hreflang = [];
  $('link[rel="alternate" i][hreflang]').each((_, el) => {
    const lang = $(el).attr('hreflang')?.trim();
    const href = $(el).attr('href')?.trim();
    if (lang && href) {
      hreflang.push({
        lang,
        declared_href: href,
        resolved_href: normalizeUrl(href, baseUrl),
      });
    }
  });

  // 7. Language, Charset, Viewport
  const htmlLang = $('html').attr('lang')?.trim() || null;
  const metaLang = $('meta[http-equiv="content-language" i]').attr('content')?.trim() || null;
  const viewport = $('meta[name="viewport" i]').attr('content')?.trim() || null;
  const charset = $('meta[charset]').attr('charset')?.trim() || $('meta[http-equiv="content-type" i]').attr('content')?.match(/charset=([^\s;]+)/i)?.[1] || 'UTF-8';

  // 8. Author & Publisher Metadata
  const author = $('meta[name="author" i]').attr('content')?.trim() || $('meta[property="article:author" i]').attr('content')?.trim() || $('[rel="author"]').first().text().trim() || null;
  const publisher = $('meta[property="article:publisher" i]').attr('content')?.trim() || $('link[rel="publisher"]').attr('href')?.trim() || null;

  // 9. Publication & Modification Dates
  const publishedTime = $('meta[property="article:published_time" i]').attr('content')?.trim() || $('meta[name="publication_date" i]').attr('content')?.trim() || $('meta[name="date" i]').attr('content')?.trim() || $('time[datetime]').first().attr('datetime') || null;
  const modifiedTime = $('meta[property="article:modified_time" i]').attr('content')?.trim() || $('meta[property="og:updated_time" i]').attr('content')?.trim() || $('meta[name="last-modified" i]').attr('content')?.trim() || null;

  // 10. Preserve All Raw Meta Tags
  const allMetaTags = [];
  $('meta').each((_, el) => {
    const attribs = el.attribs || {};
    if (Object.keys(attribs).length > 0) {
      allMetaTags.push(attribs);
    }
  });

  return {
    title: titleData,
    meta_description: descriptionData,
    meta_keywords: rawKeywords,
    canonical: canonicalData,
    robots_directives: robotsDirectives,
    hreflang,
    language_declaration: {
      html_lang: htmlLang,
      meta_lang: metaLang,
      effective_lang: htmlLang || metaLang || 'und',
    },
    charset,
    viewport,
    author,
    publisher,
    dates: {
      published_time: publishedTime,
      modified_time: modifiedTime,
    },
    raw_meta_tags: allMetaTags,
  };
}

module.exports = {
  extractMetadata,
};
