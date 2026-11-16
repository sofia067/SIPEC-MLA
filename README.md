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

El inicio de sesión, el resumen, las convocatorias de personal, el padrón de trabajadores, los perfiles de puesto y la validación documental consultan la API. La validación extrae texto de imágenes y PDFs; los PDFs escaneados procesan como máximo 20 páginas. Cada archivo conserva una huella SHA-256. Las pantallas también requieren una sesión válida. Para comprobar el backend, abre `http://localhost:3000/api/health/live`; para comprobar la conexión a PostgreSQL, usa `http://localhost:3000/api/health/ready`.

Las fichas de puesto guardan código, unidad orgánica, régimen laboral, nivel, remuneración, formación, experiencia, conocimientos, competencias y funciones. Ejecuta `npm run db:migrate` para aplicar la migración de estos campos. Desde el listado se pueden desactivar perfiles; se conservan en la base de datos y no se eliminan físicamente.

Las convocatorias de personal guardan prioridad alta, media o baja; las solicitudes anteriores a esta migración reciben prioridad media por defecto. Ejecuta `npm run db:migrate` para aplicar los cambios de esquema. Las convocatorias pendientes pueden ser editadas o eliminadas por administradores y especialistas de RR.HH.; la eliminación requiere que no tengan documentos, evaluaciones ni asignaciones asociadas.

Las migraciones crean la estructura y los comandos `db:seed` / `db:seed:roles` crean cuentas de acceso; no cargan trabajadores ni solicitudes de ejemplo. Si las tablas están vacías, esas listas aparecerán vacías hasta que se registren datos desde el sistema.

En producción, configura `ADMIN_PASSWORD`, `AREA_MANAGER_PASSWORD` y `HR_SPECIALIST_PASSWORD` como secretos del servicio. Para sincronizar una sola vez esos valores con cuentas iniciales que ya existen, activa `RESET_BOOTSTRAP_USER_PASSWORDS=true` en el entorno de despliegue y vuelve a desplegar; verifica en los logs que las contraseñas se sincronizaron y luego desactiva la variable. Por defecto, los seeds no reemplazan contraseñas existentes.

La página de evaluaciones incluye bancos de 20 preguntas para Inspector Tributario y Orientador al Contribuyente, Especialista en Contrataciones del Estado (OEC) y Serenazgo Chofer. Las preguntas y sus claves deben verificarse con fuentes oficiales antes de usarse en procesos reales. El puntaje objetivo se calcula en el backend y se persiste; las respuestas abiertas requieren revisión manual.

Informes consulta indicadores de solicitudes, documentos con OCR completado y trabajadores activos desde PostgreSQL. Auditoría muestra los últimos eventos registrados; su consulta está restringida a administradores.

La configuración institucional (anonimización automática y umbral mínimo de confianza OCR) se guarda en PostgreSQL y solo puede consultarla o modificarla un administrador. Ejecuta `npm run db:migrate` para crear la tabla de parámetros.

La selección ciega registra postulantes con un código anónimo y mantiene sus datos personales ocultos en las consultas hasta que obtienen 100% en las preguntas objetivas y RR. HH. aprueba todas sus respuestas de desarrollo. El puntaje objetivo se calcula en el backend; aplica la migración 009 con `npm run db:migrate`. La revisión ciega de CV aplica ocultamiento automático parcial y no garantiza anonimización completa; requiere revisión humana y una evaluación institucional antes de procesar CV reales.

Al avanzar a la etapa de examen, RR. HH. puede emitir una contraseña temporal para el código de postulación. El mensaje de WhatsApp incluye ambas credenciales y el enlace; WhatsApp se abre con el texto preparado y una persona debe confirmar el envío (no hay integración automática con WhatsApp Business). El acceso del postulante usa una cookie HttpOnly; el banco de preguntas se entrega sin claves, el examen dura 30 minutos desde el inicio registrado en el servidor y las respuestas se guardan como borrador para reanudar la sesión. Al finalizar o vencer el tiempo, el backend calcula y persiste el puntaje objetivo; el ranking se ordena de mayor a menor y se actualiza periódicamente. Aplica la migración 025 con `npm run db:migrate`.

El portal oficial de postulación está disponible en `/postular`. Aplica las migraciones 010 y 024 con `npm run db:migrate`. El portal solo publica solicitudes aprobadas: administradores y especialistas de RR. HH. pueden seleccionar "Aprobar y publicar" en el detalle de una solicitud y "Retirar del portal" para ocultarla. Las convocatorias muestran el periodo desde la fecha de aprobación/publicación hasta el cierre vigente, el tiempo restante y, si se amplió, el cierre inicial. Para habilitar la recepción de postulaciones, configura `PUBLIC_APPLICATION_PRIVACY_NOTICE_URL` con el aviso institucional aprobado por HTTPS y `PUBLIC_APPLICATION_PRIVACY_NOTICE_VERSION` con su versión. Sin ambos valores, la API rechaza los envíos y el portal no presenta el formulario. El enlace de transparencia institucional no sustituye al aviso de privacidad. La aceptación y versión del aviso se registran con la postulación. Las solicitudes enviadas desde el portal se incorporan a selección ciega y aparecen por defecto en Candidatos Compatibles; los registros históricos de demostración se mantienen separados y se ocultan por defecto. El CV solo puede descargarse por administradores o especialistas de RR. HH. después de revelar la identidad.

La migración 018 permite configurar títulos y certificados obligatorios u opcionales por convocatoria. Quienes postulan cargan cada documento PDF por separado junto con el CV; se aceptan hasta cinco certificados/títulos en total, de hasta 5 MB cada uno, y el backend los asocia al código anónimo y procesa su OCR.

La migración 015 agrega el seguimiento de postulantes. RR. HH. y administración pueden actualizar las etapas de postulación recibida, revisión de documentos, examen, entrevista personal, práctica básica y resultado final, además de publicar un mensaje para el postulante. El examen actualiza la etapa automáticamente al presentarse y al aprobarse o rechazarse su revisión. En la etapa de entrevista, RR. HH. puede publicar fecha, hora, modalidad y lugar o enlace de la cita; el postulante los consulta en el historial usando su código de postulación y documento registrado. La migración 016 agrega los datos de citación al historial. El endpoint público limita intentos y no devuelve datos personales.

La migración 012 agrega el match estimado entre el texto extraído del CV y los términos de la ficha del puesto. El cálculo pondera formación (20%), experiencia general (20%), experiencia específica (25%), conocimientos técnicos (20%), requisitos principales (10%) y competencias (5%); las categorías sin criterios configurados se excluyen y el peso restante se redistribuye. Un resultado de 80% o más alcanza el umbral orientativo. Es una coincidencia literal de términos, no una evaluación semántica ni una decisión automática de contratación: RR. HH. debe verificar el CV y cada requisito. Las postulaciones nuevas se calculan al enviarse; para CV registrados anteriormente, RR. HH. puede usar "Calcular match" en Candidatos compatibles. Si la extracción falla o faltan datos, el candidato queda sin porcentaje calculado. La acción "Revisar CV ciego" presenta el texto extraído con ocultamiento automático de algunos identificadores conocidos y una alerta de calidad orientativa; no muestra el PDF original ni garantiza la anonimización completa, por lo que requiere revisión humana y no debe usarse con CV reales en este prototipo.

La migración 017 permite vincular certificados y títulos con un postulante usando su código anónimo; pueden cargarse desde el portal o añadirse manualmente desde Validación OCR. RR. HH. y administración pueden revisar el original y el texto OCR. El OCR extrae texto y SHA-256 identifica archivos idénticos, pero ninguna de esas funciones determina por sí sola autenticidad, plagio ni generación por IA. El sistema contempla tres roles: administrador, especialista de RR. HH. y jefe de área. La migración 020 desactiva las cuentas del rol antiguo de evaluador/comité y las deja sin sesiones activas; un administrador puede asignarles uno de los tres roles actuales y reactivarlas desde Configuración.

La migración 019 muestra alertas preliminares cuando el número o el nombre del postulante no se reconocen en el OCR, cuando un PDF es idéntico por SHA-256 al CV o a un documento de otro postulante, o cuando sus metadatos contienen fechas futuras. Si en un documento de postulante hay una alerta de identidad, se oculta todo el texto OCR durante la revisión ciega para evitar exponer datos de otra persona. Se muestran las fechas de creación/modificación del PDF si están disponibles; no todos los archivos incluyen fechas y sus metadatos pueden cambiarse, por lo que su ausencia o valor no prueba fraude ni la fecha de emisión. Los documentos que ya estaban cargados se pueden reprocesar desde Validación OCR para generar las nuevas comprobaciones. Todas las alertas requieren revisión humana.

La migración 021 agrega al CV del postulante una revisión registrada por RR. HH. Desde Candidatos compatibles, «Revisar CV en OCR» abre el CV ya recibido, calcula las alertas y fechas en el momento y permite guardar quién lo revisó y cuándo, sin volver a cargar el archivo. El PDF original solo se puede descargar una vez revelada la identidad; durante la revisión ciega se muestra el texto con identificadores conocidos ocultos o se oculta todo si la identidad no coincide.

La migración 022 agrega la simulación de avisos por WhatsApp desde Evaluación. RR. HH. redacta el mensaje y confirma su registro; el historial guarda el código anónimo, el contenido, la fecha y quién lo registró. No se conecta a WhatsApp, no usa un proveedor y no entrega mensajes reales.
