import { notesPool, cafesPool } from '../../config/db.js';

// Map database snake_case rows to GraphQL camelCase types
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

export const noteResolvers = {
  Mutation: {
    addPersonalNote: async (_parent, { userId, cafeId, noteText }) => {
      try {
        const [result] = await notesPool.query(
          `INSERT INTO personal_notes (user_id, cafe_id, note_text) 
           VALUES (?, ?, ?)`,
          [userId, cafeId, noteText]
        );
        const noteId = result.insertId;
        const [rows] = await notesPool.query('SELECT * FROM personal_notes WHERE id = ?', [noteId]);
        return mapNote(rows[0]);
      } catch (error) {
        console.error('Error in addPersonalNote:', error.message);
        throw new Error('Failed to create personal note.');
      }
    },
    updatePersonalNote: async (_parent, { id, noteText }) => {
      try {
        await notesPool.query(
          'UPDATE personal_notes SET note_text = ? WHERE id = ?',
          [noteText, id]
        );
        const [rows] = await notesPool.query('SELECT * FROM personal_notes WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Personal note not found.');
        }
        return mapNote(rows[0]);
      } catch (error) {
        console.error('Error in updatePersonalNote:', error.message);
        throw new Error('Failed to update personal note.');
      }
    }
  },
  PersonalNote: {
    cafe: async (parent) => {
      try {
        const [rows] = await cafesPool.query('SELECT * FROM cafes WHERE id = ?', [parent.cafeId]);
        return mapCafe(rows[0]);
      } catch (error) {
        console.error(`Error resolving PersonalNote.cafe for note ${parent.id}:`, error.message);
        return null;
      }
    }
  }
};
