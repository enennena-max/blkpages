// Database connection module for BlkPages backend
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('📊 Database pool connected');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

// Export pool for use in other modules
export default pool;

// Export query function for convenience
export const query = (text, params) => pool.query(text, params);
