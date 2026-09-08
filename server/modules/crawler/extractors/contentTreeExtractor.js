const cheerio = require('cheerio');

/**
 * Deterministic Semantic Content Tree Extractor
 * Preserves the exact hierarchical relationship between headings, paragraphs, lists, and sections.
 */
function extractContentTree(html) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;

  const contentBlocks = [];
  let currentParentHeading = null;
  let currentSection = 'Introduction';
  let blockIndex = 0;

  // Clone and remove non-content elements
  const $content = cheerio.load($.html());
  $content('script, style, noscript, svg, iframe, nav, header, footer, aside, .cookie-banner, .advertisement').remove();

  // Find container
  let container = $content('main, article, #content, .post-content, .entry-content').first();
  if (!container || container.length === 0) {
    container = $content('body');
  }

  // Traverse direct child content blocks
  container.find('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, figure').each((_, el) => {
    const tagName = el.tagName.toLowerCase();
    const $el = $content(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();

    if (!text && tagName !== 'figure') return;

    blockIndex++;
    const blockId = `blk_${blockIndex}`;

    // Update active section / parent heading context when a heading is encountered
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName.replace('h', ''), 10);
      currentParentHeading = {
        level,
        tag: tagName,
        text,
      };
      if (level <= 2) {
        currentSection = text;
      }

      contentBlocks.push({
        block_id: blockId,
        element_type: 'heading',
        tag: tagName,
        heading_level: level,
        text,
        parent_heading: currentParentHeading ? currentParentHeading.text : null,
        section: currentSection,
        document_order: blockIndex,
      });
      return;
    }

    if (tagName === 'p') {
      contentBlocks.push({
        block_id: blockId,
        element_type: 'paragraph',
        tag: 'p',
        text,
        word_count: text.split(/\s+/).filter(Boolean).length,
        parent_heading: currentParentHeading ? currentParentHeading.text : null,
        section: currentSection,
        document_order: blockIndex,
      });
      return;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      const items = [];
      $el.find('> li').each((_, li) => {
        const liText = $content(li).text().replace(/\s+/g, ' ').trim();
        if (liText) items.push(liText);
      });

      if (items.length > 0) {
        contentBlocks.push({
          block_id: blockId,
          element_type: 'list',
          list_type: tagName === 'ol' ? 'ordered' : 'unordered',
          item_count: items.length,
          items,
          text: items.join('; '),
          parent_heading: currentParentHeading ? currentParentHeading.text : null,
          section: currentSection,
          document_order: blockIndex,
        });
      }
      return;
    }

    if (tagName === 'blockquote') {
      contentBlocks.push({
        block_id: blockId,
        element_type: 'blockquote',
        text,
        parent_heading: currentParentHeading ? currentParentHeading.text : null,
        section: currentSection,
        document_order: blockIndex,
      });
      return;
    }

    if (tagName === 'pre') {
      contentBlocks.push({
        block_id: blockId,
        element_type: 'code_block',
        text: $el.text().trim(),
        parent_heading: currentParentHeading ? currentParentHeading.text : null,
        section: currentSection,
        document_order: blockIndex,
      });
      return;
    }

    if (tagName === 'figure') {
      const caption = $el.find('figcaption').text().replace(/\s+/g, ' ').trim() || null;
      const imgSrc = $el.find('img').attr('src') || null;
      contentBlocks.push({
        block_id: blockId,
        element_type: 'figure',
        image_src: imgSrc,
        caption,
        text: caption || 'Figure element',
        parent_heading: currentParentHeading ? currentParentHeading.text : null,
        section: currentSection,
        document_order: blockIndex,
      });
    }
  });

  return {
    total_blocks: contentBlocks.length,
    blocks: contentBlocks,
  };
}

module.exports = {
  extractContentTree,
};
