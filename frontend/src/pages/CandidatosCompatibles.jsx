import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const palabrasPorCandidato = {
  'Postulante #001': ['auxiliar administrativo', 'asistente administrativo', 'logística', 'contrataciones'],
  'Postulante #002': ['inspector', 'tributario', 'fiscalización', 'fiscalizacion'],
  'Postulante #003': ['serenazgo', 'chofer', 'seguridad ciudadana'],
};

export default function CandidatosCompatibles() {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudFiltro, setSolicitudFiltro] = useState('');
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [compatibilidadMinima, setCompatibilidadMinima] = useState('0');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Datos ANÓNIMOS para Selección Ciega (Mock Data)
  const [candidatos] = useState([
    {
      codigo: 'Postulante #001',
      puestoActual: 'Auxiliar Administrativo',
      experiencia: '4 años en gestión pública',
      estudios: 'Técnico en Administración',
      match: 95,
      estado: 'Sugerido',
      puntosFuertes: ['Cumple con el 100% de la experiencia requerida', 'Título técnico registrado en MINEDU', 'Licencia de conducir B2 vigente'],
      observaciones: []
    },
    {
      codigo: 'Postulante #002',
      puestoActual: 'Inspector Operativo',
      experiencia: '3 años en fiscalización de campo',
      estudios: 'Egresado Técnico',
      match: 84,
      estado: 'En revisión',
      puntosFuertes: ['Experiencia previa en roles de fiscalización', 'Capacitación en normativa municipal'],
      observaciones: ['Requiere adjuntar actualización de Declaración Jurada']
    },
    {
      codigo: 'Postulante #003',
      puestoActual: 'Personal Operativo',
      experiencia: '2 años en servicios de campo',
      estudios: 'Secundaria Completa',
      match: 68,
      estado: 'Pendiente',
      puntosFuertes: ['Conocimiento operativo de la jurisdicción local'],
      observaciones: ['Falta 1 año de experiencia específica según perfil requerido']
    }
  ]);

  useEffect(() => {
    let active = true;
    apiRequest('/candidate-requests')
      .then(({ requests: availableRequests }) => {
        if (!active) return;
        const compatibles = availableRequests.filter((request) => !['rejected', 'completed'].includes(request.status));
        setSolicitudes(compatibles);
        setSolicitudFiltro(compatibles[0]?.id || '');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const solicitudSeleccionada = solicitudes.find((request) => request.id === solicitudFiltro);
  const candidatosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    const tituloPuesto = solicitudSeleccionada?.position_title?.toLocaleLowerCase('es') || '';
    return candidatos
      .filter((candidato) => (palabrasPorCandidato[candidato.codigo] || []).some((palabra) => tituloPuesto.includes(palabra)))
      .filter((candidato) => candidato.match >= Number(compatibilidadMinima))
      .filter((candidato) => estadoFiltro === 'Todos' || candidato.estado === estadoFiltro)
      .filter((candidato) => !texto || [
        candidato.codigo,
        candidato.puestoActual,
        candidato.experiencia,
        candidato.estudios,
        ...candidato.puntosFuertes,
        ...candidato.observaciones,
      ].some((value) => value.toLocaleLowerCase('es').includes(texto)))
      .sort((first, second) => second.match - first.match);
  }, [busqueda, candidatos, compatibilidadMinima, estadoFiltro, solicitudSeleccionada]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
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
                Filtros de búsqueda y compatibilidad sobre candidatos de demostración anonimizados.
              </p>
            </div>

            {/* Selector de Solicitud de Cobertura */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <label htmlFor="solicitud-compatible" className="font-semibold text-gray-700">Solicitud activa:</label>
              <select 
                id="solicitud-compatible"
                value={solicitudFiltro}
                onChange={(e) => setSolicitudFiltro(e.target.value)}
                className="w-full sm:w-auto border bg-white px-3 py-1.5 rounded-lg font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">{cargando ? 'Cargando solicitudes…' : 'Selecciona una solicitud'}</option>
                {solicitudes.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.code} | {request.position_title} ({request.priority === 'high' ? 'Prioridad alta' : request.priority === 'low' ? 'Prioridad baja' : 'Prioridad media'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          {/* Banner de Garantía Anti-Favoritismo */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-bold">Principio de Imparcialidad y Meritocracia</p>
                <p className="text-[11px] text-amber-700">Los datos personales (nombre, género, foto, edad) han sido ocultados automáticamente para evitar favoritismos durante la preselección.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa del Requerimiento */}
          <div className="bg-white border border-gray-200 border-l-4 border-l-blue-900 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-blue-50 text-blue-900 uppercase font-bold px-2 py-0.5 rounded">
                Requerimiento Activo
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                Puesto: {solicitudSeleccionada?.position_title || (cargando ? 'Cargando…' : 'Sin solicitud seleccionada')}
              </h3>
              {solicitudSeleccionada && <p className="text-xs text-gray-600">{solicitudSeleccionada.code} · {solicitudSeleccionada.department}</p>}
              <p className="text-xs text-gray-600">Criterios de evaluación: Competencias técnicas, años de experiencia y grado académico acreditado.</p>
            </div>
            <div className="shrink-0 rounded-lg bg-blue-50 px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-blue-900">{candidatosFiltrados.length}</p>
              <p className="text-[11px] text-gray-600">Candidatos filtrados</p>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
            <div>
              <label htmlFor="buscar-candidato" className="mb-1 block text-xs font-semibold text-gray-700">Buscar candidato</label>
              <input
                id="buscar-candidato"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Código, experiencia, estudios…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="compatibilidad-minima" className="mb-1 block text-xs font-semibold text-gray-700">Compatibilidad mínima</label>
              <select
                id="compatibilidad-minima"
                value={compatibilidadMinima}
                onChange={(event) => setCompatibilidadMinima(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"
              >
                <option value="0">Todos los puntajes</option>
                <option value="70">70% o más</option>
                <option value="80">80% o más</option>
                <option value="90">90% o más</option>
              </select>
            </div>
            <div>
              <label htmlFor="estado-candidato" className="mb-1 block text-xs font-semibold text-gray-700">Estado</label>
              <select
                id="estado-candidato"
                value={estadoFiltro}
                onChange={(event) => setEstadoFiltro(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"
              >
                <option>Todos</option>
                <option>Sugerido</option>
                <option>En revisión</option>
                <option>Pendiente</option>
              </select>
            </div>
          </section>

          {/* Lista de Postulantes Anónimos */}
          <div className="space-y-4">
            {candidatosFiltrados.map((cand) => (
              <div 
                key={cand.codigo}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
              >
                {/* Código de Selección Ciega */}
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                    👤 #
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm font-mono">{cand.codigo}</h4>
                    <p className="text-xs text-gray-500">{cand.puestoActual}</p>
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">Identidad Protegida</span>
                  </div>
                </div>

                {/* Experiencia y Estudios Acreditados */}
                <div className="text-xs space-y-1 lg:w-1/4">
                  <p><strong className="text-gray-700">Experiencia:</strong> {cand.experiencia}</p>
                  <p><strong className="text-gray-700">Nivel académico:</strong> {cand.estudios}</p>
                </div>

                {/* Porcentaje de Match / Compatibilidad */}
                <div className="w-full lg:w-1/4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700">Puntaje de Match:</span>
                    <span className={`font-bold ${cand.match >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {cand.match}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cand.match >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${cand.match}%` }}
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
                    onClick={() => navigate('/validacion-ocr')}
                    className="bg-blue-950 hover:bg-blue-900 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Validar OCR →
                  </button>
                </div>
              </div>
            ))}
            {!cargando && solicitudSeleccionada && candidatosFiltrados.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                No hay candidatos de demostración que coincidan con la solicitud y los filtros seleccionados.
              </p>
            )}
            {!cargando && solicitudes.length === 0 && !error && (
              <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                No hay solicitudes activas para evaluar candidatos.
              </p>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Detalle de Criterios (Sin datos personales) */}
      {candidatoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 font-mono">{candidatoSeleccionado.codigo}</h3>
                <p className="text-xs text-emerald-700 font-medium">Evaluación objetiva por competencias</p>
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
                <h5 className="font-bold text-gray-700 mb-1">Criterios de Compatibilidad Validados:</h5>
                <ul className="list-disc list-inside text-emerald-700 space-y-1">
                  {candidatoSeleccionado.puntosFuertes.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>

              {candidatoSeleccionado.observaciones.length > 0 && (
                <div>
                  <h5 className="font-bold text-amber-700 mb-1">Observaciones Técnicas:</h5>
                  <ul className="list-disc list-inside text-amber-600 space-y-1">
                    {candidatoSeleccionado.observaciones.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
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
    </div>
  );
}