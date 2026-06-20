import dotenv from 'dotenv';
dotenv.config();

const NOTE_SERVICE = process.env.NOTE_SERVICE_URL || 'http://note-service:3005';
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
    throw new Error(data.error || `note-service call failed: ${url}`);
  }
  return data;
}

export const noteResolvers = {
  Mutation: {
    addPersonalNote: async (_parent, { userId, cafeId, noteText }) => {
      try {
        return await callService(`${NOTE_SERVICE}/notes`, 'POST', { userId, cafeId, noteText });
      } catch (err) {
        console.error('[gateway] addPersonalNote error:', err.message);
        throw new Error('Failed to create personal note.');
      }
    },

    updatePersonalNote: async (_parent, { id, noteText }) => {
      try {
        return await callService(`${NOTE_SERVICE}/notes/${id}`, 'PUT', { noteText });
      } catch (err) {
        console.error('[gateway] updatePersonalNote error:', err.message);
        throw new Error('Failed to update personal note.');
      }
    }
  },

  // Type resolver — cross-service data fetching
  PersonalNote: {
    // Fetch the associated cafe from cafe-service
    cafe: async (parent) => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes/${parent.cafeId}`);
      } catch (err) {
        console.error(`[gateway] PersonalNote.cafe error for note ${parent.id}:`, err.message);
        return null;
      }
    }
  }
};
