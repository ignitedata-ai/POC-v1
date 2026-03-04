/**
 * database.js
 *
 * Initializes and exports the SQLite database connection.
 * Creates the schema tables on first run if they don't exist.
 *
 * Tables:
 *   - f_tag_templates: One row per F-Tag + title combination.
 *     The same F-Tag number can have multiple templates with different titles.
 *   - template_versions: Stores the TipTap JSON content and derived field schema.
 *     For this POC, each template has exactly one version (version_number = 1)
 *     that gets overwritten on save. The table is designed to support future
 *     versioning and approval workflows without schema changes.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'templates.db');

// Ensure the data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Create schema tables if they do not already exist.
 */
function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS f_tag_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_tag TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      UNIQUE(f_tag, title)
    );

    CREATE TABLE IF NOT EXISTS template_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft',
      content_json TEXT NOT NULL,
      field_schema_json TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES f_tag_templates(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_template_version
      ON template_versions(template_id, version_number);
  `);
}

initializeSchema();

/**
 * Run lightweight migrations for columns added after initial schema creation.
 * Each migration checks if the column exists before attempting to add it.
 */
function runMigrations() {
  const columns = db.prepare("PRAGMA table_info(f_tag_templates)").all();
  const hasDeletedAt = columns.some((col) => col.name === 'deleted_at');

  if (!hasDeletedAt) {
    db.exec(`ALTER TABLE f_tag_templates ADD COLUMN deleted_at DATETIME DEFAULT NULL`);
    console.log('[DB] Migration: added deleted_at column to f_tag_templates');
  }
}

runMigrations();

module.exports = db;
