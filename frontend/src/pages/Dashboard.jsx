import UserDropdown from '../components/UserDropdown';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar Lateral */}
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

          {/* Menú Completo  */}
          <nav className="p-3 space-y-1.5 text-sm">
            <button className="w-full text-left py-2.5 px-3 rounded bg-blue-900 font-bold flex items-center gap-3 text-blue-100">
              <span className="text-base">🏚️​</span> Inicio
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">👥</span> Trabajadores
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📄</span> Perfiles de puesto
            </button>
          
            <button 
              onClick={() => navigate('/nueva-solicitud')} 
               className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200 transition-colors" >
              <span className="text-base">📑</span> Solicitudes de cobertura
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🛡️</span> Validación documental
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📝</span> Evaluaciones
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
          <button onClick={() => navigate('/')} className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2">
            ❌​ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Barra Superior */}
        <header className="bg-white border-b px-12 py-3 flex justify-end items-center gap-4">
          <button className="text-gray-500 text-base">🔔</button>
           {/*  componente desplegable */}
            <UserDropdown /> 
         
        </header>

        {/* Contenido Central */}
        <main className="p-8 space-y-6">
          
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">¡Buenos días, Moly Valencia!</h2>
            <p className="text-xs text-gray-500 mt-1">Resumen de la gestión de personal</p>
          </div>

          {/* Tarjetas de Métricas (Números Centrados) */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-blue-900 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 w-full mb-1">
                <span className="p-1 bg-blue-50 text-blue-800 rounded-lg text-base ">📄</span>
                <p className="text-xs font-semibold text-gray-500 ">Solicitudes pendientes</p> 
              </div>
              <p className="text-3xl font-bold text-blue-900 my-1 text-center">04</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-amber-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-base shrink-0">📌</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Validaciones pendientes</p>          
              </div>
              <p className="text-3xl font-bold text-amber-600 my-1 text-center">07</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-emerald-500 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-base shrink-0">📝</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Evaluaciones pendientes</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600 my-1 text-center">03</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-b-4 border-b-purple-700 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center w-full mb-1">
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-base shrink-0">👥</span>
                <p className="text-xs font-semibold text-gray-500 w-full">Asignaciones realizadas</p>
              </div>
              <p className="text-3xl font-bold text-purple-700 my-1 text-center">12</p>
            </div>
          </div>

          {/* Sección Inferior */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Tabla de Solicitudes Recientes */}
            <div className="col-span-2 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-gray-800">Solicitudes recientes</h3>
                <a href="#" className="text-xs text-blue-700 hover:underline">Ver todas &gt;</a>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b pb-2">
                    <th className="pb-2 font-medium">Código</th>
                    <th className="pb-2 font-medium">Área</th>
                    <th className="pb-2 font-medium">Puesto</th>
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-001</td>
                    <td className="py-2.5">Gerencia de Administración Tributaria</td>
                    <td className="py-2.5">Subgerencia de Fiscalización y Ejecución Coactiva</td>
                    <td className="py-2.5">31/08/2026</td>
                    <td className="py-2.5"><span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">Validación...</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-002</td>
                    <td className="py-2.5">Gerencia de Desarrollo Territorial e Infraestructura   </td>
                    <td className="py-2.5">Subgerencia de Infraestructura</td>
                    <td className="py-2.5">30/08/2026</td>
                    <td className="py-2.5"><span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold">En revisión</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-003</td>
                    <td className="py-2.5">Gerencia de Desarrollo Económico</td>
                    <td className="py-2.5">Subgerencia de Servicios Municipales</td>
                    <td className="py-2.5">29/08/2026</td>
                    <td className="py-2.5"><span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">Validación...</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-004</td>
                    <td className="py-2.5">Gerencia de Servicios Municipales y Gestión Ambiental</td>
                    <td className="py-2.5">Unidad de Tecnologías de Información</td>
                    <td className="py-2.5">28/08/2026</td>
                    <td className="py-2.5"><span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold">Pendiente</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-005</td>
                    <td className="py-2.5">Gerencia de Desarrollo Social</td>
                    <td className="py-2.5">Unidad de Gestión de Recursos Humanos</td>
                    <td className="py-2.5">27/08/2026</td>
                    <td className="py-2.5"><span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">Aprobado</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/*  Alertas y Acciones Rápidas */}
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-1.5">
                  ⚠️ Alertas
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">2 trabajadores tienen documentación pendiente</p>
                  </div>
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">1 evaluación técnica está pendiente</p>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-900 shadow-sm">
                    <p className="font-semibold leading-relaxed">Hay 1 solicitud próxima a vencer</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <a href="#" className="text-xs font-semibold text-blue-700 hover:underline">Ver todas las alertas &gt;</a>
                </div>
              </div>

              {/* Acciones Rápidas  */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-3">⚡ Acciones rápidas</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <button className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-semibold text-gray-700">Nueva solicitud</span>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">👤</span>
                    <span className="text-xs font-semibold text-gray-700">Buscar trabajador</span>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">🛡️</span>
                    <span className="text-xs font-semibold text-gray-700">Validar documento</span>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                    <span className="text-xl">📊</span>
                    <span className="text-xs font-semibold text-gray-700">Generar reporte</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}

export default Dashboard;