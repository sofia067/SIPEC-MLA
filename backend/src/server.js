import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.PORT, () => {
  console.info(`SIPEC-MLA API disponible en el puerto ${env.PORT}.`);
});

async function shutdown(signal) {
  console.info(`Señal ${signal} recibida; cerrando la API.`);
  server.close(async (error) => {
    if (error) {
      console.error('Error al cerrar el servidor HTTP:', error);
      process.exitCode = 1;
    }
    await pool.end();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
