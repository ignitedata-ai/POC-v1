/**
 * seed.js
 *
 * Seeds the database with F-578 and F-655 template packets on first run.
 * Skips seeding if templates already exist in the database.
 * Called automatically from index.js on server startup.
 */

const db = require('./database');
const { extractFieldSchema } = require('./fieldExtractor');
const seedData = require('./seedData');

function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM f_tag_templates').get();

  if (existing.count > 0) {
    console.log('[Seed] Database already has templates. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with F-578 and F-655 templates...');

  const insertTemplate = db.prepare(`
    INSERT INTO f_tag_templates (f_tag, title) VALUES (?, ?)
  `);

  const insertVersion = db.prepare(`
    INSERT INTO template_versions (template_id, version_number, status, content_json, field_schema_json)
    VALUES (?, 1, 'draft', ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    for (const template of [seedData.f578, seedData.f655]) {
      const contentJsonString = JSON.stringify(template.content);
      const fieldSchema = extractFieldSchema(template.content);
      const fieldSchemaJsonString = JSON.stringify(fieldSchema);

      const result = insertTemplate.run(template.f_tag, template.title);
      insertVersion.run(result.lastInsertRowid, contentJsonString, fieldSchemaJsonString);

      console.log(`[Seed] Seeded ${template.f_tag} - ${template.title} (${fieldSchema.length} fields)`);
    }
  });

  seedTransaction();
  console.log('[Seed] Database seeding complete.');
}

module.exports = { seedDatabase };
