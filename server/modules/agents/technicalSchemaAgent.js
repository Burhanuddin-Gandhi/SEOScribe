/**
 * Technical & Schema Agent
 * Generates verified JSON-LD structured data and meta tags.
 */

function generateSchema({ type = 'Article', url, title, description, keywords = [], author = 'SEOScribe' }) {
  const cleanUrl = url || 'https://example.com';
  const cleanTitle = title || 'Document Overview';
  const cleanDesc = description || 'In-depth overview and analysis.';
  const kwList = Array.isArray(keywords) ? keywords.slice(0, 8).join(', ') : '';

  let schemaObj = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: cleanTitle,
    description: cleanDesc,
    url: cleanUrl,
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: author,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': cleanUrl,
    },
  };

  if (kwList) {
    schemaObj.keywords = kwList;
  }

  return {
    type,
    json: schemaObj,
    htmlSnippet: `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`,
  };
}

module.exports = {
  generateSchema,
};
