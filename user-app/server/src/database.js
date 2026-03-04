/**
 * database.js
 *
 * SQLite database for the User App POC module.
 * Stores sessions (uploaded 2567s), deficiencies (F-Tags with narratives),
 * and poc_steps (the 4-step POC draft per deficiency).
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'poc.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    full_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deficiencies (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    f_tag TEXT NOT NULL,
    narrative TEXT,
    severity TEXT,
    scope TEXT,
    admin_template_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, f_tag)
  );

  CREATE TABLE IF NOT EXISTS poc_steps (
    id TEXT PRIMARY KEY,
    deficiency_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_title TEXT NOT NULL,
    ai_suggestion TEXT,
    user_content TEXT,
    completion_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deficiency_id) REFERENCES deficiencies(id) ON DELETE CASCADE,
    UNIQUE(deficiency_id, step_number)
  );
`);

// Migration: add header_json column if it doesn't exist
try {
  db.prepare(`SELECT header_json FROM sessions LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE sessions ADD COLUMN header_json TEXT`);
  console.log('[DB] Migrated: added header_json column to sessions');
}

// Migration: add summary column if it doesn't exist
try {
  db.prepare(`SELECT summary FROM deficiencies LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE deficiencies ADD COLUMN summary TEXT`);
  console.log('[DB] Migrated: added summary column to deficiencies');
}

// Migration: add key_points column if it doesn't exist
try {
  db.prepare(`SELECT key_points FROM deficiencies LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE deficiencies ADD COLUMN key_points TEXT`);
  console.log('[DB] Migrated: added key_points column to deficiencies');
}

// Migration: add completion_date column to deficiencies if it doesn't exist
try {
  db.prepare(`SELECT completion_date FROM deficiencies LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE deficiencies ADD COLUMN completion_date TEXT`);
  console.log('[DB] Migrated: added completion_date column to deficiencies');
}

// Migration: add template_guidance column for cached AI classification
try {
  db.prepare(`SELECT template_guidance FROM deficiencies LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE deficiencies ADD COLUMN template_guidance TEXT`);
  console.log('[DB] Migrated: added template_guidance column to deficiencies');
}

// Migration: add assist_questions column for cached AI-generated questions per step
try {
  db.prepare(`SELECT assist_questions FROM poc_steps LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE poc_steps ADD COLUMN assist_questions TEXT`);
  console.log('[DB] Migrated: added assist_questions column to poc_steps');
}

// Migration: add assist_answers column for user answers per step
try {
  db.prepare(`SELECT assist_answers FROM poc_steps LIMIT 1`).get();
} catch (e) {
  db.exec(`ALTER TABLE poc_steps ADD COLUMN assist_answers TEXT`);
  console.log('[DB] Migrated: added assist_answers column to poc_steps');
}

const STEP_TITLES = [
  'What Went Wrong / Immediate Action Taken',
  'Scope and Impact Assessment',
  'Education and Prevention Measures',
  'Ongoing Monitoring Plan',
];

module.exports = { db, STEP_TITLES };
