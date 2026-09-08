const cheerio = require('cheerio');
const { normalizeUrl, classifyLinkRelation } = require('../normalizers/urlNormalizer');

/**
 * Classifies location of link within DOM structure
 */
function determineLinkLocation($el, $) {
  if ($el.closest('nav, .navbar, .navigation, .menu, [role="navigation"]').length > 0) {
    return 'NAVIGATION';
  }
  if ($el.closest('.breadcrumb, .breadcrumbs, [aria-label="breadcrumb"]').length > 0) {
    return 'BREADCRUMB';
  }
  if ($el.closest('header, .header, .site-header, [role="banner"]').length > 0) {
    return 'HEADER';
  }
  if ($el.closest('footer, .footer, .site-footer, [role="contentinfo"]').length > 0) {
    return 'FOOTER';
  }
  if ($el.closest('aside, .sidebar, .widget').length > 0) {
    return 'SIDEBAR';
  }
  if ($el.hasClass('btn') || $el.hasClass('button') || $el.hasClass('cta') || $el.attr('role') === 'button') {
    return 'CTA';
  }
  if ($el.closest('main, article, #content, .post-content, .entry-content').length > 0) {
    return 'MAIN_CONTENT';
  }
  return 'BODY_GENERIC';
}

/**
 * Deterministic Link Extractor
 */
function extractLinks(html, baseUrl) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const internalLinks = [];
  const externalLinks = [];
  let linkIndex = 0;

  $('a[href]').each((_, el) => {
    const $el = $(el);
    const rawHref = $el.attr('href')?.trim();
    if (!rawHref) return;

    // Filter out non-navigational links
    if (rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('#')) {
      return;
    }

    const normalizedAbsoluteUrl = normalizeUrl(rawHref, baseUrl);
    if (!normalizedAbsoluteUrl) return;

    linkIndex++;
    const anchorText = $el.text().replace(/\s+/g, ' ').trim() || $el.find('img').attr('alt')?.trim() || '[IMAGE/EMPTY]';
    const relAttr = ($el.attr('rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    const targetAttr = $el.attr('target')?.trim() || null;
    const location = determineLinkLocation($el, $);

    // Get surrounding sentence / paragraph context (up to 120 chars)
    const parentText = $el.parent().text().replace(/\s+/g, ' ').trim();
    const context = parentText.length > 150 ? parentText.slice(0, 147) + '...' : parentText;

    const classification = classifyLinkRelation(normalizedAbsoluteUrl, baseUrl);

    const linkRecord = {
      link_id: `lnk_${linkIndex}`,
      source_url: baseUrl,
      raw_destination: rawHref,
      normalized_url: normalizedAbsoluteUrl,
      anchor_text: anchorText,
      context_text: context,
      location,
      classification,
      rel: relAttr,
      is_nofollow: relAttr.includes('nofollow'),
      is_sponsored: relAttr.includes('sponsored'),
      is_ugc: relAttr.includes('ugc'),
      target: targetAttr,
      dom_position: linkIndex,
    };

    if (classification === 'INTERNAL' || classification === 'INTERNAL_SUBDOMAIN') {
      internalLinks.push(linkRecord);
    } else {
      externalLinks.push(linkRecord);
    }
  });

  const uniqueInternalUrls = new Set(internalLinks.map((l) => l.normalized_url));
  const uniqueExternalUrls = new Set(externalLinks.map((l) => l.normalized_url));

  return {
    internal_links: internalLinks,
    external_links: externalLinks,
    counts: {
      total_links: internalLinks.length + externalLinks.length,
      total_internal: internalLinks.length,
      unique_internal: uniqueInternalUrls.size,
      total_external: externalLinks.length,
      unique_external: uniqueExternalUrls.size,
      nofollow_internal: internalLinks.filter((l) => l.is_nofollow).length,
      nofollow_external: externalLinks.filter((l) => l.is_nofollow).length,
    },
  };
}

module.exports = {
  extractLinks,
};
