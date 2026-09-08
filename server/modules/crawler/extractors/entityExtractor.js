/**
 * Deterministic & Verified Entity Extractor
 * Extracts verified entities directly from structured data and explicit DOM cues.
 */
function extractEntities(html, structuredData = null, metadata = null) {
  const verifiedEntities = [];
  const inferredEntities = [];
  const seenKeys = new Set();

  function addEntity(entity, isVerified = true) {
    const key = `${entity.type}:${entity.name}`.toLowerCase();
    if (!seenKeys.has(key) && entity.name && entity.name.length >= 2) {
      seenKeys.add(key);
      if (isVerified) {
        verifiedEntities.push({ ...entity, confidence: 1.0, is_inferred: false });
      } else {
        inferredEntities.push({ ...entity, confidence: entity.confidence || 0.75, is_inferred: true });
      }
    }
  }

  // 1. Extract from Schema.org Structured Data (Highest Confidence 1.0)
  if (structuredData?.normalized_entities) {
    structuredData.normalized_entities.forEach((item) => {
      const p = item.properties || {};

      if (['Organization', 'Corporation', 'LocalBusiness'].includes(item.type)) {
        addEntity({
          name: p.name || p.legalName,
          type: 'Organization',
          source: 'SCHEMA_ORGANIZATION',
          url: p.url || null,
        });
      }

      if (['Person'].includes(item.type)) {
        addEntity({
          name: p.name,
          type: 'Person',
          source: 'SCHEMA_PERSON',
          job_title: p.jobTitle || null,
        });
      }

      if (['Product'].includes(item.type)) {
        addEntity({
          name: p.name,
          type: 'Product',
          source: 'SCHEMA_PRODUCT',
          brand: typeof p.brand === 'object' ? p.brand?.name : p.brand || null,
          price: p.offers?.price || null,
        });
      }

      if (['Brand'].includes(item.type)) {
        addEntity({
          name: p.name,
          type: 'Brand',
          source: 'SCHEMA_BRAND',
        });
      }

      if (['Place', 'PostalAddress', 'GeoCoordinates'].includes(item.type)) {
        addEntity({
          name: p.name || p.addressLocality || p.streetAddress,
          type: 'Location',
          source: 'SCHEMA_LOCATION',
        });
      }
    });
  }

  // 2. Extract Author & Publisher from Metadata
  if (metadata?.author) {
    addEntity({
      name: metadata.author,
      type: 'Person',
      source: 'HTML_META_AUTHOR',
    });
  }

  if (metadata?.publisher) {
    addEntity({
      name: metadata.publisher,
      type: 'Organization',
      source: 'HTML_META_PUBLISHER',
    });
  }

  return {
    verified_entities: verifiedEntities,
    inferred_entities: inferredEntities,
    total_entities: verifiedEntities.length + inferredEntities.length,
  };
}

module.exports = {
  extractEntities,
};
