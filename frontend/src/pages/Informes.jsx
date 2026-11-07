import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const estados = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'completed', label: 'Completada' },
];

const formatoCsv = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

function descargarCsv(rows) {
  const columns = [
    ['code', 'Código'],
    ['department', 'Área orgánica'],
    ['position', 'Puesto'],
    ['status', 'Estado'],
    ['required_by', 'Fecha requerida'],
    ['requested_by', 'Solicitante'],
    ['created_at', 'Fecha de creación'],
    ['response_days', 'Días de atención'],
  ];
  const content = [columns.map(([, title]) => title), ...rows.map((row) => columns.map(([key]) => row[key]))]
    .map((row) => row.map(formatoCsv).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sipec-solicitudes.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function Informes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [area, setArea] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    apiRequest('/reports?type=requests')
      .then(({ rows }) => setSolicitudes(rows))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const areas = useMemo(
    () => [...new Set(solicitudes.map((row) => row.department))].sort((a, b) => a.localeCompare(b, 'es')),
    [solicitudes],
  );
  const rows = useMemo(() => solicitudes.filter((row) => (
    (!periodo || String(row.created_at).slice(0, 7) === periodo)
    && (!area || row.department === area)
    && (!estado || row.status === estado)
  )), [solicitudes, periodo, area, estado]);
  const porArea = useMemo(() => {
    const resumen = new Map();
    rows.forEach((row) => resumen.set(row.department, (resumen.get(row.department) ?? 0) + 1));
    return [...resumen.entries()].map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total || a.department.localeCompare(b.department, 'es'));
  }, [rows]);
  const maxSolicitudesArea = Math.max(0, ...porArea.map((item) => item.total));
  const tiemposAtencion = rows.filter((row) => row.response_days !== null && Number.isFinite(Number(row.response_days)));
  const tiempoPromedio = tiemposAtencion.length
    ? tiemposAtencion.reduce((total, row) => total + Number(row.response_days), 0) / tiemposAtencion.length
    : null;
  const kpis = [
    { label: 'Solicitudes totales', value: rows.length },
    { label: 'Pendientes', value: rows.filter((row) => ['pending', 'in_review'].includes(row.status)).length },
    { label: 'Aprobadas', value: rows.filter((row) => row.status === 'approved').length },
    { label: 'Rechazadas', value: rows.filter((row) => row.status === 'rejected').length },
  ];

  return (
    <div className="app-shell print:h-auto flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />
      <div className="print:overflow-visible min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="print:hidden bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">Informes</span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Informes de gestión</h2>
            <p className="mt-1 text-sm text-gray-600">Indicadores y seguimiento de solicitudes de cobertura.</p>
          </div>

          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">No se pudieron cargar los informes: {error}</div>}

          <section aria-label="Filtros de informes" className="print:hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">
                Periodo (mes/año)
                <input type="month" value={periodo} onChange={(event) => setPeriodo(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Área orgánica
                <select value={area} onChange={(event) => setArea(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5">
                  <option value="">Todas las áreas</option>
                  {areas.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Estado del expediente
                <select value={estado} onChange={(event) => setEstado(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5">
                  <option value="">Todos los estados</option>
                  {estados.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => descargarCsv(rows)} disabled={cargando || Boolean(error)} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400">Descargar CSV</button>
              <button type="button" onClick={() => window.print()} disabled={cargando || Boolean(error)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-400">Exportar PDF</button>
            </div>
          </section>

          <section aria-label="Indicadores de gestión" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-blue-950">{cargando ? '…' : error ? '—' : item.value.toLocaleString('es-PE')}</p>
                <p className="mt-1 text-xs text-gray-500">Según los filtros seleccionados</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-900">Volumen de requerimientos por subgerencia</h3>
              {cargando ? <p role="status" className="mt-4 text-sm text-gray-500">Cargando solicitudes…</p> : porArea.length ? (
                <div className="mt-4 space-y-4 text-sm">
                  {porArea.map((item) => {
                    const porcentaje = maxSolicitudesArea ? Math.round((item.total / maxSolicitudesArea) * 100) : 0;
                    return (
                      <div key={item.department}>
                        <div className="mb-1 flex justify-between gap-4"><span className="font-semibold text-gray-700">{item.department}</span><span className="font-semibold text-blue-950">{item.total}</span></div>
                        <div role="progressbar" aria-label={`Solicitudes de ${item.department}`} aria-valuemin="0" aria-valuemax={maxSolicitudesArea} aria-valuenow={item.total} className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-blue-950" style={{ width: `${porcentaje}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="mt-4 text-sm text-gray-500">{error ? 'No se pudieron cargar los datos.' : 'No hay solicitudes para los filtros seleccionados.'}</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-900">Tiempo promedio de atención</h3>
              <p className="mt-3 text-3xl font-bold text-blue-950">
                {cargando ? '…' : tiempoPromedio === null ? '—' : `${tiempoPromedio.toLocaleString('es-PE', { maximumFractionDigits: 1 })} días`}
              </p>
              <p className="mt-2 text-sm text-gray-600">Calculado sobre solicitudes con fecha de revisión registradas dentro de los filtros seleccionados.</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b px-5 py-4"><h3 className="font-bold text-gray-900">Detalle de expedientes</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500"><tr>
                  <th scope="col" className="px-4 py-3">Código</th><th scope="col" className="px-4 py-3">Área / puesto</th>
                  <th scope="col" className="px-4 py-3">Estado</th><th scope="col" className="px-4 py-3">Solicitante</th>
                  <th scope="col" className="px-4 py-3">Creación</th><th scope="col" className="px-4 py-3">Atención (días)</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.code}>
                      <td className="px-4 py-3 font-mono font-semibold text-blue-950">{row.code}</td>
                      <td className="px-4 py-3"><span className="font-medium text-gray-900">{row.department}</span><span className="block text-xs text-gray-500">{row.position}</span></td>
                      <td className="px-4 py-3">{estados.find((item) => item.value === row.status)?.label ?? row.status}</td>
                      <td className="px-4 py-3">{row.requested_by}</td>
                      <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString('es-PE')}</td>
                      <td className="px-4 py-3">{row.response_days ?? '—'}</td>
                    </tr>
                  ))}
                  {!cargando && rows.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">{error ? 'No se pudo cargar el detalle.' : 'No hay expedientes para los filtros seleccionados.'}</td></tr>}
                  {cargando && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Cargando detalle…</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
