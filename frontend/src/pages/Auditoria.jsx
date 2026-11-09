import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const etiquetasEvento = {
  'auth.login': 'Inicio de sesión',
  'auth.logout': 'Cierre de sesión',
  'application_settings.updated': 'Actualización de configuración del sistema',
  'coverage_request.created': 'Creación de convocatoria de personal',
  'coverage_request.updated': 'Edición de convocatoria de personal',
  'coverage_request.status_changed': 'Cambio de estado de convocatoria',
  'coverage_request.deleted': 'Eliminación de convocatoria de personal',
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
  session: 'Acceso',
  application_settings: 'Configuración',
  coverage_request: 'Solicitudes',
  worker: 'Trabajadores',
  position_profile: 'Perfiles de puesto',
  documents: 'Documentos',
  evaluations: 'Evaluaciones',
  assignment: 'Asignaciones',
  user: 'Usuarios',
  blind_candidate: 'Selección ciega',
  application_settings: 'Configuración',
};

const obtenerAccion = (tipo) => {
  if (tipo.startsWith('auth.')) return 'login';
  if (tipo.endsWith('.created')) return 'creation';
  if (tipo.endsWith('.deleted') || tipo.endsWith('.deactivated')) return 'deletion';
  return 'modification';
};

const obtenerCriticidad = (tipo) => (
  tipo.endsWith('.deleted') || tipo.endsWith('.deactivated') || tipo.startsWith('auth.')
    ? 'Alta'
    : tipo.endsWith('.updated') || tipo.endsWith('.status_changed')
      ? 'Media'
      : 'Baja'
);

const formatoCsv = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

function descargarCsv(rows) {
  const headers = ['Fecha y hora', 'Usuario', 'Dirección IP', 'Módulo', 'Acción', 'Criticidad', 'ID'];
  const content = [
    headers,
    ...rows.map((event) => [
      new Date(event.created_at).toLocaleString('es-PE'),
      event.display_name || event.username || 'Usuario no disponible',
      event.ip_address || 'No registrada',
      etiquetasRecurso[event.resource_type] ?? event.resource_type,
      etiquetasEvento[event.event_type] ?? event.event_type,
      obtenerCriticidad(event.event_type),
      event.id,
    ]),
  ].map((row) => row.map(formatoCsv).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sipec-auditoria.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [usuario, setUsuario] = useState('');
  const [accion, setAccion] = useState('');
  const [criticidad, setCriticidad] = useState('');

  useEffect(() => {
    apiRequest('/audit')
      .then(({ events }) => setRegistros(events))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const usuarios = useMemo(() => [...new Map(
    registros.filter((event) => event.username)
      .map((event) => [event.username, event.display_name || event.username]),
  )].sort((a, b) => a[1].localeCompare(b[1], 'es')), [registros]);

  const filtrados = useMemo(() => registros.filter((event) => {
    const fecha = String(event.created_at).slice(0, 10);
    return (!desde || fecha >= desde)
      && (!hasta || fecha <= hasta)
      && (!usuario || event.username === usuario)
      && (!accion || obtenerAccion(event.event_type) === accion)
      && (!criticidad || obtenerCriticidad(event.event_type) === criticidad);
  }), [registros, desde, hasta, usuario, accion, criticidad]);

  return (
    <div className="app-shell print:h-auto flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />
      <div className="print:overflow-visible min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="print:hidden bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-full">Auditoría</span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Registro de auditoría</h2>
              <p className="mt-1 text-sm text-gray-600">Trazabilidad de accesos y movimientos registrados en el sistema.</p>
            </div>
            <div className="print:hidden flex gap-2">
              <button type="button" onClick={() => descargarCsv(filtrados)} disabled={cargando || Boolean(error)} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400">Descargar CSV</button>
              <button type="button" onClick={() => window.print()} disabled={cargando || Boolean(error)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-400">Exportar PDF</button>
            </div>
          </div>

          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">No se pudieron cargar los eventos de auditoría: {error}</div>}

          <section aria-label="Filtros de auditoría" className="print:hidden grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm font-medium text-gray-700">Desde<input type="date" value={desde} max={hasta || undefined} onChange={(event) => setDesde(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
            <label className="text-sm font-medium text-gray-700">Hasta<input type="date" value={hasta} min={desde || undefined} onChange={(event) => setHasta(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
            <label className="text-sm font-medium text-gray-700">Usuario<select value={usuario} onChange={(event) => setUsuario(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="">Todos los usuarios</option>{usuarios.map(([username, nombre]) => <option key={username} value={username}>{nombre}</option>)}</select></label>
            <label className="text-sm font-medium text-gray-700">Tipo de acción<select value={accion} onChange={(event) => setAccion(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="">Todas las acciones</option><option value="creation">Creación</option><option value="modification">Modificación</option><option value="deletion">Eliminación</option><option value="login">Login / cierre de sesión</option></select></label>
            <label className="text-sm font-medium text-gray-700">Criticidad<select value={criticidad} onChange={(event) => setCriticidad(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="">Todos los niveles</option><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select></label>
          </section>

          <section aria-label="Registros de auditoría" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-gray-900">Actividad registrada</h3>
              <span className="text-sm text-gray-500" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <caption className="sr-only">Eventos de auditoría registrados en el sistema</caption>
                <thead className="bg-gray-50 text-gray-500"><tr>
                  <th scope="col" className="px-4 py-3">Fecha y hora</th><th scope="col" className="px-4 py-3">Usuario responsable</th>
                  <th scope="col" className="px-4 py-3">Dirección IP</th><th scope="col" className="px-4 py-3">Módulo</th>
                  <th scope="col" className="px-4 py-3">Acción realizada</th><th scope="col" className="px-4 py-3">Criticidad</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(event.created_at).toLocaleString('es-PE')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{event.display_name || event.username || 'Usuario no disponible'}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{event.ip_address || 'No registrada'}</td>
                      <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{etiquetasRecurso[event.resource_type] ?? event.resource_type}</span></td>
                      <td className="px-4 py-3 text-gray-700">{etiquetasEvento[event.event_type] ?? event.event_type}</td>
                      <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${obtenerCriticidad(event.event_type) === 'Alta' ? 'bg-red-100 text-red-800' : obtenerCriticidad(event.event_type) === 'Media' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{obtenerCriticidad(event.event_type)}</span></td>
                    </tr>
                  ))}
                  {!cargando && filtrados.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">{error ? 'No se pudo obtener la actividad de auditoría.' : 'No hay registros para los filtros seleccionados.'}</td></tr>}
                  {cargando && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Cargando actividad…</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
