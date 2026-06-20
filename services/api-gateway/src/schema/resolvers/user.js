import dotenv from 'dotenv';
dotenv.config();

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3001';

// Generic HTTP call helper for service-to-service communication
async function callService(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `user-service call failed: ${url}`);
  }
  return data;
}

export const userResolvers = {
  Query: {
    getProfile: async (_parent, { userId }) => {
      try {
        return await callService(`${USER_SERVICE}/users/${userId}`);
      } catch (err) {
        console.error('[gateway] getProfile error:', err.message);
        throw new Error('Failed to fetch user profile.');
      }
    },

    me: async (_parent, _args, context) => {
      if (!context.userId) throw new Error('Not authenticated.');
      try {
        return await callService(`${USER_SERVICE}/users/${context.userId}`);
      } catch (err) {
        console.error('[gateway] me error:', err.message);
        throw new Error('Failed to fetch current user.');
      }
    }
  },

  Mutation: {
    signup: async (_parent, { name, email, password }) => {
      try {
        return await callService(`${USER_SERVICE}/users/signup`, 'POST', { name, email, password });
      } catch (err) {
        console.error('[gateway] signup error:', err.message);
        throw new Error(err.message || 'Signup failed. Please try again.');
      }
    },

    login: async (_parent, { email, password }) => {
      try {
        return await callService(`${USER_SERVICE}/users/login`, 'POST', { email, password });
      } catch (err) {
        console.error('[gateway] login error:', err.message);
        throw new Error(err.message || 'Login failed. Please try again.');
      }
    },

    updateProfile: async (_parent, { userId, name, bio, profilePic }) => {
      try {
        return await callService(`${USER_SERVICE}/users/${userId}`, 'PUT', { name, bio, profilePic });
      } catch (err) {
        console.error('[gateway] updateProfile error:', err.message);
        throw new Error('Failed to update user profile.');
      }
    }
  }
};
