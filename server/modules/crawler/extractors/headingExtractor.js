const cheerio = require('cheerio');

/**
 * Deterministic Heading Tree & Information Architecture Extractor
 */
function extractHeadingTree(html) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const flatHeadings = [];
  const textCountMap = new Map();
  const emptyHeadings = [];
  const duplicateHeadings = [];

  let domIndex = 0;
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    domIndex++;
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace('h', ''), 10);
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const id = $(el).attr('id') || `h_${domIndex}`;

    if (!text) {
      emptyHeadings.push({ tag: tagName, dom_position: domIndex });
      return;
    }

    // Track duplicate texts
    const count = (textCountMap.get(text.toLowerCase()) || 0) + 1;
    textCountMap.set(text.toLowerCase(), count);
    if (count === 2) {
      duplicateHeadings.push(text);
    }

    flatHeadings.push({
      id,
      tag: tagName,
      level,
      text,
      dom_position: domIndex,
      children: [],
    });
  });

  // Calculate H1 Counts & Anomalies
  const h1Elements = flatHeadings.filter((h) => h.level === 1);
  const skippedLevels = [];
  let orphanHeadings = 0;

  for (let i = 0; i < flatHeadings.length - 1; i++) {
    const current = flatHeadings[i];
    const next = flatHeadings[i + 1];

    if (next.level > current.level + 1) {
      skippedLevels.push({
        from_tag: current.tag,
        to_tag: next.tag,
        dom_position: next.dom_position,
        message: `Skipped heading level from ${current.tag.toUpperCase()} directly to ${next.tag.toUpperCase()}`,
      });
    }
  }

  // Check if first heading is an orphan sub-heading (e.g. starting with H3 or H2 without H1)
  if (flatHeadings.length > 0 && flatHeadings[0].level > 1) {
    orphanHeadings++;
  }

  // Build Hierarchical Nested Tree
  const rootNodes = [];
  const stack = [];

  for (const heading of flatHeadings) {
    const node = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  const headingCounts = {
    h1: flatHeadings.filter((h) => h.level === 1).length,
    h2: flatHeadings.filter((h) => h.level === 2).length,
    h3: flatHeadings.filter((h) => h.level === 3).length,
    h4: flatHeadings.filter((h) => h.level === 4).length,
    h5: flatHeadings.filter((h) => h.level === 5).length,
    h6: flatHeadings.filter((h) => h.level === 6).length,
    total: flatHeadings.length,
  };

  const maxDepth = flatHeadings.reduce((max, h) => Math.max(max, h.level), 0);

  return {
    tree: rootNodes,
    flat_headings: flatHeadings.map((h) => ({ id: h.id, level: h.level, tag: h.tag, text: h.text, dom_position: h.dom_position })),
    counts: headingCounts,
    derived_signals: {
      h1_count: h1Elements.length,
      missing_h1: h1Elements.length === 0,
      multiple_h1s: h1Elements.length > 1,
      skipped_levels: skippedLevels,
      duplicate_headings: duplicateHeadings,
      empty_headings: emptyHeadings,
      max_depth: maxDepth,
      orphan_headings_count: orphanHeadings,
    },
  };
}

module.exports = {
  extractHeadingTree,
};
