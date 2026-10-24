import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export default function SolicitudesCobertura() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(location.pathname === '/nueva-solicitud');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [solicitudEnEdicion, setSolicitudEnEdicion] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState({
    department: '',
    positionTitle: '',
    reason: '',
    priority: 'Media',
    requiredBy: '',
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
      setFormulario({ department: '', positionTitle: '', reason: '', priority: 'Media', requiredBy: '' });
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
    });
    setError('');
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
    setFormulario({ department: '', positionTitle: '', reason: '', priority: 'Media', requiredBy: '' });
    setSolicitudEnEdicion(null);
    setMostrarFormulario(false);
    if (location.pathname === '/nueva-solicitud') navigate('/solicitudes-cobertura');
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

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 flex items-center gap-3 border-b border-blue-900">
            <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
            <div>
              <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
              <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
            </div>
          </div>

          <nav className="p-3 space-y-1.5 text-sm">
            <button onClick={() => navigate('/dashboard')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🏚️</span> Inicio
            </button>
            <button onClick={() => navigate('/trabajadores')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">👥</span> Trabajadores
            </button>
            <button onClick={() => navigate('/perfil-puesto')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📄</span> Perfiles de puesto
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded bg-blue-900 font-bold flex items-center gap-3 text-blue-100">
              <span className="text-base">📑</span> Solicitudes de cobertura
            </button>
            <button onClick={() => navigate('/candidatos-compatibles')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🎯</span> Candidatos compatibles
            </button>
            <button onClick={() => navigate('/validacion-ocr')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🛡️</span> Validación documental
            </button>
            <button onClick={() => navigate('/evaluaciones')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📝</span> Evaluaciones
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-blue-900">
          <button onClick={async () => {
            try {
              await logout();
              navigate('/', { replace: true });
            } catch (logoutError) {
              setError(logoutError.message);
            }
          }} className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2">
            ❌ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Solicitudes de Cobertura
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 text-base">🔔</button>
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
                  <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Cobertura</h2>
                  <p className="text-xs text-gray-500">Historial general de requerimientos de personal por área</p>
                </div>

                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>➕</span> Nueva Solicitud
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
                      <tr><td colSpan="7" className="py-6 text-center text-gray-500">No hay solicitudes registradas en la base de datos.</td></tr>
                    )}
                    {cargando && (
                      <tr><td colSpan="7" className="py-6 text-center text-gray-500">Cargando solicitudes...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Vista 2: Formulario de Nueva Solicitud */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">{solicitudEnEdicion ? `Editar solicitud ${solicitudEnEdicion.id}` : 'Nueva Solicitud de Cobertura'}</h2>
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
                    <input required minLength="2" maxLength="160" value={formulario.department}
                      onChange={(event) => setFormulario({ ...formulario, department: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Nombre del área" />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Puesto a cubrir</label>
                    <input required minLength="2" maxLength="160" value={formulario.positionTitle}
                      onChange={(event) => setFormulario({ ...formulario, positionTitle: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Nombre del puesto" />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Motivo de la solicitud</label>
                    <textarea required minLength="10" maxLength="4000" rows="4" value={formulario.reason}
                      onChange={(event) => setFormulario({ ...formulario, reason: event.target.value })}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Describe la necesidad de cobertura..." />
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