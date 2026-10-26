import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

export default function SolicitudesCobertura() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [formulario, setFormulario] = useState({
    department: '',
    positionTitle: '',
    reason: '',
    priority: 'medium',
    requiredBy: '',
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [publicandoId, setPublicandoId] = useState('');
  const [error, setError] = useState('');

  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const [{ requests }, lookups] = await Promise.all([
        apiRequest('/requests'),
        apiRequest('/lookups'),
      ]);
      setSolicitudes(requests);
      setAreas(lookups.departments);
      setError('');
      return requests;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const guardarSolicitud = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify(formulario),
      });
      setFormulario({ department: '', positionTitle: '', reason: '', priority: 'medium', requiredBy: '' });
      setMostrarFormulario(false);
      await cargarSolicitudes();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGuardando(false);
    }
  };

  const publicarSolicitud = async (solicitud) => {
    setPublicandoId(solicitud.id);
    setError('');
    try {
      await apiRequest(`/requests/${solicitud.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      const requests = await cargarSolicitudes();
      setSolicitudSeleccionada(
        requests?.find((item) => item.id === solicitud.id) || { ...solicitud, status: 'approved' },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPublicandoId('');
    }
  };

  const estadoSolicitud = {
    pending: 'Pendiente',
    in_review: 'En revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    completed: 'Completada',
  };
  const prioridadSolicitud = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };

  const cerrarSesion = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

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
          <button onClick={cerrarSesion} className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2">
            ❌ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-end items-center gap-4">
          <button className="text-gray-500 text-base">🔔</button>
          <UserDropdown />
        </header>

        <main className="p-8 space-y-6">
          
          {!mostrarFormulario ? (
            /* Vista 1: Tabla de Historial General */
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Cobertura</h2>
                  <p className="text-xs text-gray-500">Historial general de requerimientos de personal por área</p>
                </div>

                {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}

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
                      <th className="pb-3 font-medium">Prioridad</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudes.map((sol) => (
                      <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-bold text-blue-950">{sol.code}</td>
                        <td className="py-3 text-gray-700">{sol.department}</td>
                        <td className="py-3 font-medium text-gray-900">{sol.position_title}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            sol.priority === 'high' ? 'bg-red-100 text-red-800' :
                            sol.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {prioridadSolicitud[sol.priority] || 'Media'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-PE') : '—'}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sol.status === 'approved' || sol.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            sol.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                            sol.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {estadoSolicitud[sol.status] || sol.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setSolicitudSeleccionada(sol)}
                              className="text-blue-900 font-bold hover:underline"
                            >
                              Ver detalle
                            </button>
                            {sol.status === 'approved' ? (
                              <button
                                type="button"
                                onClick={() => navigate('/postular')}
                                className="font-bold text-emerald-800 hover:underline"
                              >
                                Ver en portal
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!cargando && solicitudes.length === 0 && (
                      <tr><td colSpan="7" className="py-8 text-center text-gray-500">No hay solicitudes registradas.</td></tr>
                    )}
                    {cargando && (
                      <tr><td colSpan="7" className="py-8 text-center text-gray-500">Cargando solicitudes…</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Vista 2: Formulario de Nueva Solicitud */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">Nueva Solicitud de Cobertura</h2>
                <button 
                  onClick={() => setMostrarFormulario(false)}
                  className="text-xs text-blue-900 hover:underline font-semibold flex items-center gap-1"
                >
                  ← Volver al historial
                </button>
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <form onSubmit={guardarSolicitud} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Área Solicitante</label>
                    <select required value={formulario.department}
                      onChange={(event) => setFormulario({ ...formulario, department: event.target.value })}
                      className="w-full border p-2 rounded-lg">
                      <option value="">Selecciona un área orgánica</option>
                      {areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Puesto a cubrir</label>
                    <input required minLength="2" value={formulario.positionTitle}
                      onChange={(event) => setFormulario({ ...formulario, positionTitle: event.target.value })}
                      className="w-full border p-2 rounded-lg" />
                  </div>

                  <div>
                    <label htmlFor="prioridad-solicitud" className="font-semibold text-gray-700 block mb-1">Prioridad</label>
                    <select id="prioridad-solicitud" required value={formulario.priority}
                      onChange={(event) => setFormulario({ ...formulario, priority: event.target.value })}
                      className="w-full border p-2 rounded-lg">
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Motivo de la solicitud</label>
                    <textarea required minLength="10" rows="3" value={formulario.reason}
                      onChange={(event) => setFormulario({ ...formulario, reason: event.target.value })}
                      className="w-full border p-2 rounded-lg"
                      placeholder="Describe la necesidad de cobertura." />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Fecha requerida (opcional)</label>
                    <input type="date" value={formulario.requiredBy}
                      onChange={(event) => setFormulario({ ...formulario, requiredBy: event.target.value })}
                      className="w-full border p-2 rounded-lg" />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs h-fit">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Resumen</h3>
                  <p><strong>Puesto:</strong> {formulario.positionTitle || '—'}</p>
                  <p><strong>Área:</strong> {formulario.department || '—'}</p>
                  <p><strong>Prioridad:</strong> {prioridadSolicitud[formulario.priority]}</p>

                  <div className="pt-3 space-y-2">
                    <button type="submit" disabled={guardando}
                      className="w-full bg-blue-950 text-white py-2 rounded-lg font-bold hover:bg-blue-900"
                    >
                      {guardando ? 'Guardando…' : 'Guardar solicitud'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="w-full bg-white border py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
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
                <p className="mt-1 text-xs text-gray-500">{solicitudSeleccionada.code}</p>
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
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.department}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Puesto requerido</dt>
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.position_title}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Prioridad</dt>
                <dd className="mt-1 text-gray-800">{prioridadSolicitud[solicitudSeleccionada.priority] || 'Media'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Fecha</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.created_at ? new Date(solicitudSeleccionada.created_at).toLocaleDateString('es-PE') : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Estado</dt>
                <dd className="mt-1 text-gray-800">{estadoSolicitud[solicitudSeleccionada.status] || solicitudSeleccionada.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Motivo</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.reason}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
              {['pending', 'in_review'].includes(solicitudSeleccionada.status) && (
                <button
                  type="button"
                  onClick={() => publicarSolicitud(solicitudSeleccionada)}
                  disabled={publicandoId === solicitudSeleccionada.id}
                  className="rounded-lg bg-indigo-700 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {publicandoId === solicitudSeleccionada.id ? 'Publicando…' : 'Publicar solicitud'}
                </button>
              )}
              {solicitudSeleccionada.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => navigate('/postular')}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Ver en portal
                </button>
              )}
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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