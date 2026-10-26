import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

const emptyUserForm = {
  username: '',
  displayName: '',
  role: 'area_manager',
  areaName: '',
  password: '',
  isActive: true,
};

const defaultSettings = {
  organizationName: 'Municipalidad Distrital de Los Aquijes',
  fiscalYear: 2026,
  supportEmail: '',
  maxUploadMb: 10,
  passingScore: 70,
  declarationDeadlineDays: 5,
};

const roleNames = {
  admin: 'Administrador',
  hr_specialist: 'Especialista de RR. HH.',
  area_manager: 'Jefe de Área',
};

const tabs = [
  ['usuarios', 'Usuarios y roles'],
  ['entidad', 'Entidad y evaluación'],
  ['areas', 'Áreas orgánicas'],
  ['auditoria', 'Auditoría'],
];

export default function Configuracion() {
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadTabData = async (selectedTab = tab) => {
    setLoading(true);
    setError('');
    try {
      if (selectedTab === 'usuarios') {
        const [{ users }, { departments }] = await Promise.all([
          apiRequest('/settings/users'),
          apiRequest('/settings/departments'),
        ]);
        setUsuarios(users);
        setDepartamentos(departments);
      } else if (selectedTab === 'entidad') {
        const { settings: systemSettings } = await apiRequest('/settings/system');
        setSettings(systemSettings);
      } else if (selectedTab === 'areas') {
        const { departments } = await apiRequest('/settings/departments');
        setDepartamentos(departments);
      } else if (selectedTab === 'auditoria') {
        const { events: auditEvents } = await apiRequest('/audit');
        setEventos(auditEvents);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData('usuarios');
  }, []);

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setMessage('');
    loadTabData(nextTab);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingUserId) {
        const { username, ...update } = userForm;
        await apiRequest(`/settings/users/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        });
        setMessage('Usuario actualizado.');
      } else {
        const { isActive, ...create } = userForm;
        await apiRequest('/settings/users', {
          method: 'POST',
          body: JSON.stringify(create),
        });
        setMessage('Usuario creado.');
      }
      setUserForm(emptyUserForm);
      setEditingUserId('');
      await loadTabData('usuarios');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      areaName: user.area_name || '',
      password: '',
      isActive: user.is_active,
    });
    setMessage('');
  };

  const toggleUserStatus = async (user) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/settings/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: user.display_name,
          role: user.role,
          areaName: user.area_name || '',
          password: '',
          isActive: !user.is_active,
        }),
      });
      setMessage(user.is_active ? 'Usuario desactivado.' : 'Usuario activado.');
      await loadTabData('usuarios');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { settings: savedSettings } = await apiRequest('/settings/system', {
        method: 'PATCH',
        body: JSON.stringify({
          ...settings,
          fiscalYear: Number(settings.fiscalYear),
          maxUploadMb: Number(settings.maxUploadMb),
          passingScore: Number(settings.passingScore),
          declarationDeadlineDays: Number(settings.declarationDeadlineDays),
        }),
      });
      setSettings(savedSettings);
      setMessage('Configuración institucional guardada.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveArea = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(
        editingAreaId ? `/settings/departments/${editingAreaId}` : '/settings/departments',
        {
          method: editingAreaId ? 'PATCH' : 'POST',
          body: JSON.stringify({ name: areaName }),
        },
      );
      setAreaName('');
      setEditingAreaId('');
      setMessage(editingAreaId ? 'Área actualizada.' : 'Área agregada.');
      await loadTabData('areas');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteArea = async (department) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/settings/departments/${department.id}`, { method: 'DELETE' });
      setMessage('Área eliminada.');
      await loadTabData('areas');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-sm';

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between gap-4 border-b bg-white px-4 py-3 sm:px-8">
          <div>
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <p className="text-xs text-gray-500">Configuración del sistema</p>
          </div>
          <UserDropdown />
        </header>

        <main className="space-y-6 p-4 sm:p-8">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
            <p className="mt-1 text-sm text-gray-600">Administra accesos, parámetros institucionales, áreas y auditoría.</p>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

          <nav className="flex flex-wrap gap-2" aria-label="Secciones de configuración">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => changeTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  tab === id ? 'bg-blue-950 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-gray-500">Cargando configuración…</p> : null}

          {!loading && tab === 'usuarios' && (
            <div className="space-y-6">
              <form onSubmit={saveUser} className="grid gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
                <h3 className="font-semibold text-gray-900 md:col-span-2">{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h3>
                <input
                  required minLength="3" maxLength="80" placeholder="Nombre de usuario"
                  value={userForm.username} disabled={Boolean(editingUserId)}
                  onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
                  className={`${inputClass} disabled:bg-gray-100`}
                />
                <input
                  required placeholder="Nombre para mostrar" value={userForm.displayName}
                  onChange={(event) => setUserForm({ ...userForm, displayName: event.target.value })}
                  className={inputClass}
                />
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })} className={inputClass}>
                  <option value="area_manager">Jefe de Área</option>
                  <option value="hr_specialist">Especialista de RR. HH.</option>
                  <option value="admin">Administrador</option>
                </select>
                <select value={userForm.areaName} onChange={(event) => setUserForm({ ...userForm, areaName: event.target.value })} className={inputClass}>
                  <option value="">Sin área asignada</option>
                  {departamentos.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                </select>
                <input
                  required={!editingUserId} minLength="12" maxLength="256" type="password"
                  placeholder={editingUserId ? 'Nueva contraseña (opcional, mínimo 12 caracteres)' : 'Contraseña (mínimo 12 caracteres)'}
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  className={inputClass}
                />
                {editingUserId && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm({ ...userForm, isActive: event.target.checked })} />
                    Cuenta activa
                  </label>
                )}
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 font-semibold text-white disabled:bg-gray-400">
                    {saving ? 'Guardando…' : editingUserId ? 'Guardar cambios' : 'Crear usuario'}
                  </button>
                  {editingUserId && (
                    <button type="button" onClick={() => { setEditingUserId(''); setUserForm(emptyUserForm); }} className="rounded-lg border px-4 py-2 text-sm">
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>

              <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Usuarios registrados</h3>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead><tr className="border-b text-gray-500">
                    <th className="pb-3">Usuario</th><th className="pb-3">Nombre</th><th className="pb-3">Rol</th>
                    <th className="pb-3">Área</th><th className="pb-3">Estado</th><th className="pb-3">Acciones</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {usuarios.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3">{user.username}</td>
                        <td className="py-3">{user.display_name}</td>
                        <td className="py-3">{roleNames[user.role]}</td>
                        <td className="py-3">{user.area_name || '—'}</td>
                        <td className="py-3">{user.is_active ? 'Activo' : 'Inactivo'}</td>
                        <td className="space-x-3 py-3">
                          <button
                            type="button"
                            disabled={user.username === 'admin'}
                            onClick={() => editUser(user)}
                            className="text-xs font-semibold text-blue-900 hover:underline disabled:text-gray-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button" disabled={saving || user.username === 'admin'} onClick={() => toggleUserStatus(user)}
                            className="text-xs font-semibold text-blue-900 hover:underline disabled:text-gray-400"
                          >
                            {user.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!usuarios.length && <tr><td colSpan="6" className="py-6 text-center text-gray-500">No hay usuarios.</td></tr>}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {!loading && tab === 'entidad' && (
            <form onSubmit={saveSettings} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900">Entidad y parámetros del proceso</h3>
                <p className="mt-1 text-xs text-gray-500">Estos límites y valores se validan también en el servidor.</p>
              </div>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Nombre oficial de la entidad
                <input required maxLength="200" value={settings.organizationName} onChange={(event) => setSettings({ ...settings, organizationName: event.target.value })} className={inputClass} />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Año fiscal
                <input required type="number" min="2000" max="2100" value={settings.fiscalYear} onChange={(event) => setSettings({ ...settings, fiscalYear: event.target.value })} className={inputClass} />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Correo institucional de soporte
                <input type="email" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} className={inputClass} />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Límite de subida de archivos (MB)
                <input required type="number" min="1" max="50" value={settings.maxUploadMb} onChange={(event) => setSettings({ ...settings, maxUploadMb: event.target.value })} className={inputClass} />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Puntaje mínimo aprobatorio (%)
                <input required type="number" min="0" max="100" value={settings.passingScore} onChange={(event) => setSettings({ ...settings, passingScore: event.target.value })} className={inputClass} />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                Plazo para presentar declaraciones juradas (días)
                <input required type="number" min="1" max="90" value={settings.declarationDeadlineDays} onChange={(event) => setSettings({ ...settings, declarationDeadlineDays: event.target.value })} className={inputClass} />
              </label>
              <div className="md:col-span-2">
                <button disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 font-semibold text-white disabled:bg-gray-400">
                  {saving ? 'Guardando…' : 'Guardar configuración'}
                </button>
              </div>
            </form>
          )}

          {!loading && tab === 'areas' && (
            <div className="space-y-5">
              <form onSubmit={saveArea} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row">
                <label className="flex-1 space-y-1 text-sm font-medium text-gray-700">
                  {editingAreaId ? 'Editar nombre del área' : 'Agregar área o unidad orgánica'}
                  <input required maxLength="160" value={areaName} onChange={(event) => setAreaName(event.target.value)} className={inputClass} />
                </label>
                <div className="flex items-end gap-2">
                  <button disabled={saving} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400">
                    {editingAreaId ? 'Guardar' : 'Agregar'}
                  </button>
                  {editingAreaId && <button type="button" onClick={() => { setEditingAreaId(''); setAreaName(''); }} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>}
                </div>
              </form>
              <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Catálogo de áreas</h3>
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="pb-3">Área</th><th className="pb-3">Perfiles</th><th className="pb-3">Trabajadores</th><th className="pb-3">Solicitudes</th><th className="pb-3">Acciones</th></tr></thead>
                  <tbody className="divide-y">
                    {departamentos.map((department) => (
                      <tr key={department.id}>
                        <td className="py-3">{department.name}</td>
                        <td className="py-3">{department.profile_count ?? 0}</td>
                        <td className="py-3">{department.worker_count ?? 0}</td>
                        <td className="py-3">{department.request_count ?? 0}</td>
                        <td className="space-x-3 py-3">
                          <button type="button" onClick={() => { setEditingAreaId(department.id); setAreaName(department.name); }} className="text-xs font-semibold text-blue-900 hover:underline">Editar</button>
                          <button type="button" disabled={saving} onClick={() => deleteArea(department)} className="text-xs font-semibold text-red-700 hover:underline disabled:text-gray-400">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {!departamentos.length && <tr><td colSpan="5" className="py-6 text-center text-gray-500">No hay áreas registradas.</td></tr>}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-gray-500">Las áreas vinculadas a perfiles, trabajadores o solicitudes no se pueden eliminar.</p>
              </section>
            </div>
          )}

          {!loading && tab === 'auditoria' && (
            <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Registro de auditoría</h3>
                <p className="mt-1 text-xs text-gray-500">Últimos {eventos.length} eventos registrados por el sistema.</p>
              </div>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b text-gray-500"><th className="pb-3">Fecha</th><th className="pb-3">Usuario</th><th className="pb-3">Evento</th><th className="pb-3">Recurso</th><th className="pb-3">Detalle</th></tr></thead>
                <tbody className="divide-y">
                  {eventos.map((event) => (
                    <tr key={event.id}>
                      <td className="py-3">{new Date(event.created_at).toLocaleString('es-PE')}</td>
                      <td className="py-3">{event.display_name || event.username || 'Sistema'}</td>
                      <td className="py-3">{event.event_type}</td>
                      <td className="py-3">{event.resource_type}{event.resource_id ? ` · ${event.resource_id}` : ''}</td>
                      <td className="max-w-sm py-3 text-xs text-gray-600">{JSON.stringify(event.metadata || {})}</td>
                    </tr>
                  ))}
                  {!eventos.length && <tr><td colSpan="5" className="py-6 text-center text-gray-500">No hay eventos de auditoría registrados.</td></tr>}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
