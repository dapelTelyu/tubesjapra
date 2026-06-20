import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'adminpass',
  database: process.env.DB_NAME || 'db_reviews',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testConnection(retries = 10, delayMs = 3000) {
  const dbName = process.env.DB_NAME || 'db_reviews';
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      console.log(`✅ [review-service] Connected to ${dbName}`);
      conn.release();
      return;
    } catch (err) {
      console.warn(`⚠️  Attempt ${i}/${retries} - Failed to connect to ${dbName}: ${err.message}`);
      if (i < retries) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Could not connect to ${dbName} after ${retries} attempts.`);
}
