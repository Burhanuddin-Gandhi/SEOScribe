const { GoogleGenAI } = require('@google/genai');
const { createStandardResult } = require('./baseParser');

/**
 * Google Gemini Flash Document Parser Adapter (via Google AI Studio)
 * 100% Free API Key from aistudio.google.com (No Credit Card / No Billing required)
 * Model: gemini-2.5-flash (Native multimodal document understanding)
 */
async function parseWithGemini(pdfBuffer, filename = 'document.pdf') {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your-key')) {
    return createStandardResult({
      engine: 'Gemini_2.5_Flash',
      error: new Error('GEMINI_API_KEY is missing in .env (Get a free key from aistudio.google.com)'),
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = pdfBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: 'Extract the complete text from this PDF into clean, semantic Markdown. Preserve all # H1, ## H2, ### H3 headings, bullet points, and data tables (| col1 | col2 |). Do not summarize; extract the full text structure faithfully.',
        },
      ],
    });

    const markdown = response.text || '';
    const latencyMs = Date.now() - startTime;

    return createStandardResult({
      engine: 'Gemini_2.5_Flash',
      text: markdown,
      rawMarkdown: markdown,
      pages: 1,
      latencyMs,
      estimatedCostUsd: 0.0, // 100% Free on AI Studio
      confidence: 'high',
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return createStandardResult({
      engine: 'Gemini_2.5_Flash',
      latencyMs,
      error: err.message || String(err),
    });
  }
}

module.exports = { parseWithGemini };
