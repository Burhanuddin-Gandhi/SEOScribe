const { URL } = require('url');

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'mc_cid', 'mc_eid',
  '_ga', '_gl', 'ref', 'source', 'trk',
]);

/**
 * Normalizes a URL deterministically:
 * - Resolves relative paths against base URL
 * - Lowercases hostname
 * - Strips default ports (:80, :443)
 * - Normalizes trailing slashes consistently
 * - Strips tracking query parameters (utm_*, fbclid, etc.)
 * - Strips URL fragments (#section)
 */
function normalizeUrl(rawUrl, baseUrl = null) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('data:')) {
    return null;
  }

  try {
    let resolved;
    if (baseUrl) {
      resolved = new URL(trimmed, baseUrl);
    } else {
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      resolved = new URL(withProto);
    }

    // Protocol & hostname normalization
    resolved.protocol = resolved.protocol.toLowerCase();
    resolved.hostname = resolved.hostname.toLowerCase();

    // Strip default ports
    if ((resolved.protocol === 'http:' && resolved.port === '80') || (resolved.protocol === 'https:' && resolved.port === '443')) {
      resolved.port = '';
    }

    // Strip hash fragment
    resolved.hash = '';

    // Strip tracking parameters while preserving functional query parameters
    const cleanParams = new URLSearchParams();
    resolved.searchParams.forEach((val, key) => {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        cleanParams.append(key, val);
      }
    });
    resolved.search = cleanParams.toString() ? `?${cleanParams.toString()}` : '';

    // Normalize path trailing slash (preserve root / but avoid duplicate //)
    let pathname = resolved.pathname.replace(/\/+/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    resolved.pathname = pathname;

    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Determines if a link target is internal or external relative to the origin URL
 */
function classifyLinkRelation(targetUrl, sourceUrl) {
  try {
    const targetObj = new URL(targetUrl);
    const sourceObj = new URL(sourceUrl);

    if (targetObj.hostname === sourceObj.hostname) {
      return 'INTERNAL';
    }

    // Subdomain relation
    const targetDomainParts = targetObj.hostname.split('.');
    const sourceDomainParts = sourceObj.hostname.split('.');
    const targetBaseDomain = targetDomainParts.slice(-2).join('.');
    const sourceBaseDomain = sourceDomainParts.slice(-2).join('.');

    if (targetBaseDomain === sourceBaseDomain) {
      return 'INTERNAL_SUBDOMAIN';
    }

    return 'EXTERNAL';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Extracts root domain from URL (e.g. https://blog.example.com/post -> example.com)
 */
function extractRootDomain(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

module.exports = {
  normalizeUrl,
  classifyLinkRelation,
  extractRootDomain,
};
