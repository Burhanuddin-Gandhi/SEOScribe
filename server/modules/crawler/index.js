const { extractPageKnowledge, extractSiteKnowledge } = require('./engine/crawlController');
const { fetchHttp, detectJsRenderingRequirement } = require('./engine/httpFetcher');
const { renderWithBrowser } = require('./engine/browserRenderer');
const { normalizeUrl, classifyLinkRelation } = require('./normalizers/urlNormalizer');
const { validatePageKnowledge } = require('./validators/schemaValidator');
const { buildSiteLinkGraph } = require('./analytics/siteGraphBuilder');

module.exports = {
  extractPageKnowledge,
  extractSiteKnowledge,
  fetchHttp,
  detectJsRenderingRequirement,
  renderWithBrowser,
  normalizeUrl,
  classifyLinkRelation,
  validatePageKnowledge,
  buildSiteLinkGraph,
};
