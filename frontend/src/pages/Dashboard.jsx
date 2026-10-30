import UserDropdown from '../components/UserDropdown';
import Sidebar from '../components/sidebar';
import { useNavigate, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

const estadoSolicitud = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  in_review: { label: 'En revisión', className: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Aprobada', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completada', className: 'bg-gray-100 text-gray-700' },
};

function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({ summary: null, requests: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest('/dashboard')
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifique que el backend y PostgreSQL estén disponibles.'
            : requestError.message);
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const summary = dashboard.summary;
  const metricValue = (value) => error ? '—' : cargando ? '…' : (value ?? 0);
  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-PE');
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Barra Superior */}
        <header className="bg-white border-b px-4 sm:px-8 py-3 flex justify-end items-center gap-4">
          <UserDropdown />
        </header>

        {/* Contenido Central */}
        <main className="p-8 space-y-6">
          
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Resumen de gestión</h2>
            <p className="text-xs text-gray-500 mt-1">Resumen de la gestión de personal</p>
          </div>

          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-blue-900 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 w-full mb-1">
                <span className="p-1 bg-blue-50 text-blue-800 rounded-lg text-base ">📄</span>
                <p className="text-xs font-semibold text-gray-500 ">Solicitudes pendientes</p> 
              </div>
              <p className="text-3xl font-bold text-blue-900 my-1 text-center">{metricValue(summary?.pending_requests)}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-amber-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-base shrink-0">📌</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Validaciones pendientes</p>          
              </div>
              <p className="text-3xl font-bold text-amber-600 my-1 text-center">{metricValue(summary?.pending_validations)}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-emerald-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-base shrink-0">📝</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Evaluaciones pendientes</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600 my-1 text-center">{metricValue(summary?.pending_evaluations)}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-purple-700 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-base shrink-0">👥</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Asignaciones realizadas</p>
              </div>
              <p className="text-3xl font-bold text-purple-700 my-1 text-center">{metricValue(summary?.completed_assignments)}</p>
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
                  {dashboard.requests.map((request) => {
                    const status = estadoSolicitud[request.status] || estadoSolicitud.pending;
                    return (
                      <tr key={request.id}>
                        <td className="py-2.5 font-bold text-gray-700">{request.code}</td>
                        <td className="py-2.5">{request.department}</td>
                        <td className="py-2.5">{request.position_title}</td>
                        <td className="py-2.5">{formatDate(request.created_at)}</td>
                        <td className="py-2.5">
                          <span className={`${status.className} text-[10px] px-2 py-0.5 rounded font-bold`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link to="/solicitudes-cobertura" className="text-blue-700 font-semibold">Ver</Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!cargando && !error && dashboard.requests.length === 0 && (
                    <tr>
                      <td className="py-4 text-center text-gray-500" colSpan="6">
                        No hay solicitudes registradas.
                      </td>
                    </tr>
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
                  {!cargando && summary && (
                    <>
                      {summary.pending_documents > 0 && (
                        <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                          <p className="font-semibold leading-relaxed">
                            {summary.pending_documents} documento(s) pendiente(s) de validación
                          </p>
                        </div>
                      )}
                      {summary.pending_technical_evaluations > 0 && (
                        <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                          <p className="font-semibold leading-relaxed">
                            {summary.pending_technical_evaluations} evaluación(es) técnica(s) pendiente(s)
                          </p>
                        </div>
                      )}
                      {summary.expiring_requests > 0 && (
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-900 shadow-sm">
                          <p className="font-semibold leading-relaxed">
                            {summary.expiring_requests} solicitud(es) próxima(s) a vencer
                          </p>
                        </div>
                      )}
                      {!summary.pending_documents && !summary.pending_technical_evaluations && !summary.expiring_requests && (
                        <p className="text-gray-500">No hay alertas pendientes.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-4 text-right">
                  <Link to="/validacion-ocr" className="text-xs font-semibold text-blue-700 hover:underline">
                    Ver documentos pendientes &gt;
                  </Link>
                </div>
              </div>

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
                    <span className="text-xs font-semibold text-gray-700">Generar reporte</span>
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