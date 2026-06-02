// backend/database/setup.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres', // Connect to default database first
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log(' Starting database setup...');
    
    // Check if database exists, if not create it
    const dbName = process.env.DB_NAME || 'students_management';
    const checkDb = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (checkDb.rows.length === 0) {
      console.log(` Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(` Database ${dbName} created successfully`);
    } else {
      console.log(` Database ${dbName} already exists`);
    }
    
    // Connect to the new database
    const dbClient = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: dbName,
    });
    
    const dbConnection = await dbClient.connect();
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log(' Creating database schema...');
    await dbConnection.query(schemaSQL);
    console.log(' Database schema created successfully');
    
    dbConnection.release();
    await dbClient.end();
    
    console.log(' Database setup completed successfully!');
  } catch (error) {
    console.error(' Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = setupDatabase;