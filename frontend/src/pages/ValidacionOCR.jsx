import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

const MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function ValidacionOCR() {
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');

  const ejecutarSimulacion = () => {
    if (!archivo) return;

    setProcesando(true);
    setCompletado(false);
    setTimeout(() => {
      setProcesando(false);
      setCompletado(true);
    }, 2000);
  };

  const seleccionarArchivo = (archivoSeleccionado) => {
    if (!archivoSeleccionado) return;

    const extension = archivoSeleccionado.name
      .slice(archivoSeleccionado.name.lastIndexOf('.'))
      .toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      setArchivo(null);
      setCompletado(false);
      setErrorArchivo('Elige un archivo PDF, JPG o PNG.');
      return;
    }

    if (archivoSeleccionado.size === 0) {
      setArchivo(null);
      setCompletado(false);
      setErrorArchivo('El archivo está vacío. Selecciona otro documento.');
      return;
    }

    if (archivoSeleccionado.size > MAX_TAMANO_ARCHIVO) {
      setArchivo(null);
      setCompletado(false);
      setErrorArchivo('El archivo supera el límite de 10 MB.');
      return;
    }

    setArchivo(archivoSeleccionado);
    setCompletado(false);
    setErrorArchivo('');
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 sm:px-8 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
              Motor de Reconocimiento OCR
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-2xl font-bold text-gray-900">Validación Documental Automatizada</h2>
            <p className="text-xs text-gray-500">Procesamiento de certificados y diplomas escaneados mediante reconocimiento óptico de caracteres</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Carga de Archivo */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800">Cargar Documento Sustentatorio</h3>
              
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  seleccionarArchivo(event.dataTransfer.files[0]);
                }}
                className="block border-2 border-dashed border-gray-300 p-6 rounded-xl text-center space-y-2 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => {
                    seleccionarArchivo(event.target.files[0]);
                    event.target.value = '';
                  }}
                  className="sr-only"
                  aria-label="Seleccionar documento PDF, JPG o PNG"
                />
                <span className="text-3xl block">📄</span>
                <span className="font-semibold text-gray-700 block">
                  {archivo ? 'Documento seleccionado' : 'Arrastra un archivo o haz clic para elegirlo'}
                </span>
                {archivo ? (
                  <span className="block break-all text-gray-600">
                    {archivo.name} · {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 block">
                    Formatos permitidos: PDF, JPG, PNG (máx. 10 MB)
                  </span>
                )}
              </label>
              {errorArchivo && (
                <p role="alert" className="text-red-700">{errorArchivo}</p>
              )}

              <button 
                onClick={ejecutarSimulacion}
                disabled={procesando || !archivo}
                className="w-full bg-blue-950 text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                {procesando ? 'Ejecutando demostración...' : 'Probar demostración OCR'}
              </button>
              <p className="text-[10px] leading-relaxed text-gray-500">
                Esta pantalla simula el proceso. El archivo se valida localmente, pero no se envía ni se analiza con un motor OCR real.
              </p>
            </div>

            {/* Panel de Resultados del Análisis OCR */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Resultado de la Extracción Óptica</h3>

              {!procesando && !completado && (
                <div className="py-12 text-center text-gray-400">
                  <span className="text-4xl block mb-2">🔍</span>
                  Selecciona un archivo y ejecuta la demostración para ver el resultado de ejemplo.
                </div>
              )}

              {procesando && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="font-semibold text-blue-950">Simulando el análisis del documento...</p>
                </div>
              )}

              {completado && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
                    <p className="font-bold">Demostración completada</p>
                    <p className="mt-1">Los siguientes datos son de ejemplo; no se extrajeron del archivo seleccionado.</p>
                  </div>

                  <h4 className="font-bold text-gray-700">Ejemplo de datos extraídos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-bold text-gray-700">Tipo de Documento:</p>
                      <p className="text-gray-900">Título Técnico de la Nación</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-bold text-gray-700">Institución Emisora:</p>
                      <p className="text-gray-900">I.S.T. Público de Ica</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-bold text-gray-700">Especialidad Detectada:</p>
                      <p className="text-gray-900">Administración y Finanzas</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                      <p className="font-bold text-gray-700">Fecha de Emisión:</p>
                      <p className="text-gray-900">12 de Diciembre de 2021</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}