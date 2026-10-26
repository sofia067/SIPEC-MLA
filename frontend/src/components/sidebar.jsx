 import React, { useState } from 'react';
 import { NavLink, useNavigate } from 'react-router-dom';
 import { apiRequest } from '../lib/api';

 const enlaces = [
   { ruta: '/dashboard', icono: '🏚️', texto: 'Inicio', exacto: true },
   { ruta: '/trabajadores', icono: '👥', texto: 'Trabajadores' },
   { ruta: '/perfil-puesto', icono: '📄', texto: 'Perfiles de puesto' },
   { ruta: '/solicitudes-cobertura', icono: '📑', texto: 'Solicitudes de cobertura' },
   { ruta: '/candidatos-compatibles', icono: '🎯', texto: 'Candidatos compatibles' },
   { ruta: '/validacion-ocr', icono: '🛡️', texto: 'Validación documental' },
   { ruta: '/evaluacion', icono: '📝', texto: 'Evaluación' },
   { ruta: '/informes', icono: '📊', texto: 'Reportes' },
   { ruta: '/auditoria', icono: '🔒', texto: 'Auditoría' },
   { ruta: '/configuracion', icono: '⚙️', texto: 'Configuración' },
 ];

 export default function Sidebar() {
   const navigate = useNavigate();
   const [logoutError, setLogoutError] = useState('');

   const cerrarSesion = async () => {
     setLogoutError('');
     try {
       await apiRequest('/auth/logout', { method: 'POST' });
       navigate('/');
     } catch (error) {
       setLogoutError(error.message);
     }
   };

   return (
     <aside className="w-64 bg-blue-950 text-white flex flex-col justify-between shrink-0">
       <div>
         <div className="p-4 flex items-center gap-3 border-b border-blue-900">
           <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
           <div>
            <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
            <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="p-3 space-y-1.5 text-sm">
          {enlaces.map(({ ruta, icono, texto, exacto }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={exacto}
              className={({ isActive }) => `w-full text-left py-2.5 px-3 rounded flex items-center gap-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isActive
                  ? 'bg-blue-900 font-bold text-blue-100'
                  : 'hover:bg-blue-900/50 font-medium text-gray-200'
              }`}
            >
              <span aria-hidden="true" className="text-base">{icono}</span>
              {texto}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-blue-900">
        {logoutError && <p role="alert" className="mb-2 text-xs text-red-300">{logoutError}</p>}
        <button 
          onClick={cerrarSesion}
          className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ❌ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}