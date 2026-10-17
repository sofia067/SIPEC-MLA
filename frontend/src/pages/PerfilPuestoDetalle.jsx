import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';

export default function PerfilPuestoDetalle() {
  const navigate = useNavigate();
  
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState('requisitos');
  
  // Estado para activar/desactivar el modo edición
  const [modoEdicion, setModoEdicion] = useState(false);

  
  const [datosPerfil, setDatosPerfil] = useState({
    puesto: 'Técnico de Fiscalización',
    area: 'Gerencia de Administración Tributaria',
    nivel: 'Técnico Operativo',
    codigo: 'PUE-GAT-002',
    estado: 'Activo',
    // Información General
    mision: 'Ejecutar las acciones de fiscalización tributaria y administrativa en el distrito para verificar el cumplimiento de las ordenanzas municipales.',
    reportaA: 'Subgerente de Fiscalización y Ejecución Coactiva',
    supervisaA: 'Ninguno',
    // Requisitos
    formacion: 'Técnico o universitario en Administración, Derecho, Ingeniería o afines.',
    experiencia: '1 año en funciones similares de fiscalización en sector público o privado.',
    conocimientos: 'Normas municipales, procedimientos sancionadores, Ley de Procedimiento Administrativo General (LPAG).',
    otrosRequisitos: 'Manejo de MS Office a nivel usuario y disponibilidad para trabajo de campo.',
    // Responsabilidades
    responsabilidades: [
      'Realizar inspecciones de campo para verificar licencias de funcionamiento y tributos municipales.',
      'Redactar actas de fiscalización, papeletas de infracción y reportes técnicos.',
      'Notificar resoluciones y documentos administrativos a los contribuyentes del distrito.',
      'Atender denuncias vecinales relacionadas con infracciones a las normas municipales.'
    ]
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar reutilizado */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600">🔔</button>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                CR
              </div>
              <div className="text-left leading-tight">
                <p className="font-semibold text-gray-800">Carlos Ramírez</p>
                <p className="text-xs text-gray-500">Jefe de Área</p>
              </div>
            </div>
          </div>
        </header>

        {/* Panel Ficha de Perfil */}
        <main className="p-8 space-y-6">
          {/* Botón de volver */}
          <button 
            onClick={() => navigate('/perfil-puesto')} 
            className="text-xs font-semibold text-gray-500 hover:text-blue-900 flex items-center gap-1 transition-colors"
          >
            ← Volver a la lista
          </button>

          {/* Header y botón de Edición */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{datosPerfil.puesto}</h2>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {datosPerfil.estado}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Área: {datosPerfil.area}</p>
            </div>

            {/* Botones para editar */}
            <div className="flex gap-2">
              <button 
                onClick={() => setModoEdicion(!modoEdicion)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  modoEdicion 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {modoEdicion ? '🔓 Modo Edición Activo' : '✏️ Editar Perfil'}
              </button>
              {modoEdicion && (
                <button 
                  onClick={() => {
                    setModoEdicion(false);
                    alert("Cambios guardados localmente");
                  }}
                  className="text-xs font-semibold px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  💾 Guardar
                </button>
              )}
            </div>
          </div>

          {/* Pestañas de Navegación */}
          <div className="border-b border-gray-200 flex gap-8 text-sm">
            <button 
              onClick={() => setActiveTab('general')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'general' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Información general
            </button>
            <button 
              onClick={() => setActiveTab('requisitos')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'requisitos' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Requisitos y competencias
            </button>
            <button 
              onClick={() => setActiveTab('responsabilidades')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'responsabilidades' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Responsabilidades
            </button>
          </div>

          {/* secciones de navegacion segun activacion */}

          {/* Informacion general */}
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Estructura Organizacional y Misión</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-600 block">Código del Puesto:</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.codigo}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Nivel Organizacional:</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.nivel}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Unidad Orgánica:</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.area}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="font-semibold text-gray-600 block">Dependencia Jerárquica (Reporta a):</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.reportaA}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Personal a Cargo (Supervisa a):</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.supervisaA}</p>
                </div>
              </div>

              <div className="text-xs pt-2">
                <label className="font-semibold text-gray-600 block mb-1">Misión del Puesto:</label>
                {modoEdicion ? (
                  <textarea 
                    value={datosPerfil.mision}
                    onChange={(e) => setDatosPerfil({...datosPerfil, mision: e.target.value})}
                    className="w-full border border-amber-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed">
                    {datosPerfil.mision}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Requisitos y Competencias */}
          {activeTab === 'requisitos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna de Requisitos */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Requisitos Mínimos Exigidos</h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>🎓</span> Formación académica
                    </div>
                    {modoEdicion ? (
                      <input 
                        type="text" 
                        value={datosPerfil.formacion} 
                        onChange={(e) => setDatosPerfil({...datosPerfil, formacion: e.target.value})}
                        className="w-full mt-1 border border-amber-400 p-2 rounded focus:outline-none text-xs"
                      />
                    ) : (
                      <p className="text-gray-600 mt-1 pl-6">{datosPerfil.formacion}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>💼</span> Experiencia mínima
                    </div>
                    {modoEdicion ? (
                      <input 
                        type="text" 
                        value={datosPerfil.experiencia} 
                        onChange={(e) => setDatosPerfil({...datosPerfil, experiencia: e.target.value})}
                        className="w-full mt-1 border border-amber-400 p-2 rounded focus:outline-none text-xs"
                      />
                    ) : (
                      <p className="text-gray-600 mt-1 pl-6">{datosPerfil.experiencia}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>📚</span> Conocimientos técnicos
                    </div>
                    {modoEdicion ? (
                      <textarea 
                        value={datosPerfil.conocimientos} 
                        onChange={(e) => setDatosPerfil({...datosPerfil, conocimientos: e.target.value})}
                        className="w-full mt-1 border border-amber-400 p-2 rounded focus:outline-none text-xs"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-600 mt-1 pl-6">{datosPerfil.conocimientos}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>⚙️</span> Otros requisitos
                    </div>
                    {modoEdicion ? (
                      <input 
                        type="text" 
                        value={datosPerfil.otrosRequisitos} 
                        onChange={(e) => setDatosPerfil({...datosPerfil, otrosRequisitos: e.target.value})}
                        className="w-full mt-1 border border-amber-400 p-2 rounded focus:outline-none text-xs"
                      />
                    ) : (
                      <p className="text-gray-600 mt-1 pl-6">{datosPerfil.otrosRequisitos}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna de Competencias */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Competencias Requeridas</h3>

                <div className="space-y-3 text-xs">
                  {[
                    { nombre: 'Atención al ciudadano', nivel: 'Nivel 3' },
                    { nombre: 'Análisis y evaluación', nivel: 'Nivel 3' },
                    { nombre: 'Comunicación efectiva', nivel: 'Nivel 3' },
                    { nombre: 'Trabajo en equipo', nivel: 'Nivel 2' },
                    { nombre: 'Ética e integridad', nivel: 'Nivel 3' },
                  ].map((comp, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700 font-medium">🎯 {comp.nombre}</span>
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {comp.nivel}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-gray-500 italic">
                  Nivel mínimo requerido: 70% de cumplimiento global.
                </div>
              </div>
            </div>
          )}

          {/* Responsanilidades*/}
          {activeTab === 'responsabilidades' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-gray-800 text-sm">Funciones y Responsabilidades Principales</h3>
                {modoEdicion && (
                  <button 
                    onClick={() => {
                      const nueva = prompt("Escribe la nueva responsabilidad:");
                      if (nueva) setDatosPerfil({...datosPerfil, responsabilidades: [...datosPerfil.responsabilidades, nueva]});
                    }}
                    className="text-xs text-blue-900 font-bold hover:underline"
                  >
                    ➕ Agregar función
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {datosPerfil.responsabilidades.map((resp, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="bg-blue-950 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 leading-relaxed flex-1">{resp}</p>
                    {modoEdicion && (
                      <button 
                        onClick={() => {
                          const filtradas = datosPerfil.responsabilidades.filter((_, i) => i !== index);
                          setDatosPerfil({...datosPerfil, responsabilidades: filtradas});
                        }}
                        className="text-red-500 font-bold hover:text-red-700"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}