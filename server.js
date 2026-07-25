const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.listen(PORT, () => {
  console.log(`Job Tracker running at http://localhost:${PORT}`);
});
