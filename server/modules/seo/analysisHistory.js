const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', '..', 'logs', 'analysis-history.json');
const MAX_ENTRIES_PER_TARGET = 5;

function normalizeKey(target) {
  return (target || '').trim().toLowerCase();
}

function readStore() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return {};
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('[AnalysisHistory] Failed to read history file, starting fresh:', err.message);
    return {};
  }
}

function writeStore(store) {
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[AnalysisHistory] Failed to write history file:', err.message);
  }
}

/**
 * Compare a freshly-completed analysis against the most recent prior
 * analysis of the same target, then record this run for next time.
 *
 * This answers a concrete, checkable question: "if I re-analyze the same
 * page/file, do I get a consistent result, or does it jump around?"
 * Consistency across repeated runs is itself evidence of reliability —
 * inconsistency is a real red flag worth surfacing, not hiding.
 *
 * @param {string} target - URL or filename identifying what was analyzed
 * @param {object} current - { score, wordCount, contentHash, confidence }
 * @returns {object} consistencyCheck result to attach to the API response
 */
function checkAndRecordConsistency(target, current) {
  const key = normalizeKey(target);
  const store = readStore();
  const history = store[key] || [];
  const previous = history[history.length - 1];

  let result;

  if (!previous) {
    result = {
      hasPriorAnalysis: false,
      label: 'first-analysis',
    };
  } else {
    const scoreDelta = current.score - previous.score;
    const contentUnchanged = previous.contentHash === current.contentHash;

    let label;
    if (contentUnchanged && scoreDelta !== 0) {
      // The exact same content produced a different score — the analyzer
      // should be deterministic for identical input, so this indicates a
      // real bug worth investigating, not normal variation.
      label = 'inconsistent-scoring-anomaly';
    } else if (contentUnchanged) {
      label = 'unchanged';
    } else if (Math.abs(scoreDelta) <= 5) {
      label = 'minor-drift';
    } else {
      label = 'significant-change';
    }

    result = {
      hasPriorAnalysis: true,
      previousAnalyzedAt: previous.timestamp,
      previousScore: previous.score,
      scoreDelta,
      contentUnchanged,
      label,
    };
  }

  history.push({
    timestamp: new Date().toISOString(),
    engine: current.engine || 'default',
    score: current.score,
    wordCount: current.wordCount,
    headingsCount: current.headingsCount || 0,
    tablesCount: current.tablesCount || 0,
    contentHash: current.contentHash,
    confidence: current.confidence,
  });

  store[key] = history.slice(-MAX_ENTRIES_PER_TARGET);
  writeStore(store);

  return result;
}

module.exports = { checkAndRecordConsistency };