import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';

const configuracionInicial = {
  anonimizar: true,
  umbralOcr: '85',
};

export default function Configuracion() {
  const [configuracion, setConfiguracion] = useState(configuracionInicial);
  const [mensaje, setMensaje] = useState('');
  const hayCambios = configuracion.anonimizar !== configuracionInicial.anonimizar
    || configuracion.umbralOcr !== configuracionInicial.umbralOcr;

  const actualizarConfiguracion = (campo, valor) => {
    setConfiguracion((actual) => ({ ...actual, [campo]: valor }));
    setMensaje('');
  };

  const guardarConfiguracion = (evento) => {
    evento.preventDefault();
    setMensaje('El backend aún no está conectado: los cambios no se guardaron.');
  };

  const restablecerConfiguracion = () => {
    setConfiguracion(configuracionInicial);
    setMensaje('Se restablecieron los valores del formulario. Aún no se guardaron.');
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />

      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-gray-200 text-gray-800 font-medium px-2.5 py-0.5 rounded-full">
              Configuración
            </span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Configuración General</h2>
            <p className="mt-1 text-sm text-gray-600">Parámetros institucionales de la Municipalidad Distrital de Los Aquijes.</p>
          </div>

          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Estos valores son una vista previa local y todavía no se persisten en el servidor.
          </div>

          <form onSubmit={guardarConfiguracion} className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 text-sm max-w-2xl">
            <section className="space-y-4 border-b border-gray-200 pb-5">
              <h3 className="font-semibold text-gray-900">Selección ciega</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="anonimizar" className="font-medium text-gray-800">Anonimización automática</label>
                  <p id="anonimizar-ayuda" className="mt-1 text-sm text-gray-600">Ocultar datos sensibles durante la preselección.</p>
                </div>
                <input
                  id="anonimizar"
                  type="checkbox"
                  checked={configuracion.anonimizar}
                  onChange={(evento) => actualizarConfiguracion('anonimizar', evento.target.checked)}
                  aria-describedby="anonimizar-ayuda"
                  className="h-4 w-4 shrink-0 accent-blue-950"
                />
              </div>
            </section>

            <section className="space-y-4 border-b border-gray-200 pb-5">
              <h3 className="font-semibold text-gray-900">Motor OCR</h3>
              <div>
                <label htmlFor="umbral-ocr" className="font-medium text-gray-800 block mb-1">Umbral mínimo de confianza (%)</label>
                <p id="umbral-ocr-ayuda" className="mb-2 text-sm text-gray-600">Define el porcentaje mínimo para aceptar una lectura automática.</p>
                <input
                  id="umbral-ocr"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={configuracion.umbralOcr}
                  onChange={(evento) => actualizarConfiguracion('umbralOcr', evento.target.value)}
                  aria-describedby="umbral-ocr-ayuda"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!hayCambios}
                className="rounded-lg bg-blue-950 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={restablecerConfiguracion}
                disabled={!hayCambios}
                className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Restablecer
              </button>
            </div>
            {mensaje && <p role="status" className="text-sm text-amber-800">{mensaje}</p>}
          </form>
        </main>
      </div>
    </div>
  );
}