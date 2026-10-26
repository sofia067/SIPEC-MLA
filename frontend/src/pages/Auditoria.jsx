import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const PAGE_SIZE_OPTIONS = [10, 25];

const actionLabels = {
  'assignment.created': 'Creación de asignación',
  'assignment.deleted': 'Eliminación de asignación',
  'assignment.updated': 'Actualización de asignación',
  'auth.login': 'Inicio de sesión',
  'coverage_request.created': 'Creación de solicitud de cobertura',
  'coverage_request.status_changed': 'Cambio de estado de solicitud',
  'department.created': 'Creación de área',
  'department.deleted': 'Eliminación de área',
  'department.updated': 'Actualización de área',
  'document.file_uploaded': 'Carga de documento',
  'position_profile.created': 'Creación de perfil de puesto',
  'position_profile.deleted': 'Eliminación de perfil de puesto',
  'position_profile.updated': 'Actualización de perfil de puesto',
  'system_settings.updated': 'Actualización de configuración',
  'user.created': 'Creación de usuario',
  'user.deactivated': 'Desactivación de usuario',
  'user.updated': 'Actualización de usuario',
  'worker.created': 'Creación de trabajador',
  'worker.deactivated': 'Desactivación de trabajador',
  'worker.updated': 'Actualización de trabajador',
};

const resourceLabels = {
  applicant_file: 'Expediente CAS',
  assignment: 'Asignaciones',
  coverage_request: 'Solicitudes de cobertura',
  department: 'Áreas orgánicas',
  documents: 'Documentos',
  position_profile: 'Perfiles de puesto',
  session: 'Sesiones',
  system_settings: 'Configuración del sistema',
  user: 'Usuarios',
  worker: 'Trabajadores',
};

const humanizeCode = (value) => String(value ?? '')
  .replace(/[._-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('es'));

const getActionLabel = (value) => actionLabels[value] || humanizeCode(value) || 'Sin acción';
const getResourceLabel = (value) => resourceLabels[value] || humanizeCode(value) || 'Sin módulo';

const getMetadata = (metadata) => {
  if (metadata && typeof metadata === 'object') return metadata;
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' ? parsed : { detalle: parsed };
    } catch {
      return { detalle: metadata };
    }
  }
  return {};
};

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-PE');
};

const getLocalDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Auditoria() {
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [modulo, setModulo] = useState('');
  const [accion, setAccion] = useState('');
  const [registros, setRegistros] = useState([]);
  const [registroExpandido, setRegistroExpandido] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest('/audit')
      .then(({ events }) => {
        if (active) setRegistros(events);
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

  const modulos = useMemo(
    () => [...new Set(registros.map((registro) => registro.resource_type).filter(Boolean))].sort(),
    [registros],
  );
  const acciones = useMemo(
    () => [...new Set(registros.map((registro) => registro.event_type).filter(Boolean))].sort(),
    [registros],
  );

  const registrosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');

    return registros.filter((registro) => {
      const fecha = getLocalDate(registro.created_at);
      const coincideBusqueda = !termino || [
        registro.id,
        registro.username,
        registro.display_name,
        getActionLabel(registro.event_type),
        registro.event_type,
        getResourceLabel(registro.resource_type),
        registro.resource_type,
        JSON.stringify(registro.metadata ?? {}),
        registro.created_at,
      ].some((valor) => String(valor ?? '').toLocaleLowerCase('es').includes(termino));

      return coincideBusqueda
        && (!fechaDesde || fecha >= fechaDesde)
        && (!fechaHasta || fecha <= fechaHasta)
        && (!modulo || registro.resource_type === modulo)
        && (!accion || registro.event_type === accion);
    });
  }, [accion, busqueda, fechaDesde, fechaHasta, modulo, registros]);

  const totalPaginas = Math.ceil(registrosFiltrados.length / tamanoPagina);
  const registrosPagina = registrosFiltrados.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina);
  const indiceInicial = registrosFiltrados.length ? (pagina - 1) * tamanoPagina + 1 : 0;
  const indiceFinal = Math.min(pagina * tamanoPagina, registrosFiltrados.length);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
    setModulo('');
    setAccion('');
    setPagina(1);
  };

  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-gray-600';
  const inputClass = 'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800';

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

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <section aria-label="Registros de auditoría" className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                  Buscar
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }}
                    placeholder="Usuario, acción, módulo o detalle"
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Desde
                  <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(evento) => { setFechaDesde(evento.target.value); setPagina(1); }} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Hasta
                  <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(evento) => { setFechaHasta(evento.target.value); setPagina(1); }} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Módulo
                  <select value={modulo} onChange={(evento) => { setModulo(evento.target.value); setPagina(1); }} className={inputClass}>
                    <option value="">Todos los módulos</option>
                    {modulos.map((value) => <option key={value} value={value}>{getResourceLabel(value)}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  Acción
                  <select value={accion} onChange={(evento) => { setAccion(evento.target.value); setPagina(1); }} className={inputClass}>
                    <option value="">Todas las acciones</option>
                    {acciones.map((value) => <option key={value} value={value}>{getActionLabel(value)}</option>)}
                  </select>
                </label>
                <div className="flex items-end">
                  <button type="button" onClick={limpiarFiltros} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm border-collapse">
                <caption className="sr-only">Eventos registrados en el sistema</caption>
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th scope="col" className="pb-3 pr-4 font-medium">ID de evento</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Usuario</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Acción</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Módulo</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Fecha y hora</th>
                    <th scope="col" className="pb-3 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosPagina.map((registro) => {
                    const metadata = getMetadata(registro.metadata);
                    const expandido = registroExpandido === registro.id;
                    return (
                      <React.Fragment key={registro.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4 font-mono font-semibold text-blue-950">{registro.id}</td>
                          <td className="py-3 pr-4 font-medium text-gray-900">{registro.display_name || registro.username || 'Sistema'}</td>
                          <td className="py-3 pr-4 text-gray-700">{getActionLabel(registro.event_type)}</td>
                          <td className="py-3 pr-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              {getResourceLabel(registro.resource_type)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{formatDateTime(registro.created_at)}</td>
                          <td className="py-3">
                            <button
                              type="button"
                              aria-expanded={expandido}
                              aria-controls={`audit-detail-${registro.id}`}
                              onClick={() => setRegistroExpandido(expandido ? null : registro.id)}
                              className="font-semibold text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
                            >
                              {expandido ? 'Ocultar detalle' : 'Ver detalle'}
                            </button>
                          </td>
                        </tr>
                        {expandido && (
                          <tr id={`audit-detail-${registro.id}`} className="bg-slate-50">
                            <td colSpan="6" className="px-4 py-4">
                              {Object.keys(metadata).length
                                ? (
                                  <dl className="grid gap-3 sm:grid-cols-2">
                                    {Object.entries(metadata).map(([key, value]) => (
                                      <div key={key} className="min-w-0">
                                        <dt className="text-xs font-semibold text-gray-600">{humanizeCode(key)}</dt>
                                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">
                                          {typeof value === 'object' && value !== null
                                            ? <pre className="overflow-x-auto rounded bg-white p-2 text-xs">{JSON.stringify(value, null, 2)}</pre>
                                            : String(value ?? '—')}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                )
                                : <p className="text-sm text-gray-600">Este evento no contiene metadata adicional.</p>}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!cargando && !error && registrosFiltrados.length === 0 && (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-500">No se encontraron registros con esos filtros.</td></tr>
                  )}
                  {cargando && <tr><td colSpan="6" className="py-8 text-center text-gray-500">Cargando auditoría…</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite">
                {registrosFiltrados.length
                  ? `Mostrando ${indiceInicial}–${indiceFinal} de ${registrosFiltrados.length} registros`
                  : '0 registros'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  Filas por página
                  <select
                    value={tamanoPagina}
                    onChange={(evento) => { setTamanoPagina(Number(evento.target.value)); setPagina(1); }}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={pagina <= 1 || cargando}
                  onClick={() => { setPagina((current) => current - 1); setRegistroExpandido(null); }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span aria-live="polite">Página {totalPaginas ? pagina : 0} de {totalPaginas}</span>
                <button
                  type="button"
                  disabled={!totalPaginas || pagina >= totalPaginas || cargando}
                  onClick={() => { setPagina((current) => current + 1); setRegistroExpandido(null); }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
