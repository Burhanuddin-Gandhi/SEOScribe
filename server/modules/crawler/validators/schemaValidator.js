/**
 * Deterministic Schema & Data Integrity Validator
 * Reports factual extraction anomalies and data contract validation issues without altering source data.
 */
function validatePageKnowledge(page) {
  const issues = [];

  // 1. Technical & URL Integrity
  if (!page.url || !page.url.startsWith('http')) {
    issues.push({ severity: 'ERROR', category: 'URL', message: 'Page URL is invalid or malformed' });
  }

  // 2. Metadata Integrity
  if (page.metadata?.title?.is_missing) {
    issues.push({ severity: 'WARNING', category: 'METADATA', message: 'Document is missing a <title> tag' });
  }
  if (page.metadata?.title?.multiple_detected) {
    issues.push({ severity: 'WARNING', category: 'METADATA', message: 'Multiple <title> tags detected in DOM' });
  }
  if (page.metadata?.canonical?.conflicting_canonical) {
    issues.push({ severity: 'WARNING', category: 'METADATA', message: 'Conflicting canonical tags declared in document' });
  }

  // 3. Heading Tree Integrity
  if (page.headings?.derived_signals?.missing_h1) {
    issues.push({ severity: 'INFO', category: 'HEADINGS', message: 'Document contains zero H1 tags' });
  }
  if (page.headings?.derived_signals?.multiple_h1s) {
    issues.push({ severity: 'INFO', category: 'HEADINGS', message: `Multiple H1 tags detected (${page.headings.derived_signals.h1_count} H1s)` });
  }
  if (page.headings?.derived_signals?.skipped_levels?.length > 0) {
    issues.push({
      severity: 'INFO',
      category: 'HEADINGS',
      message: `${page.headings.derived_signals.skipped_levels.length} skipped heading levels detected in hierarchy`,
    });
  }

  // 4. Structured Data Integrity
  if (page.structured_data?.syntax_errors?.length > 0) {
    issues.push({
      severity: 'WARNING',
      category: 'STRUCTURED_DATA',
      message: `${page.structured_data.syntax_errors.length} malformed JSON-LD scripts failed syntax parsing`,
    });
  }

  // 5. Media Integrity
  if (page.images?.counts?.missing_alt > 0) {
    issues.push({
      severity: 'INFO',
      category: 'MEDIA',
      message: `${page.images.counts.missing_alt} images are missing alt attributes`,
    });
  }

  return {
    is_valid: issues.filter((i) => i.severity === 'ERROR').length === 0,
    total_issues: issues.length,
    issues,
  };
}

module.exports = {
  validatePageKnowledge,
};
