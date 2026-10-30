import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import NotificationBell from './NotificationBell';
import { useAuth } from './AuthContext';
import { roleNames } from '../lib/rolePermissions';

export default function UserDropdown() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user: usuario, setUser } = useAuth();

  const nombre = usuario?.displayName || 'Cargando usuario…';
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const cerrarSesion = async () => {
    setError('');
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      setUser(null);
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <NotificationBell />
      <div className="relative">
      {/* Botón de Perfil  */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {iniciales || '…'}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{nombre}</p>
          <p className="text-xs text-gray-500">{roleNames[usuario?.role] || ''}</p>
        </div>
        {/* Icono Flecha Dropdown */}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${menuAbierto ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menú Desplegable (Flotante) */}
      {menuAbierto && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Encabezado del Menú */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Sesión iniciada como</p>
            <p className="text-sm font-bold text-gray-700 truncate">{usuario?.username || '—'}</p>
            {usuario?.areaName && <p className="text-xs text-gray-500 truncate">{usuario.areaName}</p>}
          </div>
          {error && <p role="alert" className="px-4 py-2 text-xs text-red-700">{error}</p>}

          {/* Opciones del Menú */}
          <div className="py-1">
            <Link 
              to="/mi-perfil" 
              onClick={() => setMenuAbierto(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 transition-colors" >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Mi Perfil</span>
            </Link>

            {usuario?.role === 'admin' && (
              <Link
                to="/configuracion"
                onClick={() => setMenuAbierto(false)}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Usuarios</span>
              </Link>
            )}

          </div>

          {/* Separador y Opción Salir */}
          <div className="border-t border-gray-100 pt-1 mt-1">
            <button 
              type="button"
              onClick={cerrarSesion}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      )}
      </div>
    </div>
  );
}