// backend/database/drop.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres',
});

async function dropDatabase() {
  const client = await pool.connect();
  
  try {
    const dbName = process.env.DB_NAME || 'students_management';
    console.log(`  WARNING: You are about to drop database: ${dbName}`);
    console.log('This action cannot be undone!');
    console.log('Type "DROP" to confirm:');
    
    // For automation, you can skip the prompt by passing --force
    if (!process.argv.includes('--force')) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Confirm: ', resolve);
      });
      
      rl.close();
      
      if (answer !== 'DROP') {
        console.log('Database drop cancelled.');
        return;
      }
    }
    
    // Terminate all connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);
    
    // Drop database
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(` Database ${dbName} dropped successfully`);
  } catch (error) {
    console.error(' Failed to drop database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  dropDatabase().catch(console.error);
}

module.exports = dropDatabase;