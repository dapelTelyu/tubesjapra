import { foldersPool, cafesPool } from '../../config/db.js';

// Map database snake_case rows to GraphQL camelCase types
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

export const folderResolvers = {
  Query: {
    getUserFolders: async (_parent, { userId }) => {
      try {
        const [rows] = await foldersPool.query(
          'SELECT * FROM folders WHERE user_id = ? ORDER BY id DESC',
          [userId]
        );
        return rows.map(mapFolder);
      } catch (error) {
        console.error('Error in getUserFolders:', error.message);
        throw new Error('Failed to fetch user folders.');
      }
    }
  },
  Mutation: {
    createFolder: async (_parent, { userId, name }) => {
      try {
        const [result] = await foldersPool.query(
          'INSERT INTO folders (user_id, name) VALUES (?, ?)',
          [userId, name]
        );
        const folderId = result.insertId;
        const [rows] = await foldersPool.query('SELECT * FROM folders WHERE id = ?', [folderId]);
        return mapFolder(rows[0]);
      } catch (error) {
        console.error('Error in createFolder:', error.message);
        throw new Error('Failed to create folder.');
      }
    },
    addCafeToFolder: async (_parent, { folderId, cafeId }) => {
      try {
        // Insert with ON DUPLICATE KEY UPDATE to prevent duplicate rows in the mapping table
        await foldersPool.query(
          `INSERT INTO folder_cafes (folder_id, cafe_id) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE folder_id = folder_id`,
          [folderId, cafeId]
        );
        return true;
      } catch (error) {
        console.error('Error in addCafeToFolder:', error.message);
        throw new Error('Failed to add cafe to folder.');
      }
    }
  },
  Folder: {
    cafes: async (parent) => {
      try {
        // Get all cafe IDs mapped to this folder
        const [mappings] = await foldersPool.query(
          'SELECT cafe_id FROM folder_cafes WHERE folder_id = ?',
          [parent.id]
        );
        
        if (mappings.length === 0) {
          return [];
        }

        const cafeIds = mappings.map((m) => m.cafe_id);

        // Fetch cafe details from db_cafes
        const [rows] = await cafesPool.query(
          'SELECT * FROM cafes WHERE id IN (?) ORDER BY id DESC',
          [cafeIds]
        );
        return rows.map(mapCafe);
      } catch (error) {
        console.error(`Error resolving Folder.cafes for folder ${parent.id}:`, error.message);
        return [];
      }
    }
  }
};
