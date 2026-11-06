import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const splitLines = (value) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const formatMoney = (value) => value == null
  ? 'No especificada'
  : `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const tabs = [
  { id: 'general', label: 'Información general' },
  { id: 'requisitos', label: 'Requisitos y competencias' },
  { id: 'responsabilidades', label: 'Responsabilidades' },
];

function toForm(profile) {
  return {
    title: profile.title || '',
    department: profile.department || '',
    level: profile.level || '',
    profileCode: profile.profile_code || '',
    remuneration: profile.remuneration ?? '',
    education: profile.education || '',
    generalExperience: profile.general_experience || '',
    specificExperience: profile.specific_experience || '',
    technicalKnowledge: profile.technical_knowledge || '',
    principalRequirements: profile.principal_requirements || '',
    description: profile.description || '',
    competencies: (profile.competencies || []).map(({ name }) => name).join('\n'),
    functions: (profile.functions || []).join('\n'),
  };
}

function Field({ label, value, onChange, rows = 1, type = 'text', step }) {
  const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm';
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {rows > 1 ? (
        <textarea className={inputClass} rows={rows} value={value} onChange={onChange} />
      ) : (
        <input className={inputClass} type={type} step={step} value={value} onChange={onChange} />
      )}
    </label>
  );
}

function ReadField({ label, value, empty = 'No especificada' }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-800">{value || empty}</p>
    </div>
  );
}

export default function PerfilPuestoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const puedeEditar = ['admin', 'hr_specialist'].includes(user?.role);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [tabActiva, setTabActiva] = useState('general');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiRequest('/profiles', { timeoutMs: 15000 })
      .then(({ profiles }) => {
        const currentProfile = profiles.find((item) => item.id === id);
        if (!currentProfile) throw new Error('No se encontró el perfil solicitado.');
        if (cancelled) return;
        setProfile(currentProfile);
        setForm(toForm(currentProfile));
        setError('');
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, intentoCarga]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const oldCompetencies = new Map((profile.competencies || []).map((competency) => [competency.name, competency.description]));
      await apiRequest(`/profiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          level: form.level,
          profileCode: form.profileCode,
          remuneration: form.remuneration,
          education: form.education,
          generalExperience: form.generalExperience,
          specificExperience: form.specificExperience,
          technicalKnowledge: form.technicalKnowledge,
          principalRequirements: form.principalRequirements,
          description: form.description,
          status: profile.status,
          competencies: splitLines(form.competencies).map((name) => ({
            name,
            description: oldCompetencies.get(name) || '',
          })),
          functions: splitLines(form.functions),
        }),
      });
      const { profiles } = await apiRequest('/profiles');
      const updatedProfile = profiles.find((item) => item.id === id);
      setProfile(updatedProfile);
      setForm(toForm(updatedProfile));
      setEditing(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const competencies = profile?.competencies || [];
  const functions = profile?.functions || [];
  const requisitos = [
    { label: 'Formación académica', value: profile?.education },
    { label: 'Experiencia general', value: profile?.general_experience },
    { label: 'Experiencia específica', value: profile?.specific_experience },
    { label: 'Conocimientos técnicos', value: profile?.technical_knowledge },
    { label: 'Otros requisitos', value: profile?.principal_requirements },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 sm:inline">Perfil del puesto</span>
          </div>
          <UserDropdown />
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => navigate('/perfil-puesto')} className="text-sm font-semibold text-blue-900 hover:underline">
              ← Volver a perfiles
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">04. Perfil del puesto</span>
          </div>
          {error && (
            <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => setIntentoCarga((intento) => intento + 1)} className="mt-2 font-semibold underline">
                Reintentar
              </button>
            </div>
          )}
          {loading && <p className="rounded-lg bg-white p-6 text-sm text-gray-500">Cargando ficha...</p>}
          {!loading && profile && form && (
            <form onSubmit={saveProfile} className="space-y-5">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {editing ? (
                        <input aria-label="Nombre del puesto" required value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full max-w-xl rounded-lg border border-gray-300 p-2 text-xl font-bold" />
                      ) : (
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{profile.title}</h2>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${profile.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {editing ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Área / unidad orgánica" value={form.department} onChange={(event) => updateField('department', event.target.value)} />
                        <Field label="Código del perfil" value={form.profileCode} onChange={(event) => updateField('profileCode', event.target.value)} />
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">{profile.department}{profile.profile_code ? ` · ${profile.profile_code}` : ''}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {editing && puedeEditar ? (
                      <>
                        <button type="button" onClick={() => { setForm(toForm(profile)); setEditing(false); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                      </>
                    ) : puedeEditar ? (
                      <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Editar perfil</button>
                    ) : null}
                  </div>
                </div>
              </section>

              <nav role="tablist" aria-label="Secciones del perfil" className="flex gap-1 overflow-x-auto border-b border-gray-200">
                {tabs.map(({ id: tabId, label }) => (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === tabId}
                    onClick={() => setTabActiva(tabId)}
                    className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      tabActiva === tabId
                        ? 'border-blue-900 text-blue-950'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {tabActiva === 'general' && (
                <section className="grid items-start gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-base font-bold text-gray-900">Requisitos mínimos</h3>
                    <p className="mt-1 text-xs text-gray-500">Condiciones necesarias para desempeñar el puesto.</p>
                    {editing ? (
                      <div className="mt-5 space-y-4">
                        <Field label="Formación académica" rows={2} value={form.education} onChange={(event) => updateField('education', event.target.value)} />
                        <Field label="Experiencia general" rows={2} value={form.generalExperience} onChange={(event) => updateField('generalExperience', event.target.value)} />
                        <Field label="Experiencia específica" rows={2} value={form.specificExperience} onChange={(event) => updateField('specificExperience', event.target.value)} />
                        <Field label="Conocimientos técnicos" rows={3} value={form.technicalKnowledge} onChange={(event) => updateField('technicalKnowledge', event.target.value)} />
                        <Field label="Otros requisitos" rows={2} value={form.principalRequirements} onChange={(event) => updateField('principalRequirements', event.target.value)} />
                      </div>
                    ) : (
                      <div className="mt-4 divide-y divide-gray-100">
                        {requisitos.map(({ label, value }) => (
                          <div key={label} className="flex gap-3 py-3 first:pt-1 last:pb-1">
                            <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-900">✓</span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
                              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">{value || 'No especificado.'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-base font-bold text-gray-900">Competencias requeridas</h3>
                    <p className="mt-1 text-xs text-gray-500">Habilidades y capacidades asociadas al puesto.</p>
                    {editing ? (
                      <div className="mt-5 space-y-4">
                        <Field label="Competencias (una por línea)" rows={7} value={form.competencies} onChange={(event) => updateField('competencies', event.target.value)} />
                        <Field label="Nivel / grupo" value={form.level} onChange={(event) => updateField('level', event.target.value)} />
                        <Field label="Remuneración referencial (S/)" type="number" step="0.01" value={form.remuneration} onChange={(event) => updateField('remuneration', event.target.value)} />
                      </div>
                    ) : competencies.length ? (
                      <ul className="mt-4 divide-y divide-gray-100">
                        {competencies.map(({ id: competencyId, name, description }) => (
                          <li key={competencyId || name} className="flex items-start justify-between gap-3 py-3 first:pt-1 last:pb-1">
                            <div className="flex min-w-0 gap-3">
                              <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">✓</span>
                              <div>
                                <span className="text-sm font-medium text-gray-800">{name}</span>
                                {description && <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">Requerida</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No se registraron competencias para este puesto.</p>}
                    {!editing && (
                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-900">
                        Nivel / grupo del puesto: <span className="font-semibold">{profile.level || 'No especificado'}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {tabActiva === 'requisitos' && (
                <section className="grid items-start gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-base font-bold text-gray-900">Datos del perfil</h3>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {editing ? (
                        <>
                          <Field label="Código del perfil" value={form.profileCode} onChange={(event) => updateField('profileCode', event.target.value)} />
                          <Field label="Nivel / grupo" value={form.level} onChange={(event) => updateField('level', event.target.value)} />
                          <div className="sm:col-span-2"><Field label="Remuneración referencial (S/)" type="number" step="0.01" value={form.remuneration} onChange={(event) => updateField('remuneration', event.target.value)} /></div>
                        </>
                      ) : (
                        <>
                          <ReadField label="Código" value={profile.profile_code} />
                          <ReadField label="Nivel / grupo" value={profile.level} />
                          <ReadField label="Remuneración referencial" value={profile.remuneration == null ? '' : formatMoney(profile.remuneration)} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-base font-bold text-gray-900">Descripción del puesto</h3>
                    <div className="mt-4">
                      {editing
                        ? <Field label="Misión / descripción" rows={6} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                        : <ReadField label="Misión / descripción" value={profile.description} />}
                    </div>
                  </div>
                </section>
              )}

              {tabActiva === 'responsabilidades' && (
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-base font-bold text-gray-900">Responsabilidades</h3>
                  <p className="mt-1 text-xs text-gray-500">Funciones principales asignadas al puesto.</p>
                  {editing ? (
                    <div className="mt-5">
                      <Field label="Funciones principales (una por línea)" rows={10} value={form.functions} onChange={(event) => updateField('functions', event.target.value)} />
                    </div>
                  ) : functions.length ? (
                    <ol className="mt-5 space-y-3">
                      {functions.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">{index + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No se registraron responsabilidades para este puesto.</p>}
                </section>
              )}
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
