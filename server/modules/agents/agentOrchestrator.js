const { auditExistingSite } = require('./auditorAgent');
const { analyzeCompetitors } = require('./competitorAgent');
const { generateSurgicalFixes, generateFullSEOPackage } = require('./copywriterAgent');
const { generateSchema } = require('./technicalSchemaAgent');
const { generateStrategicGrowthSuite } = require('./growthAgent');

/**
 * Multi-Agent System Orchestrator
 * Coordinates specialized agents across:
 *   1. Existing Site Surgical Remediation (URL Mode)
 *   2. Full 0-to-1 Content Creation (PDF / New Site Mode)
 */

async function orchestrateUrlRemediation({
  url,
  signals = {},
  content = '',
  competitors = [],
  keywords = [],
}) {
  console.log(`[Agent Orchestrator] Running Surgical Remediation for: ${url}`);

  // 1. Auditor Agent scans what exists vs. what is missing
  const audit = auditExistingSite(signals, url, content);

  // 2. Competitor Agent evaluates competitors via LLM reasoning (zero extra scraping credits)
  const compIntel = await analyzeCompetitors(competitors, keywords);

  // 3. Copywriter Agent generates ONLY what was flagged as missing or broken
  const surgicalFixes = await generateSurgicalFixes({
    missing: audit.missing,
    existingSignals: signals,
    url,
    keywords,
    content,
  });

  // 4. Technical Agent generates Schema if missing
  const needsSchema = audit.missing.some((m) => m.element === 'schema');
  let schemaFix = null;
  if (needsSchema) {
    const pageTitle = surgicalFixes.title?.value || signals.title || url;
    const pageDesc = surgicalFixes.metaDescription?.value || signals.metaDescription || '';
    schemaFix = generateSchema({
      type: 'WebPage',
      url,
      title: pageTitle,
      description: pageDesc,
      keywords,
    });
    surgicalFixes.schema = {
      element: 'schema',
      label: 'Generated JSON-LD Structured Data',
      type: 'WebPage',
      json: schemaFix.json,
      codeSnippet: schemaFix.htmlSnippet,
      explanation: 'Generated valid WebPage structured data to make the page eligible for Google rich results.',
    };
  }

  // 5. Generate One-Click Head Snippet containing ONLY the missing tags
  const snippetParts = ['<!-- SEOScribe Surgical Fixes (Missing Tags Only) -->'];
  if (surgicalFixes.title) snippetParts.push(surgicalFixes.title.codeSnippet);
  if (surgicalFixes.metaDescription) snippetParts.push(surgicalFixes.metaDescription.codeSnippet);
  if (surgicalFixes.canonical) snippetParts.push(surgicalFixes.canonical.codeSnippet);
  if (surgicalFixes.schema) snippetParts.push(surgicalFixes.schema.codeSnippet);
  const targetedHtmlSnippet = snippetParts.length > 1 ? snippetParts.join('\n') : null;

  // 6. Growth Agent generates AI Search (GEO) fixes, Blog clusters, Backlinks & FAQs
  const strategicGrowth = await generateStrategicGrowthSuite({
    targetName: url,
    content,
    keywords,
    competitors,
  });

  return {
    mode: 'surgical_remediation',
    url,
    auditorReport: {
      preservedCount: audit.preserved.length,
      missingCount: audit.missing.length,
      preservedAssets: audit.preserved,
      missingGaps: audit.missing,
    },
    generatedFixes: surgicalFixes,
    targetedHtmlSnippet,
    competitorIntelligence: compIntel,
    strategicGrowth,
  };
}

async function orchestratePdfCreation({
  targetName = '',
  content = '',
  metadata = {},
  competitors = [],
  keywords = [],
  pageCount = 1,
  wordCount = 0,
}) {
  console.log(`[Agent Orchestrator] Running Full 0-to-1 SEO Creation for: ${targetName}`);

  // 1. Competitor Agent extracts competitor insights
  const compIntel = await analyzeCompetitors(competitors, keywords);

  // 2. Copywriter Agent generates full suite of options from scratch
  const copywritingSuite = await generateFullSEOPackage({
    targetName,
    keywords,
    content,
  });

  // 3. Technical Agent generates full Article/Report JSON-LD Schema
  const schemaResult = generateSchema({
    type: 'Article',
    url: `https://example.com/${copywritingSuite.suggestedSlug}`,
    title: copywritingSuite.titleOptions[0]?.text || targetName,
    description: copywritingSuite.descriptionOptions[0]?.text || '',
    keywords,
    author: metadata.author || 'SEOScribe',
  });

  // 4. One-Click Complete Head Snippet
  const primaryTitle = copywritingSuite.titleOptions[0]?.text || targetName;
  const primaryDesc = copywritingSuite.descriptionOptions[0]?.text || '';
  const pageUrl = `https://example.com/${copywritingSuite.suggestedSlug}`;

  const fullHtmlSnippet = `<!-- SEOScribe Pre-Publishing SEO Kit -->
<title>${primaryTitle}</title>
<meta name="description" content="${primaryDesc}" />
<link rel="canonical" href="${pageUrl}" />

<!-- OpenGraph Social Tags -->
<meta property="og:type" content="article" />
<meta property="og:title" content="${primaryTitle}" />
<meta property="og:description" content="${primaryDesc}" />
<meta property="og:url" content="${pageUrl}" />
<meta name="twitter:card" content="summary_large_image" />

<!-- Structured Data (JSON-LD) -->
${schemaResult.htmlSnippet}`;

  // 5. Growth Agent generates AI Search (GEO) fixes, Blog clusters, Backlinks & FAQs
  const strategicGrowth = await generateStrategicGrowthSuite({
    targetName,
    content,
    keywords,
    competitors,
  });

  // 6. Content Publishing Roadmap & Gaps
  const publishingRoadmap = {
    recommendedWordCount: Math.max(1200, wordCount > 0 ? Math.round(wordCount * 0.8) : 1500),
    estimatedReadTimeMinutes: Math.max(3, Math.round((wordCount || 1000) / 200)),
    suggestedFaqs: strategicGrowth.faqs,
  };

  return {
    mode: 'full_creation',
    documentMeta: {
      targetName,
      pageCount,
      wordCount,
      analyzedAt: new Date().toISOString(),
    },
    generatedKit: {
      titleOptions: copywritingSuite.titleOptions,
      descriptionOptions: copywritingSuite.descriptionOptions,
      suggestedSlug: copywritingSuite.suggestedSlug,
      headingOutline: copywritingSuite.headingOutline,
      schema: schemaResult,
      fullHtmlSnippet,
      primaryKeyword: copywritingSuite.primaryKeyword,
      secondaryKeywords: copywritingSuite.secondaryKeywords,
    },
    competitorIntelligence: compIntel,
    publishingRoadmap,
    strategicGrowth,
  };
}

module.exports = {
  orchestrateUrlRemediation,
  orchestratePdfCreation,
};
