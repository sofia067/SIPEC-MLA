import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

export default function ExpedienteTrabajador() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2.5 py-0.5 rounded-full">
              Expediente Digital Unificado
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <button 
              onClick={() => navigate('/trabajadores')}
              className="text-xs text-blue-950 hover:underline font-semibold flex items-center gap-1"
            >
              ← Volver al padrón de trabajadores
            </button>
            <span className="text-xs text-gray-400 font-mono">Código de Servidor: TR-402</span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Tarjeta de Identidad y Foto */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-center">
              <div className="w-24 h-24 rounded-full bg-blue-950 text-amber-400 font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
                JM
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Juan Carlos Mendoza</h3>
                <p className="text-xs text-gray-500">Auxiliar de Fiscalización</p>
                <span className="inline-block mt-2 bg-blue-50 text-blue-900 font-bold text-[10px] px-2.5 py-1 rounded-full">
                  DNI: 45892103
                </span>
              </div>

              <div className="border-t pt-4 text-left text-xs space-y-2 text-gray-600">
                <p><strong>Gerencia:</strong> Admin. Tributaria</p>
                <p><strong>Condición:</strong> Contrato CAS (728)</p>
                <p><strong>Fecha Ingreso:</strong> 15/03/2023</p>
                <p><strong>Correo:</strong> jmendoza@munilosaquijes.gob.pe</p>
              </div>
            </div>

            {/* Contenido del Legajo Curricular y Evaluaciones */}
            <div className="col-span-2 space-y-6">
              {/* Formación Académica */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-gray-800 border-b pb-2 flex items-center gap-2">
                  <span>🎓</span> Formación Académica y Capacitaciones
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between">
                    <div>
                      <p className="font-bold text-gray-800">Técnico en Administración de Empresas</p>
                      <p className="text-gray-500">Instituto Superior Tecnológico de Ica | Registrado en MINEDU</p>
                    </div>
                    <span className="text-emerald-700 font-bold">Verificado OCR</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between">
                    <div>
                      <p className="font-bold text-gray-800">Curso Especializado en Procedimiento Sancionador Municipal</p>
                      <p className="text-gray-500">40 Horas Lectivas | Escuela de Gestión Pública</p>
                    </div>
                    <span className="text-emerald-700 font-bold">Verificado OCR</span>
                  </div>
                </div>
              </div>

              {/* Historial de Evaluaciones de Desempeño */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-gray-800 border-b pb-2 flex items-center gap-2">
                  <span>📝</span> Historial de Desempeño y Movilidad
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-semibold text-gray-800">Evaluación de Desempeño 2025-II</p>
                      <p className="text-gray-400">Puntaje obtenido: 92/100 (Sobresaliente)</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">Aprobado</span>
                  </div>

                  <div className="flex justify-between items-center p-2">
                    <div>
                      <p className="font-semibold text-gray-800">Asignación Temporal (SC-001)</p>
                      <p className="text-gray-400">Propuesto para Técnico de Fiscalización por Match (95%)</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">En proceso</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}