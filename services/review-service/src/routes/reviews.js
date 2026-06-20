import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

const mapReview = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    cafeId: row.cafe_id,
    userId: row.user_id,
    rating: row.rating,
    reviewText: row.review_text,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
};

// Helper: compute average rating for a cafe (internal)
async function getAvgRating(cafeId) {
  const [rows] = await pool.query(
    'SELECT AVG(rating) as avg_rating FROM reviews WHERE cafe_id = ?',
    [cafeId]
  );
  return parseFloat(rows[0].avg_rating || 0);
}

// GET /reviews?cafeId=:id — list all reviews for a specific cafe
router.get('/', async (req, res) => {
  const { cafeId } = req.query;
  if (!cafeId) return res.status(400).json({ error: 'cafeId query param is required.' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE cafe_id = ? ORDER BY id DESC',
      [cafeId]
    );
    res.json(rows.map(mapReview));
  } catch (err) {
    console.error('[review-service] getReviews error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// POST /reviews — add a new review, returns { review, avgRating }
router.post('/', async (req, res) => {
  const { cafeId, userId, rating, reviewText } = req.body;
  if (!cafeId || !userId || !rating) {
    return res.status(400).json({ error: 'cafeId, userId, and rating are required.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO reviews (cafe_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)`,
      [cafeId, userId, rating, reviewText || null]
    );
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    const review = mapReview(rows[0]);
    const avgRating = await getAvgRating(cafeId);
    res.status(201).json({ review, avgRating });
  } catch (err) {
    console.error('[review-service] addReview error:', err.message);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// PUT /reviews/:id — update a review, returns { review, avgRating }
router.put('/:id', async (req, res) => {
  const { rating, reviewText } = req.body;
  try {
    // Fetch current review to get cafeId for avg calculation
    const [current] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!current.length) return res.status(404).json({ error: 'Review not found.' });

    await pool.query(
      `UPDATE reviews
       SET rating = COALESCE(?, rating),
           review_text = COALESCE(?, review_text)
       WHERE id = ?`,
      [rating ?? null, reviewText || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    const review = mapReview(rows[0]);
    const avgRating = await getAvgRating(current[0].cafe_id);
    res.json({ review, avgRating });
  } catch (err) {
    console.error('[review-service] updateReview error:', err.message);
    res.status(500).json({ error: 'Failed to update review.' });
  }
});

// DELETE /reviews?cafeId=:id — bulk delete reviews for a cafe (cascade delete support)
router.delete('/', async (req, res) => {
  const { cafeId } = req.query;
  if (!cafeId) return res.status(400).json({ error: 'cafeId query param is required.' });
  try {
    await pool.query('DELETE FROM reviews WHERE cafe_id = ?', [cafeId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[review-service] deleteReviews error:', err.message);
    res.status(500).json({ error: 'Failed to delete reviews.' });
  }
});

export default router;
