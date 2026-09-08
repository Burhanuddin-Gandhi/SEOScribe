const assert = require('assert');
const { extractMetadata } = require('../extractors/metadataExtractor');
const { extractSocialMetadata } = require('../extractors/socialExtractor');
const { extractHeadingTree } = require('../extractors/headingExtractor');
const { extractContentTree } = require('../extractors/contentTreeExtractor');
const { extractLinks } = require('../extractors/linkExtractor');
const { extractMedia } = require('../extractors/mediaExtractor');
const { extractStructuredData } = require('../extractors/schemaExtractor');
const { extractFaqs } = require('../extractors/faqExtractor');
const { extractTables } = require('../extractors/tableExtractor');
const { extractEntities } = require('../extractors/entityExtractor');
const { segmentPageSections } = require('../extractors/mainContentDetector');
const { computeDerivedMetrics } = require('../analytics/derivedMetrics');
const { buildSiteLinkGraph } = require('../analytics/siteGraphBuilder');
const { assemblePageKnowledgeRecord } = require('../normalizers/dataNormalizer');
const { detectJsRenderingRequirement } = require('../engine/httpFetcher');

const FIXTURES = {
  // 1. Static HTML Website
  staticSite: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Simple Static Page | Acme</title>
      <meta name="description" content="A simple static HTML web page.">
      <link rel="canonical" href="https://example.com/static">
    </head>
    <body>
      <header><nav><a href="/">Home</a> <a href="/about">About</a></nav></header>
      <main>
        <h1>Welcome to Acme</h1>
        <p>We build durable and reliable tools for artisans around the globe.</p>
      </main>
      <footer><p>&copy; 2026 Acme Corp</p></footer>
    </body>
    </html>
  `,

  // 2. React / SPA Shell (requires JS rendering)
  spaSite: `
    <!DOCTYPE html>
    <html>
    <head><title>Loading Next App...</title></head>
    <body>
      <div id="__next"></div>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <script src="/bundle.js"></script>
    </body>
    </html>
  `,

  // 3. E-commerce Page
  ecommerceSite: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Titanium Espresso Machine - Acme Coffee</title>
      <meta name="description" content="Shop the Acme Titanium Espresso Machine with dual boiler.">
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Titanium Espresso Machine",
        "brand": "Acme Coffee",
        "offers": {
          "@type": "Offer",
          "price": "899.00",
          "priceCurrency": "USD"
        }
      }
      </script>
    </head>
    <body>
      <main>
        <h1>Titanium Espresso Machine</h1>
        <p>The ultimate brewing machine for coffee professionals.</p>
        <table>
          <caption>Technical Specifications</caption>
          <thead><tr><th>Feature</th><th>Specification</th></tr></thead>
          <tbody>
            <tr><td>Boiler</td><td>Dual Brass 2.5L</td></tr>
            <tr><td>Weight</td><td>18 kg</td></tr>
          </tbody>
        </table>
      </main>
    </body>
    </html>
  `,

  // 4. Blog / News Article
  blogArticle: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>The Future of Web Crawling in 2026</title>
      <meta name="author" content="Jane Doe">
      <meta property="article:published_time" content="2026-08-15T08:00:00Z">
      <meta property="og:title" content="The Future of Web Crawling">
      <meta property="og:image" content="https://example.com/cover.jpg">
      <meta name="twitter:card" content="summary_large_image">
    </head>
    <body>
      <article>
        <h1>The Future of Web Crawling</h1>
        <h2>1. Deterministic Extraction</h2>
        <p>Extracting data without hallucination is paramount for downstream AI systems.</p>
        <h3>Streamlined Parsers</h3>
        <p>Modern stream parsers process gigabytes in milliseconds.</p>
      </article>
    </body>
    </html>
  `,

  // 5. Documentation Page
  docsPage: `
    <!DOCTYPE html>
    <html>
    <body>
      <main>
        <h1>SDK Installation Guide</h1>
        <p>Follow these simple steps:</p>
        <ol>
          <li>Run npm install</li>
          <li>Set your API key</li>
        </ol>
        <pre><code>npm install @seoscribe/core</code></pre>
      </main>
    </body>
    </html>
  `,

  // 6. Rich JSON-LD & FAQ Page
  faqPage: `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frequently Asked Questions</title>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the scraper work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "It uses a 3-tier hybrid pipeline with deterministic AST parsers."
            }
          }
        ]
      }
      </script>
    </head>
    <body>
      <main>
        <h1>Frequently Asked Questions</h1>
        <details>
          <summary>Is JavaScript rendering supported?</summary>
          <p>Yes, through automated Playwright headless browser escalation.</p>
        </details>
      </main>
    </body>
    </html>
  `,

  // 7. Poor / Broken HTML Structure (Skipped levels, multiple H1s)
  brokenHtml: `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>Main Headline 1</h1>
      <h1>Duplicate Main Headline 2</h1>
      <h4>Skipped Heading Level 4</h4>
      <p>Content under skipped level.</p>
      <img src="/logo.png">
    </body>
    </html>
  `,

  // 8. Missing Metadata
  missingMetadata: `
    <!DOCTYPE html>
    <html>
    <body>
      <p>Body without title or description meta tags.</p>
    </body>
    </html>
  `,

  // 9. Structured Tables (Pricing Table)
  pricingTablePage: `
    <!DOCTYPE html>
    <html>
    <body>
      <main>
        <h1>Pricing Plans</h1>
        <table>
          <thead><tr><th>Tier</th><th>Price</th><th>Features</th></tr></thead>
          <tbody>
            <tr><td>Starter</td><td>$29/mo</td><td>10,000 Pages</td></tr>
            <tr><td>Enterprise</td><td>$199/mo</td><td>Unlimited</td></tr>
          </tbody>
        </table>
      </main>
    </body>
    </html>
  `,
};

function runTests() {
  console.log('🧪 Starting Website Intelligence & Extraction Layer Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // Test 1: Static Site Metadata & Heading Tree
  test('1. Static Site: Extracts metadata, canonical, and document tree', () => {
    const meta = extractMetadata(FIXTURES.staticSite, 'https://example.com/static');
    assert.strictEqual(meta.title.raw, 'Simple Static Page | Acme');
    assert.strictEqual(meta.canonical.resolved, 'https://example.com/static');

    const headings = extractHeadingTree(FIXTURES.staticSite);
    assert.strictEqual(headings.counts.h1, 1);
    assert.strictEqual(headings.tree[0].text, 'Welcome to Acme');
  });

  // Test 2: React / SPA JS Rendering Requirement Detection
  test('2. React / SPA: Detects SPA mount container & noscript warning', () => {
    const jsCheck = detectJsRenderingRequirement(FIXTURES.spaSite, 200);
    assert.strictEqual(jsCheck.requiresRendering, true);
    assert.ok(jsCheck.reason.includes('SPA') || jsCheck.reason.includes('noscript'));
  });

  // Test 3: E-commerce Product Schema & Table Extraction
  test('3. E-commerce: Extracts JSON-LD Product & Specification Table', () => {
    const schema = extractStructuredData(FIXTURES.ecommerceSite);
    assert.strictEqual(schema.normalized_entities[0].type, 'Product');
    assert.strictEqual(schema.normalized_entities[0].name, 'Titanium Espresso Machine');

    const tables = extractTables(FIXTURES.ecommerceSite);
    assert.strictEqual(tables.total_tables, 1);
    assert.strictEqual(tables.tables[0].table_type, 'SPECIFICATION_TABLE');
  });

  // Test 4: Blog Article OpenGraph, Twitter Cards & Deep Headings
  test('4. Blog Article: Extracts Social OpenGraph, Twitter and Hierarchy', () => {
    const social = extractSocialMetadata(FIXTURES.blogArticle, 'https://example.com/blog/future');
    assert.strictEqual(social.open_graph.title, 'The Future of Web Crawling');
    assert.strictEqual(social.twitter.card, 'summary_large_image');

    const headings = extractHeadingTree(FIXTURES.blogArticle);
    assert.strictEqual(headings.counts.h1, 1);
    assert.strictEqual(headings.counts.h2, 1);
    assert.strictEqual(headings.counts.h3, 1);
    assert.strictEqual(headings.tree[0].children[0].text, '1. Deterministic Extraction');
  });

  // Test 5: Documentation Code Blocks and Lists
  test('5. Documentation: Preserves ordered lists and code blocks in DOM order', () => {
    const content = extractContentTree(FIXTURES.docsPage);
    const listBlock = content.blocks.find((b) => b.element_type === 'list');
    const codeBlock = content.blocks.find((b) => b.element_type === 'code_block');

    assert.ok(listBlock);
    assert.strictEqual(listBlock.item_count, 2);
    assert.ok(codeBlock);
    assert.strictEqual(codeBlock.text, 'npm install @seoscribe/core');
  });

  // Test 6: FAQ Extraction from JSON-LD and HTML5 Details
  test('6. FAQ: Extracts Schema FAQPage and <details>/<summary> questions', () => {
    const schema = extractStructuredData(FIXTURES.faqPage);
    const faqs = extractFaqs(FIXTURES.faqPage, 'https://example.com/faq', schema);
    assert.strictEqual(faqs.total_questions, 2);
    assert.ok(faqs.questions.some((q) => q.question === 'How does the scraper work?'));
    assert.ok(faqs.questions.some((q) => q.question === 'Is JavaScript rendering supported?'));
  });

  // Test 7: Broken HTML & Anomaly Detection
  test('7. Broken HTML: Flags multiple H1s, skipped levels, and missing alt', () => {
    const headings = extractHeadingTree(FIXTURES.brokenHtml);
    assert.strictEqual(headings.derived_signals.multiple_h1s, true);
    assert.strictEqual(headings.derived_signals.skipped_levels.length, 1);

    const media = extractMedia(FIXTURES.brokenHtml, 'https://example.com');
    assert.strictEqual(media.counts.missing_alt, 1);
  });

  // Test 8: Missing Metadata Detection
  test('8. Missing Metadata: Flags missing title and description', () => {
    const meta = extractMetadata(FIXTURES.missingMetadata, 'https://example.com');
    assert.strictEqual(meta.title.is_missing, true);
    assert.strictEqual(meta.meta_description.is_missing, true);
  });

  // Test 9: Pricing Table Structural Classification
  test('9. Pricing Tables: Preserves cells and classifies as PRICING_TABLE', () => {
    const tables = extractTables(FIXTURES.pricingTablePage);
    assert.strictEqual(tables.tables[0].table_type, 'PRICING_TABLE');
    assert.strictEqual(tables.tables[0].rows_count, 2);
    assert.strictEqual(tables.tables[0].rows[0][0], 'Starter');
  });

  // Test 10: Site Architecture Link Graph Builder
  test('10. Link Graph: Generates directional nodes, edges and in-degree maps', () => {
    const samplePages = [
      {
        page_id: 'pg_1',
        url: 'https://example.com/',
        links: {
          internal: [
            { normalized_url: 'https://example.com/about', anchor_text: 'About' },
            { normalized_url: 'https://example.com/pricing', anchor_text: 'Pricing' },
          ],
        },
      },
      {
        page_id: 'pg_2',
        url: 'https://example.com/about',
        links: { internal: [{ normalized_url: 'https://example.com/pricing', anchor_text: 'Pricing' }] },
      },
      {
        page_id: 'pg_3',
        url: 'https://example.com/pricing',
        links: { internal: [] },
      },
    ];

    const graph = buildSiteLinkGraph(samplePages);
    assert.strictEqual(graph.total_nodes, 3);
    assert.strictEqual(graph.total_edges, 3);
    assert.strictEqual(graph.link_distribution.in_degree['https://example.com/pricing'], 2);
  });

  console.log(`\n🏁 Test Suite Results: ${passed} / ${total} tests passed.\n`);
  return passed === total;
}

if (require.main === module) {
  const allPassed = runTests();
  process.exit(allPassed ? 0 : 1);
}

module.exports = { runTests };
