const { GoogleGenAI } = require('@google/genai');

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in .env');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Execute an LLM prompt with a specialized Agent persona
 * @param {Object} options
 * @param {string} options.agentName - Name of the agent (e.g. "SEO Copywriter Agent")
 * @param {string} options.systemInstruction - Specific role and guidelines for this agent
 * @param {string} options.userPrompt - The task context and data
 * @param {boolean} options.expectJson - Whether to parse output as JSON
 * @param {string} options.model - Model to use (default: gemini-2.5-flash)
 */
async function callAgentLLM({
  agentName = 'SEO Specialist Agent',
  systemInstruction = '',
  userPrompt = '',
  expectJson = false,
  model = 'gemini-2.5-flash',
}) {
  try {
    const ai = getGeminiClient();

    const fullPrompt = `${systemInstruction ? `Role & Instructions:\n${systemInstruction}\n\n` : ''}${userPrompt}${
      expectJson
        ? '\n\nIMPORTANT: Respond ONLY with a valid JSON object matching the requested schema. Do not wrap in markdown code blocks or backticks. Return raw JSON.'
        : ''
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });

    const rawText = (response.text || '').trim();

    if (expectJson) {
      // Clean possible markdown code fences (```json ... ```)
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();
      try {
        return JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn(`[${agentName}] JSON parse failed, returning raw text:`, parseErr.message);
        return { raw: rawText };
      }
    }

    return rawText;
  } catch (err) {
    console.error(`[${agentName}] LLM call error:`, err.message);
    return null;
  }
}

module.exports = {
  callAgentLLM,
};
