import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const etiquetasEvento = {
  'coverage_request.created': 'Creación de solicitud de cobertura',
  'coverage_request.updated': 'Edición de solicitud de cobertura',
  'coverage_request.status_changed': 'Cambio de estado de solicitud',
  'coverage_request.deleted': 'Eliminación de solicitud de cobertura',
  'worker.created': 'Registro de trabajador',
  'worker.updated': 'Actualización de trabajador',
  'worker.deactivated': 'Desactivación de trabajador',
  'position_profile.created': 'Creación de perfil de puesto',
  'position_profile.updated': 'Actualización de perfil de puesto',
  'position_profile.deleted': 'Desactivación de perfil de puesto',
  'documents.created': 'Registro de documento',
  'documents.updated': 'Actualización de documento',
  'documents.deleted': 'Eliminación de documento',
  'document.file_uploaded': 'Carga de archivo para OCR',
  'evaluations.created': 'Registro de evaluación',
  'evaluations.updated': 'Actualización de evaluación',
  'evaluations.deleted': 'Eliminación de evaluación',
  'assignment.created': 'Creación de asignación',
  'assignment.updated': 'Actualización de asignación',
  'assignment.deleted': 'Eliminación de asignación',
  'user.created': 'Creación de usuario',
  'user.updated': 'Actualización de usuario',
  'user.deactivated': 'Desactivación de usuario',
  'blind_candidate.created': 'Registro de postulante ciego',
  'blind_candidate.exam_submitted': 'Envío de examen de postulante',
  'blind_candidate.exam_reviewed': 'Revisión de respuestas de desarrollo',
  'blind_candidate.identity_revealed': 'Revelación de identidad tras superar la valla',
};

const etiquetasRecurso = {
  coverage_request: 'Solicitudes',
  worker: 'Trabajadores',
  position_profile: 'Perfiles de puesto',
  documents: 'Documentos',
  evaluations: 'Evaluaciones',
  assignment: 'Asignaciones',
  user: 'Usuarios',
  blind_candidate: 'Selección ciega',
};

export default function Auditoria() {
  const [busqueda, setBusqueda] = useState('');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/audit')
      .then(({ events }) => setRegistros(events))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const registrosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');

    if (!termino) return registros;

    return registros.filter((registro) => {
      const campos = [
        registro.id,
        registro.username,
        registro.display_name,
        etiquetasEvento[registro.event_type] ?? registro.event_type,
        etiquetasRecurso[registro.resource_type] ?? registro.resource_type,
        JSON.stringify(registro.metadata ?? {}),
      ];
      return campos.some((valor) => String(valor ?? '').toLocaleLowerCase('es').includes(termino));
    });
  }, [busqueda, registros]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-full">
              Auditoría
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Registro de auditoría</h2>
            <p className="mt-1 text-sm text-gray-600">Consulta de actividad registrada en el sistema.</p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              No se pudieron cargar los eventos de auditoría: {error}
            </div>
          )}

          <section aria-label="Registros de auditoría" className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
              <label className="w-full sm:max-w-sm">
                <span className="sr-only">Buscar registros</span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar por usuario, acción o módulo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm border-collapse">
              <caption className="sr-only">Eventos de auditoría registrados en el sistema</caption>
              <thead>
                <tr className="text-gray-400 border-b pb-2">
                  <th scope="col" className="pb-3 pr-4 font-medium">ID de evento</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Usuario</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Acción</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Módulo</th>
                  <th scope="col" className="pb-3 font-medium">Fecha y hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrosFiltrados.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-semibold text-blue-950">LOG-{String(r.id).padStart(5, '0')}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{r.display_name || r.username || 'Usuario no disponible'}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {etiquetasEvento[r.event_type] ?? r.event_type}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {etiquetasRecurso[r.resource_type] ?? r.resource_type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {new Date(r.created_at).toLocaleString('es-PE')}
                    </td>
                  </tr>
                ))}
                {!cargando && registrosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      {error
                        ? 'No se pudo obtener la actividad de auditoría.'
                        : busqueda
                          ? 'No se encontraron registros que coincidan con la búsqueda.'
                          : 'Aún no hay eventos de auditoría registrados.'}
                    </td>
                  </tr>
                )}
                {cargando && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Cargando actividad…</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            <p className="text-sm text-gray-500" aria-live="polite">
              {registrosFiltrados.length} {registrosFiltrados.length === 1 ? 'registro' : 'registros'}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}