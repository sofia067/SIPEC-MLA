import React from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function Informes() {
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

          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Datos de demostración. Se reemplazarán por información del backend al conectar la API.
          </div>

          <section aria-label="Indicadores de demostración" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Tiempo promedio de cobertura</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">3.5 días</h3>
              <p className="text-xs text-gray-500 mt-1">Valor de ejemplo</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Coincidencia de perfiles</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">94.2%</h3>
              <p className="text-xs text-gray-500 mt-1">Valor de ejemplo</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Documentos validados con OCR</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">128</h3>
              <p className="text-xs text-gray-500 mt-1">Valor de ejemplo</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Solicitudes registradas</p>
              <h3 className="text-2xl font-bold text-blue-950 mt-2">20</h3>
              <p className="text-xs text-gray-500 mt-1">Valor de ejemplo</p>
            </div>
          </section>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Solicitudes por gerencia</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 mb-1">
                  <span className="font-semibold text-gray-700">Gerencia de Administración Tributaria</span>
                  <span className="font-semibold text-blue-950">12 solicitudes</span>
                </div>
                <div role="progressbar" aria-label="Solicitudes de la Gerencia de Administración Tributaria" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60" className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-950 h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 mb-1">
                  <span className="font-semibold text-gray-700">Gerencia de Servicios Municipales y Gestión Ambiental</span>
                  <span className="font-semibold text-blue-950">8 solicitudes</span>
                </div>
                <div role="progressbar" aria-label="Solicitudes de la Gerencia de Servicios Municipales y Gestión Ambiental" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-800 h-full rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}