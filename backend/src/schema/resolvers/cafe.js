import { cafesPool, reviewsPool, notesPool, foldersPool } from '../../config/db.js';

// Map database snake_case rows to GraphQL camelCase types
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

export const cafeResolvers = {
  Query: {
    getCafes: async () => {
      try {
        const [rows] = await cafesPool.query(
          "SELECT * FROM cafes WHERE publish_status = 'APPROVED' ORDER BY id DESC"
        );
        return rows.map(mapCafe);
      } catch (error) {
        console.error('Error in getCafes:', error.message);
        throw new Error('Failed to fetch cafes.');
      }
    },
    getCafeById: async (_parent, { id }) => {
      try {
        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [id]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error('Error in getCafeById:', error.message);
        throw new Error('Failed to fetch cafe by ID.');
      }
    },
    getPendingCafes: async () => {
      try {
        const [rows] = await cafesPool.query(
          "SELECT * FROM cafes WHERE publish_status = 'PENDING' ORDER BY id DESC"
        );
        return rows.map(mapCafe);
      } catch (error) {
        console.error('Error in getPendingCafes:', error.message);
        throw new Error('Failed to fetch pending cafes.');
      }
    }
  },
  Mutation: {
    createCafe: async (_parent, { name, description, address, photo, rating, review }) => {
      try {
        const initialRating = rating || 0.00;
        
        // Insert cafe record in db_cafes
        const [result] = await cafesPool.query(
          `INSERT INTO cafes (name, description, address, photo, rating, publish_status) 
           VALUES (?, ?, ?, ?, ?, 'PENDING')`,
          [name, description, address, photo, initialRating]
        );
        const cafeId = result.insertId;

        // If an initial review text is provided, insert a review into db_reviews for user 1
        if (review) {
          const defaultUserId = 1;
          const reviewRating = Math.round(initialRating || 5);
          await reviewsPool.query(
            `INSERT INTO reviews (cafe_id, user_id, rating, review_text) 
             VALUES (?, ?, ?, ?)`,
            [cafeId, defaultUserId, reviewRating, review]
          );
        }

        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [cafeId]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error('Error in createCafe:', error.message);
        throw new Error('Failed to create cafe.');
      }
    },
    updateCafe: async (_parent, { id, name, description, address, photo, rating, review }) => {
      try {
        await cafesPool.query(
          `UPDATE cafes 
           SET name = COALESCE(?, name), 
               description = COALESCE(?, description), 
               address = COALESCE(?, address), 
               photo = COALESCE(?, photo), 
               rating = COALESCE(?, rating) 
           WHERE id = ?`,
          [name, description, address, photo, rating, id]
        );

        // If a review text is updated/added, we can record it as a new review for user 1
        if (review) {
          const defaultUserId = 1;
          const reviewRating = Math.round(rating || 5);
          await reviewsPool.query(
            `INSERT INTO reviews (cafe_id, user_id, rating, review_text) 
             VALUES (?, ?, ?, ?)`,
            [id, defaultUserId, reviewRating, review]
          );
          
          // Recalculate and update the cafe rating based on all reviews
          const [ratingRows] = await reviewsPool.query(
            'SELECT AVG(rating) as avg_rating FROM reviews WHERE cafe_id = ?',
            [id]
          );
          const newAvgRating = ratingRows[0].avg_rating || 0.00;
          await cafesPool.query('UPDATE cafes SET rating = ? WHERE id = ?', [newAvgRating, id]);
        }

        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [id]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error('Error in updateCafe:', error.message);
        throw new Error('Failed to update cafe.');
      }
    },
    deleteCafe: async (_parent, { id }) => {
      try {
        // Clean up references across other domain databases to maintain referential integrity
        await reviewsPool.query('DELETE FROM reviews WHERE cafe_id = ?', [id]);
        await notesPool.query('DELETE FROM personal_notes WHERE cafe_id = ?', [id]);
        await foldersPool.query('DELETE FROM folder_cafes WHERE cafe_id = ?', [id]);

        // Delete the main cafe record
        const [result] = await cafesPool.query('DELETE FROM cafes WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (error) {
        console.error('Error in deleteCafe:', error.message);
        throw new Error('Failed to delete cafe.');
      }
    },
    updateCafePublishStatus: async (_parent, { id, publishStatus }) => {
      try {
        await cafesPool.query('UPDATE cafes SET publish_status = ? WHERE id = ?', [publishStatus, id]);
        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [id]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error('Error in updateCafePublishStatus:', error.message);
        throw new Error('Failed to update publish status.');
      }
    }
  },
  Cafe: {
    reviews: async (parent) => {
      try {
        const [rows] = await reviewsPool.query(
          'SELECT * FROM reviews WHERE cafe_id = ? ORDER BY id DESC',
          [parent.id]
        );
        return rows.map((row) => ({
          id: row.id,
          cafeId: row.cafe_id,
          userId: row.user_id,
          rating: row.rating,
          reviewText: row.review_text,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
        }));
      } catch (error) {
        console.error(`Error resolving Cafe.reviews for cafe ${parent.id}:`, error.message);
        return [];
      }
    },
    personalNotes: async (parent, { userId }) => {
      try {
        const [rows] = await notesPool.query(
          'SELECT * FROM personal_notes WHERE cafe_id = ? AND user_id = ? ORDER BY id DESC',
          [parent.id, userId]
        );
        return rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          cafeId: row.cafe_id,
          noteText: row.note_text,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
        }));
      } catch (error) {
        console.error(`Error resolving Cafe.personalNotes for cafe ${parent.id}:`, error.message);
        return [];
      }
    }
  }
};
