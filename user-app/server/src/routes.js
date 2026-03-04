/**
 * routes.js
 *
 * User App API routes:
 *
 * EXISTING (F-Tag extraction):
 *   POST /api/2567/upload   - Upload CMS-2567 PDF and extract F-Tags
 *   POST /api/2567/paste    - Paste text and extract F-Tags
 *
 * NEW (POC module):
 *   POST /api/2567/analyze  - AI-powered narrative extraction per F-Tag
 *   GET  /api/sessions      - List all sessions
 *   GET  /api/sessions/:id  - Full session detail with deficiencies + steps
 *   DELETE /api/sessions/:id - Delete a session
 *   POST /api/poc/draft     - Generate AI POC draft for a deficiency
 *   PUT  /api/poc/steps/:id - Save user edits to a POC step
 *   GET  /api/poc/export/:sessionId - Export formatted POC text
 *
 * ADMIN PROXY:
 *   GET  /api/admin/templates      - List templates from admin API
 *   GET  /api/admin/templates/:id  - Get specific template content
 */

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { extractTextFromPdf } = require('./pdfExtractor');
const { extractFTags } = require('./ftagExtractor');
const { db, STEP_TITLES } = require('./database');
const { analyzeDeficiencies, generatePocDraft, generateSingleStepDraft, tiptapToPlainText, classifyTemplateGuidance, verifyClassification, generateAssistQuestions, generateAssistedDraft } = require('./aiService');
const { generateCms2567Pdf } = require('./pdfGenerator');

const ADMIN_API_BASE_URL = 'http://localhost:3001';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'), false);
    }
  },
});

const router = express.Router();

// ---------------------------------------------------------------------------
// EXISTING: F-Tag extraction
// ---------------------------------------------------------------------------

function buildExtractionResult(extractionText, statsText, fileName) {
  const words = statsText.split(/\s+/).filter(Boolean).length;
  const tags = extractFTags(extractionText);
  return { fileName, textStats: { chars: statsText.length, words }, tags };
}

router.post('/2567/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { fullText, leftColumnText } = await extractTextFromPdf(req.file.buffer);

    if (!fullText || fullText.trim().length < 10) {
      return res.status(422).json({
        error: 'Could not extract text from this PDF. The file may be image-based.',
      });
    }

    const result = buildExtractionResult(leftColumnText, fullText, req.file.originalname);
    result.fullText = fullText;
    res.json(result);
  } catch (err) {
    console.error('[API] PDF upload error:', err.message);
    res.status(500).json({ error: `Failed to process PDF: ${err.message}` });
  }
});

router.post('/2567/paste', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }
    const result = buildExtractionResult(text, text, 'Pasted Text');
    result.fullText = text;
    res.json(result);
  } catch (err) {
    console.error('[API] Paste extraction error:', err.message);
    res.status(500).json({ error: `Failed to extract F-Tags: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// NEW: Analyze deficiencies (AI narrative extraction)
// ---------------------------------------------------------------------------

router.post('/2567/analyze', async (req, res) => {
  try {
    const { fullText, tags, fileName } = req.body;

    if (!fullText || !tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'fullText and tags array are required' });
    }

    console.log(`[API] Analyzing ${tags.length} F-Tags for "${fileName}"...`);

    const aiResult = await analyzeDeficiencies(fullText, tags);
    const narrativeMap = {};
    for (const d of aiResult.deficiencies || []) {
      narrativeMap[d.fTag] = d;
    }

    const headerJson = aiResult.header ? JSON.stringify(aiResult.header) : null;

    // Create session
    const sessionId = uuidv4();
    db.prepare(`INSERT INTO sessions (id, file_name, full_text, header_json) VALUES (?, ?, ?, ?)`)
      .run(sessionId, fileName || 'Unknown', fullText, headerJson);

    const insertDef = db.prepare(
      `INSERT INTO deficiencies (id, session_id, f_tag, narrative, severity, scope, admin_template_id, summary, key_points, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    );
    const insertStep = db.prepare(
      `INSERT INTO poc_steps (id, deficiency_id, step_number, step_title, status)
       VALUES (?, ?, ?, ?, 'pending')`
    );

    const deficiencies = [];

    const insertAll = db.transaction(() => {
      for (const tag of tags) {
        const fTag = tag.normalized || tag;
        const ai = narrativeMap[fTag] || {};
        const defId = uuidv4();
        const adminTemplateId = tag.adminTemplateId || null;

        const summaryText = ai.summary || '';
        const keyPointsJson = ai.keyPoints ? JSON.stringify(ai.keyPoints) : null;
        insertDef.run(defId, sessionId, fTag, ai.narrative || '', ai.severity || null, ai.scope || null, adminTemplateId, summaryText, keyPointsJson);

        const steps = [];
        for (let i = 0; i < 4; i++) {
          const stepId = uuidv4();
          insertStep.run(stepId, defId, i + 1, STEP_TITLES[i]);
          steps.push({
            id: stepId,
            stepNumber: i + 1,
            stepTitle: STEP_TITLES[i],
            aiSuggestion: null,
            userContent: null,
            completionDate: null,
            status: 'pending',
          });
        }

        deficiencies.push({
          id: defId,
          fTag,
          narrative: ai.narrative || '',
          summary: ai.summary || '',
          keyPoints: ai.keyPoints || [],
          severity: ai.severity || null,
          scope: ai.scope || null,
          adminTemplateId,
          status: 'pending',
          steps,
        });
      }
    });

    insertAll();

    res.json({
      session: { id: sessionId, fileName: fileName || 'Unknown' },
      deficiencies,
    });
  } catch (err) {
    console.error('[API] Analyze error:', err.message);
    res.status(500).json({ error: `Analysis failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// Sessions CRUD
// ---------------------------------------------------------------------------

router.get('/sessions/history', (req, res) => {
  try {
    const sessions = db.prepare(`SELECT id, file_name, header_json, created_at, updated_at FROM sessions ORDER BY created_at DESC`).all();

    const result = sessions.map((s) => {
      const defs = db.prepare(`SELECT f_tag, status, severity, scope, completion_date FROM deficiencies WHERE session_id = ?`).all(s.id);
      const total = defs.length;
      const complete = defs.filter((d) => d.status === 'complete').length;
      const drafting = defs.filter((d) => d.status === 'drafting').length;
      const fTags = defs.map((d) => d.f_tag);

      let header = null;
      try { header = s.header_json ? JSON.parse(s.header_json) : null; } catch (e) {}

      return {
        id: s.id,
        fileName: s.file_name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        facilityName: header?.facilityName || null,
        facilityAddress: header?.facilityAddress || null,
        dateSurveyCompleted: header?.dateSurveyCompleted || null,
        providerNumber: header?.providerNumber || null,
        fTags,
        deficiencyCount: total,
        completedCount: complete,
        draftingCount: drafting,
        severities: defs.map((d) => d.severity).filter(Boolean),
        scopes: defs.map((d) => d.scope).filter(Boolean),
      };
    });

    // Compute analytics
    const totalReports = result.length;
    const totalFTags = result.reduce((sum, r) => sum + r.deficiencyCount, 0);
    const totalComplete = result.reduce((sum, r) => sum + r.completedCount, 0);
    const completionRate = totalFTags > 0 ? Math.round((totalComplete / totalFTags) * 100) : 0;

    // F-Tag frequency
    const ftagCounts = {};
    result.forEach((r) => r.fTags.forEach((t) => { ftagCounts[t] = (ftagCounts[t] || 0) + 1; }));
    const ftagFrequency = Object.entries(ftagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const mostCommonFTag = ftagFrequency.length > 0 ? ftagFrequency[0].tag : null;

    res.json({
      analytics: { totalReports, totalFTags, totalComplete, completionRate, mostCommonFTag, ftagFrequency },
      sessions: result,
    });
  } catch (err) {
    console.error('[API] Session history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare(`SELECT id, file_name, created_at, updated_at FROM sessions ORDER BY created_at DESC`).all();

    const result = sessions.map((s) => {
      const defs = db.prepare(`SELECT id, status FROM deficiencies WHERE session_id = ?`).all(s.id);
      const total = defs.length;
      const complete = defs.filter((d) => d.status === 'complete').length;
      return {
        id: s.id,
        fileName: s.file_name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        deficiencyCount: total,
        completedCount: complete,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[API] List sessions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id', (req, res) => {
  try {
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const defs = db.prepare(`SELECT * FROM deficiencies WHERE session_id = ? ORDER BY f_tag`).all(session.id);

    const deficiencies = defs.map((d) => {
      const steps = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? ORDER BY step_number`).all(d.id);
      let keyPoints = [];
      try { keyPoints = d.key_points ? JSON.parse(d.key_points) : []; } catch (e) {}
      return {
        id: d.id,
        fTag: d.f_tag,
        narrative: d.narrative,
        summary: d.summary || '',
        keyPoints,
        severity: d.severity,
        scope: d.scope,
        completionDate: d.completion_date || null,
        adminTemplateId: d.admin_template_id,
        status: d.status,
        steps: steps.map((s) => {
          let assistAnswers = null;
          try { assistAnswers = s.assist_answers ? JSON.parse(s.assist_answers) : null; } catch (e) {}
          return {
            id: s.id,
            stepNumber: s.step_number,
            stepTitle: s.step_title,
            aiSuggestion: s.ai_suggestion,
            userContent: s.user_content,
            completionDate: s.completion_date,
            status: s.status,
            assistAnswers,
          };
        }),
      };
    });

    let header = null;
    try { header = session.header_json ? JSON.parse(session.header_json) : null; } catch (e) {}

    res.json({
      session: {
        id: session.id,
        fileName: session.file_name,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        header,
      },
      deficiencies,
    });
  } catch (err) {
    console.error('[API] Get session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM sessions WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Delete session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/sessions/:id/header', (req, res) => {
  try {
    const session = db.prepare(`SELECT id FROM sessions WHERE id = ?`).get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const headerJson = JSON.stringify(req.body);
    db.prepare(`UPDATE sessions SET header_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(headerJson, req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('[API] Update header error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POC Draft generation
// ---------------------------------------------------------------------------

router.post('/poc/draft', async (req, res) => {
  try {
    const { deficiencyId } = req.body;
    if (!deficiencyId) {
      return res.status(400).json({ error: 'deficiencyId is required' });
    }

    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(deficiencyId);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    // Fetch admin template content if linked
    let templateContent = null;
    if (def.admin_template_id) {
      try {
        const resp = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${def.admin_template_id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.version && data.version.content_json) {
            const tiptapDoc = JSON.parse(data.version.content_json);
            templateContent = tiptapToPlainText(tiptapDoc);
          }
        }
      } catch (proxyErr) {
        console.warn('[API] Could not fetch admin template:', proxyErr.message);
      }
    }

    console.log(`[API] Generating POC draft for ${def.f_tag}...`);
    const aiDraft = await generatePocDraft(def.f_tag, def.narrative, templateContent);

    // Save AI suggestions into poc_steps
    const updateStep = db.prepare(
      `UPDATE poc_steps SET ai_suggestion = ?, updated_at = CURRENT_TIMESTAMP WHERE deficiency_id = ? AND step_number = ?`
    );

    const updateAll = db.transaction(() => {
      for (const step of aiDraft.steps || []) {
        updateStep.run(step.content, deficiencyId, step.stepNumber);
      }
      db.prepare(`UPDATE deficiencies SET status = 'drafting', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(deficiencyId);
    });

    updateAll();

    // Return updated steps
    const steps = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? ORDER BY step_number`).all(deficiencyId);

    res.json({
      deficiencyId,
      steps: steps.map((s) => ({
        id: s.id,
        stepNumber: s.step_number,
        stepTitle: s.step_title,
        aiSuggestion: s.ai_suggestion,
        userContent: s.user_content,
        completionDate: s.completion_date,
        status: s.status,
      })),
    });
  } catch (err) {
    console.error('[API] POC draft error:', err.message);
    res.status(500).json({ error: `Draft generation failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// POC Single Step Draft generation
// ---------------------------------------------------------------------------

router.post('/poc/draft-step', async (req, res) => {
  try {
    const { deficiencyId, stepNumber } = req.body;
    if (!deficiencyId || !stepNumber) {
      return res.status(400).json({ error: 'deficiencyId and stepNumber are required' });
    }

    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(deficiencyId);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    const step = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? AND step_number = ?`).get(deficiencyId, stepNumber);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Fetch admin template content if linked
    let templateContent = null;
    if (def.admin_template_id) {
      try {
        const resp = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${def.admin_template_id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.version && data.version.content_json) {
            const tiptapDoc = JSON.parse(data.version.content_json);
            templateContent = tiptapToPlainText(tiptapDoc);
          }
        }
      } catch (proxyErr) {
        console.warn('[API] Could not fetch admin template:', proxyErr.message);
      }
    }

    console.log(`[API] Generating single step draft for ${def.f_tag} Step ${stepNumber}...`);
    const aiDraft = await generateSingleStepDraft(def.f_tag, def.narrative, stepNumber, step.step_title, templateContent);

    // Save AI suggestion into the specific poc_step
    db.prepare(
      `UPDATE poc_steps SET ai_suggestion = ?, updated_at = CURRENT_TIMESTAMP WHERE deficiency_id = ? AND step_number = ?`
    ).run(aiDraft.content, deficiencyId, stepNumber);

    // Update deficiency status if still pending
    if (def.status === 'pending') {
      db.prepare(`UPDATE deficiencies SET status = 'drafting', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(deficiencyId);
    }

    res.json({
      deficiencyId,
      stepNumber,
      aiSuggestion: aiDraft.content,
    });
  } catch (err) {
    console.error('[API] Single step draft error:', err.message);
    res.status(500).json({ error: `Draft generation failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// Template guidance classification (AI-powered filtering)
// ---------------------------------------------------------------------------

router.post('/poc/template-guidance', async (req, res) => {
  try {
    const { deficiencyId } = req.body;
    if (!deficiencyId) {
      return res.status(400).json({ error: 'deficiencyId is required' });
    }

    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(deficiencyId);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    // Check cache first
    if (def.template_guidance) {
      try {
        const cached = JSON.parse(def.template_guidance);
        console.log(`[API] Returning cached template guidance for ${def.f_tag}`);
        return res.json({ guidance: cached, cached: true });
      } catch (e) {
        // Corrupted cache, regenerate
      }
    }

    if (!def.admin_template_id) {
      return res.status(400).json({ error: 'No admin template linked to this deficiency' });
    }

    // Fetch template content
    let templatePlainText = null;
    try {
      const resp = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${def.admin_template_id}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.version && data.version.content_json) {
          const tiptapDoc = JSON.parse(data.version.content_json);
          templatePlainText = tiptapToPlainText(tiptapDoc);
        }
      }
    } catch (proxyErr) {
      console.warn('[API] Could not fetch admin template:', proxyErr.message);
    }

    if (!templatePlainText) {
      return res.status(502).json({ error: 'Could not fetch template content from Admin API' });
    }

    console.log(`[API] Classifying template guidance for ${def.f_tag}...`);

    // AI classification
    const rawClassification = await classifyTemplateGuidance(templatePlainText);

    // Verification: strip any items whose text doesn't appear in the template
    const verified = verifyClassification(rawClassification, templatePlainText);

    // Log verification stats
    for (const stepKey of ['step1', 'step2', 'step3', 'step4']) {
      const rawCount = (rawClassification[stepKey] || []).length;
      const verifiedCount = (verified[stepKey] || []).length;
      const stripped = rawCount - verifiedCount;
      if (stripped > 0) {
        console.log(`[API] ${stepKey}: ${stripped} items stripped by verification (${rawCount} -> ${verifiedCount})`);
      }
    }

    // Cache in database
    db.prepare(`UPDATE deficiencies SET template_guidance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(JSON.stringify(verified), deficiencyId);

    res.json({ guidance: verified, cached: false });
  } catch (err) {
    console.error('[API] Template guidance error:', err.message);
    res.status(500).json({ error: `Template guidance classification failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// AI Assist: Generate questions for a step
// ---------------------------------------------------------------------------

router.post('/poc/assist-questions', async (req, res) => {
  try {
    const { deficiencyId, stepNumber } = req.body;
    if (!deficiencyId || !stepNumber) {
      return res.status(400).json({ error: 'deficiencyId and stepNumber are required' });
    }

    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(deficiencyId);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    const step = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? AND step_number = ?`).get(deficiencyId, stepNumber);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Check cache first
    if (step.assist_questions) {
      try {
        const cached = JSON.parse(step.assist_questions);
        console.log(`[API] Returning cached assist questions for ${def.f_tag} Step ${stepNumber}`);
        const answers = step.assist_answers ? JSON.parse(step.assist_answers) : {};
        return res.json({ questions: cached.questions || cached, answers, cached: true });
      } catch (e) {
        // Corrupted cache, regenerate
      }
    }

    // Fetch admin template content if linked
    let templateContent = null;
    if (def.admin_template_id) {
      try {
        const resp = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${def.admin_template_id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.version && data.version.content_json) {
            const tiptapDoc = JSON.parse(data.version.content_json);
            templateContent = tiptapToPlainText(tiptapDoc);
          }
        }
      } catch (proxyErr) {
        console.warn('[API] Could not fetch admin template:', proxyErr.message);
      }
    }

    console.log(`[API] Generating assist questions for ${def.f_tag} Step ${stepNumber}...`);
    const result = await generateAssistQuestions(def.f_tag, def.narrative, stepNumber, step.step_title, templateContent);

    // Cache questions in database
    db.prepare(`UPDATE poc_steps SET assist_questions = ?, updated_at = CURRENT_TIMESTAMP WHERE deficiency_id = ? AND step_number = ?`)
      .run(JSON.stringify(result), deficiencyId, stepNumber);

    const answers = step.assist_answers ? JSON.parse(step.assist_answers) : {};
    res.json({ questions: result.questions || result, answers, cached: false });
  } catch (err) {
    console.error('[API] Assist questions error:', err.message);
    res.status(500).json({ error: `Failed to generate assist questions: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// AI Assist: Generate draft from user answers
// ---------------------------------------------------------------------------

router.post('/poc/assist-draft', async (req, res) => {
  try {
    const { deficiencyId, stepNumber, answers } = req.body;
    if (!deficiencyId || !stepNumber || !answers) {
      return res.status(400).json({ error: 'deficiencyId, stepNumber, and answers are required' });
    }

    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(deficiencyId);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    const step = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? AND step_number = ?`).get(deficiencyId, stepNumber);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Save answers to database
    db.prepare(`UPDATE poc_steps SET assist_answers = ?, updated_at = CURRENT_TIMESTAMP WHERE deficiency_id = ? AND step_number = ?`)
      .run(JSON.stringify(answers), deficiencyId, stepNumber);

    // Parse cached questions to build Q&A pairs
    let questions = [];
    if (step.assist_questions) {
      try {
        const parsed = JSON.parse(step.assist_questions);
        questions = parsed.questions || parsed;
      } catch (e) {}
    }

    const questionsAndAnswers = questions
      .filter((q) => answers[q.id] && answers[q.id].trim())
      .map((q) => ({
        question: q.question,
        answer: answers[q.id],
      }));

    if (questionsAndAnswers.length === 0) {
      return res.status(400).json({ error: 'Please answer at least one question' });
    }

    // Fetch admin template content if linked
    let templateContent = null;
    if (def.admin_template_id) {
      try {
        const resp = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${def.admin_template_id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.version && data.version.content_json) {
            const tiptapDoc = JSON.parse(data.version.content_json);
            templateContent = tiptapToPlainText(tiptapDoc);
          }
        }
      } catch (proxyErr) {
        console.warn('[API] Could not fetch admin template:', proxyErr.message);
      }
    }

    console.log(`[API] Generating assisted draft for ${def.f_tag} Step ${stepNumber}...`);
    const result = await generateAssistedDraft(def.f_tag, def.narrative, stepNumber, step.step_title, questionsAndAnswers, templateContent);

    // Update deficiency status if still pending
    if (def.status === 'pending') {
      db.prepare(`UPDATE deficiencies SET status = 'drafting', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(deficiencyId);
    }

    res.json({
      deficiencyId,
      stepNumber,
      content: result.content,
    });
  } catch (err) {
    console.error('[API] Assist draft error:', err.message);
    res.status(500).json({ error: `Failed to generate assisted draft: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// Deficiency completion date
// ---------------------------------------------------------------------------

router.put('/deficiencies/:id/completion-date', (req, res) => {
  try {
    const { completionDate } = req.body;
    const def = db.prepare(`SELECT * FROM deficiencies WHERE id = ?`).get(req.params.id);
    if (!def) {
      return res.status(404).json({ error: 'Deficiency not found' });
    }

    db.prepare(`UPDATE deficiencies SET completion_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(completionDate || null, req.params.id);

    // Update session timestamp
    db.prepare(`UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(def.session_id);

    res.json({ success: true });
  } catch (err) {
    console.error('[API] Update completion date error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POC Step save
// ---------------------------------------------------------------------------

router.put('/poc/steps/:id', (req, res) => {
  try {
    const { userContent, completionDate, status } = req.body;
    const step = db.prepare(`SELECT * FROM poc_steps WHERE id = ?`).get(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    db.prepare(
      `UPDATE poc_steps SET user_content = ?, completion_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(
      userContent !== undefined ? userContent : step.user_content,
      completionDate !== undefined ? completionDate : step.completion_date,
      status || step.status,
      req.params.id
    );

    // Check if all steps for this deficiency are complete
    const allSteps = db.prepare(`SELECT status FROM poc_steps WHERE deficiency_id = ?`).all(step.deficiency_id);
    const allComplete = allSteps.every((s) => s.status === 'completed');
    const anyInProgress = allSteps.some((s) => s.status === 'in_progress' || s.status === 'completed');

    let defStatus = 'pending';
    if (allComplete) defStatus = 'complete';
    else if (anyInProgress) defStatus = 'drafting';

    db.prepare(`UPDATE deficiencies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(defStatus, step.deficiency_id);

    // Update session timestamp
    const def = db.prepare(`SELECT session_id FROM deficiencies WHERE id = ?`).get(step.deficiency_id);
    if (def) {
      db.prepare(`UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(def.session_id);
    }

    res.json({ success: true, deficiencyStatus: defStatus });
  } catch (err) {
    console.error('[API] Save step error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

router.get('/poc/export/:sessionId', (req, res) => {
  try {
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const defs = db.prepare(`SELECT * FROM deficiencies WHERE session_id = ? ORDER BY f_tag`).all(session.id);

    const sections = defs.map((d) => {
      const steps = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? ORDER BY step_number`).all(d.id);

      const stepTexts = steps.map((s) => {
        const content = s.user_content || s.ai_suggestion || '(Not yet drafted)';
        const date = s.completion_date ? `\nCompletion Date: ${s.completion_date}` : '';
        return `${s.step_title}:\n${content}${date}`;
      });

      return {
        fTag: d.f_tag,
        status: d.status,
        text: `PLAN OF CORRECTION — ${d.f_tag}\n${'='.repeat(40)}\n\n${stepTexts.join('\n\n')}`,
      };
    });

    res.json({
      fileName: session.file_name,
      sections,
      fullText: sections.map((s) => s.text).join('\n\n' + '-'.repeat(50) + '\n\n'),
    });
  } catch (err) {
    console.error('[API] Export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/poc/export-pdf/:sessionId', async (req, res) => {
  try {
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const defs = db.prepare(`SELECT * FROM deficiencies WHERE session_id = ? ORDER BY f_tag`).all(session.id);

    const deficiencies = defs.map((d) => {
      const steps = db.prepare(`SELECT * FROM poc_steps WHERE deficiency_id = ? ORDER BY step_number`).all(d.id);
      return { ...d, steps };
    });

    console.log(`[API] Generating CMS-2567 PDF for session ${session.id} (${deficiencies.length} F-Tags)...`);
    const pdfBytes = await generateCms2567Pdf(session, deficiencies);

    const safeName = (session.file_name || 'CMS-2567').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="POC_${safeName}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('[API] PDF export error:', err.message);
    res.status(500).json({ error: `PDF generation failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// Admin proxy
// ---------------------------------------------------------------------------

router.get('/admin/templates', async (req, res) => {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/templates`);
    if (!response.ok) throw new Error(`Admin API returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[API] Admin proxy error:', err.message);
    res.status(502).json({ error: 'Could not reach Admin API.' });
  }
});

router.get('/admin/templates/:id', async (req, res) => {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/templates/${req.params.id}`);
    if (!response.ok) throw new Error(`Admin API returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[API] Admin template proxy error:', err.message);
    res.status(502).json({ error: 'Could not reach Admin API.' });
  }
});

module.exports = router;
