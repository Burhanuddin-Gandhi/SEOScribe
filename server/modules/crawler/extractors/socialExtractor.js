const cheerio = require('cheerio');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Deterministic OpenGraph & Twitter/X Social Metadata Extractor
 */
function extractSocialMetadata(html, baseUrl) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const rawOpenGraph = {};
  const rawTwitter = {};

  // Extract all meta tags with property or name
  $('meta').each((_, el) => {
    const property = $(el).attr('property')?.toLowerCase().trim();
    const name = $(el).attr('name')?.toLowerCase().trim();
    const content = $(el).attr('content')?.trim();

    if (!content) return;

    if (property?.startsWith('og:') || property?.startsWith('article:') || property?.startsWith('product:') || property?.startsWith('video:')) {
      if (rawOpenGraph[property]) {
        if (Array.isArray(rawOpenGraph[property])) {
          rawOpenGraph[property].push(content);
        } else {
          rawOpenGraph[property] = [rawOpenGraph[property], content];
        }
      } else {
        rawOpenGraph[property] = content;
      }
    }

    if (name?.startsWith('twitter:') || property?.startsWith('twitter:')) {
      const key = name || property;
      rawTwitter[key] = content;
    }
  });

  // Normalized OpenGraph Object
  const openGraph = {
    title: rawOpenGraph['og:title'] || null,
    description: rawOpenGraph['og:description'] || null,
    type: rawOpenGraph['og:type'] || 'website',
    url: rawOpenGraph['og:url'] ? normalizeUrl(rawOpenGraph['og:url'], baseUrl) : null,
    site_name: rawOpenGraph['og:site_name'] || null,
    image: {
      url: rawOpenGraph['og:image'] ? normalizeUrl(rawOpenGraph['og:image'], baseUrl) : null,
      secure_url: rawOpenGraph['og:image:secure_url'] ? normalizeUrl(rawOpenGraph['og:image:secure_url'], baseUrl) : null,
      width: parseInt(rawOpenGraph['og:image:width'], 10) || null,
      height: parseInt(rawOpenGraph['og:image:height'], 10) || null,
      alt: rawOpenGraph['og:image:alt'] || null,
      type: rawOpenGraph['og:image:type'] || null,
    },
    article: {
      published_time: rawOpenGraph['article:published_time'] || null,
      modified_time: rawOpenGraph['article:modified_time'] || null,
      author: rawOpenGraph['article:author'] || null,
      section: rawOpenGraph['article:section'] || null,
      tags: Array.isArray(rawOpenGraph['article:tag']) ? rawOpenGraph['article:tag'] : rawOpenGraph['article:tag'] ? [rawOpenGraph['article:tag']] : [],
    },
    raw_properties: rawOpenGraph,
  };

  // Normalized Twitter Object
  const twitter = {
    card: rawTwitter['twitter:card'] || 'summary',
    title: rawTwitter['twitter:title'] || null,
    description: rawTwitter['twitter:description'] || null,
    site: rawTwitter['twitter:site'] || null,
    creator: rawTwitter['twitter:creator'] || null,
    image: {
      url: rawTwitter['twitter:image'] ? normalizeUrl(rawTwitter['twitter:image'], baseUrl) : null,
      alt: rawTwitter['twitter:image:alt'] || null,
    },
    raw_properties: rawTwitter,
  };

  return {
    open_graph: openGraph,
    twitter,
  };
}

module.exports = {
  extractSocialMetadata,
};
