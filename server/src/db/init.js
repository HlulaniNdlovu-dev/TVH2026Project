import { readFile } from 'node:fs/promises';
import { pool, connectDatabase } from './pool.js';
import { loadDatabase } from './stubs.js';

// Creates the tables if needed, loads them into the in-memory cache, and seeds demo data into an empty database.
export async function initDatabase() {
  await connectDatabase();
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const statements = sql.split(';').map((s) => s.replace(/--.*$/gm, '').trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  const seeded = await loadDatabase();
  console.log(seeded ? 'Database was empty: demo data loaded.' : 'Database ready.');
}
