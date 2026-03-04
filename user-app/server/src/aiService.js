/**
 * aiService.js
 *
 * GPT-4o integration for the POC module.
 * Two main functions:
 *   1. analyzeDeficiencies — parse CMS-2567 full text and extract structured
 *      deficiency narratives per F-Tag.
 *   2. generatePocDraft — given a deficiency narrative and an admin template,
 *      generate a 4-step Plan of Correction draft.
 */

const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// NARRATIVE EXTRACTION
// ---------------------------------------------------------------------------

const NARRATIVE_SYSTEM_PROMPT = `You are an expert at reading CMS-2567 Statement of Deficiencies documents used in long-term care regulatory compliance.

You will receive:
1. The full text of a CMS-2567 document
2. A list of F-Tag numbers found in the document

For EACH F-Tag, extract the COMPLETE deficiency finding narrative. This includes:
- The full description of what the surveyors found wrong
- Any resident examples or scenarios described
- The regulatory citation or requirement that was violated
- Severity and scope if mentioned (e.g., "D" level, "Isolated", "Pattern", etc.)

IMPORTANT:
- A single F-Tag's narrative can span MULTIPLE PAGES. Capture ALL of it.
- The CMS-2567 is a two-column form. The LEFT column has F-Tag identifiers and severity codes. The RIGHT column has the detailed narrative findings. Both columns' text is interleaved in the extracted text.
- Look for patterns like "F XXXX" or "F-XXXX" followed by narrative text that describes the deficiency.
- The narrative for one F-Tag ends when the next F-Tag section begins, or when the document ends.
- If you cannot find a narrative for a given F-Tag, return an empty string for that tag's narrative.

ALSO extract the CMS-2567 header/form fields if they appear in the document text:
- Provider/Supplier/CLIA Identification Number
- Facility name
- Facility address (street, city, state, zip)
- Date survey completed
- Building and Wing (if applicable)
- Name of accrediting organization (if applicable)

For EACH deficiency, also generate:
- "summary": A 2-3 sentence plain-English summary covering: what the deficiency is, who was affected, and what evidence the surveyor cited. This must ONLY reflect what is explicitly stated in the document. Do NOT infer, assume, or add context beyond the surveyor's findings.
- "keyPoints": An array of 2-4 short bullet-point strings highlighting the most actionable details for writing a Plan of Correction. Focus on: specific practices that failed, staff roles involved, residents affected, dates/incidents referenced, and regulatory requirements cited. Each bullet should be one concise sentence. Only include details explicitly stated in the text.

Return ONLY a valid JSON object in this format:
{
  "header": {
    "providerNumber": "string or null",
    "facilityName": "string or null",
    "facilityAddress": "string or null",
    "dateSurveyCompleted": "string or null",
    "building": "string or null",
    "wing": "string or null",
    "accreditingOrg": "string or null"
  },
  "deficiencies": [
    {
      "fTag": "F-880",
      "narrative": "The complete deficiency narrative text...",
      "severity": "D" or null,
      "scope": "Isolated" or "Pattern" or "Widespread" or null,
      "summary": "A 2-3 sentence summary of the deficiency...",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}`;

/**
 * Send full CMS-2567 text + identified F-Tags to GPT-4o to extract
 * structured deficiency narratives.
 *
 * For long documents, the text is chunked to stay within token limits,
 * but all F-Tags are sent with each chunk so the model can find narratives
 * that may span page boundaries.
 */
async function analyzeDeficiencies(fullText, fTags) {
  const fTagList = fTags.map((t) => t.normalized || t).join(', ');

  const MAX_CHARS = 80000;
  if (fullText.length <= MAX_CHARS) {
    return await callNarrativeExtraction(fullText, fTagList);
  }

  // Chunk for very long documents, overlapping by 2000 chars for continuity
  const chunks = [];
  for (let i = 0; i < fullText.length; i += MAX_CHARS - 2000) {
    chunks.push(fullText.slice(i, i + MAX_CHARS));
  }

  const results = await Promise.all(
    chunks.map((chunk) => callNarrativeExtraction(chunk, fTagList))
  );

  // Merge: for each F-Tag, pick the longest narrative found across chunks
  const merged = {};
  let header = null;
  for (const result of results) {
    if (result.header && !header) header = result.header;
    for (const d of result.deficiencies || []) {
      const key = d.fTag;
      if (!merged[key] || (d.narrative && d.narrative.length > (merged[key].narrative || '').length)) {
        merged[key] = d;
      }
    }
  }

  return { header, deficiencies: Object.values(merged) };
}

async function callNarrativeExtraction(text, fTagList) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 16000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: NARRATIVE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the full text of a CMS-2567 document. The following F-Tags were identified: ${fTagList}\n\nExtract the complete deficiency narrative for each F-Tag.\n\n--- DOCUMENT TEXT ---\n${text}`,
      },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// POC DRAFT GENERATION
// ---------------------------------------------------------------------------

const POC_DRAFT_SYSTEM_PROMPT = `You are an expert in long-term care regulatory compliance and Plan of Correction (POC) writing.

You will receive:
1. An F-Tag number and its deficiency narrative (what surveyors found wrong)
2. Optionally, a reference template for this F-Tag from the facility's template library

Generate a 4-step Plan of Correction draft that the facility can customize. The 4 steps are:

STEP 1 — "What Went Wrong / Immediate Action Taken"
- Acknowledge the specific deficiency cited
- Describe what immediate corrective action was taken to address the issue
- Reference specific residents affected if mentioned in the narrative

STEP 2 — "Scope and Impact Assessment"
- Explain how the facility determined whether other residents were affected
- Describe the review process (e.g., audit of records, review of residents)
- State the scope of the issue

STEP 3 — "Education and Prevention Measures"
- Describe staff education or training to prevent recurrence
- Reference specific policies or procedures that will be updated
- Include who will be trained and on what topics

STEP 4 — "Ongoing Monitoring Plan"
- Describe how the facility will monitor for ongoing compliance
- Include frequency of monitoring (e.g., weekly, monthly)
- Specify who is responsible for monitoring
- Include how long monitoring will continue

IMPORTANT GUIDELINES:
- Write in first person from the facility's perspective ("The facility will...")
- Be specific but leave room for facility customization
- Use professional, regulatory-appropriate language
- If a template is provided, draw inspiration from its structure but tailor content to the specific deficiency
- Include placeholder dates in the format [DATE] where specific dates are needed
- KEEP IT CONCISE: Each step should be 4-5 lines total (a short paragraph). Do NOT write multiple paragraphs. Be direct and actionable.

Return ONLY a valid JSON object:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "What Went Wrong / Immediate Action Taken",
      "content": "The detailed draft text..."
    },
    {
      "stepNumber": 2,
      "title": "Scope and Impact Assessment",
      "content": "..."
    },
    {
      "stepNumber": 3,
      "title": "Education and Prevention Measures",
      "content": "..."
    },
    {
      "stepNumber": 4,
      "title": "Ongoing Monitoring Plan",
      "content": "..."
    }
  ]
}`;

/**
 * Generate a 4-step POC draft for a single deficiency.
 *
 * @param {string} fTag - e.g. "F-880"
 * @param {string} narrative - The full deficiency narrative
 * @param {string|null} templateContent - Optional admin template text for reference
 */
async function generatePocDraft(fTag, narrative, templateContent) {
  let userMessage = `F-Tag: ${fTag}\n\nDeficiency Narrative:\n${narrative}`;

  if (templateContent) {
    userMessage += `\n\n--- REFERENCE TEMPLATE ---\n${templateContent}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: POC_DRAFT_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// SINGLE STEP DRAFT GENERATION
// ---------------------------------------------------------------------------

const SINGLE_STEP_SYSTEM_PROMPT = `You are an expert in long-term care regulatory compliance and Plan of Correction (POC) writing.

You will receive:
1. An F-Tag number and its deficiency narrative (what surveyors found wrong)
2. The specific POC step number and title to generate
3. Optionally, a reference template for this F-Tag from the facility's template library

The 4 POC steps and what each should contain:

STEP 1 — "What Went Wrong / Immediate Action Taken"
- Acknowledge the specific deficiency cited
- Describe what immediate corrective action was taken to address the issue
- Reference specific residents affected if mentioned in the narrative

STEP 2 — "Scope and Impact Assessment"
- Explain how the facility determined whether other residents were affected
- Describe the review process (e.g., audit of records, review of residents)
- State the scope of the issue

STEP 3 — "Education and Prevention Measures"
- Describe staff education or training to prevent recurrence
- Reference specific policies or procedures that will be updated
- Include who will be trained and on what topics

STEP 4 — "Ongoing Monitoring Plan"
- Describe how the facility will monitor for ongoing compliance
- Include frequency of monitoring (e.g., weekly, monthly)
- Specify who is responsible for monitoring
- Include how long monitoring will continue

IMPORTANT GUIDELINES:
- Write in first person from the facility's perspective ("The facility will...")
- Be specific but leave room for facility customization
- Use professional, regulatory-appropriate language
- If a template is provided, draw inspiration from its structure but tailor content to the specific deficiency
- Include placeholder dates in the format [DATE] where specific dates are needed
- KEEP IT CONCISE: Each step should be 4-5 lines total (a short paragraph). Do NOT write multiple paragraphs. Be direct and actionable.

Generate ONLY the requested step. Return ONLY a valid JSON object:
{
  "stepNumber": <number>,
  "title": "<step title>",
  "content": "The detailed draft text..."
}`;

/**
 * Generate a single POC step draft for a deficiency.
 *
 * @param {string} fTag - e.g. "F-880"
 * @param {string} narrative - The full deficiency narrative
 * @param {number} stepNumber - 1-4
 * @param {string} stepTitle - e.g. "What Went Wrong / Immediate Action Taken"
 * @param {string|null} templateContent - Optional admin template text for reference
 */
async function generateSingleStepDraft(fTag, narrative, stepNumber, stepTitle, templateContent) {
  let userMessage = `F-Tag: ${fTag}\n\nDeficiency Narrative:\n${narrative}\n\nGenerate ONLY Step ${stepNumber} — "${stepTitle}"\n\nREMINDER: Keep the response to exactly 4-5 lines. One short paragraph only. No bullet points, no multiple paragraphs.`;

  if (templateContent) {
    userMessage += `\n\n--- REFERENCE TEMPLATE ---\n${templateContent}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SINGLE_STEP_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  return JSON.parse(cleaned);
}

/**
 * Extract plain text from TipTap JSON content for use as template reference.
 * Recursively walks the node tree and concatenates text nodes.
 */
function tiptapToPlainText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!Array.isArray(node.content)) return '';

  return node.content.map((child) => {
    if (child.type === 'text') return child.text || '';
    if (child.type === 'heading' || child.type === 'paragraph') {
      return tiptapToPlainText(child) + '\n';
    }
    if (child.type === 'bulletList' || child.type === 'orderedList') {
      return child.content
        .map((li) => '  - ' + tiptapToPlainText(li))
        .join('\n') + '\n';
    }
    if (child.type === 'placeholder' && child.attrs) {
      return `[${child.attrs.label || child.attrs.key}]`;
    }
    return tiptapToPlainText(child);
  }).join('');
}

// ---------------------------------------------------------------------------
// TEMPLATE GUIDANCE CLASSIFICATION
// ---------------------------------------------------------------------------

const TEMPLATE_CLASSIFICATION_PROMPT = `You are an expert at CMS long-term care regulatory compliance documentation.

You will receive:
1. The plain text content of an F-Tag template document
2. The 4 POC step definitions

Your task is to CLASSIFY each meaningful piece of content from the template into which POC step(s) it is relevant to.

The 4 POC steps are:
- Step 1: "What Went Wrong / Immediate Action Taken" — Acknowledging the deficiency, describing immediate corrective actions, referencing affected residents
- Step 2: "Scope and Impact Assessment" — Determining if other residents were affected, audit/review process, scope of the issue
- Step 3: "Education and Prevention Measures" — Staff training, policy/procedure updates, prevention strategies
- Step 4: "Ongoing Monitoring Plan" — Compliance monitoring, frequency, responsible parties, duration

CRITICAL RULES:
- You MUST only use text that exists VERBATIM in the template. Do NOT rephrase, summarize, add, or modify any text.
- Extract every question, instruction, regulation reference, policy mention, table header, placeholder field, and guidance point from the template.
- Classify each extracted piece into one or more steps (1-4).
- If a piece of content is relevant to multiple steps, include it under each relevant step.
- Do NOT skip any content. Be EXHAUSTIVE. Include everything that could help someone write that step.
- If a piece of content is general/header information (like the F-Tag title), classify it under ALL steps.

Return ONLY a valid JSON object:
{
  "step1": [
    { "type": "question|instruction|regulation|policy|field|heading|table_info", "text": "exact text from template" }
  ],
  "step2": [...],
  "step3": [...],
  "step4": [...]
}

Types explained:
- "question": A question the user should answer
- "instruction": A directive or guidance statement
- "regulation": A regulatory citation or requirement
- "policy": A policy/procedure reference
- "field": A placeholder field that needs to be filled
- "heading": A section heading providing context
- "table_info": Information from a table (combine header + context)`;

/**
 * Classify template content into step-specific guidance.
 * Returns the classified content for all 4 steps.
 *
 * @param {string} templatePlainText - The template content as plain text
 * @returns {Object} - { step1: [...], step2: [...], step3: [...], step4: [...] }
 */
async function classifyTemplateGuidance(templatePlainText) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TEMPLATE_CLASSIFICATION_PROMPT },
      {
        role: 'user',
        content: `Here is the F-Tag template content. Classify ALL content into the relevant POC steps.\n\n--- TEMPLATE CONTENT ---\n${templatePlainText}`,
      },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/,'');
  }

  return JSON.parse(cleaned);
}

/**
 * Verify that classified guidance text actually exists in the original template.
 * Strips items whose text doesn't appear (fuzzy match: normalized whitespace).
 *
 * @param {Object} classification - { step1: [...], step2: [...], ... }
 * @param {string} templatePlainText - The original template text
 * @returns {Object} - Verified classification with only matching items
 */
function verifyClassification(classification, templatePlainText) {
  // Normalize whitespace for comparison
  const normalizedTemplate = templatePlainText.replace(/\s+/g, ' ').toLowerCase();

  const verified = {};
  for (const stepKey of ['step1', 'step2', 'step3', 'step4']) {
    const items = classification[stepKey] || [];
    verified[stepKey] = items.filter((item) => {
      if (!item.text || typeof item.text !== 'string') return false;
      const normalizedItem = item.text.replace(/\s+/g, ' ').toLowerCase().trim();
      if (normalizedItem.length < 3) return false;
      // Check if the text (or a substantial substring) exists in the template
      // Use a sliding window approach for longer texts that might be slightly split
      if (normalizedTemplate.includes(normalizedItem)) return true;
      // For longer texts, check if at least 80% of words appear in sequence
      if (normalizedItem.length > 30) {
        const words = normalizedItem.split(' ');
        const threshold = Math.ceil(words.length * 0.7);
        for (let i = 0; i <= words.length - threshold; i++) {
          const substring = words.slice(i, i + threshold).join(' ');
          if (normalizedTemplate.includes(substring)) return true;
        }
      }
      return false;
    });
  }

  return verified;
}

// ---------------------------------------------------------------------------
// AI ASSIST: Question Generation
// ---------------------------------------------------------------------------

const ASSIST_QUESTIONS_PROMPT = `You are an expert in CMS long-term care regulatory compliance and Plan of Correction (POC) writing.

You will receive:
1. An F-Tag number and its deficiency narrative
2. The specific POC step number and title
3. The F-Tag template content (regulatory guidance document)

Your task is to generate 3-4 targeted questions that will help a facility administrator write this specific POC step. The questions should:
- Be specific to the deficiency cited and the step being written
- Draw from the F-Tag template's regulatory requirements and guidance
- Help the user provide concrete, facility-specific details
- Be answerable with short text responses (1-3 sentences each)

The 4 POC steps and their focus:
- Step 1: "What Went Wrong / Immediate Action Taken" — What happened, what corrective action was taken immediately
- Step 2: "Scope and Impact Assessment" — How the facility determined scope, who else was affected, review process
- Step 3: "Education and Prevention Measures" — Staff training, policy updates, prevention strategies
- Step 4: "Ongoing Monitoring Plan" — Monitoring frequency, responsible parties, duration, metrics

IMPORTANT RULES:
- Questions must be relevant to BOTH the specific deficiency AND the step being written
- Use the template content to inform question topics but do NOT quote regulatory text verbatim
- Make questions practical and answerable by a facility administrator
- Each question should have a "hint" — a brief example of what a good answer looks like
- Each question should have a "type" — "text" for short answers, "textarea" for longer answers

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text",
      "hint": "Example: A brief example of a good answer",
      "type": "text|textarea"
    }
  ]
}`;

/**
 * Generate step-specific AI Assist questions.
 *
 * @param {string} fTag
 * @param {string} narrative
 * @param {number} stepNumber
 * @param {string} stepTitle
 * @param {string|null} templateContent
 * @returns {Object} - { questions: [...] }
 */
async function generateAssistQuestions(fTag, narrative, stepNumber, stepTitle, templateContent) {
  let userMessage = `F-Tag: ${fTag}\n\nDeficiency Narrative:\n${narrative}\n\nGenerate questions for Step ${stepNumber} — "${stepTitle}"`;

  if (templateContent) {
    userMessage += `\n\n--- F-TAG TEMPLATE CONTENT ---\n${templateContent}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ASSIST_QUESTIONS_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// AI ASSIST: Draft from User Answers
// ---------------------------------------------------------------------------

const ASSISTED_DRAFT_PROMPT = `You are an expert in long-term care regulatory compliance and Plan of Correction (POC) writing.

You will receive:
1. An F-Tag number and its deficiency narrative
2. The specific POC step number and title
3. The user's answers to targeted questions about this step
4. Optionally, F-Tag template content for regulatory context

Your task is to generate a well-written POC step draft that incorporates ALL of the user's answers into professional, regulatory-appropriate language.

IMPORTANT GUIDELINES:
- Write in first person from the facility's perspective ("The facility will...")
- Incorporate EVERY detail the user provided in their answers — do not omit anything
- Use professional, regulatory-appropriate language
- Keep it concise: 4-6 sentences in one paragraph
- Do NOT add information the user didn't provide — only use their answers and the deficiency context
- Include placeholder dates as [DATE] only if the user didn't provide specific dates
- Make the language flow naturally as a single cohesive paragraph

Return ONLY a valid JSON object:
{
  "content": "The generated POC step text..."
}`;

/**
 * Generate a POC step draft from user-provided answers.
 *
 * @param {string} fTag
 * @param {string} narrative
 * @param {number} stepNumber
 * @param {string} stepTitle
 * @param {Array} questionsAndAnswers - [{ question, answer }]
 * @param {string|null} templateContent
 * @returns {Object} - { content: "..." }
 */
async function generateAssistedDraft(fTag, narrative, stepNumber, stepTitle, questionsAndAnswers, templateContent) {
  const qaText = questionsAndAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  let userMessage = `F-Tag: ${fTag}\n\nDeficiency Narrative:\n${narrative}\n\nStep ${stepNumber} — "${stepTitle}"\n\nUser's Answers:\n${qaText}`;

  if (templateContent) {
    userMessage += `\n\n--- F-TAG TEMPLATE CONTENT ---\n${templateContent}`;
  }

  userMessage += `\n\nGenerate a cohesive POC step paragraph incorporating ALL of the user's answers above.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ASSISTED_DRAFT_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  return JSON.parse(cleaned);
}

module.exports = {
  analyzeDeficiencies,
  generatePocDraft,
  generateSingleStepDraft,
  tiptapToPlainText,
  classifyTemplateGuidance,
  verifyClassification,
  generateAssistQuestions,
  generateAssistedDraft,
};
