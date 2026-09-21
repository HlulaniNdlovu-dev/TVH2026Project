import mysql from 'mysql2/promise';
import { dbCandidates, poolSize } from '../config/db.js';

let active = null;

// The rest of the app imports `pool` once; it forwards to whichever database connectDatabase() picked.
export const pool = {
  query: (...args) => active.query(...args),
  getConnection: () => active.getConnection(),
};

const shared = { waitForConnections: true, connectionLimit: poolSize, charset: 'utf8mb4' };

function connectionOptions(c) {
  const base = c.uri ? { uri: c.uri } : { host: c.host, port: c.port, user: c.user, password: c.password, database: c.database };
  return { ...base, ssl: c.ssl, connectTimeout: c.connectTimeout };
}

// Local convenience: create the database if it does not exist (hosted databases already exist).
async function ensureDatabase(c) {
  if (!c.canCreateDatabase) return;
  try {
    const conn = await mysql.createConnection({ host: c.host, port: c.port, user: c.user, password: c.password, ssl: c.ssl, connectTimeout: c.connectTimeout });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${c.database.replace(/`/g, '')}\` CHARACTER SET utf8mb4`);
    await conn.end();
  } catch {
    // The real problem, if any, shows up when the pool connects below.
  }
}

// Tries each configured database in order and keeps the first one that answers.
export async function connectDatabase() {
  const failures = [];
  for (const candidate of dbCandidates) {
    try {
      await ensureDatabase(candidate);
      const candidatePool = mysql.createPool({ ...connectionOptions(candidate), ...shared });
      await candidatePool.query('SELECT 1');
      active = candidatePool;
      console.log(`Connected to the ${candidate.name}${candidate.host ? ` (${candidate.host}:${candidate.port}/${candidate.database})` : ''}`);
      return candidate.name;
    } catch (err) {
      failures.push(`${candidate.name}: ${err.message}`);
      console.warn(`Could not reach the ${candidate.name}: ${err.message}`);
    }
  }
  throw new Error(failures.join(' | ') || 'no database configured');
}
