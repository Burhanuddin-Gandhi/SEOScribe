const cheerio = require('cheerio');

const BOILERPLATE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '.nav', '.navbar', '.navigation', '.site-header', '.site-footer',
  '.sidebar', '.widget-area', '.cookie-banner', '.consent-banner',
  '.advertisement', '.adsbygoogle', '.popup', '.modal', '.newsletter-signup',
];

const MAIN_CONTENT_SELECTORS = [
  'main', 'article', '[role="main"]',
  '#main-content', '#content', '#main',
  '.main-content', '.post-content', '.entry-content', '.article-body', '.page-content',
];

/**
 * Deterministic Main Content and Boilerplate Segmenter
 */
function segmentPageSections(html) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  // Clone document to avoid modifying original
  const $clean = cheerio.load($.html());

  // Remove scripts, styles, noscript, svg, hidden elements
  $clean('script, style, noscript, svg, iframe, [aria-hidden="true"], [hidden], [style*="display:none"], [style*="display: none"]').remove();

  // 1. Extract Navigation Sections
  const navigationTextParts = [];
  $clean('nav, .nav, .navbar, .navigation, [role="navigation"]').each((_, el) => {
    navigationTextParts.push($clean(el).text().replace(/\s+/g, ' ').trim());
  });
  const navigationText = navigationTextParts.join('\n');

  // 2. Extract Header Sections
  const headerTextParts = [];
  $clean('header, .header, .site-header, [role="banner"]').each((_, el) => {
    headerTextParts.push($clean(el).text().replace(/\s+/g, ' ').trim());
  });
  const headerText = headerTextParts.join('\n');

  // 3. Extract Footer Sections
  const footerTextParts = [];
  $clean('footer, .footer, .site-footer, [role="contentinfo"]').each((_, el) => {
    footerTextParts.push($clean(el).text().replace(/\s+/g, ' ').trim());
  });
  const footerText = footerTextParts.join('\n');

  // 4. Extract Sidebar Sections
  const sidebarTextParts = [];
  $clean('aside, .sidebar, .widget-area').each((_, el) => {
    sidebarTextParts.push($clean(el).text().replace(/\s+/g, ' ').trim());
  });
  const sidebarText = sidebarTextParts.join('\n');

  // 5. Detect & Extract Main Content Container
  let mainContainerEl = null;
  let detectionMethod = 'FALLBACK_BODY';

  for (const selector of MAIN_CONTENT_SELECTORS) {
    const el = $clean(selector);
    if (el.length > 0) {
      const text = el.first().text().trim();
      if (text.length > 100) {
        mainContainerEl = el.first();
        detectionMethod = `SELECTOR:${selector}`;
        break;
      }
    }
  }

  // If no explicit main selector found, strip boilerplate elements and take body
  if (!mainContainerEl) {
    $clean(BOILERPLATE_SELECTORS.join(', ')).remove();
    mainContainerEl = $clean('body');
  } else {
    // Also remove any nested nav/ads within the detected main container
    mainContainerEl.find('nav, .ad, .advertisement, .cookie-banner').remove();
  }

  const rawMainContentText = mainContainerEl.text().replace(/\s+/g, ' ').trim();
  const totalBodyText = $clean('body').text().replace(/\s+/g, ' ').trim();

  const mainContentRatio = totalBodyText.length > 0
    ? Math.min(1.0, Number((rawMainContentText.length / totalBodyText.length).toFixed(3)))
    : 0.0;

  return {
    detection_method: detectionMethod,
    is_ambiguous: detectionMethod === 'FALLBACK_BODY' && mainContentRatio < 0.5,
    main_content_ratio: mainContentRatio,
    sections: {
      main_content_text: rawMainContentText,
      navigation_text: navigationText,
      header_text: headerText,
      footer_text: footerText,
      sidebar_text: sidebarText,
    },
  };
}

module.exports = {
  segmentPageSections,
};
