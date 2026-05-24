// Database connection wrapper with retry logic for Docker synchronization

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'srfti_password',
  database: process.env.DB_NAME || 'srfti_grievance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function connectWithRetry(retries = 5, delay = 5000) {
  console.log(`[MySQL] Attempting connection to host: ${dbConfig.host}...`);
  for (let i = 1; i <= retries; i++) {
    try {
      // Create a test connection
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
      });

      // Verify or create database
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
      await connection.end();

      // Initialize the connection pool
      pool = mysql.createPool(dbConfig);
      console.log(`[MySQL] Successfully connected to database: ${dbConfig.database}`);
      return pool;
    } catch (err) {
      console.error(`[MySQL] Connection attempt ${i} failed. Reason: ${err.message}`);
      if (i < retries) {
        console.log(`[MySQL] Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('[MySQL] Maximum database connection retries exceeded. Exiting server.');
        process.exit(1);
      }
    }
  }
}

// Helper to execute queries safely
async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool has not been initialized yet.');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

module.exports = {
  connectWithRetry,
  query,
  getPool: () => pool
};
