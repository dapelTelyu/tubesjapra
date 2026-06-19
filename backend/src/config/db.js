import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const commonConfig = {
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'adminpass',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create separate pools for each domain database
export const usersPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DB_NAME_USERS || 'db_users'
});

export const cafesPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DB_NAME_CAFES || 'db_cafes'
});

export const reviewsPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DB_NAME_REVIEWS || 'db_reviews'
});

export const foldersPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DB_NAME_FOLDERS || 'db_folders'
});

export const notesPool = mysql.createPool({
  ...commonConfig,
  database: process.env.DB_NAME_NOTES || 'db_notes'
});

// Function to verify connectivity to all 5 databases with retry logic
export async function testDbConnections(retries = 10, delayMs = 3000) {
  const targets = [
    { name: 'db_users',   pool: usersPool   },
    { name: 'db_cafes',   pool: cafesPool   },
    { name: 'db_reviews', pool: reviewsPool },
    { name: 'db_folders', pool: foldersPool },
    { name: 'db_notes',   pool: notesPool   }
  ];

  console.log('Initializing database connection checks...');

  for (let attempt = 1; attempt <= retries; attempt++) {
    let allOk = true;
    for (const target of targets) {
      try {
        const connection = await target.pool.getConnection();
        console.log(`✅ Connected to database: ${target.name}`);
        connection.release();
      } catch (error) {
        console.warn(`⚠️  Attempt ${attempt}/${retries} - Failed to connect to ${target.name}: ${error.message}`);
        allOk = false;
        break;
      }
    }

    if (allOk) {
      console.log('🎉 All 5 database connections verified successfully.');
      return;
    }

    if (attempt < retries) {
      console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Could not connect to one or more databases after multiple attempts.');
}
