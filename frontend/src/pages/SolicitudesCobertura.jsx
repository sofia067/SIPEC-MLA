import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import Sidebar from '../components/sidebar';

const TIPOS_DOCUMENTO_POSTULACION = [
  { type: 'professional_title', label: 'Título profesional' },
  { type: 'experience_certificate', label: 'Certificado de experiencia laboral' },
  { type: 'training_certificate', label: 'Certificado de capacitación' },
  { type: 'other_certificate', label: 'Otro certificado solicitado' },
];

export default function SolicitudesCobertura() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const esJefeArea = user?.role === 'area_manager';
  const areaPredeterminada = user?.areaName || (esJefeArea ? 'Subgerencia de Logística y Control Patrimonial' : '');
  const [mostrarFormulario, setMostrarFormulario] = useState(location.pathname === '/nueva-solicitud');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [solicitudEnEdicion, setSolicitudEnEdicion] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoExtension, setGuardandoExtension] = useState(false);
  const [mostrarExtension, setMostrarExtension] = useState(false);
  const [fechaExtension, setFechaExtension] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [eliminando, setEliminando] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState({
    department: areaPredeterminada,
    positionTitle: '',
    reason: '',
    priority: 'Media',
    requiredBy: '',
    applicationDeadline: '',
    applicationDocuments: [],
  });

  const cargarSolicitudes = async () => {
    setCargando(true);
    setError('');
    try {
      const { requests } = await apiRequest('/requests');
      setSolicitudes(requests.map((request) => ({
        ...request,
        requestId: request.id,
        id: request.code,
        area: request.department,
        puesto: request.position_title,
        fecha: request.created_at,
        estado: request.status,
        prioridad: request.priority || 'Media',
      })));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    apiRequest('/lookups')
      .then(({ departments }) => setAreasDisponibles(departments.map(({ name }) => name)))
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    setMostrarFormulario(location.pathname === '/nueva-solicitud');
  }, [location.pathname]);

  const guardarSolicitud = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await apiRequest(solicitudEnEdicion ? `/requests/${solicitudEnEdicion.requestId}` : '/requests', {
        method: solicitudEnEdicion ? 'PATCH' : 'POST',
        body: JSON.stringify(formulario),
      });
      setFormulario({
        department: areaPredeterminada,
        positionTitle: '',
        reason: '',
        priority: 'Media',
        requiredBy: '',
        applicationDeadline: '',
        applicationDocuments: [],
      });
      setSolicitudEnEdicion(null);
      setMostrarFormulario(false);
      navigate('/solicitudes-cobertura', { replace: true });
      await cargarSolicitudes();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGuardando(false);
    }
  };

  const editarSolicitud = (solicitud) => {
    setSolicitudEnEdicion(solicitud);
    setSolicitudSeleccionada(null);
    setFormulario({
      department: solicitud.area,
      positionTitle: solicitud.puesto,
      reason: solicitud.reason,
      priority: solicitud.prioridad,
      requiredBy: solicitud.required_by ? solicitud.required_by.slice(0, 10) : '',
      applicationDeadline: solicitud.application_deadline ? solicitud.application_deadline.slice(0, 10) : '',
      applicationDocuments: solicitud.application_documents ?? [],
    });
    setError('');
    setMensaje('');
    setMostrarFormulario(true);
  };

  const eliminarSolicitud = async (solicitud) => {
    if (!window.confirm(`¿Eliminar la solicitud ${solicitud.id}? Esta acción solo es posible si está pendiente y no tiene documentos, evaluaciones ni asignaciones asociados.`)) return;
    setEliminando(solicitud.requestId);
    setError('');
    try {
      await apiRequest(`/requests/${solicitud.requestId}`, { method: 'DELETE' });
      if (solicitudSeleccionada?.requestId === solicitud.requestId) setSolicitudSeleccionada(null);
      await cargarSolicitudes();
    } catch (requestError) {
      if (solicitudSeleccionada?.requestId === solicitud.requestId) setSolicitudSeleccionada(null);
      setError(requestError.message);
    } finally {
      setEliminando('');
    }
  };

  const cambiarEstadoSolicitud = async (status) => {
    setActualizandoEstado(true);
    setError('');
    try {
      const { request } = await apiRequest(`/requests/${solicitudSeleccionada.requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSolicitudSeleccionada((current) => current
        ? { ...current, estado: request.status }
        : current);
      await cargarSolicitudes();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActualizandoEstado(false);
    }
  };

  const cancelarFormulario = () => {
    setFormulario({
      department: areaPredeterminada,
      positionTitle: '',
      reason: '',
      priority: 'Media',
      requiredBy: '',
      applicationDeadline: '',
      applicationDocuments: [],
    });
    setSolicitudEnEdicion(null);
    setMensaje('');
    setMostrarFormulario(false);
    if (location.pathname === '/nueva-solicitud') navigate('/solicitudes-cobertura');
  };
  const cambiarDocumentoPostulacion = (type, checked) => {
    setFormulario((current) => ({
      ...current,
      applicationDocuments: checked
        ? [...current.applicationDocuments, { type, required: true }]
        : current.applicationDocuments.filter((document) => document.type !== type),
    }));
  };
  const cambiarObligatoriedadDocumento = (type, required) => {
    setFormulario((current) => ({
      ...current,
      applicationDocuments: current.applicationDocuments.map((document) => (
        document.type === type ? { ...document, required } : document
      )),
    }));
  };

  const estadoLabel = (status) => ({
    pending: 'Pendiente',
    in_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    completed: 'Completado',
  }[status] ?? status);
  const fechaLabel = (date) => date
    ? new Intl.DateTimeFormat('es-PE').format(new Date(date.length === 10 ? `${date}T12:00:00` : date))
    : '—';
  const fechaMinima = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  };

  const extenderFechaCierre = async (event) => {
    event.preventDefault();
    setGuardandoExtension(true);
    setError('');
    setMensaje('');
    try {
      const esAmpliacion = Boolean(solicitudSeleccionada.application_deadline);
      const { request } = await apiRequest(`/requests/${solicitudSeleccionada.requestId}/deadline`, {
        method: 'PATCH',
        body: JSON.stringify({ applicationDeadline: fechaExtension }),
      });
      setSolicitudSeleccionada((current) => current
        ? { ...current, ...request }
        : current);
      setFechaExtension('');
      setMostrarExtension(false);
      setMensaje(esAmpliacion ? 'La fecha límite se amplió correctamente.' : 'La fecha límite se estableció correctamente.');
      await cargarSolicitudes();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGuardandoExtension(false);
    }
  };

  return (
    <div className="app-shell flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />

      {/* Área Principal */}
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Convocatorias de Personal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <UserDropdown />
          </div>
        </header>

        <main className="p-8 space-y-6">
          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          {!mostrarFormulario ? (
            /* Vista 1: Tabla de Historial General */
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Convocatorias de Personal</h2>
                  <p className="text-xs text-gray-500">Historial general de requerimientos de personal por área</p>
                </div>

                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>➕</span> Nueva Convocatoria
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b pb-2">
                      <th className="pb-3 font-medium">Código</th>
                      <th className="pb-3 font-medium">Área Solicitante</th>
                      <th className="pb-3 font-medium">Puesto Requerido</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Cierre de postulaciones</th>
                      <th className="pb-3 font-medium">Prioridad</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudes.map((sol) => (
                      <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-bold text-blue-950">{sol.id}</td>
                        <td className="py-3 text-gray-700">{sol.area}</td>
                        <td className="py-3 font-medium text-gray-900">{sol.puesto}</td>
                        <td className="py-3 text-gray-500">{fechaLabel(sol.fecha)}</td>
                        <td className="py-3 text-gray-500">
                          {fechaLabel(sol.application_deadline)}
                          {sol.application_deadline_original && sol.application_deadline !== sol.application_deadline_original && (
                            <span className="block text-[10px] text-blue-800">Ampliada desde {fechaLabel(sol.application_deadline_original)}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{sol.prioridad}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sol.estado === 'approved' || sol.estado === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            sol.estado === 'in_review' ? 'bg-blue-100 text-blue-800' :
                            sol.estado === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {estadoLabel(sol.estado)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setSolicitudSeleccionada(sol)}
                              className="text-blue-900 font-bold hover:underline"
                            >
                              Ver detalle
                            </button>
                            {sol.estado === 'pending' && ['admin', 'hr_specialist'].includes(user?.role) && (
                              <>
                                <button onClick={() => editarSolicitud(sol)} className="font-semibold text-black hover:underline">
                                  Editar
                                </button>
                                <button
                                  onClick={() => eliminarSolicitud(sol)}
                                  disabled={eliminando === sol.requestId}
                                  className="font-semibold text-red-700 hover:underline disabled:text-gray-400"
                                >
                                  {eliminando === sol.requestId ? 'Eliminando...' : 'Eliminar'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!cargando && solicitudes.length === 0 && (
                      <tr><td colSpan="8" className="py-6 text-center text-gray-500">No hay solicitudes registradas en la base de datos.</td></tr>
                    )}
                    {cargando && (
                      <tr><td colSpan="8" className="py-6 text-center text-gray-500">Cargando solicitudes...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Vista 2: Formulario de Nueva Solicitud */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">{solicitudEnEdicion ? `Editar convocatoria ${solicitudEnEdicion.code}` : 'Nueva Convocatoria de Personal'}</h2>
                <button 
                  onClick={cancelarFormulario}
                  className="text-xs text-blue-900 hover:underline font-semibold flex items-center gap-1"
                >
                  ← Volver al historial
                </button>
              </div>

              <form onSubmit={guardarSolicitud} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-5 text-sm md:col-span-2">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Área Solicitante</label>
                    <select required value={formulario.department} disabled={esJefeArea}
                      onChange={(event) => setFormulario({ ...formulario, department: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100">
                      <option value="">Selecciona un área</option>
                      {[...new Set([...areasDisponibles, ...(areaPredeterminada ? [areaPredeterminada] : [])])].sort((a, b) => a.localeCompare(b, 'es')).map((area) => <option key={area} value={area}>{area}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Puesto a cubrir</label>
                    <input required minLength="2" maxLength="160" value={formulario.positionTitle}
                      onChange={(event) => setFormulario({ ...formulario, positionTitle: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Nombre del puesto" />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Motivo de la convocatoria</label>
                    <textarea required minLength="10" maxLength="4000" rows="4" value={formulario.reason}
                      onChange={(event) => setFormulario({ ...formulario, reason: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Describe la necesidad de personal..." />
                  </div>
                  <div>
                    <label htmlFor="request-priority" className="font-semibold text-gray-700 block mb-1.5">Prioridad</label>
                    <select id="request-priority" required value={formulario.priority}
                      onChange={(event) => setFormulario({ ...formulario, priority: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Fecha requerida (opcional)</label>
                    <input type="date" value={formulario.requiredBy}
                      onChange={(event) => setFormulario({ ...formulario, requiredBy: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Fecha límite de postulación</label>
                    <input type="date" required min={fechaMinima()} value={formulario.applicationDeadline}
                      onChange={(event) => setFormulario({ ...formulario, applicationDeadline: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                  </div>
                  <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-gray-800">Documentos para postular</legend>
                    <p className="text-xs text-gray-600">
                      El currículum siempre se solicita. Selecciona otros documentos para que aparezcan en el portal y define si cada uno será obligatorio u opcional.
                    </p>
                    {TIPOS_DOCUMENTO_POSTULACION.map(({ type, label }) => {
                      const configuredDocument = formulario.applicationDocuments.find((document) => document.type === type);
                      return (
                        <div key={type} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(configuredDocument)}
                              onChange={(event) => cambiarDocumentoPostulacion(type, event.target.checked)}
                              className="h-4 w-4 accent-blue-900"
                            />
                            <span>{label}</span>
                          </label>
                          {configuredDocument && (
                            <select
                              aria-label={`Requisito de ${label}`}
                              value={configuredDocument.required ? 'required' : 'optional'}
                              onChange={(event) => cambiarObligatoriedadDocumento(type, event.target.value === 'required')}
                              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                            >
                              <option value="required">Obligatorio</option>
                              <option value="optional">Opcional</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </fieldset>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 text-sm h-fit">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Resumen</h3>
                  <p><strong>Puesto:</strong> {formulario.positionTitle || '—'}</p>
                  <p><strong>Área:</strong> {formulario.department || '—'}</p>

                  <div className="pt-3 space-y-2">
                    <button type="submit" disabled={guardando}
                      className="w-full bg-blue-950 text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 disabled:opacity-60"
                    >
                      {guardando ? 'Guardando...' : 'Guardar solicitud'}
                    </button>
                    <button type="button"
                      onClick={cancelarFormulario}
                      className="w-full bg-white border py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {solicitudSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSolicitudSeleccionada(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-solicitud"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between border-b pb-3">
              <div>
                <h2 id="titulo-detalle-solicitud" className="text-lg font-bold text-gray-900">
                  Detalle de solicitud
                </h2>
                <p className="mt-1 text-xs text-gray-500">{solicitudSeleccionada.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                aria-label="Cerrar detalle"
                className="text-xl font-bold text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Área solicitante</dt>
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.area}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Puesto requerido</dt>
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.puesto}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Fecha</dt>
                <dd className="mt-1 text-gray-800">{fechaLabel(solicitudSeleccionada.fecha)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Cierre de postulaciones</dt>
                <dd className="mt-1 text-gray-800">{fechaLabel(solicitudSeleccionada.application_deadline)}</dd>
              </div>
              {solicitudSeleccionada.application_deadline_original &&
                solicitudSeleccionada.application_deadline !== solicitudSeleccionada.application_deadline_original && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-gray-500">Ampliación del plazo</dt>
                    <dd className="mt-1 text-gray-800">
                      Fecha inicial: {fechaLabel(solicitudSeleccionada.application_deadline_original)} · Ampliada hasta: {fechaLabel(solicitudSeleccionada.application_deadline)}
                    </dd>
                  </div>
                )}
              <div>
                <dt className="text-xs font-semibold text-gray-500">Prioridad</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.prioridad}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Estado</dt>
                <dd className="mt-1 text-gray-800">{estadoLabel(solicitudSeleccionada.estado)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Motivo</dt>
                <dd className="mt-1 whitespace-pre-line text-gray-800">{solicitudSeleccionada.reason}</dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mt-4 rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {mensaje && <p role="status" className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{mensaje}</p>}

            {['admin', 'hr_specialist'].includes(user?.role) &&
              solicitudSeleccionada.estado === 'approved' && (
                <div className="mt-4 border-t pt-4">
                  {!mostrarExtension ? (
                    <button
                      type="button"
                      onClick={() => { setMostrarExtension(true); setFechaExtension(''); setError(''); setMensaje(''); }}
                      className="rounded-lg border border-blue-900 px-4 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50"
                    >
                      {solicitudSeleccionada.application_deadline ? 'Ampliar fecha límite' : 'Establecer fecha límite'}
                    </button>
                  ) : (
                    <form onSubmit={extenderFechaCierre} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="flex-1 text-xs font-semibold text-gray-700">
                        Nueva fecha límite
                        <input
                          type="date"
                          required
                          min={fechaMinima()}
                          value={fechaExtension}
                          onChange={(event) => setFechaExtension(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </label>
                      <button type="submit" disabled={guardandoExtension} className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400">
                        {guardandoExtension ? 'Guardando...' : solicitudSeleccionada.application_deadline ? 'Guardar ampliación' : 'Guardar fecha límite'}
                      </button>
                      <button type="button" onClick={() => { setMostrarExtension(false); setFechaExtension(''); }} className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-700">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              )}

            <div className="mt-6 flex justify-between border-t pt-4">
              {['admin', 'hr_specialist'].includes(user?.role) ? (
                <div className="flex flex-wrap gap-2">
                  {['pending', 'in_review'].includes(solicitudSeleccionada.estado) && (
                    <button
                      type="button"
                      onClick={() => cambiarEstadoSolicitud('approved')}
                      disabled={actualizandoEstado}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {actualizandoEstado ? 'Actualizando...' : 'Aprobar y publicar'}
                    </button>
                  )}
                  {solicitudSeleccionada.estado === 'approved' && (
                    <button
                      type="button"
                      onClick={() => cambiarEstadoSolicitud('in_review')}
                      disabled={actualizandoEstado}
                      className="rounded-lg border border-amber-400 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      {actualizandoEstado ? 'Actualizando...' : 'Retirar del portal'}
                    </button>
                  )}
                  {solicitudSeleccionada.estado === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => editarSolicitud(solicitudSeleccionada)}
                        className="rounded-lg border border-gray-400 px-4 py-2 text-xs font-semibold text-black hover:bg-gray-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarSolicitud(solicitudSeleccionada)}
                        disabled={eliminando === solicitudSeleccionada.requestId}
                        className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:text-gray-400"
                      >
                        {eliminando === solicitudSeleccionada.requestId ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </>
                  )}
                </div>
              ) : <span />}
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}