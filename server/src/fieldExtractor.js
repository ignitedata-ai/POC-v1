/**
 * fieldExtractor.js
 *
 * Server-side utility to extract placeholder field metadata from TipTap JSON.
 *
 * Walks the TipTap document tree recursively, collects all nodes of type
 * "placeholder", and returns a deduplicated array of field definitions
 * keyed by `key`. This is the source of truth for field_schema_json
 * stored in the database.
 */

/**
 * Recursively walk TipTap JSON nodes and collect placeholder nodes.
 *
 * @param {Object} node - A TipTap JSON node (document, paragraph, etc.)
 * @param {Map} collected - Map keyed by placeholder `key` to deduplicate
 */
function walkNodes(node, collected) {
  if (!node) return;

  // If this node is a placeholder, collect its attributes
  if (node.type === 'placeholder' && node.attrs) {
    const { key, label, type, required, helpText, options } = node.attrs;
    // Only add if we haven't seen this key before (dedup by key)
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

  // Recurse into child content
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      walkNodes(child, collected);
    }
  }

  // Also check table structures (rows, cells, etc.)
  if (Array.isArray(node.rows)) {
    for (const row of node.rows) {
      walkNodes(row, collected);
    }
  }
  if (Array.isArray(node.cells)) {
    for (const cell of node.cells) {
      walkNodes(cell, collected);
    }
  }
}

/**
 * Extract field schema from TipTap JSON content.
 *
 * @param {string|Object} contentJson - TipTap JSON as string or parsed object
 * @returns {Array} Array of field definition objects, deduplicated by key
 */
function extractFieldSchema(contentJson) {
  let doc;

  if (typeof contentJson === 'string') {
    try {
      doc = JSON.parse(contentJson);
    } catch {
      console.error('Failed to parse content_json for field extraction');
      return [];
    }
  } else {
    doc = contentJson;
  }

  const collected = new Map();
  walkNodes(doc, collected);
  return Array.from(collected.values());
}

module.exports = { extractFieldSchema };
