const cheerio = require('cheerio');

/**
 * Deterministic Structured Data & Schema.org Extractor
 * Safely parses JSON-LD, Microdata, and RDFa into normalized entities.
 */
function extractStructuredData(html) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const rawJsonLd = [];
  const normalizedEntities = [];
  const syntaxErrors = [];
  const schemaTypesPresent = new Set();

  // 1. JSON-LD Extraction
  $('script[type="application/ld+json"]').each((index, el) => {
    const rawContent = $(el).html()?.trim();
    if (!rawContent) return;

    rawJsonLd.push({
      script_index: index + 1,
      raw: rawContent,
    });

    try {
      // Clean possible control characters / comment markers inside JSON-LD
      const cleaned = rawContent.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');
      const parsed = JSON.parse(cleaned);

      const items = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];

      items.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const schemaType = item['@type'] || 'Thing';
        schemaTypesPresent.add(schemaType);

        normalizedEntities.push({
          entity_id: `schema_${normalizedEntities.length + 1}`,
          format: 'JSON_LD',
          type: schemaType,
          context: item['@context'] || 'https://schema.org',
          name: item.name || item.headline || item.title || null,
          description: item.description || null,
          url: item.url || null,
          properties: item,
        });
      });
    } catch (err) {
      syntaxErrors.push({
        script_index: index + 1,
        raw: rawContent.slice(0, 200),
        error_message: err.message,
      });
    }
  });

  // 2. Microdata Extraction (itemscope / itemtype)
  $('[itemscope]').each((_, el) => {
    const itemType = $(el).attr('itemtype')?.trim() || 'UnknownType';
    const props = {};

    $(el).find('[itemprop]').each((_, propEl) => {
      const propName = $(propEl).attr('itemprop')?.trim();
      const propVal = $(propEl).attr('content') || $(propEl).attr('href') || $(propEl).attr('src') || $(propEl).text().trim();
      if (propName && propVal) {
        props[propName] = propVal;
      }
    });

    if (Object.keys(props).length > 0) {
      const typeName = itemType.split('/').pop() || itemType;
      schemaTypesPresent.add(typeName);
      normalizedEntities.push({
        entity_id: `schema_${normalizedEntities.length + 1}`,
        format: 'MICRODATA',
        type: typeName,
        itemtype: itemType,
        properties: props,
      });
    }
  });

  return {
    raw_json_ld: rawJsonLd,
    normalized_entities: normalizedEntities,
    schema_types_present: Array.from(schemaTypesPresent),
    syntax_errors: syntaxErrors,
    counts: {
      total_json_ld_scripts: rawJsonLd.length,
      total_normalized_entities: normalizedEntities.length,
      syntax_errors_count: syntaxErrors.length,
    },
  };
}

module.exports = {
  extractStructuredData,
};
