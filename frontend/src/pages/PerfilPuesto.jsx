 import React, { useEffect, useState } from 'react';
 import Sidebar from '../components/sidebar';
 import UserDropdown from '../components/UserDropdown';
 import { apiRequest } from '../lib/api';
 import PerfilPuestoDetalle from './PerfilPuestoDetalle';

const crearNuevoPuesto = () => ({
  puesto: '',
  area: '',
  nivel: 'Profesional',
  codigo: '',
  remuneracion: '',
  mision: '',
  formacion: '',
  experienciaGeneral: '',
  experienciaEspecifica: '',
  conocimientos: '',
  competencias: '',
  funciones: '',
});

const convertirLineas = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const crearRequisitosPrincipales = (profile) => [
  profile.formacion && `Formación académica: ${profile.formacion}`,
  profile.experienciaGeneral && `Experiencia general: ${profile.experienciaGeneral}`,
  profile.experienciaEspecifica && `Experiencia específica: ${profile.experienciaEspecifica}`,
  profile.conocimientos.length && `Conocimientos técnicos:\n${profile.conocimientos.map((item) => `- ${item}`).join('\n')}`,
].filter(Boolean).join('\n\n');

export default function PerfilPuesto() {
  // Estados para filtros
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Estado del formulario de creación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

  // Estado del formulario para el nuevo puesto
  const [nuevoPuesto, setNuevoPuesto] = useState(crearNuevoPuesto);

  // Lista de perfiles iniciales
  const [perfiles, setPerfiles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarPerfiles = async () => {
    setCargando(true);
    try {
      const [{ profiles }, lookups] = await Promise.all([
        apiRequest('/profiles'),
        apiRequest('/lookups'),
      ]);
      setAreas(lookups.departments);
      setPerfiles(profiles.map((profile) => ({
        ...profile,
        id: profile.id,
        puesto: profile.title || '',
        area: profile.department || '',
        nivel: profile.level || 'Profesional',
        codigo: profile.profile_code || '',
        remuneracion: profile.reference_salary || 0,
        mision: profile.description || '',
        formacion: profile.academic_formation || '',
        experienciaGeneral: profile.general_experience || '',
        experienciaEspecifica: profile.specific_experience || '',
        conocimientos: Array.isArray(profile.technical_knowledge) ? profile.technical_knowledge : [],
        competencias: Array.isArray(profile.competencies) ? profile.competencies : [],
        funciones: Array.isArray(profile.responsibilities) ? profile.responsibilities : [],
        requisitos: profile.principal_requirements || '',
        estado: profile.status === 'active' ? 'Activo' : 'Inactivo',
      })));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfiles();
  }, []);

  useEffect(() => {
    if (!perfilSeleccionado) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setPerfilSeleccionado(null);
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [perfilSeleccionado]);

  // Manejador para guardar el nuevo puesto
  const handleGuardarPuesto = async (e) => {
    e.preventDefault();
    if (!nuevoPuesto.puesto.trim() || !nuevoPuesto.area.trim()) {
      setError('Completa el nombre del puesto y la gerencia o unidad orgánica.');
      return;
    }

    const conocimientos = convertirLineas(nuevoPuesto.conocimientos);
    const perfil = {
      title: nuevoPuesto.puesto.trim(),
      department: nuevoPuesto.area.trim(),
      level: nuevoPuesto.nivel,
      profileCode: nuevoPuesto.codigo.trim(),
      referenceSalary: nuevoPuesto.remuneracion === '' ? null : Number(nuevoPuesto.remuneracion),
      academicFormation: nuevoPuesto.formacion.trim(),
      generalExperience: nuevoPuesto.experienciaGeneral.trim(),
      specificExperience: nuevoPuesto.experienciaEspecifica.trim(),
      technicalKnowledge: conocimientos,
      responsibilities: convertirLineas(nuevoPuesto.funciones),
      principalRequirements: crearRequisitosPrincipales({
        formacion: nuevoPuesto.formacion.trim(),
        experienciaGeneral: nuevoPuesto.experienciaGeneral.trim(),
        experienciaEspecifica: nuevoPuesto.experienciaEspecifica.trim(),
        conocimientos,
      }),
      description: nuevoPuesto.mision.trim(),
      status: 'active',
      competencies: convertirLineas(nuevoPuesto.competencias).map((name) => ({ name, description: '' })),
    };

    try {
      await apiRequest('/profiles', {
        method: 'POST',
        body: JSON.stringify(perfil),
      });
      setMostrarModal(false);
      setNuevoPuesto(crearNuevoPuesto());
      await cargarPerfiles();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  // Filtrado de perfiles
  const perfilesFiltrados = perfiles.filter(p => {
    const coincideArea = areaFiltro === 'Todas' || p.area === areaFiltro;
    const coincideBusqueda = p.puesto.toLowerCase().includes(busqueda.toLowerCase()) ||
                             (p.requisitos || '').toLowerCase().includes(busqueda.toLowerCase());
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

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            {/* Botón para abrir el Modal */}
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
                {[...new Set(perfiles.map((profile) => profile.area))].filter(Boolean).map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
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
                        type="button"
                        onClick={() => setPerfilSeleccionado(p)}
                        className="text-blue-900 hover:text-blue-700 font-semibold text-xs flex items-center justify-center gap-1 mx-auto bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>👁️</span> Ver ficha
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && perfilesFiltrados.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-gray-500">No hay perfiles registrados.</td></tr>
                )}
                {cargando && (
                  <tr><td colSpan="6" className="py-8 text-center text-gray-500">Cargando perfiles…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal de formulario para el nuevo perfil */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Nombre del puesto *</label>
                  <input type="text" required placeholder="Ej. Inspector Tributario"
                    value={nuevoPuesto.puesto}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, puesto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Gerencia / unidad orgánica *</label>
                  <select required value={nuevoPuesto.area}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900">
                    <option value="">Selecciona un área orgánica</option>
                    {areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Código del puesto</label>
                  <input value={nuevoPuesto.codigo}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, codigo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Nivel organizacional</label>
                  <input value={nuevoPuesto.nivel}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, nivel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Remuneración referencial (S/)</label>
                  <input type="number" min="0" step="0.01" value={nuevoPuesto.remuneracion}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, remuneracion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Formación académica</label>
                  <textarea rows={2} value={nuevoPuesto.formacion}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, formacion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Experiencia general</label>
                  <textarea rows={2} value={nuevoPuesto.experienciaGeneral}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, experienciaGeneral: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Experiencia específica</label>
                  <textarea rows={2} value={nuevoPuesto.experienciaEspecifica}
                    onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, experienciaEspecifica: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Misión del puesto</label>
                <textarea rows={2} value={nuevoPuesto.mision}
                  onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, mision: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Conocimientos técnicos / certificaciones</label>
                <textarea rows={3} placeholder="Un conocimiento o certificación por línea" value={nuevoPuesto.conocimientos}
                  onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, conocimientos: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Competencias requeridas</label>
                <textarea rows={3} placeholder="Una competencia por línea" value={nuevoPuesto.competencias}
                  onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, competencias: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Funciones / responsabilidades</label>
                <textarea rows={4} placeholder="Una función o responsabilidad por línea" value={nuevoPuesto.funciones}
                  onChange={(e) => setNuevoPuesto({ ...nuevoPuesto, funciones: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900" />
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

      {perfilSeleccionado && (
        <PerfilPuestoDetalle
          profile={perfilSeleccionado}
          onClose={() => setPerfilSeleccionado(null)}
        />
      )}

    </div>
  );
}