import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = Router();
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

// POST /users/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This email is already registered. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
      [name.trim(), email.toLowerCase(), passwordHash]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = mapUser(rows[0]);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[user-service] signup error:', err.message);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// POST /users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password.' });

    const isValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = mapUser(rows[0]);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user });
  } catch (err) {
    console.error('[user-service] login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(mapUser(rows[0]));
  } catch (err) {
    console.error('[user-service] getUser error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /users/:id
router.put('/:id', async (req, res) => {
  const { name, bio, profilePic } = req.body;
  try {
    await pool.query(
      `UPDATE users
       SET name = COALESCE(?, name),
           bio = COALESCE(?, bio),
           profile_pic = COALESCE(?, profile_pic)
       WHERE id = ?`,
      [name || null, bio || null, profilePic || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(mapUser(rows[0]));
  } catch (err) {
    console.error('[user-service] updateUser error:', err.message);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

export default router;
