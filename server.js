const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Absolute path to the public folder, resolved once and reused below.
// (This was already correct — kept as-is, just pulled into a constant
// so the root route and the static middleware are guaranteed to point
// at the exact same folder.)
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());

// Serve static assets (style.css, app.js, etc.) from /public.
// This alone is usually enough for Express to also serve index.html on
// GET /, but on some hosts (Render included) that implicit behavior can
// be masked — e.g. by a platform health-check hitting "/" before static
// assets are confirmed to exist, or by case-sensitivity differences
// between local (Windows/Mac) and the Linux container Render deploys to.
// The explicit route below removes that ambiguity entirely.
app.use(express.static(PUBLIC_DIR));

// Explicitly serve the frontend's entry point on the root route.
// This guarantees index.html loads when visiting the Render URL directly,
// regardless of how the platform's static-file handling behaves.
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// GET all applications (supports ?status= and ?search= filters)
app.get('/api/applications', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM applications WHERE 1=1';
  const params = [];

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (company LIKE ? OR role LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY date_applied DESC, id DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET single application
app.get('/api/applications/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST create application
app.post('/api/applications', (req, res) => {
  const { company, role, status, date_applied, link, notes } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: 'Company and role are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO applications (company, role, status, date_applied, link, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    company,
    role,
    status || 'Applied',
    date_applied || new Date().toISOString().split('T')[0],
    link || '',
    notes || ''
  );

  const newRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newRow);
});

// PUT update application
app.put('/api/applications/:id', (req, res) => {
  const { company, role, status, date_applied, link, notes } = req.body;
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE applications
    SET company = ?, role = ?, status = ?, date_applied = ?, link = ?, notes = ?
    WHERE id = ?
  `).run(
    company ?? existing.company,
    role ?? existing.role,
    status ?? existing.status,
    date_applied ?? existing.date_applied,
    link ?? existing.link,
    notes ?? existing.notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE application
app.delete('/api/applications/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// GET stats summary
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status').all();
  res.json({ total, byStatus });
});

// Bind to 0.0.0.0 (not just 'localhost') so Render's container networking
// can actually route external traffic to this process. Express normally
// defaults to all interfaces anyway, but this makes it explicit and
// removes one more possible cause of "Cannot GET /" / unreachable app.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Job Tracker running at http://localhost:${PORT}`);
});
