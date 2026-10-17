 import React from 'react';
import { useNavigate } from 'react-router-dom'; 

export default function Sidebar() {
  const navigate = useNavigate(); 

  return ( 
    <aside className="w-64 bg-blue-950 text-white flex flex-col justify-between shrink-0">
      <div>
        {/* Logo del Sidebar */}
        <div className="p-4 flex items-center gap-3 border-b border-blue-900">
          <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
          <div>
            <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
            <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
          </div>
        </div>

        {/* Menú  */}
        <nav className="p-3 space-y-1.5 text-sm">
          <button onClick={() => navigate('/dashboard')} className="w-full text-left py-2.5 px-3 rounded bg-blue-900 font-bold flex items-center gap-3 text-blue-100">
            <span className="text-base">🏚️</span> Inicio
          </button>
          <button onClick={() => navigate('/trabajadores')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">👥</span> Trabajadores
          </button>
          <button onClick={() => navigate('/perfil-puesto')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">📄</span> Perfiles de puesto
          </button>
          <button onClick={() => navigate('/solicitudes-cobertura')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">📑</span> Solicitudes de cobertura
          </button>
          <button onClick={() => navigate('/candidatos-compatibles')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">🎯</span> Candidatos compatibles
           </button>
          <button onClick={() => navigate('/validacion-ocr')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">🛡️</span> Validación documental
          </button>
          <button onClick={() => navigate('/evaluacion')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">📝</span> Evaluacion
          </button>
          <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">📊</span> Reportes
          </button>
          <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">🔒</span> Auditoría
          </button>
          <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
            <span className="text-base">⚙️</span> Configuración
          </button>
        </nav>
      </div>

      {/* Botón Salir */}
      <div className="p-3 border-t border-blue-900">
        <button 
          onClick={() => navigate('/')} 
          className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2 transition-colors"
        >
          ❌ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}