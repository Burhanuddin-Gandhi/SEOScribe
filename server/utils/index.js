/**
 * Backward compatibility re-export barrel for server modules
 */
const documents = require('../modules/documents/pdfParserRouter');
const seo = require('../modules/seo/seoAnalyzer');
const auditLog = require('../modules/seo/auditLog');
const analysisHistory = require('../modules/seo/analysisHistory');
const crawler = require('../modules/crawler/htmlExtractor');
const playwright = require('../modules/crawler/playwrightRenderer');

module.exports = {
  ...documents,
  ...seo,
  ...auditLog,
  ...analysisHistory,
  ...crawler,
  ...playwright,
};
