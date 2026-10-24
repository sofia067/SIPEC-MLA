import UserDropdown from '../components/UserDropdown';
import { useNavigate, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/AuthContext';


function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  useEffect(() => {
    apiRequest('/dashboard')
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const summary = dashboard?.summary;
  const recentRequests = dashboard?.requests ?? [];
  const formatStatus = (status) => ({
    pending: 'Pendiente',
    in_review: 'En revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    completed: 'Completada',
  }[status] ?? status);
  const formatDate = (date) => date
    ? new Intl.DateTimeFormat('es-PE').format(new Date(date.length === 10 ? `${date}T12:00:00` : date))
    : 'Sin fecha';

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo del Sidebar */}
          <div className="p-4 flex items-center gap-3 border-b border-blue-900">
             <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
             <div>
              <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
              <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
             </div>
         </div>

          {/* Menú Completo  */}
          <nav className="p-3 space-y-1.5 text-sm">
            <button className="w-full text-left py-2.5 px-3 rounded bg-blue-900 font-bold flex items-center gap-3 text-blue-100">
              <span className="text-base">🏚️​</span> Inicio
            </button>
            <button onClick={() => navigate('/trabajadores')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">👥</span> Trabajadores
            </button>
            <button onClick={() => navigate('/perfil-puesto')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📄</span> Perfiles de puesto
            </button>
          
            <button 
              onClick={() => navigate('/solicitudes-cobertura')} 
               className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200 transition-colors" >
              <span className="text-base">📑</span> Solicitudes de cobertura
            </button>
            <button onClick={() => navigate('/candidatos-compatibles')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🎯</span> Candidatos compatibles
            </button>
            <button onClick={() => navigate('/validacion-ocr')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🛡️</span> Validación documental
            </button>
            <button onClick={() => navigate('/evaluacion')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📝</span> Evaluacion
            </button>
            <button onClick={() => navigate('/informes')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📊</span> Reportes
            </button>
            <button  onClick={() => navigate('/auditoria')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🔒</span> Auditoría
            </button>
            <button onClick={() => navigate('/configuracion')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">⚙️</span> Configuración
            </button>
          </nav>
        </div>

        {/* Botón Salir */}
        <div className="p-3 border-t border-blue-900">
          <button onClick={async () => {
            try {
              await logout();
              navigate('/', { replace: true });
            } catch (logoutError) {
              setError(logoutError.message);
            }
          }} className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2">
            ❌​ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Barra Superior */}
        <header className="bg-white border-b px-12 py-3 flex justify-end items-center gap-4">
          <button className="text-gray-500 text-base">🔔</button>
           {/*  componente desplegable */}
            <UserDropdown /> 
         
        </header>

        {/* Contenido Central */}
        <main className="p-8 space-y-6">
          
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido, {user?.displayName || user?.username}!</h2>
            <p className="text-xs text-gray-500 mt-1">Resumen de la gestión de personal</p>
          </div>

          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              No se pudo cargar el resumen: {error}
            </div>
          )}

          {/* Tarjetas de Métricas (Números Centrados) */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-blue-900 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 w-full mb-1">
                <span className="p-1 bg-blue-50 text-blue-800 rounded-lg text-base ">📄</span>
                <p className="text-xs font-semibold text-gray-500 ">Solicitudes pendientes</p> 
              </div>
              <p className="text-3xl font-bold text-blue-900 my-1 text-center">{summary?.pending_requests ?? '—'}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-amber-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-base shrink-0">📌</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Validaciones pendientes</p>          
              </div>
              <p className="text-3xl font-bold text-amber-600 my-1 text-center">{summary?.pending_validations ?? '—'}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-emerald-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-base shrink-0">📝</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Evaluaciones pendientes</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600 my-1 text-center">{summary?.pending_evaluations ?? '—'}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-purple-700 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-base shrink-0">👥</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Asignaciones realizadas</p>
              </div>
              <p className="text-3xl font-bold text-purple-700 my-1 text-center">{summary?.completed_assignments ?? '—'}</p>
            </div>
          </div>

          {/* Sección Inferior */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Tabla de Solicitudes Recientes */}
            <div className="col-span-2 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-gray-800">Solicitudes recientes</h3>
                <Link  to="/solicitudes-cobertura"   className="text-xs text-blue-900 font-semibold hover:underline" >
               Ver todas {'>'}
                </Link>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b pb-2">
                    <th className="pb-2 font-medium">Código</th>
                    <th className="pb-2 font-medium">Área</th>
                    <th className="pb-2 font-medium">Puesto</th>
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-2.5 font-bold text-gray-700">{request.code}</td>
                      <td className="py-2.5">{request.department}</td>
                      <td className="py-2.5">{request.position_title}</td>
                      <td className="py-2.5">{formatDate(request.created_at)}</td>
                      <td className="py-2.5">{formatStatus(request.status)}</td>
                      <td className="py-2.5 text-right">
                        <Link to="/solicitudes-cobertura" className="text-blue-700 font-semibold">Ver</Link>
                      </td>
                    </tr>
                  ))}
                  {!error && dashboard && recentRequests.length === 0 && (
                    <tr><td colSpan="6" className="py-4 text-center text-gray-500">Aún no hay solicitudes registradas.</td></tr>
                  )}
                  {!error && !dashboard && (
                    <tr><td colSpan="6" className="py-4 text-center text-gray-500">Cargando solicitudes...</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/*  Alertas y Acciones Rápidas */}
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-1.5">
                  ⚠️ Alertas
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">{summary?.pending_documents ?? '—'} documentos pendientes de validación</p>
                  </div>
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">{summary?.pending_technical_evaluations ?? '—'} evaluaciones técnicas pendientes</p>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">{summary?.expiring_requests ?? '—'} solicitudes próximas a vencer</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    onClick={() => setMostrarAlertas(true)}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Ver todas las alertas &gt;
                  </button>
                </div>
              </div>

              {mostrarAlertas && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setMostrarAlertas(false);
                  }}
                >
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="titulo-alertas"
                    className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 id="titulo-alertas" className="text-lg font-bold text-gray-900">Alertas de gestión</h3>
                      <button
                        type="button"
                        onClick={() => setMostrarAlertas(false)}
                        aria-label="Cerrar alertas"
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                      >
                        ✕
                      </button>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-3">
                        <span>{summary?.pending_documents ?? 0} documentos pendientes de validación</span>
                        <button type="button" onClick={() => navigate('/validacion-ocr')} className="shrink-0 font-semibold text-blue-800 hover:underline">
                          Revisar
                        </button>
                      </li>
                      <li className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-3">
                        <span>{summary?.pending_technical_evaluations ?? 0} evaluaciones técnicas pendientes</span>
                        <button type="button" onClick={() => navigate('/evaluacion')} className="shrink-0 font-semibold text-blue-800 hover:underline">
                          Revisar
                        </button>
                      </li>
                      <li className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                        <span>{summary?.expiring_requests ?? 0} solicitudes próximas a vencer</span>
                        <button type="button" onClick={() => navigate('/solicitudes-cobertura')} className="shrink-0 font-semibold text-blue-800 hover:underline">
                          Revisar
                        </button>
                      </li>
                    </ul>
                  </section>
                </div>
              )}

              {/* Acciones Rápidas  */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-3">⚡ Acciones rápidas</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <button onClick={() => navigate('/nueva-solicitud')} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-semibold text-gray-700">Nueva solicitud</span>
                  </button>
                  <button onClick={() => navigate('/trabajadores')} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">👤</span>
                    <span className="text-xs font-semibold text-gray-700">Buscar trabajador</span>
                  </button>
                  <button onClick={() => navigate('/validacion-ocr')} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">🛡️</span>
                    <span className="text-xs font-semibold text-gray-700">Validar documento</span>
                  </button>
                  <button onClick={() => navigate('/informes')} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">📊</span>
                    <span className="text-xs font-semibold text-gray-700">Generar informe</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}

export default Dashboard;