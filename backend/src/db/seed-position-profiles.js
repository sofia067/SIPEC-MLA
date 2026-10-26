import { pool } from './pool.js';

const profiles = [
  {
    code: 'PRF-LOG-001',
    title: 'Asistente Administrativo de Logística y Control Patrimonial',
    department: 'Subgerencia de Logística y Control Patrimonial',
    level: 'Técnico / Auxiliar',
    salary: 2200,
    formation: 'Egresado o Bachiller en Administración, Contabilidad o Ingeniería Industrial.',
    generalExperience: 'Mínimo 1 año en el sector público o privado.',
    specificExperience: 'Mínimo 8 meses en abastecimiento, logística o control patrimonial público.',
    knowledge: [
      'Curso o Taller en Contrataciones del Estado (SIAF / SEACE) mínimo 80 hrs.',
      'Manejo del Sistema de Gestión Administrativa (SIGA) o SIAF-RP (Nivel Básico/Intermedio).',
      'Ofimática e informática a nivel intermedio (Word, Excel).',
    ],
    competencies: ['Organización', 'Atención al detalle', 'Transparencia', 'Trabajo bajo presión'],
    responsibilities: [
      'Recepcionar, revisar y tramitar los requerimientos de bienes y servicios de las áreas usuarias.',
      'Elaborar órdenes de compra y de servicio verificando la disponibilidad presupuestal.',
      'Registrar y foliar los expedientes de contratación para el control patrimonial e inventario anual.',
      'Apoyar en la recepción y verificación física de bienes ingresados al almacén municipal.',
    ],
  },
  {
    code: 'PRF-LOG-002',
    title: 'Especialista en Contrataciones del Estado (OEC)',
    department: 'Subgerencia de Logística y Control Patrimonial',
    level: 'Profesional / Especialista',
    salary: 3500,
    formation: 'Título Profesional en Derecho, Administración, Contabilidad o Economía. Colegiado y habilitado.',
    generalExperience: 'Mínimo 3 años en el sector público o privado.',
    specificExperience: 'Mínimo 2 años como especialista o analista de contrataciones en entidades del Estado.',
    knowledge: [
      'Certificación OSCE / OSCE-SEACE Vigente (Incondicional o Intermedio/Avanzado).',
      'Diplomado en Contrataciones Públicas (mínimo 120 horas).',
      'Manejo del portal SEACE v3.0 y módulo analítico del SIAF.',
    ],
    competencies: ['Pensamiento analítico', 'Negociación', 'Conducta ética', 'Integridad'],
    responsibilities: [
      'Elaborar el Plan Anual de Contrataciones (PAC) de la municipalidad y sus modificaciones.',
      'Conducir los procedimientos de selección (Licitaciones, Concursos Públicos, Adjudicaciones Simplificadas).',
      'Absolver consultas y observaciones presentadas por los participantes en las plataformas del SEACE.',
      'Elaborar los contratos derivados de los procesos de selección aprobados.',
    ],
  },
  {
    code: 'PRF-RRHH-001',
    title: 'Asistente de Recursos Humanos y Planillas',
    department: 'Subgerencia de Recursos Humanos',
    level: 'Técnico',
    salary: 2400,
    formation: 'Técnico Titulado o Bachiller en Contabilidad, Administración o Relaciones Industriales.',
    generalExperience: 'Mínimo 1 año.',
    specificExperience: 'Mínimo 10 meses en gestión de personal, control de asistencia o elaboración de planillas CAS/276.',
    knowledge: [
      'Conocimiento en la Ley del Servicio Civil (Ley N° 30057) y régimen CAS (D.L. 1057).',
      'Manejo de la Planilla Electrónica (T-Registro y PLAME - SUNAT).',
      'Manejo del módulo de personal SIAF.',
    ],
    competencies: ['Empatía', 'Confidencialidad', 'Comunicación asertiva', 'Orientación al servicio'],
    responsibilities: [
      'Registrar la asistencia, tardanzas, permisos y licencias del personal municipal.',
      'Consolidar la información para la elaboración mensual de la planilla de pagos de haberes y CAS.',
      'Mantener actualizados los legajos personales físicos y digitales de los servidores públicos.',
      'Emitir constancias de trabajo y hojas de liquidación de beneficios sociales.',
    ],
  },
  {
    code: 'PRF-TES-001',
    title: 'Tesorero / Especialista en Gestión Financiera',
    department: 'Subgerencia de Tesorería',
    level: 'Profesional',
    salary: 3200,
    formation: 'Título Profesional en Contabilidad, Economía o Administración. Colegiado y habilitado.',
    generalExperience: 'Mínimo 2 años.',
    specificExperience: 'Mínimo 1 año y medio en tesorería o gestión financiera gubernamental.',
    knowledge: [
      'Capacitación acreditada en SIAF-SP Módulo Tesorería (mínimo 60 horas).',
      'Normativa del Sistema Nacional de Tesorería y manejo de cuentas encargo/caja chica.',
    ],
    competencies: ['Rigurosidad financiera', 'Probidad', 'Alto sentido de responsabilidad'],
    responsibilities: [
      'Ejecutar la fase del Girado y Pago de las obligaciones en el sistema SIAF-SP.',
      'Controlar la apertura, custodia y rendición de la Caja Chica de la Entidad.',
      'Efectuar conciliaciones bancarias mensuales de las cuentas institucionales.',
      'Registrar la recaudación diaria por conceptos tributarios y no tributarios.',
    ],
  },
  {
    code: 'PRF-TES-002',
    title: 'Cajero Municipal',
    department: 'Subgerencia de Tesorería / Orientación al Contribuyente',
    level: 'Auxiliar / Técnico',
    salary: 1800,
    formation: 'Secundaria completa o estudios técnicos inconclusos en Contabilidad/Administración bancaria.',
    generalExperience: 'Mínimo 1 año en conteo de dinero, arqueo de caja o atención al público.',
    specificExperience: 'Mínimo 6 meses en cajas del sector público o entidades financieras.',
    knowledge: [
      'Curso de Detección de Billetes y Monedas Falsas.',
      'Manejo de POS, terminales de pago e impresoras de comprobantes.',
    ],
    competencies: ['Agilidad', 'Vocación de servicio', 'Honestidad', 'Intachabilidad'],
    responsibilities: [
      'Cobrar arbitrios, impuesto predial, licencias y tasas municipales expidiendo los recibos oficiales.',
      'Realizar el arqueo diario de caja y elaborar el parte de depósito correspondiente.',
      'Resguardar el efectivo recaudado hasta su remisión o depósito en la cuenta del Banco de la Nación.',
    ],
  },
  {
    code: 'PRF-GAT-001',
    title: 'Inspector Tributario y Orientador al Contribuyente',
    department: 'Subgerencia de Recaudación y Fiscalización Tributaria',
    level: 'Técnico',
    salary: 2000,
    formation: 'Técnico egresado en Contabilidad, Administración, Derecho o Computación.',
    generalExperience: 'Mínimo 1 año en labores de campo, inspección o atención al cliente.',
    specificExperience: 'Mínimo 6 meses en fiscalización tributaria municipal o cobranza coactiva.',
    knowledge: [
      'Conocimiento del Texto Único Ordenado del Código Tributario y Ley de Tributación Municipal (D.S. 156-2004-EF).',
      'Manejo del sistema informático de gestión tributaria local.',
    ],
    competencies: ['Persuasión', 'Resolución de conflictos', 'Trabajo en campo', 'Asertividad'],
    responsibilities: [
      'Notificar cuponeras de pago, resoluciones de determinación y órdenes de pago a los contribuyentes del distrito.',
      'Realizar inspecciones de predios para verificar autoavalúos, construcciones y características físicas del inmueble.',
      'Brindar orientación presencial sobre beneficios tributarios, amnistías y fraccionamientos.',
    ],
  },
  {
    code: 'PRF-GAT-002',
    title: 'Ejecutor Coactivo',
    department: 'Oficina de Ejecución Coactiva',
    level: 'Profesional / Especialista',
    salary: 3800,
    formation: 'Título Profesional en Derecho. Colegiado y habilitado.',
    generalExperience: 'Mínimo 3 años de ejercicio profesional.',
    specificExperience: 'Mínimo 2 años en procedimientos de ejecución coactiva en municipalidades o entidades públicas.',
    knowledge: [
      'Acreditar aprobación del examen o curso de Ejecutor Coactivo según norma nacional.',
      'Dominio de la Ley N° 26979 (Ley de Procedimiento de Ejecución Coactiva).',
    ],
    competencies: ['Firmeza ética', 'Liderazgo', 'Capacidad jurídica defensiva', 'Templanza'],
    responsibilities: [
      'Disponer el inicio del procedimiento de ejecución coactiva mediante la emisión de la REC (Resolución de Ejecución Coactiva).',
      'Dictar medidas cautelares (embargos en forma de retención, inscripción o intervención) para recuperar deudas pendientes.',
      'Resolver las solicitudes de suspensión o tercería de propiedad presentadas por los obligados.',
    ],
  },
  {
    code: 'PRF-OBR-001',
    title: 'Especialista / Inspector de Obras Públicas',
    department: 'Subgerencia de Obras Públicas y Estudios',
    level: 'Profesional',
    salary: 3600,
    formation: 'Título Profesional en Ingeniería Civil o Arquitectura. Colegiado y habilitado activo.',
    generalExperience: 'Mínimo 2 años.',
    specificExperience: 'Mínimo 1 año y medio en supervisión, residencia o inspección de obras públicas municipales (pistas, veredas, parques, losas).',
    knowledge: [
      'Manejo de AutoCAD, S10 Costos y Presupuestos, MS Project.',
      'Conocimiento del Reglamento Nacional de Edificaciones y normativa de Obras Públicas del OSCE.',
    ],
    competencies: ['Liderazgo técnico', 'Capacidad de toma de decisiones', 'Rigor analítico'],
    responsibilities: [
      'Inspeccionar en campo la ejecución física y avance financiero de las obras ejecutadas por contrata o administración directa.',
      'Controlar la calidad de los materiales y el cumplimiento de las especificaciones del expediente técnico.',
      'Revisar y dar conformidad a las valorizaciones mensuales de obra presentadas por los contratistas.',
    ],
  },
  {
    code: 'PRF-CAD-001',
    title: 'Asistente de Cadastro y Habilitaciones Urbanas',
    department: 'Subgerencia de Planeamiento Urbano y Catastro',
    level: 'Técnico / Bachiller',
    salary: 2300,
    formation: 'Bachiller o Técnico Titulado en Topografía, Arquitectura, Ingeniería Civil o Geográfica.',
    generalExperience: 'Mínimo 1 año.',
    specificExperience: 'Mínimo 8 meses en levantamiento catastral, fotogrametría o procesamiento GIS.',
    knowledge: [
      'Dominio intermedio/avanzado de AutoCAD, QGIS, ArcGIS y lectura de planos perimétricos y de ubicación.',
      'Conocimiento del Sistema Nacional Integrado de Catastro (SNCP).',
    ],
    competencies: ['Precisión espacial', 'Trabajo en campo', 'Método', 'Sistematización'],
    responsibilities: [
      'Realizar levantamientos topográficos y verificación de linderos en el territorio distrital.',
      'Procesar la información de campo e ingresar polígonos al sistema del plano catastral municipal.',
      'Emitir certificados de jurisdicción, numeración finca, visación de planos y parámetros urbanísticos.',
    ],
  },
  {
    code: 'PRF-CAD-002',
    title: 'Topógrafo de Campo',
    department: 'Subgerencia de Obras Públicas / Catastro',
    level: 'Técnico Operativo',
    salary: 2000,
    formation: 'Técnico en Topografía o Edificaciones.',
    generalExperience: 'Mínimo 2 años en levantamiento topográfico.',
    specificExperience: 'Mínimo 1 año en obras viales, saneamiento o levantamiento urbano.',
    knowledge: [
      'Manejo experto de Estación Total, Nivel Óptico y GPS Diferencial (RTK).',
      'Procesamiento de curvas de nivel e importación de puntos en Civil 3D.',
    ],
    competencies: ['Resistencia física para trabajo en campo', 'Exactitud', 'Solución de problemas'],
    responsibilities: [
      'Ejecutar la toma de datos topográficos en calles, pasajes y terrenos del distrito.',
      'Realizar el replanteo topográfico de los expedientes técnicos de obras municipales.',
      'Elaborar las libretas de campo y procesar las nubes de puntos para la entrega al área proyectista.',
    ],
  },
  {
    code: 'PRF-SEC-001',
    title: 'Serenazgo Chofer',
    department: 'Subgerencia de Seguridad Ciudadana',
    level: 'Operativo',
    salary: 1600,
    formation: 'Secundaria completa.',
    generalExperience: 'Mínimo 1 año como chofer o conductor.',
    specificExperience: 'Mínimo 6 meses en patrullaje, transporte de serenazgo, policía, fuerzas armadas o seguridad privada.',
    knowledge: [
      'Licencia de Conducir Clase A, Categ. A-IIb vigente (sin faltas graves en el récord MTC).',
      'Cursos o charlas básicas en primeros auxilios y educación vial.',
    ],
    competencies: ['Control emocional', 'Prudencia al conducir', 'Trabajo en equipo', 'Reacción oportuna'],
    responsibilities: [
      'Operar y conducir la camioneta de Serenazgo en las rutas de patrullaje asignadas por sectores.',
      'Apoyar en intervenciones disuasivas ante alteración del orden público, faltas o emergencias.',
      'Mantener en óptimas condiciones de limpieza y revisar el nivel de fluidos/combustible de la unidad asignada.',
    ],
  },
  {
    code: 'PRF-SEC-002',
    title: 'Serenazgo a Pie / Intervención',
    department: 'Subgerencia de Seguridad Ciudadana',
    level: 'Operativo',
    salary: 1400,
    formation: 'Secundaria completa.',
    generalExperience: 'No requerida o 3 meses en resguardo/vigilancia.',
    specificExperience: 'Licenciados de las FFAA (Ejército, Marina, FAP) o experiencia previa en Serenazgo (deseable).',
    knowledge: [
      'Conocimiento básico del Reglamento de Serenazgo Municipal y DDHH.',
      'Certificado de Antecedentes Policiales y Penales sin registros.',
    ],
    competencies: ['Disciplina', 'Capacidad física', 'Vocación de servicio ciudadano'],
    responsibilities: [
      'Realizar patrullaje a pie y vigilancia preventiva en parques, plazas, colegios y zonas comerciales.',
      'Prestar auxilio rápido a los vecinos en situaciones de emergencia, riesgo o violencia familiar.',
      'Reportar incidencias a la Central de Video Monitoreo mediante radio de comunicación.',
    ],
  },
  {
    code: 'PRF-SEC-003',
    title: 'Operador de Central de Video Monitoreo',
    department: 'Subgerencia de Seguridad Ciudadana',
    level: 'Técnico / Operativo',
    salary: 1700,
    formation: 'Secundaria completa o estudios técnicos en Computación/Sistemas.',
    generalExperience: 'Mínimo 1 año.',
    specificExperience: 'Mínimo 6 meses como operador de CCTV, monitoreo de cámaras de seguridad o radio operador.',
    knowledge: [
      'Software de gestión de video VMS (Hikvision, Dahua o similares).',
      'Manejo de consolas PTZ y protocolos de alerta rápida (PNP/Bomberos/SAMU).',
    ],
    competencies: ['Atención sostenida', 'Concentración', 'Agilidad mental', 'Comunicación clara'],
    responsibilities: [
      'Monitorear en tiempo real los domos y cámaras de videovigilancia instaladas en el distrito.',
      'Alertar de forma inmediata a las unidades de patrullaje sobre actos sospechosos o accidentes.',
      'Custodiar y descargar los archivos de video solicitados por la Policía Nacional o el Ministerio Público.',
    ],
  },
  {
    code: 'PRF-FIS-001',
    title: 'Inspector de Fiscalización y Control Municipal',
    department: 'Subgerencia de Fiscalización y Sanciones',
    level: 'Técnico',
    salary: 1900,
    formation: 'Secundaria completa o estudiante universitario/técnico de Derecho, Administración o egresado de las FFAA.',
    generalExperience: 'Mínimo 1 año.',
    specificExperience: 'Mínimo 6 meses como fiscalizador o inspector municipal de comercio, transporte u obras.',
    knowledge: [
      'Conocimiento del Cuadro Único de Infracciones y Sanciones (CUIS) y TUO de la Ley N° 27444 (LPAG).',
    ],
    competencies: ['Imparcialidad', 'Asertividad', 'Temple ante situaciones conflictivas'],
    responsibilities: [
      'Inspeccionar establecimientos comerciales para verificar el cumplimiento de la Licencia de Funcionamiento y Defensa Civil.',
      'Imponer Notificaciones de Infracción y Actas de Control a los infractores de las ordenanzas distritales.',
      'Ejecutar clausuras temporales o retención de productos en operativos conjuntos con la PNP y Fiscalía.',
    ],
  },
  {
    code: 'PRF-AMB-001',
    title: 'Chofer de Compresor / Camión Recolector de Residuos Solidos',
    department: 'Subgerencia de Limpieza Pública y Gestión Ambiental',
    level: 'Operativo',
    salary: 2100,
    formation: 'Secundaria completa.',
    generalExperience: 'Mínimo 2 años como chofer de vehículos pesados.',
    specificExperience: 'Mínimo 1 año conduciendo camiones compactadores, volquetes o maquinaria pesada en municipalidades o empresas de servicios.',
    knowledge: [
      'Licencia de Conducir Clase A, Categ. A-IIIa o A-IIIc profesional vigente.',
      'Récord del conductor sin sanciones graves o muy graves.',
    ],
    competencies: ['Puntualidad', 'Alto compromiso con el cuidado del vehículo', 'Responsabilidad operacional'],
    responsibilities: [
      'Manejar el camión compactador cubriendo las rutas nocturnas/diurnas de recojo de basura en Los Aquijes.',
      'Operar el sistema hidráulico de compactación de residuos con las medidas de seguridad correspondientes.',
      'Trasladar la carga hasta el relleno sanitario o botadero autorizado en las horas programadas.',
    ],
  },
  {
    code: 'PRF-AMB-002',
    title: 'Operario de Áreas Verdes y Jardinería',
    department: 'Subgerencia de Limpieza Pública, Parques y Jardines',
    level: 'Operativo',
    salary: 1300,
    formation: 'Primaria o Secundaria completa.',
    generalExperience: 'Mínimo 6 meses en labores agrícolas, jardinería o mantenimiento de espacios verdes.',
    specificExperience: '',
    knowledge: [
      'Manejo de herramientas agrícolas (desbrozadora, podadora de césped, tijeras de podar).',
      'Conocimiento de abono, fumigación de plagas y técnicas de riego.',
    ],
    competencies: ['Trabajo físico al aire libre', 'Dinamismo', 'Amor por el medio ambiente'],
    responsibilities: [
      'Realizar el corte de césped, poda de árboles y perfilado de plantas en plazas y bermas del distrito.',
      'Operar las redes de riego o apoyar en el regado mediante camión cisterna.',
      'Sembrar plantas ornamentales y desmalezar malezas en parques distritales.',
    ],
  },
  {
    code: 'PRF-SOC-001',
    title: 'Especialista / Asistente Social para Programas Sociales',
    department: 'Subgerencia de Desarrollo Social, DEMUNA y OMAPED',
    level: 'Profesional',
    salary: 2800,
    formation: 'Título Profesional en Trabajo Social o Trabajo Social y Gerencia del Desarrollo. Colegiada y habilitada.',
    generalExperience: 'Mínimo 1 año y medio.',
    specificExperience: 'Mínimo 1 año en programas de vaso de leche, comedores populares, DEMUNA, CIAM o empadronamiento SISFOH.',
    knowledge: [
      'Capacitación en metodologías de clasificación socioeconómica (SISFOH/MIDIS).',
      'Normativa de protección a la infancia, adulto mayor y personas con discapacidad.',
    ],
    competencies: ['Altísima empatía', 'Sensibilidad social', 'Vocación de servicio comunal'],
    responsibilities: [
      'Realizar visitas domiciliarias y evaluaciones socioeconómicas a familias vulnerables del distrito.',
      'Gestionar la atención e inscripción de beneficiarios en los programas Vaso de Leche y PANTBC.',
      'Brindar contención e intermediación social en casos de violencia contra la mujer e integrantes del grupo familiar.',
    ],
  },
  {
    code: 'PRF-SOC-002',
    title: 'Empadronador UFO / SISFOH',
    department: 'Unidad Local de Empadronamiento (ULE - SISFOH)',
    level: 'Técnico / Campo',
    salary: 1800,
    formation: 'Secundaria completa o estudiante de carreras técnicas/universitarias.',
    generalExperience: 'Mínimo 6 meses.',
    specificExperience: 'Mínimo 3 meses en levantamiento de encuestas de campo, censos o empadronamiento social.',
    knowledge: [
      'Capacitación en llenado de la Ficha Socioeconómica Única (FSU) del MIDIS.',
      'Manejo de dispositivos móviles de captura de datos (aplicativo SIGOF).',
    ],
    competencies: ['Facilidad de palabra', 'Resistencia para largas caminatas de campo', 'Honestidad'],
    responsibilities: [
      'Recorrer los sectores rurales y urbanos de Los Aquijes para aplicar las encuestas FSU a los hogares.',
      'Georreferenciar la vivienda del solicitante e ingresar la Ficha Digital al sistema oficial.',
      'Apoyar en la atención de solicitudes de Clasificación Socioeconómica (CSE) en la oficina ULE.',
    ],
  },
  {
    code: 'PRF-SYS-001',
    title: 'Administrador de Redes, Soporte e Infraestructura TI',
    department: 'Subgerencia de Tecnologías de la Información y Gobierno Digital',
    level: 'Profesional / Técnico Especializado',
    salary: 3000,
    formation: 'Título Profesional o Técnico Titulado en Ingeniería de Sistemas, Computación e Informática o Redes.',
    generalExperience: 'Mínimo 2 años.',
    specificExperience: 'Mínimo 1 año y medio en administración de servidores, cableado estructurado, ensamblaje y soporte a usuarios.',
    knowledge: [
      'Mantenimiento preventivo/correctivo de hardware, impresoras y redes LAN/WLAN.',
      'Administración de Windows Server, Active Directory, Mikrotik o firewalls.',
      'Gestión de bases de datos PostgreSQL / MySQL (Nivel básico a intermedio).',
    ],
    competencies: ['Orientación al cliente interno', 'Capacidad analítica de diagnóstico técnico', 'Proactividad'],
    responsibilities: [
      'Garantizar la conectividad de red e internet en todas las sedes administrativas de la municipalidad.',
      'Brindar soporte técnico a los equipos de cómputo, impresoras y correo institucional de los trabajadores.',
      'Administrar los respaldos (backups) periódicos de las bases de datos de los sistemas municipales.',
    ],
  },
  {
    code: 'PRF-SYS-002',
    title: 'Webmaster y Especialista en Gobierno Digital',
    department: 'Subgerencia de Tecnologías de la Información / Imagen Institucional',
    level: 'Profesional / Técnico',
    salary: 2700,
    formation: 'Técnico o Bachiller en Ingeniería de Sistemas, Software, Diseño Web o Ciencias de la Comunicación.',
    generalExperience: 'Mínimo 1 año.',
    specificExperience: 'Mínimo 8 meses en gestión de portales web gubernamentales (gob.pe), mesa de partes virtual o gestión de contenidos.',
    knowledge: [
      'Conocimiento del Modelo de Integración Digital del Estado (gob.pe).',
      'Estándares de la Ley de Transparencia y Acceso a la Información Pública (PTE).',
      'Maquetación web básica (HTML, CSS), edición gráfica (Photoshop/Canva) y CMS.',
    ],
    competencies: ['Creatividad', 'Orden', 'Responsabilidad en el manejo de información pública'],
    responsibilities: [
      'Publicar resoluciones, convenios, notas de prensa y convocatorias CAS en el portal oficial de gob.pe/munilosaquijes.',
      'Mantener actualizado el Portal de Transparencia Estándar (PTE) en los rubros de personal, contrataciones y presupuesto.',
      'Administrar el funcionamiento de la Mesa de Partes Virtual y Libro de Reclamaciones Digital de la entidad.',
    ],
  },
];

function toPrincipalRequirements(profile) {
  return [
    `Formación académica: ${profile.formation}`,
    `Experiencia general: ${profile.generalExperience}`,
    profile.specificExperience && `Experiencia específica: ${profile.specificExperience}`,
    profile.knowledge.length && `Conocimientos técnicos:\n${profile.knowledge.map((item) => `- ${item}`).join('\n')}`,
  ].filter(Boolean).join('\n\n');
}

async function seedPositionProfiles() {
  const client = await pool.connect();
  let reassignedCodes = 0;
  try {
    await client.query('BEGIN');
    for (const profile of profiles) {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [profile.department],
      );
      const profileValues = [
        department.rows[0].id,
        profile.title,
        profile.level,
        toPrincipalRequirements(profile),
        profile.code,
        profile.salary,
        profile.formation,
        profile.generalExperience,
        profile.specificExperience,
        profile.knowledge,
        profile.responsibilities,
      ];
      const [matchingTitle, matchingCode] = await Promise.all([
        client.query(
          `SELECT id FROM position_profiles
           WHERE department_id = $1 AND title = $2
           FOR UPDATE`,
          [profileValues[0], profile.title],
        ),
        client.query(
          `SELECT id FROM position_profiles
           WHERE profile_code = $1
           FOR UPDATE`,
          [profile.code],
        ),
      ]);
      let profileId;
      if (matchingTitle.rowCount > 0) {
        profileId = matchingTitle.rows[0].id;
        if (matchingCode.rowCount > 0 && matchingCode.rows[0].id !== profileId) {
          await client.query(
            'UPDATE position_profiles SET profile_code = NULL WHERE id = $1',
            [matchingCode.rows[0].id],
          );
          reassignedCodes += 1;
        }
        const result = await client.query(
          `UPDATE position_profiles SET
             department_id = $2, title = $3, level = $4, principal_requirements = $5,
             profile_code = $6, reference_salary = $7, academic_formation = $8,
             general_experience = $9, specific_experience = $10, technical_knowledge = $11,
             responsibilities = $12, status = 'active', updated_at = now()
           WHERE id = $1 RETURNING id`,
          [profileId, ...profileValues],
        );
        profileId = result.rows[0].id;
      } else if (matchingCode.rowCount > 0) {
        const result = await client.query(
          `UPDATE position_profiles SET
             department_id = $2, title = $3, level = $4, principal_requirements = $5,
             profile_code = $6, reference_salary = $7, academic_formation = $8,
             general_experience = $9, specific_experience = $10, technical_knowledge = $11,
             responsibilities = $12, status = 'active', updated_at = now()
           WHERE id = $1 RETURNING id`,
          [matchingCode.rows[0].id, ...profileValues],
        );
        profileId = result.rows[0].id;
      } else {
        const result = await client.query(
          `INSERT INTO position_profiles
             (department_id, title, level, principal_requirements, profile_code,
              reference_salary, academic_formation, general_experience, specific_experience,
              technical_knowledge, responsibilities, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
           RETURNING id`,
          profileValues,
        );
        profileId = result.rows[0].id;
      }
      await client.query('DELETE FROM position_competencies WHERE position_id = $1', [profileId]);
      for (const competency of profile.competencies) {
        await client.query(
          `INSERT INTO position_competencies (position_id, name)
           VALUES ($1, $2)`,
          [profileId, competency],
        );
      }
    }
    await client.query('COMMIT');
    console.info(`Perfiles de puesto cargados o actualizados: ${profiles.length}.`);
    if (reassignedCodes > 0) {
      console.info(`Códigos reasignados a su perfil correspondiente: ${reassignedCodes}. Los perfiles previos se conservaron.`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedPositionProfiles().catch((error) => {
  console.error('No se pudieron cargar los perfiles de puesto:', error);
  process.exitCode = 1;
});
