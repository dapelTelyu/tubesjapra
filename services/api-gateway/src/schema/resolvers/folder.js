import dotenv from 'dotenv';
dotenv.config();

const FOLDER_SERVICE = process.env.FOLDER_SERVICE_URL || 'http://folder-service:3004';
const CAFE_SERVICE = process.env.CAFE_SERVICE_URL || 'http://cafe-service:3002';

async function callService(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `folder-service call failed: ${url}`);
  }
  return data;
}

export const folderResolvers = {
  Query: {
    getUserFolders: async (_parent, { userId }) => {
      try {
        return await callService(`${FOLDER_SERVICE}/folders?userId=${userId}`);
      } catch (err) {
        console.error('[gateway] getUserFolders error:', err.message);
        throw new Error('Failed to fetch user folders.');
      }
    }
  },

  Mutation: {
    createFolder: async (_parent, { userId, name }) => {
      try {
        return await callService(`${FOLDER_SERVICE}/folders`, 'POST', { userId, name });
      } catch (err) {
        console.error('[gateway] createFolder error:', err.message);
        throw new Error('Failed to create folder.');
      }
    },

    addCafeToFolder: async (_parent, { folderId, cafeId }) => {
      try {
        const result = await callService(`${FOLDER_SERVICE}/folders/${folderId}/cafes`, 'POST', { cafeId });
        return result.added || false;
      } catch (err) {
        console.error('[gateway] addCafeToFolder error:', err.message);
        throw new Error('Failed to add cafe to folder.');
      }
    }
  },

  // Type resolver — cross-service data fetching
  Folder: {
    // Resolve cafes in a folder: get IDs from folder-service, fetch details from cafe-service
    cafes: async (parent) => {
      try {
        // 1. Get the list of cafeIds from folder-service
        const cafeIds = await callService(`${FOLDER_SERVICE}/folders/${parent.id}/cafes`);
        if (!cafeIds.length) return [];

        // 2. Batch fetch cafe details from cafe-service using a single request
        const ids = cafeIds.join(',');
        return await callService(`${CAFE_SERVICE}/cafes/batch?ids=${ids}`);
      } catch (err) {
        console.error(`[gateway] Folder.cafes error for folder ${parent.id}:`, err.message);
        return [];
      }
    }
  }
};
