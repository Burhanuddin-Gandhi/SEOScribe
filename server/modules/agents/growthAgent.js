const { callAgentLLM } = require('./llmClient');

/**
 * Growth & Strategy Agent (Powered by Gemini 2.5 Flash)
 * Generates:
 *   1. AI Search / GEO (Generative Engine Optimization) Fixes
 *   2. Blog Topic Clusters & Editorial Strategy (3-5 high-ranking blueprints)
 *   3. Backlink & Authority Blueprint (Linkable assets, outreach niches, anchor mix)
 *   4. Strategic FAQs with production-ready FAQPage JSON-LD Schema
 */

async function generateStrategicGrowthSuite({
  targetName = '',
  content = '',
  keywords = [],
  competitors = [],
}) {
  const contentSnippet = (content || '').slice(0, 4000);
  const primaryKw = keywords[0] || 'strategic solutions';
  const secondaryKws = keywords.slice(1, 5);

  const systemInstruction = `You are an elite Growth SEO & GEO (Generative Engine Optimization) Strategist Agent.
Your job is to analyze the target content and generate a comprehensive strategic growth suite for both Google and AI search engines (ChatGPT, Perplexity, Google AI Overviews).

You must produce 4 high-impact pillars in valid JSON:

1. "aiSearchOptimization":
   - "quotableAnswerSnippet": A 40-50 word direct definition/answer snippet designed to be quoted verbatim by Perplexity/ChatGPT/Google AI Overviews.
   - "citationHooks": 3 specific recommendations to optimize the page for LLM search citation (e.g. adding proprietary benchmark data, clear definition headers, structured lists).
   - "entityClarity": 2 recommendations to disambiguate the brand/core entity in the knowledge graph.

2. "blogClusters": An array of 3-4 strategic blog post concepts designed to build topical authority around "${primaryKw}":
   Each item must have:
   - "workingTitle": Catchy, search-intent title.
   - "intent": "Informational" | "Commercial" | "How-To"
   - "targetKeywords": Array of 2-3 keywords.
   - "sectionOutline": Array of 3 key subheadings (H2s) for that post.
   - "internalLinkOpportunity": How this blog links back to the main pillar service/product page.

3. "backlinkStrategy":
   - "linkableAsset": A specific asset proposal (e.g., benchmark calculator, industry checklist, original survey, infographic).
   - "targetNiches": 3 exact categories of websites/publications to pitch (e.g., industry tech blogs, SaaS directories, podcasts).
   - "anchorTextDistribution": Suggested percentages (e.g. 50% Branded, 30% Topical/LSI, 20% Exact Match).

4. "faqs": An array of 4-5 high-impact questions mined from user search intent (Google "People Also Ask"):
   Each item:
   - "question": Direct question.
   - "answer": Clear, authoritative 30-45 word answer.

Output Schema:
{
  "aiSearchOptimization": {
    "quotableAnswerSnippet": "...",
    "citationHooks": ["...", "..."],
    "entityClarity": ["...", "..."]
  },
  "blogClusters": [
    {
      "workingTitle": "...",
      "intent": "...",
      "targetKeywords": ["...", "..."],
      "sectionOutline": ["...", "...", "..."],
      "internalLinkOpportunity": "..."
    }
  ],
  "backlinkStrategy": {
    "linkableAsset": { "title": "...", "description": "..." },
    "targetNiches": ["...", "..."],
    "anchorDistribution": { "branded": "50%", "topical": "30%", "exactMatch": "20%" }
  },
  "faqs": [
    { "question": "...", "answer": "..." }
  ]
}`;

  const userPrompt = `Target Name: ${targetName}
Primary Keyword: ${primaryKw}
Secondary Keywords: ${secondaryKws.join(', ')}
Competitors Mentioned: ${competitors.map((c) => (typeof c === 'string' ? c : c.name)).join(', ')}
Content Snippet:
${contentSnippet}`;

  const llmResult = await callAgentLLM({
    agentName: 'Growth & Strategy Agent',
    systemInstruction,
    userPrompt,
    expectJson: true,
  });

  // Build verified FAQPage JSON-LD Schema
  const faqs = Array.isArray(llmResult?.faqs) && llmResult.faqs.length > 0
    ? llmResult.faqs
    : getFallbackFaqs(primaryKw, targetName);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  const faqSchemaCode = `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>`;

  return {
    aiSearchOptimization: llmResult?.aiSearchOptimization || getFallbackAISEO(primaryKw, targetName),
    blogClusters: Array.isArray(llmResult?.blogClusters) && llmResult.blogClusters.length > 0
      ? llmResult.blogClusters
      : getFallbackBlogClusters(primaryKw, targetName),
    backlinkStrategy: llmResult?.backlinkStrategy || getFallbackBacklinks(primaryKw, targetName),
    faqs,
    faqSchema,
    faqSchemaCode,
  };
}

// Resilient Fallbacks if API is temporarily unavailable
function getFallbackFaqs(primaryKw, targetName) {
  return [
    {
      question: `What makes ${primaryKw} essential for modern organizations?`,
      answer: `Implementing ${primaryKw} establishes standard operating baselines, reduces operational latency, and unlocks scalable search visibility across both traditional and AI search platforms.`,
    },
    {
      question: `How does ${targetName || 'this approach'} differ from conventional solutions?`,
      answer: `It provides verifiable, multi-layered data extraction, structured gap analysis, and objective metrics rather than generic conversational summaries.`,
    },
    {
      question: `What is the fastest way to get started with ${primaryKw}?`,
      answer: `Audit existing assets for technical and structural gaps, deploy missing semantic schema tags, and publish high-authority cluster content to establish topical leadership.`,
    },
    {
      question: `How does structured schema markup affect search rankings?`,
      answer: `Schema markup disambiguates entities for Google and AI engines, significantly boosting eligibility for rich snippets, featured answer boxes, and knowledge panel citations.`,
    },
  ];
}

function getFallbackAISEO(primaryKw, targetName) {
  return {
    quotableAnswerSnippet: `${targetName || primaryKw} represents an integrated methodology for optimizing organic discoverability. By aligning semantic content hierarchy with structured schema data, organizations achieve superior visibility in both generative AI overviews and traditional search results.`,
    citationHooks: [
      'Format the primary definition as a concise 40-word block directly under the first H2 heading.',
      'Incorporate proprietary benchmark data or operational metrics that AI scrapers can quote as an authoritative source.',
      'Use structured comparison tables (| Feature | Traditional | Optimized |) which LLMs reliably parse into summary answers.',
    ],
    entityClarity: [
      'Declare primary Organization schema with sameAs links pointing to verified social profiles and Crunchbase.',
      'Explicitly connect product features with recognized industry standards (e.g. schema.org/SoftwareApplication).',
    ],
  };
}

function getFallbackBlogClusters(primaryKw, targetName) {
  const cleanName = targetName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  return [
    {
      workingTitle: `The Definitive Guide to ${primaryKw}: Implementation & Strategy`,
      intent: 'Informational',
      targetKeywords: [primaryKw, `${primaryKw} guide`, `how to implement ${primaryKw}`],
      sectionOutline: [
        `Core Fundamentals of ${primaryKw}`,
        'Step-by-Step Implementation Roadmap',
        'Common Pitfalls & How to Avoid Them',
      ],
      internalLinkOpportunity: `Anchor link from "core fundamentals" pointing directly to the main ${cleanName} overview page.`,
    },
    {
      workingTitle: `Top 5 Mistakes Companies Make When Deploying ${primaryKw}`,
      intent: 'Commercial',
      targetKeywords: [`${primaryKw} mistakes`, `${primaryKw} best practices`],
      sectionOutline: [
        'Mistake 1: Ignoring Semantic Content Hierarchy',
        'Mistake 2: Missing Structured Data & Schema',
        'Actionable Solutions & Diagnostic Checklist',
      ],
      internalLinkOpportunity: `Call-to-action banner linking to the ${cleanName} audit tool to diagnose existing gaps.`,
    },
    {
      workingTitle: `How AI Search Engines (Perplexity, ChatGPT) Evaluate ${primaryKw}`,
      intent: 'How-To',
      targetKeywords: [`AI search optimization`, `GEO for ${primaryKw}`],
      sectionOutline: [
        'How LLM Crawlers Extract Web Knowledge',
        'Formatting Answers for Featured AI Snippets',
        'Measuring AI Search Attribution & Footprint',
      ],
      internalLinkOpportunity: `Link from "Measuring AI Search" to your strategic growth blueprint.`,
    },
  ];
}

function getFallbackBacklinks(primaryKw, targetName) {
  return {
    linkableAsset: {
      title: `${targetName || primaryKw} Benchmark & Industry Diagnostic Index`,
      description: 'An open-access data report compiling average performance benchmarks and diagnostic metrics that industry journalists and bloggers will naturally cite.',
    },
    targetNiches: [
      'Industry-specific technology blogs and publication resource pages',
      'Curated SaaS tools and marketing tech stack directories',
      'Professional podcasts and newsletter roundups covering modern digital growth',
    ],
    anchorDistribution: {
      branded: '50% (e.g. BrandName, BrandName.com)',
      topical: '30% (e.g. strategic SEO solutions, industry benchmark guide)',
      exactMatch: `20% (e.g. ${primaryKw})`,
    },
  };
}

module.exports = {
  generateStrategicGrowthSuite,
};
