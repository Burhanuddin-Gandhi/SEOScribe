const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeUrl } = require('../normalizers/urlNormalizer');

/**
 * Deterministic robots.txt and sitemap.xml discovery and parser
 */
async function fetchRobotsAndSitemaps(baseUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 10000;
  let robotsData = {
    found: false,
    disallowed_paths: [],
    allowed_paths: [],
    sitemaps: [],
    crawl_delay: null,
    raw_content: null,
  };

  let sitemapData = {
    discovered_urls_count: 0,
    urls: [],
  };

  try {
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;

    // 1. Fetch robots.txt
    const robotsRes = await axios.get(robotsUrl, {
      timeout: timeoutMs,
      validateStatus: (status) => status === 200,
    });

    if (robotsRes.status === 200 && typeof robotsRes.data === 'string') {
      robotsData.found = true;
      robotsData.raw_content = robotsRes.data;

      const lines = robotsRes.data.split('\n');
      lines.forEach((line) => {
        const clean = line.trim();
        if (clean.toLowerCase().startsWith('disallow:')) {
          const pathVal = clean.slice(9).trim();
          if (pathVal) robotsData.disallowed_paths.push(pathVal);
        } else if (clean.toLowerCase().startsWith('allow:')) {
          const pathVal = clean.slice(6).trim();
          if (pathVal) robotsData.allowed_paths.push(pathVal);
        } else if (clean.toLowerCase().startsWith('sitemap:')) {
          const sitemapUrl = clean.slice(8).trim();
          if (sitemapUrl) robotsData.sitemaps.push(sitemapUrl);
        } else if (clean.toLowerCase().startsWith('crawl-delay:')) {
          robotsData.crawl_delay = parseInt(clean.slice(12).trim(), 10) || null;
        }
      });
    }

    // Default sitemap if none declared
    if (robotsData.sitemaps.length === 0) {
      robotsData.sitemaps.push(`${origin}/sitemap.xml`);
    }

    // 2. Fetch first discovered sitemap
    if (robotsData.sitemaps.length > 0) {
      const primarySitemap = robotsData.sitemaps[0];
      try {
        const sitemapRes = await axios.get(primarySitemap, {
          timeout: timeoutMs,
          validateStatus: (status) => status === 200,
        });

        if (sitemapRes.status === 200 && typeof sitemapRes.data === 'string') {
          const $xml = cheerio.load(sitemapRes.data, { xmlMode: true });
          const urls = [];

          $xml('url').each((_, el) => {
            const loc = $xml(el).find('loc').text().trim();
            const lastmod = $xml(el).find('lastmod').text().trim() || null;
            if (loc) {
              urls.push({
                loc: normalizeUrl(loc),
                lastmod,
              });
            }
          });

          sitemapData = {
            sitemap_url: primarySitemap,
            discovered_urls_count: urls.length,
            urls: urls.slice(0, 500), // Cap at 500 URLs per fetch
          };
        }
      } catch {}
    }
  } catch {}

  return {
    robots: robotsData,
    sitemaps: sitemapData,
  };
}

module.exports = {
  fetchRobotsAndSitemaps,
};
