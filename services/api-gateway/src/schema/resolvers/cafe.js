import dotenv from 'dotenv';
dotenv.config();

const CAFE_SERVICE = process.env.CAFE_SERVICE_URL || 'http://cafe-service:3002';
const REVIEW_SERVICE = process.env.REVIEW_SERVICE_URL || 'http://review-service:3003';
const NOTE_SERVICE = process.env.NOTE_SERVICE_URL || 'http://note-service:3005';

async function callService(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `cafe-service call failed: ${url}`);
  }
  return data;
}

export const cafeResolvers = {
  Query: {
    getCafes: async () => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes`);
      } catch (err) {
        console.error('[gateway] getCafes error:', err.message);
        throw new Error('Failed to fetch cafes.');
      }
    },

    getCafeById: async (_parent, { id }) => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes/${id}`);
      } catch (err) {
        console.error('[gateway] getCafeById error:', err.message);
        throw new Error('Failed to fetch cafe by ID.');
      }
    },

    getPendingCafes: async () => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes/pending`);
      } catch (err) {
        console.error('[gateway] getPendingCafes error:', err.message);
        throw new Error('Failed to fetch pending cafes.');
      }
    }
  },

  Mutation: {
    createCafe: async (_parent, { name, description, address, photo, rating, review }) => {
      try {
        // 1. Create the cafe in cafe-service
        const cafe = await callService(`${CAFE_SERVICE}/cafes`, 'POST', {
          name, description, address, photo, rating
        });

        // 2. If initial review text is provided, add it via review-service (for user 1)
        if (review) {
          const defaultUserId = 1;
          const reviewRating = Math.round(rating || 5);
          const { avgRating } = await callService(`${REVIEW_SERVICE}/reviews`, 'POST', {
            cafeId: cafe.id, userId: defaultUserId, rating: reviewRating, reviewText: review
          });
          // 3. Update cafe rating based on new avg from review-service
          return await callService(`${CAFE_SERVICE}/cafes/${cafe.id}/rating`, 'PATCH', { rating: avgRating });
        }

        return cafe;
      } catch (err) {
        console.error('[gateway] createCafe error:', err.message);
        throw new Error('Failed to create cafe.');
      }
    },

    updateCafe: async (_parent, { id, name, description, address, photo, rating, review }) => {
      try {
        // 1. Update base cafe fields in cafe-service
        const cafe = await callService(`${CAFE_SERVICE}/cafes/${id}`, 'PUT', {
          name, description, address, photo, rating
        });

        // 2. If review text is provided, record it as a new review and recalculate rating
        if (review) {
          const defaultUserId = 1;
          const reviewRating = Math.round(rating || 5);
          const { avgRating } = await callService(`${REVIEW_SERVICE}/reviews`, 'POST', {
            cafeId: id, userId: defaultUserId, rating: reviewRating, reviewText: review
          });
          // 3. Update cafe with recalculated average rating
          return await callService(`${CAFE_SERVICE}/cafes/${id}/rating`, 'PATCH', { rating: avgRating });
        }

        return cafe;
      } catch (err) {
        console.error('[gateway] updateCafe error:', err.message);
        throw new Error('Failed to update cafe.');
      }
    },

    deleteCafe: async (_parent, { id }) => {
      try {
        const FOLDER_SERVICE = process.env.FOLDER_SERVICE_URL || 'http://folder-service:3004';

        // Orchestrate cascade deletion across all domain services before deleting the cafe
        // 1. Delete all reviews for this cafe from review-service
        await callService(`${REVIEW_SERVICE}/reviews?cafeId=${id}`, 'DELETE');
        // 2. Delete all personal notes for this cafe from note-service
        await callService(`${NOTE_SERVICE}/notes?cafeId=${id}`, 'DELETE');
        // 3. Remove all folder-cafe mappings for this cafe from folder-service
        await callService(`${FOLDER_SERVICE}/folders/cafe-mappings?cafeId=${id}`, 'DELETE');
        // 4. Finally delete the cafe record itself from cafe-service
        const result = await callService(`${CAFE_SERVICE}/cafes/${id}`, 'DELETE');
        return result.deleted || false;
      } catch (err) {
        console.error('[gateway] deleteCafe error:', err.message);
        throw new Error('Failed to delete cafe.');
      }
    },

    updateCafePublishStatus: async (_parent, { id, publishStatus }) => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes/${id}/status`, 'PATCH', { publishStatus });
      } catch (err) {
        console.error('[gateway] updateCafePublishStatus error:', err.message);
        throw new Error('Failed to update publish status.');
      }
    }
  },

  // Type resolvers — cross-service data fetching
  Cafe: {
    // Fetch reviews for a cafe from review-service
    reviews: async (parent) => {
      try {
        return await callService(`${REVIEW_SERVICE}/reviews?cafeId=${parent.id}`);
      } catch (err) {
        console.error(`[gateway] Cafe.reviews error for cafe ${parent.id}:`, err.message);
        return [];
      }
    },

    // Fetch personal notes for a cafe+user pair from note-service
    personalNotes: async (parent, { userId }) => {
      try {
        return await callService(`${NOTE_SERVICE}/notes?userId=${userId}&cafeId=${parent.id}`);
      } catch (err) {
        console.error(`[gateway] Cafe.personalNotes error for cafe ${parent.id}:`, err.message);
        return [];
      }
    }
  }
};
