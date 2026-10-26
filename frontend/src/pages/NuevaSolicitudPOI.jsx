import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import Sidebar from '../components/sidebar'; 
import UserDropdown from '../components/UserDropdown';

export default function NuevaSolicitudPOI() {
  // 2. Declaro los hoks obligatorios
  const navigate = useNavigate();

  // Estados opcionales para capturar los datos del formulario
  const [formData, setFormData] = useState({
    area: 'Fiscalización',
    puesto: 'Técnico de Fiscalización',
    motivo: 'Permiso / Ausencia',
    descripcion: '',
    fechaInicio: '2026-08-02',
    fechaFin: '2026-08-16',
    prioridad: 'Alta'
  });
return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* sidebar reutilizado*/}
      <Sidebar />

      {/* Area central */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Boton de volver y drow menu */}
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-950 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-4">
            <button className="text-gray-500 text-base">🔔</button>
            {/* Reutilizo el drow menu */}
            <UserDropdown />
          </div>
        </header>
        {/*  Formulario y cuadro de resumen  */}
        <main className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Nueva solicitud de cobertura</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formulario */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Área solicitante</label>
                  <select 
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option>Fiscalización</option>
                    <option>Tecnologías de Información</option>
                    <option>Asesoría Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Puesto a cubrir</label>
                  <select 
                    value={formData.puesto}
                    onChange={(e) => setFormData({...formData, puesto: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option>Técnico de Fiscalización</option>
                    <option>Analista de Sistemas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo de la solicitud</label>
                <select 
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option>Permiso / Ausencia</option>
                  <option>Nueva Plaza</option>
                  <option>Reemplazo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea 
                  rows="3" 
                  placeholder="Trabajador Titular con descanso médico por 15 días."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de inicio requerida</label>
                  <input 
                    type="date" 
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de fin estimada</label>
                  <input 
                    type="date" 
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
                  <select 
                    value={formData.prioridad}
                    onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Tarjeta dinamica de resumen */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-base border-b pb-2 mb-4">Resumen</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600"><strong className="text-gray-800">Puesto:</strong> {formData.puesto}</p>
                  <p className="text-gray-600"><strong className="text-gray-800">Área:</strong> {formData.area}</p>
                  <p className="text-gray-600"><strong className="text-gray-800">Motivo:</strong> {formData.motivo}</p>
                  <p className="text-gray-600"><strong className="text-gray-800">Inicio:</strong> {formData.fechaInicio}</p>
                  <p className="text-gray-600"><strong className="text-gray-800">Fin estimada:</strong> {formData.fechaFin}</p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Prioridad: </strong> 
                    <span className={formData.prioridad === 'Alta' ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                      {formData.prioridad}
                    </span>
                  </p>
                </div>
              </div>
              {/* Botones de accion*/}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-1/2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => { alert("Solicitud guardada con éxito"); navigate('/dashboard'); }}
                  className="w-1/2 bg-blue-950 hover:bg-blue-900 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Guardar solicitud
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}