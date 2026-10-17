import React, { useState } from 'react';
import Sidebar from '../components/sidebar';

export default function MiPerfil() {
  // Datos del usuario con sesión activa
  const [usuario, setUsuario] = useState({
    nombre: 'Carlos',
    apellidos: 'Ramírez Pérez',
    email: 'carlos.ramirez@munilosaquijes.gob.pe',
    cargo: 'Jefe de Área',
    area: 'Subgerencia de Fiscalización',
    telefono: '987 654 321',
    documento: '45678912',
    rol: 'Jefe de Área'
  });

  const [password, setPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const handleGuardarCambios = (e) => {
    e.preventDefault();
    alert("Datos de perfil actualizados correctamente.");
  };

  const handleCambiarPassword = (e) => {
    e.preventDefault();
    if (password.nueva !== password.confirmar) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }
    alert("Contraseña actualizada con éxito.");
    setPassword({ actual: '', nueva: '', confirmar: '' });
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
              CR
            </div>
            <div className="text-left leading-tight">
              <p className="font-semibold text-gray-800">{usuario.nombre} {usuario.apellidos}</p>
              <p className="text-xs text-gray-500">{usuario.cargo}</p>
            </div>
          </div>
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
                CR
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">{usuario.nombre} {usuario.apellidos}</h3>
                <p className="text-xs text-blue-900 font-semibold mt-0.5">{usuario.cargo}</p>
                <p className="text-xs text-gray-500">{usuario.area}</p>
              </div>
              <div className="pt-3 border-t text-left text-xs space-y-2">
                <p><span className="font-semibold text-gray-600">DNI:</span> {usuario.documento}</p>
                <p><span className="font-semibold text-gray-600">Rol asignado:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{usuario.rol}</span></p>
              </div>
            </div>

            {/* Formulario de Edición de Datos y Seguridad */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Información Personal */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Información Personal</h3>
                <form onSubmit={handleGuardarCambios} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Nombres</label>
                    <input 
                      type="text" 
                      value={usuario.nombre}
                      onChange={(e) => setUsuario({...usuario, nombre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Apellidos</label>
                    <input 
                      type="text" 
                      value={usuario.apellidos}
                      onChange={(e) => setUsuario({...usuario, apellidos: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">DNI / Documento (No editable)</label>
                    <input 
                      type="text" 
                      disabled
                      value={usuario.documento}
                      className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg p-2 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Correo Institucional</label>
                    <input 
                      type="email" 
                      value={usuario.email}
                      onChange={(e) => setUsuario({...usuario, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Teléfono / Anexo Interno</label>
                    <input 
                      type="text" 
                      value={usuario.telefono}
                      onChange={(e) => setUsuario({...usuario, telefono: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Dependencia / Unidad Orgánica</label>
                    <input 
                      type="text" 
                      disabled
                      value={usuario.area}
                      className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg p-2 cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-between items-center pt-2">
                    <span className="text-[11px] text-gray-400">Último acceso registrado: Hoy a las 08:30 AM</span>
                    <button type="submit" className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm">
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>

              {/* Seguridad / Cambio de Contraseña */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Seguridad y Credenciales</h3>
                <form onSubmit={handleCambiarPassword} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Contraseña Actual</label>
                    <input 
                      type="password" 
                      required
                      value={password.actual}
                      onChange={(e) => setPassword({...password, actual: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Nueva Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={password.nueva}
                        onChange={(e) => setPassword({...password, nueva: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Confirmar Nueva Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={password.confirmar}
                        onChange={(e) => setPassword({...password, confirmar: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors">
                      Actualizar Contraseña
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}