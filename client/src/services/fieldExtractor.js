/**
 * fieldExtractor.js (client-side)
 *
 * Extracts placeholder field metadata from TipTap editor JSON.
 * Used for the live Fields Panel on the right side of the UI.
 * Mirrors the server-side extraction logic for consistency.
 */

/**
 * Recursively walk TipTap JSON and collect placeholder nodes.
 */
function walkNodes(node, collected) {
  if (!node) return;

  if (node.type === 'placeholder' && node.attrs) {
    const { key, label, type, required, helpText, options } = node.attrs;
    if (key && !collected.has(key)) {
      collected.set(key, {
        key,
        label: label || key,
        type: type || 'text',
        required: required !== undefined ? required : false,
        helpText: helpText || '',
        options: options || [],
      });
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      walkNodes(child, collected);
    }
  }
}

/**
 * Extract unique field definitions from a TipTap JSON document.
 * @param {Object} doc - The TipTap document JSON
 * @returns {Array} Deduplicated array of field metadata objects
 */
export function extractFields(doc) {
  if (!doc) return [];
  const collected = new Map();
  walkNodes(doc, collected);
  return Array.from(collected.values());
}
