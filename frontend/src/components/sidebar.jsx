 import React, { useState } from 'react';
 import { NavLink, useNavigate } from 'react-router-dom';
 import { useAuth } from '../auth/AuthContext';

const ADMIN = 'admin';
const RRHH = 'hr_specialist';
const JEFE = 'area_manager';

const enlaces = [
  { ruta: '/dashboard', icono: '🏚️', texto: 'Inicio' },
  { ruta: '/trabajadores', icono: '👥', texto: 'Trabajadores', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/perfil-puesto', icono: '📄', texto: 'Perfiles de puesto', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/solicitudes-cobertura', icono: '📑', texto: 'Convocatorias de personal', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/candidatos-compatibles', icono: '🎯', texto: 'Candidatos compatibles', roles: [ADMIN, RRHH] },
  { ruta: '/validacion-ocr', icono: '🛡️', texto: 'Validación documental', roles: [ADMIN, RRHH] },
  { ruta: '/evaluacion', icono: '📝', texto: 'Evaluación', roles: [ADMIN, RRHH] },
  { ruta: '/informes', icono: '📊', texto: 'Reportes', roles: [ADMIN, RRHH, JEFE] },
  { ruta: '/auditoria', icono: '🔒', texto: 'Auditoría', roles: [ADMIN] },
  { ruta: '/configuracion', icono: '⚙️', texto: 'Configuración', roles: [ADMIN] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const enlacesVisibles = enlaces.filter(({ roles }) => !roles || roles.includes(user?.role));

  const cerrarSesion = async () => {
    setError('');
    try {
      await logout();
      setMenuOpen(false);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <aside className="print:hidden relative z-30 w-full shrink-0 bg-blue-950 text-white md:flex md:h-dvh md:w-64 md:flex-col">
      <div className="flex h-16 items-center justify-between border-b border-blue-900 px-4 md:h-auto md:shrink-0 md:justify-start md:gap-3 md:p-4">
        <div className="flex items-center gap-3">
          <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="h-10 w-10 shrink-0 rounded-lg bg-white/20 p-1 object-contain md:h-12 md:w-12" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-wider text-white">SIPEC-MLA</h1>
            <p className="text-[10px] font-medium text-blue-300">Los Aquijes</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-xl text-white hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:hidden"
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      <div
        id="primary-navigation"
        className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-t border-blue-900 bg-blue-950 md:static md:flex md:min-h-0 md:max-h-none md:flex-1 md:border-0`}
      >
        <nav aria-label="Navegación principal" className="space-y-1.5 p-3 text-sm md:min-h-0 md:flex-1 md:overflow-y-auto">
          {enlacesVisibles.map(({ ruta, icono, texto }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/dashboard'}
              onClick={() => setMenuOpen(false)}
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

        <div className="shrink-0 border-t border-blue-900 p-3">
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ❌ Cerrar sesión
          </button>
          {error && <p role="alert" className="px-3 pt-2 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </aside>
  );
}