 import React, { useState } from 'react';
 import { NavLink, useNavigate } from 'react-router-dom';
 import { useAuth } from '../auth/AuthContext';

const ADMIN = 'admin';
const RRHH = 'hr_specialist';
const JEFE = 'area_manager';
const COMITE = 'committee';

const enlaces = [
  { ruta: '/dashboard', icono: '🏚️', texto: 'Inicio' },
  { ruta: '/trabajadores', icono: '👥', texto: 'Trabajadores', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/perfil-puesto', icono: '📄', texto: 'Perfiles de puesto', roles: [ADMIN, RRHH, JEFE, COMITE] },
  { ruta: '/solicitudes-cobertura', icono: '📑', texto: 'Solicitudes de cobertura', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/candidatos-compatibles', icono: '🎯', texto: 'Candidatos compatibles', roles: [ADMIN, RRHH, COMITE] },
  { ruta: '/validacion-ocr', icono: '🛡️', texto: 'Validación documental', roles: [ADMIN, RRHH, COMITE] },
  { ruta: '/evaluacion', icono: '📝', texto: 'Evaluación', roles: [ADMIN, RRHH, COMITE] },
  { ruta: '/informes', icono: '📊', texto: 'Reportes', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/auditoria', icono: '🔒', texto: 'Auditoría', roles: [ADMIN] },
  { ruta: '/configuracion', icono: '⚙️', texto: 'Configuración', roles: [ADMIN] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [error, setError] = useState('');
  const enlacesVisibles = enlaces.filter(({ roles }) => !roles || roles.includes(user?.role));

  const cerrarSesion = async () => {
    setError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

   return (
     <aside className="print:hidden flex h-screen max-h-screen w-64 shrink-0 flex-col bg-blue-950 text-white">
       <div className="flex min-h-0 flex-1 flex-col">
         <div className="shrink-0 p-4 flex items-center gap-3 border-b border-blue-900">
           <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
           <div>
            <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
            <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-3 space-y-1.5 text-sm">
          {enlacesVisibles.map(({ ruta, icono, texto }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/dashboard'}
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

      <div className="shrink-0 p-3 border-t border-blue-900">
        <button 
          onClick={cerrarSesion}
          className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ❌ Cerrar sesión
        </button>
        {error && <p role="alert" className="px-3 pt-2 text-xs text-red-300">{error}</p>}
      </div>
    </aside>
  );
}