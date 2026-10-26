import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import UserDropdown from '../components/UserDropdown';
import { apiRequest } from '../lib/api';

export default function PerfilPuestoDetalle({ profile: profileProp, onClose } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeProfileId } = useParams();
  const [searchParams] = useSearchParams();
  const profileId = profileProp?.id || routeProfileId || searchParams.get('id');
  const profileFromNavigation = profileProp || location.state?.profile;
  const isModal = Boolean(onClose);
  
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState('requisitos');
  
  // Estado para activar/desactivar el modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosPerfil, setDatosPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const convertirPerfil = (profile) => ({
    id: profile.id,
    puesto: profile.title,
    area: profile.department,
    nivel: profile.level,
    codigo: profile.profile_code || profile.id,
    remuneracion: profile.reference_salary === null ? '' : String(profile.reference_salary ?? ''),
    estado: profile.status === 'active' ? 'Activo' : 'Inactivo',
    mision: profile.description || '',
    reportaA: '',
    supervisaA: '',
    formacion: profile.principal_requirements || '',
    formacionAcademica: profile.academic_formation || '',
    experienciaGeneral: profile.general_experience || '',
    experienciaEspecifica: profile.specific_experience || '',
    conocimientos: profile.technical_knowledge || [],
    funciones: profile.responsibilities || [],
    competencies: profile.competencies || [],
  });

  const editarLista = (key, value) => {
    setDatosPerfil({
      ...datosPerfil,
      [key]: value.split('\n'),
    });
  };

  useEffect(() => {
    let active = true;
    setCargando(true);
    setDatosPerfil(null);
    setError('');

    if (profileFromNavigation && (!profileId || String(profileFromNavigation.id) === String(profileId))) {
      setDatosPerfil(convertirPerfil(profileFromNavigation));
      setCargando(false);
      return () => {
        active = false;
      };
    }

    if (!profileId) {
      setError('No se indicó qué perfil se desea consultar.');
      setCargando(false);
      return () => {
        active = false;
      };
    }

    const cargarPerfil = async () => {
      let profile;
      try {
        ({ profile } = await apiRequest(`/profiles/${encodeURIComponent(profileId)}`));
      } catch (directRequestError) {
        const { profiles } = await apiRequest('/profiles');
        profile = profiles.find((item) => String(item.id) === profileId);
        if (!profile) throw directRequestError;
      }

      if (!profile) throw new Error('No se encontró el perfil solicitado.');
      return profile;
    };

    cargarPerfil()
      .then((profile) => {
        if (active) setDatosPerfil(convertirPerfil(profile));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, [profileFromNavigation, profileId]);

  useEffect(() => {
    if (!isModal) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [isModal, onClose]);

  const guardarPerfil = async () => {
    if (!datosPerfil) return;
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await apiRequest(`/profiles/${datosPerfil.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: datosPerfil.puesto,
          department: datosPerfil.area,
          level: datosPerfil.nivel,
          profileCode: datosPerfil.codigo,
          referenceSalary: datosPerfil.remuneracion === '' ? null : Number(datosPerfil.remuneracion),
          academicFormation: datosPerfil.formacionAcademica,
          generalExperience: datosPerfil.experienciaGeneral,
          specificExperience: datosPerfil.experienciaEspecifica,
          technicalKnowledge: datosPerfil.conocimientos.filter((item) => item.trim()),
          responsibilities: datosPerfil.funciones.filter((item) => item.trim()),
          principalRequirements: datosPerfil.formacion,
          description: datosPerfil.mision,
          status: datosPerfil.estado === 'Activo' ? 'active' : 'inactive',
          competencies: datosPerfil.competencies,
        }),
      });
      setModoEdicion(false);
      setMensaje('Perfil actualizado.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    const loading = <p role="status" className="p-8 text-sm text-gray-600">Cargando perfil…</p>;
    return isModal ? createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-6">
        <section role="dialog" aria-modal="true" aria-label="Ficha del puesto" className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
          {loading}
        </section>
      </div>,
      document.body,
    ) : loading;
  }
  if (!datosPerfil) {
    const errorContent = (
      <main className="p-8 space-y-4">
        <p role="alert" className="text-sm text-red-700">{error || 'No se encontró el perfil solicitado.'}</p>
        {isModal
          ? <button onClick={onClose} className="text-sm text-blue-900 underline">Cerrar</button>
          : <button onClick={() => navigate('/perfil-puesto')} className="text-sm text-blue-900 underline">Volver a perfiles</button>}
      </main>
    );
    return isModal ? createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-6">
        <section role="dialog" aria-modal="true" aria-label="Ficha del puesto" className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
          {errorContent}
        </section>
      </div>,
      document.body,
    ) : errorContent;
  }

  const profileContent = (
        <main className={`${isModal ? 'p-4 sm:p-6' : 'p-8'} space-y-6`}>
          {!isModal && (
            <button
              onClick={() => navigate('/perfil-puesto')}
              className="text-xs font-semibold text-gray-500 hover:text-blue-900 flex items-center gap-1 transition-colors"
            >
              ← Volver a la lista
            </button>
          )}

          {/* Header y botón de Edición */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{datosPerfil.puesto}</h2>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {datosPerfil.estado}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Área: {datosPerfil.area}</p>
            </div>

            {/* Botones para editar */}
            <div className="flex gap-2">
              <button 
                onClick={() => setModoEdicion(!modoEdicion)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  modoEdicion 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {modoEdicion ? '🔓 Modo Edición Activo' : '✏️ Editar Perfil'}
              </button>
              {modoEdicion && (
                <button 
                  onClick={guardarPerfil}
                  disabled={guardando}
                  className="text-xs font-semibold px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  {guardando ? 'Guardando…' : '💾 Guardar'}
                </button>
              )}
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {mensaje && <p role="status" className="text-sm text-emerald-700">{mensaje}</p>}

          {/* Pestañas de Navegación */}
          <div className="border-b border-gray-200 flex gap-8 text-sm">
            <button 
              onClick={() => setActiveTab('general')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'general' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Información general
            </button>
            <button 
              onClick={() => setActiveTab('requisitos')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'requisitos' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Requisitos y competencias
            </button>
            <button 
              onClick={() => setActiveTab('responsabilidades')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'responsabilidades' 
                  ? 'border-b-2 border-blue-900 text-blue-950 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Responsabilidades
            </button>
          </div>

          {/* secciones de navegacion segun activacion */}

          {/* Informacion general */}
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Estructura Organizacional y Datos del Puesto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-600 block">Código del Puesto:</label>
                  {modoEdicion ? (
                    <input value={datosPerfil.codigo} onChange={(event) => setDatosPerfil({ ...datosPerfil, codigo: event.target.value })}
                      className="w-full text-gray-800 mt-1 bg-white p-2 rounded border border-amber-400" />
                  ) : (
                    <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.codigo}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Nivel Organizacional:</label>
                  {modoEdicion ? (
                    <input value={datosPerfil.nivel} onChange={(event) => setDatosPerfil({ ...datosPerfil, nivel: event.target.value })}
                      className="w-full text-gray-800 mt-1 bg-white p-2 rounded border border-amber-400" />
                  ) : (
                    <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.nivel}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Unidad Orgánica:</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.area}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Remuneración Referencial:</label>
                  {modoEdicion ? (
                    <input type="number" min="0" step="0.01" value={datosPerfil.remuneracion}
                      onChange={(event) => setDatosPerfil({ ...datosPerfil, remuneracion: event.target.value })}
                      className="w-full text-gray-800 mt-1 bg-white p-2 rounded border border-amber-400" />
                  ) : (
                    <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">
                      {datosPerfil.remuneracion === '' ? 'No registrada' : `S/ ${Number(datosPerfil.remuneracion).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="font-semibold text-gray-600 block">Dependencia Jerárquica (Reporta a):</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.reportaA || 'No registrado'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block">Personal a Cargo (Supervisa a):</label>
                  <p className="text-gray-800 font-medium mt-1 bg-gray-50 p-2 rounded border">{datosPerfil.supervisaA || 'No registrado'}</p>
                </div>
              </div>

              <div className="text-xs pt-2">
                <label className="font-semibold text-gray-600 block mb-1">Misión del Puesto:</label>
                {modoEdicion ? (
                  <textarea 
                    value={datosPerfil.mision}
                    onChange={(e) => setDatosPerfil({...datosPerfil, mision: e.target.value})}
                    className="w-full border border-amber-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed">
                    {datosPerfil.mision}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Requisitos y Competencias */}
          {activeTab === 'requisitos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna de Requisitos */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Requisitos Mínimos Exigidos</h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                      <span>🎓</span> Formación académica
                    </div>
                    {modoEdicion ? (
                      <textarea rows={3} value={datosPerfil.formacionAcademica}
                        onChange={(event) => setDatosPerfil({ ...datosPerfil, formacionAcademica: event.target.value })}
                        className="w-full mt-1 border border-amber-400 p-2 rounded focus:outline-none text-xs" />
                    ) : (
                      <p className="text-gray-600 mt-1 pl-6">{datosPerfil.formacionAcademica || datosPerfil.formacion || 'No registrada.'}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block">Experiencia general</label>
                    {modoEdicion ? (
                      <textarea rows={2} value={datosPerfil.experienciaGeneral}
                        onChange={(event) => setDatosPerfil({ ...datosPerfil, experienciaGeneral: event.target.value })}
                        className="w-full mt-1 border border-amber-400 p-2 rounded text-xs" />
                    ) : <p className="mt-1 text-gray-600">{datosPerfil.experienciaGeneral || 'No registrada.'}</p>}
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block">Experiencia específica</label>
                    {modoEdicion ? (
                      <textarea rows={2} value={datosPerfil.experienciaEspecifica}
                        onChange={(event) => setDatosPerfil({ ...datosPerfil, experienciaEspecifica: event.target.value })}
                        className="w-full mt-1 border border-amber-400 p-2 rounded text-xs" />
                    ) : <p className="mt-1 text-gray-600">{datosPerfil.experienciaEspecifica || 'No registrada.'}</p>}
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block">Conocimientos técnicos / certificaciones</label>
                    {modoEdicion ? (
                      <textarea rows={5} value={datosPerfil.conocimientos.join('\n')}
                        onChange={(event) => editarLista('conocimientos', event.target.value)}
                        className="w-full mt-1 border border-amber-400 p-2 rounded text-xs"
                        placeholder="Un requisito por línea" />
                    ) : datosPerfil.conocimientos.length ? (
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-600">
                        {datosPerfil.conocimientos.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                      </ul>
                    ) : <p className="mt-1 text-gray-500">No registrados.</p>}
                  </div>
                </div>
              </div>

              {/* Columna de Competencias */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Competencias Requeridas</h3>

                <div className="space-y-3 text-xs">
                  {datosPerfil.competencies.map((competency) => (
                    <div key={competency.id || competency.name} className="py-2 border-b border-gray-100">
                      <p className="text-gray-700 font-medium">🎯 {competency.name}</p>
                      {competency.description && <p className="mt-1 text-gray-500">{competency.description}</p>}
                    </div>
                  ))}
                  {datosPerfil.competencies.length === 0 && (
                    <p className="text-gray-500">No hay competencias registradas para este perfil.</p>
                  )}
                </div>

                {modoEdicion && (
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Nombre de la competencia:');
                      if (name?.trim()) {
                        setDatosPerfil({
                          ...datosPerfil,
                          competencies: [...datosPerfil.competencies, { name: name.trim(), description: '' }],
                        });
                      }
                    }}
                    className="text-xs font-semibold text-blue-900 hover:underline"
                  >
                    Agregar competencia
                  </button>
                )}
                <div className="pt-2 text-[11px] text-gray-500 italic">
                  Las competencias y descripciones se obtienen del registro del perfil.
                </div>
              </div>
            </div>
          )}

          {/* Responsanilidades*/}
          {activeTab === 'responsabilidades' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Funciones principales</h3>
              {modoEdicion ? (
                <textarea rows={10} value={datosPerfil.funciones.join('\n')}
                  onChange={(event) => editarLista('funciones', event.target.value)}
                  className="w-full border border-amber-400 p-2 rounded text-xs"
                  placeholder="Una función por línea" />
              ) : datosPerfil.funciones.length ? (
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
                  {datosPerfil.funciones.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ol>
              ) : (
                <p className="text-gray-500 text-sm">No hay funciones registradas para este perfil.</p>
              )}
            </div>
          )}

        </main>
  );

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`Ficha del puesto ${datosPerfil.puesto}`}
          className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-gray-100 text-gray-800 shadow-2xl"
        >
          <header className="flex items-center justify-between border-b bg-white px-5 py-3 sm:px-7">
            <h1 className="text-lg font-bold text-blue-950">Ficha completa del puesto</h1>
            <button
              type="button"
              aria-label="Cerrar ficha"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-lg leading-none text-gray-600 hover:bg-gray-100"
            >
              ×
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto">{profileContent}</div>
        </section>
      </div>,
      document.body,
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-950">SIPEC-MLA</h1>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600">🔔</button>
            <UserDropdown />
          </div>
        </header>
        {profileContent}
      </div>
    </div>
  );
}