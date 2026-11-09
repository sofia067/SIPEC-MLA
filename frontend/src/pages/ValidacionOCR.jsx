import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { useAuth } from '../auth/AuthContext';
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
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  const { user } = useAuth();
  const canManageDocuments = ['admin', 'hr_specialist'].includes(user?.role);
  const [referencias, setReferencias] = useState({ requests: [], workers: [], candidates: [] });
  const [documentos, setDocumentos] = useState([]);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [tipoVinculo, setTipoVinculo] = useState('candidate');
  const [idVinculo, setIdVinculo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState(TIPOS_DOCUMENTO[0]);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [actualizandoDocumento, setActualizandoDocumento] = useState(false);
  const [revisionCv, setRevisionCv] = useState(null);
  const [cargandoRevisionCv, setCargandoRevisionCv] = useState(false);
  const [marcandoCvRevisado, setMarcandoCvRevisado] = useState(false);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    const [lookups, candidateResult, documentResult] = await Promise.all([
      canManageDocuments ? apiRequest('/lookups') : Promise.resolve({ requests: [], workers: [] }),
      apiRequest('/blind-selection/candidate-document-options'),
      apiRequest('/documents'),
    ]);
    setReferencias({
      requests: lookups.requests,
      workers: lookups.workers,
      candidates: candidateResult.candidates,
    });
    setDocumentos(documentResult.documents);
  };

  useEffect(() => {
    cargarDatos()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!candidateId) {
      setRevisionCv(null);
      return undefined;
    }

    let cancelled = false;
    setRevisionCv(null);
    setCargandoRevisionCv(true);
    apiRequest(`/blind-selection/candidates/${candidateId}/resume-review`)
      .then(({ review }) => {
        if (!cancelled) setRevisionCv(review);
      })
      .catch((requestError) => {
        if (!cancelled) setError(`No se pudo cargar el CV: ${requestError.message}`);
      })
      .finally(() => {
        if (!cancelled) setCargandoRevisionCv(false);
      });
    return () => { cancelled = true; };
  }, [candidateId]);

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
      setError('Selecciona un archivo y vincúlalo a un postulante, solicitud o trabajador.');
      return;
    }

    setSubiendo(true);
    setError('');
    try {
      const owner = tipoVinculo === 'worker'
        ? { workerId: idVinculo }
        : tipoVinculo === 'candidate'
          ? { candidateId: idVinculo }
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
          candidateId: documentoActual.candidate_id ?? '',
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

  const marcarCvRevisado = async () => {
    if (!candidateId || !revisionCv?.text || revisionCv.identityMismatch) return;
    setMarcandoCvRevisado(true);
    setError('');
    try {
      const result = await apiRequest(`/blind-selection/candidates/${candidateId}/resume-review`, {
        method: 'PATCH',
      });
      setRevisionCv((current) => ({
        ...current,
        reviewedAt: result.reviewedAt,
        reviewedByName: result.reviewedByName,
      }));
    } catch (requestError) {
      setError(`No se pudo guardar la revisión del CV: ${requestError.message}`);
    } finally {
      setMarcandoCvRevisado(false);
    }
  };

  const opcionesVinculo = tipoVinculo === 'worker'
    ? referencias.workers
    : tipoVinculo === 'candidate'
      ? referencias.candidates
      : referencias.requests;
  const fechaValidacion = (date) => date
    ? new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(date))
    : 'Fecha no disponible';
  const fechaMetadata = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) return 'No declarada o no disponible';
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(date));
  };

  return (
    <div className="app-shell flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
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
              Revisa el texto de documentos y vincúlalos al postulante mediante su código anónimo.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {candidateId && (
            <section className="space-y-4 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900">
                    CV del postulante {revisionCv?.applicationCode ?? ''}
                  </h3>
                  <p className="text-xs text-gray-500">Archivo recibido en la postulación; no necesitas volver a cargarlo.</p>
                </div>
                {revisionCv?.identityRevealed && (
                  <a
                    href={`/api/blind-selection/candidates/${candidateId}/resume`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50"
                  >
                    Descargar PDF original
                  </a>
                )}
              </div>

              {cargandoRevisionCv && (
                <p role="status" className="animate-pulse py-6 text-center font-semibold text-blue-950">
                  Procesando el CV recibido…
                </p>
              )}
              {!cargandoRevisionCv && revisionCv && (
                <>
                  {!revisionCv.identityRevealed && (
                    <p className="rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
                      Revisión ciega: se ocultan los datos personales reconocidos. El PDF original permanece oculto hasta revelar la identidad.
                    </p>
                  )}
                  {revisionCv.identityMismatch && (
                    <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                      No se pudo confirmar la identidad del CV. Por privacidad, se ocultó todo el texto; verifica el documento manualmente.
                    </p>
                  )}

                  <section className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <h4 className="font-bold">Revisión preliminar</h4>
                    <p>Las alertas son indicios y requieren revisión humana.</p>
                    {revisionCv.findings.length ? (
                      <ul className="list-inside list-disc space-y-2">
                        {revisionCv.findings.map((finding, index) => (
                          <li key={`${finding.code}-${index}`}>
                            {finding.message}
                            {finding.references?.map((reference) => (
                              <span key={`${reference.applicationCode}-${reference.documentType}`} className="ml-1 block pl-4 text-[11px]">
                                Coincidencia exacta con {reference.applicationCode} · {reference.documentType}
                              </span>
                            ))}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Sin alertas detectadas; esto no confirma la autenticidad del CV.</p>
                    )}
                  </section>

                  <section className="rounded-lg bg-gray-50 p-3 text-xs">
                    <h4 className="font-bold text-gray-800">Fechas del PDF</h4>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div><dt className="font-semibold">Creación</dt><dd>{fechaMetadata(revisionCv.pdfMetadata.creationDate)}</dd></div>
                      <div><dt className="font-semibold">Última modificación</dt><dd>{fechaMetadata(revisionCv.pdfMetadata.modificationDate)}</dd></div>
                    </dl>
                    <p className="mt-2 text-[11px] text-gray-600">Estas fechas pueden cambiarse y no prueban cuándo se emitió el certificado.</p>
                  </section>

                  {revisionCv.text && (
                    <div>
                      <h4 className="mb-2 text-xs font-bold text-gray-700">Texto reconocido</h4>
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-sans text-xs leading-relaxed text-gray-800">
                        {revisionCv.text}
                      </pre>
                    </div>
                  )}
                  {!revisionCv.text && !revisionCv.identityMismatch && (
                    <p className="rounded bg-gray-50 p-3 text-xs text-gray-700">No se reconoció texto legible en el CV.</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                    <button
                      type="button"
                      onClick={marcarCvRevisado}
                      disabled={marcandoCvRevisado || !revisionCv.text || revisionCv.identityMismatch}
                      className="rounded-lg bg-blue-950 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {marcandoCvRevisado ? 'Guardando…' : revisionCv.reviewedAt ? 'CV revisado' : 'Marcar CV como revisado'}
                    </button>
                    {revisionCv.reviewedAt && (
                      <p className="text-xs text-gray-600">
                        Revisado el {fechaValidacion(revisionCv.reviewedAt)}
                        {revisionCv.reviewedByName ? ` por ${revisionCv.reviewedByName}` : ''}
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {canManageDocuments && (
            <form onSubmit={subirYProcesar} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-800">Cargar documento</h3>

              <div>
                <label htmlFor="tipo-vinculo" className="mb-1 block font-semibold text-gray-700">Vincular a</label>
                <select id="tipo-vinculo" value={tipoVinculo} onChange={(event) => {
                  setTipoVinculo(event.target.value);
                  setIdVinculo('');
                }} className="w-full border p-2 rounded-lg">
                  <option value="candidate">Postulante (código anónimo)</option>
                  <option value="worker">Trabajador</option>
                  <option value="request">Solicitud</option>
                </select>
              </div>

              <div>
                <label htmlFor="id-vinculo" className="mb-1 block font-semibold text-gray-700">
                  {tipoVinculo === 'worker' ? 'Trabajador' : tipoVinculo === 'candidate' ? 'Postulante' : 'Solicitud'}
                </label>
                <select id="id-vinculo" required value={idVinculo} onChange={(event) => setIdVinculo(event.target.value)}
                  className="w-full border p-2 rounded-lg" disabled={cargando || opcionesVinculo.length === 0}>
                  <option value="">Selecciona...</option>
                  {opcionesVinculo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {tipoVinculo === 'worker'
                        ? item.full_name ?? item.name
                        : tipoVinculo === 'candidate'
                          ? `${item.application_code} · ${item.position_title} (${item.request_code})`
                          : item.code}
                    </option>
                  ))}
                </select>
                {opcionesVinculo.length === 0 && (
                  <p className="mt-1 text-amber-700">
                    No hay {tipoVinculo === 'worker' ? 'trabajadores' : tipoVinculo === 'candidate' ? 'postulantes' : 'solicitudes'} disponibles para vincular.
                  </p>
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
                Los PDF escaneados pueden tardar más; se procesan hasta 20 páginas.
              </p>
              <p className="text-[10px] leading-relaxed text-amber-800">
                El texto extraído puede contener errores. Revísalo antes de validar.
              </p>
            </form>
            )}

            <section className={`${canManageDocuments ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs`}>
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
                      {documentoActual.status === 'completed'
                        ? `Certificado validado el ${fechaValidacion(documentoActual.validated_at)}`
                        : 'Pendiente de revisión'}
                    </div>
                  </div>
                  {documentoActual.candidate_id && !documentoActual.candidate_identity_revealed && (
                    <p className="rounded border border-blue-200 bg-blue-50 p-3 text-blue-950">
                      Revisión ciega: ocultamos los datos personales reconocidos en el texto. El PDF original aún puede revelarlos.
                    </p>
                  )}
                  {documentoActual.blind_review_identity_mismatch && (
                    <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-950">
                      No se pudo confirmar la identidad del documento. Por privacidad, se ocultó el texto OCR; verifica que esté vinculado al postulante correcto.
                    </p>
                  )}
                  {documentoActual.blind_review_requires_candidate_link && (
                    <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-950">
                      El documento está vinculado a una solicitud. Para revisar el texto en modo ciego, vincúlalo al postulante con su código anónimo.
                    </p>
                  )}
                  {documentoActual.file_sha256 && (
                    <div className="rounded bg-blue-50 p-3">
                      <p className="font-semibold text-blue-950">SHA-256</p>
                      <code className="mt-1 block break-all text-[11px]">{documentoActual.file_sha256}</code>
                    </div>
                  )}
                  <section className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
                    <h4 className="font-bold">Revisión automática preliminar</h4>
                    <p>Las alertas son indicios y requieren revisión humana.</p>
                    {documentoActual.review_findings?.length ? (
                      <ul className="list-inside list-disc space-y-2">
                        {documentoActual.review_findings.map((finding, index) => (
                          <li key={`${finding.code}-${index}`}>
                            <span>{finding.message}</span>
                            {finding.references?.length > 0 && (
                              <ul className="ml-5 mt-1 list-inside list-disc text-[11px]">
                                {finding.references.map((reference) => (
                                  <li key={`${reference.applicationCode}-${reference.documentType}`}>
                                    Coincidencia exacta con {reference.applicationCode} · {reference.documentType}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : documentoActual.file_metadata?.reviewStatus === 'unavailable' ? (
                      <p role="alert">No se pudieron completar las comprobaciones automáticas. Reprocesa el análisis y revisa el documento manualmente.</p>
                    ) : documentoActual.file_metadata?.reviewStatus === 'complete' ? (
                      <p>Sin alertas detectadas; esto no confirma la autenticidad del documento.</p>
                    ) : documentoActual.ocr_status === 'processing' ? (
                      <p>Las alertas estarán disponibles cuando termine el OCR.</p>
                    ) : (
                      <p>Sin análisis de alertas. Reprocesa el documento para generarlo.</p>
                    )}
                  </section>
                  <section className="rounded-lg bg-gray-50 p-3">
                    <h4 className="font-bold text-gray-800">Fechas indicadas en los metadatos del PDF</h4>
                    {documentoActual.file_mime !== 'application/pdf' && (
                      <p className="mt-1">No aplica: el archivo adjunto no es un PDF.</p>
                    )}
                    {documentoActual.file_mime === 'application/pdf'
                      && documentoActual.file_metadata?.metadataStatus === 'unavailable' && (
                      <p role="alert" className="mt-1 text-amber-800">No se pudieron leer los metadatos de este PDF.</p>
                    )}
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold">Creación</dt>
                        <dd>{fechaMetadata(documentoActual.file_metadata?.creationDate)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Última modificación</dt>
                        <dd>{fechaMetadata(documentoActual.file_metadata?.modificationDate)}</dd>
                      </div>
                    </dl>
                    {documentoActual.file_mime === 'application/pdf'
                      && documentoActual.file_metadata?.metadataStatus === 'read'
                      && !documentoActual.file_metadata?.creationDate
                      && !documentoActual.file_metadata?.modificationDate && (
                        <p className="mt-1">El PDF no declara fechas de creación o modificación legibles.</p>
                    )}
                    {documentoActual.file_mime === 'application/pdf'
                      && !documentoActual.file_metadata?.metadataStatus && (
                        <p className="mt-1">Los metadatos aún no se han analizado; reprocesa el documento para consultarlos.</p>
                    )}
                    <p className="mt-2 text-[11px] text-gray-600">
                      Estas fechas pueden cambiarse y no prueban cuándo se emitió el certificado.
                    </p>
                  </section>
                  {documentoActual.ocr_message && (
                    <p role="alert" className="rounded bg-amber-50 p-3 text-amber-900">{documentoActual.ocr_message}</p>
                  )}
                  {documentoActual.ocr_status === 'processing' && (
                    <p className="animate-pulse py-6 text-center font-semibold text-blue-950">Procesando documento...</p>
                  )}
                  {documentoActual.blind_review_requires_candidate_link && documentoActual.ocr_status === 'completed' && (
                    <p className="rounded bg-gray-50 p-3 text-gray-700">
                      El OCR terminó. Vincula el documento a un postulante para revisar el texto en modo ciego.
                    </p>
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
                  {canManageDocuments && <div className="flex flex-wrap gap-3 border-t pt-4">
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
                    {documentoActual.has_file && ['processing', 'completed', 'failed', 'no_text'].includes(documentoActual.ocr_status) && (
                      <button
                        type="button"
                        onClick={reprocesarDocumento}
                        disabled={actualizandoDocumento}
                        className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {documentoActual.ocr_status === 'processing'
                          ? 'Reintentar OCR (si está detenido)'
                          : documentoActual.ocr_status === 'completed'
                          ? 'Reprocesar OCR y actualizar alertas'
                          : 'Reintentar OCR'}
                      </button>
                    )}
                  </div>}
                  {canManageDocuments && documentoActual.ocr_status !== 'completed' && documentoActual.status !== 'completed' && (
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
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3">Documento</th>
                  <th className="pb-3">Vinculado a</th>
                  <th className="pb-3">Estado OCR</th>
                  <th className="pb-3">Validación</th>
                  <th className="pb-3">Alertas</th>
                  <th className="pb-3">SHA-256</th>
                  <th className="pb-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentos.map((document) => (
                  <tr key={document.id}>
                    <td className="py-3">{document.file_name || document.document_type}</td>
                    <td className="py-3">
                      {document.candidate_code
                        ? `Postulante ${document.candidate_code}`
                        : document.worker_name || document.request_code || '—'}
                    </td>
                    <td className="py-3">{estadoOcr[document.ocr_status] || document.ocr_status}</td>
                    <td className="py-3">
                      {document.status === 'completed'
                        ? <>Validado el {fechaValidacion(document.validated_at)}</>
                        : 'Pendiente'}
                    </td>
                    <td className="py-3">
                      {document.ocr_status === 'processing'
                        ? 'Pendiente'
                        : document.review_findings?.length
                          ? `${document.review_findings.length} para revisar`
                          : 'Ninguna detectada'}
                    </td>
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
                  <tr><td colSpan="7" className="py-6 text-center text-gray-500">Aún no hay documentos en la base de datos.</td></tr>
                )}
                {cargando && <tr><td colSpan="7" className="py-6 text-center text-gray-500">Cargando documentos...</td></tr>}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}
