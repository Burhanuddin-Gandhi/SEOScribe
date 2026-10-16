const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Heavy Endpoints Rate Limiter (For URL Scraping & PDF Extraction)
 * Restricts single IP from draining AI tokens or cloud scraping credits.
 */
const heavySeoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Generous limit for demos & development
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many analysis requests from this IP. Please wait 15 minutes before analyzing more pages or documents.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req) => {
    // If a trusted admin/demo bypass token is passed in header
    const bypassToken = req.headers['x-admin-bypass-key'];
    return bypassToken && process.env.ADMIN_BYPASS_KEY && bypassToken === process.env.ADMIN_BYPASS_KEY;
  },
});

/**
 * General API Limiter (For health checks and general routes)
 */
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Client Verification Guard (Optional header check)
 * Verifies that requests are originating from the SEOScribe web application.
 */
function verifyClientHeader(req, res, next) {
  // Can be enforced strictly via REQUIRE_CLIENT_TOKEN=true in production .env
  if (process.env.REQUIRE_CLIENT_TOKEN === 'true') {
    const clientToken = req.headers['x-seoscribe-client-token'];
    const expectedToken = process.env.CLIENT_ACCESS_TOKEN || 'seoscribe-web-client-v1';

    if (!clientToken || clientToken !== expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Invalid or missing client authentication header.',
        code: 'FORBIDDEN_CLIENT',
      });
    }
  }
  next();
}

/**
 * Strict SSRF (Server-Side Request Forgery) URL Validator
 * Blocks access to cloud metadata, local network IPs, loopbacks, and non-HTTP protocols.
 */
function isSafePublicUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  let formattedUrl = urlString.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const parsed = new URL(formattedUrl);

    // Protocol guard
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are allowed.',
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Loopback & local names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal'
    ) {
      return {
        valid: false,
        error: 'Access to local or internal hostnames is prohibited.',
      };
    }

    // IP validation (IPv4 SSRF patterns)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);

    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 127.0.0.0/8 (Loopback)
      if (octet1 === 127) {
        return { valid: false, error: 'Access to loopback IP addresses is prohibited.' };
      }
      // 0.0.0.0/8 (Current network)
      if (octet1 === 0) {
        return { valid: false, error: 'Access to 0.0.0.0 is prohibited.' };
      }
      // 10.0.0.0/8 (Private network)
      if (octet1 === 10) {
        return { valid: false, error: 'Access to private network IP addresses is prohibited.' };
      }
      // 172.16.0.0/12 (Private network: 172.16.x.x - 172.31.x.x)
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return { valid: false, error: 'Access to private network IP addresses is prohibited.' };
      }
      // 192.168.0.0/16 (Private network)
      if (octet1 === 192 && octet2 === 168) {
        return { valid: false, error: 'Access to private network IP addresses is prohibited.' };
      }
      // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata)
      if (octet1 === 169 && octet2 === 254) {
        return { valid: false, error: 'Access to cloud metadata IP addresses is prohibited.' };
      }
    }

    // IPv6 loopback & private checks
    if (
      hostname === '::1' ||
      hostname.startsWith('[::1]') ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fd00:')
    ) {
      return {
        valid: false,
        error: 'Access to private IPv6 addresses is prohibited.',
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch (err) {
    return {
      valid: false,
      error: 'Invalid URL format. Example: example.com or https://example.com',
    };
  }
}

/**
 * Validate PDF Magic Bytes (%PDF-)
 * Ensures uploaded buffer is genuinely a PDF and not a renamed malicious payload.
 */
function validatePdfMagicBytes(buffer) {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  // Standard PDF files start with %PDF- (hex: 25 50 44 46 2d)
  const header = buffer.slice(0, 5).toString('ascii');
  return header.startsWith('%PDF');
}

module.exports = {
  helmetConfig: helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  heavySeoLimiter,
  generalApiLimiter,
  verifyClientHeader,
  isSafePublicUrl,
  validatePdfMagicBytes,
};
