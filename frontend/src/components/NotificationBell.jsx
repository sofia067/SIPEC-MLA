import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export default function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const [pendientes, setPendientes] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const esComite = user?.role === 'committee';
    const endpoint = esComite ? '/blind-selection/candidates' : '/requests';
    apiRequest(endpoint)
      .then((result) => {
        const total = esComite
          ? result.candidates.filter((candidate) => (
            candidate.objective_score === 100 && candidate.written_review_status === 'pending'
          )).length
          : result.requests.filter((request) => ['pending', 'in_review'].includes(request.status)).length;
        setPendientes(total);
      })
      .catch((requestError) => setError(requestError.message));
  }, [user?.role]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={pendientes === null ? 'Notificaciones' : `Notificaciones, ${pendientes} pendientes`}
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="relative rounded-lg bg-amber-50 p-2 text-amber-500 transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
        {pendientes > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {pendientes > 99 ? '99+' : pendientes}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <h2 className="font-semibold text-gray-900">Notificaciones</h2>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-red-700">No se pudieron cargar las notificaciones: {error}</p>
          ) : pendientes === null ? (
            <p role="status" className="mt-2 text-sm text-gray-500">Cargando notificaciones…</p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              {pendientes
                ? user?.role === 'committee'
                  ? `Tienes ${pendientes} evaluaciones pendientes de revisar.`
                  : `Tienes ${pendientes} solicitudes pendientes o en revisión.`
                : user?.role === 'committee'
                  ? 'No tienes evaluaciones pendientes.'
                  : 'No tienes solicitudes pendientes.'}
            </p>
          )}
          <Link
            to={user?.role === 'committee' ? '/evaluacion' : '/solicitudes-cobertura'}
            onClick={() => setAbierto(false)}
            className="mt-3 inline-block text-sm font-semibold text-blue-900 hover:underline"
          >
            Ver solicitudes
          </Link>
        </div>
      )}
    </div>
  );
}
