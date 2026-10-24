import { pool } from './pool.js';
import { demoWorkers } from '../data/demo-workers.js';

async function seedDemoWorkers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const worker of demoWorkers) {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [worker.department],
      );
      const profile = await client.query(
        `INSERT INTO position_profiles (department_id, title, description)
         VALUES ($1, $2, 'Perfil ficticio para demostración académica.')
         ON CONFLICT (department_id, title) DO UPDATE SET title = EXCLUDED.title
         RETURNING id`,
        [department.rows[0].id, worker.position],
      );
      const result = await client.query(
        `INSERT INTO workers
           (employee_number, document_number, full_name, email, phone, department_id,
            position_id, is_demo, appointment_resolution, appointment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
         ON CONFLICT (employee_number) DO UPDATE
         SET document_number = EXCLUDED.document_number, full_name = EXCLUDED.full_name,
             email = EXCLUDED.email, phone = EXCLUDED.phone, department_id = EXCLUDED.department_id,
             position_id = EXCLUDED.position_id, appointment_resolution = EXCLUDED.appointment_resolution,
             appointment_date = EXCLUDED.appointment_date, updated_at = now()
         WHERE workers.is_demo = true
         RETURNING employee_number`,
        [worker.employeeNumber, worker.documentNumber, worker.fullName, worker.email,
          worker.phone, department.rows[0].id, profile.rows[0].id, worker.resolution, worker.appointmentDate],
      );
      if (!result.rowCount) {
        throw new Error(`No se importó ${worker.employeeNumber}: el código ya pertenece a un registro que no es de prueba.`);
      }
    }
    await client.query('COMMIT');
    console.info(`Se cargaron ${demoWorkers.length} trabajadores de prueba.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoWorkers().catch((error) => {
  console.error('No se pudieron cargar los trabajadores de prueba:', error);
  process.exitCode = 1;
});
