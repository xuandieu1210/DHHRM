import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import express from 'express';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3002);
const collections = ['employees', 'candidates', 'salaries', 'users'];
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const directory = path.dirname(fileURLToPath(import.meta.url));
const sessionCookie = 'dhhrm_session';
const sessionDurationMs = 8 * 60 * 60 * 1000;

app.use(express.json({ limit: '20mb' }));

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getCookie(request, name) {
  const cookie = request.headers.cookie?.split(';').map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function getSessionUser(request) {
  const token = getCookie(request, sessionCookie);
  if (!token) return null;

  const { rows } = await pool.query(
    `SELECT r.payload, s.token_hash
     FROM app_sessions s
     JOIN app_records r ON r.collection = 'users' AND r.record_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashToken(token)]
  );
  const user = rows[0]?.payload;
  if (!user?.isActive) {
    await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashToken(token)]);
    return null;
  }
  return user;
}

const requireSession = asyncRoute(async (request, response, next) => {
  request.user = await getSessionUser(request);
  if (!request.user) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
});

async function readData(client, user) {
  const { rows } = await client.query(
    'SELECT collection, record_id, payload FROM app_records ORDER BY collection, record_id'
  );
  const data = Object.fromEntries(collections.map((collection) => [collection, []]));
  for (const row of rows) {
    const record = row.collection === 'users' ? publicUser(row.payload) : row.payload;
    if (row.collection === 'employees' && !['admin', 'hr_manager'].includes(user.role)) {
      const { houseSubsidy: _houseSubsidy, ...visibleRecord } = record;
      data[row.collection].push(visibleRecord);
    } else {
      data[row.collection].push(record);
    }
  }

  if (!['admin', 'hr_manager', 'recruiter'].includes(user.role)) data.candidates = [];
  if (!['admin', 'hr_manager'].includes(user.role)) data.salaries = [];
  if (user.role !== 'admin') data.users = [];
  return data;
}

async function replaceCollection(client, collection, records) {
  if (!Array.isArray(records)) {
    throw new Error(`Expected an array for ${collection}`);
  }

  const seenIds = new Set();
  for (const record of records) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id) {
      throw new Error(`Every ${collection} record must have a string id`);
    }
    if (seenIds.has(record.id)) {
      throw new Error(`Duplicate id in ${collection}: ${record.id}`);
    }
    seenIds.add(record.id);
  }

  await client.query('DELETE FROM app_records WHERE collection = $1', [collection]);
  for (const record of records) {
    await client.query(
      'INSERT INTO app_records (collection, record_id, payload) VALUES ($1, $2, $3::jsonb)',
      [collection, record.id, JSON.stringify(record)]
    );
  }
}

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const username = String(request.body?.username || '').trim().toLowerCase();
  const password = String(request.body?.password || '');
  if (!username || !password) {
    response.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const result = await pool.query(
    "SELECT record_id, payload FROM app_records WHERE collection = 'users' AND LOWER(payload->>'username') = $1",
    [username]
  );
  const account = result.rows[0];
  if (!account || !account.payload.isActive) {
    response.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const storedPassword = account.payload.passwordHash || '';
  const isBcryptHash = /^\$2[aby]\$/.test(storedPassword);
  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(password, storedPassword)
    : storedPassword === password;
  if (!passwordMatches) {
    response.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const now = new Date();
  const updatedAccount = {
    ...account.payload,
    ...(isBcryptHash ? {} : { passwordHash: await bcrypt.hash(password, 12) }),
    lastLogin: now.toISOString().replace('T', ' ').slice(0, 16),
  };
  await pool.query(
    "UPDATE app_records SET payload = $1::jsonb WHERE collection = 'users' AND record_id = $2",
    [JSON.stringify(updatedAccount), account.record_id]
  );

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + sessionDurationMs);
  await pool.query(
    'INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), account.record_id, expiresAt]
  );
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionDurationMs,
  });
  response.json({ user: publicUser(updatedAccount) });
}));

app.get('/api/auth/session', asyncRoute(async (request, response) => {
  const user = await getSessionUser(request);
  response.json({ user: user ? publicUser(user) : null });
}));

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  const token = getCookie(request, sessionCookie);
  if (token) {
    await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashToken(token)]);
  }
  response.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'lax', path: '/' });
  response.json({ ok: true });
}));

app.get('/api/data', requireSession, asyncRoute(async (request, response) => {
  const client = await pool.connect();
  try {
    response.json(await readData(client, request.user));
  } finally {
    client.release();
  }
}));

app.put('/api/data/:collection', requireSession, asyncRoute(async (request, response) => {
  const { collection } = request.params;
  const allowedRoles = {
    employees: ['admin', 'hr_manager', 'recruiter'],
    candidates: ['admin', 'hr_manager', 'recruiter'],
    salaries: ['admin', 'hr_manager'],
    users: ['admin'],
  };
  if (!collections.includes(collection)) {
    response.status(404).json({ error: 'Unknown data collection' });
    return;
  }
  if (!allowedRoles[collection].includes(request.user.role)) {
    response.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let records = request.body?.records;
    const changedPasswordUserIds = [];
    if (collection === 'employees' && request.user.role === 'recruiter' && Array.isArray(records)) {
      const { rows } = await client.query(
        "SELECT record_id, payload FROM app_records WHERE collection = 'employees'"
      );
      const existingEmployees = new Map(rows.map(row => [row.record_id, row.payload]));
      records = records.map(record => {
        if (!record || typeof record !== 'object') return record;
        const { houseSubsidy: _submittedHouseSubsidy, ...safeRecord } = record;
        const existing = existingEmployees.get(record.id);
        return existing && Object.prototype.hasOwnProperty.call(existing, 'houseSubsidy')
          ? { ...safeRecord, houseSubsidy: existing.houseSubsidy }
          : safeRecord;
      });
    }
    if (collection === 'users') {
      if (!Array.isArray(records)) throw new Error('Expected an array for users');
      const safeRecords = [];
      for (const record of records) {
        if (!record || typeof record.id !== 'string') throw new Error('Every user must have an id');
        const existing = await client.query(
          "SELECT payload FROM app_records WHERE collection = 'users' AND record_id = $1",
          [record.id]
        );
        const previous = existing.rows[0]?.payload;
        const { password: submittedPassword = '', ...userFields } = record;
        let passwordHash = previous?.passwordHash;
        if (submittedPassword && submittedPassword !== passwordHash) {
          if (!/^\$2[aby]\$/.test(submittedPassword) && submittedPassword.length < 10) {
            throw new Error('Passwords must contain at least 10 characters');
          }
          passwordHash = /^\$2[aby]\$/.test(submittedPassword)
            ? submittedPassword
            : await bcrypt.hash(submittedPassword, 12);
          changedPasswordUserIds.push(record.id);
        }
        if (!passwordHash) throw new Error('A password is required for every new user');
        safeRecords.push({ ...userFields, passwordHash });
      }
      records = safeRecords;
    }

    await replaceCollection(client, collection, records);
    if (collection === 'users') {
      await client.query(`
        DELETE FROM app_sessions
        WHERE user_id = ANY($1::text[]) OR user_id NOT IN (
          SELECT record_id FROM app_records
          WHERE collection = 'users' AND (payload->>'isActive')::boolean
        )
      `, [changedPasswordUserIds]);
    }
    await client.query('COMMIT');
    response.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/data/reset', requireSession, asyncRoute(async (request, response) => {
  if (request.user.role !== 'admin') {
    response.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT value FROM app_settings WHERE key = 'seed_data'");
    if (!rows[0]) throw new Error('Database seed snapshot is unavailable');
    for (const collection of ['employees', 'candidates', 'salaries']) {
      await replaceCollection(client, collection, rows[0].value[collection]);
    }
    await client.query('COMMIT');
    response.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

const builtApp = path.join(directory, 'dist');
app.use(express.static(builtApp));
app.get('*', (_request, response) => {
  response.sendFile(path.join(builtApp, 'index.html'));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  const status = error.status || 500;
  response.status(status).json({
    error: status >= 500 ? 'Database request failed' : error.message,
  });
});

async function start() {
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
  await pool.query('DELETE FROM app_sessions WHERE expires_at <= NOW()');

  const { rows: userRows } = await pool.query(
    "SELECT record_id, payload FROM app_records WHERE collection = 'users'"
  );
  for (const row of userRows) {
    if (!/^\$2[aby]\$/.test(row.payload.passwordHash || '')) {
      const updatedUser = { ...row.payload, passwordHash: await bcrypt.hash(row.payload.passwordHash || '', 12) };
      await pool.query(
        "UPDATE app_records SET payload = $1::jsonb WHERE collection = 'users' AND record_id = $2",
        [JSON.stringify(updatedUser), row.record_id]
      );
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DHHRM API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Could not connect to PostgreSQL:', error.message);
  process.exit(1);
});