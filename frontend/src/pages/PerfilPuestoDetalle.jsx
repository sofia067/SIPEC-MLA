import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';

export default function PerfilPuestoDetalle() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requisitos');

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header Superior */}
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
          {/* Botón Volver */}
          <button 
            onClick={() => navigate('/perfil-puesto')} 
            className="text-xs font-semibold text-gray-500 hover:text-blue-900 flex items-center gap-1"
          >
            ← Volver
          </button>

          {/* Título de la Ficha */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Técnico de Fiscalización</h2>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Activo
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Área: Fiscalización</p>
            </div>
          </div>

          {/* Pestañas de Navegación */}
          <div className="border-b border-gray-200 flex gap-8 text-sm">
            <button 
              onClick={() => setActiveTab('general')}
              className={`pb-3 font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Información general
            </button>
            <button 
              onClick={() => setActiveTab('requisitos')}
              className={`pb-3 font-medium ${activeTab === 'requisitos' ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Requisitos y competencias
            </button>
            <button 
              onClick={() => setActiveTab('responsabilidades')}
              className={`pb-3 font-medium ${activeTab === 'responsabilidades' ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Responsabilidades
            </button>
          </div>

          {/* Contenido de 2 Columnas (Requisitos y Competencias) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Columna Izquierda: Requisitos mínimos */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 text-sm">Requisitos mínimos</h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span>🎓</span> Formación académica
                  </div>
                  <p className="text-gray-500 mt-1 pl-6">
                    Técnico o universitario en Administración, Derecho, Ingeniería o afines.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span>💼</span> Experiencia mínima
                  </div>
                  <p className="text-gray-500 mt-1 pl-6">
                    1 año en funciones similares.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span>📚</span> Conocimientos técnicos
                  </div>
                  <p className="text-gray-500 mt-1 pl-6">
                    Normas municipales, procedimientos de fiscalización, redacción de informes.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span>⚙️</span> Otros requisitos
                  </div>
                  <p className="text-gray-500 mt-1 pl-6">
                    Manejo de herramientas ofimáticas.
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Competencias requeridas */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Competencias requeridas</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🎯</span>
                    <span className="text-gray-700">Atención al ciudadano</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Nivel 3
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📊</span>
                    <span className="text-gray-700">Análisis y evaluación</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Nivel 3
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">💬</span>
                    <span className="text-gray-700">Comunicación efectiva</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Nivel 3
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">👥</span>
                    <span className="text-gray-700">Trabajo en equipo</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Nivel 2
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🛡️</span>
                    <span className="text-gray-700">Ética e integridad</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Nivel 3
                  </span>
                </div>
              </div>

              {/* Nota inferior de cumplimiento */}
              <div className="pt-2 text-[11px] text-gray-500 italic">
                Nivel mínimo requerido: 70% de cumplimiento
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}