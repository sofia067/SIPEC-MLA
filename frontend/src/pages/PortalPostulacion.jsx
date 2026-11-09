import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

const initialForm = {
  requestId: '',
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  demoConfirmation: false,
};
const tiposDocumentoPostulacion = [
  { type: 'professional_title', label: 'Título profesional' },
  { type: 'experience_certificate', label: 'Certificado de experiencia laboral' },
  { type: 'training_certificate', label: 'Certificado de capacitación' },
  { type: 'other_certificate', label: 'Otro certificado solicitado' },
];
const etapasProceso = [
  { value: 'application_received', label: 'Postulación recibida' },
  { value: 'document_review', label: 'Revisión de documentos' },
  { value: 'exam', label: 'Examen' },
  { value: 'interview', label: 'Entrevista personal' },
  { value: 'practical', label: 'Práctica básica' },
  { value: 'final_result', label: 'Resultado final' },
];

export default function PortalPostulacion() {
  const [openings, setOpenings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [additionalDocuments, setAdditionalDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [applicationCode, setApplicationCode] = useState('');
  const [trackingForm, setTrackingForm] = useState({ applicationCode: '', documentNumber: '' });
  const [progress, setProgress] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const selectedOpening = openings.find((opening) => opening.id === form.requestId);
  const fechaLabel = (date) => date
    ? new Intl.DateTimeFormat('es-PE').format(new Date(date.length === 10 ? `${date}T12:00:00` : date))
    : 'Pendiente de actualización';
  const fechaActualLima = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  };
  const tiempoRestanteLabel = (deadline) => {
    if (!deadline) return '';
    const remainingDays = Math.round(
      (new Date(`${deadline}T00:00:00Z`) - new Date(`${fechaActualLima()}T00:00:00Z`)) / 86400000,
    );
    if (remainingDays === 0) return 'Cierra hoy';
    if (remainingDays === 1) return 'Queda 1 día';
    if (remainingDays === 7) return 'Queda 1 semana';
    if (remainingDays > 7 && remainingDays % 7 === 0) return `Quedan ${remainingDays / 7} semanas`;
    return `Quedan ${remainingDays} días`;
  };
  const fechaHoraLabel = (date) => date
    ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
    : '—';
  const fechaEntrevistaLabel = (date) => date
    ? new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(date))
    : '—';

  useEffect(() => {
    let active = true;
    apiRequest('/public/applications/openings')
      .then(({ openings: availableOpenings }) => {
        if (active) setOpenings(availableOpenings);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'requestId') {
      setAdditionalDocuments({});
      setError('');
    }
  };

  const updateApplicationDocuments = (type, files) => {
    const selectedFiles = Array.from(files ?? []);
    const otherDocumentCount = Object.entries(additionalDocuments)
      .filter(([currentType]) => currentType !== type)
      .reduce((count, [, currentFiles]) => count + currentFiles.length, 0);
    if (otherDocumentCount + selectedFiles.length > 5) {
      setError('Puedes adjuntar hasta 5 certificados o títulos en total.');
      setAdditionalDocuments((current) => ({ ...current, [type]: [] }));
      return false;
    }
    if (selectedFiles.some((file) => file.type !== 'application/pdf'
      || !file.name.toLowerCase().endsWith('.pdf')
      || file.size === 0
      || file.size > 5 * 1024 * 1024)) {
      setError('Cada certificado debe ser un PDF válido de hasta 5 MB.');
      setAdditionalDocuments((current) => ({ ...current, [type]: [] }));
      return false;
    }
    setAdditionalDocuments((current) => ({ ...current, [type]: selectedFiles }));
    setError('');
    return true;
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(key, key === 'demoConfirmation' ? String(value) : value);
      });
      if (resume) body.append('resume', resume);
      Object.entries(additionalDocuments).forEach(([type, files]) => {
        files.forEach((file) => body.append(type, file));
      });
      const { application } = await apiRequest('/public/applications', { method: 'POST', body });
      setApplicationCode(application.applicationCode);
      setTrackingForm({ applicationCode: application.applicationCode, documentNumber: form.documentNumber });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const startAnother = () => {
    setForm(initialForm);
    setResume(null);
    setAdditionalDocuments({});
    setFileInputKey((current) => current + 1);
    setApplicationCode('');
    setTrackingForm({ applicationCode: '', documentNumber: '' });
    setProgress(null);
    setTrackingError('');
    setError('');
  };

  const consultarAvance = async (event) => {
    event.preventDefault();
    setTracking(true);
    setTrackingError('');
    setProgress(null);
    try {
      const { progress: currentProgress } = await apiRequest('/public/applications/track', {
        method: 'POST',
        body: JSON.stringify(trackingForm),
      });
      setProgress(currentProgress);
    } catch (requestError) {
      setTrackingError(requestError.message);
    } finally {
      setTracking(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-blue-900 bg-blue-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="h-12 w-12 rounded-lg bg-white/10 object-contain p-1" />
            <div>
              <p className="font-bold tracking-wide">SIPEC-MLA</p>
              <p className="text-xs text-blue-200">Portal de postulaciones</p>
            </div>
          </div>
          <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            Acceso institucional
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-12">
        <section>
          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
            Demostración académica
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-blue-950 sm:text-4xl">
            Simula tu postulación
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-600">
            Este portal de prueba muestra cómo una persona podría postular a una convocatoria y recibir un código de seguimiento.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">1</span>
              <div>
                <p className="font-semibold text-slate-800">Elige una convocatoria</p>
                <p className="mt-1 text-sm text-slate-500">Se muestran únicamente solicitudes aprobadas con una fecha límite vigente.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">2</span>
              <div>
                <p className="font-semibold text-slate-800">Completa los datos de prueba</p>
                <p className="mt-1 text-sm text-slate-500">Adjunta un PDF ficticio de hasta 5 MB; el sistema estimará coincidencias de términos con los requisitos del puesto.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">3</span>
              <div>
                <p className="font-semibold text-slate-800">Guarda tu código</p>
                <p className="mt-1 text-sm text-slate-500">El registro aparecerá en la selección ciega del sistema interno.</p>
              </div>
            </div>
          </div>
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-blue-950">Consulta el avance de tu postulación</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Ingresa el código recibido y el mismo documento que registraste al postular.</p>
            <form onSubmit={consultarAvance} className="mt-4 space-y-3">
              <div>
                <label htmlFor="tracking-application-code" className="mb-1 block text-xs font-semibold text-slate-700">Código de postulación</label>
                <input
                  id="tracking-application-code"
                  required
                  maxLength={24}
                  value={trackingForm.applicationCode}
                  onChange={(event) => setTrackingForm((current) => ({ ...current, applicationCode: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Ejemplo: PC-00001"
                />
              </div>
              <div>
                <label htmlFor="tracking-document-number" className="mb-1 block text-xs font-semibold text-slate-700">Documento registrado</label>
                <input
                  id="tracking-document-number"
                  required
                  minLength={6}
                  maxLength={24}
                  value={trackingForm.documentNumber}
                  onChange={(event) => setTrackingForm((current) => ({ ...current, documentNumber: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="El documento usado en la postulación"
                />
              </div>
              {trackingError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{trackingError}</p>}
              <button type="submit" disabled={tracking} className="w-full rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-slate-400">
                {tracking ? 'Consultando…' : 'Consultar avance'}
              </button>
            </form>
            {progress && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
                <p className="font-bold">{progress.positionTitle} · {progress.requestCode}</p>
                <p className="mt-2">
                  Etapa actual:{' '}
                  <strong>{etapasProceso.find((etapa) => etapa.value === progress.processStage)?.label ?? progress.processStage}</strong>
                </p>
                <p className="mt-1 text-xs text-blue-800">Última actualización: {fechaHoraLabel(progress.processStageUpdatedAt)}</p>
                <ol className="mt-4 space-y-3 border-l-2 border-blue-200 pl-4">
                  {progress.history.map((item, index) => (
                    <li key={`${item.created_at}-${index}`}>
                      <p className="font-semibold">{etapasProceso.find((etapa) => etapa.value === item.process_stage)?.label ?? item.process_stage}</p>
                      <p className="text-xs text-blue-800">{fechaHoraLabel(item.created_at)}</p>
                      {item.public_message && <p className="mt-1 text-xs">{item.public_message}</p>}
                      {item.interview_at && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-white p-3 text-xs">
                          <p className="font-bold">Citación a entrevista</p>
                          <p className="mt-1">{fechaEntrevistaLabel(item.interview_at)}</p>
                          <p className="mt-1">Modalidad: {item.interview_modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
                          <p className="mt-1 break-words">
                            {item.interview_modality === 'virtual' ? 'Enlace o instrucciones' : 'Lugar'}: {item.interview_location}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {applicationCode ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">✓</div>
              <h2 className="mt-4 text-2xl font-bold text-blue-950">Postulación de prueba recibida</h2>
              <p className="mt-2 text-sm text-slate-600">Guarda este código para identificar el registro en la demostración:</p>
              <p className="mt-4 inline-flex rounded-lg bg-blue-50 px-5 py-3 font-mono text-xl font-bold tracking-wider text-blue-950">{applicationCode}</p>
              <p className="mt-4 text-xs text-slate-500">Este código no representa una postulación oficial.</p>
              <p className="mt-2 text-xs text-slate-500">Para consultar tu avance, usa este código junto con el documento registrado en el panel de seguimiento.</p>
              <button type="button" onClick={startAnother} className="mt-7 rounded-lg bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950">
                Registrar otra prueba
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-blue-950">Formulario de postulación</h2>
              {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

              {loading ? (
                <p className="py-12 text-center text-sm text-slate-500">Cargando convocatorias…</p>
              ) : openings.length === 0 ? (
                <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">No hay convocatorias aprobadas disponibles.</p>
                  <p className="mt-1">Solicita al equipo de prueba que apruebe una convocatoria y registre una fecha límite futura desde el sistema interno.</p>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="opening" className="mb-1.5 block text-sm font-semibold text-slate-700">Convocatoria</label>
                    <select id="opening" name="requestId" value={form.requestId} onChange={updateField} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="">Selecciona un puesto</option>
                      {openings.map((opening) => (
                        <option key={opening.id} value={opening.id}>
                          {opening.position_title} · {opening.department} ({opening.code}) · {tiempoRestanteLabel(opening.application_deadline)}
                        </option>
                      ))}
                    </select>
                    {selectedOpening && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
                        <p className="font-semibold">{selectedOpening.position_title} · {selectedOpening.department}</p>
                        {selectedOpening.description && <p className="mt-2">{selectedOpening.description}</p>}
                        <p className="mt-2 text-xs font-semibold">
                          Periodo de postulación: {fechaLabel(selectedOpening.application_start_date)} al {fechaLabel(selectedOpening.application_deadline)}
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          {tiempoRestanteLabel(selectedOpening.application_deadline)}
                        </p>
                        {selectedOpening.application_deadline_original &&
                          selectedOpening.application_deadline_original !== selectedOpening.application_deadline && (
                            <p className="mt-1 text-xs text-blue-800">
                              Fecha de cierre inicial: {fechaLabel(selectedOpening.application_deadline_original)} · Ampliada hasta: {fechaLabel(selectedOpening.application_deadline)}
                            </p>
                          )}
                        {(selectedOpening.education || selectedOpening.general_experience || selectedOpening.specific_experience || selectedOpening.technical_knowledge) && (
                          <dl className="mt-3 space-y-2 text-xs">
                            {selectedOpening.education && <div><dt className="font-bold">Formación</dt><dd>{selectedOpening.education}</dd></div>}
                            {selectedOpening.general_experience && <div><dt className="font-bold">Experiencia general</dt><dd>{selectedOpening.general_experience}</dd></div>}
                            {selectedOpening.specific_experience && <div><dt className="font-bold">Experiencia específica</dt><dd>{selectedOpening.specific_experience}</dd></div>}
                            {selectedOpening.technical_knowledge && <div><dt className="font-bold">Conocimientos</dt><dd>{selectedOpening.technical_knowledge}</dd></div>}
                          </dl>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">Nombres y apellidos ficticios</label>
                      <input id="fullName" name="fullName" value={form.fullName} onChange={updateField} autoComplete="off" required minLength={3} maxLength={160} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ejemplo: Alex Prueba Demo" />
                    </div>
                    <div>
                      <label htmlFor="documentNumber" className="mb-1.5 block text-sm font-semibold text-slate-700">Documento ficticio</label>
                      <input id="documentNumber" name="documentNumber" value={form.documentNumber} onChange={updateField} autoComplete="off" required minLength={6} maxLength={24} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Solo valor de prueba" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Teléfono ficticio</label>
                      <input id="phone" name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="off" maxLength={40} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Opcional" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Correo ficticio</label>
                      <input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="off" maxLength={254} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="demo@example.test" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="resume" className="mb-1.5 block text-sm font-semibold text-slate-700">Currículum ficticio en PDF</label>
                    <input key={fileInputKey} id="resume" name="resume" type="file" accept="application/pdf,.pdf" required onChange={(event) => setResume(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-slate-300 text-sm file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-semibold file:text-blue-900 hover:file:bg-blue-100" />
                    <p className="mt-1 text-xs text-slate-500">Solo PDF, máximo 5 MB. No adjuntes documentos reales.</p>
                  </div>

                  {selectedOpening?.application_documents?.length > 0 && (
                    <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
                      <legend className="px-1 text-sm font-semibold text-slate-800">Certificados y títulos solicitados</legend>
                      <p className="text-xs leading-relaxed text-slate-600">
                        Adjunta cada documento por separado. Puedes subir hasta 5 PDF en total; máximo 5 MB cada uno.
                      </p>
                      {selectedOpening.application_documents.map(({ type, required }) => {
                        const documentType = tiposDocumentoPostulacion.find((item) => item.type === type);
                        if (!documentType) return null;
                        return (
                          <div key={type}>
                            <label htmlFor={`application-document-${type}`} className="mb-1 block text-sm font-semibold text-slate-700">
                              {documentType.label} {required ? '(obligatorio)' : '(opcional)'}
                            </label>
                            <input
                              key={`${form.requestId}-${fileInputKey}-${type}`}
                              id={`application-document-${type}`}
                              type="file"
                              accept="application/pdf,.pdf"
                              multiple
                              required={required}
                              onChange={(event) => {
                                if (!updateApplicationDocuments(type, event.target.files)) event.target.value = '';
                              }}
                              className="block w-full rounded-lg border border-slate-300 text-sm file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-semibold file:text-blue-900 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              {additionalDocuments[type]?.length
                                ? `${additionalDocuments[type].length} archivo(s) seleccionado(s)`
                                : 'PDF ficticio; no adjuntes documentos reales.'}
                            </p>
                          </div>
                        );
                      })}
                    </fieldset>
                  )}

                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    <input name="demoConfirmation" type="checkbox" checked={form.demoConfirmation} onChange={updateField} required className="mt-1 h-4 w-4 shrink-0 accent-blue-900" />
                    <span>Confirmo que todos los datos y archivos son ficticios y que envío esta información únicamente para una demostración académica.</span>
                  </label>

                  <button type="submit" disabled={sending || loading} className="w-full rounded-lg bg-blue-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950">
                    {sending ? 'Enviando postulación de prueba…' : 'Enviar postulación de prueba'}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-500">
        Prototipo académico SIPEC-MLA · No es un canal oficial de postulación
      </footer>
    </main>
  );
}
