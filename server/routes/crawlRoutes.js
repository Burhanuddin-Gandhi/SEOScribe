const express = require('express');
const router = express.Router();
const { extractPageKnowledge, extractSiteKnowledge } = require('../modules/crawler');

/**
 * POST /api/crawl/page-intelligence
 * Converts a URL into a structured website knowledge dataset without subjective SEO scoring.
 */
router.post('/page-intelligence', async (req, res) => {
  const { url, forceBrowser, timeoutMs } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Valid website URL is required',
    });
  }

  try {
    const pageKnowledge = await extractPageKnowledge(url, {
      forceBrowser: Boolean(forceBrowser),
      timeoutMs: timeoutMs || 15000,
    });

    return res.json({
      success: true,
      data: pageKnowledge,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/crawl/site-intelligence
 * Multi-page crawl producing normalized site-wide architecture, link graph, and page records.
 */
router.post('/site-intelligence', async (req, res) => {
  const { url, maxPages, forceBrowser, timeoutMs } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Valid website URL is required',
    });
  }

  try {
    const siteKnowledge = await extractSiteKnowledge(url, {
      maxPages: Math.min(parseInt(maxPages, 10) || 5, 20),
      forceBrowser: Boolean(forceBrowser),
      timeoutMs: timeoutMs || 15000,
    });

    return res.json({
      success: true,
      data: siteKnowledge,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
