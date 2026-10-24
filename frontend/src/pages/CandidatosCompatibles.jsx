import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function CandidatosCompatibles() {
  const navigate = useNavigate();

  const solicitudes = [
    {
      codigo: 'SC-001',
      puesto: 'Técnico de Fiscalización y Coactiva',
      prioridad: 'Prioridad Alta',
      descripcion: 'Apoyar las acciones de fiscalización municipal y el seguimiento de procedimientos de ejecución coactiva.',
      criterios: 'Competencias técnicas, años de experiencia y grado académico acreditado.',
    },
    {
      codigo: 'SC-002',
      puesto: 'Subgerente de Infraestructura',
      prioridad: 'Prioridad Media',
      descripcion: 'Coordinar la planificación, ejecución y supervisión de proyectos de infraestructura municipal.',
      criterios: 'Formación en ingeniería o arquitectura, experiencia en obras públicas y gestión de proyectos.',
    },
    {
      codigo: 'SC-003',
      puesto: 'Inspector de Servicios Municipales',
      prioridad: 'Prioridad Media',
      descripcion: 'Realizar inspecciones de campo y verificar el cumplimiento de las normas y servicios municipales.',
      criterios: 'Experiencia en inspección de campo, conocimiento normativo y comunicación efectiva.',
    },
  ];

  const [solicitudFiltro, setSolicitudFiltro] = useState('SC-001');
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const solicitudActiva = solicitudes.find((solicitud) => solicitud.codigo === solicitudFiltro);

  // Datos de demostración: no representan postulaciones reales.
  const [candidatos] = useState([
    {
      codigo: 'Postulante #001',
      solicitud: 'SC-001',
      puestoActual: 'Inspector Operativo',
      experiencia: '4 años en gestión pública',
      estudios: 'Técnico en Administración Pública',
      match: 95,
      estado: 'Sugerido',
      puntosFuertes: ['Experiencia en fiscalización municipal', 'Formación técnica relacionada', 'Conocimiento de procedimientos administrativos'],
      observaciones: []
    },
    {
      codigo: 'Postulante #002',
      solicitud: 'SC-001',
      puestoActual: 'Asistente de Fiscalización',
      experiencia: '3 años en fiscalización de campo',
      estudios: 'Egresado Técnico',
      match: 84,
      estado: 'En revisión',
      puntosFuertes: ['Experiencia previa en roles de fiscalización', 'Capacitación en normativa municipal'],
      observaciones: ['Requiere adjuntar actualización de Declaración Jurada']
    },
    {
      codigo: 'Postulante #003',
      solicitud: 'SC-003',
      puestoActual: 'Personal Operativo Municipal',
      experiencia: '2 años en servicios de campo',
      estudios: 'Secundaria Completa',
      match: 68,
      estado: 'Pendiente',
      puntosFuertes: ['Conocimiento operativo de la jurisdicción local'],
      observaciones: ['Falta 1 año de experiencia específica según perfil requerido']
    },
    {
      codigo: 'Postulante #004',
      solicitud: 'SC-002',
      puestoActual: 'Asistente de Obras',
      experiencia: '5 años en supervisión de obras',
      estudios: 'Bachiller en Ingeniería Civil',
      match: 88,
      estado: 'En revisión',
      puntosFuertes: ['Experiencia en obras públicas', 'Formación relacionada al puesto'],
      observaciones: ['Pendiente verificar certificados de especialización']
    }
  ]);
  const candidatosFiltrados = candidatos.filter((candidato) => candidato.solicitud === solicitudFiltro);

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
                Ranking de evaluación automatizada con datos anonimizados para prevenir sesgos de selección.
              </p>
            </div>

            {/* Selector de Solicitud de Cobertura */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <label className="font-semibold text-gray-700">Solicitud activa:</label>
              <select
                value={solicitudFiltro}
                onChange={(e) => {
                  setSolicitudFiltro(e.target.value);
                  setCandidatoSeleccionado(null);
                }}
                className="w-full sm:w-auto border bg-white px-3 py-1.5 rounded-lg font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {solicitudes.map((solicitud) => (
                  <option key={solicitud.codigo} value={solicitud.codigo}>
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
                <p className="text-[11px] text-amber-700">Esta demostración usa postulantes y resultados ficticios; no muestra datos personales reales.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa del Requerimiento */}
          <div className="bg-white border border-gray-200 border-l-4 border-l-blue-900 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-blue-50 text-blue-900 uppercase font-bold px-2 py-0.5 rounded">
                Requerimiento Activo · {solicitudActiva.codigo}
              </span>
              <h3 className="text-lg font-bold text-gray-900">Puesto: {solicitudActiva.puesto}</h3>
              <p className="text-sm text-gray-700">{solicitudActiva.descripcion}</p>
              <p className="text-xs text-gray-600"><strong>Criterios de evaluación:</strong> {solicitudActiva.criterios}</p>
            </div>
            <div className="shrink-0 rounded-lg bg-blue-50 px-4 py-2 text-center">
              <p className="text-2xl font-extrabold text-blue-900">{candidatosFiltrados.length}</p>
              <p className="text-[11px] text-gray-600">Postulantes de prueba</p>
            </div>
          </div>

          {/* Lista de Postulantes Anónimos */}
          <div className="space-y-4">
            {candidatosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                No hay postulantes de prueba para esta solicitud.
              </div>
            ) : candidatosFiltrados.map((cand) => (
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
