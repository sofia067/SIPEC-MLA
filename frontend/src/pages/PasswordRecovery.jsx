import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function PasswordRecovery() {
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitRequest = async (event) => {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setError('');
    try {
      const result = await apiRequest('/auth/password-reset-requests', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });
      setMessage(result.message);
      setUsername('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-100 p-4">
      <section className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold text-blue-800">SIPEC-MLA</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Solicitar recuperación</h1>
        <p className="mt-4 text-sm leading-6 text-gray-700">
          Envía una solicitud al administrador. Por seguridad, esta opción no cambia tu contraseña.
          El administrador verificará tu identidad y se comunicará contigo.
        </p>
        <form onSubmit={submitRequest} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-800">
            Usuario
            <input
              required
              autoComplete="username"
              maxLength={80}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={sending}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="text-sm text-green-800">{message}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-gray-400"
          >
            {sending ? 'Enviando…' : 'Enviar solicitud al administrador'}
          </button>
        </form>
        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-blue-800 hover:underline">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
