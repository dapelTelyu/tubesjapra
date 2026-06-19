import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usersPool } from '../../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'spf_super_secret_key_change_in_production';
const JWT_EXPIRES_IN = '7d';

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || 'user',
    bio: row.bio,
    profilePic: row.profile_pic,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
};

export const userResolvers = {
  Query: {
    getProfile: async (_parent, { userId }) => {
      try {
        const [rows] = await usersPool.query('SELECT * FROM users WHERE id = ?', [userId]);
        return mapUser(rows[0]);
      } catch (error) {
        console.error('Error in getProfile resolver:', error.message);
        throw new Error('Failed to fetch user profile.');
      }
    },

    me: async (_parent, _args, context) => {
      if (!context.userId) throw new Error('Not authenticated.');
      try {
        const [rows] = await usersPool.query('SELECT * FROM users WHERE id = ?', [context.userId]);
        return mapUser(rows[0]);
      } catch (error) {
        console.error('Error in me resolver:', error.message);
        throw new Error('Failed to fetch current user.');
      }
    }
  },

  Mutation: {
    signup: async (_parent, { name, email, password }) => {
      try {
        // Check if email already registered
        const [existing] = await usersPool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing.length > 0) {
          throw new Error('This email is already registered. Please log in instead.');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await usersPool.query(
          `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
          [name.trim(), email.toLowerCase(), passwordHash]
        );

        const userId = result.insertId;
        const [rows] = await usersPool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = mapUser(rows[0]);

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return { token, user };
      } catch (error) {
        console.error('Error in signup resolver:', error.message);
        throw new Error(error.message || 'Signup failed. Please try again.');
      }
    },

    login: async (_parent, { email, password }) => {
      try {
        const [rows] = await usersPool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length === 0) {
          throw new Error('Invalid email or password.');
        }

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        const mappedUser = mapUser(user);
        const token = jwt.sign({ userId: mappedUser.id, role: mappedUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return { token, user: mappedUser };
      } catch (error) {
        console.error('Error in login resolver:', error.message);
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    },

    updateProfile: async (_parent, { userId, name, bio, profilePic }) => {
      try {
        await usersPool.query(
          `UPDATE users 
           SET name = COALESCE(?, name), 
               bio = COALESCE(?, bio), 
               profile_pic = COALESCE(?, profile_pic) 
           WHERE id = ?`,
          [name, bio, profilePic, userId]
        );

        const [rows] = await usersPool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
          throw new Error('User profile not found after update.');
        }
        return mapUser(rows[0]);
      } catch (error) {
        console.error('Error in updateProfile resolver:', error.message);
        throw new Error('Failed to update user profile.');
      }
    }
  }
};
