import { env } from '../config/env.js';
import { pool } from './pool.js';
import { hashPassword } from '../security/password.js';
import { readFile } from 'node:fs/promises';

async function seedRoleUsers() {
  if (!env.AREA_MANAGER_PASSWORD || !env.HR_SPECIALIST_PASSWORD) {
    throw new Error(
      'Define AREA_MANAGER_PASSWORD y HR_SPECIALIST_PASSWORD (mínimo 12 caracteres) en backend/.env.',
    );
  }

  const users = [
    {
      username: env.AREA_MANAGER_USERNAME.toLowerCase(),
      displayName: env.AREA_MANAGER_DISPLAY_NAME,
      role: 'area_manager',
      passwordHash: await hashPassword(env.AREA_MANAGER_PASSWORD),
    },
    {
      username: env.HR_SPECIALIST_USERNAME.toLowerCase(),
      displayName: env.HR_SPECIALIST_DISPLAY_NAME,
      role: 'hr_specialist',
      passwordHash: await hashPassword(env.HR_SPECIALIST_PASSWORD),
    },
  ];

  if (new Set(users.map((user) => user.username)).size !== users.length) {
    throw new Error('Los usuarios iniciales de los roles deben tener nombres de usuario distintos.');
  }

  const seedSql = await readFile(new URL('./seeds/001_role_users.sql', import.meta.url), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM users
       WHERE username = 'jefe.area' AND role = 'area_manager'`,
    );

    await client.query(seedSql, users.flatMap((user) => [
      user.username,
      user.displayName,
      user.role,
      user.passwordHash,
    ]));

    await client.query('COMMIT');
    console.info(`Cuentas de rol configuradas: ${users.map(({ username }) => username).join(', ')}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedRoleUsers()
  .catch((error) => {
    console.error('No se pudieron configurar las cuentas de rol:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
