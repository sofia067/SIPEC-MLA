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
                    <td className="py-2.5">Gerencia de Desarrollo Territorial e Infraestructura</td>
                    <td className="py-2.5">Subgerencia de Infraestructura</td>
                    <td className="py-2.5">30/08/2026</td>
                    <td className="py-2.5"><span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold">En revisión</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-003</td>
                    <td className="py-2.5">Gerencia de Servicios Municipales y Gestión Ambiental</td>
                    <td className="py-2.5">Unidad de Tecnologías de Información   </td>
                    <td className="py-2.5">29/08/2026</td>
                    <td className="py-2.5"><span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">Validación...</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-004</td>
                    <td className="py-2.5">Gerencia de Desarrollo Social</td>
                    <td className="py-2.5">Unidad de Gestión de Recursos Humanos</td>
                    <td className="py-2.5">28/08/2026</td>
                    <td className="py-2.5"><span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold">Pendiente</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-gray-700">SC-005</td>
                    <td className="py-2.5">Oficina de Administración y Finanzas</td>
                    <td className="py-2.5">Auxiliar de Almacén</td>
                    <td className="py-2.5">27/08/2026</td>
                    <td className="py-2.5"><span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">Aprobado</span></td>
                    <td className="py-2.5 text-right"><button className="text-blue-700 font-semibold">Ver</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
