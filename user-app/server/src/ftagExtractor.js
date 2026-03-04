/**
 * ftagExtractor.js
 *
 * Extracts F-Tag citations from text using regex.
 * Handles all common forms: F880, F-880, F 880, f880, f-880, f 880
 * Normalizes to uppercase "F-###" or "F-####" format.
 * Deduplicates while preserving first-seen order.
 * Provides context snippets around each match.
 */

// Matches F-Tag patterns: F880, F-880, F 880, F0655, F-0880 (case-insensitive)
// Allows leading zeros followed by 3-4 significant digits.
// Word boundary \b prevents matching inside longer strings like "FF8800"
const FTAG_REGEX = /\b[fF]\s*[-]?\s*(0*\d{3,4})\b/g;

// Characters of context to show before and after each match
const CONTEXT_CHARS = 30;

/**
 * Extract all F-Tag citations from text.
 *
 * @param {string} text - The full document text
 * @returns {Object[]} Array of deduplicated tag objects, in first-seen order
 */
function extractFTags(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Map: normalized tag -> tag object (preserves insertion order)
  const tagMap = new Map();
  let firstSeenCounter = 0;
  let match;

  // Reset regex state
  FTAG_REGEX.lastIndex = 0;

  while ((match = FTAG_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const rawDigits = match[1];
    // Strip leading zeros: "0655" -> "655", "0880" -> "880"
    const digits = rawDigits.replace(/^0+/, '');
    // After stripping, must still be 3-4 digits (skip if not)
    if (digits.length < 3 || digits.length > 4) continue;
    const normalized = `F-${digits}`;
    const start = match.index;
    const end = start + raw.length;

    // Build context snippet
    const contextStart = Math.max(0, start - CONTEXT_CHARS);
    const contextEnd = Math.min(text.length, end + CONTEXT_CHARS);
    const before = text.slice(contextStart, start);
    const after = text.slice(end, contextEnd);
    const context = `${contextStart > 0 ? '...' : ''}${before}[${raw}]${after}${contextEnd < text.length ? '...' : ''}`;

    const matchObj = { raw, start, end, context };

    if (tagMap.has(normalized)) {
      const existing = tagMap.get(normalized);
      existing.matches.push(matchObj);
      // Track unique raw forms
      if (!existing.rawForms.has(raw.trim())) {
        existing.rawForms.add(raw.trim());
      }
    } else {
      const entry = {
        normalized,
        digits,
        matches: [matchObj],
        rawForms: new Set([raw.trim()]),
        firstSeenIndex: firstSeenCounter++,
        confidence: 'HIGH', // regex from clear text = HIGH
      };
      tagMap.set(normalized, entry);
    }
  }

  // Convert to plain array, convert Sets to Arrays
  return Array.from(tagMap.values()).map((tag) => ({
    normalized: tag.normalized,
    digits: tag.digits,
    matches: tag.matches,
    rawForms: Array.from(tag.rawForms),
    firstSeenIndex: tag.firstSeenIndex,
    confidence: tag.confidence,
    count: tag.matches.length,
  }));
}

module.exports = { extractFTags };
