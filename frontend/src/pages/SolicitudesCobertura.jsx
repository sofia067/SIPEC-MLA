import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDropdown from '../components/UserDropdown';

export default function SolicitudesCobertura() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Lista de solicitudes (Historial)
  const [solicitudes] = useState([
    { id: 'SC-001', area: 'Gerencia de Administración Tributaria', puesto: 'Subgerencia de Fiscalización y Ejecución Coactiva', fecha: '31/08/2026', estado: 'Validación OCR', prioridad: 'Alta' },
    { id: 'SC-002', area: 'Gerencia de Desarrollo Territorial e Infraestructura', puesto: 'Subgerencia de Infraestructura', fecha: '30/08/2026', estado: 'En revisión', prioridad: 'Media' },
    { id: 'SC-003', area: 'Gerencia de Desarrollo Económico', puesto: 'Subgerencia de Servicios Municipales', fecha: '29/08/2026', estado: 'Validación OCR', prioridad: 'Alta' },
    { id: 'SC-004', area: 'Gerencia de Servicios Municipales y Gestión Ambiental', puesto: 'Unidad de Tecnologías de Información', fecha: '28/08/2026', estado: 'Pendiente', prioridad: 'Baja' },
    { id: 'SC-005', area: 'Gerencia de Desarrollo Social', puesto: 'Unidad de Gestión de Recursos Humanos', fecha: '27/08/2026', estado: 'Aprobado', prioridad: 'Alta' },
  ]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 flex items-center gap-3 border-b border-blue-900">
            <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-12 h-12 bg-white/20 p-1 rounded-lg object-contain shrink-0" />
            <div>
              <h1 className="font-bold text-lg tracking-wider leading-tight text-white">SIPEC-MLA</h1>
              <p className="text-[10px] text-blue-300 font-medium">Los Aquijes</p>
            </div>
          </div>

          <nav className="p-3 space-y-1.5 text-sm">
            <button onClick={() => navigate('/dashboard')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🏚️</span> Inicio
            </button>
            <button onClick={() => navigate('/trabajadores')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">👥</span> Trabajadores
            </button>
            <button onClick={() => navigate('/perfil-puesto')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📄</span> Perfiles de puesto
            </button>
            <button className="w-full text-left py-2.5 px-3 rounded bg-blue-900 font-bold flex items-center gap-3 text-blue-100">
              <span className="text-base">📑</span> Solicitudes de cobertura
            </button>
            <button onClick={() => navigate('/candidatos-compatibles')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🎯</span> Candidatos compatibles
            </button>
            <button onClick={() => navigate('/validacion-ocr')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">🛡️</span> Validación documental
            </button>
            <button onClick={() => navigate('/evaluaciones')} className="w-full text-left py-2.5 px-3 rounded hover:bg-blue-900/50 font-medium flex items-center gap-3 text-gray-200">
              <span className="text-base">📝</span> Evaluaciones
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-blue-900">
          <button onClick={() => navigate('/')} className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-sm font-medium text-red-300 flex items-center gap-2">
            ❌ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-end items-center gap-4">
          <button className="text-gray-500 text-base">🔔</button>
          <UserDropdown />
        </header>

        <main className="p-8 space-y-6">
          
          {!mostrarFormulario ? (
            /* Vista 1: Tabla de Historial General */
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Cobertura</h2>
                  <p className="text-xs text-gray-500">Historial general de requerimientos de personal por área</p>
                </div>

                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>➕</span> Nueva Solicitud
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b pb-2">
                      <th className="pb-3 font-medium">Código</th>
                      <th className="pb-3 font-medium">Área Solicitante</th>
                      <th className="pb-3 font-medium">Puesto Requerido</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Prioridad</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudes.map((sol) => (
                      <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-bold text-blue-950">{sol.id}</td>
                        <td className="py-3 text-gray-700">{sol.area}</td>
                        <td className="py-3 font-medium text-gray-900">{sol.puesto}</td>
                        <td className="py-3 text-gray-500">{sol.fecha}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sol.prioridad === 'Alta' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sol.prioridad}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sol.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            sol.estado === 'Validación OCR' ? 'bg-amber-100 text-amber-800' :
                            sol.estado === 'En revisión' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sol.estado}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSolicitudSeleccionada(sol)}
                            className="text-blue-900 font-bold hover:underline"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Vista 2: Formulario de Nueva Solicitud */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">Nueva Solicitud de Cobertura</h2>
                <button 
                  onClick={() => setMostrarFormulario(false)}
                  className="text-xs text-blue-900 hover:underline font-semibold flex items-center gap-1"
                >
                  ← Volver al historial
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Área Solicitante</label>
                    <select className="w-full border p-2 rounded-lg">
                      <option>Gerencia de Administración Tributaria</option>
                      <option>Gerencia de Servicios Municipales y Gestión Ambiental</option>
                      <option>Oficina de Administración y Finanzas</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Puesto a cubrir</label>
                    <select className="w-full border p-2 rounded-lg">
                      <option>Técnico de Fiscalización</option>
                      <option>Serenazgo Operativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Motivo de la solicitud</label>
                    <input type="text" placeholder="Ej. Permiso / Ausencia o Cubrir vacante temporal" className="w-full border p-2 rounded-lg" />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Descripción (opcional)</label>
                    <textarea rows="3" className="w-full border p-2 rounded-lg" placeholder="Trabajador titular con descanso médico por 15 días..."></textarea>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs h-fit">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Resumen</h3>
                  <p><strong>Puesto:</strong> Técnico de Fiscalización</p>
                  <p><strong>Área:</strong> Fiscalización</p>
                  <p><strong>Prioridad:</strong> Alta</p>

                  <div className="pt-3 space-y-2">
                    <button 
                      onClick={() => {
                        alert("Solicitud registrada con éxito");
                        setMostrarFormulario(false);
                      }}
                      className="w-full bg-blue-950 text-white py-2 rounded-lg font-bold hover:bg-blue-900"
                    >
                      Guardar solicitud
                    </button>
                    <button 
                      onClick={() => setMostrarFormulario(false)}
                      className="w-full bg-white border py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {solicitudSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSolicitudSeleccionada(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-solicitud"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between border-b pb-3">
              <div>
                <h2 id="titulo-detalle-solicitud" className="text-lg font-bold text-gray-900">
                  Detalle de solicitud
                </h2>
                <p className="mt-1 text-xs text-gray-500">{solicitudSeleccionada.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                aria-label="Cerrar detalle"
                className="text-xl font-bold text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Área solicitante</dt>
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.area}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500">Puesto requerido</dt>
                <dd className="mt-1 font-medium text-gray-900">{solicitudSeleccionada.puesto}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Fecha</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.fecha}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Prioridad</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.prioridad}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Estado</dt>
                <dd className="mt-1 text-gray-800">{solicitudSeleccionada.estado}</dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end border-t pt-4">
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}