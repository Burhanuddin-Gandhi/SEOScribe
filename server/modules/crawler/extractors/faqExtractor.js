const cheerio = require('cheerio');

const QUESTION_REGEX = /^(what|how|why|when|where|who|can|is|are|do|does|will|should|which)\b|\?$/i;

/**
 * Deterministic FAQ & Question-Answer Extractor (AEO / GEO Knowledge)
 */
function extractFaqs(html, baseUrl = '', structuredData = null) {
  const $ = typeof html === 'string' ? cheerio.load(html) : html;
  const questions = [];
  let questionIndex = 0;

  // 1. Extract from FAQPage Structured Data (Highest Confidence 1.0)
  if (structuredData?.normalized_entities) {
    structuredData.normalized_entities.forEach((entity) => {
      if (entity.type === 'FAQPage' && entity.properties?.mainEntity) {
        const items = Array.isArray(entity.properties.mainEntity)
          ? entity.properties.mainEntity
          : [entity.properties.mainEntity];

        items.forEach((item) => {
          const qText = item.name || item.text;
          const aText = item.acceptedAnswer?.text || item.acceptedAnswer?.name || '';
          if (qText) {
            questionIndex++;
            questions.push({
              question_id: `qa_${questionIndex}`,
              question: qText.trim(),
              answer: aText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
              detection_method: 'SCHEMA_JSON_LD',
              section: 'Structured FAQPage Schema',
              confidence: 1.0,
              dom_position: questionIndex,
            });
          }
        });
      }
    });
  }

  // 2. Extract from HTML5 <details>/<summary> Accordions (High Confidence 0.95)
  $('details').each((_, el) => {
    const summary = $(el).find('summary').first().text().replace(/\s+/g, ' ').trim();
    const answer = $(el).clone().find('summary').remove().end().text().replace(/\s+/g, ' ').trim();

    if (summary && answer) {
      questionIndex++;
      questions.push({
        question_id: `qa_${questionIndex}`,
        question: summary,
        answer,
        detection_method: 'HTML_DETAILS_SUMMARY',
        section: 'Interactive FAQ Accordion',
        confidence: 0.95,
        dom_position: questionIndex,
      });
    }
  });

  // 3. Extract from Interrogative Headings (H2/H3 ending in ? or interrogative keywords)
  $('h2, h3, h4').each((_, el) => {
    const headingText = $(el).text().replace(/\s+/g, ' ').trim();

    if (QUESTION_REGEX.test(headingText)) {
      // Find following sibling paragraph as answer
      const nextSibling = $(el).next();
      let answerText = '';
      if (nextSibling.is('p') || nextSibling.is('ul') || nextSibling.is('ol')) {
        answerText = nextSibling.text().replace(/\s+/g, ' ').trim();
      }

      if (headingText && answerText) {
        questionIndex++;
        questions.push({
          question_id: `qa_${questionIndex}`,
          question: headingText,
          answer: answerText,
          detection_method: 'INTERROGATIVE_HEADING',
          section: $(el).closest('section, article, main').attr('id') || 'Content Body',
          confidence: 0.85,
          dom_position: questionIndex,
        });
      }
    }
  });

  // Deduplicate questions by question text
  const uniqueQuestions = [];
  const seen = new Set();
  for (const q of questions) {
    const key = q.question.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    }
  }

  return {
    questions: uniqueQuestions,
    total_questions: uniqueQuestions.length,
    high_confidence_count: uniqueQuestions.filter((q) => q.confidence >= 0.95).length,
  };
}

module.exports = {
  extractFaqs,
};
