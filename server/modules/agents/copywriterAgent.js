const { callAgentLLM } = require('./llmClient');

/**
 * Copywriter Agent (Powered by Gemini LLM)
 * Specializes in search intent copywriting, high-CTR meta titles, descriptions, and semantic heading outlines.
 */

async function generateSurgicalFixesWithLLM({ missing = [], existingSignals = {}, url = '', keywords = [], content = '' }) {
  const missingKeys = missing.map((m) => m.element);
  const contentSnippet = (content || '').slice(0, 3000);

  const systemInstruction = `You are an elite SEO Copywriter Agent.
Your job is SURGICAL REMEDIATION for an existing website (${url}).
Do NOT touch or rewrite elements that are already working.
Generate ONLY the missing elements requested: [${missingKeys.join(', ')}].

Rules:
1. If "metaDescription" is requested: Write a compelling, click-worthy meta description strictly between 140 and 158 characters. Include target keywords naturally.
2. If "title" is requested: Write an authoritative title tag strictly under 60 characters.
3. If "h1" is requested: Write a singular, clear, high-intent H1 heading for the page.
4. If "canonical" is requested: Return the canonical link tag using the clean URL.

Output schema:
{
  "title": { "value": "...", "explanation": "..." },
  "metaDescription": { "value": "...", "explanation": "..." },
  "h1": { "value": "...", "explanation": "..." },
  "canonical": { "value": "...", "explanation": "..." }
}
Only include keys for elements that are in [${missingKeys.join(', ')}].`;

  const userPrompt = `Target URL: ${url}
Existing Title: ${existingSignals.title || 'None'}
Existing Meta Description: ${existingSignals.metaDescription || 'None'}
Existing H1: ${existingSignals.h1Texts?.join(' | ') || 'None'}
Target Keywords: ${keywords.slice(0, 5).join(', ')}
Page Content Snippet:
${contentSnippet}`;

  const llmResult = await callAgentLLM({
    agentName: 'SEO Copywriter Agent (Surgical)',
    systemInstruction,
    userPrompt,
    expectJson: true,
  });

  const fixes = {};

  if (llmResult && typeof llmResult === 'object') {
    if (missingKeys.includes('title') && llmResult.title?.value) {
      const val = llmResult.title.value.trim();
      fixes.title = {
        element: 'title',
        label: 'Optimized Meta Title',
        value: val,
        length: val.length,
        explanation: llmResult.title.explanation || 'Crafted by Copywriter Agent to maximize SERP CTR.',
        codeSnippet: `<title>${val}</title>`,
      };
    }

    if (missingKeys.includes('metaDescription') && llmResult.metaDescription?.value) {
      const val = llmResult.metaDescription.value.trim();
      fixes.metaDescription = {
        element: 'metaDescription',
        label: 'Optimized Meta Description',
        value: val,
        length: val.length,
        explanation: llmResult.metaDescription.explanation || 'Crafted by Copywriter Agent within Google character limit.',
        codeSnippet: `<meta name="description" content="${val}" />`,
      };
    }

    if (missingKeys.includes('h1') && llmResult.h1?.value) {
      const val = llmResult.h1.value.trim();
      fixes.h1 = {
        element: 'h1',
        label: 'Corrected Primary H1',
        value: val,
        explanation: llmResult.h1.explanation || 'Single primary H1 established by Copywriter Agent.',
        codeSnippet: `<h1>${val}</h1>`,
      };
    }

    if (missingKeys.includes('canonical')) {
      fixes.canonical = {
        element: 'canonical',
        label: 'Canonical Tag',
        value: url,
        explanation: 'Self-referential canonical link tag to consolidate page signals.',
        codeSnippet: `<link rel="canonical" href="${url}" />`,
      };
    }
  }

  // Fallback for any missing items that LLM didn't return
  missing.forEach((item) => {
    if (item.element === 'metaDescription' && !fixes.metaDescription) {
      const fallbackDesc = `Discover key insights on ${keywords[0] || 'industry solutions'} from ${url.replace(/^https?:\/\//, '').split('/')[0]}. Read the full analysis.`;
      fixes.metaDescription = {
        element: 'metaDescription',
        label: 'Optimized Meta Description',
        value: fallbackDesc,
        length: fallbackDesc.length,
        explanation: 'Synthesized meta description targeting core topic.',
        codeSnippet: `<meta name="description" content="${fallbackDesc}" />`,
      };
    }
    if (item.element === 'title' && !fixes.title) {
      const fallbackTitle = `${existingSignals.title || 'Official Portal'} | ${keywords[0] || 'Guide'}`.slice(0, 60);
      fixes.title = {
        element: 'title',
        label: 'Optimized Meta Title',
        value: fallbackTitle,
        length: fallbackTitle.length,
        explanation: 'Optimized title to fit within Google SERP boundaries.',
        codeSnippet: `<title>${fallbackTitle}</title>`,
      };
    }
    if (item.element === 'h1' && !fixes.h1) {
      const fallbackH1 = existingSignals.h1Texts?.[0] || existingSignals.title || 'Overview & Implementation';
      fixes.h1 = {
        element: 'h1',
        label: 'Corrected Primary H1',
        value: fallbackH1,
        explanation: 'Consolidated primary H1 heading.',
        codeSnippet: `<h1>${fallbackH1}</h1>`,
      };
    }
    if (item.element === 'canonical' && !fixes.canonical) {
      fixes.canonical = {
        element: 'canonical',
        label: 'Canonical Tag',
        value: url,
        explanation: 'Self-referential canonical tag.',
        codeSnippet: `<link rel="canonical" href="${url}" />`,
      };
    }
    if (item.element === 'imageAlt') {
      fixes.imageAlt = {
        element: 'imageAlt',
        label: 'Image Alt Attributes',
        count: item.count,
        explanation: `${item.count} images missing alt text. Assign descriptive, keyword-relevant alt attributes.`,
      };
    }
  });

  return fixes;
}

async function generateFullSEOPackageWithLLM({ targetName = '', keywords = [], content = '' }) {
  const contentSnippet = (content || '').slice(0, 4000);

  const systemInstruction = `You are an elite SEO Copywriter Agent.
Your job is FULL 0-TO-1 CREATION for an unpublished document/PDF (${targetName}).
Analyze the provided content and craft a complete, agency-grade SEO package designed to rank on Google.

Rules:
1. titleOptions: Provide 3 distinct title angles:
   - "High-CTR / Direct Search" (Strictly 50-60 chars)
   - "Executive / Authority" (Strictly 50-60 chars)
   - "Benefit-Driven" (Strictly 50-60 chars)
2. descriptionOptions: Provide 2 compelling descriptions:
   - "Overview & Actionable" (Strictly 145-158 chars)
   - "Problem / Solution" (Strictly 145-158 chars)
3. suggestedSlug: Short, lowercase hyphenated URL slug (under 50 chars).
4. headingOutline: An array of 6-8 semantic headings reflecting the real topics in the text:
   [ { "level": "H1", "text": "..." }, { "level": "H2", "text": "..." }, { "level": "H3", "text": "..." } ]

Output schema:
{
  "titleOptions": [ { "label": "...", "text": "..." } ],
  "descriptionOptions": [ { "label": "...", "text": "..." } ],
  "suggestedSlug": "...",
  "headingOutline": [ { "level": "H1|H2|H3", "text": "..." } ]
}`;

  const userPrompt = `Document Name: ${targetName}
Key Topics & Keywords: ${keywords.slice(0, 8).join(', ')}
Document Content Snippet:
${contentSnippet}`;

  const llmResult = await callAgentLLM({
    agentName: 'SEO Copywriter Agent (Creation)',
    systemInstruction,
    userPrompt,
    expectJson: true,
  });

  if (llmResult && Array.isArray(llmResult.titleOptions) && Array.isArray(llmResult.descriptionOptions)) {
    const titleOptions = llmResult.titleOptions.map((t) => {
      const txt = (t.text || '').trim();
      return {
        label: t.label || 'Title Option',
        text: txt.length > 60 ? txt.slice(0, 57) + '...' : txt,
        length: Math.min(txt.length, 60),
      };
    });

    const descriptionOptions = llmResult.descriptionOptions.map((d) => {
      const txt = (d.text || '').trim();
      return {
        label: d.label || 'Description Option',
        text: txt.length > 160 ? txt.slice(0, 157) + '...' : txt,
        length: Math.min(txt.length, 160),
      };
    });

    return {
      titleOptions,
      descriptionOptions,
      suggestedSlug: llmResult.suggestedSlug || 'document-overview',
      headingOutline: Array.isArray(llmResult.headingOutline) && llmResult.headingOutline.length > 0
        ? llmResult.headingOutline
        : [
            { level: 'H1', text: `${targetName.replace(/\.pdf$/i, '')}: Complete Strategic Guide` },
            { level: 'H2', text: 'Core Principles & Key Insights' },
            { level: 'H2', text: 'Implementation Roadmap & Best Practices' },
            { level: 'H2', text: 'Frequently Asked Questions' },
          ],
      primaryKeyword: keywords[0] || 'strategic insights',
      secondaryKeywords: keywords.slice(1, 4),
    };
  }

  // Fallback if LLM parsing failed
  const baseName = targetName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  return {
    titleOptions: [
      { label: 'High-CTR / Direct Search', text: `${baseName}: Complete Guide`.slice(0, 60), length: Math.min(`${baseName}: Complete Guide`.length, 60) },
      { label: 'Executive / Authority', text: `${baseName} — Key Takeaways`.slice(0, 60), length: Math.min(`${baseName} — Key Takeaways`.length, 60) },
    ],
    descriptionOptions: [
      { label: 'Overview & Actionable', text: `In-depth analysis of ${keywords[0] || baseName}. Key strategies and actionable implementation takeaways.`.slice(0, 155), length: 155 },
    ],
    suggestedSlug: baseName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50),
    headingOutline: [
      { level: 'H1', text: `${baseName}: The Complete Strategic Guide` },
      { level: 'H2', text: 'Executive Summary & Key Findings' },
      { level: 'H2', text: 'Core Methodology & Framework' },
      { level: 'H2', text: 'Actionable Implementation Steps' },
    ],
    primaryKeyword: keywords[0] || 'strategic insights',
    secondaryKeywords: keywords.slice(1, 4),
  };
}

module.exports = {
  generateSurgicalFixes: generateSurgicalFixesWithLLM,
  generateFullSEOPackage: generateFullSEOPackageWithLLM,
};
