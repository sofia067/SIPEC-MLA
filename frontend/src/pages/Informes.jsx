import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const getRecordDate = (record) => String(record.created_at ?? '').slice(0, 10);
const getRecordYear = (record) => getRecordDate(record).slice(0, 4);

const evaluationStatus = (evaluation, passingScore) => {
  if (evaluation.score == null) {
    return evaluation.status === 'pending' ? 'Pendiente' : 'Sin puntaje';
  }
  return Number(evaluation.score) >= passingScore ? 'Aprobado' : 'Desaprobado';
};

const evaluationStatusClass = {
  Aprobado: 'bg-emerald-100 text-emerald-800',
  Desaprobado: 'bg-red-100 text-red-800',
  Pendiente: 'bg-amber-100 text-amber-800',
  'Sin puntaje': 'bg-gray-100 text-gray-700',
};

export default function Informes() {
  const [informes, setInformes] = useState({ requests: [], evaluations: [], summary: null });
  const [entidad, setEntidad] = useState(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest('/reports?type=requests'),
      apiRequest('/reports?type=evaluations'),
      apiRequest('/dashboard'),
      apiRequest('/system-info'),
    ])
      .then(([requests, evaluations, dashboard, systemInfo]) => {
        if (active) {
          setInformes({
            requests: requests.rows,
            evaluations: evaluations.rows,
            summary: dashboard.summary,
          });
          setEntidad(systemInfo.system);
        }
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

  const aniosDisponibles = useMemo(() => {
    const anios = new Set([
      ...informes.requests.map(getRecordYear),
      ...informes.evaluations.map(getRecordYear),
    ].filter((year) => /^\d{4}$/.test(year)));
    if (entidad?.fiscal_year) anios.add(String(entidad.fiscal_year));
    return [...anios].sort((yearA, yearB) => Number(yearB) - Number(yearA));
  }, [entidad, informes.evaluations, informes.requests]);

  const solicitudesFiltradas = useMemo(
    () => informes.requests.filter((request) => {
      const date = getRecordDate(request);
      return (!anioSeleccionado || getRecordYear(request) === anioSeleccionado)
        && (!fechaDesde || date >= fechaDesde)
        && (!fechaHasta || date <= fechaHasta);
    }),
    [anioSeleccionado, fechaDesde, fechaHasta, informes.requests],
  );

  const evaluacionesFiltradas = useMemo(
    () => informes.evaluations.filter((evaluation) => {
      const date = getRecordDate(evaluation);
      return (!anioSeleccionado || getRecordYear(evaluation) === anioSeleccionado)
        && (!fechaDesde || date >= fechaDesde)
        && (!fechaHasta || date <= fechaHasta);
    }),
    [anioSeleccionado, fechaDesde, fechaHasta, informes.evaluations],
  );

  const requestsByDepartment = useMemo(() => Object.entries(
    solicitudesFiltradas.reduce((counts, request) => {
      const department = request.department || 'Sin gerencia';
      counts[department] = (counts[department] || 0) + 1;
      return counts;
    }, {}),
  ).sort(([, countA], [, countB]) => countB - countA), [solicitudesFiltradas]);

  const maxDepartmentRequests = Math.max(1, ...requestsByDepartment.map(([, count]) => count));
  const passingScore = Number(entidad?.passing_score ?? 70);
  const conteoEvaluaciones = useMemo(() => {
    const counts = { Pendiente: 0, Aprobado: 0, Desaprobado: 0, 'Sin puntaje': 0 };
    evaluacionesFiltradas.forEach((evaluation) => {
      counts[evaluationStatus(evaluation, passingScore)] += 1;
    });
    return counts;
  }, [evaluacionesFiltradas, passingScore]);
  const pendientesFiltradas = solicitudesFiltradas.filter(
    (request) => ['pending', 'in_review'].includes(request.status),
  ).length;

  const limpiarFiltros = () => {
    setAnioSeleccionado('');
    setFechaDesde('');
    setFechaHasta('');
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
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Informes
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Informes de gestión</h2>
            <p className="mt-1 text-sm text-gray-600">
              {entidad ? `${entidad.organization_name} · Año fiscal ${entidad.fiscal_year}. ` : ''}
              Indicadores de solicitudes, cobertura y evaluación.
            </p>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <section aria-label="Filtros temporales del informe" className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>
              Año fiscal
              <select
                value={anioSeleccionado}
                onChange={(event) => setAnioSeleccionado(event.target.value)}
                className={inputClass}
              >
                <option value="">Todos los años</option>
                {aniosDisponibles.map((year) => (
                  <option key={year} value={year}>
                    {year}{String(entidad?.fiscal_year) === year ? ' (fiscal vigente)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Desde
              <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(event) => setFechaDesde(event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Hasta
              <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(event) => setFechaHasta(event.target.value)} className={inputClass} />
            </label>
            <div className="flex items-end">
              <button type="button" onClick={limpiarFiltros} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Limpiar filtros
              </button>
            </div>
          </section>

          <section aria-label="Indicadores de gestión" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Solicitudes en el periodo</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">{cargando ? '…' : solicitudesFiltradas.length}</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Solicitudes pendientes</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">{cargando ? '…' : pendientesFiltradas}</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Evaluaciones en el periodo</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">{cargando ? '…' : evaluacionesFiltradas.length}</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Asignaciones realizadas (total)</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">{cargando ? '…' : informes.summary?.completed_assignments ?? 0}</h3>
            </div>
          </section>

          <section aria-busy={cargando} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">Solicitudes por gerencia</h3>
              <p className="mt-1 text-xs text-gray-500">Resultados para el periodo seleccionado.</p>
            </div>
            {cargando ? (
              <div role="status" aria-label="Cargando solicitudes por gerencia" className="space-y-4">
                <span className="sr-only">Cargando solicitudes por gerencia…</span>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse space-y-2">
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                    <div className="h-2 w-full rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {requestsByDepartment.map(([department, count]) => (
                  <div key={department}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 mb-1">
                      <span className="font-semibold text-gray-700">{department}</span>
                      <span className="font-semibold text-blue-950">{count} solicitudes</span>
                    </div>
                    <div role="progressbar" aria-label={`Solicitudes de ${department}`} aria-valuemin="0" aria-valuemax={maxDepartmentRequests} aria-valuenow={count} className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-950 h-full rounded-full" style={{ width: `${(count / maxDepartmentRequests) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {requestsByDepartment.length === 0 && <p className="text-sm text-gray-500">No hay solicitudes registradas en el periodo seleccionado.</p>}
              </div>
            )}
          </section>

          <section aria-busy={cargando} className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900">Resumen de evaluaciones</h3>
              <p className="mt-1 text-xs text-gray-500">
                Aprobación calculada con el puntaje mínimo configurado ({passingScore}%). Los estados se derivan del estado y puntaje registrados.
              </p>
            </div>
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Cantidad de evaluaciones por resultado en el periodo seleccionado</caption>
              <thead>
                <tr className="border-b text-gray-500">
                  <th scope="col" className="pb-3 font-medium">Resultado</th>
                  <th scope="col" className="pb-3 font-medium">Cantidad</th>
                  <th scope="col" className="pb-3 font-medium">Porcentaje</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(conteoEvaluaciones).map(([status, count]) => (
                  <tr key={status}>
                    <th scope="row" className="py-3 font-medium text-gray-800">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${evaluationStatusClass[status]}`}>{status}</span>
                    </th>
                    <td className="py-3 text-gray-700">{cargando ? '…' : count}</td>
                    <td className="py-3 text-gray-700">
                      {cargando || !evaluacionesFiltradas.length
                        ? '—'
                        : `${Math.round((count / evaluacionesFiltradas.length) * 100)}%`}
                    </td>
                  </tr>
                ))}
                {!cargando && evaluacionesFiltradas.length === 0 && (
                  <tr><td colSpan="3" className="py-5 text-center text-gray-500">No hay evaluaciones en el periodo seleccionado.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold text-gray-900">
                  <th scope="row" className="pt-3">Total</th>
                  <td className="pt-3">{cargando ? '…' : evaluacionesFiltradas.length}</td>
                  <td className="pt-3">{cargando ? '—' : evaluacionesFiltradas.length ? '100%' : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <div>
            <div className="flex flex-wrap gap-3">
              <a href="/api/reports/requests.csv" className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
                Descargar solicitudes CSV
              </a>
              <a href="/api/reports/evaluations.csv" className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
                Descargar evaluaciones CSV
              </a>
            </div>
            <p className="mt-2 text-xs text-gray-500">Las descargas CSV incluyen todos los registros, independientemente de los filtros aplicados en pantalla.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
