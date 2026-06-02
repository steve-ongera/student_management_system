// database/setup.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let mainPool = null;
let dbPool = null;

async function setupDatabase() {
  try {
    console.log('🟡 Starting database setup...');
    
    const dbName = process.env.DB_NAME || 'students_management';
    
    // Create main pool connection to postgres database
    mainPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: 'postgres',
    });
    
    const client = await mainPool.connect();
    
    try {
      // Check if database exists
      const checkDb = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );
      
      if (checkDb.rows.length === 0) {
        console.log(`🟡 Creating database: ${dbName}`);
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database ${dbName} created successfully`);
      } else {
        console.log(`✅ Database ${dbName} already exists`);
      }
    } finally {
      client.release();
    }
    
    // Close main pool
    await mainPool.end();
    mainPool = null;
    
    // Connect to the new database
    dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: dbName,
    });
    
    const dbClient = await dbPool.connect();
    
    try {
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }
      
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('🟡 Creating database schema...');
      
      // Split SQL into individual statements
      const statements = schemaSQL
        .split(';')
        .filter(statement => statement.trim().length > 0)
        .map(statement => statement.trim());
      
      let executedCount = 0;
      for (const statement of statements) {
        try {
          await dbClient.query(statement);
          executedCount++;
          
          // Log progress every 10 statements
          if (executedCount % 10 === 0) {
            console.log(`   Executed ${executedCount}/${statements.length} statements...`);
          }
        } catch (err) {
          // Ignore "already exists" errors for tables, indexes, and views
          if (!err.message.includes('already exists') && 
              !err.message.includes('relation') &&
              !err.message.includes('Duplicate')) {
            console.error('Error executing statement:', statement.substring(0, 200));
            throw err;
          }
        }
      }
      
      console.log(`✅ Database schema created successfully (${executedCount} statements executed)`);
    } finally {
      dbClient.release();
    }
    
    // Close db pool
    await dbPool.end();
    dbPool = null;
    
    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    // Ensure all pools are closed
    if (mainPool) {
      await mainPool.end().catch(console.error);
    }
    if (dbPool) {
      await dbPool.end().catch(console.error);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;