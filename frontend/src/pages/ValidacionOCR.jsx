import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024;
const TIPOS_DOCUMENTO = ['Certificado', 'Título profesional', 'DNI', 'Constancia', 'Otro'];
const estadoOcr = {
  none: 'Sin archivo',
  processing: 'Procesando OCR',
  completed: 'OCR completado',
  failed: 'Error de OCR',
  no_text: 'No se detectó texto',
};

export default function ValidacionOCR() {
  const [referencias, setReferencias] = useState({ requests: [], workers: [] });
  const [documentos, setDocumentos] = useState([]);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [tipoVinculo, setTipoVinculo] = useState('worker');
  const [idVinculo, setIdVinculo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState(TIPOS_DOCUMENTO[0]);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [actualizandoDocumento, setActualizandoDocumento] = useState(false);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    const [lookups, documentResult] = await Promise.all([
      apiRequest('/lookups'),
      apiRequest('/documents'),
    ]);
    setReferencias({ requests: lookups.requests, workers: lookups.workers });
    setDocumentos(documentResult.documents);
  };

  useEffect(() => {
    cargarDatos()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!documentos.some((document) => document.ocr_status === 'processing')) return undefined;
    const timer = window.setInterval(() => {
      cargarDatos().catch((requestError) => setError(requestError.message));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [documentos]);

  useEffect(() => {
    if (!documentoActual) return;
    const updated = documentos.find((document) => document.id === documentoActual.id);
    if (updated) setDocumentoActual(updated);
  }, [documentos, documentoActual?.id]);

  const seleccionarArchivo = (selectedFile) => {
    if (!selectedFile) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setArchivo(null);
      setError('Elige un PDF, JPG, PNG, WEBP, BMP o TIFF.');
      return;
    }
    if (selectedFile.size === 0 || selectedFile.size > MAX_TAMANO_ARCHIVO) {
      setArchivo(null);
      setError(selectedFile.size === 0
        ? 'El archivo está vacío. Selecciona otro documento.'
        : 'El archivo supera el límite de 10 MB.');
      return;
    }
    setArchivo(selectedFile);
    setError('');
  };

  const subirYProcesar = async (event) => {
    event.preventDefault();
    if (!archivo || !idVinculo) {
      setError('Selecciona un archivo y vincúlalo a una solicitud o trabajador.');
      return;
    }

    setSubiendo(true);
    setError('');
    try {
      const owner = tipoVinculo === 'worker'
        ? { workerId: idVinculo }
        : { requestId: idVinculo };
      const { document } = await apiRequest('/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...owner,
          documentType: tipoDocumento,
          description: '',
          status: 'pending',
        }),
      });
      setDocumentoActual(document);

      const formData = new FormData();
      formData.append('file', archivo);
      await apiRequest(`/documents/${document.id}/file`, {
        method: 'POST',
        body: formData,
      });
      setArchivo(null);
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubiendo(false);
    }
  };

  const validarDocumento = async () => {
    if (!documentoActual || documentoActual.ocr_status !== 'completed') return;
    setActualizandoDocumento(true);
    setError('');
    try {
      await apiRequest(`/documents/${documentoActual.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          requestId: documentoActual.request_id ?? '',
          workerId: documentoActual.worker_id ?? '',
          documentType: documentoActual.document_type,
          description: documentoActual.description ?? '',
          status: 'completed',
        }),
      });
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActualizandoDocumento(false);
    }
  };

  const reprocesarDocumento = async () => {
    if (!documentoActual?.has_file) return;
    setActualizandoDocumento(true);
    setError('');
    try {
      await apiRequest(`/documents/${documentoActual.id}/ocr`, { method: 'POST' });
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActualizandoDocumento(false);
    }
  };

  const opcionesVinculo = tipoVinculo === 'worker' ? referencias.workers : referencias.requests;

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
            <p className="text-xs text-gray-500">
              Extrae texto de PDFs e imágenes, y conserva la huella SHA-256 para comprobar la integridad del archivo.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={subirYProcesar} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800">Cargar documento</h3>

              <div>
                <label htmlFor="tipo-vinculo" className="mb-1 block font-semibold text-gray-700">Vincular a</label>
                <select id="tipo-vinculo" value={tipoVinculo} onChange={(event) => {
                  setTipoVinculo(event.target.value);
                  setIdVinculo('');
                }} className="w-full border p-2 rounded-lg">
                  <option value="worker">Trabajador</option>
                  <option value="request">Solicitud</option>
                </select>
              </div>

              <div>
                <label htmlFor="id-vinculo" className="mb-1 block font-semibold text-gray-700">
                  {tipoVinculo === 'worker' ? 'Trabajador' : 'Solicitud'}
                </label>
                <select id="id-vinculo" required value={idVinculo} onChange={(event) => setIdVinculo(event.target.value)}
                  className="w-full border p-2 rounded-lg" disabled={cargando || opcionesVinculo.length === 0}>
                  <option value="">Selecciona...</option>
                  {opcionesVinculo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {tipoVinculo === 'worker' ? item.full_name ?? item.name : item.code}
                    </option>
                  ))}
                </select>
                {opcionesVinculo.length === 0 && (
                  <p className="mt-1 text-amber-700">No hay {tipoVinculo === 'worker' ? 'trabajadores' : 'solicitudes'} disponibles para vincular.</p>
                )}
              </div>

              <div>
                <label htmlFor="tipo-documento" className="mb-1 block font-semibold text-gray-700">Tipo de documento</label>
                <select id="tipo-documento" value={tipoDocumento} onChange={(event) => setTipoDocumento(event.target.value)}
                  className="w-full border p-2 rounded-lg">
                  {TIPOS_DOCUMENTO.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

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
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,application/pdf,image/*"
                  onChange={(event) => {
                    seleccionarArchivo(event.target.files[0]);
                    event.target.value = '';
                  }}
                  className="sr-only"
                  aria-label="Seleccionar documento para OCR"
                />
                <span className="text-3xl block">📄</span>
                <span className="font-semibold text-gray-700 block">
                  {archivo ? archivo.name : 'Arrastra un archivo o haz clic para elegirlo'}
                </span>
                <span className="text-[10px] text-gray-500 block">PDF, JPG, PNG, WEBP, BMP o TIFF · máximo 10 MB</span>
              </label>

              <button type="submit" disabled={subiendo || !archivo || !idVinculo}
                className="w-full bg-blue-950 text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-gray-400">
                {subiendo ? 'Enviando y procesando...' : 'Subir y ejecutar OCR'}
              </button>
              <p className="text-[10px] leading-relaxed text-gray-500">
                Los PDFs con texto se extraen directamente; los escaneados se rasterizan y analizan con Tesseract. En PDFs escaneados se procesan hasta 20 páginas.
              </p>
            </form>

            <section className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Texto extraído y huella del archivo</h3>
              {!documentoActual && (
                <p className="py-10 text-center text-gray-500">Selecciona un documento del historial para ver OCR y hash SHA-256.</p>
              )}
              {documentoActual && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded bg-gray-50 p-3">
                      <span className="font-semibold">Archivo:</span> {documentoActual.file_name || 'Sin archivo'}
                    </div>
                    <div className="rounded bg-gray-50 p-3">
                      <span className="font-semibold">Estado OCR:</span> {estadoOcr[documentoActual.ocr_status] || documentoActual.ocr_status}
                    </div>
                    <div className="rounded bg-gray-50 p-3 sm:col-span-2">
                      <span className="font-semibold">Validación:</span>{' '}
                      {documentoActual.status === 'completed' ? 'Certificado validado' : 'Pendiente de revisión'}
                    </div>
                  </div>
                  {documentoActual.file_sha256 && (
                    <div className="rounded bg-blue-50 p-3">
                      <p className="font-semibold text-blue-950">SHA-256</p>
                      <code className="mt-1 block break-all text-[11px]">{documentoActual.file_sha256}</code>
                    </div>
                  )}
                  {documentoActual.ocr_message && (
                    <p role="alert" className="rounded bg-amber-50 p-3 text-amber-900">{documentoActual.ocr_message}</p>
                  )}
                  {documentoActual.ocr_status === 'processing' && (
                    <p className="animate-pulse py-6 text-center font-semibold text-blue-950">Procesando documento...</p>
                  )}
                  {documentoActual.ocr_text && (
                    <div>
                      <h4 className="mb-2 font-bold text-gray-700">Texto reconocido</h4>
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-sans text-xs leading-relaxed text-gray-800">
                        {documentoActual.ocr_text}
                      </pre>
                    </div>
                  )}
                  {documentoActual.ocr_status === 'no_text' && (
                    <p className="rounded bg-amber-50 p-3 text-amber-900">El OCR no reconoció texto legible. Revisa la calidad o la orientación del documento.</p>
                  )}
                  <div className="flex flex-wrap gap-3 border-t pt-4">
                    <button
                      type="button"
                      onClick={validarDocumento}
                      disabled={actualizandoDocumento || documentoActual.ocr_status !== 'completed' || documentoActual.status === 'completed'}
                      className="rounded-lg bg-blue-950 px-4 py-2 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {actualizandoDocumento
                        ? 'Guardando…'
                        : documentoActual.status === 'completed'
                          ? 'Certificado validado'
                          : 'Confirmar validación del certificado'}
                    </button>
                    {documentoActual.has_file && ['failed', 'no_text'].includes(documentoActual.ocr_status) && (
                      <button
                        type="button"
                        onClick={reprocesarDocumento}
                        disabled={actualizandoDocumento}
                        className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Reintentar OCR
                      </button>
                    )}
                  </div>
                  {documentoActual.ocr_status !== 'completed' && documentoActual.status !== 'completed' && (
                    <p className="text-gray-500">
                      Para confirmar la validación, espera a que el OCR termine y revisa el texto reconocido.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-sm text-gray-900">Documentos procesados</h3>
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3">Documento</th>
                  <th className="pb-3">Vinculado a</th>
                  <th className="pb-3">Estado OCR</th>
                  <th className="pb-3">SHA-256</th>
                  <th className="pb-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentos.map((document) => (
                  <tr key={document.id}>
                    <td className="py-3">{document.file_name || document.document_type}</td>
                    <td className="py-3">{document.worker_name || document.request_code || '—'}</td>
                    <td className="py-3">{estadoOcr[document.ocr_status] || document.ocr_status}</td>
                    <td className="max-w-48 truncate py-3 font-mono" title={document.file_sha256 || ''}>
                      {document.file_sha256 || '—'}
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => setDocumentoActual(document)} className="font-semibold text-blue-900 hover:underline">
                        Ver resultado
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && documentos.length === 0 && (
                  <tr><td colSpan="5" className="py-6 text-center text-gray-500">Aún no hay documentos en la base de datos.</td></tr>
                )}
                {cargando && <tr><td colSpan="5" className="py-6 text-center text-gray-500">Cargando documentos...</td></tr>}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}
