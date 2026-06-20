import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

const mapNote = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    cafeId: row.cafe_id,
    noteText: row.note_text,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
};

// GET /notes?userId=:id&cafeId=:id — get personal notes for a user at a specific cafe
router.get('/', async (req, res) => {
  const { userId, cafeId } = req.query;
  if (!userId || !cafeId) {
    return res.status(400).json({ error: 'userId and cafeId query params are required.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM personal_notes WHERE user_id = ? AND cafe_id = ? ORDER BY id DESC',
      [userId, cafeId]
    );
    res.json(rows.map(mapNote));
  } catch (err) {
    console.error('[note-service] getNotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch personal notes.' });
  }
});

// POST /notes — create a new personal note
router.post('/', async (req, res) => {
  const { userId, cafeId, noteText } = req.body;
  if (!userId || !cafeId || !noteText) {
    return res.status(400).json({ error: 'userId, cafeId, and noteText are required.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO personal_notes (user_id, cafe_id, note_text) VALUES (?, ?, ?)`,
      [userId, cafeId, noteText]
    );
    const [rows] = await pool.query('SELECT * FROM personal_notes WHERE id = ?', [result.insertId]);
    res.status(201).json(mapNote(rows[0]));
  } catch (err) {
    console.error('[note-service] addNote error:', err.message);
    res.status(500).json({ error: 'Failed to create personal note.' });
  }
});

// PUT /notes/:id — update an existing personal note
router.put('/:id', async (req, res) => {
  const { noteText } = req.body;
  if (!noteText) return res.status(400).json({ error: 'noteText is required.' });
  try {
    await pool.query(
      'UPDATE personal_notes SET note_text = ? WHERE id = ?',
      [noteText, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM personal_notes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Personal note not found.' });
    res.json(mapNote(rows[0]));
  } catch (err) {
    console.error('[note-service] updateNote error:', err.message);
    res.status(500).json({ error: 'Failed to update personal note.' });
  }
});

// DELETE /notes?cafeId=:id — bulk delete notes for a cafe (cascade delete support)
router.delete('/', async (req, res) => {
  const { cafeId } = req.query;
  if (!cafeId) return res.status(400).json({ error: 'cafeId query param is required.' });
  try {
    await pool.query('DELETE FROM personal_notes WHERE cafe_id = ?', [cafeId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[note-service] deleteNotes error:', err.message);
    res.status(500).json({ error: 'Failed to delete personal notes.' });
  }
});

export default router;
