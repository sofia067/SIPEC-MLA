# SIPEC-MLA
Sistema Inteligente de Perfiles y Evaluación de Competencias - Municipalidad Distrital de Los Aquijes.

## Ejecución local

El sistema requiere PostgreSQL. Configura la conexión y las contraseñas iniciales en `backend/.env` tomando como referencia `backend/.env.example`; no compartas ni publiques ese archivo.

En una terminal, desde `backend`, instala dependencias si aún no están instaladas, aplica el esquema y crea las cuentas iniciales:

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run db:seed:roles
npm run dev
```

En otra terminal, desde `frontend`:

```powershell
npm install
npm run dev
```

Abre la dirección que muestre Vite (por defecto `http://localhost:5173`). Durante el desarrollo, Vite reenvía `/api` al backend en `http://localhost:3000`; si cambias el puerto del backend, actualiza el proxy en `frontend/vite.config.js`.

El inicio de sesión, el resumen, las solicitudes de cobertura, el padrón de trabajadores, los perfiles de puesto y la validación documental consultan la API. La validación extrae texto de imágenes y PDFs; los PDFs escaneados procesan como máximo 20 páginas. Cada archivo conserva una huella SHA-256. Las pantallas también requieren una sesión válida. Para comprobar el backend, abre `http://localhost:3000/api/health/live`; para comprobar la conexión a PostgreSQL, usa `http://localhost:3000/api/health/ready`.

Las fichas de puesto guardan código, unidad orgánica, nivel, remuneración, formación, experiencia, conocimientos, competencias y funciones. Ejecuta `npm run db:migrate` para aplicar la migración de estos campos. Desde el listado se pueden desactivar perfiles; se conservan en la base de datos y no se eliminan físicamente.

Las solicitudes de cobertura guardan prioridad alta, media o baja; las solicitudes anteriores a esta migración reciben prioridad media por defecto. Ejecuta `npm run db:migrate` para aplicar los cambios de esquema. Las solicitudes pendientes pueden ser editadas o eliminadas por administradores y especialistas de RR.HH.; la eliminación requiere que no tengan documentos, evaluaciones ni asignaciones asociadas.

Las migraciones crean la estructura y los comandos `db:seed` / `db:seed:roles` crean cuentas de acceso; no cargan trabajadores ni solicitudes de ejemplo. Si las tablas están vacías, esas listas aparecerán vacías hasta que se registren datos desde el sistema.

La página de evaluaciones incluye bancos de 20 preguntas para Inspector Tributario y Orientador al Contribuyente, Especialista en Contrataciones del Estado (OEC) y Serenazgo Chofer. Las preguntas y sus claves deben verificarse con fuentes oficiales antes de usarse en procesos reales. Las respuestas abiertas requieren revisión manual y los resultados aún no se guardan en la base de datos.

Informes consulta indicadores de solicitudes, documentos con OCR completado y trabajadores activos desde PostgreSQL. Auditoría muestra los últimos eventos registrados; su consulta está restringida a administradores.

La configuración institucional (anonimización automática y umbral mínimo de confianza OCR) se guarda en PostgreSQL y solo puede consultarla o modificarla un administrador. Ejecuta `npm run db:migrate` para crear la tabla de parámetros.

La selección ciega registra postulantes con un código anónimo y mantiene sus datos personales ocultos en las consultas hasta que obtienen 100% en las preguntas objetivas y RR. HH. aprueba todas sus respuestas de desarrollo. El puntaje objetivo se calcula en el backend; aplica la migración 009 con `npm run db:migrate`. La evaluación se administra desde una sesión interna. El portal público disponible es únicamente un prototipo académico, no un canal oficial de postulaciones. Este flujo está preparado para pruebas y requiere validar oficialmente los bancos y criterios antes de usarlo en una convocatoria real.

El portal académico de postulación está disponible en `/postular` y desde el enlace de demostración en la pantalla de inicio de sesión. Aplica también la migración 010 con `npm run db:migrate`. El portal solo publica solicitudes aprobadas: administradores y especialistas de RR. HH. pueden seleccionar "Aprobar y publicar" en el detalle de una solicitud y "Retirar del portal" para ocultarla. El formulario exige datos ficticios y un CV PDF de prueba de hasta 5 MB; sus registros quedan marcados como demostración y aparecen en selección ciega. El CV solo puede descargarse por administradores o especialistas de RR. HH. después de revelar la identidad. El portal no está conectado a la Municipalidad y no debe recibir datos personales o documentos reales.

La migración 012 agrega el match estimado entre el texto extraído del CV y los términos de la ficha del puesto. El cálculo pondera formación (20%), experiencia general (20%), experiencia específica (25%), conocimientos técnicos (20%), requisitos principales (10%) y competencias (5%); las categorías sin criterios configurados se excluyen y el peso restante se redistribuye. Un resultado de 80% o más alcanza el umbral orientativo. Es una coincidencia literal de términos, no una evaluación semántica ni una decisión automática de contratación: RR. HH. debe verificar el CV y cada requisito. Las postulaciones nuevas se calculan al enviarse; para CV registrados anteriormente, RR. HH. puede usar "Calcular match" en Candidatos compatibles. Si la extracción falla o faltan datos, el candidato queda sin porcentaje calculado.
