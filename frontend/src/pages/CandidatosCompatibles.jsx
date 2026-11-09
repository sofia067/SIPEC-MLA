import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const etapasProceso = {
  application_received: 'Postulación recibida',
  document_review: 'Revisión de documentos',
  exam: 'Examen',
  interview: 'Entrevista personal',
  practical: 'Práctica básica',
  final_result: 'Resultado final',
};

const estadoMatch = {
  calculated: 'Calculado',
  pending: 'Pendiente de cálculo',
  insufficient_data: 'Datos insuficientes',
  extraction_failed: 'No se pudo leer el CV',
};

const fechaRevisionCv = (date) => date
  ? new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(date))
  : '';

export default function CandidatosCompatibles() {
  const navigate = useNavigate();
  const [solicitudFiltro, setSolicitudFiltro] = useState('');
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [cvSeleccionado, setCvSeleccionado] = useState(null);
  const [revisionCv, setRevisionCv] = useState(null);
  const [cargandoRevisionCv, setCargandoRevisionCv] = useState(false);
  const [errorRevisionCv, setErrorRevisionCv] = useState('');
  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const solicitudes = [...new Map(candidatos.map((candidato) => [
    candidato.request_id,
    {
      id: candidato.request_id,
      codigo: candidato.request_code,
      puesto: candidato.position_title,
      prioridad: candidato.priority,
      departamento: candidato.department,
      descripcion: candidato.reason,
    },
  ])).values()];
  const solicitudActiva = solicitudes.find((solicitud) => solicitud.id === solicitudFiltro);
  const candidatosFiltrados = candidatos.filter((candidato) => candidato.request_id === solicitudFiltro);

  async function revisarCv(candidato) {
    setCvSeleccionado(candidato);
    setRevisionCv(null);
    setErrorRevisionCv('');
    setCargandoRevisionCv(true);
    try {
      const { review } = await apiRequest(`/blind-selection/candidates/${candidato.id}/resume-review`);
      setRevisionCv(review);
    } catch (requestError) {
      setErrorRevisionCv(requestError.message);
    } finally {
      setCargandoRevisionCv(false);
    }
  }

  useEffect(() => {
    apiRequest('/blind-selection/candidates')
      .then(({ candidates: currentCandidates }) => {
        setCandidatos(currentCandidates);
        setSolicitudFiltro(currentCandidates[0]?.request_id ?? '');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="app-shell flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />

      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-4 sm:px-8 py-3 flex justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              🔒 Selección Ciega Activa
            </span>
          </div>
          <UserDropdown />
        </header>

        {/* Contenido Principal */}
        <main className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Candidatos Compatibles</h2>
              </div>
              <p className="text-xs text-gray-500">
                Compatibilidad estimada entre el CV y los requisitos del puesto. Los resultados son referenciales y no reemplazan la revisión de RR. HH.
              </p>
            </div>

            {/* Selector de Solicitud de Cobertura */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <label className="font-semibold text-gray-700">Convocatoria:</label>
              <select
                value={solicitudFiltro}
                onChange={(e) => {
                  setSolicitudFiltro(e.target.value);
                  setCandidatoSeleccionado(null);
                }}
                className="w-full sm:w-auto border bg-white px-3 py-1.5 rounded-lg font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {solicitudes.map((solicitud) => (
                  <option key={solicitud.id} value={solicitud.id}>
                    {solicitud.codigo} | {solicitud.puesto} ({solicitud.prioridad})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Banner de Garantía Anti-Favoritismo */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-bold">Principio de Imparcialidad y Meritocracia</p>
                <p className="text-[11px] text-amber-700">Se muestran códigos anónimos. El porcentaje es una coincidencia de términos y debe verificarse junto con el CV.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa del Requerimiento */}
          <div className="bg-white border border-gray-200 border-l-4 border-l-blue-900 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-blue-50 text-blue-900 uppercase font-bold px-2 py-0.5 rounded">
                Convocatoria · {solicitudActiva?.codigo ?? '—'}
              </span>
              <h3 className="text-lg font-bold text-gray-900">Puesto: {solicitudActiva?.puesto ?? 'Sin postulantes registrados'}</h3>
              {solicitudActiva?.departamento && <p className="text-sm text-gray-700">Área: {solicitudActiva.departamento}</p>}
              {solicitudActiva?.descripcion && <p className="text-sm text-gray-700">{solicitudActiva.descripcion}</p>}
              <p className="text-xs text-gray-600"><strong>Criterios:</strong> Comparación referencial de términos del CV con los requisitos configurados en el perfil del puesto.</p>
            </div>
            <div className="shrink-0 rounded-lg bg-blue-50 px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-blue-900">{candidatosFiltrados.length}</p>
              <p className="text-[11px] text-gray-600">Postulaciones</p>
            </div>
          </div>

          {error && <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {/* Lista de Postulantes Anónimos */}
          <div className="space-y-4">
            {cargando ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Cargando postulaciones…</div>
            ) : candidatosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                {solicitudes.length
                  ? 'Aún no hay postulaciones para esta solicitud.'
                  : 'Aún no hay postulaciones recibidas desde el portal.'}
              </div>
            ) : candidatosFiltrados.map((cand) => (
              <div
                key={cand.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
              >
                {/* Código de Selección Ciega */}
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                    👤 #
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm font-mono">{cand.application_code}</h4>
                    <p className="text-xs text-gray-500">{cand.position_title}</p>
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">Identidad Protegida</span>
                    {cand.has_resume && (
                      <p className={`mt-1 text-[10px] font-semibold ${cand.resume_reviewed_at ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {cand.resume_reviewed_at
                          ? `CV revisado · ${fechaRevisionCv(cand.resume_reviewed_at)}${cand.resume_reviewed_by_name ? ` por ${cand.resume_reviewed_by_name}` : ''}`
                          : 'CV pendiente de revisión'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Estado de la postulación */}
                <div className="text-xs space-y-1 lg:w-1/4">
                  <p><strong className="text-gray-700">Etapa:</strong> {etapasProceso[cand.process_stage] ?? cand.process_stage}</p>
                  <p><strong className="text-gray-700">Compatibilidad:</strong> {estadoMatch[cand.match_status] ?? 'Sin información'}</p>
                </div>

                {/* Porcentaje de Match / Compatibilidad */}
                <div className="w-full lg:w-1/4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700">Puntaje de Match:</span>
                    <span className={`font-bold ${Number(cand.match_score) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {cand.match_score === null ? '—' : `${cand.match_score}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${Number(cand.match_score) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Number(cand.match_score) || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    onClick={() => setCandidatoSeleccionado(cand)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Ver Criterios
                  </button>
                  <button
                    onClick={() => revisarCv(cand)}
                    disabled={!cand.has_resume}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs px-3 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Revisar CV ciego
                  </button>
                  <button
                    onClick={() => navigate(`/validacion-ocr?candidateId=${encodeURIComponent(cand.id)}`)}
                    disabled={!cand.has_resume}
                    className="bg-blue-950 hover:bg-blue-900 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Revisar CV en OCR →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal de Detalle de Criterios (Sin datos personales) */}
      {candidatoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 font-mono">{candidatoSeleccionado.application_code}</h3>
                <p className="text-xs text-emerald-700 font-medium">Detalle referencial del match por términos</p>
              </div>
              <button
                onClick={() => setCandidatoSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                {candidatoSeleccionado.match_status === 'calculated' ? (
                  <>
                    <h5 className="font-bold text-gray-700 mb-1">Criterios comparados:</h5>
                    <ul className="space-y-2">
                      {(candidatoSeleccionado.match_breakdown ?? []).map((criterion) => (
                        <li key={criterion.key} className="rounded bg-gray-50 p-2">
                          <p className="font-semibold text-gray-800">{criterion.label}: {criterion.score}%</p>
                          <p className="text-gray-600">
                          Términos coincidentes: {criterion.matchedTerms?.length ?? 0} de {criterion.requiredTermCount}
                          </p>
                          {criterion.matchedTerms?.length > 0 && (
                            <p className="mt-1 text-emerald-700">{criterion.matchedTerms.join(', ')}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-amber-700">{estadoMatch[candidatoSeleccionado.match_status] ?? 'No se pudo calcular el match para este CV.'}</p>
                )}
                <p className="mt-3 text-gray-500">El resultado es una coincidencia literal orientativa; no acredita requisitos ni sustituye la revisión del CV.</p>
                </div>
            </div>

            <div className="pt-3 border-t">
              <button
                onClick={() => {
                  setCandidatoSeleccionado(null);
                  navigate('/validacion-ocr');
                }}
                className="w-full bg-blue-950 text-white py-2 rounded-lg font-bold text-xs hover:bg-blue-900"
              >
                Continuar a Validación Documental (OCR)
              </button>
            </div>
          </div>
        </div>
      )}

      {cvSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-review-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h3 id="resume-review-title" className="font-mono text-lg font-bold text-gray-900">
                  CV · {cvSeleccionado.application_code}
                </h3>
                <p className="text-xs text-gray-600">Texto extraído con ocultamiento inicial de identificadores</p>
              </div>
              <button
                type="button"
                onClick={() => setCvSeleccionado(null)}
                aria-label="Cerrar revisión del CV"
                className="text-lg font-bold text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </header>

            <div className="overflow-y-auto p-5">
              <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                {revisionCv?.warning ?? 'No se muestra el PDF original. El texto puede contener datos personales que el sistema no detecta; verifica manualmente que no identifique al postulante.'}
              </div>
              {cargandoRevisionCv ? (
                <p className="py-8 text-center text-sm text-gray-600">Extrayendo y preparando el texto del CV…</p>
              ) : errorRevisionCv ? (
                <p role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{errorRevisionCv}</p>
              ) : revisionCv && (
                <>
                  {revisionCv.identityMismatch && (
                    <p role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                      No se pudo confirmar la identidad del CV. Por privacidad, se ocultó todo el texto.
                    </p>
                  )}
                  <div className={`mb-4 rounded-lg p-3 text-xs ${
                    revisionCv.quality.quality === 'readable'
                      ? 'bg-emerald-50 text-emerald-900'
                      : revisionCv.quality.quality === 'review'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-red-50 text-red-900'
                  }`}>
                    <p className="font-bold">
                      Calidad de lectura: {
                        revisionCv.quality.quality === 'readable'
                          ? 'Texto suficiente; requiere verificación'
                          : revisionCv.quality.quality === 'review'
                            ? 'Revisión manual recomendada'
                            : 'Texto insuficiente'
                      }
                    </p>
                    <p className="mt-1">
                      {revisionCv.quality.wordCount} palabras · {revisionCv.quality.characterCount} caracteres
                      {revisionCv.quality.suspiciousCharacterCount > 0 &&
                        ` · ${revisionCv.quality.suspiciousCharacterCount} caracteres sospechosos`}
                    </p>
                  </div>
                  <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-800">
                    {revisionCv.identityMismatch
                      ? 'Texto oculto por privacidad.'
                      : revisionCv.text || 'No se pudo extraer texto del CV.'}
                  </pre>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
