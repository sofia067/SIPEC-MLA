import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const migrationsDirectory = fileURLToPath(new URL('./migrations/', import.meta.url));
const lockId = 2026101601;

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockId]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = await readFile(new URL(`./migrations/${file}`, import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [file],
      );

      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`La migración aplicada ${file} fue modificada; crea una nueva migración.`);
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [file, checksum],
        );
        await client.query('COMMIT');
        console.info(`Migración aplicada: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

migrate().catch((error) => {
  console.error('No se pudieron aplicar las migraciones:', error);
  process.exitCode = 1;
});
