 import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function PerfilPuesto() {
  const navigate = useNavigate();

  // Estado para filtrar por área u órgano municipal
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Datos de ejemplo basados en el organigrama oficial
  const perfiles = [
    {
      id: 1,
      puesto: 'Subgerente de Fiscalización y Ejecución Coactiva',
      area: 'Gerencia de Administración Tributaria',
      nivel: 'Directivo / Jefatura',
      requisitos: 'Título profesional en Derecho o Contabilidad, colegiado y habilitado. Exp. 3 años.',
      estado: 'Activo'
    },
    {
      id: 2,
      puesto: 'Técnico de Fiscalización',
      area: 'Gerencia de Administración Tributaria',
      nivel: 'Técnico Operativo',
      requisitos: 'Técnico Superior o Bachiller en Administración/Derecho. Exp. 1 año en fiscalización.',
      estado: 'Activo'
    },
    {
      id: 3,
      puesto: 'Especialista en Tecnologías de Información',
      area: 'Oficina de Administración y Finanzas',
      nivel: 'Profesional',
      requisitos: 'Ingeniero de Sistemas o Informática. Conocimiento en React, BD y redes. Exp. 2 años.',
      estado: 'Activo'
    },
    {
      id: 4,
      puesto: 'Especialista en Gestión Ambiental',
      area: 'Gerencia de Servicios Municipales y Gestión Ambiental',
      nivel: 'Profesional',
      requisitos: 'Ingeniero Ambiental o Sanitario. Experiencia en residuos sólidos y fiscalización ambiental.',
      estado: 'Activo'
    }
  ];

  // Filtrado dinámico
  const perfilesFiltrados = perfiles.filter(p => {
    const coincideArea = areaFiltro === 'Todas' || p.area === areaFiltro;
    const coincideBusqueda = p.puesto.toLowerCase().includes(busqueda.toLowerCase()) || 
                             p.requisitos.toLowerCase().includes(busqueda.toLowerCase());
    return coincideArea && coincideBusqueda;
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar reutilizado */}
      <Sidebar />

      {/* Contenido Central */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">Perfiles de Puesto</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-500 text-base">🔔</button>
            <UserDropdown />
          </div>
        </header>

        {/* Panel Principal */}
        <main className="p-8 space-y-6">
          
         
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Perfiles de Puesto</h2>
              <p className="text-sm text-gray-500">Gestión de requerimientos y funciones por unidad orgánica</p>
            </div>
            
            <button 
              onClick={() => alert("Función para crear nuevo perfil")}
              className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>➕</span> Nuevo Perfil de Puesto
            </button>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-1/2">
              <input 
                type="text"
                placeholder="Buscar por puesto o requisitos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="w-full md:w-1/3 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 shrink-0">Gerencia / Área:</label>
              <select 
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="Todas">Todas las Gerencias</option>
                <option value="Gerencia de Administración Tributaria">G. Administración Tributaria</option>
                <option value="Oficina de Administración y Finanzas">Of. Administración y Finanzas</option>
                <option value="Gerencia de Servicios Municipales y Gestión Ambiental">G. Servicios Municipales</option>
                <option value="Gerencia de Desarrollo Territorial e Infraestructura">G. Desarrollo Territorial</option>
                <option value="Gerencia de Desarrollo Social">G. Desarrollo Social</option>
              </select>
            </div>
          </div>

          {/* Tabla de Perfiles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Puesto</th>
                  <th className="py-3 px-4">Área / Gerencia</th>
                  <th className="py-3 px-4">Nivel</th>
                  <th className="py-3 px-4">Requisitos Principales</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perfilesFiltrados.length > 0 ? (
                  perfilesFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{p.puesto}</td>
                      <td className="py-3.5 px-4 text-gray-600">{p.area}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded text-xs">
                          {p.nivel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate" title={p.requisitos}>
                        {p.requisitos}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full text-xs">
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center space-x-2">
                        <button onClick={() => navigate('/perfil-puesto/detalle')}
                         className="text-blue-900 hover:text-blue-700 font-medium text-x flex items-center justify-center gap-1 mx-auto">👁️ Ver</button>
                        <button className="text-amber-600 hover:text-amber-800 font-medium text-xs">✏️ Editar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500">
                      No se encontraron perfiles para los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </div>
  );
}