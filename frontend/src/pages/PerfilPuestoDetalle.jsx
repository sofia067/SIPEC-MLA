import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const splitLines = (value) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const formatMoney = (value) => value == null
  ? 'No especificada'
  : `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

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
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest('/profiles')
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
  }, [id]);

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

  const competencies = (profile?.competencies || []).map(({ name }) => name);
  const functions = profile?.functions || [];
  const technicalKnowledge = splitLines(profile?.technical_knowledge || '');

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
          <UserDropdown />
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-6 p-8">
          <button onClick={() => navigate('/perfil-puesto')} className="text-sm font-semibold text-blue-900 hover:underline">
            ← Volver a perfiles
          </button>
          {error && <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loading && <p className="rounded-lg bg-white p-6 text-sm text-gray-500">Cargando ficha...</p>}
          {!loading && profile && form && (
            <form onSubmit={saveProfile} className="space-y-6">
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      {editing ? (
                        <input aria-label="Nombre del puesto" required value={form.title} onChange={(event) => updateField('title', event.target.value)} className="rounded border p-2 text-xl font-bold" />
                      ) : (
                        <h2 className="text-2xl font-bold">{profile.title}</h2>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{profile.department}</p>
                  </div>
                  <div className="flex gap-2">
                    {editing ? (
                      <>
                        <button type="button" onClick={() => { setForm(toForm(profile)); setEditing(false); }} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                        <button type="submit" disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">Editar ficha</button>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-5 border-b pb-3 text-lg font-bold">Información del puesto</h3>
                {editing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Código del perfil" value={form.profileCode} onChange={(event) => updateField('profileCode', event.target.value)} />
                    <Field label="Unidad orgánica" value={form.department} onChange={(event) => updateField('department', event.target.value)} />
                    <Field label="Nivel / Grupo" value={form.level} onChange={(event) => updateField('level', event.target.value)} />
                    <Field label="Remuneración referencial (S/)" type="number" step="0.01" value={form.remuneration} onChange={(event) => updateField('remuneration', event.target.value)} />
                    <div className="md:col-span-2"><Field label="Descripción / misión del puesto" rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} /></div>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    <ReadField label="Código" value={profile.profile_code} />
                    <ReadField label="Unidad orgánica" value={profile.department} />
                    <ReadField label="Nivel / Grupo" value={profile.level} />
                    <ReadField label="Remuneración referencial" value={profile.remuneration == null ? '' : formatMoney(profile.remuneration)} />
                    <div className="md:col-span-2"><ReadField label="Descripción / misión del puesto" value={profile.description} /></div>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-5 border-b pb-3 text-lg font-bold">Formación y experiencia</h3>
                {editing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Formación académica" rows={3} value={form.education} onChange={(event) => updateField('education', event.target.value)} />
                    <Field label="Experiencia general" rows={3} value={form.generalExperience} onChange={(event) => updateField('generalExperience', event.target.value)} />
                    <Field label="Experiencia específica" rows={3} value={form.specificExperience} onChange={(event) => updateField('specificExperience', event.target.value)} />
                    <Field label="Otros requisitos" rows={3} value={form.principalRequirements} onChange={(event) => updateField('principalRequirements', event.target.value)} />
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    <ReadField label="Formación académica" value={profile.education} />
                    <ReadField label="Experiencia general" value={profile.general_experience} />
                    <ReadField label="Experiencia específica" value={profile.specific_experience} />
                    <ReadField label="Otros requisitos" value={profile.principal_requirements} />
                  </div>
                )}
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 border-b pb-3 text-lg font-bold">Conocimientos técnicos y certificaciones</h3>
                  {editing ? (
                    <Field label="Conocimientos técnicos y certificaciones" rows={7} value={form.technicalKnowledge} onChange={(event) => updateField('technicalKnowledge', event.target.value)} />
                  ) : technicalKnowledge.length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">{technicalKnowledge.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                  ) : <p className="text-sm text-gray-500">No especificados.</p>}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 border-b pb-3 text-lg font-bold">Competencias</h3>
                  {editing ? (
                    <Field label="Competencias" rows={7} value={form.competencies} onChange={(event) => updateField('competencies', event.target.value)} />
                  ) : competencies.length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">{competencies.map((name) => <li key={name}>{name}</li>)}</ul>
                  ) : <p className="text-sm text-gray-500">No especificadas.</p>}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-b pb-3 text-lg font-bold">Funciones principales</h3>
                {editing ? (
                  <Field label="Funciones principales" rows={8} value={form.functions} onChange={(event) => updateField('functions', event.target.value)} />
                ) : functions.length ? (
                  <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-700">{functions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
                ) : <p className="text-sm text-gray-500">No se registraron funciones.</p>}
              </section>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
