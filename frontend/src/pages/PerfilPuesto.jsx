import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const emptyProfile = {
  title: '',
  department: '',
  level: '',
  profileCode: '',
  remuneration: '',
  education: '',
  generalExperience: '',
  specificExperience: '',
  technicalKnowledge: '',
  principalRequirements: '',
  description: '',
  competencies: '',
  functions: '',
};

const toLines = (value) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

function ProfileField({ label, value, onChange, rows = 1, required = false, type = 'text', step }) {
  const className = 'mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900';
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}{required && ' *'}
      {rows > 1 ? (
        <textarea className={className} rows={rows} value={value} onChange={onChange} required={required} />
      ) : (
        <input className={className} type={type} step={step} value={value} onChange={onChange} required={required} />
      )}
    </label>
  );
}

export default function PerfilPuesto() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyProfile);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState('');
  const [error, setError] = useState('');

  async function loadProfiles() {
    setLoading(true);
    try {
      const { profiles: loadedProfiles } = await apiRequest('/profiles');
      setProfiles(loadedProfiles);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/profiles', {
        method: 'POST',
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
          competencies: toLines(form.competencies).map((name) => ({ name, description: '' })),
          functions: toLines(form.functions),
        }),
      });
      await loadProfiles();
      setForm(emptyProfile);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivateProfile(profile) {
    if (!window.confirm(`¿Desactivar el perfil «${profile.title}»? Se conservará en la base de datos.`)) return;
    setDeactivating(profile.id);
    setError('');
    try {
      await apiRequest(`/profiles/${profile.id}`, { method: 'DELETE' });
      await loadProfiles();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeactivating('');
    }
  }

  const areas = [...new Set(profiles.map((profile) => profile.department))];
  const filteredProfiles = profiles.filter((profile) => {
    const areaMatches = areaFilter === 'Todas' || profile.department === areaFilter;
    const query = search.toLocaleLowerCase();
    const textMatches = [
      profile.title,
      profile.profile_code,
      profile.department,
      profile.principal_requirements,
      profile.education,
      profile.technical_knowledge,
    ].some((value) => (value || '').toLocaleLowerCase().includes(query));
    return areaMatches && textMatches;
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">Perfiles de Puesto</span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-8 space-y-6">
          {error && <div role="alert" className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Perfiles de Puesto</h2>
              <p className="text-sm text-gray-500">Gestión de requisitos, competencias y funciones por unidad orgánica</p>
            </div>
            <button onClick={() => { setError(''); setShowForm(true); }} className="bg-blue-950 hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-lg">
              + Nuevo perfil
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
            <input
              type="search"
              placeholder="Buscar por puesto, código o requisitos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:w-2/3 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="w-full md:w-1/3 border border-gray-300 rounded-lg p-2 text-sm">
              <option value="Todas">Todas las unidades orgánicas</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 font-semibold text-xs uppercase">
                  <th className="py-3 px-4">Código / Puesto</th>
                  <th className="py-3 px-4">Unidad orgánica</th>
                  <th className="py-3 px-4">Nivel</th>
                  <th className="py-3 px-4">Remuneración</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{profile.title}</div>
                      <div className="text-xs text-gray-500">{profile.profile_code || 'Sin código'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{profile.department}</td>
                    <td className="py-3 px-4">{profile.level}</td>
                    <td className="py-3 px-4">{profile.remuneration == null ? '—' : `S/ ${Number(profile.remuneration).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium px-2 py-1 rounded-full text-xs ${profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/perfil-puesto/detalle/${profile.id}`)} className="text-blue-900 hover:underline font-semibold">Ver ficha</button>
                        {profile.status === 'active' && (
                          <button
                            onClick={() => deactivateProfile(profile)}
                            disabled={deactivating === profile.id}
                            className="text-red-700 hover:underline disabled:text-gray-400"
                          >
                            {deactivating === profile.id ? 'Desactivando...' : 'Desactivar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredProfiles.length === 0 && <tr><td colSpan="6" className="py-6 text-center text-gray-500">{error ? 'No se pudieron cargar los perfiles.' : 'No hay perfiles registrados.'}</td></tr>}
                {loading && <tr><td colSpan="6" className="py-6 text-center text-gray-500">Cargando perfiles...</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="profile-form-title" className="mx-auto my-8 w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between border-b pb-3">
              <h3 id="profile-form-title" className="text-lg font-bold">Registrar ficha de puesto</h3>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar" className="text-xl text-gray-500">×</button>
            </div>
            <form onSubmit={saveProfile} className="space-y-5">
              <section className="grid gap-4 md:grid-cols-2">
                <ProfileField label="Nombre del puesto" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <ProfileField label="Código del perfil" value={form.profileCode} onChange={(event) => setForm({ ...form, profileCode: event.target.value })} />
                <ProfileField label="Unidad orgánica" required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                <ProfileField label="Nivel / Grupo" required value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} />
                <ProfileField label="Remuneración referencial (S/)" type="number" step="0.01" value={form.remuneration} onChange={(event) => setForm({ ...form, remuneration: event.target.value })} />
                <ProfileField label="Formación académica" rows={2} value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} />
                <ProfileField label="Experiencia general" rows={2} value={form.generalExperience} onChange={(event) => setForm({ ...form, generalExperience: event.target.value })} />
                <ProfileField label="Experiencia específica" rows={2} value={form.specificExperience} onChange={(event) => setForm({ ...form, specificExperience: event.target.value })} />
              </section>
              <ProfileField label="Conocimientos técnicos / certificaciones (uno por línea)" rows={4} value={form.technicalKnowledge} onChange={(event) => setForm({ ...form, technicalKnowledge: event.target.value })} />
              <ProfileField label="Competencias (una por línea)" rows={3} value={form.competencies} onChange={(event) => setForm({ ...form, competencies: event.target.value })} />
              <ProfileField label="Funciones principales (una por línea)" rows={5} value={form.functions} onChange={(event) => setForm({ ...form, functions: event.target.value })} />
              <ProfileField label="Otros requisitos principales" rows={3} value={form.principalRequirements} onChange={(event) => setForm({ ...form, principalRequirements: event.target.value })} />
              <ProfileField label="Descripción / misión del puesto" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400">
                  {saving ? 'Guardando...' : 'Guardar ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
