import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '../auth/CandidateAuthContext';

export default function LoginPostulante() {
  const [applicationCode, setApplicationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, loading, login } = useCandidateAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/postulante/examen-tecnico', { replace: true });
    }
  }, [user, loading, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Inicia sesión con las credenciales enviadas por RR.HH.
      await login(applicationCode, password);
      navigate('/postulante/examen-tecnico', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Credenciales inválidas. Por favor verifique sus datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="candidate-auth-page flex min-h-dvh justify-center bg-slate-100 p-4 items-center">
      <section className="my-6 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-blue-950 px-6 py-7 text-center text-white">
          <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="mx-auto h-16 w-16 rounded-xl bg-white/10 object-contain p-2" />
          <h1 className="mt-3 text-2xl font-bold">SIPEC-MLA</h1>
          <p className="mt-1 text-sm text-blue-200">Evaluación Técnica del Postulante</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Ingresa con tus credenciales</h2>
          <p className="mt-1 text-sm text-slate-500">
            Utiliza el código de postulación y la contraseña provisional que te envió RR. HH.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="candidate-code" className="mb-1 block text-sm font-semibold text-slate-700">
                Código de postulación
              </label>
              <input
                id="candidate-code"
                name="applicationCode"
                type="text"
                autoComplete="username"
                required 
                maxLength={24}
                value={applicationCode}
                onChange={(e) => { setApplicationCode(e.target.value); setError(''); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                placeholder="Código de postulación"
              />
            </div>

            <div>
              <label htmlFor="candidate-password" className="mb-1 block text-sm font-semibold text-slate-700">
                Contraseña provisional
              </label>
              <input 
                id="candidate-password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                maxLength={128} 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" 
                placeholder="••••••••" 
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={submitting || loading}
              className="w-full rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:bg-slate-400"
            >
              {loading ? 'Verificando sesión…' : submitting ? 'Verificando acceso…' : 'Ingresar al examen'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 border-t pt-4">
            ¿Eres parte del personal interno? <Link to="/login" className="font-semibold text-blue-800 hover:underline">Acceso institucional</Link>
          </p>
        </div>
      </section>
    </main>
  );
}