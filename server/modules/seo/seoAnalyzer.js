/**
 * SEO Analyzer Module
 *
 * Analyzes a page's content and (when available) structural signals scraped
 * from the live DOM, and generates structured SEO audit data.
 *
 * Design notes:
 * - Structural checks (title length, H1 count, alt text, canonical, schema,
 *   HTTPS, word count, internal links...) only run when the corresponding
 *   `signals` field is provided. Nothing is assumed or faked when a signal
 *   is missing — the check is simply skipped.
 * - All audit checks are objective, verifiable structural facts about the
 *   analyzed page markup/DOM (title, meta tags, H1s, alt attributes,
 *   canonical tags, schema markup, viewport, HTTPS, internal links, and word count).
 * - Keywords are extracted from the actual content with a lightweight
 *   RAKE-style frequency algorithm, not a fixed keyword list.
 * - Competitors are detected from repeated capitalized names actually
 *   mentioned in the content. No fabricated domain authority or content
 *   counts are attached — we don't have real data for those, so we don't
 *   invent it.
 */

const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be
   because been before being below between both but by can't cannot could
   couldn't did didn't do does doesn't doing don't down during each few for
   from further had hadn't has hasn't have haven't having he he'd he'll he's
   her here here's hers herself him himself his how how's i i'd i'll i'm
   i've if in into is isn't it it's its itself let's me more most mustn't
   my myself no nor not of off on once only or other ought our ours
   ourselves out over own same shan't she she'd she'll she's should
   shouldn't so some such than that that's the their theirs them
   themselves then there there's these they they'd they'll they're they've
   this those through to too under until up very was wasn't we we'd we'll
   we're we've were weren't what what's when when's where where's which
   while who who's whom why why's with won't would wouldn't you you'd
   you'll you're you've your yours yourself yourselves get got also into
   onto than then just like`
    .split(/\s+/)
    .filter(Boolean)
);

const GENERIC_CAPITALIZED_STARTERS = new Set([
  'the', 'this', 'that', 'these', 'those', 'our', 'your', 'we', 'you', 'it',
  'they', 'he', 'she', 'and', 'or', 'but', 'if', 'when', 'while', 'because',
  'however', 'therefore', 'also', 'more', 'most', 'best', 'top', 'new',
  'get', 'how', 'why', 'what', 'who', 'learn', 'read', 'click', 'view',
  'see', 'find', 'shop', 'buy', 'try', 'start', 'join', 'sign', 'contact',
]);

function tokenize(text) {
  return (text || '').toLowerCase().match(/[a-z0-9']+/g) || [];
}

/* ------------------------------------------------------------------ */
/* Keyword extraction (Cleaned RAKE-style: strips markdown & dashes)    */
/* ------------------------------------------------------------------ */

function cleanMarkdownAndSymbols(text) {
  return (text || '')
    .replace(/\[AI-VISUAL-INTERPRETATION\][^\n]*/gi, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#*`_~>|]/g, ' ')
    .replace(/-{2,}/g, ' ')
    .replace(/={2,}/g, ' ')
    .replace(/_{2,}/g, ' ');
}

function splitIntoCandidatePhrases(text) {
  const cleaned = cleanMarkdownAndSymbols(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ');
  const rawWords = cleaned.split(/\s+/).filter(Boolean);
  const words = rawWords
    .map((w) => w.replace(/^-+|-+$/g, '')) // Strip surrounding hyphens
    .filter((w) => w.length > 2 && !/^\d+$/.test(w));

  const phrases = [];
  let current = [];

  for (const word of words) {
    if (STOPWORDS.has(word) || word.length <= 2) {
      if (current.length) phrases.push(current);
      current = [];
    } else {
      current.push(word);
      if (current.length === 3) {
        phrases.push(current);
        current = [];
      }
    }
  }
  if (current.length) phrases.push(current);

  return phrases.map((p) => p.join(' '));
}

function extractKeywords(bodyText, boostText = '', limit = 10) {
  const phrases = splitIntoCandidatePhrases(bodyText);
  if (!phrases.length) return [];

  const boostSet = new Set(splitIntoCandidatePhrases(boostText));

  const freq = new Map();
  phrases.forEach((p) => freq.set(p, (freq.get(p) || 0) + 1));

  const scored = Array.from(freq.entries()).map(([phrase, count]) => {
    const wordCount = phrase.split(' ').length;
    // Prefer 2-3 word keyphrases over single generic words
    let score = count * (wordCount >= 2 ? wordCount * 2.5 : 0.8);
    if (boostSet.has(phrase)) score *= 2; // appears in title/headings
    return { phrase, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const chosen = [];
  for (const { phrase } of scored) {
    // skip phrases that are just a substring/superstring of one already chosen
    if (chosen.some((c) => c.includes(phrase) || phrase.includes(c))) continue;
    chosen.push(phrase);
    if (chosen.length >= limit) break;
  }

  return chosen;
}

/* ------------------------------------------------------------------ */
/* Competitor mention detection (real domains and corporate entities) */
/* ------------------------------------------------------------------ */

function extractCompetitorMentions(rawText, ownBrandText = '', limit = 5) {
  if (!rawText) return [];

  const ownBrandWords = new Set(tokenize(ownBrandText));
  const freq = new Map();

  // 1. Detect external domain names (e.g. competitor.com, ahrefs.com, semrush.com)
  const domainMatches = rawText.match(/\b([a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.(?:com|org|net|io|co|ai|uk|gov|edu|de|app|tech|biz))\b/gi) || [];
  domainMatches.forEach((domain) => {
    const d = domain.toLowerCase();
    if (!ownBrandWords.has(d.split('.')[0]) && !['schema.org', 'w3.org', 'google.com', 'localhost', 'github.com'].includes(d)) {
      freq.set(d, (freq.get(d) || 0) + 1);
    }
  });

  // 2. Detect corporate brand names with business/legal identifiers
  const brandPattern = /\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*\s+(?:Inc|Corp|Corporation|LLC|Ltd|Limited|GmbH|Technologies|Software|Labs|Group|Agency|Consulting|Solutions|Systems|Ventures|Partners))\b/g;
  const brandMatches = rawText.match(brandPattern) || [];
  brandMatches.forEach((raw) => {
    const name = raw.trim();
    if (name.length < 4) return;
    const firstWord = name.split(' ')[0].toLowerCase();
    if (GENERIC_CAPITALIZED_STARTERS.has(firstWord) || ownBrandWords.has(firstWord)) return;
    freq.set(name, (freq.get(name) || 0) + 1);
  });

  // 3. Known benchmark SEO/Tech platforms
  const KNOWN_BENCHMARKS = ['SEMrush', 'Ahrefs', 'Moz', 'HubSpot', 'Yoast', 'RankMath', 'Screaming Frog', 'SpyFu', 'SimilarWeb', 'BuzzSumo'];
  KNOWN_BENCHMARKS.forEach((brand) => {
    const count = (rawText.match(new RegExp('\\b' + brand + '\\b', 'gi')) || []).length;
    if (count > 0 && !ownBrandWords.has(brand.toLowerCase())) {
      freq.set(brand, (freq.get(brand) || 0) + count);
    }
  });

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, mentions]) => ({ name, mentions }));
}

/* ------------------------------------------------------------------ */
/* Structural issue checks — only run when the signal is available      */
/* ------------------------------------------------------------------ */

function mkIssue(id, title, category, severity, description) {
  return { id, title, category, severity, description };
}

function buildStructuralIssues(signals = {}, wordCount) {
  const issues = [];

  if (signals.title !== undefined) {
    const len = (signals.title || '').trim().length;
    if (!len) {
      issues.push(
        mkIssue(
          'missing-title-tag',
          'Missing Page Title',
          'On-Page SEO',
          'high',
          'No <title> tag was found. The title is one of the strongest on-page ranking signals and the first thing users see in search results.'
        )
      );
    } else if (len < 30 || len > 60) {
      issues.push(
        mkIssue(
          'title-length',
          'Title Tag Length Is Off',
          'On-Page SEO',
          'medium',
          `The page title is ${len} characters. Google typically displays 50-60 characters — titles outside the 30-60 character range get truncated or waste ranking potential.`
        )
      );
    }
  }

  if (signals.metaDescription !== undefined) {
    const len = (signals.metaDescription || '').trim().length;
    if (!len) {
      issues.push(
        mkIssue(
          'missing-meta-description',
          'Missing Meta Description',
          'On-Page SEO',
          'high',
          'No meta description was found. Search engines will auto-generate a snippet from page text, which usually hurts click-through rates.'
        )
      );
    } else if (len < 70 || len > 160) {
      issues.push(
        mkIssue(
          'meta-description-length',
          'Meta Description Length Is Off',
          'On-Page SEO',
          'medium',
          `The meta description is ${len} characters. The ideal range is 70-160 characters to avoid truncation in search results.`
        )
      );
    }
  }

  if (typeof signals.h1Count === 'number') {
    if (signals.h1Count === 0) {
      issues.push(
        mkIssue(
          'missing-h1',
          'Missing H1 Heading',
          'On-Page SEO',
          'high',
          'No H1 heading was found on the page. A single, keyword-relevant H1 helps both users and search engines understand the page topic.'
        )
      );
    } else if (signals.h1Count > 1) {
      issues.push(
        mkIssue(
          'multiple-h1',
          'Multiple H1 Headings',
          'On-Page SEO',
          'medium',
          `${signals.h1Count} H1 tags were found on the page. Multiple H1s can dilute topical relevance signals — use one primary H1 per page.`
        )
      );
    }
  }

  if (
    typeof signals.imageCount === 'number' &&
    signals.imageCount > 0 &&
    typeof signals.imagesMissingAlt === 'number' &&
    signals.imagesMissingAlt > 0
  ) {
    const ratio = signals.imagesMissingAlt / signals.imageCount;
    issues.push(
      mkIssue(
        'missing-alt-text',
        'Images Missing Alt Text',
        'Accessibility & SEO',
        ratio > 0.5 ? 'high' : 'medium',
        `${signals.imagesMissingAlt} of ${signals.imageCount} images are missing alt attributes, hurting accessibility and image search visibility.`
      )
    );
  }

  if (typeof signals.hasCanonical === 'boolean' && !signals.hasCanonical) {
    issues.push(
      mkIssue(
        'missing-canonical',
        'Missing Canonical Tag',
        'Technical SEO',
        'medium',
        'No canonical tag was found. Without one, duplicate or parameterized URL variants risk splitting ranking signals.'
      )
    );
  }

  if (typeof signals.hasSchema === 'boolean' && !signals.hasSchema) {
    issues.push(
      mkIssue(
        'missing-schema',
        'Missing Structured Data',
        'Technical SEO',
        'medium',
        'No JSON-LD structured data was detected. Schema markup (Organization, Product, Article, FAQ, etc.) enables rich results in search.'
      )
    );
  }

  if (typeof signals.hasViewportMeta === 'boolean' && !signals.hasViewportMeta) {
    issues.push(
      mkIssue(
        'missing-viewport',
        'No Mobile Viewport Meta Tag',
        'Performance',
        'high',
        'No responsive viewport meta tag was found. Google uses mobile-first indexing, so this can significantly hurt rankings.'
      )
    );
  }

  if (typeof signals.isHttps === 'boolean' && !signals.isHttps) {
    issues.push(
      mkIssue(
        'no-https',
        'Site Not Served Over HTTPS',
        'Technical SEO',
        'high',
        'The page was not served over HTTPS. HTTPS is a confirmed Google ranking signal and is required for user trust.'
      )
    );
  }

  if (typeof signals.internalLinkCount === 'number') {
    if (signals.internalLinkCount === 0) {
      issues.push(
        mkIssue(
          'no-internal-links',
          'No Internal Links Found',
          'Architecture',
          'medium',
          'The page has no internal links. Internal linking helps search engines discover and understand the site structure.'
        )
      );
    } else if (signals.internalLinkCount < 3) {
      issues.push(
        mkIssue(
          'few-internal-links',
          'Thin Internal Linking',
          'Architecture',
          'low',
          `Only ${signals.internalLinkCount} internal link(s) were found on the page. More contextual internal links help distribute page authority.`
        )
      );
    }
  }

  if (typeof wordCount === 'number') {
    if (wordCount < 150) {
      issues.push(
        mkIssue(
          'thin-content',
          'Very Thin Content',
          'Content Strategy',
          'high',
          `The page contains roughly ${wordCount} words. Pages under 150 words often struggle to rank for competitive terms.`
        )
      );
    } else if (wordCount < 300) {
      issues.push(
        mkIssue(
          'low-content',
          'Below-Average Content Length',
          'Content Strategy',
          'medium',
          `The page contains roughly ${wordCount} words. Aim for 300+ words of substantive content for most page types.`
        )
      );
    }
  }

  return issues;
}



/* ------------------------------------------------------------------ */
/* Scoring                                                               */
/* ------------------------------------------------------------------ */

function categoryScore(issues, categories) {
  let score = 96;
  issues
    .filter((i) => categories.includes(i.category))
    .forEach((i) => {
      score -= i.severity === 'high' ? 14 : i.severity === 'medium' ? 8 : 3;
    });
  return Math.max(20, Math.min(98, Math.round(score)));
}

function letterGrade(score) {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

function computeScores(issues) {
  const technical = categoryScore(issues, ['Technical SEO', 'Architecture']);
  const onPage = categoryScore(issues, ['On-Page SEO']);
  const performance = categoryScore(issues, ['Performance']);
  const content = categoryScore(issues, ['Content Strategy', 'Accessibility & SEO']);

  const overall = Math.round((technical + onPage + performance + content) / 4);

  return {
    score: overall,
    grade: letterGrade(overall),
    categoryScores: { technical, onPage, performance, content },
  };
}

/* ------------------------------------------------------------------ */
/* Recommendations — derived from the issues actually found             */
/* ------------------------------------------------------------------ */

const RECOMMENDATION_TEMPLATES = {
  'missing-title-tag': { priority: 'High', timeframe: 'Immediate (1 day)', action: 'Add a unique, keyword-rich <title> tag between 50-60 characters.' },
  'title-length': { priority: 'Medium', timeframe: 'Short-term (2-3 days)', action: 'Rewrite the title tag to fall within 30-60 characters, keeping the primary keyword near the front.' },
  'missing-meta-description': { priority: 'High', timeframe: 'Immediate (1-2 days)', action: 'Write a compelling meta description of 70-160 characters that includes the primary keyword and a call to action.' },
  'meta-description-length': { priority: 'Medium', timeframe: 'Short-term (2-3 days)', action: 'Trim or expand the meta description to the 70-160 character sweet spot.' },
  'missing-h1': { priority: 'High', timeframe: 'Immediate (1 day)', action: 'Add a single H1 heading that clearly states the page topic and includes the target keyword.' },
  'multiple-h1': { priority: 'Medium', timeframe: 'Short-term (2-3 days)', action: 'Consolidate to one H1 per page and demote other headings to H2/H3.' },
  'missing-alt-text': { priority: 'Medium', timeframe: 'Short-term (1 week)', action: 'Add descriptive alt attributes to all content images.' },
  'missing-canonical': { priority: 'Medium', timeframe: 'Short-term (1 week)', action: 'Add a self-referencing canonical tag to prevent duplicate content issues.' },
  'missing-schema': { priority: 'Medium', timeframe: 'Short-term (1-2 weeks)', action: 'Implement JSON-LD structured data relevant to the page type (Organization, Product, Article, FAQ, etc.).' },
  'missing-viewport': { priority: 'High', timeframe: 'Immediate (1-2 days)', action: 'Add a responsive viewport meta tag and verify the page passes a mobile-friendliness test.' },
  'no-https': { priority: 'High', timeframe: 'Immediate', action: 'Move the site to HTTPS with a valid TLS certificate and redirect all HTTP traffic.' },
  'no-internal-links': { priority: 'Medium', timeframe: 'Short-term (1 week)', action: 'Add contextual internal links to related pages so search engines can crawl and understand the site.' },
  'few-internal-links': { priority: 'Low', timeframe: 'Medium-term (2-4 weeks)', action: 'Increase internal linking to and from this page to spread authority and improve discoverability.' },
  'thin-content': { priority: 'High', timeframe: 'Short-term (1 week)', action: 'Expand the page with substantive, useful content — aim for at least 300-500 words covering the topic thoroughly.' },
  'low-content': { priority: 'Medium', timeframe: 'Short-term (1-2 weeks)', action: 'Add more depth to the content — examples, data, or answers to common questions related to the topic.' },
};

function buildRecommendations(issues) {
  const priorityRank = { High: 0, Medium: 1, Low: 2 };

  const recs = issues.map((issue) => {
    const template = RECOMMENDATION_TEMPLATES[issue.id];
    if (template) {
      return {
        title: `Fix: ${issue.title}`,
        priority: template.priority,
        timeframe: template.timeframe,
        action: template.action,
      };
    }
    // Fallback recommendation if no specific template is matched
    const priority = issue.severity === 'high' ? 'High' : issue.severity === 'medium' ? 'Medium' : 'Low';
    return {
      title: `Address: ${issue.title}`,
      priority,
      timeframe: priority === 'High' ? 'Immediate' : priority === 'Medium' ? 'Short-term (1-2 weeks)' : 'Medium-term (1 month)',
      action: issue.description,
    };
  });

  recs.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  if (recs.length === 0) {
    return [
      {
        title: 'Maintain Current SEO Health',
        priority: 'Low',
        timeframe: 'Ongoing',
        action: 'No major issues were detected against the checks this tool runs. Keep monitoring Core Web Vitals, refresh content regularly, and continue building quality backlinks.',
      },
    ];
  }

  return recs;
}

/* ------------------------------------------------------------------ */
/* Tailored SEO Kit Generator (Universal for URLs and PDFs)           */
/* ------------------------------------------------------------------ */

function toTitleCase(str) {
  return (str || '')
    .replace(/[_-]/g, ' ')
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

function generateSlug(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function classifyKeywordIntent(phrase) {
  const p = (phrase || '').toLowerCase();
  if (/\b(how|what|why|guide|tips|overview|learn|analysis|report)\b/.test(p)) {
    return 'Informational';
  }
  if (/\b(best|top|vs|review|comparison|service|agency|software|platform)\b/.test(p)) {
    return 'Commercial';
  }
  if (/\b(buy|pricing|hire|quote|order|contact|subscribe|cost|download)\b/.test(p)) {
    return 'Transactional';
  }
  return 'Navigational';
}

function generateTailoredSEOKit(text, target, signals = {}, keywords = []) {
  // 1. Identify primary subject and brand
  const cleanedTarget = (target || '')
    .replace(/^https?:\/\//, '')
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ');
  
  const rawTitle = signals.title || cleanedTarget || 'SEO Strategy & Optimization';
  const cleanTitle = rawTitle.replace(/\s*[-|]\s*.*$/, '').trim();

  // 2. Keyword Classification (Primary, Secondary, Long-tail)
  const kwList = (keywords || []).map((k) => (typeof k === 'string' ? k : k.phrase || ''));
  const primaryKw = kwList[0] || 'seo optimization';
  const secondaryKws = kwList.slice(1, 4);
  const longTailKws = kwList.slice(4, 8);

  const categorizedKeywords = kwList.slice(0, 8).map((phrase, idx) => ({
    keyword: phrase,
    role: idx === 0 ? 'Primary' : idx <= 3 ? 'Secondary' : 'Long-tail',
    searchIntent: classifyKeywordIntent(phrase),
    frequency: 1,
    density: 'Natural',
  }));

  // 3. Synthesize High-CTR Meta Title (50-60 chars target)
  const primaryTitleWord = toTitleCase(primaryKw);
  let tailoredTitle = `${toTitleCase(cleanTitle)}: ${primaryTitleWord} Guide`;
  if (tailoredTitle.length > 60) {
    tailoredTitle = `${toTitleCase(cleanTitle)} | ${primaryTitleWord}`;
  }
  if (tailoredTitle.length > 60) {
    tailoredTitle = tailoredTitle.slice(0, 57) + '...';
  }

  // 4. Synthesize Action-Oriented Meta Description (145-155 chars target)
  const firstSecondary = secondaryKws[0] ? ` Learn about ${secondaryKws[0]} and actionable insights.` : '';
  let tailoredDesc = `Master ${primaryKw} with our in-depth audit & strategy overview.${firstSecondary} Improve organic visibility and rankings today.`;
  if (tailoredDesc.length > 160) {
    tailoredDesc = tailoredDesc.slice(0, 157) + '...';
  }

  // 5. Recommended URL Slug
  const suggestedSlug = generateSlug(cleanTitle || primaryKw);

  // 6. Semantic Heading Outline (H1, H2, H3)
  const headingOutline = [
    { level: 'H1', text: `${toTitleCase(cleanTitle)}: Complete Overview & Strategy` },
    { level: 'H2', text: `Key Insights on ${primaryTitleWord}` },
    { level: 'H3', text: `Core Methodology & Signals` },
    ...(secondaryKws[0] ? [{ level: 'H2', text: `Best Practices for ${toTitleCase(secondaryKws[0])}` }] : []),
    ...(secondaryKws[1] ? [{ level: 'H2', text: `Actionable Implementation of ${toTitleCase(secondaryKws[1])}` }] : []),
    { level: 'H2', text: 'Frequently Asked Questions & Next Steps' },
  ];

  // 7. Production-Ready JSON-LD Schema Markup
  const pageUrl = target.startsWith('http') ? target : `https://example.com/${suggestedSlug}`;
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: tailoredTitle,
    description: tailoredDesc,
    keywords: [primaryKw, ...secondaryKws].join(', '),
    url: pageUrl,
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'SEOScribe',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SEOScribe',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  // 8. Ready-to-paste full HTML <head> snippet
  const fullHtmlSnippet = `<!-- SEOScribe Generated SEO Kit -->
<title>${tailoredTitle}</title>
<meta name="description" content="${tailoredDesc}" />
<link rel="canonical" href="${pageUrl}" />

<!-- OpenGraph / Social Meta Tags -->
<meta property="og:type" content="article" />
<meta property="og:title" content="${tailoredTitle}" />
<meta property="og:description" content="${tailoredDesc}" />
<meta property="og:url" content="${pageUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${tailoredTitle}" />
<meta name="twitter:description" content="${tailoredDesc}" />

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
${JSON.stringify(jsonLdSchema, null, 2)}
</script>`;

  return {
    metaTitle: tailoredTitle,
    metaDescription: tailoredDesc,
    suggestedSlug,
    categorizedKeywords,
    headingOutline,
    jsonLdSchema,
    fullHtmlSnippet,
    characterCounts: {
      titleLength: tailoredTitle.length,
      descriptionLength: tailoredDesc.length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Main entry point                                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {string} content - extracted text content (page text or PDF text)
 * @param {string} target - URL or filename, used for own-brand detection
 * @param {object} signals - optional structural signals scraped from the
 *   live DOM (title, metaDescription, h1Count, imageCount, imagesMissingAlt,
 *   hasCanonical, hasSchema, hasViewportMeta, isHttps, internalLinkCount,
 *   wordCount). Any omitted field simply skips that check.
 */
function analyzeSEOContent(content, target = '', signals = {}) {
  const text = content || '';
  const wordCount = typeof signals.wordCount === 'number' ? signals.wordCount : tokenize(text).length;

  const issues = buildStructuralIssues(signals, wordCount);

  const boostText = [signals.title, signals.metaDescription].filter(Boolean).join(' ');
  const keywords = extractKeywords(text, boostText);

  const ownBrand = signals.title || target;
  const competitors = extractCompetitorMentions(text, ownBrand);

  const { score, grade, categoryScores } = computeScores(issues);
  const recommendations = buildRecommendations(issues);

  // Generate the tailored ready-to-paste replacement SEO Kit
  const generatedSEOKit = generateTailoredSEOKit(text, target, signals, keywords);

  const summary = {
    totalIssues: issues.length,
    highSeverity: issues.filter((i) => i.severity === 'high').length,
    mediumSeverity: issues.filter((i) => i.severity === 'medium').length,
    lowSeverity: issues.filter((i) => i.severity === 'low').length,
    keywordsCount: keywords.length,
    competitorsAnalyzed: competitors.length,
  };

  return {
    score,
    grade,
    categoryScores,
    summary,
    issues,
    keywords,
    recommendations,
    competitors,
    generatedSEOKit,
  };
}

module.exports = { analyzeSEOContent, generateTailoredSEOKit };

