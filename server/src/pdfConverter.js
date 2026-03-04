/**
 * pdfConverter.js
 *
 * Converts uploaded PDF documents into TipTap JSON format using OpenAI GPT-4o.
 *
 * Flow:
 *   1. Extract raw text from the PDF buffer using pdfjs-dist
 *   2. Split the text into page-group chunks (to stay within token limits)
 *   3. Send each chunk to GPT-4o with a detailed system prompt
 *   4. Merge the chunk results into a single TipTap document
 *   5. Post-process to ensure unique placeholder IDs
 *
 * The LLM handles all structural analysis: headings, paragraphs, lists,
 * tables, bold/italic marks, and placeholder detection with semantic keys.
 */

const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Maximum pages per GPT-4o request. Keeps output tokens manageable
 * (each page generates ~1,500–3,000 output tokens of TipTap JSON).
 */
const PAGES_PER_CHUNK = 3;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a document structure expert. Convert raw PDF text into valid TipTap/ProseMirror JSON.

Return ONLY a valid JSON object with this root structure:
{"type": "doc", "content": [...nodes]}

## Node Types

### Block nodes (children of "doc" or inside listItem/tableCell):

heading: {"type": "heading", "attrs": {"level": 1|2|3}, "content": [...inline]}
paragraph: {"type": "paragraph", "content": [...inline]}
bulletList: {"type": "bulletList", "content": [{type: "listItem", content: [{type: "paragraph", content: [...inline]}]}]}
orderedList: {"type": "orderedList", "content": [{type: "listItem", content: [{type: "paragraph", content: [...inline]}]}]}
table:
{
  "type": "table",
  "content": [
    {"type": "tableRow", "content": [
      {"type": "tableHeader", "content": [{"type": "paragraph", "content": [...inline]}]}
    ]},
    {"type": "tableRow", "content": [
      {"type": "tableCell", "content": [{"type": "paragraph", "content": [...inline]}]}
    ]}
  ]
}
horizontalRule: {"type": "horizontalRule"}

### Inline nodes (inside content arrays of paragraph/heading/tableCell/tableHeader):

text: {"type": "text", "text": "content"}
  With marks: {"type": "text", "text": "bold", "marks": [{"type": "bold"}]}
  Available marks: "bold", "italic", or both.

placeholder (for fill-in blanks):
{
  "type": "placeholder",
  "attrs": {
    "id": "<uuid-v4>",
    "key": "snake_case_key",
    "label": "Human Label",
    "type": "text|date|number|select",
    "required": true|false,
    "helpText": "",
    "options": []
  }
}

## Placeholder Rules
- Underscores (___) = placeholder. "Date: ____" → key "date", type "date"
- Parenthetical instructions "(Insert X)" → placeholder for X
- Use semantic keys: "facility_name", "completion_date", "resident_identifier"
- "Date" labels → type "date". "#"/"Number" labels → type "number"
- Each placeholder needs a unique UUID v4 for "id"
- Set required: true for names, dates, signatures

## Structure Rules
- h1 = major sections, h2 = sub-sections, h3 = sub-sub-sections
- Group numbered items into orderedList, bullets into bulletList
- Detect tabular content (columns, grids, attendance records) → table nodes
- Use tableHeader for header rows, tableCell for data rows
- Bold for labels/emphasis, italic for disclaimers/notes
- Preserve ALL text — do not summarize or omit
- Return ONLY valid JSON, no markdown fences or commentary`;

// ---------------------------------------------------------------------------
// PDF TEXT EXTRACTION
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF buffer, returning an array of per-page strings.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string[]>} Array where each element is one page's text
 */
async function extractPagesFromPdf(pdfBuffer) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const uint8Array = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  const pages = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items.filter((item) => item.str.trim() || item.hasEOL);
    let currentLine = '';
    let lastY = null;
    const lines = [];

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) lines.push(currentLine);
        currentLine = item.str;
      } else {
        currentLine += item.str;
      }
      lastY = y;
      if (item.hasEOL) {
        if (currentLine.trim()) lines.push(currentLine);
        currentLine = '';
        lastY = null;
      }
    }
    if (currentLine.trim()) lines.push(currentLine);

    pages.push(lines.join('\n'));
  }

  return pages;
}

// ---------------------------------------------------------------------------
// GPT-4o CONVERSION (per chunk)
// ---------------------------------------------------------------------------

/**
 * Send a text chunk to GPT-4o and get back TipTap JSON content nodes.
 *
 * @param {string} text - The text for this chunk (1–3 pages)
 * @param {number} chunkIndex - Which chunk this is (for context in the prompt)
 * @param {number} totalChunks - Total number of chunks
 * @returns {Promise<Array>} Array of TipTap block nodes
 */
async function convertChunkWithAI(text, chunkIndex, totalChunks) {
  const contextNote = totalChunks > 1
    ? `This is section ${chunkIndex + 1} of ${totalChunks} from a multi-page document. Convert this section independently.`
    : 'This is the complete document.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 16000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${contextNote}\n\nConvert this PDF text into TipTap JSON. Preserve ALL content, detect fill-in blanks as placeholder nodes, and structure headings/lists/tables properly.\n\n${text}`,
      },
    ],
  });

  const jsonString = response.choices[0].message.content;

  let parsed;
  try {
    let cleaned = jsonString.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error(`[pdfConverter] Chunk ${chunkIndex + 1}/${totalChunks} returned invalid JSON:`, parseErr.message);
    console.error('[pdfConverter] Response preview:', jsonString.substring(0, 300));
    throw new Error(`AI returned invalid JSON for section ${chunkIndex + 1}. Please try again.`);
  }

  // Extract content nodes — handle both {type:"doc",content:[...]} and bare arrays
  if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
    return parsed.content;
  }
  if (Array.isArray(parsed.content)) {
    return parsed.content;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error(`Unexpected AI response structure for section ${chunkIndex + 1}.`);
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTION
// ---------------------------------------------------------------------------

/**
 * Convert a PDF buffer into TipTap JSON using GPT-4o.
 *
 * For documents longer than PAGES_PER_CHUNK pages, the text is split into
 * chunks and processed in parallel, then merged into a single document.
 *
 * @param {Buffer} pdfBuffer - The raw PDF file buffer
 * @returns {Promise<Object>} TipTap document JSON
 */
async function convertPdfToTiptap(pdfBuffer) {
  // Step 1: Extract per-page text
  const pages = await extractPagesFromPdf(pdfBuffer);

  const nonEmptyPages = pages.filter((p) => p.trim());
  if (nonEmptyPages.length === 0) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'No text content could be extracted from this PDF.' }],
        },
      ],
    };
  }

  // Step 2: Group pages into chunks
  const chunks = [];
  for (let i = 0; i < nonEmptyPages.length; i += PAGES_PER_CHUNK) {
    const chunkPages = nonEmptyPages.slice(i, i + PAGES_PER_CHUNK);
    chunks.push(chunkPages.join('\n\n--- PAGE BREAK ---\n\n'));
  }

  console.log(`[pdfConverter] Processing ${nonEmptyPages.length} pages in ${chunks.length} chunk(s)...`);

  // Step 3: Process all chunks in parallel
  const chunkResults = await Promise.all(
    chunks.map((text, idx) => convertChunkWithAI(text, idx, chunks.length))
  );

  // Step 4: Merge all chunk content nodes into a single document
  const allNodes = chunkResults.flat();

  // Step 5: Post-process — ensure unique placeholder IDs
  const doc = { type: 'doc', content: allNodes };
  ensureUniqueIds(doc);

  console.log(`[pdfConverter] Conversion complete. ${allNodes.length} top-level nodes.`);

  return doc;
}

// ---------------------------------------------------------------------------
// POST-PROCESSING
// ---------------------------------------------------------------------------

/**
 * Walk the TipTap JSON tree and ensure every placeholder node has a unique
 * UUID v4 for its "id" attribute.
 */
function ensureUniqueIds(node) {
  if (!node) return;
  if (node.type === 'placeholder' && node.attrs) {
    node.attrs.id = uuidv4();
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      ensureUniqueIds(child);
    }
  }
}

module.exports = { convertPdfToTiptap };
