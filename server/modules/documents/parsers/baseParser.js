/**
 * Standard parser response structure and utility helpers.
 * Ensures consistent output across Local, LlamaParse, Unstructured, OpenAI Vision, and Azure.
 */

function createStandardResult({
  engine,
  text = '',
  rawMarkdown = '',
  pages = 0,
  latencyMs = 0,
  estimatedCostUsd = 0.0,
  info = {},
  confidence = 'high',
  confidenceReasons = [],
  error = null,
}) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const characterCount = text.length;

  // Extract structural metrics from markdown/text
  const headings = {
    h1: (rawMarkdown.match(/^#\s+[^\n]+/gm) || []).length,
    h2: (rawMarkdown.match(/^##\s+[^\n]+/gm) || []).length,
    h3: (rawMarkdown.match(/^###\s+[^\n]+/gm) || []).length,
  };
  const totalHeadings = headings.h1 + headings.h2 + headings.h3;

  // Detect table rows in markdown (| col1 | col2 |)
  const tableRows = (rawMarkdown.match(/^\|.+\|$/gm) || []).length;

  // Detect bullet list items (- item or * item)
  const bulletItems = (rawMarkdown.match(/^[-*•]\s+[^\n]+/gm) || []).length;

  return {
    success: !error,
    engine,
    text,
    rawMarkdown: rawMarkdown || text,
    pages,
    characterCount,
    wordCount: words,
    latencyMs,
    estimatedCostUsd,
    metrics: {
      totalHeadings,
      headings,
      tableRows,
      bulletItems,
      hasMarkdownStructure: totalHeadings > 0 || tableRows > 0,
    },
    info: {
      title: info.title || info.Title || null,
      author: info.author || info.Author || null,
      creator: info.creator || info.Creator || null,
    },
    confidence,
    confidenceReasons,
    error: error ? (error.message || String(error)) : null,
  };
}

module.exports = { createStandardResult };
