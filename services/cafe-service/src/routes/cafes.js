import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

const mapCafe = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    address: row.address,
    photo: row.photo,
    rating: parseFloat(row.rating || 0),
    publishStatus: row.publish_status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
};

// GET /cafes — approved cafes only
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM cafes WHERE publish_status = 'APPROVED' ORDER BY id DESC"
    );
    res.json(rows.map(mapCafe));
  } catch (err) {
    console.error('[cafe-service] getCafes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cafes.' });
  }
});

// GET /cafes/pending — admin moderation queue
router.get('/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM cafes WHERE publish_status = 'PENDING' ORDER BY id DESC"
    );
    res.json(rows.map(mapCafe));
  } catch (err) {
    console.error('[cafe-service] getPendingCafes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending cafes.' });
  }
});

// GET /cafes/batch?ids=1,2,3 — batch fetch for folder service aggregation
router.get('/batch', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').map(Number).filter(Boolean);
    if (!ids.length) return res.json([]);
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id IN (?) ORDER BY id DESC', [ids]);
    res.json(rows.map(mapCafe));
  } catch (err) {
    console.error('[cafe-service] batchGetCafes error:', err.message);
    res.status(500).json({ error: 'Failed to batch fetch cafes.' });
  }
});

// GET /cafes/:id — any status (for detail view & admin)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cafe not found.' });
    res.json(mapCafe(rows[0]));
  } catch (err) {
    console.error('[cafe-service] getCafeById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cafe.' });
  }
});

// POST /cafes — create new cafe (status defaults to PENDING)
router.post('/', async (req, res) => {
  const { name, description, address, photo, rating } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required.' });
  try {
    const initialRating = rating || 0.00;
    const [result] = await pool.query(
      `INSERT INTO cafes (name, description, address, photo, rating, publish_status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [name, description || null, address, photo || null, initialRating]
    );
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id = ?', [result.insertId]);
    res.status(201).json(mapCafe(rows[0]));
  } catch (err) {
    console.error('[cafe-service] createCafe error:', err.message);
    res.status(500).json({ error: 'Failed to create cafe.' });
  }
});

// PUT /cafes/:id — update cafe fields
router.put('/:id', async (req, res) => {
  const { name, description, address, photo, rating } = req.body;
  try {
    await pool.query(
      `UPDATE cafes
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           address = COALESCE(?, address),
           photo = COALESCE(?, photo),
           rating = COALESCE(?, rating)
       WHERE id = ?`,
      [name || null, description || null, address || null, photo || null, rating ?? null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cafe not found.' });
    res.json(mapCafe(rows[0]));
  } catch (err) {
    console.error('[cafe-service] updateCafe error:', err.message);
    res.status(500).json({ error: 'Failed to update cafe.' });
  }
});

// PATCH /cafes/:id/status — update publish status (admin action)
router.patch('/:id/status', async (req, res) => {
  const { publishStatus } = req.body;
  const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
  if (!allowed.includes(publishStatus)) {
    return res.status(400).json({ error: 'Invalid publishStatus value.' });
  }
  try {
    await pool.query('UPDATE cafes SET publish_status = ? WHERE id = ?', [publishStatus, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cafe not found.' });
    res.json(mapCafe(rows[0]));
  } catch (err) {
    console.error('[cafe-service] updateStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update publish status.' });
  }
});

// PATCH /cafes/:id/rating — update avg rating (called by gateway after review operations)
router.patch('/:id/rating', async (req, res) => {
  const { rating } = req.body;
  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: 'Rating value is required.' });
  }
  try {
    await pool.query('UPDATE cafes SET rating = ? WHERE id = ?', [rating, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM cafes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cafe not found.' });
    res.json(mapCafe(rows[0]));
  } catch (err) {
    console.error('[cafe-service] updateRating error:', err.message);
    res.status(500).json({ error: 'Failed to update cafe rating.' });
  }
});

// DELETE /cafes/:id — delete cafe record
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM cafes WHERE id = ?', [req.params.id]);
    res.json({ deleted: result.affectedRows > 0 });
  } catch (err) {
    console.error('[cafe-service] deleteCafe error:', err.message);
    res.status(500).json({ error: 'Failed to delete cafe.' });
  }
});

export default router;
