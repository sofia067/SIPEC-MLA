import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

const preguntas = [
  {
    texto: 'Al recibir una solicitud de cobertura de personal, ¿qué corresponde verificar primero?',
    opciones: [
      'Que el requerimiento tenga justificación y autorización del área solicitante',
      'Que el candidato recomendado conozca al jefe del área',
      'Que la solicitud se publique sin revisar sus requisitos',
      'Que se seleccione al candidato con mayor antigüedad, sin evaluar el perfil',
    ],
    respuesta: 0,
  },
  {
    texto: '¿Qué criterio favorece una evaluación imparcial de postulantes?',
    opciones: [
      'Priorizar recomendaciones personales',
      'Aplicar los mismos requisitos y criterios a todas las personas postulantes',
      'Considerar datos personales no relacionados con el puesto',
      'Cambiar los criterios durante la evaluación',
    ],
    respuesta: 1,
  },
  {
    texto: '¿Cuál es una práctica adecuada al revisar un documento sustentatorio?',
    opciones: [
      'Dar por válida cualquier copia sin revisarla',
      'Compartir el documento en canales públicos para pedir opiniones',
      'Verificar que sea legible y corresponda al requisito solicitado',
      'Reemplazar los datos del documento por información estimada',
    ],
    respuesta: 2,
  },
  {
    texto: '¿Qué información debe registrarse para mantener trazabilidad?',
    opciones: [
      'Solo el nombre de quien realizó la evaluación',
      'La acción realizada, su fecha y el usuario responsable',
      'Únicamente el resultado final',
      'Ninguna, si el proceso ya terminó',
    ],
    respuesta: 1,
  },
  {
    texto: 'Si una persona candidata no cumple un requisito mínimo del perfil, ¿qué se debe hacer?',
    opciones: [
      'Ignorar el requisito para acelerar la selección',
      'Modificar su puntaje sin dejar registro',
      'Aplicar el criterio establecido y registrar la observación correspondiente',
      'Revelar su identidad al resto de postulantes',
    ],
    respuesta: 2,
  },
];

const evaluacionesIniciales = [
  { id: 'EV-001', candidato: 'Postulante #001', puesto: 'Técnico de Fiscalización', fecha: '10/10/2026', puntaje: 89, estado: 'Aprobado' },
  { id: 'EV-002', candidato: 'Postulante #002', puesto: 'Inspector de Transporte', fecha: '09/10/2026', puntaje: 77.5, estado: 'En revisión' },
  { id: 'EV-003', candidato: 'Postulante #003', puesto: 'Sereno Operativo', fecha: '08/10/2026', puntaje: 62.5, estado: 'Desaprobado' },
];

const fechaLocal = () => {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 10);
};

export default function Evaluaciones() {
  const [modo, setModo] = useState('historial');
  const [evaluaciones, setEvaluaciones] = useState(evaluacionesIniciales);
  const [candidato, setCandidato] = useState('');
  const [puesto, setPuesto] = useState('');
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [marcadas, setMarcadas] = useState([]);
  const [resultado, setResultado] = useState(null);

  const iniciarEvaluacion = (event) => {
    event.preventDefault();
    setIndicePregunta(0);
    setRespuestas({});
    setMarcadas([]);
    setModo('prueba');
  };

  const finalizarEvaluacion = () => {
    const correctas = preguntas.reduce(
      (total, pregunta, indice) => total + (respuestas[indice] === pregunta.respuesta ? 1 : 0),
      0
    );
    const puntaje = Math.round((correctas / preguntas.length) * 100);
    const estado = puntaje >= 70 ? 'Aprobado' : 'Desaprobado';
    const siguienteId = Math.max(
      0,
      ...evaluaciones.map((evaluacion) => Number(evaluacion.id.replace('EV-', '')) || 0)
    ) + 1;
    const [year, month, day] = fechaLocal().split('-');

    const nuevaEvaluacion = {
      id: `EV-${String(siguienteId).padStart(3, '0')}`,
      candidato: candidato.trim(),
      puesto: puesto.trim(),
      fecha: `${day}/${month}/${year}`,
      puntaje,
      estado,
    };

    setEvaluaciones((actuales) => [nuevaEvaluacion, ...actuales]);
    setResultado({ correctas, puntaje, estado });
    setModo('resultado');
  };

  const volverAlHistorial = () => {
    setModo('historial');
    setCandidato('');
    setPuesto('');
    setResultado(null);
  };

  const preguntaActual = preguntas[indicePregunta];
  const contestadas = Object.keys(respuestas).length;
  const primeraSinResponder = preguntas.findIndex((_, indice) => respuestas[indice] === undefined);
  const ultimaPreguntaAccesible = primeraSinResponder === -1
    ? preguntas.length - 1
    : primeraSinResponder;

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
                Esta pantalla contiene una evaluación demostrativa de opción múltiple. Los resultados se conservan solo mientras esta página permanezca abierta.
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {evaluaciones.map((evaluacion) => (
                        <tr key={evaluacion.id} className="hover:bg-gray-50">
                          <td className="py-3 font-bold text-blue-950">{evaluacion.id}</td>
                          <td className="py-3 font-mono font-bold text-gray-800">{evaluacion.candidato}</td>
                          <td className="py-3 text-gray-700">{evaluacion.puesto}</td>
                          <td className="py-3 text-gray-500">{evaluacion.fecha}</td>
                          <td className="py-3 font-bold text-blue-900">{evaluacion.puntaje} / 100</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              evaluacion.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                              evaluacion.estado === 'En revisión' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {evaluacion.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
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
              <p className="mt-1 text-xs text-gray-500">Usa el código anónimo del postulante para respetar la selección ciega.</p>

              <form onSubmit={iniciarEvaluacion} className="mt-5 space-y-4 text-xs">
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
                <div>
                  <label htmlFor="puesto-evaluar" className="mb-1 block font-semibold text-gray-700">
                    Puesto a evaluar
                  </label>
                  <input
                    id="puesto-evaluar"
                    type="text"
                    required
                    value={puesto}
                    onChange={(event) => setPuesto(event.target.value)}
                    placeholder="Ej. Técnico de Fiscalización"
                    className="w-full rounded-lg border border-gray-300 p-2.5"
                  />
                </div>
                <div className="rounded-lg bg-gray-50 p-3 leading-relaxed text-gray-600">
                  La prueba demostrativa contiene {preguntas.length} preguntas de opción múltiple. Se aprueba con 70 puntos o más. El resultado es local y no se guarda en una base de datos.
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-950 px-4 py-2.5 font-bold text-white hover:bg-blue-900"
                >
                  Comenzar evaluación
                </button>
              </form>
            </section>
          )}

          {modo === 'prueba' && (
            <section className="mx-auto w-full max-w-4xl space-y-5">
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
                    <p className="mt-1 text-xs text-gray-500">Competencia: Normativa y procedimientos</p>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono text-gray-700">
                    {candidato}
                  </span>
                </div>

                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-950">
                  <p className="font-bold">Instrucciones de la evaluación</p>
                  <p className="mt-1">
                    Selecciona una respuesta para habilitar el avance. Puedes volver a preguntas respondidas y cambiar tu respuesta. Para finalizar, debes contestarlas todas.
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
                    {preguntaActual.texto}
                  </legend>
                  <div className="mt-5 space-y-3">
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
                          onChange={() => setRespuestas({ ...respuestas, [indicePregunta]: indiceOpcion })}
                          className="mt-0.5 accent-blue-900"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div>
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
                        disabled={respuestas[indicePregunta] === undefined}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={finalizarEvaluacion}
                        disabled={contestadas < preguntas.length}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {contestadas < preguntas.length ? 'Completa todas las preguntas' : 'Finalizar evaluación'}
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
                    aria-label={`Ir a la pregunta ${indice + 1}${respuestas[indice] !== undefined ? ', respondida' : ''}${marcadas.includes(indice) ? ', marcada para revisar' : ''}`}
                    aria-current={indicePregunta === indice ? 'step' : undefined}
                    className={`h-9 w-9 rounded-lg text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                      indicePregunta === indice
                        ? 'bg-blue-950 text-white'
                        : marcadas.includes(indice)
                          ? 'border border-amber-300 bg-amber-50 text-amber-800'
                          : respuestas[indice] !== undefined
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
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ${
                resultado.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {resultado.estado === 'Aprobado' ? '✓' : '!'}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Resultado de evaluación</p>
              <h2 className={`mt-1 text-3xl font-extrabold ${
                resultado.estado === 'Aprobado' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {resultado.estado === 'Aprobado' ? 'APTO' : 'NO APTO'}
              </h2>
              <p className="mt-2 text-sm text-gray-700">{candidato} · {puesto}</p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Puntaje obtenido</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{resultado.puntaje} / 100</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Respuestas correctas</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{resultado.correctas} / {preguntas.length}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Umbral aprobatorio</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">70%</p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-gray-500">
                Este resultado pertenece a una demostración y solo permanece en memoria mientras la página está abierta.
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
