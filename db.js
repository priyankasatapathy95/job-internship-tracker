const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// node:sqlite is built into Node.js (stable from v22.5+, unflagged in v24) —
// no native compilation, no node-gyp, no Visual Studio Build Tools required.
// This is what fixes the Windows install issue.
const db = new DatabaseSync(path.join(__dirname, 'job_tracker.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied',
    date_applied TEXT NOT NULL,
    link TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
