import { readFile } from 'node:fs/promises';
import { pool, connectDatabase } from './pool.js';
import { seedIfEmpty } from './stubs.js';

// Creates the database and tables if needed, then loads the demo data into an empty database.
export async function initDatabase() {
  await connectDatabase();
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const statements = sql.split(';').map((s) => s.replace(/--.*$/gm, '').trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  const seeded = await seedIfEmpty();
  console.log(seeded ? 'Database was empty: demo data loaded.' : 'Database ready.');
}
