import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  UPLOADS_DIR: z.string().trim().min(1).default('uploads'),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).default(
    process.env.NODE_ENV === 'production' ? 'true' : 'false',
  ),
  OCR_LANGUAGES: z.string().trim().min(1).default('spa+eng'),
  ADMIN_USERNAME: z.string().trim().min(3).optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_DISPLAY_NAME: z.string().trim().min(1).default('Administrador SIPEC'),
  AREA_MANAGER_USERNAME: z.string().trim().min(3).default('kimberly.cisneros'),
  AREA_MANAGER_DISPLAY_NAME: z.string().trim().min(1).default('Kimberly Cisneros'),
  AREA_MANAGER_AREA: z.string().trim().max(160).optional().default(''),
  AREA_MANAGER_PASSWORD: z.string().min(12).optional(),
  HR_SPECIALIST_USERNAME: z.string().trim().min(3).default('rrhh.especialista'),
  HR_SPECIALIST_DISPLAY_NAME: z.string().trim().min(1).default('Sofia'),
  HR_SPECIALIST_PASSWORD: z.string().min(12).optional(),
  RESET_BOOTSTRAP_USER_PASSWORDS: z.enum(['true', 'false']).default('false'),
  PUBLIC_APPLICATION_PRIVACY_NOTICE_URL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().url().optional(),
  ),
  PUBLIC_APPLICATION_PRIVACY_NOTICE_VERSION: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).max(80).optional(),
  ),
  CONVOCATORIAS_API_URL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().url().optional(),
  ),
  CONVOCATORIAS_API_TOKEN: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  CONVOCATORIAS_SYNC_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error('Configuración inválida:', result.error.flatten().fieldErrors);
  process.exit(1);
}

if (Boolean(result.data.PUBLIC_APPLICATION_PRIVACY_NOTICE_URL)
  !== Boolean(result.data.PUBLIC_APPLICATION_PRIVACY_NOTICE_VERSION)) {
  console.error('Configuración inválida: el aviso de privacidad requiere URL y versión.');
  process.exit(1);
}

if (result.data.NODE_ENV === 'production'
  && result.data.PUBLIC_APPLICATION_PRIVACY_NOTICE_URL
  && new URL(result.data.PUBLIC_APPLICATION_PRIVACY_NOTICE_URL).protocol !== 'https:') {
  console.error('Configuración inválida: el aviso de privacidad debe usar HTTPS en producción.');
  process.exit(1);
}

const weakLocalPasswords = new Set([
  'AdminLocal123!',
  'AreaManager123!',
  'RecursosHumanos123!',
]);

if (result.data.NODE_ENV === 'production') {
  const passwords = [
    result.data.ADMIN_PASSWORD,
    result.data.AREA_MANAGER_PASSWORD,
    result.data.HR_SPECIALIST_PASSWORD,
  ];
  if (passwords.some((password) => !password || weakLocalPasswords.has(password))) {
    console.error('Configuración inválida: configura contraseñas seguras distintas a las de desarrollo.');
    process.exit(1);
  }
}

export const env = result.data;
