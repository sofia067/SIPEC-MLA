import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

export default function Informes() {
  const [kpis, setKpis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/reports/kpis')
      .then(setKpis)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const maxSolicitudesDepartamento = Math.max(
    0,
    ...(kpis?.requestsByDepartment ?? []).map((item) => item.total),
  );
  const tarjetas = [
    { label: 'Solicitudes registradas', value: kpis?.totalRequests },
    { label: 'Solicitudes pendientes o en revisión', value: kpis?.pendingRequests },
    { label: 'Documentos con OCR completado', value: kpis?.ocrCompletedDocuments },
    { label: 'Trabajadores activos', value: kpis?.activeWorkers },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Informes
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Informes de gestión</h2>
            <p className="mt-1 text-sm text-gray-600">Indicadores de solicitudes, cobertura y validación documental.</p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              No se pudieron cargar los indicadores: {error}
            </div>
          )}

          <section aria-label="Indicadores de gestión" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tarjetas.map((tarjeta) => (
              <div key={tarjeta.label} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">{tarjeta.label}</p>
                <h3 className="text-2xl font-bold text-blue-950 mt-2">
                  {cargando ? '…' : error ? '—' : tarjeta.value.toLocaleString('es-PE')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Datos actuales del sistema</p>
              </div>
            ))}
          </section>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Solicitudes por gerencia</h3>
            {cargando ? (
              <p role="status" className="text-sm text-gray-500">Cargando solicitudes…</p>
            ) : kpis?.requestsByDepartment?.length ? (
              <div className="space-y-4 text-sm">
                {kpis.requestsByDepartment.map((item) => {
                  const porcentaje = maxSolicitudesDepartamento
                    ? Math.round((item.total / maxSolicitudesDepartamento) * 100)
                    : 0;
                  return (
                    <div key={item.department}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 mb-1">
                        <span className="font-semibold text-gray-700">{item.department}</span>
                        <span className="font-semibold text-blue-950">
                          {item.total.toLocaleString('es-PE')} {item.total === 1 ? 'solicitud' : 'solicitudes'}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Solicitudes de ${item.department}`}
                        aria-valuemin="0"
                        aria-valuemax={maxSolicitudesDepartamento}
                        aria-valuenow={item.total}
                        className="w-full bg-gray-200 h-2 rounded-full overflow-hidden"
                      >
                        <div className="bg-blue-950 h-full rounded-full" style={{ width: `${porcentaje}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {error ? 'No se pudieron cargar las solicitudes por gerencia.' : 'Aún no hay solicitudes registradas.'}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}