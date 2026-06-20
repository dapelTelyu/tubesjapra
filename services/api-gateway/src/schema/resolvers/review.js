import dotenv from 'dotenv';
dotenv.config();

const REVIEW_SERVICE = process.env.REVIEW_SERVICE_URL || 'http://review-service:3003';
const CAFE_SERVICE = process.env.CAFE_SERVICE_URL || 'http://cafe-service:3002';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3001';

async function callService(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `review-service call failed: ${url}`);
  }
  return data;
}

export const reviewResolvers = {
  Mutation: {
    addReview: async (_parent, { cafeId, userId, rating, reviewText }) => {
      try {
        // 1. Submit review to review-service; it returns review + computed avgRating
        const { review, avgRating } = await callService(`${REVIEW_SERVICE}/reviews`, 'POST', {
          cafeId, userId, rating, reviewText
        });
        // 2. Gateway updates cafe rating in cafe-service (cross-service orchestration)
        await callService(`${CAFE_SERVICE}/cafes/${cafeId}/rating`, 'PATCH', { rating: avgRating });
        return review;
      } catch (err) {
        console.error('[gateway] addReview error:', err.message);
        throw new Error('Failed to submit review.');
      }
    },

    updateReview: async (_parent, { id, rating, reviewText }) => {
      try {
        // 1. Update review in review-service; it returns updated review + new avgRating
        const { review, avgRating } = await callService(
          `${REVIEW_SERVICE}/reviews/${id}`, 'PUT', { rating, reviewText }
        );
        // 2. Update cafe rating in cafe-service
        await callService(`${CAFE_SERVICE}/cafes/${review.cafeId}/rating`, 'PATCH', { rating: avgRating });
        return review;
      } catch (err) {
        console.error('[gateway] updateReview error:', err.message);
        throw new Error('Failed to update review.');
      }
    }
  },

  // Type resolvers — cross-service data fetching
  Review: {
    // Fetch the author of a review from user-service
    user: async (parent) => {
      try {
        return await callService(`${USER_SERVICE}/users/${parent.userId}`);
      } catch (err) {
        console.error(`[gateway] Review.user error for review ${parent.id}:`, err.message);
        return null;
      }
    },

    // Fetch the cafe associated with a review from cafe-service
    cafe: async (parent) => {
      try {
        return await callService(`${CAFE_SERVICE}/cafes/${parent.cafeId}`);
      } catch (err) {
        console.error(`[gateway] Review.cafe error for review ${parent.id}:`, err.message);
        return null;
      }
    }
  }
};
