const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'extraction-audit.jsonl');

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('[AuditLog] Could not create log directory:', err.message);
  }
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}

/**
 * Append one audit record. Never throws — logging failures must not break
 * the request that triggered them.
 *
 * This is the raw material for answering "how do we know the data was
 * extracted correctly": every analysis leaves a record of which method(s)
 * were used, whether they agreed, and a content hash so the exact source
 * can be manually re-checked later if a result is ever disputed.
 */
function logExtraction(record) {
  try {
    ensureLogDir();
    const entry = {
      timestamp: new Date().toISOString(),
      ...record,
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[AuditLog] Failed to write audit record:', err.message);
  }
}

module.exports = { logExtraction, hashContent };
