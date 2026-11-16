import { hashPassword } from '../security/password.js';
import { env } from '../config/env.js';
import { pool } from './pool.js';

async function seedAdministrator() {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_USERNAME y ADMIN_PASSWORD (mínimo 12 caracteres) en backend/.env.');
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  const resetPassword = env.RESET_BOOTSTRAP_USER_PASSWORDS === 'true';
  const result = await pool.query(
    `INSERT INTO users (username, display_name, role, password_hash)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT (lower(username)) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         updated_at = now()
     WHERE $4::boolean AND users.role = 'admin'
     RETURNING id`,
    [env.ADMIN_USERNAME.toLowerCase(), env.ADMIN_DISPLAY_NAME, passwordHash, resetPassword],
  );

  if (!result.rowCount) {
    if (resetPassword) {
      throw new Error('No se pudo restablecer la cuenta admin; verifica que el usuario tenga el rol admin.');
    }
    console.info(`El usuario ${env.ADMIN_USERNAME} ya existe; no se modificó su contraseña.`);
  } else if (resetPassword) {
    console.info(`Contraseña del usuario ${env.ADMIN_USERNAME} sincronizada desde el entorno.`);
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
