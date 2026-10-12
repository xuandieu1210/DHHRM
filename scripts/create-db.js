import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const databaseName = 'dhhrm';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Set DATABASE_URL in .env before creating the database.');
  process.exit(1);
}

const database = new URL(databaseUrl);
database.pathname = '/postgres';

const pool = new Pool({ connectionString: database.toString() });

try {
  const result = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (result.rowCount === 0) {
    await pool.query(`CREATE DATABASE ${databaseName}`);
  }
  console.log(`PostgreSQL database "${databaseName}" is ready.`);
} catch (error) {
  console.error('Could not create the PostgreSQL database:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}