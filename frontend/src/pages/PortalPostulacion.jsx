import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const initialForm = {
  requestId: '',
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  demoConfirmation: false,
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'No se pudo completar la solicitud.');
  }

  return result;
}

export default function PortalPostulacion() {
  const [openings, setOpenings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [applicationCode, setApplicationCode] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const selectedOpening = openings.find((opening) => opening.id === form.requestId);

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
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      const { application } = await apiRequest('/public/applications', {
        method: 'POST',
        body,
      });
      setApplicationCode(application.applicationCode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const startAnother = () => {
    setForm(initialForm);
    setResume(null);
    setFileInputKey((current) => current + 1);
    setApplicationCode('');
    setError('');
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
                <p className="mt-1 text-sm text-slate-500">Se muestran únicamente solicitudes aprobadas para la demostración.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">2</span>
              <div>
                <p className="font-semibold text-slate-800">Completa los datos de prueba</p>
                <p className="mt-1 text-sm text-slate-500">Adjunta un PDF ficticio de hasta 5 MB. No envíes documentos reales.</p>
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
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {applicationCode ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">✓</div>
              <h2 className="mt-4 text-2xl font-bold text-blue-950">Postulación de prueba recibida</h2>
              <p className="mt-2 text-sm text-slate-600">Guarda este código para identificar el registro en la demostración:</p>
              <p className="mt-4 inline-flex rounded-lg bg-blue-50 px-5 py-3 font-mono text-xl font-bold tracking-wider text-blue-950">{applicationCode}</p>
              <p className="mt-4 text-xs text-slate-500">Este código no representa una postulación oficial.</p>
              <button type="button" onClick={startAnother} className="mt-7 rounded-lg bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900">
                Registrar otra prueba
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-blue-950">Formulario de postulación</h2>
              <p className="mt-1 text-sm text-slate-500">Los campos marcados con * son obligatorios.</p>
              {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

              {loading ? (
                <p className="py-12 text-center text-sm text-slate-500">Cargando convocatorias…</p>
              ) : openings.length === 0 ? (
                <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">No hay convocatorias aprobadas disponibles.</p>
                  <p className="mt-1">Vuelve a intentarlo más tarde o consulta al equipo responsable.</p>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="opening" className="mb-1.5 block text-sm font-semibold text-slate-700">Convocatoria *</label>
                    <select id="opening" name="requestId" value={form.requestId} onChange={updateField} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
                      <option value="">Selecciona un puesto</option>
                      {openings.map((opening) => (
                        <option key={opening.id} value={opening.id}>{opening.position_title} · {opening.department} ({opening.code})</option>
                      ))}
                    </select>
                    {selectedOpening && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
                        <p className="font-semibold">{selectedOpening.position_title} · {selectedOpening.department}</p>
                        {selectedOpening.description && <p className="mt-2">{selectedOpening.description}</p>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">Nombres y apellidos ficticios *</label>
                      <input id="fullName" name="fullName" value={form.fullName} onChange={updateField} autoComplete="off" required minLength={3} maxLength={160} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Ejemplo: Alex Prueba Demo" />
                    </div>
                    <div>
                      <label htmlFor="documentNumber" className="mb-1.5 block text-sm font-semibold text-slate-700">Documento ficticio *</label>
                      <input id="documentNumber" name="documentNumber" value={form.documentNumber} onChange={updateField} autoComplete="off" required minLength={6} maxLength={24} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Solo valor de prueba" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Teléfono ficticio</label>
                      <input id="phone" name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="off" maxLength={40} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Opcional" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Correo ficticio</label>
                      <input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="off" maxLength={254} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="demo@example.test" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="resume" className="mb-1.5 block text-sm font-semibold text-slate-700">Currículum ficticio en PDF *</label>
                    <input key={fileInputKey} id="resume" name="resume" type="file" accept="application/pdf,.pdf" required onChange={(event) => setResume(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-slate-300 text-sm" />
                    <p className="mt-1 text-xs text-slate-500">Solo PDF, máximo 5 MB. No adjuntes documentos reales.</p>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    <input name="demoConfirmation" type="checkbox" checked={form.demoConfirmation} onChange={updateField} required className="mt-1 h-4 w-4 shrink-0 accent-blue-900" />
                    <span>Confirmo que todos los datos y el archivo son ficticios y que envío esta información únicamente para una demostración académica.</span>
                  </label>

                  <button type="submit" disabled={sending || loading} className="w-full rounded-lg bg-blue-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400">
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
