import { hashPassword } from '../security/password.js';
import { env } from '../config/env.js';
import { pool } from './pool.js';

async function seedAdministrator() {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_USERNAME y ADMIN_PASSWORD (mínimo 12 caracteres) en backend/.env.');
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  const result = await pool.query(
    `INSERT INTO users (username, display_name, role, password_hash)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [env.ADMIN_USERNAME.toLowerCase(), env.ADMIN_DISPLAY_NAME, passwordHash],
  );

  if (!result.rowCount) {
    console.info(`El usuario ${env.ADMIN_USERNAME} ya existe; no se modificó su contraseña.`);
  } else {
    console.info(`Usuario administrador creado: ${env.ADMIN_USERNAME}`);
  }
}

seedAdministrator()
  .catch((error) => {
    console.error('No se pudo crear el usuario inicial:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
