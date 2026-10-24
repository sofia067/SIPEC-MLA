import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

export default function Trabajadores() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/workers')
      .then(({ workers }) => setTrabajadores(workers.map((worker) => ({
        id: worker.employee_number,
        dni: worker.document_number,
        nombre: worker.full_name,
        gerencia: worker.department,
        puesto: worker.position || 'Sin puesto asignado',
        condicion: 'No especificada',
        estado: worker.status === 'active' ? 'Activo' : 'Inactivo',
      }))))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = trabajadores.filter(t => 
    t.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    t.dni.includes(busqueda) || 
    t.puesto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">
              Padrón General de Personal
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-8 space-y-6">
          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Directorio de Trabajadores</h2>
              <p className="text-xs text-gray-500">Registro unificado del personal de la Municipalidad Distrital de Los Aquijes</p>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Buscar por DNI, nombre o puesto..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="border bg-white px-3 py-2 rounded-lg text-xs w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b pb-2">
                  <th className="pb-3 font-medium">Código</th>
                  <th className="pb-3 font-medium">DNI</th>
                  <th className="pb-3 font-medium">Nombres y Apellidos</th>
                  <th className="pb-3 font-medium">Gerencia / Unidad</th>
                  <th className="pb-3 font-medium">Puesto Actual</th>
                  <th className="pb-3 font-medium">Condición</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-bold text-blue-950">{t.id}</td>
                    <td className="py-3 text-gray-600 font-mono">{t.dni}</td>
                    <td className="py-3 font-semibold text-gray-900">{t.nombre}</td>
                    <td className="py-3 text-gray-600">{t.gerencia}</td>
                    <td className="py-3 text-gray-800 font-medium">{t.puesto}</td>
                    <td className="py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.condicion}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => navigate(`/trabajadores/expediente`)} 
                        className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver Expediente
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && filtrados.length === 0 && (
                  <tr><td colSpan="8" className="py-6 text-center text-gray-500">
                    {error ? 'No se pudieron cargar los trabajadores.' : 'No hay trabajadores registrados.'}
                  </td></tr>
                )}
                {cargando && <tr><td colSpan="8" className="py-6 text-center text-gray-500">Cargando trabajadores...</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}