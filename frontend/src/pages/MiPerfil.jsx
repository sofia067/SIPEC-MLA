import React from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { useAuth } from '../components/AuthContext';
import { roleNames } from '../lib/rolePermissions';

export default function MiPerfil() {
  const { user: usuario } = useAuth();
  const nombre = usuario?.displayName || 'Cargando perfil…';
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
          <UserDropdown />
        </header>

        {/* Contenido Principal */}
        <main className="p-8 max-w-5xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
            <p className="text-xs text-gray-500">Gestión de datos de cuenta y credenciales de acceso</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta Lateral de Resumen */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-900 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
                {iniciales || '…'}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">{nombre}</h3>
                <p className="text-xs text-blue-900 font-semibold mt-0.5">{roleNames[usuario?.role] || ''}</p>
                <p className="text-xs text-gray-500">{usuario?.areaName || 'Sin área asignada'}</p>
              </div>
              <div className="pt-3 border-t text-left text-xs space-y-2">
                <p><span className="font-semibold text-gray-600">Usuario:</span> {usuario?.username || '—'}</p>
                <p><span className="font-semibold text-gray-600">Rol asignado:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{roleNames[usuario?.role] || '—'}</span></p>
              </div>
            </div>

            {/* Formulario de Edición de Datos y Seguridad */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Información Personal */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-600 block mb-1">Nombre para mostrar</span>
                    <p className="w-full rounded-lg border border-gray-200 bg-gray-100 p-2">{usuario?.displayName || '—'}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-600 block mb-1">Nombre de usuario</span>
                    <p className="w-full rounded-lg border border-gray-200 bg-gray-100 p-2">{usuario?.username || '—'}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-600 block mb-1">Rol</span>
                    <p className="w-full rounded-lg border border-gray-200 bg-gray-100 p-2">{roleNames[usuario?.role] || '—'}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-600 block mb-1">Área</span>
                    <p className="w-full rounded-lg border border-gray-200 bg-gray-100 p-2">{usuario?.areaName || 'Sin área asignada'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Seguridad y Credenciales</h3>
                <p className="text-xs text-gray-600">
                  La sesión y la identidad se consultan al backend. La API actual no dispone de operaciones para editar estos datos ni cambiar la contraseña.
                </p>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}