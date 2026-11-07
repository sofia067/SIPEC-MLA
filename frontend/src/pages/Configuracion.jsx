import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../services/api';

const configuracionInicial = {
  anonymizationEnabled: true,
  ocrConfidenceThreshold: 85,
  institutionalData: {
    rof: '',
    logoUrl: '/AquijesLogo.jpg',
    acronym: 'SIPEC-MLA',
    address: '',
    fiscalYear: new Date().getFullYear(),
  },
  catalogData: {
    roadTypes: ['Avenida', 'Calle', 'Jirón', 'Pasaje'],
    laborRegimes: ['CAS'],
    contractTypes: ['CAS', 'Plazo fijo', 'Plazo indeterminado', 'Suplencia'],
    organizationalAreas: [],
  },
};

const usuarioNuevo = {
  username: '',
  displayName: '',
  role: 'hr_specialist',
  areaName: '',
  password: '',
  isActive: true,
};

const perfiles = [
  { role: 'Administrador', permissions: 'Administración de usuarios y sistema, auditoría y operaciones' },
  { role: 'Especialista RR.HH. / Evaluador', permissions: 'Solicitudes, trabajadores, documentos, evaluaciones e informes' },
  { role: 'Jefe de Área', permissions: 'Lectura de trabajadores y perfiles; solicitudes e informes de su área' },
  { role: 'Evaluador / Comité', permissions: 'Lectura de perfiles, preselección ciega, evaluación y lectura documental' },
];

const catalogos = [
  { key: 'roadTypes', label: 'Tipos de vías' },
  { key: 'laborRegimes', label: 'Regímenes laborales' },
  { key: 'contractTypes', label: 'Tipos de contratos' },
  { key: 'organizationalAreas', label: 'Áreas orgánicas' },
];

function mezclarConfiguracion(settings) {
  return {
    ...configuracionInicial,
    ...settings,
    institutionalData: { ...configuracionInicial.institutionalData, ...settings.institutionalData },
    catalogData: { ...configuracionInicial.catalogData, ...settings.catalogData },
  };
}

export default function Configuracion() {
  const [configuracion, setConfiguracion] = useState(configuracionInicial);
  const [configuracionGuardada, setConfiguracionGuardada] = useState(configuracionInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formularioUsuario, setFormularioUsuario] = useState(usuarioNuevo);
  const [errorUsuarios, setErrorUsuarios] = useState('');
  const [mensajeUsuarios, setMensajeUsuarios] = useState('');
  const hayCambios = JSON.stringify(configuracion) !== JSON.stringify(configuracionGuardada);

  useEffect(() => {
    apiRequest('/settings')
      .then(({ settings }) => {
        const values = mezclarConfiguracion(settings);
        setConfiguracion(values);
        setConfiguracionGuardada(values);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    apiRequest('/settings/users')
      .then(({ users }) => setUsuarios(users))
      .catch((requestError) => setErrorUsuarios(requestError.message))
      .finally(() => setCargandoUsuarios(false));
  }, []);

  const actualizarCampo = (campo, valor) => {
    setConfiguracion((actual) => ({ ...actual, [campo]: valor }));
    setMensaje('');
    setError('');
  };

  const actualizarInstitucional = (campo, valor) => {
    setConfiguracion((actual) => ({
      ...actual,
      institutionalData: { ...actual.institutionalData, [campo]: valor },
    }));
    setMensaje('');
    setError('');
  };

  const actualizarCatalogo = (campo, valor) => {
    const items = valor.split('\n').map((item) => item.trim()).filter(Boolean);
    setConfiguracion((actual) => ({
      ...actual,
      catalogData: { ...actual.catalogData, [campo]: items },
    }));
    setMensaje('');
    setError('');
  };

  const guardarConfiguracion = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const { settings } = await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          anonymizationEnabled: configuracion.anonymizationEnabled,
          ocrConfidenceThreshold: Number(configuracion.ocrConfidenceThreshold),
          institutionalData: {
            ...configuracion.institutionalData,
            fiscalYear: Number(configuracion.institutionalData.fiscalYear),
          },
          catalogData: configuracion.catalogData,
        }),
      });
      const values = mezclarConfiguracion(settings);
      setConfiguracion(values);
      setConfiguracionGuardada(values);
      setMensaje('Configuración actualizada correctamente.');
    } catch (requestError) {
      setError(`No se pudo guardar la configuración: ${requestError.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const restablecerConfiguracion = () => {
    setConfiguracion(configuracionGuardada);
    setMensaje('');
    setError('');
  };

  const cambiarUsuario = (campo, valor) => {
    setFormularioUsuario((actual) => ({
      ...actual,
      [campo]: valor,
      ...(campo === 'role' && valor === 'area_manager' && !actual.areaName
        ? { areaName: 'Subgerencia de Logística y Control Patrimonial' }
        : {}),
    }));
    setErrorUsuarios('');
    setMensajeUsuarios('');
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setFormularioUsuario({
      username: usuario.username,
      displayName: usuario.display_name,
      role: usuario.role,
      areaName: usuario.area_name || (
        usuario.role === 'area_manager' ? 'Subgerencia de Logística y Control Patrimonial' : ''
      ),
      password: '',
      isActive: usuario.is_active,
    });
    setErrorUsuarios('');
    setMensajeUsuarios('');
  };

  const cancelarEdicionUsuario = () => {
    setUsuarioEditando(null);
    setFormularioUsuario(usuarioNuevo);
    setErrorUsuarios('');
    setMensajeUsuarios('');
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    setGuardandoUsuario(true);
    setErrorUsuarios('');
    setMensajeUsuarios('');
    try {
      const esEdicion = Boolean(usuarioEditando);
      const payload = {
        displayName: formularioUsuario.displayName,
        role: formularioUsuario.role,
        areaName: formularioUsuario.areaName,
        password: formularioUsuario.password,
        isActive: formularioUsuario.isActive,
      };
      const response = await apiRequest(
        esEdicion ? `/settings/users/${usuarioEditando.id}` : '/settings/users',
        {
          method: esEdicion ? 'PATCH' : 'POST',
          body: JSON.stringify(esEdicion
            ? payload
            : { ...payload, username: formularioUsuario.username }),
        },
      );
      if (esEdicion) {
        setUsuarios((actuales) => actuales.map((item) => item.id === response.user.id ? response.user : item));
      } else {
        setUsuarios((actuales) => [...actuales, response.user].sort((a, b) => a.display_name.localeCompare(b.display_name, 'es')));
      }
      cancelarEdicionUsuario();
      setMensajeUsuarios(esEdicion ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    } catch (requestError) {
      setErrorUsuarios(`No se pudo guardar el usuario: ${requestError.message}`);
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const deshabilitado = cargando || guardando;

  return (
    <div className="app-shell flex h-dvh flex-col bg-gray-100 font-sans text-gray-800 md:flex-row">
      <Sidebar />
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-4 py-3 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
            <span className="hidden sm:inline text-xs bg-gray-200 text-gray-800 font-medium px-2.5 py-0.5 rounded-full">Configuración</span>
          </div>
          <UserDropdown />
        </header>

        <main className="p-4 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Configuración del sistema</h2>
            <p className="mt-1 text-sm text-gray-600">Parámetros institucionales, accesos y catálogos de la Municipalidad Distrital de Los Aquijes.</p>
          </div>

          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

          <form onSubmit={guardarConfiguracion} className="space-y-6">
            <section className="max-w-4xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold text-gray-900">Parámetros institucionales</h3>
              <p className="mt-1 text-sm text-gray-600">Datos oficiales que identifican a la entidad en el sistema.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-800">
                  ROF
                  <input value={configuracion.institutionalData.rof} onChange={(event) => actualizarInstitucional('rof', event.target.value)} maxLength="120" disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium text-gray-800">
                  Siglas
                  <input required value={configuracion.institutionalData.acronym} onChange={(event) => actualizarInstitucional('acronym', event.target.value)} maxLength="40" disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium text-gray-800 sm:col-span-2">
                  Dirección
                  <input value={configuracion.institutionalData.address} onChange={(event) => actualizarInstitucional('address', event.target.value)} maxLength="240" disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium text-gray-800">
                  Ruta o URL del logo
                  <input value={configuracion.institutionalData.logoUrl} onChange={(event) => actualizarInstitucional('logoUrl', event.target.value)} maxLength="500" disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium text-gray-800">
                  Periodo fiscal activo
                  <input type="number" min="2000" max="2200" required value={configuracion.institutionalData.fiscalYear} onChange={(event) => actualizarInstitucional('fiscalYear', event.target.value)} disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                </label>
              </div>
            </section>

            <section className="max-w-4xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold text-gray-900">Motor OCR y gestión documental</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    <span className="font-medium text-gray-800">Anonimización automática</span>
                    <span className="mt-1 block text-gray-600">Ocultar datos sensibles durante la preselección.</span>
                  </span>
                  <input type="checkbox" checked={configuracion.anonymizationEnabled} onChange={(event) => actualizarCampo('anonymizationEnabled', event.target.checked)} disabled={deshabilitado} className="h-4 w-4 shrink-0 accent-blue-950" />
                </label>
                <label className="text-sm font-medium text-gray-800">
                  Umbral mínimo de confianza OCR (%)
                  <input type="number" min="0" max="100" required value={configuracion.ocrConfidenceThreshold} onChange={(event) => actualizarCampo('ocrConfidenceThreshold', event.target.value === '' ? '' : Number(event.target.value))} disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" />
                  <span className="mt-1 block font-normal text-gray-600">Porcentaje mínimo para aceptar una lectura automática.</span>
                </label>
              </div>
            </section>

            <section className="max-w-4xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold text-gray-900">Perfiles y permisos</h3>
              <p className="mt-1 text-sm text-gray-600">Privilegios aplicados por el backend para cada perfil.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="pb-2 pr-4">Perfil</th><th className="pb-2">Privilegios vigentes</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {perfiles.map((perfil) => (
                      <tr key={perfil.role}><th scope="row" className="py-3 pr-4 font-semibold text-gray-800">{perfil.role}</th><td className="py-3 text-gray-600">{perfil.permissions}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500">Los perfiles se administran en función de las reglas de acceso del sistema.</p>
            </section>

            <section className="max-w-4xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold text-gray-900">Catálogos del sistema</h3>
              <p className="mt-1 text-sm text-gray-600">Una opción por línea. Los cambios se guardan como parámetros del sistema.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {catalogos.map(({ key, label }) => (
                  <label key={key} className="text-sm font-medium text-gray-800">
                    {label}
                    <textarea rows="4" value={configuracion.catalogData[key].join('\n')} onChange={(event) => actualizarCatalogo(key, event.target.value)} disabled={deshabilitado} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 font-normal" />
                  </label>
                ))}
              </div>
            </section>

            <div className="flex max-w-4xl flex-wrap items-center gap-3">
              <button type="submit" disabled={deshabilitado || !hayCambios} className="rounded-lg bg-blue-950 px-4 py-2.5 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400">
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={restablecerConfiguracion} disabled={deshabilitado || !hayCambios} className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400">Restablecer</button>
              {cargando && <span role="status" className="text-sm text-gray-500">Cargando configuración…</span>}
              {mensaje && <p role="status" className="text-sm text-green-800">{mensaje}</p>}
            </div>
          </form>

          <section aria-labelledby="usuarios-titulo" className="max-w-4xl space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h3 id="usuarios-titulo" className="font-semibold text-gray-900">Usuarios y accesos</h3>
              <p className="mt-1 text-sm text-gray-600">Crea y actualiza cuentas de RR.HH. y jefes de área, incluyendo asignación o cambio de contraseña.</p>
            </div>

            {errorUsuarios && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorUsuarios}</div>}
            {mensajeUsuarios && <p role="status" className="text-sm text-green-800">{mensajeUsuarios}</p>}

            <form onSubmit={guardarUsuario} className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
              <h4 className="font-semibold text-gray-800 sm:col-span-2">{usuarioEditando ? `Editar usuario: ${usuarioEditando.username}` : 'Crear usuario'}</h4>
              {!usuarioEditando && (
                <label className="text-sm font-medium text-gray-800">
                  Usuario
                  <input required autoComplete="off" value={formularioUsuario.username} onChange={(event) => cambiarUsuario('username', event.target.value)} maxLength="80" disabled={guardandoUsuario} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 font-normal" />
                </label>
              )}
              <label className="text-sm font-medium text-gray-800">
                Nombre completo
                <input required value={formularioUsuario.displayName} onChange={(event) => cambiarUsuario('displayName', event.target.value)} maxLength="160" disabled={guardandoUsuario} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 font-normal" />
              </label>
              <label className="text-sm font-medium text-gray-800">
                Rol
                <select required value={formularioUsuario.role} onChange={(event) => cambiarUsuario('role', event.target.value)} disabled={guardandoUsuario} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5">
                  <option value="hr_specialist">RR.HH. / Evaluador</option>
                  <option value="area_manager">Jefe de Área</option>
                  <option value="committee">Evaluador / Comité</option>
                  {usuarioEditando?.role === 'admin' && <option value="admin">Administrador</option>}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-800">
                Área orgánica
                <input value={formularioUsuario.areaName} onChange={(event) => cambiarUsuario('areaName', event.target.value)} maxLength="160" disabled={guardandoUsuario} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 font-normal" />
              </label>
              <label className="text-sm font-medium text-gray-800">
                {usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                <input required={!usuarioEditando} type="password" autoComplete="new-password" minLength="12" maxLength="256" value={formularioUsuario.password} onChange={(event) => cambiarUsuario('password', event.target.value)} disabled={guardandoUsuario} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 font-normal" />
                <span className="mt-1 block font-normal text-gray-500">Mínimo 12 caracteres.</span>
              </label>
              {usuarioEditando && (
                <label className="flex items-center gap-2 self-center text-sm font-medium text-gray-800">
                  <input type="checkbox" checked={formularioUsuario.isActive} onChange={(event) => cambiarUsuario('isActive', event.target.checked)} disabled={guardandoUsuario || usuarioEditando.username === 'admin'} className="h-4 w-4 accent-blue-950" />
                  Cuenta activa
                </label>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="submit" disabled={guardandoUsuario} className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400">
                  {guardandoUsuario ? 'Guardando…' : usuarioEditando ? 'Guardar usuario' : 'Crear usuario'}
                </button>
                {usuarioEditando && <button type="button" onClick={cancelarEdicionUsuario} disabled={guardandoUsuario} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white">Cancelar</button>}
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr className="border-b text-gray-500"><th className="pb-2 pr-4">Usuario</th><th className="pb-2 pr-4">Nombre</th><th className="pb-2 pr-4">Rol / área</th><th className="pb-2 pr-4">Estado</th><th className="pb-2">Acción</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{usuario.username}</td>
                      <td className="py-3 pr-4">{usuario.display_name}</td>
                      <td className="py-3 pr-4">{({ admin: 'Administrador', hr_specialist: 'RR.HH. / Evaluador', area_manager: 'Jefe de Área', committee: 'Evaluador / Comité' })[usuario.role] || usuario.role}<span className="block text-xs text-gray-500">{usuario.area_name || 'Sin área asignada'}</span></td>
                      <td className="py-3 pr-4">{usuario.is_active ? 'Activo' : 'Inactivo'}</td>
                      <td className="py-3"><button type="button" onClick={() => editarUsuario(usuario)} disabled={guardandoUsuario || usuario.username === 'admin'} className="font-semibold text-blue-900 hover:underline disabled:text-gray-400">Editar</button></td>
                    </tr>
                  ))}
                  {!cargandoUsuarios && usuarios.length === 0 && <tr><td colSpan="5" className="py-6 text-center text-gray-500">No hay usuarios registrados.</td></tr>}
                  {cargandoUsuarios && <tr><td colSpan="5" className="py-6 text-center text-gray-500">Cargando usuarios…</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
