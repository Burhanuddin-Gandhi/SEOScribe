const { callAgentLLM } = require('./llmClient');

/**
 * Competitor Intelligence Agent (Powered 100% by Gemini LLM)
 * Zero extra scraping credits consumed: evaluates competitor entities identified in the content
 * and formulates tactical counter-positioning angles purely through LLM reasoning.
 */

async function analyzeCompetitorsWithLLM(competitorList = [], primaryKeywords = [], options = {}) {
  const targetCompetitors = (competitorList || []).slice(0, 5);

  const competitors = targetCompetitors.map((comp) => {
    const name = typeof comp === 'string' ? comp : comp.name;
    const isDomain = name && name.includes('.') && !name.includes(' ');
    return {
      name,
      mentions: comp.mentions || 1,
      isDomain: Boolean(isDomain),
      strategicObservation: isDomain
        ? `Direct domain competitor identified in client content for search comparison.`
        : `Industry brand entity identified in client content.`,
    };
  }).filter((c) => Boolean(c.name));

  // LLM Strategic Reasoning: Generate Tactical Counter-Positioning Angles
  if (competitors.length > 0) {
    const systemInstruction = `You are an elite Competitive SEO Strategist Agent.
Analyze the listed competitors and target keywords from the client's material.
Produce 2-3 specific, tactical counter-positioning angles explaining how the client can outrank and differentiate from these competitors in organic search.

Output schema:
{
  "counterPositioning": [
    { "angle": "...", "recommendation": "..." }
  ]
}`;

    const userPrompt = `Competitors Identified in Material: ${competitors.map((c) => c.name).join(', ')}
Target Keywords: ${primaryKeywords.slice(0, 6).join(', ')}`;

    const llmResult = await callAgentLLM({
      agentName: 'Competitor Intelligence Agent',
      systemInstruction,
      userPrompt,
      expectJson: true,
    });

    if (llmResult && Array.isArray(llmResult.counterPositioning) && llmResult.counterPositioning.length > 0) {
      return {
        competitors,
        counterPositioning: llmResult.counterPositioning,
        count: competitors.length,
      };
    }
  }

  // Fallback counter-positioning if LLM response unavailable
  const fallbackAngles = [];
  if (competitors.length > 0) {
    fallbackAngles.push({
      angle: 'High-Intent Alternative / Comparison Page',
      recommendation: `Target commercial evaluation queries (e.g. "vs ${competitors[0].name}") by creating an objective feature-comparison landing page.`,
    });
    if (primaryKeywords[0]) {
      fallbackAngles.push({
        angle: 'Topical Authority Superiority',
        recommendation: `Dominate long-tail search intent around "${primaryKeywords[0]}" with comprehensive original data and implementation frameworks.`,
      });
    }
  }

  return {
    competitors,
    counterPositioning: fallbackAngles,
    count: competitors.length,
  };
}

module.exports = {
  analyzeCompetitors: analyzeCompetitorsWithLLM,
};
