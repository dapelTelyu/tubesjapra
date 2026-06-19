import { reviewsPool, cafesPool, usersPool } from '../../config/db.js';

// Map database snake_case rows to GraphQL camelCase types
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

// Helper function to recalculate average rating of a cafe and update db_cafes
async function updateAverageCafeRating(cafeId) {
  try {
    const [rows] = await reviewsPool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE cafe_id = ?',
      [cafeId]
    );
    const avgRating = parseFloat(rows[0].avg_rating || 0.00);
    await cafesPool.query('UPDATE cafes SET rating = ? WHERE id = ?', [avgRating, cafeId]);
  } catch (error) {
    console.error(`Error updating average rating for cafe ${cafeId}:`, error.message);
  }
}

export const reviewResolvers = {
  Mutation: {
    addReview: async (_parent, { cafeId, userId, rating, reviewText }) => {
      try {
        const [result] = await reviewsPool.query(
          `INSERT INTO reviews (cafe_id, user_id, rating, review_text) 
           VALUES (?, ?, ?, ?)`,
          [cafeId, userId, rating, reviewText]
        );
        const reviewId = result.insertId;

        // Recalculate average rating for the cafe
        await updateAverageCafeRating(cafeId);

        const [rows] = await reviewsPool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
        return mapReview(rows[0]);
      } catch (error) {
        console.error('Error in addReview:', error.message);
        throw new Error('Failed to submit review.');
      }
    },
    updateReview: async (_parent, { id, rating, reviewText }) => {
      try {
        // Fetch review details first to get the cafeId
        const [currentReviewRows] = await reviewsPool.query('SELECT * FROM reviews WHERE id = ?', [id]);
        if (currentReviewRows.length === 0) {
          throw new Error('Review not found.');
        }
        const review = currentReviewRows[0];

        // Update the review details
        await reviewsPool.query(
          `UPDATE reviews 
           SET rating = COALESCE(?, rating), 
               review_text = COALESCE(?, review_text) 
           WHERE id = ?`,
          [rating, reviewText, id]
        );

        // Recalculate average rating for the cafe
        await updateAverageCafeRating(review.cafe_id);

        const [rows] = await reviewsPool.query('SELECT * FROM reviews WHERE id = ?', [id]);
        return mapReview(rows[0]);
      } catch (error) {
        console.error('Error in updateReview:', error.message);
        throw new Error('Failed to update review.');
      }
    }
  },
  Review: {
    user: async (parent) => {
      try {
        const [rows] = await usersPool.query('SELECT * FROM users WHERE id = ?', [parent.userId]);
        return rows[0] || null;
      } catch (error) {
        console.error(`Error resolving Review.user for review ${parent.id}:`, error.message);
        return null;
      }
    },
    cafe: async (parent) => {
      try {
        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [parent.cafeId]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error(`Error resolving Review.cafe for review ${parent.id}:`, error.message);
        return null;
      }
    }
  }
};
