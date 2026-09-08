/**
 * Auditor & Gap Detection Agent
 * Inspects existing website DOM signals or parsed document content.
 * Classifies assets into:
 *   - preserved: Healthy existing elements that should be kept as-is
 *   - missing: Elements that are missing, broken, or substandard and require surgical fixes
 */

function auditExistingSite(signals = {}, url = '', extractedContent = '') {
  const preserved = [];
  const missing = [];

  const title = (signals.title || '').trim();
  const desc = (signals.metaDescription || '').trim();
  const h1Count = typeof signals.h1Count === 'number' ? signals.h1Count : 0;
  const h1Texts = Array.isArray(signals.h1Texts) ? signals.h1Texts : [];
  const hasSchema = Boolean(signals.hasSchema);
  const hasCanonical = Boolean(signals.hasCanonical);
  const imagesMissingAlt = typeof signals.imagesMissingAlt === 'number' ? signals.imagesMissingAlt : 0;

  // 1. Title Tag Audit
  if (title && title.length >= 25 && title.length <= 65) {
    preserved.push({
      element: 'title',
      label: 'Page Title',
      status: 'healthy',
      currentValue: title,
      reason: `Length is optimal (${title.length} chars). No replacement needed.`,
    });
  } else if (!title) {
    missing.push({
      element: 'title',
      label: 'Page Title',
      severity: 'high',
      issue: 'Missing <title> tag entirely.',
      actionRequired: 'GENERATE_TITLE',
    });
  } else {
    missing.push({
      element: 'title',
      label: 'Page Title',
      severity: 'medium',
      currentValue: title,
      issue: title.length < 25 ? `Title is too short (${title.length} chars).` : `Title exceeds 65 chars (${title.length} chars) and may truncate in Google SERPs.`,
      actionRequired: 'OPTIMIZE_TITLE',
    });
  }

  // 2. Meta Description Audit
  if (desc && desc.length >= 70 && desc.length <= 165) {
    preserved.push({
      element: 'metaDescription',
      label: 'Meta Description',
      status: 'healthy',
      currentValue: desc,
      reason: `Healthy length (${desc.length} chars). Meets Google SERP guidelines.`,
    });
  } else if (!desc) {
    missing.push({
      element: 'metaDescription',
      label: 'Meta Description',
      severity: 'high',
      issue: 'No meta description found. Google auto-snippets body text.',
      actionRequired: 'GENERATE_DESCRIPTION',
    });
  } else {
    missing.push({
      element: 'metaDescription',
      label: 'Meta Description',
      severity: 'medium',
      currentValue: desc,
      issue: desc.length < 70 ? `Description is too brief (${desc.length} chars).` : `Description is too long (${desc.length} chars) and will truncate.`,
      actionRequired: 'OPTIMIZE_DESCRIPTION',
    });
  }

  // 3. H1 Heading Audit
  if (h1Count === 1 && h1Texts[0]) {
    preserved.push({
      element: 'h1',
      label: 'H1 Primary Heading',
      status: 'healthy',
      currentValue: h1Texts[0],
      reason: 'Single, distinct H1 detected. Well-structured hierarchy.',
    });
  } else if (h1Count === 0) {
    missing.push({
      element: 'h1',
      label: 'H1 Primary Heading',
      severity: 'high',
      issue: 'No H1 tag detected on page.',
      actionRequired: 'GENERATE_H1',
    });
  } else {
    missing.push({
      element: 'h1',
      label: 'H1 Primary Heading',
      severity: 'medium',
      issue: `Multiple H1 tags found (${h1Count}). Dilutes page thematic focus.`,
      actionRequired: 'UNIFY_H1',
      currentValue: h1Texts.join(' | '),
    });
  }

  // 4. Schema (JSON-LD) Audit
  if (hasSchema) {
    preserved.push({
      element: 'schema',
      label: 'Structured Data (Schema)',
      status: 'healthy',
      reason: 'Structured data (JSON-LD) already declared on page.',
    });
  } else {
    missing.push({
      element: 'schema',
      label: 'Structured Data (Schema)',
      severity: 'high',
      issue: 'No JSON-LD structured data detected. Missing rich result eligibility.',
      actionRequired: 'GENERATE_SCHEMA',
    });
  }

  // 5. Canonical Tag Audit
  if (hasCanonical) {
    preserved.push({
      element: 'canonical',
      label: 'Canonical Tag',
      status: 'healthy',
      reason: 'Canonical link tag is present, protecting against duplicate content.',
    });
  } else {
    missing.push({
      element: 'canonical',
      label: 'Canonical Tag',
      severity: 'medium',
      issue: 'No canonical tag found.',
      actionRequired: 'GENERATE_CANONICAL',
    });
  }

  // 6. Image Alt Tags Audit
  if (imagesMissingAlt > 0) {
    missing.push({
      element: 'imageAlt',
      label: 'Image Alt Attributes',
      severity: 'low',
      issue: `${imagesMissingAlt} image(s) missing descriptive alt attributes.`,
      actionRequired: 'RECOMMEND_ALT_TAGS',
      count: imagesMissingAlt,
    });
  }

  return {
    target: url,
    preserved,
    missing,
    summary: {
      healthyCount: preserved.length,
      missingCount: missing.length,
      requiresIntervention: missing.length > 0,
    },
  };
}

module.exports = {
  auditExistingSite,
};
