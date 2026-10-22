import React, { useMemo, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function Auditoria() {
  const [busqueda, setBusqueda] = useState('');
  const registros = [
    { id: 'LOG-8902', usuario: 'admin_rrhh', accion: 'Creación de Solicitud de Cobertura', modulo: 'Solicitudes', fecha: '15/10/2026 14:22', ip: '192.168.1.45' },
    { id: 'LOG-8901', usuario: 'jefe_fiscalizacion', accion: 'Consulta de Candidatos Compatibles (Ciego)', modulo: 'Match Engine', fecha: '15/10/2026 11:05', ip: '192.168.1.12' },
    { id: 'LOG-8900', usuario: 'admin_rrhh', accion: 'Validación OCR de Certificado Técnico', modulo: 'OCR', fecha: '14/10/2026 16:40', ip: '192.168.1.45' },
    { id: 'LOG-8899', usuario: 'm_valencia', accion: 'Aprobación de Asignación de Puesto', modulo: 'Evaluaciones', fecha: '14/10/2026 09:15', ip: '192.168.1.88' },
  ];
  const registrosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');

    if (!termino) return registros;

    return registros.filter((registro) =>
      [registro.id, registro.usuario, registro.accion, registro.modulo, registro.fecha]
        .some((valor) => valor.toLocaleLowerCase('es').includes(termino))
    );
  }, [busqueda]);

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

          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Registros de demostración. La auditoría real debe cargarse desde el backend y protegerse según permisos.
          </div>

          <section aria-label="Registros de auditoría" className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
              <label className="w-full sm:max-w-sm">
                <span className="sr-only">Buscar registros</span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar por usuario, acción o módulo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm border-collapse">
              <caption className="sr-only">Eventos de auditoría de ejemplo</caption>
              <thead>
                <tr className="text-gray-400 border-b pb-2">
                  <th scope="col" className="pb-3 pr-4 font-medium">ID de evento</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Usuario</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Acción</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Módulo</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Fecha y hora</th>
                  <th scope="col" className="pb-3 font-medium">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrosFiltrados.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-semibold text-blue-950">{r.id}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{r.usuario}</td>
                    <td className="py-3 pr-4 text-gray-700">{r.accion}</td>
                    <td className="py-3 pr-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">{r.modulo}</span></td>
                    <td className="py-3 pr-4 text-gray-600">{r.fecha}</td>
                    <td className="py-3 font-mono text-gray-600">{r.ip}</td>
                  </tr>
                ))}
                {registrosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No se encontraron registros que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            <p className="text-sm text-gray-500" aria-live="polite">
              {registrosFiltrados.length} {registrosFiltrados.length === 1 ? 'registro' : 'registros'}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}