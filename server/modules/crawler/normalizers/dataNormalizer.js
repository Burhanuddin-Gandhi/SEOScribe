const crypto = require('crypto');
const { validatePageKnowledge } = require('../validators/schemaValidator');

/**
 * Generates a stable deterministic page ID from URL
 */
function generatePageId(url) {
  return 'pg_' + crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
}

/**
 * Assembles unified PageKnowledgeRecord data contract
 */
function assemblePageKnowledgeRecord({
  url,
  httpMetadata,
  metadata,
  social,
  mainContent,
  contentTree,
  headings,
  links,
  media,
  structuredData,
  faqs,
  tables,
  entities,
  derivedMetrics,
}) {
  const pageId = generatePageId(url);

  const record = {
    page_id: pageId,
    url: url,
    provenance: {
      extraction_method: httpMetadata.extraction_method || 'HTTP',
      extraction_tier: httpMetadata.extraction_tier || 'TIER_1_HTTP',
      crawled_at: httpMetadata.extraction_timestamp || new Date().toISOString(),
    },
    technical: httpMetadata,
    metadata: metadata,
    open_graph: social?.open_graph || {},
    twitter: social?.twitter || {},
    content: {
      detection: {
        method: mainContent?.detection_method,
        is_ambiguous: mainContent?.is_ambiguous,
        main_content_ratio: mainContent?.main_content_ratio,
      },
      blocks: contentTree?.blocks || [],
      sections: mainContent?.sections || {},
    },
    headings: headings,
    links: {
      internal: links?.internal_links || [],
      external: links?.external_links || [],
      counts: links?.counts || {},
    },
    images: {
      items: media?.images || [],
      videos: media?.videos || [],
      counts: media?.counts || {},
    },
    tables: tables?.tables || [],
    structured_data: structuredData,
    questions: faqs?.questions || [],
    entities: entities,
    claims: [], // Available for future factual claim verification agents
    derived_metrics: derivedMetrics,
  };

  record.validation = validatePageKnowledge(record);
  return record;
}

module.exports = {
  generatePageId,
  assemblePageKnowledgeRecord,
};
