import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'];

export default function ValidacionOCR() {
  const [procesando, setProcesando] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [error, setError] = useState('');
  const [documentos, setDocumentos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentoId, setDocumentoId] = useState('');
  const [solicitudId, setSolicitudId] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargarDatos = async () => {
    try {
      const [documentsResult, requestsResult] = await Promise.all([
        apiRequest('/documents'),
        apiRequest('/requests'),
      ]);
      setDocumentos(documentsResult.documents);
      setSolicitudes(requestsResult.requests);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const ejecutarOcr = async () => {
    if (!archivo) return;

    setProcesando(true);
    setError('');
    try {
      let documentId = documentoId;
      if (!documentId) {
        if (!solicitudId || !tipoDocumento.trim()) {
          throw new Error('Selecciona la solicitud y el tipo de documento antes de cargarlo.');
        }
        const { document } = await apiRequest('/documents', {
          method: 'POST',
          body: JSON.stringify({
            requestId: solicitudId,
            documentType: tipoDocumento,
            description: descripcion,
            status: 'pending',
          }),
        });
        documentId = document.id;
        setDocumentoId(documentId);
      }

      const body = new FormData();
      body.append('file', archivo);
      await apiRequest(`/documents/${documentId}/file`, { method: 'POST', body });
      setArchivo(null);
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcesando(false);
    }
  };

  const reprocesarOcr = async () => {
    if (!documentoSeleccionado?.has_file) return;
    setProcesando(true);
    setError('');
    try {
      await apiRequest(`/documents/${documentoSeleccionado.id}/ocr`, { method: 'POST' });
      await cargarDatos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcesando(false);
    }
  };

  const seleccionarArchivo = (archivoSeleccionado) => {
    if (!archivoSeleccionado) return;

    const extension = archivoSeleccionado.name
      .slice(archivoSeleccionado.name.lastIndexOf('.'))
      .toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      setArchivo(null);
      setErrorArchivo('Elige un archivo PDF, JPG, PNG, WEBP, BMP o TIFF.');
      return;
    }

    if (archivoSeleccionado.size === 0) {
      setArchivo(null);
      setErrorArchivo('El archivo está vacío. Selecciona otro documento.');
      return;
    }

    if (archivoSeleccionado.size > MAX_TAMANO_ARCHIVO) {
      setArchivo(null);
      setErrorArchivo('El archivo supera el límite de 10 MB.');
      return;
    }

    setArchivo(archivoSeleccionado);
    setErrorArchivo('');
  };

  const documentoSeleccionado = documentos.find((document) => document.id === documentoId);

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

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Carga de Archivo */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800">Cargar Documento Sustentatorio</h3>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">Documento existente (opcional)</label>
                <select value={documentoId} onChange={(event) => setDocumentoId(event.target.value)} className="w-full rounded-lg border p-2">
                  <option value="">Crear documento para una solicitud</option>
                  {documentos.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.request_code || document.worker_name || document.id} — {document.document_type}
                    </option>
                  ))}
                </select>
              </div>

              {!documentoId && (
                <>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Solicitud relacionada</label>
                    <select required value={solicitudId} onChange={(event) => setSolicitudId(event.target.value)} className="w-full rounded-lg border p-2">
                      <option value="">Selecciona una solicitud</option>
                      {solicitudes.map((request) => (
                        <option key={request.id} value={request.id}>{request.code} — {request.position_title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Tipo de documento</label>
                    <input required value={tipoDocumento} onChange={(event) => setTipoDocumento(event.target.value)} className="w-full rounded-lg border p-2" />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Descripción</label>
                    <input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} className="w-full rounded-lg border p-2" />
                  </div>
                </>
              )}
              
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
                onClick={ejecutarOcr}
                disabled={procesando || !archivo || (!documentoId && (!solicitudId || !tipoDocumento.trim()))}
                className="w-full bg-blue-950 text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                {procesando ? 'Enviando documento…' : 'Cargar y procesar OCR'}
              </button>
              <p className="text-[10px] leading-relaxed text-gray-500">
                El archivo se guardará en el backend y se procesará con el motor OCR configurado.
              </p>
            </div>

            {/* Panel de Resultados del Análisis OCR */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Resultado de la Extracción Óptica</h3>

              {!procesando && !documentoSeleccionado && (
                <div className="py-12 text-center text-gray-400">
                  <span className="text-4xl block mb-2">🔍</span>
                  Selecciona un documento de la lista para consultar el resultado guardado.
                </div>
              )}

              {procesando && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="font-semibold text-blue-950">El backend está procesando el documento…</p>
                </div>
              )}

              {!procesando && documentoSeleccionado && (
                <div className="space-y-3">
                  <p><strong>Tipo:</strong> {documentoSeleccionado.document_type}</p>
                  <p><strong>Solicitud:</strong> {documentoSeleccionado.request_code || '—'}</p>
                  <p><strong>Archivo:</strong> {documentoSeleccionado.file_name || 'Sin archivo adjunto'}</p>
                  <p><strong>Estado OCR:</strong> {documentoSeleccionado.ocr_status || 'Pendiente'}</p>
                  {documentoSeleccionado.has_file && (
                    <button onClick={reprocesarOcr} disabled={procesando}
                      className="rounded bg-blue-950 px-3 py-2 font-semibold text-white disabled:bg-gray-400">
                      Reprocesar OCR
                    </button>
                  )}
                  {documentoSeleccionado.ocr_message && (
                    <p role="status" className="rounded bg-amber-50 p-3 text-amber-900">{documentoSeleccionado.ocr_message}</p>
                  )}
                  <div>
                    <h4 className="mb-2 font-bold text-gray-700">Texto reconocido</h4>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-800">
                      {documentoSeleccionado.ocr_text || 'Aún no hay texto OCR disponible.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Documentos registrados</h3>
              <button onClick={cargarDatos} className="text-xs font-semibold text-blue-900 hover:underline">Actualizar lista</button>
            </div>
            {documentos.length === 0 ? (
              <p className="text-sm text-gray-500">No hay documentos registrados.</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((document) => (
                  <button key={document.id} onClick={() => setDocumentoId(document.id)}
                    className="flex w-full justify-between gap-3 rounded border p-3 text-left text-xs hover:bg-gray-50">
                    <span>{document.request_code || document.worker_name || 'Documento'} — {document.document_type}</span>
                    <span>{document.ocr_status || document.status}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}