import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).default(
    process.env.NODE_ENV === 'production' ? 'true' : 'false',
  ),
  UPLOADS_DIR: z.string().trim().min(1).default('uploads'),
  OCR_LANGUAGES: z.string().trim().min(1).default('spa+eng'),
  ADMIN_USERNAME: z.string().trim().min(3).optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_DISPLAY_NAME: z.string().trim().min(1).default('Administrador SIPEC'),
  AREA_MANAGER_USERNAME: z.string().trim().min(3).default('kimberly.cisneros'),
  AREA_MANAGER_DISPLAY_NAME: z.string().trim().min(1).default('Kimberly Cisneros'),
  AREA_MANAGER_PASSWORD: z.string().min(12).optional(),
  HR_SPECIALIST_USERNAME: z.string().trim().min(3).default('rrhh.especialista'),
  HR_SPECIALIST_DISPLAY_NAME: z.string().trim().min(1).default('Sofia'),
  HR_SPECIALIST_PASSWORD: z.string().min(12).optional(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error('Configuración inválida:', result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
