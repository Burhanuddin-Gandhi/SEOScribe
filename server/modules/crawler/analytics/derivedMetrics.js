/**
 * Deterministic Content Statistics & Derived Metrics Calculator
 * Calculates measurable facts without subjective SEO scoring.
 */
function computeDerivedMetrics({ text, contentTree, headings, links, media, tables, mainContent }) {
  const cleanText = text || '';
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = cleanText.length;

  // Approximate sentence count based on punctuation boundaries
  const sentences = cleanText.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 3);
  const sentenceCount = sentences.length;

  const paragraphBlocks = (contentTree?.blocks || []).filter((b) => b.element_type === 'paragraph');
  const listBlocks = (contentTree?.blocks || []).filter((b) => b.element_type === 'list');

  // Reading time at standard 220 words per minute
  const readingTimeMinutes = Number((wordCount / 220).toFixed(1));

  // Content-to-navigation ratio
  const navTextLength = mainContent?.sections?.navigation_text?.length || 0;
  const mainTextLength = mainContent?.sections?.main_content_text?.length || 0;
  const totalLength = navTextLength + mainTextLength;
  const contentToNavRatio = totalLength > 0 ? Number((mainTextLength / totalLength).toFixed(3)) : 1.0;

  return {
    word_count: wordCount,
    character_count: characterCount,
    sentence_count: sentenceCount,
    paragraph_count: paragraphBlocks.length,
    list_count: listBlocks.length,
    heading_count: headings?.counts?.total || 0,
    table_count: tables?.total_tables || 0,
    image_count: media?.counts?.total_images || 0,
    internal_link_count: links?.counts?.total_internal || 0,
    external_link_count: links?.counts?.total_external || 0,
    content_to_navigation_ratio: contentToNavRatio,
    reading_time_minutes: readingTimeMinutes,
    average_words_per_sentence: sentenceCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : 0,
    average_words_per_paragraph: paragraphBlocks.length > 0 ? Number((wordCount / paragraphBlocks.length).toFixed(1)) : 0,
  };
}

module.exports = {
  computeDerivedMetrics,
};
