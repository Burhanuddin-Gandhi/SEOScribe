const { parseWithLocal } = require('./localParser');
const { parseWithLlamaParse } = require('./llamaParseAdapter');
const { parseWithGemini } = require('./geminiDocAdapter');

const ENGINES = {
  LOCAL: 'local',
  LLAMAPARSE: 'llama-parse',
  GEMINI: 'gemini',
};

/**
 * Returns a list of active production engines based on env keys.
 */
function getConfiguredEngines() {
  const list = [{ id: ENGINES.LOCAL, name: 'Local Baseline (Free)', ready: true }];

  if (process.env.LLAMA_CLOUD_API_KEY && !process.env.LLAMA_CLOUD_API_KEY.includes('your-key')) {
    list.push({ id: ENGINES.LLAMAPARSE, name: 'LlamaParse (LlamaIndex)', ready: true });
  } else {
    list.push({ id: ENGINES.LLAMAPARSE, name: 'LlamaParse (LlamaIndex)', ready: false, reason: 'Missing LLAMA_CLOUD_API_KEY' });
  }

  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your-key')) {
    list.push({ id: ENGINES.GEMINI, name: 'Google Gemini 2.5 Flash', ready: true });
  } else {
    list.push({ id: ENGINES.GEMINI, name: 'Google Gemini 2.5 Flash', ready: false, reason: 'Missing GEMINI_API_KEY' });
  }

  return list;
}

/**
 * Dispatches parsing to the requested engine.
 */
async function parseWithEngine(pdfBuffer, filename, requestedEngine = 'llama-parse') {
  const engine = (requestedEngine || process.env.PDF_PARSER_ENGINE || 'llama-parse').toLowerCase();

  switch (engine) {
    case ENGINES.GEMINI:
      return await parseWithGemini(pdfBuffer, filename);

    case ENGINES.LOCAL:
      return await parseWithLocal(pdfBuffer, filename);

    case ENGINES.LLAMAPARSE:
    default:
      return await parseWithLlamaParse(pdfBuffer, filename);
  }
}

module.exports = {
  ENGINES,
  getConfiguredEngines,
  parseWithEngine,
  parseWithLocal,
  parseWithLlamaParse,
  parseWithGemini,
};
