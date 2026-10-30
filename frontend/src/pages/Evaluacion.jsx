import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const crearPreguntas = (opcionMultiple, desarrollo) => [
  ...opcionMultiple.map((fila) => ({
    tipo: 'opcion_multiple',
    texto: fila[0],
    opciones: fila.slice(1, -1),
    respuesta: fila[fila.length - 1],
  })),
  ...desarrollo.map((texto) => ({ tipo: 'desarrollo', texto })),
];

const evaluacionesPorPuesto = {
  'Inspector Tributario y Orientador al Contribuyente': crearPreguntas([
    ['¿Cuál es la norma que regula las competencias y tributos municipales en el Perú?', 'Ley N° 27444', 'Texto Único Ordenado del Código Tributario (D.S. 133-2013-EF)', 'Ley N° 30057', 1],
    ['¿Qué tributo municipal grava la propiedad de los predios urbanos y rurales?', 'Impuesto de Alcabala', 'Impuesto Predial', 'Arbitrios Municipales', 1],
    ['La tasa que se paga por la prestación o mantenimiento de un servicio público municipal se denomina:', 'Impuesto', 'Licencia', 'Arbitrio', 2],
    ['¿Qué documento formaliza la determinación de una deuda tributaria por fiscalización?', 'Orden de Pago', 'Resolución de Determinación', 'Esquela de Citación', 1],
    ['El Impuesto de Alcabala grava:', 'Las transferencias de propiedad de inmuebles a título oneroso o gratuito.', 'La posesión anual de vehículos.', 'El ejercicio de actividades comerciales.', 0],
    ['¿Cuál es el plazo general para la prescripción de la facultad de la administración para determinar la obligación tributaria?', '2 años', '4 años', '10 años', 1],
    ['La Hoja del Resumen (HR) y el Predio Urbano (PU) forman parte de:', 'La declaración jurada del Impuesto Predial (Cuponera).', 'El expediente coactivo.', 'La licencia de funcionamiento.', 0],
    ['Un contribuyente realiza una ampliación de construcción en su predio, ¿en qué plazo debe declararlo?', 'Hasta el último día hábil del mes siguiente de concluidos los trabajos.', 'A los 6 meses.', 'Al final del ejercicio fiscal.', 0],
    ['¿Qué efecto tiene la notificación de una esquela de fiscalización sobre el plazo prescriptorio?', 'Lo extingue.', 'Lo interrumpe.', 'No produce ningún efecto.', 1],
    ['¿A quién le corresponde el pago de arbitrios municipales?', 'Al poseedor o propietario del predio al 1 de enero o inicio de la obligación.', 'Únicamente al inquilino.', 'Al Gobierno Regional.', 0],
    ['En una inspección de campo, si el contribuyente impide el ingreso al predio, el inspector debe:', 'Cancelar el trámite.', 'Levantar un Acta de Inspección consignando la negativa y firma de testigos.', 'Imponer una multa física inmediata.', 1],
    ['¿Qué beneficio tributario otorga la Ley a los adultos mayores no pensionistas sobre el Impuesto Predial?', 'Condonación del 100% de arbitrios.', 'Deducción de 50 UIT de la base imponible del Impuesto Predial.', 'Exoneración total del Impuesto a la Renta.', 1],
    ['¿Cuál es el órgano que resuelve en última instancia administrativa las reclamaciones tributarias municipales?', 'El Alcalde', 'El Tribunal Fiscal', 'Indecopi', 1],
    ['Las sanciones por infracciones tributarias municipales se regulan conforme a:', 'Las Tablas de Infracciones y Sanciones del Código Tributario.', 'El Código Penal.', 'El Manual de Organización y Funciones (MOF).', 0],
    ['¿Qué documento autoriza el ejercicio de actividades económicas en un establecimiento en el distrito?', 'Certificado de Catastro', 'Licencia de Funcionamiento', 'Constancia de Posesión', 1],
  ], [
    'Caso práctico: Durante una inspección en el distrito de Los Aquijes, detecta un local comercial que funciona con un giro distinto al autorizado en su Licencia de Funcionamiento. Redacte el procedimiento paso a paso que debe ejecutar como inspector.',
    'Explique la diferencia legal e impositiva entre una Orden de Pago y una Resolución de Determinación.',
    'Describa cuáles son los requisitos que debe verificar un fiscalizador en campo para la constatación de un predio subvaluado.',
    '¿Cómo orientaría a un vecino adulto mayor que acude a la municipalidad solicitando el beneficio de deducción del Impuesto Predial pero no cuenta con título de propiedad inscrito en SUNARP?',
    'Redacte el modelo de un Acta de Inspección Predial incluyendo los datos obligatorios que exige la norma.',
  ]),
  'Especialista en Contrataciones del Estado (OEC)': crearPreguntas([
    ['¿Cuál es la norma vigente que regula las contrataciones de bienes, servicios y obras con el Estado?', 'Ley N° 30225 y su Reglamento.', 'Ley N° 27444', 'D.L. 1057', 0],
    ['El instrumento de gestión que consolida todos los requerimientos de bienes y servicios del año se llama:', 'ROF', 'PAC (Plan Anual de Contrataciones)', 'POI', 1],
    ['Las contrataciones cuyos montos sean iguales o inferiores a 8 UIT se encuentran:', 'Inaplicables de supervisión por el OSCE.', 'Excluidas del ámbito de aplicación de la Ley, pero sujetas a supervisión y principios.', 'Prohibidas para municipios distritales.', 1],
    ['¿Qué plataforma informática se utiliza obligatoriamente para registrar los actos del proceso de selección?', 'SIAF-SP', 'SEACE', 'SIGA-MEF', 1],
    ['¿Qué órgano se encarga de preparar las bases y conducir el procedimiento de licitación pública?', 'La Alcaldía', 'El Comité de Selección o la OEC.', 'La Subgerencia de Tesorería', 1],
    ['La indagación de mercado realizada por la OEC sirve principalmente para:', 'Elegir al ganador del contrato.', 'Determinar el valor estimado o referencial de la contratación.', 'Aprobar el expediente técnico.', 1],
    ['Es una penalidad aplicable al contratista por retraso injustificado en la ejecución de la prestación:', 'Penalidad por mora.', 'Multa fiscal.', 'Inhabilitación permanente.', 0],
    ['La garantía de fiel cumplimiento equivale a:', '5% del monto del contrato.', '10% del monto del contrato original.', '15% del valor estimado.', 1],
    ['¿Cuál es el recurso de impugnación mediante el cual los postores cuestionan las decisiones del comité en una adjudicación simplificada?', 'Recurso de Reconsideración.', 'Recurso de Apelación.', 'Queja administrativa.', 1],
    ['¿Qué documento formaliza la vinculación entre la entidad y el postor ganador de la buena pro?', 'Orden de Compra/Servicio o Contrato.', 'Bases Integradas.', 'Requerimiento del área usuaria.', 0],
    ['¿A quién le corresponde formular las especificaciones técnicas o términos de referencia (TDR)?', 'A la Subgerencia de Logística.', 'Al Área Usuaria solicitante.', 'Al Órgano de Control Institucional (OCI).', 1],
    ['La modificación contractual que implica el incremento de prestaciones hasta por el límite del 25% se denomina:', 'Adicional de contrato.', 'Adenda de tiempo.', 'Contratación directa.', 0],
    ['¿En qué estado del proceso en el SEACE los postores pueden formular consultas y observaciones a las bases?', 'Convocatoria.', 'Formulación de consultas u observaciones.', 'Evaluación de ofertas.', 1],
    ['El fraccionamiento de contrataciones está:', 'Permitido si se cuenta con presupuesto.', 'Expresamente prohibido bajo responsabilidad administrativa.', 'Permitido solo en el mes de diciembre.', 1],
    ['¿Qué documento otorga conformidad a la recepción de bienes o servicios contratados?', 'El comprobante de pago de la factura.', 'El informe de conformidad emitido por el Área Usuaria.', 'La firma del alcalde.', 1],
  ], [
    'Caso práctico: Un área usuaria envía un requerimiento de servicio de mantenimiento de camionetas que coincide exactamente con las características de una marca y taller específico de Ica. ¿Cómo actúa el especialista de la OEC ante este posible direccionamiento?',
    'Detalle los pasos y requisitos legales necesarios para declarar la resolución de un contrato por incumplimiento del contratista.',
    'Explique en qué supuestos procede realizar una Contratación Directa por Situación de Emergencia en una municipalidad distrital.',
    '¿Cuál es el procedimiento técnico para calcular la penalidad diaria por mora aplicable a un proveedor que entregó bienes con 5 días de retraso?',
    'Redacte las directrices que debe contener una Ficha de Especificaciones Técnicas para la adquisición de insumos del Programa Vaso de Leche.',
  ]),
  'Serenazgo Chofer': crearPreguntas([
    ['¿Cuál es el marco normativo que regula el servicio de serenazgo municipal a nivel nacional?', 'Ley N° 31297 (Ley del Servicio de Serenazgo Municipal).', 'Reglamento Nacional de Tránsito.', 'Ley Orgánica de Municipalidades.', 0],
    ['Un conductor de unidad de Serenazgo debe contar obligatoriamente con brevete de categoría mínima:', 'Clase A Categ. I', 'Clase A Categ. II-b', 'Clase B Categ. II', 1],
    ['En una intervención ante un hecho delictivo en flagrancia, el sereno debe:', 'Sancionar inmediatamente al infractor.', 'Prestar auxilio, practicar el arresto ciudadano y entregar de inmediato a la PNP.', 'Trasladar al detenido al depósito municipal.', 1],
    ['¿Qué elemento de alerta sonora y luminosa identifica a los vehículos de Serenazgo Municipal?', 'Circulina de color rojo.', 'Circulina de color azul y sirena de patrullaje.', 'Circulina de color ámbar.', 1],
    ['El documento operativo donde el conductor registra el kilometraje, combustible y novedades del turno se llama:', 'Cuaderno de cargos.', 'Bitácora o Cuaderno de Ocurrencias / Hoja de Ruta.', 'Papeleta de infracción.', 1],
    ['Ante un accidente de tránsito con heridos en la vía pública, la prioridad absoluta del Serenazgo Chofer es:', 'Tomar fotos para las redes institucionales.', 'Asegurar la zona y coordinar el auxilio médico/traslado urgente.', 'Perseguir al otro vehículo involucrado.', 1],
    ['¿Cuál es el límite máximo de velocidad en calles y jirones según el Reglamento Nacional de Tránsito en zonas urbanas?', '30 km/h', '60 km/h', '80 km/h', 0],
    ['¿Qué significa el Patrullaje Integrado en la gestión municipal?', 'Patrullaje realizado por serenos y vecinos vigilantes.', 'Patrullaje conjunto entre la unidad de Serenazgo y un efectivo de la Policía Nacional (PNP).', 'Patrullaje exclusivo de serenazgo nocturno.', 1],
    ['En el uso de la fuerza y medios de defensa, el personal de serenazgo está sujeto a:', 'Uso proporcional y disuasivo reglamentado por ley.', 'Uso de armas de fuego de largo alcance.', 'Criterio libre del conductor.', 0],
    ['¿Qué debe revisar el conductor antes de iniciar el servicio de patrullaje con la camioneta?', 'Únicamente el sistema de radio.', 'Niveles de aceite, agua, frenos, presión de llantas, luces y equipo de auxilio mecánico.', 'La limpieza del parabrisas solamente.', 1],
    ['Al conducir en situaciones de emergencia con la sirena encendida, el Chofer de Serenazgo:', 'Queda eximido del deber de conducir con prudencia y cuidado.', 'Debe conducir con máxima cautela respetando la vida de los peatones.', 'Puede invadir carriles sin reducir la velocidad en cruces.', 1],
    ['La comunicación por radiofrecuencia en el vehículo debe ser:', 'Breve, clara y utilizando los códigos radiales operativos establecidos.', 'Informativa con opiniones personales sobre la intervención.', 'Utilizada para llamadas personales.', 0],
    ['Si durante el patrullaje se identifica un vehículo abandonado en la vía pública con signos de haber sido robado, se debe:', 'Remolcarlo inmediatamente al taller municipal.', 'Reportar a la central de monitoreo y custodiar la escena hasta la llegada de la PNP.', 'Dejar una nota en el parabrisas.', 1],
    ['¿Qué actitud debe mantener el sereno ante la provocación verbal de un ciudadano intervenido?', 'Responder con la misma intensidad.', 'Mantener la calma, firmeza, respeto y lenguaje disuasivo sin caer en provocaciones.', 'Proceder al uso de la fuerza física.', 1],
    ['El equipamiento básico de protección personal (EPP) de un Serenazgo Chofer incluye:', 'Chaleco antibalas/anticorte, casco táctico, vara de ley y radio portátil.', 'Chaleco reflectivo simple.', 'Indumentaria de civil.', 0],
  ], [
    'Caso práctico: Durante el patrullaje por el sector rural de Los Aquijes, observa un choque entre dos mototaxis con personas heridas en la calzada. Describa la secuencia exacta de acciones que ejecuta desde la conducción del vehículo hasta la llegada de la PNP y ambulancia.',
    'Explique cuáles son los límites de actuación del Serenazgo Municipal según la Ley N° 31297 durante una intervención por alteración del orden público en la vía pública.',
    'Redacte un informe breve de ocurrencias sobre un auxilio mecánico y resguardo prestado a un vecino en la noche.',
    '¿Cómo debe actuar si al realizar el relevo de turno detecta que el vehículo presenta una abolladura reciente no reportada en la bitácora del turno anterior?',
    'Mencione y explique 5 códigos o protocolos radiales utilizados para el reporte de emergencias durante el patrullaje municipal.',
  ]),
};

export default function Evaluaciones() {
  const [modo, setModo] = useState('historial');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudId, setSolicitudId] = useState('');
  const [candidato, setCandidato] = useState('');
  const [puesto, setPuesto] = useState('');
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [marcadas, setMarcadas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [puntajeManual, setPuntajeManual] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [calificando, setCalificando] = useState(false);
  const [error, setError] = useState('');
  const [puntajeMinimo, setPuntajeMinimo] = useState(70);
  const preguntas = evaluacionesPorPuesto[puesto] || [];

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [evaluationsResult, requestsResult, systemResult] = await Promise.all([
        apiRequest('/evaluations'),
        apiRequest('/candidate-requests'),
        apiRequest('/system-info'),
      ]);
      setEvaluaciones(evaluationsResult.evaluations);
      setSolicitudes(requestsResult.requests);
      setPuntajeMinimo(systemResult.system.passing_score);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const iniciarEvaluacion = (event) => {
    event.preventDefault();
    const request = solicitudes.find((item) => item.id === solicitudId);
    if (!request) {
      setError('Selecciona una solicitud para asociar la evaluación.');
      return;
    }
    if (!evaluacionesPorPuesto[request.position_title]) {
      setError('Todavía no hay un examen configurado para este puesto.');
      return;
    }
    setPuesto(request.position_title);
    setError('');
    setIndicePregunta(0);
    setRespuestas({});
    setMarcadas([]);
    setModo('prueba');
  };

  const finalizarEvaluacion = async () => {
    const correctas = preguntas.slice(0, 15).reduce(
      (total, pregunta, indice) => total + (respuestas[indice] === pregunta.respuesta ? 1 : 0),
      0
    );
    const detalles = {
      puesto,
      respuestasObjetivas: preguntas.slice(0, 15).map((pregunta, indice) => ({
        pregunta: pregunta.texto,
        respuesta: pregunta.opciones[respuestas[indice]],
        correcta: respuestas[indice] === pregunta.respuesta,
      })),
      respuestasDesarrollo: preguntas.slice(15).map((pregunta, indice) => ({
        pregunta: pregunta.texto,
        respuesta: respuestas[indice + 15],
      })),
    };
    setGuardando(true);
    setError('');
    try {
      await apiRequest('/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          requestId: solicitudId,
          evaluationName: `Evaluación técnica - ${puesto}`,
          candidateName: candidato.trim(),
          notes: JSON.stringify(detalles),
          score: null,
          status: 'pending',
        }),
      });
      await cargarDatos();
      setResultado({ correctas });
      setModo('resultado');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGuardando(false);
    }
  };

  const volverAlHistorial = () => {
    setModo('historial');
    setCandidato('');
    setPuesto('');
    setSolicitudId('');
    setResultado(null);
  };

  const revisarEvaluacion = (evaluacion) => {
    let detalle = null;
    try {
      detalle = JSON.parse(evaluacion.notes);
    } catch {
      detalle = null;
    }
    setEvaluacionSeleccionada({ ...evaluacion, detalle });
    setPuntajeManual(evaluacion.score == null ? '' : String(evaluacion.score));
  };

  const calificarEvaluacion = async () => {
    if (puntajeManual.trim() === '') {
      setError('Ingresa un puntaje entre 0 y 100.');
      return;
    }
    const score = Number(puntajeManual);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError('Ingresa un puntaje entre 0 y 100.');
      return;
    }

    setCalificando(true);
    setError('');
    try {
      const { evaluation } = await apiRequest(`/evaluations/${evaluacionSeleccionada.id}/score`, {
        method: 'PATCH',
        body: JSON.stringify({ score }),
      });
      setEvaluaciones((current) => current.map((item) => (
        item.id === evaluation.id ? { ...item, ...evaluation, score } : item
      )));
      setEvaluacionSeleccionada((current) => ({ ...current, score }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCalificando(false);
    }
  };

  const preguntaActual = preguntas[indicePregunta];
  const estaRespondida = (pregunta, indice) => pregunta.tipo === 'desarrollo'
    ? Boolean(respuestas[indice]?.trim())
    : respuestas[indice] !== undefined;
  const contestadas = preguntas.filter(estaRespondida).length;
  const primeraSinResponder = preguntas.findIndex((pregunta, indice) => !estaRespondida(pregunta, indice));
  const ultimaPreguntaAccesible = primeraSinResponder === -1
    ? preguntas.length - 1
    : primeraSinResponder;
  const bloquearPortapapeles = (event) => event.preventDefault();
  const bloquearAtajosDePortapapeles = (event) => {
    if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
    if (event.shiftKey && event.key === 'Insert') event.preventDefault();
  };

  useEffect(() => {
    if (modo !== 'prueba') return undefined;

    const bloquearEventoPortapapeles = (event) => event.preventDefault();
    const bloquearAtajoPortapapeles = (event) => {
      const tecla = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x'].includes(tecla)) {
        event.preventDefault();
      }
      if (event.shiftKey && event.key === 'Insert') event.preventDefault();
    };

    document.addEventListener('copy', bloquearEventoPortapapeles);
    document.addEventListener('cut', bloquearEventoPortapapeles);
    document.addEventListener('paste', bloquearEventoPortapapeles);
    document.addEventListener('contextmenu', bloquearEventoPortapapeles);
    document.addEventListener('selectstart', bloquearEventoPortapapeles);
    document.addEventListener('keydown', bloquearAtajoPortapapeles);

    return () => {
      document.removeEventListener('copy', bloquearEventoPortapapeles);
      document.removeEventListener('cut', bloquearEventoPortapapeles);
      document.removeEventListener('paste', bloquearEventoPortapapeles);
      document.removeEventListener('contextmenu', bloquearEventoPortapapeles);
      document.removeEventListener('selectstart', bloquearEventoPortapapeles);
      document.removeEventListener('keydown', bloquearAtajoPortapapeles);
    };
  }, [modo]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 sm:px-8 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Evaluaciones Técnicas
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          {modo === 'historial' && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Evaluaciones de Competencias</h2>
                  <p className="text-xs text-gray-500">Pruebas técnicas y resultados por puesto solicitado</p>
                </div>
                <button
                  onClick={() => setModo('preparacion')}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm"
                >
                  Iniciar evaluación técnica
                </button>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-950">
                Cada examen queda asociado al puesto y a la solicitud; las respuestas de desarrollo quedan pendientes de revisión.
              </div>

              <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="mb-4 font-bold text-sm text-gray-900">Historial de evaluaciones</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-400 border-b">
                        <th className="pb-3 font-medium">Cód. Eval</th>
                        <th className="pb-3 font-medium">Candidato (ciego)</th>
                        <th className="pb-3 font-medium">Puesto</th>
                        <th className="pb-3 font-medium">Fecha</th>
                        <th className="pb-3 font-medium">Puntaje</th>
                        <th className="pb-3 font-medium">Estado</th>
                        <th className="pb-3 font-medium">Respuestas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {evaluaciones.map((evaluacion) => (
                        <tr key={evaluacion.id} className="hover:bg-gray-50">
                          <td className="py-3 font-bold text-blue-950">{evaluacion.id.slice(0, 8)}</td>
                          <td className="py-3 font-mono font-bold text-gray-800">{evaluacion.candidate_name || evaluacion.worker_name || '—'}</td>
                          <td className="py-3 text-gray-700">{evaluacion.position_title || evaluacion.evaluation_name}</td>
                          <td className="py-3 text-gray-500">{new Date(evaluacion.created_at).toLocaleDateString('es-PE')}</td>
                          <td className="py-3 font-bold text-blue-900">{evaluacion.score ?? '—'} / 100</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              evaluacion.score == null ? 'bg-amber-100 text-amber-800' :
                              Number(evaluacion.score) >= puntajeMinimo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {evaluacion.score == null ? 'Pendiente' : Number(evaluacion.score) >= puntajeMinimo ? 'Aprobado' : 'Desaprobado'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => revisarEvaluacion(evaluacion)}
                              className="font-semibold text-blue-900 underline"
                            >
                              Revisar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!cargando && evaluaciones.length === 0 && (
                        <tr><td colSpan="7" className="py-8 text-center text-gray-500">No hay evaluaciones registradas.</td></tr>
                      )}
                      {cargando && <tr><td colSpan="7" className="py-8 text-center text-gray-500">Cargando evaluaciones…</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>

              {evaluacionSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="revision-evaluacion-titulo"
                    className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 border-b pb-4">
                      <div>
                        <h3 id="revision-evaluacion-titulo" className="font-bold text-gray-900">Respuestas del examen</h3>
                        <p className="mt-1 text-xs text-gray-600">
                          {evaluacionSeleccionada.candidate_name || 'Postulante'} · {evaluacionSeleccionada.position_title || evaluacionSeleccionada.evaluation_name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEvaluacionSeleccionada(null)}
                        aria-label="Cerrar revisión"
                        className="text-xl text-gray-500 hover:text-gray-900"
                      >
                        ×
                      </button>
                    </div>
                    {evaluacionSeleccionada.detalle?.respuestasObjetivas ? (
                      <div className="mt-5 space-y-6 text-sm">
                        <section>
                          <h4 className="font-semibold text-gray-900">Opción múltiple</h4>
                          <ol className="mt-3 list-decimal space-y-3 pl-5">
                            {evaluacionSeleccionada.detalle.respuestasObjetivas.map((respuesta, indice) => (
                              <li key={`objetiva-${indice}`}>
                                <p className="font-medium">{respuesta.pregunta}</p>
                                <p className={respuesta.correcta ? 'mt-1 text-emerald-700' : 'mt-1 text-red-700'}>
                                  Respuesta: {respuesta.respuesta || 'Sin respuesta'}{respuesta.correcta ? ' (correcta)' : ' (incorrecta)'}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </section>
                        <section>
                          <h4 className="font-semibold text-gray-900">
                            Desarrollo — {evaluacionSeleccionada.score == null ? 'pendiente de calificación' : `puntaje ${evaluacionSeleccionada.score}/100`}
                          </h4>
                          <ol className="mt-3 list-decimal space-y-4 pl-5">
                            {evaluacionSeleccionada.detalle.respuestasDesarrollo.map((respuesta, indice) => (
                              <li key={`desarrollo-${indice}`}>
                                <p className="font-medium">{respuesta.pregunta}</p>
                                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                                  {respuesta.respuesta || 'Sin respuesta'}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </section>
                      </div>
                    ) : (
                      <p className="mt-5 whitespace-pre-wrap text-sm text-gray-700">
                        {evaluacionSeleccionada.notes || 'Esta evaluación no tiene respuestas registradas.'}
                      </p>
                    )}
                    {evaluacionSeleccionada.score == null && (
                      <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
                        <div>
                          <label htmlFor="puntaje-evaluacion" className="mb-1 block text-xs font-semibold text-gray-700">
                            Puntaje final (0–100)
                          </label>
                          <input
                            id="puntaje-evaluacion"
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="0.01"
                            value={puntajeManual}
                            onChange={(event) => setPuntajeManual(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm sm:w-40"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={calificarEvaluacion}
                          disabled={calificando}
                          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                        >
                          {calificando ? 'Guardando…' : 'Guardar calificación'}
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}

          {modo === 'preparacion' && (
            <section className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setModo('historial')}
                className="mb-5 text-xs font-semibold text-blue-900 hover:underline"
              >
                ← Volver al historial
              </button>
              <h2 className="text-xl font-bold text-gray-900">Preparar evaluación técnica</h2>
              <p className="mt-1 text-xs text-gray-500">Asocia la prueba con una solicitud y usa el código anónimo del postulante.</p>

              <form onSubmit={iniciarEvaluacion} className="mt-5 space-y-4 text-xs">
                <div>
                  <label htmlFor="solicitud-evaluar" className="mb-1 block font-semibold text-gray-700">
                    Solicitud de cobertura
                  </label>
                  <select
                    id="solicitud-evaluar"
                    required
                    value={solicitudId}
                    onChange={(event) => setSolicitudId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5"
                  >
                    <option value="">Selecciona una solicitud</option>
                    {solicitudes.filter((request) => evaluacionesPorPuesto[request.position_title]).map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.code} — {request.position_title}
                      </option>
                    ))}
                  </select>
                  {solicitudes.every((request) => !evaluacionesPorPuesto[request.position_title]) && (
                    <p className="mt-2 text-amber-700">No hay solicitudes para los puestos con examen configurado.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="codigo-candidato" className="mb-1 block font-semibold text-gray-700">
                    Código del postulante
                  </label>
                  <input
                    id="codigo-candidato"
                    type="text"
                    required
                    value={candidato}
                    onChange={(event) => setCandidato(event.target.value)}
                    placeholder="Ej. Postulante #004"
                    className="w-full rounded-lg border border-gray-300 p-2.5"
                  />
                </div>
                <div className="rounded-lg bg-gray-50 p-3 leading-relaxed text-gray-600">
                  El examen del puesto seleccionado tiene 20 preguntas: 15 de opción múltiple y 5 de desarrollo. Las respuestas de desarrollo quedan pendientes de revisión.
                </div>
                <button
                  type="submit"
                  disabled={solicitudes.every((request) => !evaluacionesPorPuesto[request.position_title])}
                  className="w-full rounded-lg bg-blue-950 px-4 py-2.5 font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  Comenzar evaluación
                </button>
              </form>
            </section>
          )}

          {modo === 'prueba' && (
            <section
              className="mx-auto w-full max-w-4xl space-y-5"
              onCopy={bloquearPortapapeles}
              onCut={bloquearPortapapeles}
              onPaste={bloquearPortapapeles}
              onContextMenu={bloquearPortapapeles}
              onKeyDown={bloquearAtajosDePortapapeles}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModo('preparacion')}
                  className="text-xs font-semibold text-blue-900 hover:underline"
                >
                  ← Salir de la evaluación
                </button>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                  {contestadas} de {preguntas.length} respondidas
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-900">Evaluación técnica dinámica</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{puesto}</h2>
                    <p className="mt-1 text-xs text-gray-500">15 preguntas de opción múltiple · 5 preguntas de desarrollo</p>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono text-gray-700">
                    {candidato}
                  </span>
                </div>

                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-950">
                  <p className="font-bold">Instrucciones de la evaluación</p>
                  <p className="mt-1">
                    Responde todas las preguntas para finalizar. No está permitido copiar, cortar ni pegar durante el examen. Las respuestas de desarrollo serán revisadas posteriormente.
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-gray-500">
                    <span>Progreso de la prueba</span>
                    <span>Pregunta {indicePregunta + 1} de {preguntas.length}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={indicePregunta + 1}
                    aria-valuemin={1}
                    aria-valuemax={preguntas.length}
                    aria-label="Progreso de la evaluación"
                    className="h-2 overflow-hidden rounded-full bg-gray-200"
                  >
                    <div
                      className="h-full rounded-full bg-blue-900 transition-all"
                      style={{ width: `${((indicePregunta + 1) / preguntas.length) * 100}%` }}
                    />
                  </div>
                </div>

                <fieldset className="mt-7">
                  <legend className="text-base font-semibold leading-relaxed text-gray-900">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-800">
                      {preguntaActual.tipo === 'opcion_multiple' ? 'Opción múltiple' : 'Desarrollo'}
                    </span>
                    {preguntaActual.texto}
                  </legend>
                  {preguntaActual.tipo === 'opcion_multiple' ? <div className="mt-5 space-y-3">
                    {preguntaActual.opciones.map((opcion, indiceOpcion) => (
                      <label
                        key={opcion}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          respuestas[indicePregunta] === indiceOpcion
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pregunta-${indicePregunta}`}
                          value={indiceOpcion}
                          checked={respuestas[indicePregunta] === indiceOpcion}
                          onChange={() => setRespuestas((actuales) => ({ ...actuales, [indicePregunta]: indiceOpcion }))}
                          className="mt-0.5 accent-blue-900"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div> : (
                    <textarea
                      value={respuestas[indicePregunta] || ''}
                      onChange={(event) => setRespuestas((actuales) => ({ ...actuales, [indicePregunta]: event.target.value }))}
                      maxLength={4000}
                      rows={8}
                      aria-label={`Respuesta de desarrollo para la pregunta ${indicePregunta + 1}`}
                      placeholder="Escribe tu respuesta..."
                      onCopy={bloquearPortapapeles}
                      onCut={bloquearPortapapeles}
                      onPaste={bloquearPortapapeles}
                      onContextMenu={bloquearPortapapeles}
                      style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                      className="mt-5 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </fieldset>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setMarcadas((actuales) => (
                      actuales.includes(indicePregunta)
                        ? actuales.filter((indice) => indice !== indicePregunta)
                        : [...actuales, indicePregunta]
                    ))}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      marcadas.includes(indicePregunta)
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {marcadas.includes(indicePregunta) ? '✓ Marcada para revisar' : '⚑ Marcar para revisar'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIndicePregunta((actual) => Math.max(0, actual - 1))}
                      disabled={indicePregunta === 0}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    {indicePregunta < preguntas.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setIndicePregunta((actual) => Math.min(preguntas.length - 1, actual + 1))}
                        disabled={!estaRespondida(preguntaActual, indicePregunta)}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={finalizarEvaluacion}
                        disabled={contestadas < preguntas.length || guardando}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {guardando ? 'Guardando evaluación…' : contestadas < preguntas.length ? 'Completa todas las preguntas' : 'Finalizar evaluación'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Navegar entre preguntas">
                {preguntas.map((_, indice) => (
                  <button
                    key={indice}
                    type="button"
                    onClick={() => setIndicePregunta(indice)}
                    disabled={indice > ultimaPreguntaAccesible}
                    aria-label={`Ir a la pregunta ${indice + 1}${estaRespondida(preguntas[indice], indice) ? ', respondida' : ''}${marcadas.includes(indice) ? ', marcada para revisar' : ''}`}
                    aria-current={indicePregunta === indice ? 'step' : undefined}
                    className={`h-9 w-9 rounded-lg text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                      indicePregunta === indice
                        ? 'bg-blue-950 text-white'
                        : marcadas.includes(indice)
                          ? 'border border-amber-300 bg-amber-50 text-amber-800'
                          : estaRespondida(preguntas[indice], indice)
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    {indice + 1}
                  </button>
                ))}
              </div>
            </section>
          )}

          {modo === 'resultado' && resultado && (
            <section className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-extrabold text-amber-700">
                ✓
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Evaluación entregada</p>
              <h2 className="mt-1 text-3xl font-extrabold text-amber-700">PENDIENTE DE REVISIÓN</h2>
              <p className="mt-2 text-sm text-gray-700">{candidato} · {puesto}</p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Alternativas correctas (referencial)</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{resultado.correctas} / 15</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Respuestas de desarrollo</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">5 pendientes de revisión</p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-gray-500">
                Tus respuestas fueron registradas. El resultado final se definirá después de revisar las respuestas de desarrollo.
              </p>
              <button
                type="button"
                onClick={volverAlHistorial}
                className="mt-6 rounded-lg bg-blue-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-900"
              >
                Volver al historial
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
