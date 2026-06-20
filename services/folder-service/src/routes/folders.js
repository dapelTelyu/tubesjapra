import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

const mapFolder = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
};

// GET /folders?userId=:id — get all folders belonging to a user
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param is required.' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM folders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    res.json(rows.map(mapFolder));
  } catch (err) {
    console.error('[folder-service] getUserFolders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch folders.' });
  }
});

// POST /folders — create a new folder
router.post('/', async (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) return res.status(400).json({ error: 'userId and name are required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO folders (user_id, name) VALUES (?, ?)',
      [userId, name]
    );
    const [rows] = await pool.query('SELECT * FROM folders WHERE id = ?', [result.insertId]);
    res.status(201).json(mapFolder(rows[0]));
  } catch (err) {
    console.error('[folder-service] createFolder error:', err.message);
    res.status(500).json({ error: 'Failed to create folder.' });
  }
});

// GET /folders/:id/cafes — get list of cafe IDs saved in a folder
router.get('/:id/cafes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT cafe_id FROM folder_cafes WHERE folder_id = ?',
      [req.params.id]
    );
    res.json(rows.map(r => r.cafe_id));
  } catch (err) {
    console.error('[folder-service] getFolderCafes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch folder cafes.' });
  }
});

// POST /folders/:id/cafes — add a cafe to a folder (idempotent)
router.post('/:id/cafes', async (req, res) => {
  const { cafeId } = req.body;
  if (!cafeId) return res.status(400).json({ error: 'cafeId is required.' });
  try {
    await pool.query(
      `INSERT INTO folder_cafes (folder_id, cafe_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE folder_id = folder_id`,
      [req.params.id, cafeId]
    );
    res.json({ added: true });
  } catch (err) {
    console.error('[folder-service] addCafeToFolder error:', err.message);
    res.status(500).json({ error: 'Failed to add cafe to folder.' });
  }
});

// DELETE /folder-cafes?cafeId=:id — remove all folder mappings for a cafe (cascade delete support)
router.delete('/cafe-mappings', async (req, res) => {
  const { cafeId } = req.query;
  if (!cafeId) return res.status(400).json({ error: 'cafeId query param is required.' });
  try {
    await pool.query('DELETE FROM folder_cafes WHERE cafe_id = ?', [cafeId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[folder-service] deleteCafeMappings error:', err.message);
    res.status(500).json({ error: 'Failed to delete cafe mappings.' });
  }
});

export default router;
