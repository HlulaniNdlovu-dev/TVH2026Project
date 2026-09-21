import './env.js';

// Database connection order:
//   1. DATABASE_URL, if set (explicit override: only this one is used).
//   2. The local MySQL (DB_*), tried first with a short timeout.
//   3. The online MySQL (ONLINE_DB_*), used when the local one cannot be reached.
// Credentials for the online database live in server/.env locally, or in the Render environment tab. Never in the code.
const flag = (value, fallback = false) => (value === undefined || value === '' ? fallback : ['1', 'true', 'yes'].includes(String(value).toLowerCase()));
const tls = (enabled) => (enabled ? { rejectUnauthorized: flag(process.env.DB_SSL_REJECT_UNAUTHORIZED, true) } : undefined);

const local = {
  name: 'local MySQL',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'powerlink',
  ssl: tls(flag(process.env.DB_SSL)),
  connectTimeout: 3000,
  canCreateDatabase: true,
};

const online = process.env.ONLINE_DB_HOST
  ? {
      name: 'online MySQL',
      host: process.env.ONLINE_DB_HOST,
      port: Number(process.env.ONLINE_DB_PORT || 3306),
      user: process.env.ONLINE_DB_USER,
      password: process.env.ONLINE_DB_PASSWORD ?? '',
      database: process.env.ONLINE_DB_NAME || 'defaultdb',
      ssl: tls(flag(process.env.ONLINE_DB_SSL, true)),
      connectTimeout: 15000,
      canCreateDatabase: false,
    }
  : null;

const fromUrl = process.env.DATABASE_URL
  ? { name: 'DATABASE_URL', uri: process.env.DATABASE_URL, ssl: tls(flag(process.env.DB_SSL)), connectTimeout: 15000, canCreateDatabase: false }
  : null;

export const dbCandidates = fromUrl ? [fromUrl] : [local, online].filter(Boolean);
export const poolSize = Number(process.env.DB_POOL_SIZE || 10);
