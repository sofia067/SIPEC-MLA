import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

export default function Evaluaciones() {
  const [modo, setModo] = useState('historial');
  const [candidatos, setCandidatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [candidato, setCandidato] = useState('');
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [marcadas, setMarcadas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const candidatoSeleccionado = candidatos.find((item) => item.id === candidato);
  const puesto = candidatoSeleccionado?.position_title ?? '';
  const bancoSeleccionado = bancos.find((banco) => banco.puesto === puesto);
  const preguntas = bancoSeleccionado?.preguntas ?? [];
  const cantidadObjetivas = preguntas.filter((pregunta) => pregunta.tipo === 'opcion').length;
  const cantidadEscritas = preguntas.filter((pregunta) => pregunta.tipo === 'escrita').length;

  const cargarDatos = async () => {
    const [candidateResult, bankResult] = await Promise.all([
      apiRequest('/blind-selection/candidates'),
      apiRequest('/blind-selection/banks'),
    ]);
    setCandidatos(candidateResult.candidates);
    setBancos(bankResult.banks);
  };

  useEffect(() => {
    cargarDatos()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const iniciarEvaluacion = (event) => {
    event.preventDefault();
    if (!candidatoSeleccionado || !bancoSeleccionado) return;
    setIndicePregunta(0);
    setRespuestas({});
    setMarcadas([]);
    setError('');
    setModo('prueba');
  };

  const finalizarEvaluacion = async () => {
    setEnviando(true);
    setError('');
    try {
      const { exam } = await apiRequest(`/blind-selection/candidates/${candidato}/exam`, {
        method: 'POST',
        body: JSON.stringify({ answers: preguntas.map((_, index) => respuestas[index]) }),
      });
      const puntaje = Number(exam.objective_score);
      const correctas = Math.round((puntaje / 100) * cantidadObjetivas);
      const estado = puntaje === 100 ? 'Pendiente de revisión' : 'Desaprobado';
      setResultado({ correctas, puntaje, estado });
      setModo('resultado');
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEnviando(false);
    }
  };

  const volverAlHistorial = () => {
    setModo('historial');
    setCandidato('');
    setResultado(null);
  };

  const preguntaActual = preguntas[indicePregunta];
  const preguntaRespondida = (indice) => preguntas[indice].tipo === 'opcion'
    ? typeof respuestas[indice] === 'number'
    : typeof respuestas[indice] === 'string' && respuestas[indice].trim().length > 0;
  const contestadas = preguntas.filter((_, indice) => preguntaRespondida(indice)).length;
  const primeraSinResponder = preguntas.findIndex((_, indice) => !preguntaRespondida(indice));
  const ultimaPreguntaAccesible = primeraSinResponder === -1
    ? preguntas.length - 1
    : primeraSinResponder;
  const bloquearClipboard = (event) => event.preventDefault();
  const bloquearAtajosClipboard = (event) => {
    const tecla = event.key.toLowerCase();
    const modificador = event.ctrlKey || event.metaKey;
    const atajo = (modificador && ['c', 'v', 'x', 'insert'].includes(tecla))
      || (event.shiftKey && tecla === 'insert');
    if (atajo) event.preventDefault();
  };

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
          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
                Las preguntas y sus claves deben verificarse con fuentes oficiales antes de usarse en evaluaciones reales.
              </div>

              <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="mb-4 font-bold text-sm text-gray-900">Historial de evaluaciones</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-400 border-b">
                        <th className="pb-3 font-medium">Cód. Eval</th>
                        <th className="pb-3 font-medium">Postulante</th>
                        <th className="pb-3 font-medium">Puesto</th>
                        <th className="pb-3 font-medium">Fecha</th>
                        <th className="pb-3 font-medium">Puntaje</th>
                        <th className="pb-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {candidatos.filter((item) => item.exam_id).map((evaluacion) => {
                        const estado = Number(evaluacion.objective_score) < 100
                          ? 'No superó la valla'
                          : evaluacion.written_review_status === 'rejected'
                            ? 'Desarrollo no aprobado'
                            : evaluacion.identity_revealed
                              ? 'Valla superada'
                              : 'Pendiente de revisión';
                        return (
                        <tr key={evaluacion.exam_id} className="hover:bg-gray-50">
                          <td className="py-3 font-bold text-blue-950">
                            {evaluacion.application_code}
                            {evaluacion.is_demo && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">PRUEBA</span>}
                          </td>
                          <td className="py-3 font-mono font-bold text-gray-800">
                            {evaluacion.identity_revealed ? (
                              <>
                                {evaluacion.full_name}
                                {evaluacion.has_resume && (
                                  <a
                                    href={`/api/blind-selection/candidates/${evaluacion.id}/resume`}
                                    className="mt-1 block font-sans text-[10px] font-semibold text-blue-800 hover:underline"
                                  >
                                    Descargar CV
                                  </a>
                                )}
                              </>
                            ) : 'Identidad protegida'}
                          </td>
                          <td className="py-3 text-gray-700">{evaluacion.position_title}</td>
                          <td className="py-3 text-gray-500">
                            {evaluacion.submitted_at ? new Date(evaluacion.submitted_at).toLocaleDateString('es-PE') : '—'}
                          </td>
                          <td className="py-3 font-bold text-blue-900">{evaluacion.objective_score} / 100</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              estado === 'Valla superada' ? 'bg-emerald-100 text-emerald-800' :
                              estado === 'No superó la valla' || estado === 'Desarrollo no aprobado'
                                ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {estado}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                      {!cargando && candidatos.every((item) => !item.exam_id) && (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-gray-500">
                            Aún no hay evaluaciones registradas.
                          </td>
                        </tr>
                      )}
                      {cargando && (
                        <tr><td colSpan="6" className="py-6 text-center text-gray-500">Cargando evaluaciones…</td></tr>
                      )}
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
                    Postulante (código ciego)
                  </label>
                  <select
                    id="codigo-candidato"
                    required
                    value={candidato}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                    disabled={cargando}
                    onChange={(event) => setCandidato(event.target.value)}
                  >
                    <option value="">Selecciona un postulante</option>
                    {candidatos.filter((item) => !item.exam_id).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.application_code} · {item.position_title}
                      </option>
                    ))}
                  </select>
                </div>
                {bancoSeleccionado && (
                  <p className="rounded-lg bg-blue-50 p-3 text-blue-950">
                    Puesto: {puesto} · Unidad orgánica: {bancoSeleccionado.gerencia}
                  </p>
                )}
                {candidatoSeleccionado && !bancoSeleccionado && (
                  <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">
                    No hay un banco de evaluación configurado para el puesto de esta solicitud.
                  </p>
                )}
                <div className="rounded-lg bg-gray-50 p-3 leading-relaxed text-gray-600">
                  La identidad permanece protegida. Para superar la valla se requiere 100% en opción múltiple y aprobación de todas las respuestas de desarrollo.
                </div>
                <button
                  type="submit"
                  disabled={!candidatoSeleccionado || !bancoSeleccionado || enviando}
                  className="w-full rounded-lg bg-blue-950 px-4 py-2.5 font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                    {candidatoSeleccionado?.application_code}
                  </span>
                </div>

                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-950">
                  <p className="font-bold">Instrucciones de la evaluación</p>
                  <p className="mt-1">
                    Responde cada pregunta para avanzar. No escribas tu nombre ni otros datos personales en las respuestas abiertas. Copiar o cortar el contenido de las preguntas y pegar texto en las respuestas está deshabilitado durante la prueba. Puedes volver a revisar tus respuestas; las preguntas escritas se calificarán manualmente al finalizar.
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

                <fieldset
                  className="mt-7 select-none"
                  onCopy={bloquearClipboard}
                  onCut={bloquearClipboard}
                  onContextMenu={bloquearClipboard}
                  onDragStart={bloquearClipboard}
                  onKeyDown={bloquearAtajosClipboard}
                >
                  <legend className="select-none text-base font-semibold leading-relaxed text-gray-900">
                    {preguntaActual.texto}
                  </legend>
                  {preguntaActual.tipo === 'opcion' ? (
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
                  ) : (
                    <div className="mt-5">
                      <label htmlFor={`respuesta-escrita-${indicePregunta}`} className="mb-2 block text-xs font-semibold text-gray-700">
                        Escribe tu respuesta
                      </label>
                      <textarea
                        id={`respuesta-escrita-${indicePregunta}`}
                        rows={5}
                        maxLength={2000}
                        required
                        value={respuestas[indicePregunta] ?? ''}
                        onChange={(event) => setRespuestas({ ...respuestas, [indicePregunta]: event.target.value })}
                        onPaste={bloquearClipboard}
                        placeholder="Desarrolla tu respuesta..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                      <p className="mt-1 text-right text-[10px] text-gray-500">
                        {(respuestas[indicePregunta] ?? '').length} / 2000 caracteres
                      </p>
                    </div>
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
                        disabled={!preguntaRespondida(indicePregunta)}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={finalizarEvaluacion}
                        disabled={contestadas < preguntas.length || enviando}
                        className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {enviando
                          ? 'Guardando resultado…'
                          : contestadas < preguntas.length
                            ? 'Completa todas las preguntas'
                            : 'Finalizar evaluación'}
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
                resultado.estado === 'Valla superada' ? 'bg-emerald-100 text-emerald-700' :
                  resultado.estado === 'Desaprobado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {resultado.estado === 'Valla superada' ? '✓' : resultado.estado === 'Desaprobado' ? '×' : '…'}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Resultado de evaluación</p>
              <h2 className={`mt-1 text-3xl font-extrabold ${
                resultado.estado === 'Valla superada' ? 'text-emerald-700' :
                  resultado.estado === 'Desaprobado' ? 'text-red-700' : 'text-amber-700'
              }`}>
                {resultado.estado === 'Pendiente de revisión' ? 'PENDIENTE DE REVISIÓN' :
                  resultado.estado === 'Valla superada' ? 'VALLA SUPERADA' : 'NO APTO'}
              </h2>
              <p className="mt-2 text-sm text-gray-700">{candidatoSeleccionado?.application_code} · {puesto}</p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Puntaje objetivo (opción múltiple)</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{resultado.puntaje} / 100</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Respuestas objetivas correctas</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{resultado.correctas} / {cantidadObjetivas}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Respuestas abiertas</p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">{cantidadEscritas} pendientes de revisión</p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-gray-500">
                {resultado.estado === 'Pendiente de revisión'
                  ? 'El puntaje perfecto objetivo queda registrado. La identidad seguirá protegida hasta que una persona evaluadora apruebe todas las respuestas de desarrollo.'
                  : 'El resultado se guardó. El postulante no alcanzó el puntaje máximo exigido y su identidad permanece protegida.'}
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
