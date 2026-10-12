import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { INITIAL_EMPLOYEES } from '../src/data/initialEmployees';
import { INITIAL_INTERVIEWS } from '../src/data/initialRecruitment';
import { INITIAL_SALARIES } from '../src/data/initialSalaries';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const seedCollections = {
  employees: INITIAL_EMPLOYEES,
  candidates: INITIAL_INTERVIEWS,
  salaries: INITIAL_SALARIES,
};

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_records (
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload JSONB NOT NULL,
      PRIMARY KEY (collection, record_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const count = await client.query('SELECT COUNT(*)::int AS count FROM app_records');
    if (count.rows[0].count === 0) {
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || '';
      if (initialAdminPassword.length < 10) {
        throw new Error('Set INITIAL_ADMIN_PASSWORD to at least 10 characters in .env before seeding.');
      }
      const seedData = {
        ...seedCollections,
        users: [{
          id: 'user-admin',
          username: process.env.INITIAL_ADMIN_USERNAME || 'admin',
          passwordHash: await bcrypt.hash(initialAdminPassword, 12),
          fullName: 'System Administrator',
          email: 'admin@dhtextile.vn',
          role: 'admin',
          department: 'HR & Admin',
          position: 'System Administrator',
          isActive: true,
          createdAt: new Date().toISOString().slice(0, 10),
          avatarColor: 'bg-slate-900',
        }],
      };
      for (const [collection, records] of Object.entries(seedData)) {
        for (const record of records) {
          await client.query(
            'INSERT INTO app_records (collection, record_id, payload) VALUES ($1, $2, $3::jsonb)',
            [collection, record.id, JSON.stringify(record)]
          );
        }
      }
      await client.query(
        "INSERT INTO app_settings (key, value) VALUES ('initialized', 'true'::jsonb), ('seed_data', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify({ employees: seedData.employees, candidates: seedData.candidates, salaries: seedData.salaries })]
      );
      console.log('DHHRM data and initial accounts were seeded in PostgreSQL.');
    } else {
      await client.query(
        "INSERT INTO app_settings (key, value) VALUES ('seed_data', $1::jsonb) ON CONFLICT (key) DO NOTHING",
        [JSON.stringify(seedCollections)]
      );
      console.log('Database already contains data; seed skipped.');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error('Could not seed PostgreSQL:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}