 import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function PerfilPuesto() {
  const navigate = useNavigate();

  // Estados para filtros
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Estado del Modal de Creación
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estado del formulario para el nuevo puesto
  const [nuevoPuesto, setNuevoPuesto] = useState({
    puesto: '',
    area: 'Gerencia de Administración Tributaria',
    nivel: 'Profesional',
    requisitos: '',
    estado: 'Activo'
  });

  // Lista de perfiles iniciales
  const [perfiles, setPerfiles] = useState([
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
  ]);

  // Manejador para guardar el nuevo puesto
  const handleGuardarPuesto = (e) => {
    e.preventDefault();
    if (!nuevoPuesto.puesto || !nuevoPuesto.requisitos) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const nuevoRegistro = {
      id: perfiles.length + 1,
      ...nuevoPuesto
    };

    setPerfiles([nuevoRegistro, ...perfiles]);
    setMostrarModal(false);
    setNuevoPuesto({
      puesto: '',
      area: 'Gerencia de Administración Tributaria',
      nivel: 'Profesional',
      requisitos: '',
      estado: 'Activo'
    });
  };

  // Filtrado de perfiles
  const perfilesFiltrados = perfiles.filter(p => {
    const coincideArea = areaFiltro === 'Todas' || p.area === areaFiltro;
    const coincideBusqueda = p.puesto.toLowerCase().includes(busqueda.toLowerCase()) || 
                             p.requisitos.toLowerCase().includes(busqueda.toLowerCase());
    return coincideArea && coincideBusqueda;
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      <Sidebar />

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
            
            {/* Botón que abre el Modal */}
            <button 
              onClick={() => setMostrarModal(true)}
              className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>➕</span> Nuevo Perfil de Puesto
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-1/2">
              <input 
                type="text"
                placeholder="Buscar por puesto o requisitos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="w-full md:w-1/3 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 shrink-0">Gerencia / Área:</label>
              <select 
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="Todas">Todas las Gerencias</option>
                <option value="Gerencia de Administración Tributaria">G. Administración Tributaria</option>
                <option value="Oficina de Administración y Finanzas">Of. Administración y Finanzas</option>
                <option value="Gerencia de Servicios Municipales y Gestión Ambiental">G. Servicios Municipales</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Puesto</th>
                  <th className="py-3 px-4">Área / Gerencia</th>
                  <th className="py-3 px-4">Nivel</th>
                  <th className="py-3 px-4">Requisitos Principales</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perfilesFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{p.puesto}</td>
                    <td className="py-3.5 px-4 text-gray-600">{p.area}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded text-[11px]">
                        {p.nivel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">{p.requisitos}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full text-[11px]">
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => navigate('/perfil-puesto/detalle')} 
                        className="text-blue-900 hover:text-blue-700 font-semibold text-xs flex items-center justify-center gap-1 mx-auto bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>👁️</span> Ver ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* MODAL FORMULARIO DE NUEVO PERFIL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-base">Registrar Nuevo Perfil de Puesto</h3>
              <button 
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarPuesto} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre del Puesto *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Inspector Tributario"
                  value={nuevoPuesto.puesto}
                  onChange={(e) => setNuevoPuesto({...nuevoPuesto, puesto: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Gerencia / Unidad Orgánica</label>
                <select 
                  value={nuevoPuesto.area}
                  onChange={(e) => setNuevoPuesto({...nuevoPuesto, area: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Gerencia de Administración Tributaria">Gerencia de Administración Tributaria</option>
                  <option value="Oficina de Administración y Finanzas">Oficina de Administración y Finanzas</option>
                  <option value="Gerencia de Servicios Municipales y Gestión Ambiental">Gerencia de Servicios Municipales</option>
                  <option value="Gerencia de Desarrollo Social y Económico">Gerencia de Desarrollo Social y Económico</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nivel Organizacional</label>
                <select 
                  value={nuevoPuesto.nivel}
                  onChange={(e) => setNuevoPuesto({...nuevoPuesto, nivel: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Directivo / Jefatura">Directivo / Jefatura</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Técnico Operativo">Técnico Operativo</option>
                  <option value="Auxiliar">Auxiliar</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Requisitos Principales *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Ej. Bachiller en Derecho o Administración. Experiencia mínima de 1 año..."
                  value={nuevoPuesto.requisitos}
                  onChange={(e) => setNuevoPuesto({...nuevoPuesto, requisitos: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-semibold rounded-lg shadow-sm"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}