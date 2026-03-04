/**
 * routes.js
 *
 * Express API routes for template CRUD operations.
 *
 * Templates are identified by their numeric `id` (not f_tag alone),
 * since the same F-Tag number can have multiple templates with different titles.
 *
 * Endpoints:
 *   GET    /api/templates                - List all templates (excludes soft-deleted)
 *   GET    /api/templates/generic        - Get the hidden generic template
 *   POST   /api/templates/upload-pdf     - Upload PDF and convert to template
 *   GET    /api/templates/:id            - Get a single template with its content
 *   POST   /api/templates                - Create a new template
 *   PUT    /api/templates/:id            - Update an existing template (overwrite version 1)
 *   DELETE /api/templates/:id            - Soft-delete a template (sets deleted_at)
 */

const express = require('express');
const multer = require('multer');
const db = require('./database');
const { extractFieldSchema } = require('./fieldExtractor');
const { convertPdfToTiptap } = require('./pdfConverter');
const { generateGenericTemplate } = require('./genericTemplate');

// Configure multer for in-memory PDF uploads (max 20MB)
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

/**
 * GET /api/templates
 *
 * Returns a list of all templates (id, f_tag, title, updated_at).
 * Used to populate the left sidebar template list.
 */
router.get('/templates', (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT id, f_tag, title, updated_at
      FROM f_tag_templates
      WHERE deleted_at IS NULL
      ORDER BY f_tag ASC, title ASC
    `).all();

    res.json(templates);
  } catch (err) {
    console.error('[API] Error fetching templates:', err.message);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/templates/generic
 *
 * Returns the hidden generic F-Tag template for "Create from Template" flow.
 * This template is NOT stored in the database — it's generated on the fly
 * with the provided F-Tag number and title substituted into headings.
 *
 * Query params: fTagNumber (e.g., "600"), title (e.g., "Infection Control")
 */
router.get('/templates/generic', (req, res) => {
  try {
    const { fTagNumber, title } = req.query;

    if (!fTagNumber || !title) {
      return res.status(400).json({ error: 'Missing required query params: fTagNumber, title' });
    }

    const templateContent = generateGenericTemplate(fTagNumber, title);
    const fieldSchema = extractFieldSchema(templateContent);

    res.json({
      content_json: JSON.stringify(templateContent),
      field_schema_json: JSON.stringify(fieldSchema),
    });
  } catch (err) {
    console.error('[API] Error generating generic template:', err.message);
    res.status(500).json({ error: 'Failed to generate generic template' });
  }
});

/**
 * POST /api/templates/upload-pdf
 *
 * Accepts a PDF file upload along with f_tag and title.
 * Parses the PDF, converts it to TipTap JSON with auto-detected placeholders,
 * and saves it as a new template in the database.
 *
 * Multipart form data:
 *   - pdf: the PDF file
 *   - f_tag: e.g., "F-600"
 *   - title: e.g., "Infection Control"
 */
router.post('/templates/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { f_tag, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    if (!f_tag || !title) {
      return res.status(400).json({ error: 'Missing required fields: f_tag, title' });
    }

    // Check for duplicate f_tag + title combination (only among non-deleted)
    const existing = db.prepare(
      'SELECT id FROM f_tag_templates WHERE f_tag = ? AND title = ? AND deleted_at IS NULL'
    ).get(f_tag, title);
    if (existing) {
      return res.status(409).json({
        error: `Template already exists for ${f_tag} with title "${title}"`,
      });
    }

    // Convert PDF to TipTap JSON
    const contentObj = await convertPdfToTiptap(req.file.buffer);
    const contentJsonString = JSON.stringify(contentObj);
    const fieldSchema = extractFieldSchema(contentObj);
    const fieldSchemaJsonString = JSON.stringify(fieldSchema);

    // Save to database
    const createTransaction = db.transaction(() => {
      // Remove any soft-deleted template with the same f_tag + title to free the UNIQUE slot
      db.prepare(
        'DELETE FROM f_tag_templates WHERE f_tag = ? AND title = ? AND deleted_at IS NOT NULL'
      ).run(f_tag, title);

      const templateResult = db.prepare(`
        INSERT INTO f_tag_templates (f_tag, title) VALUES (?, ?)
      `).run(f_tag, title);

      db.prepare(`
        INSERT INTO template_versions (template_id, version_number, status, content_json, field_schema_json)
        VALUES (?, 1, 'draft', ?, ?)
      `).run(templateResult.lastInsertRowid, contentJsonString, fieldSchemaJsonString);

      return templateResult.lastInsertRowid;
    });

    const templateId = createTransaction();

    res.status(201).json({
      template: { id: templateId, f_tag, title },
      version: {
        version_number: 1,
        status: 'draft',
        field_count: fieldSchema.length,
      },
    });
  } catch (err) {
    console.error('[API] Error uploading PDF template:', err.message);
    res.status(500).json({ error: `Failed to process PDF: ${err.message}` });
  }
});

/**
 * GET /api/templates/:id
 *
 * Returns a single template and its latest version content.
 * The :id parameter is the numeric template ID.
 */
router.get('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;

    const template = db.prepare(`
      SELECT id, f_tag, title, created_at, updated_at
      FROM f_tag_templates
      WHERE id = ? AND deleted_at IS NULL
    `).get(id);

    if (!template) {
      return res.status(404).json({ error: `Template not found: ${id}` });
    }

    const version = db.prepare(`
      SELECT version_number, status, content_json, field_schema_json, created_at
      FROM template_versions
      WHERE template_id = ?
      ORDER BY version_number DESC
      LIMIT 1
    `).get(template.id);

    if (!version) {
      return res.status(404).json({ error: `No version found for template: ${id}` });
    }

    res.json({
      template: {
        id: template.id,
        f_tag: template.f_tag,
        title: template.title,
        created_at: template.created_at,
        updated_at: template.updated_at,
      },
      version: {
        version_number: version.version_number,
        status: version.status,
        content_json: version.content_json,
        field_schema_json: version.field_schema_json,
        created_at: version.created_at,
      },
    });
  } catch (err) {
    console.error('[API] Error fetching template:', err.message);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/templates
 *
 * Creates a new template with an initial version.
 * Body: { f_tag, title, content_json }
 * The field_schema_json is auto-derived from content_json.
 */
router.post('/templates', (req, res) => {
  try {
    const { f_tag, title, content_json } = req.body;

    if (!f_tag || !title || !content_json) {
      return res.status(400).json({ error: 'Missing required fields: f_tag, title, content_json' });
    }

    // Check for duplicate f_tag + title combination (only among non-deleted)
    const existing = db.prepare(
      'SELECT id FROM f_tag_templates WHERE f_tag = ? AND title = ? AND deleted_at IS NULL'
    ).get(f_tag, title);
    if (existing) {
      return res.status(409).json({
        error: `Template already exists for ${f_tag} with title "${title}"`,
      });
    }

    // Parse content_json if it's a string, to validate it
    let contentObj;
    try {
      contentObj = typeof content_json === 'string' ? JSON.parse(content_json) : content_json;
    } catch {
      return res.status(400).json({ error: 'Invalid content_json: not valid JSON' });
    }

    const contentJsonString = typeof content_json === 'string' ? content_json : JSON.stringify(content_json);
    const fieldSchema = extractFieldSchema(contentObj);
    const fieldSchemaJsonString = JSON.stringify(fieldSchema);

    const createTransaction = db.transaction(() => {
      // Remove any soft-deleted template with the same f_tag + title to free the UNIQUE slot
      db.prepare(
        'DELETE FROM f_tag_templates WHERE f_tag = ? AND title = ? AND deleted_at IS NOT NULL'
      ).run(f_tag, title);

      const templateResult = db.prepare(`
        INSERT INTO f_tag_templates (f_tag, title) VALUES (?, ?)
      `).run(f_tag, title);

      db.prepare(`
        INSERT INTO template_versions (template_id, version_number, status, content_json, field_schema_json)
        VALUES (?, 1, 'draft', ?, ?)
      `).run(templateResult.lastInsertRowid, contentJsonString, fieldSchemaJsonString);

      return templateResult.lastInsertRowid;
    });

    const templateId = createTransaction();

    res.status(201).json({
      template: { id: templateId, f_tag, title },
      version: {
        version_number: 1,
        status: 'draft',
        field_count: fieldSchema.length,
      },
    });
  } catch (err) {
    console.error('[API] Error creating template:', err.message);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /api/templates/:id
 *
 * Updates an existing template. Overwrites version 1 content.
 * Body: { title?, content_json }
 * The field_schema_json is re-derived from the new content_json.
 */
router.put('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content_json } = req.body;

    if (!content_json) {
      return res.status(400).json({ error: 'Missing required field: content_json' });
    }

    const template = db.prepare(`
      SELECT id, f_tag, title FROM f_tag_templates WHERE id = ? AND deleted_at IS NULL
    `).get(id);

    if (!template) {
      return res.status(404).json({ error: `Template not found: ${id}` });
    }

    // Parse and validate content
    let contentObj;
    try {
      contentObj = typeof content_json === 'string' ? JSON.parse(content_json) : content_json;
    } catch {
      return res.status(400).json({ error: 'Invalid content_json: not valid JSON' });
    }

    const contentJsonString = typeof content_json === 'string' ? content_json : JSON.stringify(content_json);
    const fieldSchema = extractFieldSchema(contentObj);
    const fieldSchemaJsonString = JSON.stringify(fieldSchema);

    const updateTransaction = db.transaction(() => {
      // Update title if provided
      if (title) {
        db.prepare(`
          UPDATE f_tag_templates SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(title, template.id);
      } else {
        db.prepare(`
          UPDATE f_tag_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(template.id);
      }

      // Overwrite version 1 content
      db.prepare(`
        UPDATE template_versions
        SET content_json = ?, field_schema_json = ?, created_at = CURRENT_TIMESTAMP
        WHERE template_id = ? AND version_number = 1
      `).run(contentJsonString, fieldSchemaJsonString, template.id);
    });

    updateTransaction();

    res.json({
      template: {
        id: template.id,
        f_tag: template.f_tag,
        title: title || template.title,
      },
      version: {
        version_number: 1,
        status: 'draft',
        field_count: fieldSchema.length,
      },
    });
  } catch (err) {
    console.error('[API] Error updating template:', err.message);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/templates/:id
 *
 * Soft-deletes a template by setting deleted_at to the current timestamp.
 * The template data remains in the database but is excluded from all queries.
 */
router.delete('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;

    const template = db.prepare(`
      SELECT id, f_tag, title FROM f_tag_templates WHERE id = ? AND deleted_at IS NULL
    `).get(id);

    if (!template) {
      return res.status(404).json({ error: `Template not found: ${id}` });
    }

    db.prepare(`
      UPDATE f_tag_templates SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(template.id);

    res.json({
      message: `Template ${template.f_tag} - ${template.title} deleted`,
      template: { id: template.id, f_tag: template.f_tag, title: template.title },
    });
  } catch (err) {
    console.error('[API] Error deleting template:', err.message);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
